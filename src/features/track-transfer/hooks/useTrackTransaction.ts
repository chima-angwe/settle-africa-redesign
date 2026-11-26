import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { ApiError } from "@/shared/api";
import { transactionKeys } from "@/features/transactions";
import { trackTransferService } from "../api/track-transfer.service";
import type {
  TrackTransactionRequest,
  TrackTransactionResult,
} from "../api/track-transfer.types";

export function useTrackTransaction() {
  const queryClient = useQueryClient();

  return useMutation<TrackTransactionResult, ApiError, TrackTransactionRequest>({
    mutationFn: (payload) => trackTransferService.trackTransaction(payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: transactionKeys.lists() });
    },
  });
}
