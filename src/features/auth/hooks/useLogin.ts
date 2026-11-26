import { useMutation } from "@tanstack/react-query";
import type { ApiError } from "@/shared/api";
import { authService } from "../api/auth.service";
import type { LoginRequest, LoginResult } from "../api/auth.types";

export function useLogin() {
  return useMutation<LoginResult, ApiError, LoginRequest>({
    mutationFn: (payload) => authService.login(payload),
  });
}
