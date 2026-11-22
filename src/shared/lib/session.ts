export const SESSION_STORAGE_KEY = "settle-demo-session";
export const SESSION_USER_KEY = "settle-demo-user";
export const SESSION_TIMEOUT_MS = 15 * 60 * 1000;

interface StoredSession {
  issuedAt: number;
  expiresAt: number;
}

export function getSession(): StoredSession | null {
  try {
    const raw = localStorage.getItem(SESSION_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<StoredSession>;
    if (typeof parsed.expiresAt !== "number" || !Number.isFinite(parsed.expiresAt)) {
      return null;
    }
    return {
      issuedAt: typeof parsed.issuedAt === "number" ? parsed.issuedAt : Date.now(),
      expiresAt: parsed.expiresAt,
    };
  } catch {
    return null;
  }
}

export function startSession(ttlMs: number = SESSION_TIMEOUT_MS): StoredSession {
  const now = Date.now();
  const session: StoredSession = {
    issuedAt: now,
    expiresAt: now + ttlMs,
  };
  localStorage.setItem(SESSION_USER_KEY, "true");
  localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(session));
  return session;
}

export function refreshSession(ttlMs: number = SESSION_TIMEOUT_MS): StoredSession | null {
  if (localStorage.getItem(SESSION_USER_KEY) !== "true") return null;
  const current = getSession();
  if (current && current.expiresAt <= Date.now()) {
    return null;
  }
  const now = Date.now();
  const next: StoredSession = {
    issuedAt: current?.issuedAt ?? now,
    expiresAt: now + ttlMs,
  };
  localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(next));
  return next;
}

export function clearSession(): void {
  localStorage.removeItem(SESSION_USER_KEY);
  localStorage.removeItem(SESSION_STORAGE_KEY);
}

export function isSessionExpired(): boolean {
  if (localStorage.getItem(SESSION_USER_KEY) !== "true") return true;
  const session = getSession();
  if (!session) return false;
  return session.expiresAt <= Date.now();
}
