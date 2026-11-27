import { apiClient, localesEndpoints } from "@/shared/api";
import { mapLocalesResponseToDomain } from "./locales.mapper";
import type { LocaleCountry, LocalesResponseDto } from "./locales.types";

export const localesService = {
  async getLocales(signal?: AbortSignal): Promise<LocaleCountry[]> {
    const { data } = await apiClient.get<LocalesResponseDto>(localesEndpoints.list, {
      signal,
    });
    return mapLocalesResponseToDomain(data);
  },
};
