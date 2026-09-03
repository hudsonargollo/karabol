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
    <div className="page">
      <h1>Redeem a reward</h1>

      <div className="card">
        <div className="field-row">
          <input
            placeholder="Scan or type the code"
            value={qrCode}
            onChange={(e) => setQrCode(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && lookup()}
            style={{ flex: 1, minWidth: 220 }}
          />
          <button className="btn" onClick={lookup} disabled={!qrCode.trim()}>
            Look up
          </button>
        </div>
      </div>

      {error && <p className="msg-error">{error}</p>}

      {redemption && (
        <div className="card">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
            <strong style={{ fontSize: '1.05rem' }}>{redemption.user.displayName ?? 'Patron'}</strong>
            <span className={`pill ${redemption.tier.toLowerCase()}`}>
              {TIER_LABEL[redemption.tier]} · {redemption.discountPercent}% off
            </span>
          </div>
          {redemption.posDiscountId ? (
            <p style={{ color: 'var(--ink-soft)', marginBottom: 14 }}>
              Apply Loyverse discount id: <code style={{ fontFamily: 'var(--font-mono)' }}>{redemption.posDiscountId}</code>
            </p>
          ) : (
            <p style={{ color: 'var(--ink-soft)', marginBottom: 14 }}>
              No POS discount linked — apply {redemption.discountPercent}% manually.
            </p>
          )}
          {redemption.redeemedAt ? (
            <p className="empty-state">Already redeemed at {new Date(redemption.redeemedAt).toLocaleString()}</p>
          ) : (
            <button className="btn" onClick={redeem}>
              Mark redeemed
            </button>
          )}
        </div>
      )}
    </div>
  );
}
