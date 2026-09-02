import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../config/db.js';
import { requireAuth } from '../middleware/auth.js';

export const tablesRouter = Router();

// 3.1 Table Association — a patron scans a QR code (qrToken) or types the table PIN.
const joinSchema = z.object({
  qrToken: z.string().optional(),
  pin: z.string().optional(),
  venueSlug: z.string(),
});

tablesRouter.post('/join', requireAuth, async (req, res) => {
  const parsed = joinSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });
  const { qrToken, pin, venueSlug } = parsed.data;
  if (!qrToken && !pin) return res.status(400).json({ error: 'qrToken or pin is required' });

  const venue = await prisma.venue.findUnique({ where: { slug: venueSlug } });
  if (!venue) return res.status(404).json({ error: 'Venue not found' });

  const table = await prisma.table.findFirst({
    where: { venueId: venue.id, ...(qrToken ? { qrToken } : { pin }) },
  });
  if (!table) return res.status(404).json({ error: 'Table not found' });

  return res.json({ tableId: table.id, venueId: venue.id, label: table.label });
});
