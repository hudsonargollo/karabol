import { redis } from '../config/redis.js';
import { resolveConsecutiveLimit } from '@karaokebo/shared';

/**
 * 3.3 Dynamic Density-Based Queue Algorithm.
 *
 * State lives in Redis (per PRD 4: Redis is the Pub/Sub + fast-mutation
 * backbone; Postgres holds the durable QueueEntry rows). Per venue:
 *   - `pending:{tableId}`   list  — queueEntryIds waiting for that table, in request order
 *   - `tablesWithPending`   set   — tableIds that currently have >=1 pending entry
 *   - `rotation`            list  — round-robin order of tables waiting for their next turn
 *   - `active`              hash  — { tableId, sungInBlock } for the table currently singing
 */
export class QueueEngine {
  constructor(private readonly venueId: string) {}

  private get k() {
    return {
      pending: (tableId: string) => `venue:${this.venueId}:pending:${tableId}`,
      tablesWithPending: `venue:${this.venueId}:tablesWithPending`,
      rotation: `venue:${this.venueId}:rotation`,
      active: `venue:${this.venueId}:active`,
    };
  }

  /** Called when a patron adds a song to a table's queue. */
  async enqueue(tableId: string, queueEntryId: string): Promise<void> {
    await redis.rpush(this.k.pending(tableId), queueEntryId);
    const added = await redis.sadd(this.k.tablesWithPending, tableId);

    const active = await redis.hgetall(this.k.active);
    const rotationHasTable = active.tableId === tableId || (await this.isInRotation(tableId));

    // New table joining the density pool — queue it for its turn unless it's already active.
    if (added === 1 && active.tableId !== tableId && !rotationHasTable) {
      await redis.rpush(this.k.rotation, tableId);
    }
  }

  private async isInRotation(tableId: string): Promise<boolean> {
    const rotation = await redis.lrange(this.k.rotation, 0, -1);
    return rotation.includes(tableId);
  }

  private async activeTableCount(): Promise<number> {
    return redis.scard(this.k.tablesWithPending);
  }

  private async currentLimit(): Promise<number> {
    return resolveConsecutiveLimit(await this.activeTableCount());
  }

  /** Activates the next table in rotation if no table is currently singing. */
  private async ensureActive(): Promise<{ tableId: string; sungInBlock: number } | null> {
    const active = await redis.hgetall(this.k.active);
    if (active.tableId) {
      return { tableId: active.tableId, sungInBlock: Number(active.sungInBlock ?? 0) };
    }
    const nextTableId = await redis.lpop(this.k.rotation);
    if (!nextTableId) return null;
    await redis.hset(this.k.active, { tableId: nextTableId, sungInBlock: 0 });
    return { tableId: nextTableId, sungInBlock: 0 };
  }

  /** Rotates away from the currently active table, re-queuing it if it still has pending songs. */
  private async rotateAway(tableId: string): Promise<void> {
    await redis.del(this.k.active);
    const remaining = await redis.llen(this.k.pending(tableId));
    if (remaining > 0) {
      await redis.rpush(this.k.rotation, tableId); // remaining songs saved for their next turn
    } else {
      await redis.srem(this.k.tablesWithPending, tableId);
    }
  }

  /**
   * Pops the next queueEntryId to play, or null if the venue queue is empty.
   * Call `onSongCompleted` after playback finishes to advance the block counter.
   */
  async dequeueNext(): Promise<{ tableId: string; queueEntryId: string } | null> {
    for (let attempts = 0; attempts < 8; attempts++) {
      const active = await this.ensureActive();
      if (!active) return null;

      const limit = await this.currentLimit();
      if (active.sungInBlock >= limit) {
        await this.rotateAway(active.tableId);
        continue;
      }

      const queueEntryId = await redis.lpop(this.k.pending(active.tableId));
      if (!queueEntryId) {
        await this.rotateAway(active.tableId);
        continue;
      }

      return { tableId: active.tableId, queueEntryId };
    }
    return null;
  }

  /** Called when the currently playing song finishes (naturally or via venue skip). */
  async onSongCompleted(tableId: string): Promise<void> {
    const active = await redis.hgetall(this.k.active);
    if (active.tableId !== tableId) return;

    const sungInBlock = Number(active.sungInBlock ?? 0) + 1;
    const limit = await this.currentLimit();
    const stillHasPending = (await redis.llen(this.k.pending(tableId))) > 0;

    if (sungInBlock >= limit || !stillHasPending) {
      await this.rotateAway(tableId);
    } else {
      await redis.hset(this.k.active, { tableId, sungInBlock });
    }
  }
}
