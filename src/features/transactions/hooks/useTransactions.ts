import { useQuery } from "@tanstack/react-query";
import type { Transfer } from "@/entities/transfer";
import type { ApiError } from "@/shared/api";
import { transactionKeys } from "../api/transactions.keys";
import { transactionsService } from "../api/transactions.service";

export interface UseTransactionsOptions {
  enabled?: boolean;
  staleTime?: number;
}

export function useTransactions(options: UseTransactionsOptions = {}) {
  return useQuery<Transfer[], ApiError>({
    queryKey: transactionKeys.lists(),
    queryFn: ({ signal }) => transactionsService.getHistory(signal),
    enabled: options.enabled ?? true,
    staleTime: options.staleTime,
  });
}
