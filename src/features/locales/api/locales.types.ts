export interface LocaleCurrencyDto {
  code?: unknown;
  name?: unknown;
  symbol?: unknown;
  rate?: unknown;
}

export interface LocaleMethodDto {
  id?: unknown;
  name?: unknown;
  type?: unknown;
  category?: unknown;
  fees?: unknown;
}

export interface LocaleCountryDto {
  id?: unknown;
  name?: unknown;
  iso?: unknown;
  iso3?: unknown;
  code?: unknown;
  currency?: LocaleCurrencyDto | null;
  methods?: LocaleMethodDto[] | null;
}

export interface LocalesResponseDto {
  status: string;
  message?: string;
  code?: string | number;
  data?: LocaleCountryDto[] | null;
}

export interface LocaleCurrency {
  code: string;
  name: string;
  symbol: string;
  rate: number;
}

export interface LocaleMethod {
  id: string;
  name: string;
  type: string;
  category: string;
  fees: number;
}

export interface LocaleCountry {
  id: string;
  name: string;
  iso: string;
  iso3: string;
  code: string;
  currency: LocaleCurrency;
  methods: LocaleMethod[];
}
