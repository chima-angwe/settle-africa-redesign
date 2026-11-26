import { ApiError } from "@/shared/api";
import type {
  LoginRequest,
  LoginResponseDto,
  LoginResult,
  OtpPurpose,
  OtpStatusResponseDto,
  OtpStatusResult,
  RegisterBusinessFormInput,
  RegisterBusinessRequest,
  RegisterIndividualFormInput,
  RegisterIndividualRequest,
  RegisterResponseDto,
  RegisterResult,
  RequestOtpRequest,
  VerifyOtpRequest,
} from "./auth.types";

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

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export function mapRegisterIndividualInputToRequest(
  input: RegisterIndividualFormInput,
): RegisterIndividualRequest {
  const normalizedCountry = input.country.trim();
  const normalizedIdCountry = (input.idCountry ?? input.country).trim();

  return {
    password: input.password,
    type: "individual",
    // TODO(api-contract): Confirm whether backend expects client-resolved IP or accepts locale/timezone hint.
    geoip: input.geoip?.trim() || resolveClientGeoIpHint(),
    country: normalizedCountry,
    identity: {
      name: input.name.trim(),
      meansofid: input.meansOfId.trim(),
      idno: input.idNumber.trim(),
      idfile: input.idFile,
      country: normalizedIdCountry,
      phone: input.phone.trim(),
    },
    authdata: {
      pin: input.pin.trim(),
    },
  };
}

export function mapRegisterBusinessInputToRequest(
  input: RegisterBusinessFormInput,
): RegisterBusinessRequest {
  const normalizedCountry = input.country.trim();
  const normalizedIdCountry = (input.idCountry ?? input.country).trim();
  const normalizedBusinessCountry = (
    input.businessCountry ?? input.country
  ).trim();

  return {
    type: "business",
    // TODO(api-contract): Confirm whether backend expects client-resolved IP or accepts locale/timezone hint.
    geoip: input.geoip?.trim() || resolveClientGeoIpHint(),
    country: normalizedCountry,
    password: input.password,
    identity: {
      name: input.name.trim(),
      meansofid: input.meansOfId.trim(),
      idno: input.idNumber.trim(),
      idfile: input.idFile,
      country: normalizedIdCountry,
      phone: input.phone.trim(),
    },
    business: {
      name: input.businessName.trim(),
      phone: input.businessPhone.trim(),
      address: input.businessAddress.trim(),
      meansofid: input.businessMeansOfId.trim(),
      idno: input.businessIdNumber.trim(),
      idfile: input.businessIdFile,
      country: normalizedBusinessCountry,
    },
    authdata: {
      pin: input.pin.trim(),
    },
  };
}

function isValidRegisterResponse(value: unknown): value is RegisterResponseDto {
  if (!isRecord(value)) {
    return false;
  }

  return (
    typeof value.status === "string" &&
    typeof value.vault === "string" &&
    typeof value.code === "string"
  );
}

export function mapRegisterResponseToDomain(dto: unknown): RegisterResult {
  if (!isValidRegisterResponse(dto)) {
    throw new ApiError({
      message: "Unexpected registration response structure from server.",
      code: "INVALID_RESPONSE",
      details: dto,
    });
  }

  if (dto.status.toLowerCase() !== "success") {
    throw new ApiError({
      message: "Registration did not complete successfully.",
      code: "BAD_REQUEST",
      details: dto,
    });
  }

  return {
    status: dto.status,
    vault: dto.vault,
    code: dto.code,
  };
}

export const mapRegisterIndividualResponseToDomain = mapRegisterResponseToDomain;

export function mapLoginInputToRequest(input: {
  phone: string;
  password: string;
}): LoginRequest {
  return {
    phone: input.phone.trim(),
    password: input.password,
  };
}

function isValidLoginResponse(value: unknown): value is LoginResponseDto {
  if (!isRecord(value) || !isRecord(value.data)) {
    return false;
  }

  return (
    typeof value.status === "string" &&
    typeof value.vault === "string" &&
    typeof value.message === "string" &&
    typeof value.code === "string" &&
    typeof value.data.phone === "string" &&
    typeof value.data.token === "string" &&
    typeof value.data.expiry === "string"
  );
}

export function mapLoginResponseToDomain(dto: unknown): LoginResult {
  if (!isValidLoginResponse(dto)) {
    throw new ApiError({
      message: "Unexpected login response structure from server.",
      code: "INVALID_RESPONSE",
      details: dto,
    });
  }

  if (dto.status.trim().toLowerCase() !== "success") {
    throw new ApiError({
      message: dto.message || "Unable to sign in with those credentials.",
      code: "BAD_REQUEST",
      details: dto,
    });
  }

  return {
    status: dto.status,
    message: dto.message,
    locale: typeof dto.locale === "string" ? dto.locale : undefined,
    authHeaders: {
      vault: dto.vault,
      code: dto.code,
      phone: dto.data.phone,
      token: dto.data.token,
      expiry: dto.data.expiry,
    },
  };
}

export function mapRequestOtpInputToRequest(input: {
  phone: string;
  purpose?: OtpPurpose;
}): RequestOtpRequest {
  return {
    phone: input.phone.trim(),
    purpose: input.purpose ?? "registration",
  };
}

export function mapVerifyOtpInputToRequest(input: {
  phone: string;
  otp: string;
}): VerifyOtpRequest {
  return {
    phone: input.phone.trim(),
    key: input.otp.trim(),
  };
}

function isValidOtpStatusResponse(
  value: unknown,
): value is OtpStatusResponseDto {
  if (!isRecord(value)) {
    return false;
  }

  return typeof value.status === "string" && typeof value.message === "string";
}

export function mapOtpStatusResponseToDomain(
  dto: unknown,
  fallbackErrorMessage = "OTP request did not complete successfully.",
): OtpStatusResult {
  if (!isValidOtpStatusResponse(dto)) {
    throw new ApiError({
      message: "Unexpected OTP response structure from server.",
      code: "INVALID_RESPONSE",
      details: dto,
    });
  }

  if (dto.status.toLowerCase() !== "success") {
    throw new ApiError({
      message: dto.message || fallbackErrorMessage,
      code: "BAD_REQUEST",
      details: dto,
    });
  }

  return {
    status: dto.status,
    message: dto.message,
  };
}
