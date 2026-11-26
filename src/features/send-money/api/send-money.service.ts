import { apiClient, transferEndpoints } from "@/shared/api";
import {
  mapAccountLookupResponseToDomain,
  mapCombiCheckResponseToDomain,
  mapSendFundsResponseToDomain,
} from "./send-money.mapper";
import type {
  AccountLookupResponseDto,
  AccountLookupResult,
  CombiCheckRequest,
  CombiCheckResponseDto,
  CombiCheckResult,
  SendFundsRequest,
  SendFundsResponseDto,
  SendFundsResult,
} from "./send-money.types";

export const sendMoneyService = {
  sendFunds: async (payload: SendFundsRequest): Promise<SendFundsResult> => {
    const response = await apiClient.post<SendFundsResponseDto>(
      transferEndpoints.send,
      payload,
    );

    return mapSendFundsResponseToDomain(response.data);
  },
  lookupAccount: async (
    actno: string,
    bankId: string,
    signal?: AbortSignal,
  ): Promise<AccountLookupResult> => {
    const response = await apiClient.get<AccountLookupResponseDto>(
      transferEndpoints.lookup(actno, bankId),
      { signal },
    );

    return mapAccountLookupResponseToDomain(response.data);
  },
  checkCombination: async (
    payload: CombiCheckRequest,
    signal?: AbortSignal,
  ): Promise<CombiCheckResult> => {
    const response = await apiClient.post<CombiCheckResponseDto>(
      transferEndpoints.combicheck,
      payload,
      { signal },
    );

    return mapCombiCheckResponseToDomain(response.data);
  },
};
