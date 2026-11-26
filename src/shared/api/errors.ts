import axios from "axios";
import type { ApiErrorCode, ValidationFieldErrors } from "./types";

interface ErrorPayloadShape {
  message?: unknown;
  error?: unknown;
  detail?: unknown;
  errors?: unknown;
  fieldErrors?: unknown;
}

export interface ApiErrorInit {
  message: string;
  code: ApiErrorCode;
  status?: number;
  fieldErrors?: ValidationFieldErrors;
  details?: unknown;
  isRetryable?: boolean;
  originalError?: unknown;
}

export class ApiError extends Error {
  readonly code: ApiErrorCode;
  readonly status?: number;
  readonly fieldErrors?: ValidationFieldErrors;
  readonly details?: unknown;
  readonly isRetryable: boolean;
  readonly originalError?: unknown;

  constructor(init: ApiErrorInit) {
    super(init.message);
    this.name = "ApiError";
    this.code = init.code;
    this.status = init.status;
    this.fieldErrors = init.fieldErrors;
    this.details = init.details;
    this.isRetryable = init.isRetryable ?? false;
    this.originalError = init.originalError;
  }
}

export function isApiError(error: unknown): error is ApiError {
  return error instanceof ApiError;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function extractFieldErrors(raw: unknown): ValidationFieldErrors | undefined {
  if (!isRecord(raw)) {
    return undefined;
  }

  const normalized: ValidationFieldErrors = {};
  for (const [field, value] of Object.entries(raw)) {
    if (Array.isArray(value)) {
      const messages = value.filter((item): item is string => typeof item === "string");
      if (messages.length > 0) {
        normalized[field] = messages;
      }
    } else if (typeof value === "string" && value.trim()) {
      normalized[field] = [value];
    }
  }

  return Object.keys(normalized).length > 0 ? normalized : undefined;
}

function extractPayloadMessage(payload: unknown): string | null {
  if (typeof payload === "string" && payload.trim()) {
    return payload.trim();
  }
  if (!isRecord(payload)) {
    return null;
  }

  const candidate = payload as ErrorPayloadShape;
  if (typeof candidate.message === "string" && candidate.message.trim()) {
    return candidate.message.trim();
  }
  if (typeof candidate.detail === "string" && candidate.detail.trim()) {
    return candidate.detail.trim();
  }
  if (typeof candidate.error === "string" && candidate.error.trim()) {
    return candidate.error.trim();
  }
  return null;
}

function statusToCode(status: number): ApiErrorCode {
  if (status === 400) return "BAD_REQUEST";
  if (status === 401) return "UNAUTHORIZED";
  if (status === 403) return "FORBIDDEN";
  if (status === 404) return "NOT_FOUND";
  if (status === 409) return "CONFLICT";
  if (status === 422) return "VALIDATION_ERROR";
  if (status === 429) return "RATE_LIMITED";
  if (status >= 500) return "SERVER_ERROR";
  return "UNKNOWN_ERROR";
}

function defaultMessageForCode(code: ApiErrorCode): string {
  switch (code) {
    case "NETWORK_ERROR":
      return "Unable to reach the server. Check your internet connection and try again.";
    case "TIMEOUT":
      return "The request timed out. Please try again.";
    case "UNAUTHORIZED":
      return "Your session has expired. Please sign in again.";
    case "FORBIDDEN":
      return "You do not have permission to perform this action.";
    case "NOT_FOUND":
      return "The requested resource could not be found.";
    case "VALIDATION_ERROR":
      return "Please check the highlighted fields and try again.";
    case "CONFLICT":
      return "This action conflicts with the current state of the resource.";
    case "RATE_LIMITED":
      return "Too many requests. Please wait a moment and try again.";
    case "SERVER_ERROR":
      return "Something went wrong on our end. Please try again shortly.";
    case "BAD_REQUEST":
      return "The request could not be processed. Please review your input.";
    case "INVALID_RESPONSE":
      return "Received an unexpected response format from the server.";
    case "CONFIGURATION_ERROR":
      return "API base URL is not configured. Set SETTLE_AFRICA_BASE_URL in your environment.";
    case "CANCELLED":
      return "The request was cancelled.";
    default:
      return "An unexpected error occurred. Please try again.";
  }
}

export function normalizeApiError(error: unknown): ApiError {
  if (isApiError(error)) {
    return error;
  }

  if (axios.isCancel(error)) {
    return new ApiError({
      message: defaultMessageForCode("CANCELLED"),
      code: "CANCELLED",
      isRetryable: false,
      originalError: error,
    });
  }

  if (axios.isAxiosError(error)) {
    if (error.code === "ECONNABORTED" || error.code === "ETIMEDOUT") {
      return new ApiError({
        message: defaultMessageForCode("TIMEOUT"),
        code: "TIMEOUT",
        isRetryable: true,
        originalError: error,
      });
    }

    if (!error.response) {
      return new ApiError({
        message: defaultMessageForCode("NETWORK_ERROR"),
        code: "NETWORK_ERROR",
        isRetryable: true,
        originalError: error,
      });
    }

    const { status, data } = error.response;
    const code = statusToCode(status);
    const payloadRecord = isRecord(data) ? (data as ErrorPayloadShape) : undefined;
    const fieldErrors = extractFieldErrors(
      payloadRecord?.errors ?? payloadRecord?.fieldErrors,
    );
    const serverMessage = extractPayloadMessage(data);

    return new ApiError({
      message: serverMessage ?? defaultMessageForCode(code),
      code,
      status,
      fieldErrors,
      details: data,
      isRetryable: code === "RATE_LIMITED" || code === "SERVER_ERROR",
      originalError: error,
    });
  }

  if (error instanceof Error) {
    return new ApiError({
      message: error.message || defaultMessageForCode("UNKNOWN_ERROR"),
      code: "UNKNOWN_ERROR",
      isRetryable: false,
      originalError: error,
    });
  }

  return new ApiError({
    message: defaultMessageForCode("UNKNOWN_ERROR"),
    code: "UNKNOWN_ERROR",
    isRetryable: false,
    originalError: error,
  });
}

export function getErrorMessage(
  error: unknown,
  fallback = "An unexpected error occurred. Please try again.",
): string {
  const normalized = normalizeApiError(error);
  return normalized.message || fallback;
}
