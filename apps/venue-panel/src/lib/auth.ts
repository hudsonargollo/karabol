export interface AuthClaims {
  userId: string;
  role: 'PATRON' | 'VENUE_STAFF' | 'VENUE_ADMIN' | 'SUPER_ADMIN';
  venueId: string | null;
}

/** Reads the JWT payload client-side for UI routing only — the API re-verifies on every call. */
export function decodeToken(token: string): AuthClaims | null {
  try {
    const payload = token.split('.')[1];
    const json = atob(payload.replace(/-/g, '+').replace(/_/g, '/'));
    return JSON.parse(json) as AuthClaims;
  } catch {
    return null;
  }
}
