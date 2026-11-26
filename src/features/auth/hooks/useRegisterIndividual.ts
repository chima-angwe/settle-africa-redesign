import { useMutation } from "@tanstack/react-query";
import type { ApiError } from "@/shared/api";
import { authService } from "../api/auth.service";
import type {
  RegisterIndividualRequest,
  RegisterIndividualResult,
} from "../api/auth.types";

export function useRegisterIndividual() {
  return useMutation<
    RegisterIndividualResult,
    ApiError,
    RegisterIndividualRequest
  >({
    mutationFn: (payload) => authService.registerIndividual(payload),
  });
}
