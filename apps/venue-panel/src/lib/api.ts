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

export const api = {
  login: (identifier: string, password: string) =>
    request<{ token: string }>('/auth/login', { method: 'POST', body: JSON.stringify({ identifier, password }) }),
  getQueue: (venueId: string) => request<unknown[]>(`/queue/${venueId}`),
  advanceQueue: (venueId: string) => request(`/queue/${venueId}/advance`, { method: 'POST' }),
  completeSong: (venueId: string, queueEntryId: string) =>
    request(`/queue/${venueId}/complete/${queueEntryId}`, { method: 'POST' }),
  skipSong: (venueId: string, queueEntryId: string) =>
    request(`/queue/${venueId}/skip/${queueEntryId}`, { method: 'POST' }),
};
