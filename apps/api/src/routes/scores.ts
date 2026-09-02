import { Router } from 'express';
import { z } from 'zod';
import { SocketEvent } from '@karaokebo/shared';
import { prisma } from '../config/db.js';
import { redis, RedisKeys } from '../config/redis.js';
import { requireAuth, requireInternalService } from '../middleware/auth.js';
import { getIo, venueRoom } from '../sockets/io.js';
import { issueRewardForScore } from '../services/rewardEngine.js';

export const scoresRouter = Router();

const liveScoreSchema = z.object({
  queueEntryId: z.string(),
  venueId: z.string(),
  value: z.number().min(0).max(100),
});

// 3.4 DSP Vocal Scoring Engine — the Python DSP microservice pushes live
// (in-progress) score ticks here, which are cached in Redis and fanned out
// over the venue's WebSocket room. This is intentionally not persisted per
// tick — only the final score (below) is written to Postgres.
scoresRouter.post('/live', requireInternalService, async (req, res) => {
  const parsed = liveScoreSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });
  const { queueEntryId, venueId, value } = parsed.data;

  await redis.set(RedisKeys.liveScore(queueEntryId), value, 'EX', 30);
  getIo().to(venueRoom(venueId)).emit(SocketEvent.SCORE_UPDATE, { queueEntryId, value });

  return res.status(202).end();
});

const finalScoreSchema = z.object({
  queueEntryId: z.string(),
  value: z.number().min(0).max(100),
  pitchAccuracy: z.number().min(0).max(1).optional(),
  streakBonus: z.number().optional(),
});

// Called once by the DSP service when a performance ends — persists the
// score, resolves the reward tier (3.5), and issues a redeemable QR code.
scoresRouter.post('/final', requireInternalService, async (req, res) => {
  const parsed = finalScoreSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });
  const { queueEntryId, value, pitchAccuracy, streakBonus } = parsed.data;

  const queueEntry = await prisma.queueEntry.findUniqueOrThrow({ where: { id: queueEntryId } });
  const score = await prisma.score.create({
    data: {
      queueEntryId,
      userId: queueEntry.requestedById,
      value,
      pitchAccuracy,
      streakBonus,
    },
  });

  const reward = await issueRewardForScore(score.id);

  getIo().to(venueRoom(queueEntry.venueId)).emit(SocketEvent.SCORE_FINAL, { queueEntryId, value, reward });
  if (reward) {
    getIo().to(venueRoom(queueEntry.venueId)).emit(SocketEvent.REWARD_ISSUED, { userId: queueEntry.requestedById, ...reward });
  }

  return res.status(201).json({ score, reward });
});

scoresRouter.get('/live/:queueEntryId', requireAuth, async (req, res) => {
  const value = await redis.get(RedisKeys.liveScore(req.params.queueEntryId));
  return res.json({ value: value ? Number(value) : null });
});
