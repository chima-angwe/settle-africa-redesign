import { env } from "@/shared/config";

export const AUTH_HEADER_COOKIE_KEYS = [
  "shell",
  "phone",
  "token",
  "expiry",
  "vault",
  "code",
] as const;

export type AuthHeaderName = (typeof AUTH_HEADER_COOKIE_KEYS)[number];
export type AuthHeaderValues = Partial<Record<AuthHeaderName, string>>;

const COOKIE_PREFIX = "settle_auth_";

function getCookieAttributeSuffix(): string {
  if (typeof window === "undefined") {
    return "Path=/; SameSite=Lax";
  }
  const secureFlag = window.location.protocol === "https:" ? "; Secure" : "";
  return `Path=/; SameSite=Lax${secureFlag}`;
}

function readCookie(cookieName: string): string {
  if (typeof document === "undefined" || !document.cookie) {
    return "";
  }

  const target = `${encodeURIComponent(cookieName)}=`;
  const parts = document.cookie.split(";");
  for (const part of parts) {
    const trimmed = part.trim();
    if (trimmed.startsWith(target)) {
      const rawValue = trimmed.slice(target.length);
      try {
        return decodeURIComponent(rawValue);
      } catch {
        return rawValue;
      }
    }
  }
  return "";
}

const AUTH_COOKIE_MAX_AGE_SECONDS = 24 * 60 * 60;

function writeCookie(cookieName: string, value: string): void {
  if (typeof document === "undefined") {
    return;
  }

  const trimmed = value.trim();
  if (!trimmed) {
    deleteCookie(cookieName);
    return;
  }

  document.cookie = `${encodeURIComponent(cookieName)}=${encodeURIComponent(trimmed)}; Max-Age=${AUTH_COOKIE_MAX_AGE_SECONDS}; ${getCookieAttributeSuffix()}`;
}

function deleteCookie(cookieName: string): void {
  if (typeof document === "undefined") {
    return;
  }

  document.cookie = `${encodeURIComponent(cookieName)}=; Max-Age=0; ${getCookieAttributeSuffix()}`;
}

function cookieKeyForHeader(name: AuthHeaderName): string {
  return `${COOKIE_PREFIX}${name}`;
}

export function getAuthHeadersFromCookies(): AuthHeaderValues {
  const headers: AuthHeaderValues = {};

  for (const headerName of AUTH_HEADER_COOKIE_KEYS) {
    const fromPrefixedCookie = readCookie(cookieKeyForHeader(headerName));
    const fromDirectCookie = readCookie(headerName);
    const resolved = fromPrefixedCookie || fromDirectCookie;
    if (resolved) {
      headers[headerName] = resolved;
    }
  }

  if (!headers.shell && env.shellToken) {
    headers.shell = env.shellToken;
  }

  return headers;
}

export function setAuthCookies(values: AuthHeaderValues): void {
  for (const headerName of AUTH_HEADER_COOKIE_KEYS) {
    const nextValue = values[headerName];
    if (nextValue === undefined) {
      continue;
    }
    if (nextValue.trim()) {
      writeCookie(cookieKeyForHeader(headerName), nextValue);
    } else {
      deleteCookie(cookieKeyForHeader(headerName));
    }
  }
}

export function clearSessionAuthCookies(includeShell = false): void {
  for (const headerName of AUTH_HEADER_COOKIE_KEYS) {
    if (!includeShell && headerName === "shell") {
      continue;
    }
    deleteCookie(cookieKeyForHeader(headerName));
    deleteCookie(headerName);
  }
}
