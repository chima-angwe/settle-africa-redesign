import axios from "axios";
import { env } from "@/shared/config";
import { getAuthHeadersFromCookies } from "@/shared/lib";
import { ApiError, normalizeApiError } from "./errors";

declare module "axios" {
  export interface AxiosRequestConfig {
    /**
     * When true, a 401 response will not invoke the global unauthorized handler
     * (useful for login/OTP/registration requests).
     */
    skipUnauthorizedHandler?: boolean;
  }
}

type UnauthorizedHandler = () => void;

let unauthorizedHandler: UnauthorizedHandler | null = null;
let isHandlingUnauthorized = false;

/**
 * Registers a callback invoked once when an authenticated API request receives 401.
 * Returns an unsubscribe function for cleanup.
 */
export function registerUnauthorizedHandler(
  handler: UnauthorizedHandler,
): () => void {
  unauthorizedHandler = handler;
  isHandlingUnauthorized = false;

  return () => {
    if (unauthorizedHandler === handler) {
      unauthorizedHandler = null;
    }
  };
}

/**
 * Resets the 401 notification guard (call after a fresh sign-in).
 */
export function resetUnauthorizedState(): void {
  isHandlingUnauthorized = false;
}

function isAbsoluteUrl(url: string | undefined): boolean {
  return Boolean(url && /^https?:\/\//i.test(url));
}

function isFailedEnvelopePayload(
  data: unknown,
): data is { status: string; message?: unknown; code?: unknown; data?: unknown } {
  if (typeof data !== "object" || data === null || Array.isArray(data)) {
    return false;
  }

  const candidate = data as Record<string, unknown>;
  if (typeof candidate.status !== "string") {
    return false;
  }

  const normalizedStatus = candidate.status.trim().toLowerCase();
  return normalizedStatus === "failed" || normalizedStatus === "error";
}

export const apiClient = axios.create({
  baseURL: env.apiBaseUrl || undefined,
  timeout: env.apiTimeoutMs,
  withCredentials: false,
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
  },
});

apiClient.interceptors.request.use((config) => {
  const effectiveBaseUrl = config.baseURL ?? env.apiBaseUrl;
  if (!effectiveBaseUrl && !isAbsoluteUrl(config.url)) {
    return Promise.reject(
      new ApiError({
        message:
          "API base URL is not configured. Set SETTLE_AFRICA_BASE_URL in .env before making requests.",
        code: "CONFIGURATION_ERROR",
        isRetryable: false,
      }),
    );
  }

  const cookieHeaders = getAuthHeadersFromCookies();
  for (const [headerName, headerValue] of Object.entries(cookieHeaders)) {
    if (headerValue) {
      config.headers.set(headerName, headerValue);
    }
  }

  return config;
});

apiClient.interceptors.response.use(
  (response) => {
    if (isFailedEnvelopePayload(response.data)) {
      const serverMessage =
        typeof response.data.message === "string" && response.data.message.trim()
          ? response.data.message.trim()
          : "Request failed.";
      const skipHandler = Boolean(response.config?.skipUnauthorizedHandler);
      const isAuthFailure =
        response.data.code === 1 &&
        /not logged in|unauthorized|session/i.test(serverMessage);

      if (isAuthFailure && !skipHandler && unauthorizedHandler && !isHandlingUnauthorized) {
        isHandlingUnauthorized = true;
        unauthorizedHandler();
      }

      return Promise.reject(
        new ApiError({
          message: serverMessage,
          code: isAuthFailure ? "UNAUTHORIZED" : "BAD_REQUEST",
          status: isAuthFailure ? 401 : response.status,
          details: response.data,
          isRetryable: false,
        }),
      );
    }

    return response;
  },
  (error: unknown) => {
    const normalized = normalizeApiError(error);
    const skipHandler =
      axios.isAxiosError(error) && Boolean(error.config?.skipUnauthorizedHandler);

    if (
      normalized.code === "UNAUTHORIZED" &&
      !skipHandler &&
      unauthorizedHandler &&
      !isHandlingUnauthorized
    ) {
      isHandlingUnauthorized = true;
      unauthorizedHandler();
    }

    return Promise.reject(normalized);
  },
);
