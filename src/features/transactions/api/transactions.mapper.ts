import { countryCurrencies } from "@/entities/country";
import type { Transfer, TransferStatus } from "@/entities/transfer";
import { ApiError } from "@/shared/api";
import type {
  TransactionHistoryItemDto,
  TransactionHistoryResponseDto,
} from "./transactions.types";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function normalizeStatus(rawStatus: string): TransferStatus {
  const clean = rawStatus.trim().toLowerCase();
  if (clean === "completed" || clean === "success" || clean === "settled") {
    return "Completed";
  }
  if (clean === "processing" || clean === "in_progress" || clean === "in progress") {
    return "Processing";
  }
  if (clean === "failed" || clean === "error" || clean === "declined") {
    return "Failed";
  }
  if (clean === "cancelled" || clean === "canceled") {
    return "Cancelled";
  }
  return "Pending";
}

function isValidTransactionItem(
  value: unknown,
): value is TransactionHistoryItemDto {
  if (!isRecord(value)) {
    return false;
  }

  return (
    typeof value.id === "string" &&
    typeof value.recipient === "string" &&
    typeof value.country === "string" &&
    typeof value.amount === "number" &&
    Number.isFinite(value.amount) &&
    typeof value.status === "string" &&
    typeof value.timestamp === "string"
  );
}

export function mapTransactionItemToDomain(dto: unknown): Transfer {
  if (!isValidTransactionItem(dto)) {
    throw new ApiError({
      message: "Unexpected transaction item structure from server.",
      code: "INVALID_RESPONSE",
      details: dto,
    });
  }

  const trimmedCountry = dto.country.trim();
  const inferredCurrency = countryCurrencies[trimmedCountry] || "NGN";

  return {
    id: dto.id.trim(),
    name: dto.recipient.trim(),
    country: trimmedCountry,
    amount: dto.amount,
    currency: inferredCurrency,
    status: normalizeStatus(dto.status),
    date: dto.timestamp.trim(),
  };
}

export function mapTransactionHistoryResponseToDomain(dto: unknown): Transfer[] {
  if (!isRecord(dto) || typeof dto.status !== "string" || !Array.isArray(dto.data)) {
    throw new ApiError({
      message: "Unexpected transaction history response structure from server.",
      code: "INVALID_RESPONSE",
      details: dto,
    });
  }

  const typed = dto as unknown as TransactionHistoryResponseDto;
  if (typed.status.trim().toLowerCase() !== "success") {
    throw new ApiError({
      message: "Unable to load transaction history.",
      code: "BAD_REQUEST",
      details: dto,
    });
  }

  return typed.data.map(mapTransactionItemToDomain);
}
