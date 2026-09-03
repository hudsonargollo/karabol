const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:4000';

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = localStorage.getItem('token');
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

export interface RewardRedemption {
  id: string;
  tier: 'BRONZE' | 'SILVER' | 'GOLD';
  discountPercent: number;
  qrCode: string;
  redeemedAt: string | null;
  posDiscountId: string | null;
  user: { displayName: string | null };
}

export interface Venue {
  id: string;
  name: string;
  slug: string;
  posProvider: string | null;
  createdAt: string;
  _count: { tables: number; users: number };
}

export interface VenueStaff {
  id: string;
  email: string | null;
  phone: string | null;
  displayName: string | null;
  role: 'VENUE_ADMIN' | 'VENUE_STAFF';
}

export const api = {
  login: (identifier: string, password: string) =>
    request<{ token: string }>('/auth/login', { method: 'POST', body: JSON.stringify({ identifier, password }) }),
  changePassword: (currentPassword: string, newPassword: string) =>
    request<void>('/auth/password', { method: 'PATCH', body: JSON.stringify({ currentPassword, newPassword }) }),

  listVenues: () => request<Venue[]>('/venues'),
  createVenue: (name: string) => request<Venue>('/venues', { method: 'POST', body: JSON.stringify({ name }) }),
  createVenueStaff: (
    venueId: string,
    payload: { email?: string; phone?: string; password: string; displayName: string; role: 'VENUE_ADMIN' | 'VENUE_STAFF' },
  ) => request<VenueStaff>(`/venues/${venueId}/staff`, { method: 'POST', body: JSON.stringify(payload) }),
  createVenueTable: (venueId: string, label: string) =>
    request(`/venues/${venueId}/tables`, { method: 'POST', body: JSON.stringify({ label }) }),

  getQueue: (venueId: string) => request<unknown[]>(`/queue/${venueId}`),
  advanceQueue: (venueId: string) => request(`/queue/${venueId}/advance`, { method: 'POST' }),
  completeSong: (venueId: string, queueEntryId: string) =>
    request(`/queue/${venueId}/complete/${queueEntryId}`, { method: 'POST' }),
  skipSong: (venueId: string, queueEntryId: string) =>
    request(`/queue/${venueId}/skip/${queueEntryId}`, { method: 'POST' }),

  verifyReward: (qrCode: string) => request<RewardRedemption>(`/wallet/verify/${qrCode}`),
  redeemReward: (qrCode: string) => request<RewardRedemption>(`/wallet/redeem/${qrCode}`, { method: 'POST' }),
};
