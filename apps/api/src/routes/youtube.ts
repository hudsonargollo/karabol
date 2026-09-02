import { Router } from 'express';
import { z } from 'zod';
import { env } from '../config/env.js';
import { requireAuth } from '../middleware/auth.js';

export const youtubeRouter = Router();

interface YouTubeSearchItem {
  id: { videoId: string };
  snippet: {
    title: string;
    channelTitle: string;
    thumbnails: { medium?: { url: string }; default?: { url: string } };
  };
}

const searchSchema = z.object({ q: z.string().min(1).max(100) });

// 3.1 YouTube Integration — sanitized search: video-only results, safe search
// enforced, restricted to the Music category so patrons can't queue arbitrary content.
youtubeRouter.get('/search', requireAuth, async (req, res) => {
  const parsed = searchSchema.safeParse(req.query);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });

  if (!env.youtubeApiKey) {
    return res.status(503).json({ error: 'YouTube search is not configured on this server' });
  }

  const url = new URL('https://www.googleapis.com/youtube/v3/search');
  url.searchParams.set('key', env.youtubeApiKey);
  url.searchParams.set('part', 'snippet');
  url.searchParams.set('type', 'video');
  url.searchParams.set('videoCategoryId', '10'); // Music
  url.searchParams.set('safeSearch', 'strict');
  url.searchParams.set('maxResults', '15');
  url.searchParams.set('q', `${parsed.data.q} karaoke`);

  const ytRes = await fetch(url);
  if (!ytRes.ok) {
    console.error('[youtube] search failed', ytRes.status, await ytRes.text());
    return res.status(502).json({ error: 'YouTube search failed' });
  }

  const data = (await ytRes.json()) as { items: YouTubeSearchItem[] };
  const results = data.items
    .filter((item) => item.id.videoId)
    .map((item) => ({
      youtubeVideoId: item.id.videoId,
      title: item.snippet.title,
      channelTitle: item.snippet.channelTitle,
      thumbnailUrl: item.snippet.thumbnails.medium?.url ?? item.snippet.thumbnails.default?.url ?? null,
    }));

  return res.json(results);
});
