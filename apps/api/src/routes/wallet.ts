import { Router } from 'express';
import { prisma } from '../config/db.js';
import { requireAuth } from '../middleware/auth.js';

export const walletRouter = Router();

// 3.1 Digital Wallet — earned discount QR codes and badges for the logged-in patron.
walletRouter.get('/', requireAuth, async (req, res) => {
  const redemptions = await prisma.rewardRedemption.findMany({
    where: { userId: req.auth!.userId },
    orderBy: { createdAt: 'desc' },
  });
  return res.json(redemptions);
});

// 3.5 QR Redemption — bartender's POS scans this to mark a discount as used.
walletRouter.post('/redeem/:qrCode', requireAuth, async (req, res) => {
  const redemption = await prisma.rewardRedemption.update({
    where: { qrCode: req.params.qrCode },
    data: { redeemedAt: new Date() },
  });
  return res.json(redemption);
});
