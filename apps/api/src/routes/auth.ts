import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { OAuth2Client } from 'google-auth-library';
import { z } from 'zod';
import { env } from '../config/env.js';
import { prisma } from '../config/db.js';
import { requireAuth, signToken } from '../middleware/auth.js';

export const authRouter = Router();
const googleClient = new OAuth2Client({ clientId: env.googleClientId, clientSecret: env.googleClientSecret });

const registerSchema = z.object({
  email: z.string().email().optional(),
  phone: z.string().min(6).optional(),
  password: z.string().min(8),
  displayName: z.string().min(1),
});

// Patron self-registration. See /auth/google below for the OAuth strategy.
authRouter.post('/register', async (req, res) => {
  const parsed = registerSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });
  const { email, phone, password, displayName } = parsed.data;
  if (!email && !phone) return res.status(400).json({ error: 'email or phone is required' });

  const passwordHash = await bcrypt.hash(password, 12);
  const user = await prisma.user.create({
    data: { email, phone, passwordHash, displayName, role: 'PATRON' },
  });

  const token = signToken({ userId: user.id, role: user.role, venueId: user.venueId });
  return res.status(201).json({ token, user: { id: user.id, role: user.role, displayName: user.displayName } });
});

const googleSchema = z.object({ code: z.string(), redirectUri: z.string() });

// Patron sign-in via Google — the mobile app's only auth method (no
// phone/password form). The client only ever handles an authorization
// `code` (expo-auth-session, PKCE off); the exchange for tokens happens
// here, authenticated with GOOGLE_CLIENT_SECRET, which must never reach
// client code. Finds an existing patron by the verified email, or creates
// one on first sign-in; either way the client gets `isNewUser` back so it
// knows whether to route into CrewPick or straight past it.
authRouter.post('/google', async (req, res) => {
  const parsed = googleSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });
  if (!env.googleClientId || !env.googleClientSecret) {
    return res.status(500).json({ error: 'Google sign-in is not configured' });
  }

  let email: string | undefined;
  let name: string | undefined;
  try {
    const { tokens } = await googleClient.getToken({
      code: parsed.data.code,
      redirect_uri: parsed.data.redirectUri,
    });
    if (!tokens.id_token) throw new Error('No id_token in Google token response');
    const ticket = await googleClient.verifyIdToken({ idToken: tokens.id_token, audience: env.googleClientId });
    const payload = ticket.getPayload();
    email = payload?.email;
    name = payload?.name;
  } catch (err) {
    console.warn('[auth/google] token exchange failed', err);
    return res.status(401).json({ error: 'Invalid Google authorization code' });
  }
  if (!email) return res.status(400).json({ error: 'Google account has no email' });

  let user = await prisma.user.findUnique({ where: { email } });
  const isNewUser = !user;
  if (!user) {
    user = await prisma.user.create({
      data: { email, displayName: name ?? email.split('@')[0], role: 'PATRON' },
    });
  }

  const token = signToken({ userId: user.id, role: user.role, venueId: user.venueId });
  return res.json({ token, user: { id: user.id, role: user.role, displayName: user.displayName }, isNewUser });
});

const loginSchema = z.object({
  identifier: z.string(), // email or phone
  password: z.string(),
});

authRouter.post('/login', async (req, res) => {
  const parsed = loginSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });
  const { identifier, password } = parsed.data;

  const user = await prisma.user.findFirst({
    where: { OR: [{ email: identifier }, { phone: identifier }] },
  });
  if (!user?.passwordHash || !(await bcrypt.compare(password, user.passwordHash))) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }

  const token = signToken({ userId: user.id, role: user.role, venueId: user.venueId });
  return res.json({ token, user: { id: user.id, role: user.role, displayName: user.displayName } });
});

const changePasswordSchema = z.object({
  currentPassword: z.string(),
  newPassword: z.string().min(8),
});

// Self-service password rotation — used right after an admin/staff account is bootstrapped.
authRouter.patch('/password', requireAuth, async (req, res) => {
  const parsed = changePasswordSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });
  const { currentPassword, newPassword } = parsed.data;

  const user = await prisma.user.findUniqueOrThrow({ where: { id: req.auth!.userId } });
  if (!user.passwordHash || !(await bcrypt.compare(currentPassword, user.passwordHash))) {
    return res.status(401).json({ error: 'Current password is incorrect' });
  }

  const passwordHash = await bcrypt.hash(newPassword, 12);
  await prisma.user.update({ where: { id: user.id }, data: { passwordHash } });
  return res.status(204).send();
});
