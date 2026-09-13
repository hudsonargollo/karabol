import type { VoteTally } from '@karaokebo/shared';
import { API_URL } from './config';
import { authStore } from './authStore';

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = await authStore.getToken();
  const res = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  });
  if (!res.ok) throw new Error(`${res.status} ${await res.text()}`);
  if (res.status === 204) return undefined as T;
  return res.json() as Promise<T>;
}

export interface YoutubeResult {
  youtubeVideoId: string;
  title: string;
  channelTitle: string;
  thumbnailUrl: string | null;
}

export interface WalletItem {
  id: string;
  tier: 'BRONZE' | 'SILVER' | 'GOLD';
  discountPercent: number;
  qrCode: string;
  qrImageDataUrl: string;
  redeemedAt: string | null;
  createdAt: string;
}

export interface AuthUser {
  id: string;
  role: string;
  displayName: string;
}

export type PerformanceMode = 'SOLO' | 'DUO' | 'BATTLE';

export interface QueueEntry {
  id: string;
  venueId: string;
  tableId: string;
  youtubeVideoId: string;
  title: string;
  status: 'PENDING' | 'PLAYING' | 'COMPLETED' | 'SKIPPED';
  mode: PerformanceMode;
  position: number;
  createdAt: string;
}

export interface OpenPerformance {
  entry: QueueEntry | null;
  tally: VoteTally | null;
  myVote: number | null;
  isMine?: boolean;
}

export interface UserStats {
  songsCompleted: number;
  averageScore: number | null;
}

export interface LeaderboardRow {
  userId: string;
  displayName: string | null;
  points: number;
  songs: number;
}

export const api = {
  google: (code: string, redirectUri: string) =>
    request<{ token: string; user: AuthUser; isNewUser: boolean }>('/auth/google', {
      method: 'POST',
      body: JSON.stringify({ code, redirectUri }),
    }),

  joinTable: (venueSlug: string, credentials: { pin: string } | { qrToken: string }) =>
    request<{ tableId: string; venueId: string; label: string }>('/tables/join', {
      method: 'POST',
      body: JSON.stringify({ venueSlug, ...credentials }),
    }),

  searchYoutube: (q: string) => request<YoutubeResult[]>(`/youtube/search?q=${encodeURIComponent(q)}`),

  queueSong: (payload: { venueId: string; tableId: string; youtubeVideoId: string; title: string; mode: PerformanceMode }) =>
    request('/queue', { method: 'POST', body: JSON.stringify(payload) }),

  getQueue: (venueId: string) => request<QueueEntry[]>(`/queue/${venueId}`),

  // Mobile-driven: the performer's own device marks their entry complete
  // and the server auto-advances to the next table — no venue-panel click
  // needed for the common case.
  finishSong: (venueId: string, queueEntryId: string) =>
    request<{ completed: QueueEntry; next: QueueEntry | null }>(`/queue/${venueId}/finish/${queueEntryId}`, {
      method: 'POST',
    }),

  // 3.4 Peer voting
  getOpenPerformance: (venueId: string) => request<OpenPerformance>(`/performances/venue/${venueId}/open`),
  getTally: (queueEntryId: string) => request<VoteTally>(`/performances/${queueEntryId}/tally`),
  castVote: (queueEntryId: string, value: number) =>
    request<VoteTally>(`/performances/${queueEntryId}/vote`, { method: 'POST', body: JSON.stringify({ value }) }),

  getWallet: () => request<WalletItem[]>('/wallet'),

  getMyStats: () => request<UserStats>('/users/me/stats'),

  getLeaderboard: (venueId: string) => request<LeaderboardRow[]>(`/venues/${venueId}/leaderboard`),
};
