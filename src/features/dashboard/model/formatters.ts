import { countryCurrencies } from "@/entities/country";

const CURRENCY_SYMBOLS: Record<string, string> = {
  NGN: "₦",
  GHS: "GH₵",
  KES: "KSh ",
  ZAR: "R ",
  RWF: "FRw ",
  UGX: "USh ",
  EGP: "E£ ",
  TZS: "TSh ",
  XOF: "CFA ",
  XAF: "CFA ",
  USD: "$",
  EUR: "€",
  GBP: "£",
};

export function formatDashboardCurrency(
  amount: number,
  countryId: string,
  fractionDigits = 2,
): string {
  const code = countryCurrencies[countryId] || "NGN";
  const symbol = CURRENCY_SYMBOLS[code] ?? `${code} `;
  return `${symbol}${amount.toLocaleString(undefined, {
    minimumFractionDigits: fractionDigits,
    maximumFractionDigits: fractionDigits,
  })}`;
}
