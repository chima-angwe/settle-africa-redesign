import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { ApiError } from "@/shared/api";
import { dashboardKeys } from "@/features/dashboard";
import { transactionKeys } from "@/features/transactions";
import { sendMoneyService } from "../api/send-money.service";
import type {
  SendFundsRequest,
  SendFundsResult,
} from "../api/send-money.types";

export function useSendFunds() {
  const queryClient = useQueryClient();

  return useMutation<SendFundsResult, ApiError, SendFundsRequest>({
    mutationFn: (payload) => sendMoneyService.sendFunds(payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: transactionKeys.lists() });
      void queryClient.invalidateQueries({ queryKey: dashboardKeys.central() });
    },
  });
}
