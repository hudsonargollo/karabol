import { Router } from 'express';
import { z } from 'zod';
import { requireAuth } from '../middleware/auth.js';
import { YoutubeUnavailableError, checkPlayability, searchKaraoke } from '../services/youtubeClient.js';

export const youtubeRouter = Router();

const searchSchema = z.object({ q: z.string().min(1).max(100) });

// 3.1 YouTube Integration — only returns videos the TV board can actually
// embed and play in this venue's region (see services/youtubeClient.ts).
youtubeRouter.get('/search', requireAuth, async (req, res) => {
  const parsed = searchSchema.safeParse(req.query);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });

  try {
    return res.json(await searchKaraoke(parsed.data.q));
  } catch (err) {
    if (err instanceof YoutubeUnavailableError) {
      return res.status(err.status ? 502 : 503).json({ error: 'La búsqueda de YouTube no está disponible ahora mismo' });
    }
    throw err;
  }
});

// Lets a client pre-check a video (e.g. one pasted by URL) before queueing it.
youtubeRouter.get('/playable/:videoId', requireAuth, async (req, res) => {
  try {
    const verdicts = await checkPlayability([req.params.videoId]);
    return res.json(verdicts[req.params.videoId]);
  } catch (err) {
    if (err instanceof YoutubeUnavailableError) return res.status(503).json({ error: 'No se pudo verificar el video' });
    throw err;
  }
});
