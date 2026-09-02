/**
 * Loyverse REST API client (v1.0, https://api.loyverse.com/v1.0).
 *
 * Verified against public sources (Bearer token auth, /stores, /discounts,
 * /receipts resources, total_discounts[] on receipts with id/percentage/scope).
 * Loyverse's full interactive API reference is gated behind a logged-in
 * developer account, so the exact field names accepted by `POST /discounts`
 * are not 100% confirmed here — `ensureDiscount` is defensive (tolerates a
 * couple of plausible field-name variants) and logs the raw response on
 * failure so a venue's first real run surfaces any mismatch immediately.
 * Verify against the venue's own account (developer.loyverse.com/docs, once
 * logged in) before relying on this in production.
 */

const BASE_URL = 'https://api.loyverse.com/v1.0';

export interface LoyverseDiscount {
  id: string;
  name: string;
  type?: string;
  discount_amount?: number;
  discount_percent?: number;
  percentage?: number;
}

export class LoyverseApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly body: unknown,
  ) {
    super(message);
  }
}

export class LoyverseClient {
  constructor(private readonly accessToken: string) {}

  private async request<T>(path: string, init: RequestInit = {}): Promise<T> {
    const res = await fetch(`${BASE_URL}${path}`, {
      ...init,
      headers: {
        Authorization: `Bearer ${this.accessToken}`,
        'Content-Type': 'application/json',
        ...init.headers,
      },
    });

    const text = await res.text();
    const body = text ? JSON.parse(text) : null;

    if (!res.ok) {
      throw new LoyverseApiError(`Loyverse API ${init.method ?? 'GET'} ${path} -> ${res.status}`, res.status, body);
    }
    return body as T;
  }

  /** Validates the token and returns the venue's Loyverse stores. */
  async listStores(): Promise<Array<{ id: string; name: string }>> {
    const res = await this.request<{ stores: Array<{ id: string; name: string }> }>('/stores');
    return res.stores;
  }

  async listDiscounts(): Promise<LoyverseDiscount[]> {
    const res = await this.request<{ discounts: LoyverseDiscount[] }>('/discounts');
    return res.discounts;
  }

  private async createDiscount(name: string, percentage: number): Promise<LoyverseDiscount> {
    return this.request<LoyverseDiscount>('/discounts', {
      method: 'POST',
      body: JSON.stringify({
        name,
        type: 'FIXED_PERCENT',
        discount_percent: percentage,
        restricted_access: false,
      }),
    });
  }

  /**
   * Idempotently ensures a named percentage discount exists in the venue's
   * Loyverse catalog (created once, then reused) and returns its id — the
   * id a staff member selects in the Loyverse POS UI once they've verified
   * the patron's QR (see `routes/pos.ts`).
   */
  async ensureDiscount(name: string, percentage: number): Promise<string> {
    const existing = (await this.listDiscounts()).find((d) => d.name === name);
    if (existing) return existing.id;

    const created = await this.createDiscount(name, percentage);
    return created.id;
  }
}
