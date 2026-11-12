import type { LinkedBankBalance, AirtimeOperator, AirtimeTransaction, DataPlan } from "./types";

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

export const DATA_PLANS_BY_CURRENCY: Record<string, DataPlan[]> = {
  NGN: [
    { id: "ngn-500mb-1d", dataAmount: "500 MB", validity: "1 day", price: 200, category: "Daily", note: "Quick browsing" },
    { id: "ngn-1.5gb-2d", dataAmount: "1.5 GB", validity: "2 days", price: 500, category: "Daily", note: "2-day social & web" },
    { id: "ngn-2.5gb-7d", dataAmount: "2.5 GB", validity: "7 days", price: 900, category: "Weekly", note: "Weekly starter" },
    { id: "ngn-6gb-7d", dataAmount: "6 GB", validity: "7 days", price: 1500, category: "Weekly", note: "Weekly streaming" },
    { id: "ngn-3gb-30d", dataAmount: "3 GB", validity: "30 days", price: 1200, category: "Monthly", note: "Monthly saver" },
    { id: "ngn-10gb-30d", dataAmount: "10 GB", validity: "30 days", price: 3500, category: "Monthly", note: "Popular monthly" },
    { id: "ngn-20gb-30d", dataAmount: "20 GB", validity: "30 days", price: 5500, category: "Monthly", note: "Work & stream" },
    { id: "ngn-40gb-30d", dataAmount: "40 GB", validity: "30 days", price: 10000, category: "Monthly", note: "Heavy data" },
  ],
  GHS: [
    { id: "ghs-500mb-1d", dataAmount: "500 MB", validity: "1 day", price: 5, category: "Daily", note: "Quick browsing" },
    { id: "ghs-1.5gb-3d", dataAmount: "1.5 GB", validity: "3 days", price: 12, category: "Daily", note: "3-day bundle" },
    { id: "ghs-3gb-7d", dataAmount: "3 GB", validity: "7 days", price: 25, category: "Weekly", note: "Weekly starter" },
    { id: "ghs-6gb-7d", dataAmount: "6 GB", validity: "7 days", price: 45, category: "Weekly", note: "Weekly streaming" },
    { id: "ghs-10gb-30d", dataAmount: "10 GB", validity: "30 days", price: 85, category: "Monthly", note: "Popular monthly" },
    { id: "ghs-25gb-30d", dataAmount: "25 GB", validity: "30 days", price: 180, category: "Monthly", note: "Heavy data" },
  ],
  KES: [
    { id: "kes-500mb-1d", dataAmount: "500 MB", validity: "1 day", price: 50, category: "Daily", note: "Quick browsing" },
    { id: "kes-1.5gb-1d", dataAmount: "1.5 GB", validity: "24 hours", price: 100, category: "Daily", note: "All-day data" },
    { id: "kes-3gb-7d", dataAmount: "3 GB", validity: "7 days", price: 250, category: "Weekly", note: "Weekly starter" },
    { id: "kes-7gb-7d", dataAmount: "7 GB", validity: "7 days", price: 500, category: "Weekly", note: "Weekly streaming" },
    { id: "kes-12gb-30d", dataAmount: "12 GB", validity: "30 days", price: 1000, category: "Monthly", note: "Popular monthly" },
    { id: "kes-30gb-30d", dataAmount: "30 GB", validity: "30 days", price: 2000, category: "Monthly", note: "Heavy data" },
  ],
  ZAR: [
    { id: "zar-500mb-1d", dataAmount: "500 MB", validity: "1 day", price: 19, category: "Daily", note: "Quick browsing" },
    { id: "zar-1.5gb-3d", dataAmount: "1.5 GB", validity: "3 days", price: 39, category: "Daily", note: "3-day bundle" },
    { id: "zar-3gb-7d", dataAmount: "3 GB", validity: "7 days", price: 69, category: "Weekly", note: "Weekly starter" },
    { id: "zar-6gb-7d", dataAmount: "6 GB", validity: "7 days", price: 119, category: "Weekly", note: "Weekly streaming" },
    { id: "zar-10gb-30d", dataAmount: "10 GB", validity: "30 days", price: 199, category: "Monthly", note: "Popular monthly" },
    { id: "zar-25gb-30d", dataAmount: "25 GB", validity: "30 days", price: 399, category: "Monthly", note: "Heavy data" },
  ],
  RWF: [
    { id: "rwf-500mb-1d", dataAmount: "500 MB", validity: "1 day", price: 500, category: "Daily", note: "Quick browsing" },
    { id: "rwf-1.5gb-3d", dataAmount: "1.5 GB", validity: "3 days", price: 1200, category: "Daily", note: "3-day bundle" },
    { id: "rwf-3gb-7d", dataAmount: "3 GB", validity: "7 days", price: 2500, category: "Weekly", note: "Weekly starter" },
    { id: "rwf-6gb-7d", dataAmount: "6 GB", validity: "7 days", price: 4500, category: "Weekly", note: "Weekly streaming" },
    { id: "rwf-10gb-30d", dataAmount: "10 GB", validity: "30 days", price: 8000, category: "Monthly", note: "Popular monthly" },
    { id: "rwf-25gb-30d", dataAmount: "25 GB", validity: "30 days", price: 15000, category: "Monthly", note: "Heavy data" },
  ],
  UGX: [
    { id: "ugx-500mb-1d", dataAmount: "500 MB", validity: "1 day", price: 1500, category: "Daily", note: "Quick browsing" },
    { id: "ugx-1.5gb-3d", dataAmount: "1.5 GB", validity: "3 days", price: 3500, category: "Daily", note: "3-day bundle" },
    { id: "ugx-3gb-7d", dataAmount: "3 GB", validity: "7 days", price: 6000, category: "Weekly", note: "Weekly starter" },
    { id: "ugx-7gb-7d", dataAmount: "7 GB", validity: "7 days", price: 12000, category: "Weekly", note: "Weekly streaming" },
    { id: "ugx-15gb-30d", dataAmount: "15 GB", validity: "30 days", price: 25000, category: "Monthly", note: "Popular monthly" },
    { id: "ugx-35gb-30d", dataAmount: "35 GB", validity: "30 days", price: 50000, category: "Monthly", note: "Heavy data" },
  ],
  EGP: [
    { id: "egp-1gb-1d", dataAmount: "1 GB", validity: "1 day", price: 15, category: "Daily", note: "Quick browsing" },
    { id: "egp-2.5gb-3d", dataAmount: "2.5 GB", validity: "3 days", price: 30, category: "Daily", note: "3-day bundle" },
    { id: "egp-5gb-7d", dataAmount: "5 GB", validity: "7 days", price: 55, category: "Weekly", note: "Weekly starter" },
    { id: "egp-10gb-7d", dataAmount: "10 GB", validity: "7 days", price: 95, category: "Weekly", note: "Weekly streaming" },
    { id: "egp-20gb-30d", dataAmount: "20 GB", validity: "30 days", price: 180, category: "Monthly", note: "Popular monthly" },
    { id: "egp-45gb-30d", dataAmount: "45 GB", validity: "30 days", price: 350, category: "Monthly", note: "Heavy data" },
  ],
};

export function getDataPlans(currency: string): DataPlan[] {
  return DATA_PLANS_BY_CURRENCY[currency] || DATA_PLANS_BY_CURRENCY.NGN;
}

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

