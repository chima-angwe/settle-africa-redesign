const DEFAULT_API_TIMEOUT_MS = 30_000;

function normalizeBaseUrl(rawUrl: string | undefined): string {
  const trimmed = rawUrl?.trim() ?? "";
  if (!trimmed) {
    return "";
  }

  const withoutTrailingSlash = trimmed.replace(/\/+$/, "");

  // Allow relative proxy paths (e.g. "/api") or absolute http(s) URLs.
  if (withoutTrailingSlash.startsWith("/")) {
    return withoutTrailingSlash;
  }

  try {
    const parsed = new URL(withoutTrailingSlash);
    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
      throw new Error("Protocol must be http or https.");
    }
    return withoutTrailingSlash;
  } catch {
    throw new Error(
      `Invalid SETTLE_AFRICA_BASE_URL "${trimmed}". Expected a valid http(s) URL or root-relative path.`,
    );
  }
}

function parseTimeoutMs(rawTimeout: string | undefined): number {
  if (!rawTimeout?.trim()) {
    return DEFAULT_API_TIMEOUT_MS;
  }

  const parsed = Number(rawTimeout);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    throw new Error(
      `Invalid SETTLE_AFRICA_API_TIMEOUT_MS "${rawTimeout}". Expected a positive number in milliseconds.`,
    );
  }

  return parsed;
}

const rawApiBaseUrl = normalizeBaseUrl(import.meta.env.SETTLE_AFRICA_BASE_URL);
const useDirectUrlInDev = import.meta.env.SETTLE_AFRICA_USE_DIRECT_URL === "true";
const shouldUseDevProxy =
  import.meta.env.DEV &&
  !useDirectUrlInDev &&
  /^https?:\/\//i.test(rawApiBaseUrl);

export const env = {
  apiBaseUrl: shouldUseDevProxy ? "/api" : rawApiBaseUrl,
  directApiBaseUrl: rawApiBaseUrl,
  apiTimeoutMs: parseTimeoutMs(import.meta.env.SETTLE_AFRICA_API_TIMEOUT_MS),
  shellToken: import.meta.env.SETTLE_AFRICA_SHELL_TOKEN?.trim() ?? "",
  isDev: import.meta.env.DEV,
  isProd: import.meta.env.PROD,
} as const;

if (env.isDev && !rawApiBaseUrl) {
  console.warn(
    "[env] SETTLE_AFRICA_BASE_URL is not set. Live API calls will fail until it is configured in .env.",
  );
}
