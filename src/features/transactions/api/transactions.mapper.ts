import { countryCodes, countryCurrencies } from "@/entities/country";
import type { Transfer, TransferStatus } from "@/entities/transfer";
import { ApiError } from "@/shared/api";
import type {
  TransactionDestinationDto,
  TransactionHistoryItemDto,
  TransactionHistoryResponseDto,
} from "./transactions.types";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function asString(value: unknown): string {
  if (typeof value === "string") return value.trim();
  if (typeof value === "number" && Number.isFinite(value)) return String(value);
  return "";
}

function asFiniteNumber(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim()) {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) return parsed;
  }
  return null;
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

function normalizeMethodLabel(rawMethod: string): string | undefined {
  const clean = rawMethod.trim().toLowerCase();
  if (!clean) return undefined;
  if (clean === "bank" || clean.includes("bank")) return "Bank transfer";
  if (clean === "mobile" || clean.includes("mobile") || clean.includes("wallet")) {
    return "Mobile money";
  }
  if (clean === "cash" || clean.includes("cash") || clean.includes("pickup")) {
    return "Cash pickup";
  }
  return rawMethod.trim();
}

function parseDestination(rawDestination: unknown): TransactionDestinationDto | null {
  if (isRecord(rawDestination)) {
    return rawDestination as TransactionDestinationDto;
  }
  if (typeof rawDestination === "string" && rawDestination.trim()) {
    try {
      const parsed: unknown = JSON.parse(rawDestination);
      if (isRecord(parsed)) {
        return parsed as TransactionDestinationDto;
      }
    } catch {
      return null;
    }
  }
  return null;
}

function inferCurrencyFromLocale(locale: string | undefined): string | null {
  if (!locale) return null;
  const parts = locale.trim().split(/[-_]/);
  const region = parts.length > 1 ? parts[parts.length - 1].toUpperCase() : "";
  if (!region) return null;
  const matchedCountry = Object.entries(countryCodes).find(
    ([, code]) => code.toUpperCase() === region,
  )?.[0];
  return matchedCountry ? (countryCurrencies[matchedCountry] ?? null) : null;
}

function isValidTransactionItem(
  value: unknown,
): value is TransactionHistoryItemDto {
  if (!isRecord(value)) {
    return false;
  }

  return (
    Boolean(asString(value.id)) &&
    asFiniteNumber(value.amount) !== null &&
    Boolean(asString(value.status)) &&
    Boolean(asString(value.statusdate) || asString(value.timestamp))
  );
}

export function mapTransactionItemToDomain(
  dto: unknown,
  defaultCurrency = "NGN",
): Transfer {
  if (!isValidTransactionItem(dto)) {
    throw new ApiError({
      message: "Unexpected transaction item structure from server.",
      code: "INVALID_RESPONSE",
      details: dto,
    });
  }

  const destination = parseDestination(dto.destination);
  const trimmedCountry =
    asString(dto.country) || asString(destination?.country) || "Unknown";
  const recipientName =
    asString(dto.recipient) || asString(destination?.name) || "Recipient";
  const amount = asFiniteNumber(dto.amount) ?? 0;
  const date = asString(dto.statusdate) || asString(dto.timestamp);
  const provider = asString(destination?.means) || undefined;
  const method = normalizeMethodLabel(asString(destination?.method));
  const recipientPhone = isRecord(destination?.details)
    ? asString(destination.details.phone) || undefined
    : undefined;
  const explicitCurrency = asString(dto.currency).toUpperCase();
  const currency = explicitCurrency || defaultCurrency;
  const recipientCurrency = countryCurrencies[trimmedCountry];

  return {
    id: asString(dto.id),
    name: recipientName,
    country: trimmedCountry,
    amount,
    currency,
    status: normalizeStatus(asString(dto.status)),
    date,
    ...(provider ? { provider } : {}),
    ...(method ? { method } : {}),
    ...(recipientCurrency ? { recipientCurrency } : {}),
    ...(recipientPhone ? { recipientPhone } : {}),
  };
}

export function mapTransactionHistoryResponseToDomain(dto: unknown): Transfer[] {
  if (!isRecord(dto) || typeof dto.status !== "string") {
    throw new ApiError({
      message: "Unexpected transaction history response structure from server.",
      code: "INVALID_RESPONSE",
      details: dto,
    });
  }

  const typed = dto as unknown as TransactionHistoryResponseDto;
  if (typed.status.trim().toLowerCase() !== "success") {
    throw new ApiError({
      message: typed.message || "Unable to load transaction history.",
      code: "BAD_REQUEST",
      details: dto,
    });
  }

  const rawItems = Array.isArray(typed.data)
    ? typed.data
    : isRecord(typed.data) && Array.isArray(typed.data.transactions)
      ? typed.data.transactions
      : null;

  if (!rawItems) {
    throw new ApiError({
      message: "Unexpected transaction history response structure from server.",
      code: "INVALID_RESPONSE",
      details: dto,
    });
  }

  const defaultCurrency = inferCurrencyFromLocale(typed.locale) || "NGN";
  return rawItems.map((item) => mapTransactionItemToDomain(item, defaultCurrency));
}
