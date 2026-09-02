export type RewardTier = 'BRONZE' | 'SILVER' | 'GOLD';

export const DEFAULT_TIER_THRESHOLDS: Record<RewardTier, number> = {
  BRONZE: 60,
  SILVER: 75,
  GOLD: 90,
};

export const DEFAULT_TIER_DISCOUNT_PERCENT: Record<RewardTier, number> = {
  BRONZE: 10,
  SILVER: 20,
  GOLD: 30,
};

export function resolveRewardTier(
  score: number,
  thresholds: Record<RewardTier, number> = DEFAULT_TIER_THRESHOLDS,
): RewardTier | null {
  if (score >= thresholds.GOLD) return 'GOLD';
  if (score >= thresholds.SILVER) return 'SILVER';
  if (score >= thresholds.BRONZE) return 'BRONZE';
  return null;
}
