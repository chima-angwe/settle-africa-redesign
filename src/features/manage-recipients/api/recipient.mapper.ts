import type { Recipient } from "@/entities/recipient";
import { ApiError } from "@/shared/api";
import type {
  CreateRecipientRequest,
  RecipientDto,
  RecipientListResponseDto,
  RecipientListResult,
  UpdateRecipientRequest,
} from "./recipient.types";

function computeInitials(name: string): string {
  const parts = name
    .trim()
    .split(/\s+/)
    .filter(Boolean);

  if (parts.length === 0) {
    return "??";
  }

  return parts
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

function isValidRecipientDto(value: unknown): value is RecipientDto {
  if (typeof value !== "object" || value === null) {
    return false;
  }

  const candidate = value as Record<string, unknown>;
  const hasValidId =
    typeof candidate.id === "number" || typeof candidate.id === "string";

  return (
    hasValidId &&
    typeof candidate.name === "string" &&
    typeof candidate.country === "string" &&
    typeof candidate.method === "string" &&
    typeof candidate.account === "string"
  );
}

function normalizeRecipientId(rawId: number | string): number {
  if (typeof rawId === "number" && Number.isFinite(rawId)) {
    return rawId;
  }

  const numeric = Number(rawId);
  if (Number.isFinite(numeric)) {
    return numeric;
  }

  throw new ApiError({
    message: "Recipient payload returned an unsupported identifier format.",
    code: "INVALID_RESPONSE",
    details: { rawId },
  });
}

export function mapRecipientDtoToDomain(dto: unknown): Recipient {
  if (!isValidRecipientDto(dto)) {
    throw new ApiError({
      message: "Unexpected recipient response structure from server.",
      code: "INVALID_RESPONSE",
      details: dto,
    });
  }

  return {
    id: normalizeRecipientId(dto.id),
    name: dto.name.trim(),
    country: dto.country,
    method: dto.method,
    account: dto.account.trim(),
    initials: dto.initials?.trim() || computeInitials(dto.name),
    provider: dto.provider,
  };
}

export function mapRecipientListDtoToDomain(
  payload: unknown,
): RecipientListResult {
  if (Array.isArray(payload)) {
    const items = payload.map(mapRecipientDtoToDomain);
    return {
      items,
      total: items.length,
      page: 1,
      limit: items.length || 20,
    };
  }

  if (
    typeof payload === "object" &&
    payload !== null &&
    Array.isArray((payload as Partial<RecipientListResponseDto> & { items?: unknown }).items)
  ) {
    const paginated = payload as {
      items: unknown[];
      total?: unknown;
      page?: unknown;
      limit?: unknown;
    };
    const items = paginated.items.map(mapRecipientDtoToDomain);
    return {
      items,
      total: typeof paginated.total === "number" ? paginated.total : items.length,
      page: typeof paginated.page === "number" ? paginated.page : 1,
      limit:
        typeof paginated.limit === "number"
          ? paginated.limit
          : items.length || 20,
    };
  }

  throw new ApiError({
    message: "Unexpected recipients list response structure from server.",
    code: "INVALID_RESPONSE",
    details: payload,
  });
}

export function mapRecipientInputToCreateRequest(input: {
  name: string;
  country: string;
  method: string;
  account: string;
  provider?: string;
}): CreateRecipientRequest {
  return {
    name: input.name.trim(),
    country: input.country.trim(),
    method: input.method.trim(),
    account: input.account.trim(),
    ...(input.provider ? { provider: input.provider.trim() } : {}),
  };
}

export function mapRecipientInputToUpdateRequest(
  input: Partial<{
    name: string;
    country: string;
    method: string;
    account: string;
    provider: string;
  }>,
): UpdateRecipientRequest {
  return {
    ...(input.name !== undefined ? { name: input.name.trim() } : {}),
    ...(input.country !== undefined ? { country: input.country.trim() } : {}),
    ...(input.method !== undefined ? { method: input.method.trim() } : {}),
    ...(input.account !== undefined ? { account: input.account.trim() } : {}),
    ...(input.provider !== undefined ? { provider: input.provider.trim() } : {}),
  };
}
