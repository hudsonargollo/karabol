import { Router } from 'express';
import { z } from 'zod';
import { SocketEvent } from '@karaokebo/shared';
import { prisma } from '../config/db.js';
import { requireAuth, requireRole } from '../middleware/auth.js';
import { QueueEngine } from '../services/queueEngine.js';
import { YoutubeUnavailableError, checkPlayability } from '../services/youtubeClient.js';
import { finalizeDueVotes, findOpenPerformance, getTally, scheduleVoteClose } from '../services/votingEngine.js';
import { getIo, venueRoom } from '../sockets/io.js';

export const queueRouter = Router();

const PLAYABILITY_MESSAGE: Record<string, string> = {
  not_found: 'Ese video ya no existe en YouTube',
  not_embeddable: 'El dueño de ese video no permite reproducirlo fuera de YouTube',
  not_public: 'Ese video es privado',
  unavailable: 'Ese video no está disponible',
  region_blocked: 'Ese video está bloqueado en este país',
};

/** Marks an entry as playing and tells every device in the venue — including that voting is open. */
async function startEntry(venueId: string, queueEntryId: string) {
  const entry = await prisma.queueEntry.update({
    where: { id: queueEntryId },
    data: { status: 'PLAYING', startedAt: new Date() },
  });
  const room = getIo().to(venueRoom(venueId));
  room.emit(SocketEvent.NOW_PLAYING, entry);
  room.emit(SocketEvent.VOTE_OPEN, { queueEntryId: entry.id, entry });
  return entry;
}

/** Pops the density rotation and starts the next entry, or returns null when the venue queue is empty. */
async function advanceVenue(venueId: string, engine = new QueueEngine(venueId)) {
  await finalizeDueVotes(venueId); // cheap insurance in case a close timer was lost
  const next = await engine.dequeueNext();
  return next ? startEntry(venueId, next.queueEntryId) : null;
}

const requestSchema = z.object({
  venueId: z.string(),
  tableId: z.string(),
  youtubeVideoId: z.string().regex(/^[\w-]{11}$/, 'not a YouTube video id'),
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

  // The TV board plays the official embed, so a video that refuses embedding
  // (or is region-locked here) would be dead air on stage. Verified now, not
  // just at search time, since search results are cached for hours. If
  // YouTube itself is down we fail open — blocking the whole queue over a
  // verification outage is worse than the rare dud.
  try {
    const verdict = (await checkPlayability([youtubeVideoId]))[youtubeVideoId];
    if (!verdict.playable) {
      return res.status(422).json({ error: PLAYABILITY_MESSAGE[verdict.reason], reason: verdict.reason });
    }
  } catch (err) {
    if (!(err instanceof YoutubeUnavailableError)) throw err;
    console.warn('[queue] could not verify playability, allowing', youtubeVideoId, err.message);
  }

  const position = await prisma.queueEntry.count({ where: { venueId, status: 'PENDING' } });
  const entry = await prisma.queueEntry.create({
    data: { venueId, tableId, requestedById: req.auth!.userId, youtubeVideoId, title, mode, position },
  });

  const engine = new QueueEngine(venueId);
  await engine.enqueue(tableId, entry.id);
  getIo().to(venueRoom(venueId)).emit(SocketEvent.QUEUE_STATE, { added: entry });

  // Mobile-driven: nobody needs to be at the venue-panel for the first song
  // of the night — if no table is currently playing, kick off the density
  // rotation right away instead of waiting for staff to hit "Play next".
  const alreadyPlaying = await prisma.queueEntry.findFirst({ where: { venueId, status: 'PLAYING' } });
  if (!alreadyPlaying) await advanceVenue(venueId, engine);

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
// `voting` carries the live crowd tally for the performance currently open
// for votes, so the board can show the meter without a socket.
queueRouter.get('/:venueId/board', async (req, res) => {
  const venueId = req.params.venueId;
  const venue = await prisma.venue.findUnique({ where: { id: venueId }, select: { name: true } });
  if (!venue) return res.status(404).json({ error: 'Venue not found' });

  const [entries, open] = await Promise.all([
    prisma.queueEntry.findMany({
      where: { venueId, status: { in: ['PENDING', 'PLAYING'] } },
      orderBy: { position: 'asc' },
    }),
    findOpenPerformance(venueId),
  ]);
  const voting = open
    ? { queueEntryId: open.id, title: open.title, tableId: open.tableId, closesAt: open.votingClosesAt, tally: await getTally(open.id) }
    : null;

  return res.json({ venueName: venue.name, entries, voting });
});

// 3.2 Live Queue Dashboard — venue staff advance to the next song per the
// density algorithm (3.3) and broadcast now-playing to every connected device.
queueRouter.post('/:venueId/advance', requireAuth, requireRole('VENUE_STAFF', 'VENUE_ADMIN'), async (req, res) => {
  const entry = await advanceVenue(req.params.venueId);
  return entry ? res.json(entry) : res.status(204).send();
});

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
    const votingClosesAt = await scheduleVoteClose(entry.id);
    getIo().to(venueRoom(venueId)).emit(SocketEvent.QUEUE_STATE, { completed: entry, votingClosesAt });

    return res.json({ ...entry, votingClosesAt });
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
  const votingClosesAt = await scheduleVoteClose(completed.id);
  getIo().to(venueRoom(venueId)).emit(SocketEvent.QUEUE_STATE, { completed, votingClosesAt });

  const next = await advanceVenue(venueId, engine);
  return res.json({ completed: { ...completed, votingClosesAt }, next });
});

// A skipped performance never gets scored — no vote window is opened.
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
