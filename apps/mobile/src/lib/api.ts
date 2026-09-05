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

export interface QueueEntry {
  id: string;
  venueId: string;
  tableId: string;
  youtubeVideoId: string;
  title: string;
  status: 'PENDING' | 'PLAYING' | 'COMPLETED' | 'SKIPPED';
  position: number;
  createdAt: string;
}

export const api = {
  register: (payload: { email?: string; phone?: string; password: string; displayName: string }) =>
    request<{ token: string; user: AuthUser }>('/auth/register', { method: 'POST', body: JSON.stringify(payload) }),
  login: (identifier: string, password: string) =>
    request<{ token: string; user: AuthUser }>('/auth/login', { method: 'POST', body: JSON.stringify({ identifier, password }) }),

  joinTable: (venueSlug: string, pin: string) =>
    request<{ tableId: string; venueId: string; label: string }>('/tables/join', {
      method: 'POST',
      body: JSON.stringify({ venueSlug, pin }),
    }),

  searchYoutube: (q: string) => request<YoutubeResult[]>(`/youtube/search?q=${encodeURIComponent(q)}`),

  queueSong: (payload: { venueId: string; tableId: string; youtubeVideoId: string; title: string }) =>
    request('/queue', { method: 'POST', body: JSON.stringify(payload) }),

  getQueue: (venueId: string) => request<QueueEntry[]>(`/queue/${venueId}`),

  // Mobile-driven: the performer's own device marks their entry complete
  // and the server auto-advances to the next table — no venue-panel click
  // needed for the common case.
  finishSong: (venueId: string, queueEntryId: string) =>
    request<{ completed: QueueEntry; next: QueueEntry | null }>(`/queue/${venueId}/finish/${queueEntryId}`, {
      method: 'POST',
    }),

  getWallet: () => request<WalletItem[]>('/wallet'),
};
