import { randomBytes } from 'node:crypto';
import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import type { Request } from 'express';
import { prisma } from '../config/db.js';
import { requireAuth, requireRole } from '../middleware/auth.js';
import { encryptSecret } from '../utils/crypto.js';
import { generateQrDataUrl } from '../utils/qrcode.js';
import { LoyverseClient } from '../services/loyverseClient.js';

export const venuesRouter = Router();

const DIACRITICS = new RegExp('[̀-ͯ]', 'g');

function slugify(input: string): string {
  return input
    .toLowerCase()
    .normalize('NFD')
    .replace(DIACRITICS, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

/** SUPER_ADMIN can act on any venue; a VENUE_ADMIN only on their own. */
function canManageVenue(req: Request, venueId: string): boolean {
  if (req.auth!.role === 'SUPER_ADMIN') return true;
  return req.auth!.role === 'VENUE_ADMIN' && req.auth!.venueId === venueId;
}

// SUPER_ADMIN — full venue directory for the admin console.
venuesRouter.get('/', requireAuth, requireRole('SUPER_ADMIN'), async (_req, res) => {
  const venues = await prisma.venue.findMany({
    orderBy: { createdAt: 'desc' },
    select: {
      id: true,
      name: true,
      slug: true,
      posProvider: true,
      createdAt: true,
      _count: { select: { tables: true, users: true } },
    },
  });
  return res.json(venues);
});

const createVenueSchema = z.object({
  name: z.string().min(1),
  slug: z.string().min(1).optional(),
});

// SUPER_ADMIN — onboard a new venue.
venuesRouter.post('/', requireAuth, requireRole('SUPER_ADMIN'), async (req, res) => {
  const parsed = createVenueSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });
  const { name } = parsed.data;
  const slug = slugify(parsed.data.slug ?? name);
  if (!slug) return res.status(400).json({ error: 'Could not derive a slug from that name' });

  const existing = await prisma.venue.findUnique({ where: { slug } });
  if (existing) return res.status(409).json({ error: `slug "${slug}" is already taken` });

  const venue = await prisma.venue.create({ data: { name, slug } });
  return res.status(201).json(venue);
});

venuesRouter.get('/:id', requireAuth, async (req, res) => {
  const venue = await prisma.venue.findUniqueOrThrow({ where: { id: req.params.id } });
  const { posApiKeyEncrypted: _omit, ...safe } = venue;
  return res.json({ ...safe, posConnected: Boolean(venue.posApiKeyEncrypted) });
});

// Ranking — real, aggregated from Score (points = sum of song scores,
// "tonight" = since local midnight). No battle wins in here yet: there's no
// Battle model, so wins/streaks the mockup shows stay off this endpoint
// rather than being invented.
venuesRouter.get('/:id/leaderboard', requireAuth, async (req, res) => {
  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);

  const scores = await prisma.score.findMany({
    where: { createdAt: { gte: startOfToday }, queueEntry: { venueId: req.params.id } },
    include: { user: { select: { id: true, displayName: true } } },
  });

  const byUser = new Map<string, { userId: string; displayName: string | null; points: number; songs: number }>();
  for (const s of scores) {
    const row = byUser.get(s.userId) ?? { userId: s.userId, displayName: s.user.displayName, points: 0, songs: 0 };
    row.points += s.value;
    row.songs += 1;
    byUser.set(s.userId, row);
  }

  const ranking = [...byUser.values()].sort((a, b) => b.points - a.points).slice(0, 20);
  return res.json(ranking);
});

const createStaffSchema = z.object({
  email: z.string().email().optional(),
  phone: z.string().min(6).optional(),
  password: z.string().min(8),
  displayName: z.string().min(1),
  role: z.enum(['VENUE_ADMIN', 'VENUE_STAFF']),
});

// SUPER_ADMIN (any venue) or VENUE_ADMIN (their own venue) — add a staff login.
venuesRouter.post('/:id/staff', requireAuth, async (req, res) => {
  if (!canManageVenue(req, req.params.id)) return res.status(403).json({ error: 'Insufficient role' });
  const parsed = createStaffSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });
  const { email, phone, password, displayName, role } = parsed.data;
  if (!email && !phone) return res.status(400).json({ error: 'email or phone is required' });

  const venue = await prisma.venue.findUnique({ where: { id: req.params.id } });
  if (!venue) return res.status(404).json({ error: 'Venue not found' });

  const passwordHash = await bcrypt.hash(password, 12);
  const user = await prisma.user.create({
    data: { email, phone, passwordHash, displayName, role, venueId: venue.id },
  });
  return res
    .status(201)
    .json({ id: user.id, email: user.email, phone: user.phone, displayName: user.displayName, role: user.role });
});

const createTableSchema = z.object({ label: z.string().min(1) });

// SUPER_ADMIN (any venue) or VENUE_ADMIN (their own venue) — add a table patrons can join.
venuesRouter.post('/:id/tables', requireAuth, async (req, res) => {
  if (!canManageVenue(req, req.params.id)) return res.status(403).json({ error: 'Insufficient role' });
  const parsed = createTableSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });

  const venue = await prisma.venue.findUnique({ where: { id: req.params.id } });
  if (!venue) return res.status(404).json({ error: 'Venue not found' });

  const pin = String(randomBytes(4).readUInt32BE(0) % 1_000_000).padStart(6, '0');
  const qrToken = randomBytes(16).toString('hex');
  const table = await prisma.table.create({
    data: { venueId: venue.id, label: parsed.data.label, pin, qrToken },
  });

  // Printable per-table QR — the mobile app's scanner parses this same
  // slug+qr query-param shape (see TableJoinScreen).
  const joinUrl = `https://karabol.app/join?slug=${encodeURIComponent(venue.slug)}&qr=${qrToken}`;
  const qrImageDataUrl = await generateQrDataUrl(joinUrl);
  return res.status(201).json({ ...table, joinUrl, qrImageDataUrl });
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
