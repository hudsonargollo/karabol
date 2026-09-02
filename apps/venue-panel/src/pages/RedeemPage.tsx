import { useState } from 'react';
import { api, type RewardRedemption } from '../lib/api';

const TIER_LABEL: Record<RewardRedemption['tier'], string> = {
  GOLD: 'Gold',
  SILVER: 'Silver',
  BRONZE: 'Bronze',
};

// 3.5 QR Redemption — bartender types/scans the patron's code, sees the tier
// + matching POS discount to apply in Loyverse, then marks it redeemed.
export function RedeemPage() {
  const [qrCode, setQrCode] = useState('');
  const [redemption, setRedemption] = useState<RewardRedemption | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function lookup() {
    setError(null);
    setRedemption(null);
    try {
      setRedemption(await api.verifyReward(qrCode.trim()));
    } catch {
      setError('Code not found');
    }
  }

  async function redeem() {
    if (!redemption) return;
    try {
      setRedemption(await api.redeemReward(redemption.qrCode));
    } catch {
      setError('Could not redeem — it may already be used');
    }
  }

  return (
    <div style={{ fontFamily: 'system-ui', padding: 24, maxWidth: 420 }}>
      <h1>Redeem a reward</h1>
      <div style={{ display: 'flex', gap: 8 }}>
        <input
          placeholder="Scan or type the code"
          value={qrCode}
          onChange={(e) => setQrCode(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && lookup()}
          style={{ flex: 1 }}
        />
        <button onClick={lookup}>Look up</button>
      </div>

      {error && <p style={{ color: 'crimson' }}>{error}</p>}

      {redemption && (
        <div style={{ marginTop: 16, border: '1px solid #ddd', borderRadius: 8, padding: 16 }}>
          <p>
            <strong>{redemption.user.displayName ?? 'Patron'}</strong> —{' '}
            {TIER_LABEL[redemption.tier]} ({redemption.discountPercent}% off)
          </p>
          {redemption.posDiscountId ? (
            <p>Apply Loyverse discount id: {redemption.posDiscountId}</p>
          ) : (
            <p>No POS discount linked — apply {redemption.discountPercent}% manually.</p>
          )}
          {redemption.redeemedAt ? (
            <p>Already redeemed at {new Date(redemption.redeemedAt).toLocaleString()}</p>
          ) : (
            <button onClick={redeem}>Mark redeemed</button>
          )}
        </div>
      )}
    </div>
  );
}
