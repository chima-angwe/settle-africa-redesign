import type {
  LocaleCountry,
  LocaleCountryDto,
  LocaleCurrency,
  LocaleCurrencyDto,
  LocaleMethod,
  LocaleMethodDto,
  LocalesResponseDto,
} from "./locales.types";

const asString = (value: unknown, fallback = ""): string =>
  typeof value === "string" ? value.trim() : typeof value === "number" ? String(value) : fallback;

const asNumber = (value: unknown, fallback = 0): number => {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string") {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) return parsed;
  }
  return fallback;
};

const mapCurrency = (dto: LocaleCurrencyDto | null | undefined): LocaleCurrency => ({
  code: asString(dto?.code),
  name: asString(dto?.name),
  symbol: asString(dto?.symbol),
  rate: asNumber(dto?.rate, 0),
});

const mapMethod = (dto: LocaleMethodDto): LocaleMethod => ({
  id: asString(dto.id),
  name: asString(dto.name),
  type: asString(dto.type),
  category: asString(dto.category),
  fees: asNumber(dto.fees, 0),
});

export const mapLocaleCountryDtoToDomain = (dto: LocaleCountryDto): LocaleCountry => ({
  id: asString(dto.id),
  name: asString(dto.name),
  iso: asString(dto.iso),
  iso3: asString(dto.iso3),
  code: asString(dto.code),
  currency: mapCurrency(dto.currency),
  methods: Array.isArray(dto.methods) ? dto.methods.map(mapMethod).filter((m) => Boolean(m.id || m.name)) : [],
});

export const mapLocalesResponseToDomain = (response: LocalesResponseDto): LocaleCountry[] => {
  if (!response || response.status !== "success" || !Array.isArray(response.data)) {
    throw new Error(response?.message || "Invalid locales response from server.");
  }

  return response.data.map(mapLocaleCountryDtoToDomain).filter((c) => Boolean(c.name));
};

export const buildLocaleRateMap = (locales: readonly LocaleCountry[]): Record<string, number> => {
  const rates: Record<string, number> = {};
  for (const locale of locales) {
    const code = locale.currency.code.toUpperCase();
    if (code && locale.currency.rate > 0) {
      rates[code] = locale.currency.rate;
    }
  }
  return rates;
};
