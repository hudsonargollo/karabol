import { Router } from 'express';
import { z } from 'zod';
import { VOTE_MAX, VOTE_MIN } from '@karaokebo/shared';
import { prisma } from '../config/db.js';
import { requireAuth } from '../middleware/auth.js';
import { VoteError, castVote, findOpenPerformance, getTally } from '../services/votingEngine.js';

export const performancesRouter = Router();

// 3.4 Peer voting — what a patron's phone needs to render the ballot: the
// performance open for votes in this venue (if any), its running tally, and
// whether this patron already voted (so the UI can show "cambiar voto").
performancesRouter.get('/venue/:venueId/open', requireAuth, async (req, res) => {
  const entry = await findOpenPerformance(req.params.venueId);
  if (!entry) return res.json({ entry: null, tally: null, myVote: null });

  const [tally, mine] = await Promise.all([
    getTally(entry.id),
    prisma.performanceVote.findUnique({
      where: { queueEntryId_voterId: { queueEntryId: entry.id, voterId: req.auth!.userId } },
      select: { value: true },
    }),
  ]);
  return res.json({ entry, tally, myVote: mine?.value ?? null, isMine: entry.requestedById === req.auth!.userId });
});

performancesRouter.get('/:queueEntryId/tally', requireAuth, async (req, res) => {
  return res.json(await getTally(req.params.queueEntryId));
});

const voteSchema = z.object({ value: z.number().int().min(VOTE_MIN).max(VOTE_MAX) });

performancesRouter.post('/:queueEntryId/vote', requireAuth, async (req, res) => {
  const parsed = voteSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });

  try {
    const tally = await castVote(req.params.queueEntryId, req.auth!.userId, parsed.data.value);
    return res.json(tally);
  } catch (err) {
    if (err instanceof VoteError) return res.status(err.status).json({ error: err.message });
    throw err;
  }
});
