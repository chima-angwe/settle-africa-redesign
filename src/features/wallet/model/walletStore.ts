import type { LinkedBankBalance, AirtimeOperator, AirtimeTransaction } from "./types";

export const COUNTRY_CURRENCY_MAP: Record<string, { code: string; symbol: string; prefix: string }> = {
  Nigeria: { code: "NGN", symbol: "₦", prefix: "+234" },
  Ghana: { code: "GHS", symbol: "GH₵", prefix: "+233" },
  Kenya: { code: "KES", symbol: "KSh", prefix: "+254" },
  "South Africa": { code: "ZAR", symbol: "R", prefix: "+27" },
  Rwanda: { code: "RWF", symbol: "FRw", prefix: "+250" },
  Uganda: { code: "UGX", symbol: "USh", prefix: "+256" },
  Egypt: { code: "EGP", symbol: "E£", prefix: "+20" },
};

export const COUNTRY_OPERATORS: Record<string, AirtimeOperator[]> = {
  Nigeria: [
    { name: "MTN", code: "mtn" },
    { name: "Airtel", code: "airtel" },
    { name: "Glo", code: "glo" },
    { name: "Etisalat", code: "etisalat" },
  ],
  Ghana: [
    { name: "MTN", code: "mtn" },
    { name: "Telecel", code: "telecel" },
    { name: "AT", code: "at" },
  ],
  Kenya: [
    { name: "Safaricom", code: "safaricom" },
    { name: "Airtel", code: "airtel" },
    { name: "Telkom", code: "telkom" },
  ],
  "South Africa": [
    { name: "Vodacom", code: "vodacom" },
    { name: "MTN", code: "mtn" },
    { name: "Cell C", code: "cellc" },
    { name: "Telkom", code: "telkom" },
  ],
  Rwanda: [
    { name: "MTN", code: "mtn" },
    { name: "Airtel", code: "airtel" },
  ],
  Uganda: [
    { name: "MTN", code: "mtn" },
    { name: "Airtel", code: "airtel" },
  ],
  Egypt: [
    { name: "Vodafone", code: "vodafone" },
    { name: "Orange", code: "orange" },
    { name: "Etisalat", code: "etisalat" },
    { name: "WE", code: "we" },
  ],
};

export const PRESET_AMOUNTS: Record<string, number[]> = {
  NGN: [50, 100, 200, 500, 1000],
  KES: [50, 100, 250, 500, 1000],
  GHS: [5, 10, 20, 50, 100],
  ZAR: [20, 50, 100, 200, 500],
  RWF: [500, 1000, 2000, 5000, 10000],
  UGX: [1000, 2000, 5000, 10000, 20000],
  EGP: [10, 20, 50, 100, 200],
};

export const INITIAL_WALLET_BANKS: LinkedBankBalance[] = [];

export const INITIAL_AIRTIME_HISTORY: AirtimeTransaction[] = [];

const LINKED_BANKS_STORAGE_KEY = "settle-demo-linked-banks";
const LINKED_BANKS_RESET_KEY = "settle-demo-linked-banks-empty-v1";
const AIRTIME_HISTORY_STORAGE_KEY = "settle-demo-airtime-history";

export function loadLinkedBankBalances(defaultCountry = "Nigeria"): LinkedBankBalance[] {
  try {
    if (localStorage.getItem(LINKED_BANKS_RESET_KEY) !== "true") {
      localStorage.setItem(LINKED_BANKS_RESET_KEY, "true");
      localStorage.setItem(LINKED_BANKS_STORAGE_KEY, "[]");
      return [];
    }
    const raw = localStorage.getItem(LINKED_BANKS_STORAGE_KEY);
    const countryData = COUNTRY_CURRENCY_MAP[defaultCountry] || COUNTRY_CURRENCY_MAP.Nigeria;
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        return parsed.map((item, idx) => ({
          id: item.id || `lb-${Date.now()}-${idx}`,
          bank: item.bank,
          account: String(item.account).replace(/\D/g, "").slice(-4) || "6789",
          mandateRef: item.mandateRef || `MND-${10000 + idx * 420}-NIP`,
          isDefault: item.isDefault ?? idx === 0,
          country: item.country || defaultCountry,
          balance: typeof item.balance === "number" ? item.balance : 350000,
          currency: item.currency || countryData.code,
        }));
      }
    }
  } catch {
    // fallback
  }

  localStorage.setItem(LINKED_BANKS_STORAGE_KEY, "[]");
  return [];
}

export function saveLinkedBankBalances(banks: LinkedBankBalance[]): void {
  try {
    localStorage.setItem(LINKED_BANKS_STORAGE_KEY, JSON.stringify(banks));
    window.dispatchEvent(new Event("settle-wallet-updated"));
  } catch {
    // ignore
  }
}

export function loadAirtimeHistory(): AirtimeTransaction[] {
  try {
    const raw = localStorage.getItem(AIRTIME_HISTORY_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch {
    // fallback
  }
  localStorage.setItem(AIRTIME_HISTORY_STORAGE_KEY, JSON.stringify(INITIAL_AIRTIME_HISTORY));
  return INITIAL_AIRTIME_HISTORY;
}

export function saveAirtimeHistory(history: AirtimeTransaction[]): void {
  try {
    localStorage.setItem(AIRTIME_HISTORY_STORAGE_KEY, JSON.stringify(history));
    window.dispatchEvent(new Event("settle-airtime-updated"));
  } catch {
    // ignore
  }
}

export function formatCurrencyValue(amount: number, currency = "NGN"): string {
  const meta = Object.values(COUNTRY_CURRENCY_MAP).find((m) => m.code === currency);
  const symbol = meta ? meta.symbol : currency + " ";
  return `${symbol}${amount.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

