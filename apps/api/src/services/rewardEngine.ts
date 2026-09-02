import { randomBytes } from 'node:crypto';
import { resolveRewardTier, type RewardTier } from '@karaokebo/shared';
import { prisma } from '../config/db.js';
import { decryptSecret } from '../utils/crypto.js';
import { LoyverseClient, LoyverseApiError } from './loyverseClient.js';
import { redis } from '../config/redis.js';

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
  const posDiscountId = await resolvePosDiscountId(venue, tier, discountPercent);

  await prisma.rewardRedemption.create({
    data: {
      userId: score.userId,
      scoreId: score.id,
      tier,
      discountPercent,
      qrCode,
      posDiscountId,
    },
  });

  return { qrCode, tier };
}

/**
 * Ensures the venue's POS has a matching named discount (e.g. Loyverse
 * "Karaoke Gold — 30%") and returns its id, caching the lookup in Redis so
 * we don't hit the POS API on every single reward issuance. Toggled off
 * (returns null) when the venue hasn't configured `posProvider`, per the
 * Reward Rules Engine's POS-integration toggle (3.2).
 */
async function resolvePosDiscountId(
  venue: { id: string; posProvider: string | null; posApiKeyEncrypted: string | null },
  tier: RewardTier,
  discountPercent: number,
): Promise<string | null> {
  if (venue.posProvider !== 'loyverse' || !venue.posApiKeyEncrypted) return null;

  const cacheKey = `venue:${venue.id}:posDiscountId:${tier}`;
  const cached = await redis.get(cacheKey);
  if (cached) return cached;

  try {
    const token = decryptSecret(venue.posApiKeyEncrypted);
    const client = new LoyverseClient(token);
    const discountId = await client.ensureDiscount(`Karaoke ${tier} — ${discountPercent}%`, discountPercent);
    await redis.set(cacheKey, discountId, 'EX', 60 * 60 * 24); // re-verify daily
    return discountId;
  } catch (err) {
    // POS being unreachable/misconfigured must never block reward issuance —
    // the patron still gets a redeemable QR; staff apply the discount manually.
    if (err instanceof LoyverseApiError) {
      console.error(`[pos] loyverse error for venue=${venue.id}:`, err.status, err.body);
    } else {
      console.error(`[pos] loyverse call failed for venue=${venue.id}:`, err);
    }
    return null;
  }
}
