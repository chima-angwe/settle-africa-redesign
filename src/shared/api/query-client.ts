import { QueryClient } from "@tanstack/react-query";
import { isApiError } from "./errors";

const NON_RETRYABLE_STATUSES = new Set([400, 401, 403, 404, 409, 422]);

function shouldRetryQuery(failureCount: number, error: unknown): boolean {
  if (failureCount >= 2) {
    return false;
  }

  if (isApiError(error)) {
    if (error.code === "CONFIGURATION_ERROR" || error.code === "CANCELLED") {
      return false;
    }
    if (error.status !== undefined && NON_RETRYABLE_STATUSES.has(error.status)) {
      return false;
    }
    return error.isRetryable;
  }

  return true;
}

export function createQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 60 * 1000,
        gcTime: 5 * 60 * 1000,
        refetchOnWindowFocus: false,
        retry: shouldRetryQuery,
      },
      mutations: {
        retry: false,
      },
    },
  });
}
