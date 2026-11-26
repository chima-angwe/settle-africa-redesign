import { useMutation } from "@tanstack/react-query";
import type { ApiError } from "@/shared/api";
import { authService } from "../api/auth.service";
import type {
  OtpStatusResult,
  RequestOtpRequest,
  VerifyOtpRequest,
} from "../api/auth.types";

export function useRequestOtp() {
  return useMutation<OtpStatusResult, ApiError, RequestOtpRequest>({
    mutationFn: (payload) => authService.requestOtp(payload),
  });
}

export function useVerifyOtp() {
  return useMutation<OtpStatusResult, ApiError, VerifyOtpRequest>({
    mutationFn: (payload) => authService.verifyOtp(payload),
  });
}
