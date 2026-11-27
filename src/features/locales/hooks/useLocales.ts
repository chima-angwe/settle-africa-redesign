import { useQuery, type UseQueryOptions } from "@tanstack/react-query";
import type { ApiError } from "@/shared/api";
import { localesKeys } from "../api/locales.keys";
import { localesService } from "../api/locales.service";
import type { LocaleCountry } from "../api/locales.types";

type UseLocalesOptions = Omit<
  UseQueryOptions<LocaleCountry[], ApiError, LocaleCountry[], ReturnType<typeof localesKeys.list>>,
  "queryKey" | "queryFn"
>;

export function useLocales(options?: UseLocalesOptions) {
  return useQuery({
    queryKey: localesKeys.list(),
    queryFn: ({ signal }) => localesService.getLocales(signal),
    staleTime: 5 * 60 * 1000,
    ...options,
  });
}
