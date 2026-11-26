import { apiClient, authEndpoints } from "@/shared/api";
import {
  mapLoginResponseToDomain,
  mapOtpStatusResponseToDomain,
  mapRegisterResponseToDomain,
} from "./auth.mapper";
import type {
  LoginRequest,
  LoginResponseDto,
  LoginResult,
  OtpStatusResponseDto,
  OtpStatusResult,
  RegisterBusinessRequest,
  RegisterBusinessResponseDto,
  RegisterBusinessResult,
  RegisterIndividualRequest,
  RegisterIndividualResponseDto,
  RegisterIndividualResult,
  RequestOtpRequest,
  VerifyOtpRequest,
} from "./auth.types";

export const authService = {
  login: async (payload: LoginRequest): Promise<LoginResult> => {
    const response = await apiClient.post<LoginResponseDto>(
      authEndpoints.login,
      payload,
      { skipUnauthorizedHandler: true },
    );

    return mapLoginResponseToDomain(response.data);
  },

  requestOtp: async (
    payload: RequestOtpRequest,
  ): Promise<OtpStatusResult> => {
    const response = await apiClient.post<OtpStatusResponseDto>(
      authEndpoints.requestOtp,
      payload,
      { skipUnauthorizedHandler: true },
    );

    return mapOtpStatusResponseToDomain(
      response.data,
      "Unable to send verification code.",
    );
  },

  verifyOtp: async (payload: VerifyOtpRequest): Promise<OtpStatusResult> => {
    const response = await apiClient.post<OtpStatusResponseDto>(
      authEndpoints.verifyOtp,
      payload,
      { skipUnauthorizedHandler: true },
    );

    return mapOtpStatusResponseToDomain(
      response.data,
      "Unable to verify code.",
    );
  },

  registerIndividual: async (
    payload: RegisterIndividualRequest,
  ): Promise<RegisterIndividualResult> => {
    const response = await apiClient.post<RegisterIndividualResponseDto>(
      authEndpoints.registerIndividual,
      payload,
      { skipUnauthorizedHandler: true },
    );

    return mapRegisterResponseToDomain(response.data);
  },

  registerBusiness: async (
    payload: RegisterBusinessRequest,
  ): Promise<RegisterBusinessResult> => {
    const response = await apiClient.post<RegisterBusinessResponseDto>(
      authEndpoints.registerBusiness,
      payload,
      { skipUnauthorizedHandler: true },
    );

    return mapRegisterResponseToDomain(response.data);
  },
};
