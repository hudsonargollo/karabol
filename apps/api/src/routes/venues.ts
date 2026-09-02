import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../config/db.js';
import { requireAuth, requireRole } from '../middleware/auth.js';
import { encryptSecret } from '../utils/crypto.js';
import { LoyverseClient } from '../services/loyverseClient.js';

export const venuesRouter = Router();

venuesRouter.get('/:id', requireAuth, async (req, res) => {
  const venue = await prisma.venue.findUniqueOrThrow({ where: { id: req.params.id } });
  const { posApiKeyEncrypted: _omit, ...safe } = venue;
  return res.json({ ...safe, posConnected: Boolean(venue.posApiKeyEncrypted) });
});

const rewardRulesSchema = z.object({
  goldThreshold: z.number().min(0).max(100).optional(),
  silverThreshold: z.number().min(0).max(100).optional(),
  bronzeThreshold: z.number().min(0).max(100).optional(),
  goldDiscountPercent: z.number().min(0).max(100).optional(),
  silverDiscountPercent: z.number().min(0).max(100).optional(),
  bronzeDiscountPercent: z.number().min(0).max(100).optional(),
});

// 3.2 Reward Rules Engine — customizable thresholds for reward tiers.
venuesRouter.patch('/:id/reward-rules', requireAuth, requireRole('VENUE_ADMIN'), async (req, res) => {
  const parsed = rewardRulesSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });

  const venue = await prisma.venue.update({ where: { id: req.params.id }, data: parsed.data });
  return res.json(venue);
});

const posConnectSchema = z.object({
  posProvider: z.literal('loyverse'),
  apiKey: z.string().min(1),
});

// 3.2 Reward Rules Engine — POS integration toggle. Validates the token
// against Loyverse (GET /stores) before persisting it encrypted.
venuesRouter.post('/:id/pos/connect', requireAuth, requireRole('VENUE_ADMIN'), async (req, res) => {
  const parsed = posConnectSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });
  const { posProvider, apiKey } = parsed.data;

  try {
    const stores = await new LoyverseClient(apiKey).listStores();
    if (stores.length === 0) return res.status(400).json({ error: 'Token valid but no Loyverse stores found' });
  } catch {
    return res.status(400).json({ error: 'Could not authenticate with Loyverse using this API key' });
  }

  await prisma.venue.update({
    where: { id: req.params.id },
    data: { posProvider, posApiKeyEncrypted: encryptSecret(apiKey) },
  });
  return res.json({ connected: true });
});

venuesRouter.post('/:id/pos/disconnect', requireAuth, requireRole('VENUE_ADMIN'), async (req, res) => {
  await prisma.venue.update({ where: { id: req.params.id }, data: { posProvider: null, posApiKeyEncrypted: null } });
  return res.json({ connected: false });
});
