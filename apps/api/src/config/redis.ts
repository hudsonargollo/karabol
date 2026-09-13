import { Redis } from 'ioredis';
import { env } from './env.js';

// Two clients: one for regular commands, one dedicated to Pub/Sub
// (a subscribing connection can't issue other commands in ioredis/Redis).
export const redis = new Redis(env.redisUrl);
export const redisSub = new Redis(env.redisUrl);

export const RedisKeys = {
  venueQueue: (venueId: string) => `venue:${venueId}:queue`, // sorted set, score = position
  venueActiveTable: (venueId: string) => `venue:${venueId}:active_table`,
  tableBlock: (venueId: string, tableId: string) => `venue:${venueId}:table:${tableId}:block`,
  ytSearch: (normalizedQuery: string) => `yt:search:${normalizedQuery}`,
  ytPlayable: (videoId: string) => `yt:playable:${videoId}`,
  leaderboardMonthly: (venueId: string) => `venue:${venueId}:leaderboard:monthly`,
};
