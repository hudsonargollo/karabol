import { Router } from 'express';
import { z } from 'zod';
import { SocketEvent } from '@karaokebo/shared';
import { prisma } from '../config/db.js';
import { requireAuth, requireRole } from '../middleware/auth.js';
import { QueueEngine } from '../services/queueEngine.js';
import { getIo, venueRoom } from '../sockets/io.js';

export const queueRouter = Router();

const requestSchema = z.object({
  venueId: z.string(),
  tableId: z.string(),
  youtubeVideoId: z.string(),
  title: z.string(),
});

// 3.1 YouTube Integration — patron queues a track for their table.
queueRouter.post('/', requireAuth, async (req, res) => {
  const parsed = requestSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });
  const { venueId, tableId, youtubeVideoId, title } = parsed.data;

  const position = await prisma.queueEntry.count({ where: { venueId, status: 'PENDING' } });
  const entry = await prisma.queueEntry.create({
    data: {
      venueId,
      tableId,
      requestedById: req.auth!.userId,
      youtubeVideoId,
      title,
      position,
    },
  });

  await new QueueEngine(venueId).enqueue(tableId, entry.id);
  getIo().to(venueRoom(venueId)).emit(SocketEvent.QUEUE_STATE, { added: entry });

  return res.status(201).json(entry);
});

queueRouter.get('/:venueId', requireAuth, async (req, res) => {
  const entries = await prisma.queueEntry.findMany({
    where: { venueId: req.params.venueId, status: { in: ['PENDING', 'PLAYING'] } },
    orderBy: { position: 'asc' },
  });
  return res.json(entries);
});

// 3.2 Live Queue Dashboard — venue staff advance to the next song per the
// density algorithm (3.3) and broadcast now-playing to every connected device.
queueRouter.post(
  '/:venueId/advance',
  requireAuth,
  requireRole('VENUE_STAFF', 'VENUE_ADMIN'),
  async (req, res) => {
    const venueId = req.params.venueId;
    const next = await new QueueEngine(venueId).dequeueNext();
    if (!next) return res.status(204).send();

    const entry = await prisma.queueEntry.update({
      where: { id: next.queueEntryId },
      data: { status: 'PLAYING', startedAt: new Date() },
    });

    getIo().to(venueRoom(venueId)).emit(SocketEvent.NOW_PLAYING, entry);
    return res.json(entry);
  },
);

queueRouter.post(
  '/:venueId/complete/:queueEntryId',
  requireAuth,
  requireRole('VENUE_STAFF', 'VENUE_ADMIN'),
  async (req, res) => {
    const { venueId, queueEntryId } = req.params;
    const entry = await prisma.queueEntry.update({
      where: { id: queueEntryId },
      data: { status: 'COMPLETED', completedAt: new Date() },
    });

    await new QueueEngine(venueId).onSongCompleted(entry.tableId);
    getIo().to(venueRoom(venueId)).emit(SocketEvent.QUEUE_STATE, { completed: entry });

    return res.json(entry);
  },
);

queueRouter.post(
  '/:venueId/skip/:queueEntryId',
  requireAuth,
  requireRole('VENUE_STAFF', 'VENUE_ADMIN'),
  async (req, res) => {
    const { venueId, queueEntryId } = req.params;
    const entry = await prisma.queueEntry.update({
      where: { id: queueEntryId },
      data: { status: 'SKIPPED' },
    });

    await new QueueEngine(venueId).onSongCompleted(entry.tableId);
    getIo().to(venueRoom(venueId)).emit(SocketEvent.QUEUE_SKIP, { queueEntryId });

    return res.json(entry);
  },
);
