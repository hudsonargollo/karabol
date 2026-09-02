import { randomBytes } from 'node:crypto';
import { resolveRewardTier, type RewardTier } from '@karaokebo/shared';
import { prisma } from '../config/db.js';

interface VenueThresholds {
  goldThreshold: number;
  silverThreshold: number;
  bronzeThreshold: number;
  goldDiscountPercent: number;
  silverDiscountPercent: number;
  bronzeDiscountPercent: number;
}

const DISCOUNT_BY_TIER = (v: VenueThresholds): Record<RewardTier, number> => ({
  GOLD: v.goldDiscountPercent,
  SILVER: v.silverDiscountPercent,
  BRONZE: v.bronzeDiscountPercent,
});

/**
 * 3.5 Tiered POS Discounts — takes a final DSP score, resolves the venue's
 * configured tier, and issues a redeemable QR-backed discount code.
 * The actual POS webhook call (e.g. Loyverse) is stubbed behind `notifyPos`
 * pending venue-specific API credentials.
 */
export async function issueRewardForScore(scoreId: string): Promise<{ qrCode: string; tier: RewardTier } | null> {
  const score = await prisma.score.findUniqueOrThrow({
    where: { id: scoreId },
    include: { queueEntry: { include: { venue: true } } },
  });

  const venue = score.queueEntry.venue;
  const tier = resolveRewardTier(score.value, {
    GOLD: venue.goldThreshold,
    SILVER: venue.silverThreshold,
    BRONZE: venue.bronzeThreshold,
  });
  if (!tier) return null;

  const discountPercent = DISCOUNT_BY_TIER(venue)[tier];
  const qrCode = randomBytes(16).toString('hex');

  await prisma.rewardRedemption.create({
    data: {
      userId: score.userId,
      scoreId: score.id,
      tier,
      discountPercent,
      qrCode,
    },
  });

  await notifyPos(venue.id, { qrCode, discountPercent, tier });
  return { qrCode, tier };
}

/** Placeholder for the venue POS webhook/REST call (e.g. Loyverse discounts API). */
async function notifyPos(venueId: string, payload: { qrCode: string; discountPercent: number; tier: RewardTier }) {
  // TODO: look up venue.posProvider / posApiKeyEncrypted and call the real integration.
  console.log(`[pos] venue=${venueId} would issue`, payload);
}
