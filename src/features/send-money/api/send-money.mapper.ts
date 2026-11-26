import type { TransferStatus } from "@/entities/transfer";
import { ApiError } from "@/shared/api";
import type {
  AccountLookupResponseDto,
  AccountLookupResult,
  CombiCheckResponseDto,
  CombiCheckResult,
  SendFundsFormInput,
  SendFundsPayTo,
  SendFundsRequest,
  SendFundsResponseDataDto,
  SendFundsResponseDto,
  SendFundsResult,
} from "./send-money.types";

function resolveClientGeoIpHint(): string {
  try {
    const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    if (timeZone && timeZone.trim()) {
      return timeZone.trim();
    }
  } catch {
    // ignore
  }
  return "unknown";
}

function mapSchedulePayload(
  schedule: SendFundsFormInput["schedule"],
): SendFundsRequest["whentosend"] {
  if (!schedule.enabled || schedule.mode === "now") {
    return { type: "now", date: "" };
  }

  if (schedule.mode === "later") {
    return {
      type: "schedule later",
      date: schedule.date.trim(),
    };
  }

  return {
    type: "recurring",
    date: schedule.date.trim(),
  };
}

function mapInstrumentPayload(
  input: SendFundsFormInput,
): SendFundsRequest["instrument"] {
  if (input.paymentMethod === "card") {
    return {
      type: "card",
      number: input.cardNumber.replace(/\D/g, ""),
      expiry: input.cardExpiry.trim(),
      cvv: input.cardCvv.trim(),
    };
  }

  if (input.paymentMethod === "mobile") {
    return {
      type: "mobile",
      number: input.senderPhone.trim(),
      expiry: "",
      cvv: "",
    };
  }

  return {
    type: "bank",
    number: input.bankAccountNumber.trim(),
    expiry: "",
    cvv: "",
  };
}

export function mapSendFundsInputToRequest(
  input: SendFundsFormInput,
): SendFundsRequest {
  const numericPin = Number(input.pin.replace(/\D/g, ""));
  const numericMeansId =
    typeof input.meansId === "number" && Number.isFinite(input.meansId)
      ? input.meansId
      : 0;

  return {
    amount: input.amount,
    narration:
      input.narration.trim() || `Transfer to ${input.recipientName.trim()}`,
    whentosend: mapSchedulePayload(input.schedule),
    destination: {
      country: input.targetCountry.trim(),
      name: input.recipientName.trim(),
      category: input.recipientCategory,
      means: input.bankName.trim(),
      meansid: numericMeansId,
      method: input.payoutMethod,
      details: {
        phone: input.recipientPhone.trim(),
        mail: input.recipientEmail.trim(),
        address: input.recipientAddress.trim(),
      },
    },
    instrument: mapInstrumentPayload(input),
    // TODO(api-contract): Confirm whether geoip is resolved server-side or expects IP string.
    geoip: input.geoip?.trim() || resolveClientGeoIpHint(),
    authdata: {
      pin: Number.isFinite(numericPin) ? numericPin : 0,
      otp: input.otp?.trim() ?? "",
      biotoken: input.biotoken?.trim() ?? "",
    },
    // TODO(api-contract): Signature is handled/verified server-side per backend spec.
    signature: "",
  };
}

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

function normalizeTransferStatus(rawStatus: string): TransferStatus {
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

function mapPayTo(value: unknown): SendFundsPayTo | undefined {
  if (!isRecord(value)) return undefined;
  const bankName = asString(value.bankname);
  const accountNumber = asString(value.accountno);
  const accountName = asString(value.accountname);
  if (!bankName && !accountNumber && !accountName) return undefined;
  return { bankName, accountNumber, accountName };
}

function isValidSendFundsData(
  value: unknown,
): value is SendFundsResponseDataDto {
  if (!isRecord(value)) {
    return false;
  }

  const reference = asString(value.id) || asString(value.reference);
  const amount = asFiniteNumber(value.amount);
  return Boolean(reference) && amount !== null;
}

export function mapSendFundsResponseToDomain(dto: unknown): SendFundsResult {
  if (
    !isRecord(dto) ||
    typeof dto.status !== "string" ||
    typeof dto.message !== "string" ||
    !isValidSendFundsData(dto.data)
  ) {
    throw new ApiError({
      message: "Unexpected transfer response structure from server.",
      code: "INVALID_RESPONSE",
      details: dto,
    });
  }

  const typed = dto as unknown as SendFundsResponseDto;
  if (typed.status.trim().toLowerCase() !== "success") {
    throw new ApiError({
      message: typed.message || "Transfer could not be completed.",
      code: "BAD_REQUEST",
      details: dto,
    });
  }

  const data = typed.data;
  const destination = isRecord(data.destination) ? data.destination : undefined;
  const rawStatus = asString(data.status) || "pending";
  const reference = asString(data.id) || asString(data.reference);
  const amount = asFiniteNumber(data.amount) ?? 0;
  const recipient = asString(data.recipient) || asString(destination?.name);
  const bank = asString(data.bank) || asString(destination?.means);
  const statusDate = asString(data.statusdate);
  const payTo = mapPayTo(data.payto);

  return {
    status: typed.status,
    transactionStatus: normalizeTransferStatus(rawStatus),
    rawStatus,
    message: typed.message,
    reference,
    amount,
    recipient,
    bank,
    statusDate,
    payTo,
  };
}

export function mapAccountLookupResponseToDomain(dto: unknown): AccountLookupResult {
  if (!isRecord(dto) || typeof dto.status !== "string" || !isRecord(dto.data)) {
    throw new ApiError({
      message: "Unexpected account lookup response structure from server.",
      code: "INVALID_RESPONSE",
      details: dto,
    });
  }

  const typed = dto as unknown as AccountLookupResponseDto;
  if (typed.status.trim().toLowerCase() !== "success") {
    throw new ApiError({
      message: typed.message || "Could not verify recipient account.",
      code: "BAD_REQUEST",
      details: dto,
    });
  }

  const name = typeof typed.data?.name === "string" ? typed.data.name.trim() : "";
  if (!name) {
    throw new ApiError({
      message: typed.message || "Account name was not returned by server.",
      code: "NOT_FOUND",
      details: dto,
    });
  }

  return { name };
}

export function mapCombiCheckResponseToDomain(dto: unknown): CombiCheckResult {
  if (!isRecord(dto) || typeof dto.status !== "string" || !isRecord(dto.data)) {
    throw new ApiError({
      message: "Unexpected combination check response structure from server.",
      code: "INVALID_RESPONSE",
      details: dto,
    });
  }

  const typed = dto as unknown as CombiCheckResponseDto;
  if (typed.status.trim().toLowerCase() !== "success") {
    throw new ApiError({
      message: asString(typed.message) || "Unable to verify transfer combination.",
      code: "BAD_REQUEST",
      details: dto,
    });
  }

  const data = typed.data;
  if (!data || typeof data.allowed !== "boolean") {
    throw new ApiError({
      message: "Invalid combination check result returned by server.",
      code: "INVALID_RESPONSE",
      details: dto,
    });
  }

  const fee = asFiniteNumber(data.fee);
  if (data.allowed && fee === null) {
    throw new ApiError({
      message: "Transfer fee was not returned by server.",
      code: "INVALID_RESPONSE",
      details: dto,
    });
  }

  const message =
    asString(data.message) || asString(data.reason) || asString(typed.message);

  return {
    allowed: data.allowed,
    fee: fee !== null ? Math.max(0, fee) : 0,
    ...(message ? { message } : {}),
  };
}
