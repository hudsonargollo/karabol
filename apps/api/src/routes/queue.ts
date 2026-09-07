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
  mode: z.enum(['SOLO', 'DUO', 'BATTLE']).default('SOLO'),
});

// 3.1 YouTube Integration — patron queues a track for their table. `mode` is
// a label the patron picks (solo/duo/battle) — there's no duo-partner
// matching or battle-round pairing behind it yet, it's stored and shown on
// the queue/TV board so that feature can build on top of real data later.
queueRouter.post('/', requireAuth, async (req, res) => {
  const parsed = requestSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });
  const { venueId, tableId, youtubeVideoId, title, mode } = parsed.data;

  const position = await prisma.queueEntry.count({ where: { venueId, status: 'PENDING' } });
  const entry = await prisma.queueEntry.create({
    data: {
      venueId,
      tableId,
      requestedById: req.auth!.userId,
      youtubeVideoId,
      title,
      mode,
      position,
    },
  });

  const engine = new QueueEngine(venueId);
  await engine.enqueue(tableId, entry.id);
  getIo().to(venueRoom(venueId)).emit(SocketEvent.QUEUE_STATE, { added: entry });

  // Mobile-driven: nobody needs to be at the venue-panel for the first song
  // of the night — if no table is currently playing, kick off the density
  // rotation right away instead of waiting for staff to hit "Play next".
  const alreadyPlaying = await prisma.queueEntry.findFirst({ where: { venueId, status: 'PLAYING' } });
  if (!alreadyPlaying) {
    const next = await engine.dequeueNext();
    if (next) {
      const nextEntry = await prisma.queueEntry.update({
        where: { id: next.queueEntryId },
        data: { status: 'PLAYING', startedAt: new Date() },
      });
      getIo().to(venueRoom(venueId)).emit(SocketEvent.NOW_PLAYING, nextEntry);
    }
  }

  return res.status(201).json(entry);
});

queueRouter.get('/:venueId', requireAuth, async (req, res) => {
  const entries = await prisma.queueEntry.findMany({
    where: { venueId: req.params.venueId, status: { in: ['PENDING', 'PLAYING'] } },
    orderBy: { position: 'asc' },
  });
  return res.json(entries);
});

// Unauthenticated on purpose — meant for a bar's own TV/tablet display, which
// has no login session. Only exposes what a QR code on the table already
// reveals to any patron in the venue (song titles + table labels, no PII),
// same as the /:venueId route above already does for any logged-in patron.
queueRouter.get('/:venueId/board', async (req, res) => {
  const venue = await prisma.venue.findUnique({ where: { id: req.params.venueId }, select: { name: true } });
  if (!venue) return res.status(404).json({ error: 'Venue not found' });

  const entries = await prisma.queueEntry.findMany({
    where: { venueId: req.params.venueId, status: { in: ['PENDING', 'PLAYING'] } },
    orderBy: { position: 'asc' },
  });
  return res.json({ venueName: venue.name, entries });
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

// 3.1/3.2 Mobile-driven queue advance — the performer's own device marks
// their entry complete and immediately advances the queue, instead of
// requiring venue staff to click "Complete" + "Play next" for every
// performance. Staff keep the routes above for manual overrides (a no-show,
// a skip, etc.) but the common case no longer needs them at all.
queueRouter.post('/:venueId/finish/:queueEntryId', requireAuth, async (req, res) => {
  const { venueId, queueEntryId } = req.params;
  const entry = await prisma.queueEntry.findUnique({ where: { id: queueEntryId } });

  if (!entry || entry.venueId !== venueId) return res.status(404).json({ error: 'Queue entry not found' });
  if (entry.requestedById !== req.auth!.userId) return res.status(403).json({ error: 'Not your performance' });
  if (entry.status !== 'PLAYING') return res.status(400).json({ error: 'This entry is not currently playing' });

  const completed = await prisma.queueEntry.update({
    where: { id: queueEntryId },
    data: { status: 'COMPLETED', completedAt: new Date() },
  });

  const engine = new QueueEngine(venueId);
  await engine.onSongCompleted(completed.tableId);
  getIo().to(venueRoom(venueId)).emit(SocketEvent.QUEUE_STATE, { completed });

  const next = await engine.dequeueNext();
  if (!next) return res.json({ completed, next: null });

  const nextEntry = await prisma.queueEntry.update({
    where: { id: next.queueEntryId },
    data: { status: 'PLAYING', startedAt: new Date() },
  });
  getIo().to(venueRoom(venueId)).emit(SocketEvent.NOW_PLAYING, nextEntry);

  return res.json({ completed, next: nextEntry });
});

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
