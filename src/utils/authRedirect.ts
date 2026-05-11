/**
 * Helpers for stashing where an unauthenticated visitor was trying to go so
 * that, once they sign in, we can drop them back where they started.
 *
 * The OAuth flow is a full-page redirect (POST /login → PDS authorize →
 * callback → redirect to clientUrl), so we use `sessionStorage` — it survives
 * the redirect chain because it's same-origin.
 */

const REDIRECT_KEY = 'postLoginRedirect';
const JOIN_GROUP_KEY = 'pendingGroupJoin';

interface StoredRedirect {
  path: string;
  /** Optional human-readable reason shown above the login form. */
  reason: string | null;
}

/**
 * Remember where the user was so we can send them back after login.
 *
 * @param path App-relative path to return to (e.g. `/groups/did:plc:abc`).
 * @param opts.reason A short message to surface on the login screen so the
 *   user understands why they were redirected.
 * @param opts.joinGroupDid If the user was bounced because they needed to be
 *   a member of a specific group, set the group DID here. After login the
 *   group page will see this and offer to join.
 */
export function setPostLoginRedirect(
  path: string,
  opts?: { reason?: string; joinGroupDid?: string }
): void {
  const payload: StoredRedirect = {
    path,
    reason: opts?.reason ?? null,
  };
  try {
    sessionStorage.setItem(REDIRECT_KEY, JSON.stringify(payload));
    if (opts?.joinGroupDid) {
      sessionStorage.setItem(JOIN_GROUP_KEY, opts.joinGroupDid);
    }
  } catch {
    // sessionStorage can throw in private mode / quota errors; redirect is a
    // nice-to-have, so just swallow.
  }
}

/**
 * Read and clear the pending redirect target. Call this once after detecting
 * successful authentication.
 */
export function consumePostLoginRedirect(): StoredRedirect | null {
  try {
    const raw = sessionStorage.getItem(REDIRECT_KEY);
    if (!raw) return null;
    sessionStorage.removeItem(REDIRECT_KEY);
    return JSON.parse(raw) as StoredRedirect;
  } catch {
    return null;
  }
}

/**
 * Peek at the pending redirect's reason without consuming it. Used by the
 * login UI to show "Sign in to view this group" style hints.
 */
export function peekPostLoginRedirectReason(): string | null {
  try {
    const raw = sessionStorage.getItem(REDIRECT_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as StoredRedirect;
    return parsed.reason ?? null;
  } catch {
    return null;
  }
}

/**
 * If there's a stashed "please join this group" hint for `groupDid`, consume
 * and return true. The group page should then offer to join.
 */
export function consumePendingGroupJoin(groupDid: string): boolean {
  try {
    const pending = sessionStorage.getItem(JOIN_GROUP_KEY);
    if (pending && pending === groupDid) {
      sessionStorage.removeItem(JOIN_GROUP_KEY);
      return true;
    }
  } catch {
    // ignore
  }
  return false;
}
