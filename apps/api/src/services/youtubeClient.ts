import { env } from '../config/env.js';
import { redis, RedisKeys } from '../config/redis.js';

/**
 * 3.1 YouTube Integration — Data API v3 client with two jobs:
 *   1. search, restricted to embeddable music videos so a patron can only
 *      queue what the TV board can actually play;
 *   2. per-video playability checks (embeddable, public, region-allowed),
 *      run again at enqueue time because search results are cached for hours
 *      and a video's status can change underneath us.
 *
 * Quota: search.list costs 100 units, videos.list costs 1. The default daily
 * quota is 10,000, i.e. ~100 searches — so searches are cached in Redis and
 * playability verdicts are cached per video id.
 */
const API = 'https://www.googleapis.com/youtube/v3';
const SEARCH_CACHE_SECONDS = 60 * 60 * 6;
const PLAYABLE_CACHE_SECONDS = 60 * 60 * 24;

export interface YoutubeSearchResult {
  youtubeVideoId: string;
  title: string;
  channelTitle: string;
  thumbnailUrl: string | null;
}

export type PlayabilityReason = 'not_found' | 'not_embeddable' | 'not_public' | 'unavailable' | 'region_blocked';
export type Playability = { playable: true } | { playable: false; reason: PlayabilityReason };

/** Thrown when the API key is missing or YouTube itself fails — callers decide whether to fail open. */
export class YoutubeUnavailableError extends Error {
  constructor(message: string, public readonly status?: number) {
    super(message);
  }
}

interface SearchItem {
  id: { videoId?: string };
  snippet: { title: string; channelTitle: string; thumbnails: { medium?: { url: string }; default?: { url: string } } };
}

interface VideoItem {
  id: string;
  status: { embeddable: boolean; privacyStatus: string; uploadStatus: string };
  contentDetails: { regionRestriction?: { allowed?: string[]; blocked?: string[] } };
}

async function ytGet<T>(resource: string, params: Record<string, string>): Promise<T> {
  if (!env.youtubeApiKey) throw new YoutubeUnavailableError('YouTube API key is not configured');
  const url = new URL(`${API}/${resource}`);
  for (const [k, v] of Object.entries({ ...params, key: env.youtubeApiKey })) url.searchParams.set(k, v);

  const res = await fetch(url);
  if (!res.ok) {
    const body = await res.text();
    console.error(`[youtube] ${resource} failed`, res.status, body.slice(0, 300));
    throw new YoutubeUnavailableError(`YouTube ${resource} failed with ${res.status}`, res.status);
  }
  return (await res.json()) as T;
}

function judge(item: VideoItem, region: string): Playability {
  const { status, contentDetails } = item;
  if (status.uploadStatus !== 'processed') return { playable: false, reason: 'unavailable' };
  if (status.privacyStatus !== 'public' && status.privacyStatus !== 'unlisted') return { playable: false, reason: 'not_public' };
  if (!status.embeddable) return { playable: false, reason: 'not_embeddable' };
  const rr = contentDetails.regionRestriction;
  if (rr?.allowed && !rr.allowed.includes(region)) return { playable: false, reason: 'region_blocked' };
  if (rr?.blocked?.includes(region)) return { playable: false, reason: 'region_blocked' };
  return { playable: true };
}

/** Verdict per video id. Cached; one videos.list call for every id not in cache (max 50 per call). */
export async function checkPlayability(videoIds: string[]): Promise<Record<string, Playability>> {
  const ids = [...new Set(videoIds)];
  const verdicts: Record<string, Playability> = {};
  const missing: string[] = [];

  for (const id of ids) {
    const cached = await redis.get(RedisKeys.ytPlayable(id));
    if (cached) verdicts[id] = JSON.parse(cached) as Playability;
    else missing.push(id);
  }

  for (let i = 0; i < missing.length; i += 50) {
    const batch = missing.slice(i, i + 50);
    const data = await ytGet<{ items: VideoItem[] }>('videos', {
      part: 'status,contentDetails',
      id: batch.join(','),
    });
    const seen = new Map(data.items.map((item) => [item.id, item]));
    for (const id of batch) {
      const item = seen.get(id);
      verdicts[id] = item ? judge(item, env.youtubeRegionCode) : { playable: false, reason: 'not_found' };
      await redis.set(RedisKeys.ytPlayable(id), JSON.stringify(verdicts[id]), 'EX', PLAYABLE_CACHE_SECONDS);
    }
  }

  return verdicts;
}

/** Sanitized karaoke search: music category, safe search, embeddable + syndicated only, then re-verified. */
export async function searchKaraoke(query: string): Promise<YoutubeSearchResult[]> {
  const normalized = query.trim().toLowerCase().replace(/\s+/g, ' ');
  const cacheKey = RedisKeys.ytSearch(normalized);
  const cached = await redis.get(cacheKey);
  if (cached) return JSON.parse(cached) as YoutubeSearchResult[];

  const data = await ytGet<{ items: SearchItem[] }>('search', {
    part: 'snippet',
    type: 'video',
    videoCategoryId: '10', // Music
    videoEmbeddable: 'true',
    videoSyndicated: 'true', // playable outside youtube.com
    safeSearch: 'strict',
    regionCode: env.youtubeRegionCode,
    maxResults: '15',
    q: `${normalized} karaoke`,
  });

  const candidates = data.items
    .filter((item) => item.id.videoId)
    .map((item) => ({
      youtubeVideoId: item.id.videoId!,
      title: item.snippet.title,
      channelTitle: item.snippet.channelTitle,
      thumbnailUrl: item.snippet.thumbnails.medium?.url ?? item.snippet.thumbnails.default?.url ?? null,
    }));

  // search.list's embeddable filter is advisory; videos.list is authoritative and costs 1 unit.
  const verdicts = await checkPlayability(candidates.map((c) => c.youtubeVideoId));
  const results = candidates.filter((c) => verdicts[c.youtubeVideoId]?.playable);

  await redis.set(cacheKey, JSON.stringify(results), 'EX', SEARCH_CACHE_SECONDS);
  return results;
}
