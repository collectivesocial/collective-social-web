/**
 * Shared fetch-mock helpers for collective-social-web tests.
 *
 * Usage:
 *   import { mockFetchOnce, mockFetchReject } from './fetchHelpers';
 *
 *   beforeEach(() => { fetchSpy = vi.spyOn(globalThis, 'fetch'); });
 *   afterEach(() => { fetchSpy.mockRestore(); });
 *
 *   mockFetchOnce({ data: 'hello' });      // → 200 ok JSON
 *   mockFetchOnce({ err: 'bad' }, 400);    // → 400 not-ok JSON
 *   mockFetchReject(new Error('timeout')); // → network error (rejects)
 */

import { vi } from 'vitest';

export function makeResponse(body: unknown, status = 200): Response {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: async () => body,
    text: async () => JSON.stringify(body),
    headers: new Headers({ 'Content-Type': 'application/json' }),
  } as unknown as Response;
}

/**
 * Queue a single resolved fetch response.
 * Call this once per expected fetch() call — they queue in order.
 */
export function mockFetchOnce(body: unknown, status = 200): void {
  vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(makeResponse(body, status));
}

/**
 * Queue a single rejected fetch (network error, CORS failure, etc.).
 */
export function mockFetchReject(error: Error = new Error('Network error')): void {
  vi.spyOn(globalThis, 'fetch').mockRejectedValueOnce(error);
}
