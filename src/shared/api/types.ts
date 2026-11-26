export type ApiErrorCode =
  | "NETWORK_ERROR"
  | "TIMEOUT"
  | "UNAUTHORIZED"
  | "FORBIDDEN"
  | "NOT_FOUND"
  | "VALIDATION_ERROR"
  | "CONFLICT"
  | "RATE_LIMITED"
  | "SERVER_ERROR"
  | "BAD_REQUEST"
  | "INVALID_RESPONSE"
  | "CONFIGURATION_ERROR"
  | "CANCELLED"
  | "UNKNOWN_ERROR";

export type ValidationFieldErrors = Record<string, string[]>;

export interface PaginationParams {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}

/**
 * TODO(api-contract): Confirm whether paginated backend endpoints return
 * this shape or a different envelope / metadata structure.
 */
export interface PaginatedResponse<TItem> {
  items: TItem[];
  total: number;
  page: number;
  limit: number;
}
