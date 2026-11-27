import { useQuery, type UseQueryOptions } from "@tanstack/react-query";
import type { ApiError } from "@/shared/api";
import { sendMoneyKeys } from "../api/send-money.keys";
import { sendMoneyService } from "../api/send-money.service";
import type { CombiCheckRequest, CombiCheckResult } from "../api/send-money.types";

type UseCombiCheckOptions = Omit<
  UseQueryOptions<
    CombiCheckResult,
    ApiError,
    CombiCheckResult,
    ReturnType<typeof sendMoneyKeys.combiCheck>
  >,
  "queryKey" | "queryFn"
>;

export function useCombiCheck(
  payload: CombiCheckRequest,
  options?: UseCombiCheckOptions,
) {
  const cleanAmount = payload.amount.trim();
  const numericAmount = Number(cleanAmount);
  const cleanCountry = payload.destination.country.trim();
  const cleanCategory = payload.destination.category.trim();
  const cleanMeans = payload.destination.means.trim();
  const cleanInstrumentType = payload.instrument.type.trim();

  const isPayloadValid =
    cleanAmount.length > 0 &&
    Number.isFinite(numericAmount) &&
    numericAmount > 0 &&
    cleanCountry.length > 0 &&
    cleanCategory.length > 0 &&
    cleanMeans.length > 0 &&
    cleanInstrumentType.length > 0;

  return useQuery({
    queryKey: sendMoneyKeys.combiCheck({
      amount: cleanAmount,
      country: cleanCountry,
      category: cleanCategory,
      means: cleanMeans,
      instrumentType: cleanInstrumentType,
    }),
    queryFn: ({ signal }) =>
      sendMoneyService.checkCombination(
        {
          amount: cleanAmount,
          destination: {
            country: cleanCountry,
            category: cleanCategory,
            means: cleanMeans,
          },
          instrument: {
            type: cleanInstrumentType,
          },
        },
        signal,
      ),
    enabled: isPayloadValid && (options?.enabled ?? true),
    staleTime: 30 * 1000,
    retry: false,
    ...options,
  });
}
