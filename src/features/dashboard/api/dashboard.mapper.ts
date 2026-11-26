import { ApiError } from "@/shared/api";
import type {
  DashboardCentralDataDto,
  DashboardCentralResponseDto,
  DashboardSummary,
} from "./dashboard.types";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isValidCentralData(value: unknown): value is DashboardCentralDataDto {
  if (!isRecord(value)) {
    return false;
  }

  return (
    typeof value.limit === "number" &&
    Number.isFinite(value.limit) &&
    typeof value.today === "number" &&
    Number.isFinite(value.today) &&
    typeof value.thisweek === "number" &&
    Number.isFinite(value.thisweek) &&
    typeof value.fullname === "string" &&
    typeof value.phone === "string" &&
    typeof value.countryid === "string" &&
    typeof value.category === "string"
  );
}

export function mapDashboardCentralResponseToDomain(
  dto: unknown,
): DashboardSummary {
  if (
    !isRecord(dto) ||
    typeof dto.status !== "string" ||
    !isValidCentralData(dto.data)
  ) {
    throw new ApiError({
      message: "Unexpected dashboard response structure from server.",
      code: "INVALID_RESPONSE",
      details: dto,
    });
  }

  const typed = dto as unknown as DashboardCentralResponseDto;
  if (typed.status.trim().toLowerCase() !== "success") {
    throw new ApiError({
      message:
        typeof typed.message === "string" && typed.message.trim()
          ? typed.message.trim()
          : "Unable to load dashboard summary.",
      code: "BAD_REQUEST",
      details: dto,
    });
  }

  return {
    limit: typed.data.limit,
    today: typed.data.today,
    thisWeek: typed.data.thisweek,
    fullName: typed.data.fullname.trim(),
    phone: typed.data.phone.trim(),
    countryId: typed.data.countryid.trim(),
    category: typed.data.category.trim(),
    message:
      typeof typed.message === "string" && typed.message.trim()
        ? typed.message.trim()
        : undefined,
  };
}
