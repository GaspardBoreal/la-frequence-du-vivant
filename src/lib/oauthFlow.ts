const PENDING_OAUTH_KEY = 'lfdv.oauth.pending';

const OAUTH_CONSENT_PATHS = new Set(['/.lovable/oauth/consent', '/oauth/consent']);

export function safeNextPath(raw: string | null | undefined): string | null {
  const value = raw?.trim();
  if (!value) return null;

  try {
    const url = new URL(value, window.location.origin);
    if (url.origin !== window.location.origin) return null;
    const path = `${url.pathname}${url.search}${url.hash}`;
    if (!path.startsWith('/') || path.startsWith('//')) return null;
    return path;
  } catch {
    return null;
  }
}

export function isOAuthConsentPath(path: string | null | undefined): boolean {
  if (!path) return false;
  try {
    const url = new URL(path, window.location.origin);
    return OAUTH_CONSENT_PATHS.has(url.pathname);
  } catch {
    return false;
  }
}

export function rememberPendingOAuthRequest(path: string) {
  const safePath = safeNextPath(path);
  if (!safePath || !isOAuthConsentPath(safePath)) return;

  try {
    sessionStorage.setItem(PENDING_OAUTH_KEY, safePath);
  } catch {
    /* session storage can be unavailable in embedded browsers */
  }

  try {
    localStorage.setItem(PENDING_OAUTH_KEY, safePath);
  } catch {
    /* local storage can be unavailable in embedded browsers */
  }
}

export function readPendingOAuthRequest(): string | null {
  const read = (storage: Storage) => safeNextPath(storage.getItem(PENDING_OAUTH_KEY));

  try {
    const fromSession = read(sessionStorage);
    if (fromSession && isOAuthConsentPath(fromSession)) return fromSession;
  } catch {
    /* noop */
  }

  try {
    const fromLocal = read(localStorage);
    if (fromLocal && isOAuthConsentPath(fromLocal)) return fromLocal;
  } catch {
    /* noop */
  }

  return null;
}

export function clearPendingOAuthRequest() {
  try {
    sessionStorage.removeItem(PENDING_OAUTH_KEY);
  } catch {
    /* noop */
  }

  try {
    localStorage.removeItem(PENDING_OAUTH_KEY);
  } catch {
    /* noop */
  }
}

export function loginPathForOAuthReturn(target: string): string {
  const safeTarget = safeNextPath(target) ?? '/.lovable/oauth/consent';
  return `/marches-du-vivant/connexion?next=${encodeURIComponent(safeTarget)}`;
}