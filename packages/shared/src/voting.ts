/**
 * 3.4 Peer Voting — the crowd scores the performance, not a DSP pipeline.
 *
 * Why voting: a karaoke track carries no lead vocal, so there is no reference
 * melody to score a singer against. Pitch-detecting the backing mix returns the
 * chord root (the bass line), which means a singer hitting the correct melody
 * scores as wrong. Peer voting sidesteps that entirely and needs no track audio.
 */

/** Patrons vote 1-5. Small scale: fast to tap, hard to misread on a phone in a dark bar. */
export const VOTE_MIN = 1;
export const VOTE_MAX = 5;

/**
 * Votes stay open for the whole performance plus this grace period, so people
 * who only decide at the last chorus still get a say.
 */
export const VOTING_GRACE_SECONDS = 90;

/**
 * A performance needs this many independent voters before it can earn a reward.
 * Without it, one friend tapping 5 stars mints a GOLD discount. Performances
 * below the floor still get a recorded score — they just don't issue a reward.
 */
export const MIN_VOTERS_FOR_REWARD = 3;

export interface VoteTally {
  /** 0-100, comparable to the venue's existing reward thresholds. */
  value: number;
  voteCount: number;
  /** Raw mean on the 1-5 scale, for display ("4.2 ★"). */
  averageVote: number | null;
  /** How many votes landed on each star value, index 0 = 1 star. */
  distribution: number[];
  rewardEligible: boolean;
}

export const EMPTY_TALLY: VoteTally = {
  value: 0,
  voteCount: 0,
  averageVote: null,
  distribution: [0, 0, 0, 0, 0],
  rewardEligible: false,
};

/**
 * Maps the 1-5 mean onto the 0-100 scale the venue's reward tiers already use,
 * so `resolveRewardTier` and the leaderboard keep working unchanged.
 * With the default thresholds that means roughly: 3.4★ -> BRONZE, 4.0★ -> SILVER,
 * 4.6★ -> GOLD. Gold stays genuinely hard, which is the point of a tier.
 */
export function votesToScore(averageVote: number): number {
  const normalized = (averageVote - VOTE_MIN) / (VOTE_MAX - VOTE_MIN);
  return Math.round(Math.min(1, Math.max(0, normalized)) * 100);
}

export function tallyVotes(values: number[]): VoteTally {
  if (values.length === 0) return EMPTY_TALLY;

  const distribution = [0, 0, 0, 0, 0];
  let sum = 0;
  for (const v of values) {
    const clamped = Math.min(VOTE_MAX, Math.max(VOTE_MIN, Math.round(v)));
    distribution[clamped - VOTE_MIN] += 1;
    sum += clamped;
  }

  const averageVote = sum / values.length;
  return {
    value: votesToScore(averageVote),
    voteCount: values.length,
    averageVote: Math.round(averageVote * 10) / 10,
    distribution,
    rewardEligible: values.length >= MIN_VOTERS_FOR_REWARD,
  };
}
