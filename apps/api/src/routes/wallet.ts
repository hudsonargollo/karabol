import { Router } from 'express';
import { prisma } from '../config/db.js';
import { requireAuth, requireRole } from '../middleware/auth.js';
import { generateQrDataUrl } from '../utils/qrcode.js';

export const walletRouter = Router();

// 3.1 Digital Wallet — earned discount QR codes and badges for the logged-in patron.
walletRouter.get('/', requireAuth, async (req, res) => {
  const redemptions = await prisma.rewardRedemption.findMany({
    where: { userId: req.auth!.userId },
    orderBy: { createdAt: 'desc' },
  });

  const withQr = await Promise.all(
    redemptions.map(async (r) => ({ ...r, qrImageDataUrl: await generateQrDataUrl(r.qrCode) })),
  );
  return res.json(withQr);
});

// 3.5 Bartender-facing lookup — scan/enter the QR to see the tier and the
// matching POS discount name/id to apply, before marking it redeemed.
walletRouter.get('/verify/:qrCode', requireAuth, requireRole('VENUE_STAFF', 'VENUE_ADMIN'), async (req, res) => {
  const redemption = await prisma.rewardRedemption.findUniqueOrThrow({
    where: { qrCode: req.params.qrCode },
    include: { user: { select: { displayName: true } } },
  });
  return res.json(redemption);
});

// 3.5 QR Redemption — bartender's POS scans this to mark a discount as used.
walletRouter.post(
  '/redeem/:qrCode',
  requireAuth,
  requireRole('VENUE_STAFF', 'VENUE_ADMIN'),
  async (req, res) => {
    const existing = await prisma.rewardRedemption.findUniqueOrThrow({ where: { qrCode: req.params.qrCode } });
    if (existing.redeemedAt) return res.status(409).json({ error: 'Already redeemed', redeemedAt: existing.redeemedAt });

    const redemption = await prisma.rewardRedemption.update({
      where: { qrCode: req.params.qrCode },
      data: { redeemedAt: new Date() },
    });
    return res.json(redemption);
  },
);
