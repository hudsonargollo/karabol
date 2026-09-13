import {
  SocketEvent,
  VOTE_MAX,
  VOTE_MIN,
  VOTING_GRACE_SECONDS,
  tallyVotes,
  type VoteTally,
} from '@karaokebo/shared';
import { prisma } from '../config/db.js';
import { getIo, venueRoom } from '../sockets/io.js';
import { issueRewardForScore } from './rewardEngine.js';

/**
 * 3.4 Peer Voting — replaces the DSP scoring pipeline (see shared/voting.ts
 * for why). Lifecycle per performance:
 *
 *   NOW_PLAYING  -> votes accepted (VOTE_OPEN broadcast with the entry)
 *   completed    -> `votingClosesAt = now + grace`; votes still accepted
 *   closesAt     -> `finalizeVotes`: tally frozen into a Score, reward issued
 *                   if enough people voted, VOTE_FINAL broadcast
 *
 * The close is scheduled in-process with a timer AND persisted, so a restart
 * can still finalize windows it slept through (`finalizeDueVotes`).
 */

export class VoteError extends Error {
  constructor(message: string, public readonly status: number) {
    super(message);
  }
}

export async function getTally(queueEntryId: string): Promise<VoteTally> {
  const votes = await prisma.performanceVote.findMany({ where: { queueEntryId }, select: { value: true } });
  return tallyVotes(votes.map((v) => v.value));
}

function isOpen(entry: { status: string; votingClosesAt: Date | null }): boolean {
  if (entry.status === 'PLAYING') return true;
  return entry.status === 'COMPLETED' && !!entry.votingClosesAt && entry.votingClosesAt.getTime() > Date.now();
}

export async function castVote(queueEntryId: string, voterId: string, value: number): Promise<VoteTally> {
  if (!Number.isInteger(value) || value < VOTE_MIN || value > VOTE_MAX) {
    throw new VoteError(`El voto debe ser un entero entre ${VOTE_MIN} y ${VOTE_MAX}`, 400);
  }

  const entry = await prisma.queueEntry.findUnique({
    where: { id: queueEntryId },
    include: { score: { select: { id: true } } },
  });
  if (!entry) throw new VoteError('Actuación no encontrada', 404);
  if (entry.requestedById === voterId) throw new VoteError('No puedes votar tu propia actuación', 403);
  if (entry.score || !isOpen(entry)) throw new VoteError('La votación para esta actuación ya cerró', 409);

  // Re-voting overwrites: people change their mind at the last chorus.
  await prisma.performanceVote.upsert({
    where: { queueEntryId_voterId: { queueEntryId, voterId } },
    create: { queueEntryId, voterId, value },
    update: { value },
  });

  const tally = await getTally(queueEntryId);
  getIo().to(venueRoom(entry.venueId)).emit(SocketEvent.VOTE_UPDATE, { queueEntryId, tally });
  return tally;
}

/** Call when a performance ends. Keeps the ballot open for the grace period, then freezes it. */
export async function scheduleVoteClose(queueEntryId: string): Promise<Date> {
  const closesAt = new Date(Date.now() + VOTING_GRACE_SECONDS * 1000);
  await prisma.queueEntry.update({ where: { id: queueEntryId }, data: { votingClosesAt: closesAt } });

  const timer = setTimeout(() => {
    finalizeVotes(queueEntryId).catch((err) => console.error('[voting] finalize failed', queueEntryId, err));
  }, VOTING_GRACE_SECONDS * 1000);
  timer.unref(); // never keep the process alive just for this

  return closesAt;
}

/**
 * Freezes the tally into a Score and issues the reward. Idempotent: a second
 * call (timer + sweep racing) is a no-op once the Score row exists.
 * Performances nobody voted on get no Score — a 0 would drag the singer's
 * average down for a quiet night, which isn't their fault.
 */
export async function finalizeVotes(queueEntryId: string) {
  const entry = await prisma.queueEntry.findUnique({
    where: { id: queueEntryId },
    include: { score: { select: { id: true } } },
  });
  if (!entry || entry.score || entry.status !== 'COMPLETED') return null;

  const tally = await getTally(queueEntryId);
  const room = getIo().to(venueRoom(entry.venueId));

  if (tally.voteCount === 0) {
    room.emit(SocketEvent.VOTE_FINAL, { queueEntryId, tally, reward: null });
    return null;
  }

  const score = await prisma.score.create({
    data: {
      queueEntryId,
      userId: entry.requestedById,
      value: tally.value,
      voteCount: tally.voteCount,
      averageVote: tally.averageVote,
    },
  });

  const reward = tally.rewardEligible ? await issueRewardForScore(score.id) : null;
  if (reward) await prisma.score.update({ where: { id: score.id }, data: { tier: reward.tier } });

  room.emit(SocketEvent.VOTE_FINAL, { queueEntryId, tally, reward });
  if (reward) room.emit(SocketEvent.REWARD_ISSUED, { userId: entry.requestedById, ...reward });

  return { score, tally, reward };
}

/** Sweep for windows whose timer was lost (restart, crash). Safe to call often. */
export async function finalizeDueVotes(venueId?: string): Promise<number> {
  const due = await prisma.queueEntry.findMany({
    where: {
      ...(venueId ? { venueId } : {}),
      status: 'COMPLETED',
      score: null,
      votingClosesAt: { lte: new Date() },
      votes: { some: {} },
    },
    select: { id: true },
  });
  for (const { id } of due) await finalizeVotes(id);
  return due.length;
}

/** The single performance a venue's patrons can vote on right now, if any. */
export async function findOpenPerformance(venueId: string) {
  const playing = await prisma.queueEntry.findFirst({ where: { venueId, status: 'PLAYING' } });
  if (playing) return playing;
  return prisma.queueEntry.findFirst({
    where: { venueId, status: 'COMPLETED', score: null, votingClosesAt: { gt: new Date() } },
    orderBy: { completedAt: 'desc' },
  });
}
