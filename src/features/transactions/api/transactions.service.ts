import type { Transfer } from "@/entities/transfer";
import { apiClient, transferEndpoints } from "@/shared/api";
import { mapTransactionHistoryResponseToDomain } from "./transactions.mapper";
import type { TransactionHistoryResponseDto } from "./transactions.types";

export const transactionsService = {
  getHistory: async (signal?: AbortSignal): Promise<Transfer[]> => {
    const response = await apiClient.get<TransactionHistoryResponseDto>(
      transferEndpoints.history,
      { signal },
    );

    return mapTransactionHistoryResponseToDomain(response.data);
  },
};
