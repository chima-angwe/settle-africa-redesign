import { useMutation } from "@tanstack/react-query";
import type { ApiError } from "@/shared/api";
import { authService } from "../api/auth.service";
import type {
  RegisterBusinessRequest,
  RegisterBusinessResult,
} from "../api/auth.types";

export function useRegisterBusiness() {
  return useMutation<RegisterBusinessResult, ApiError, RegisterBusinessRequest>(
    {
      mutationFn: (payload) => authService.registerBusiness(payload),
    },
  );
}
