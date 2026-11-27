import type { TransferStatus } from "@/entities/transfer";
import { ApiError } from "@/shared/api";
import type {
  TrackTransactionResponseDto,
  TrackTransactionResult,
} from "./track-transfer.types";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function asString(value: unknown): string {
  if (typeof value === "string") return value.trim();
  if (typeof value === "number" && Number.isFinite(value)) return String(value);
  return "";
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

export function mapTrackTransactionResponseToDomain(
  dto: unknown,
): TrackTransactionResult {
  if (!isRecord(dto) || typeof dto.status !== "string" || !isRecord(dto.data)) {
    throw new ApiError({
      message: "Unexpected track transaction response structure from server.",
      code: "INVALID_RESPONSE",
      details: dto,
    });
  }

  const typed = dto as unknown as TrackTransactionResponseDto;
  if (typed.status.trim().toLowerCase() !== "success") {
    throw new ApiError({
      message: asString(typed.message) || "Unable to track transaction.",
      code: "BAD_REQUEST",
      details: dto,
    });
  }

  const data = typed.data;
  const id = asString(data?.id);
  const rawStatus = asString(data?.status);
  const timestamp = asString(data?.timestamp) || asString(data?.statusdate);

  if (!id || !rawStatus) {
    throw new ApiError({
      message: "Incomplete tracking details returned by server.",
      code: "INVALID_RESPONSE",
      details: dto,
    });
  }

  const message =
    asString(data?.message) || asString(data?.reason) || asString(typed.message);

  return {
    id,
    status: normalizeStatus(rawStatus),
    rawStatus,
    timestamp,
    ...(message ? { message } : {}),
  };
}
