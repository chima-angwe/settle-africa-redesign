import { useQuery, type UseQueryOptions } from "@tanstack/react-query";
import type { ApiError } from "@/shared/api";
import { sendMoneyKeys } from "../api/send-money.keys";
import { sendMoneyService } from "../api/send-money.service";
import type { AccountLookupResult } from "../api/send-money.types";

type UseAccountLookupOptions = Omit<
  UseQueryOptions<
    AccountLookupResult,
    ApiError,
    AccountLookupResult,
    ReturnType<typeof sendMoneyKeys.lookup>
  >,
  "queryKey" | "queryFn"
>;

export function useAccountLookup(
  actno: string,
  bankId: string,
  options?: UseAccountLookupOptions,
) {
  const cleanActNo = actno.trim();
  const cleanBankId = bankId.trim();

  return useQuery({
    queryKey: sendMoneyKeys.lookup(cleanActNo, cleanBankId),
    queryFn: ({ signal }) => sendMoneyService.lookupAccount(cleanActNo, cleanBankId, signal),
    enabled:
      cleanActNo.length >= 10 &&
      cleanBankId.length > 0 &&
      (options?.enabled ?? true),
    staleTime: 60 * 1000,
    retry: false,
    ...options,
  });
}
