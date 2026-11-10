/**
 * Technical Data & FX Engine Specification for Settle Africa
 * Flow 1: Personal Remittance (send-money)
 * Flow 2: Business Pass-Through Treasury Engine
 * Flow 3: Bulk Batch Payout Engine
 */

// ==========================================
// 1. Storage Keys (Section 7)
// ==========================================
export const STORAGE_KEYS = {
  FUNDING_SOURCES: "settle_africa_funding_sources",
  ACCOUNT_TYPE: "settle_africa_account_type",
  BENEFICIARIES: "settle_africa_beneficiaries",
  PREV_FX_RATES: "settle_africa_prev_fx_rates",
  LINKED_BANKS: "settle-demo-linked-banks",
  LEGACY_BENEFICIARIES: "settle-demo-recipients",
} as const;

// ==========================================
// 2. Constants & Cost Models (Section 2 & 3)
// ==========================================
export const FEE_RATE = 0.01; // Flat 1% (0.01) for personal remittance
export const PROCESSING_DURATION_MS = 4000; // 4000ms async simulation
export const SUCCESS_PROBABILITY = 0.90; // 90% success, 10% failed
export const SETTLEMENT_SLA = "Instant clearing < 90s";

// ==========================================
// 3. FX Engine: Currency Triangulation (Section 2.1)
// ==========================================

/**
 * All live exchange rates are keyed against a common baseline (USD):
 * LiveRate[C] = Units of Currency C per 1 USD
 */
export const LIVE_RATES_USD: Record<string, number> = {
  USD: 1.0,
  NGN: 1550.0,
  KES: 129.0,
  ZAR: 18.2,
  GHS: 15.2,
  XOF: 610.0,
  EGP: 48.5,
  RWF: 1370.0,
  UGX: 3720.0,
  TZS: 2670.0,
  EUR: 0.92,
  GBP: 0.79,
};

/**
 * Fallback static lookup table indexed against NGN:
 * FallbackToNGN[C] = NGN equivalent per 1 unit of Currency C
 */
export const FALLBACK_TO_NGN: Record<string, number> = {
  NGN: 1.0,
  USD: 1550.0,
  EUR: 1680.0,
  GBP: 1960.0,
  KES: 11.4,
  GHS: 104.0,
  UGX: 0.41,
  ZAR: 85.0,
  XOF: 2.54,
  RWF: 1.13,
  EGP: 32.0,
  TZS: 0.58,
};

/**
 * Currency Triangulation:
 * When converting from Source Currency (S) to Target Currency (T):
 * ExchangeRate(S -> T) = LiveRate[T] / LiveRate[S]
 * FallbackRate(S -> T) = FallbackToNGN[S] / FallbackToNGN[T]
 */
export function getExchangeRate(
  source: string,
  target: string,
  liveRates: Record<string, number> = LIVE_RATES_USD,
  fallbackRates: Record<string, number> = FALLBACK_TO_NGN
): number {
  if (source === target) return 1.0;

  const liveSource = liveRates[source];
  const liveTarget = liveRates[target];

  if (liveSource && liveTarget && liveSource > 0) {
    return liveTarget / liveSource;
  }

  // Fallback triangulation indexed against NGN
  const fallbackSource = fallbackRates[source];
  const fallbackTarget = fallbackRates[target];

  if (fallbackSource && fallbackTarget && fallbackTarget > 0) {
    return fallbackSource / fallbackTarget;
  }

  return 1.0;
}

/**
 * Personal Remittance Cost Calculation (Section 2.2):
 * FeeAmount = Amount_source * 0.01
 * TotalDebit = Amount_source + FeeAmount
 * RecipientReceives = Amount_source * ExchangeRate(S -> T)
 */
export interface PersonalRemittanceCalculation {
  amount: number;
  feeAmount: number;
  totalDebit: number;
  exchangeRate: number;
  recipientReceives: number;
  sourceCurrency: string;
  targetCurrency: string;
}

export function calculatePersonalRemittance(
  amount: number,
  sourceCurrency: string,
  targetCurrency: string,
  customExchangeRate?: number
): PersonalRemittanceCalculation {
  const safeAmount = Math.max(0, isNaN(amount) ? 0 : amount);
  const rate = customExchangeRate ?? getExchangeRate(sourceCurrency, targetCurrency);
  const feeAmount = safeAmount * FEE_RATE;
  const totalDebit = safeAmount + feeAmount;
  const recipientReceives = safeAmount * rate;

  return {
    amount: safeAmount,
    feeAmount,
    totalDebit,
    exchangeRate: rate,
    recipientReceives,
    sourceCurrency,
    targetCurrency,
  };
}

/**
 * Corporate Pass-Through Cost Calculation (Section 2.3):
 * FeeUSD = Amount_USD * (FeePercent / 100)
 * DisbursedLocalAmount = Amount_USD * FxRateToUSD[T]
 */
export function calculateCorporateFee(
  amountUsd: number,
  feePercent: number,
  targetCurrency: string
) {
  const feeUsd = amountUsd * (feePercent / 100);
  const fxRate = LIVE_RATES_USD[targetCurrency] || 1;
  const disbursedLocalAmount = amountUsd * fxRate;
  return { feeUsd, totalDebitUsd: amountUsd + feeUsd, disbursedLocalAmount };
}

// ==========================================
// 4. Primary Payout Clearing Rails Matrix (Section 6)
// ==========================================
export interface CorridorClearingRail {
  country: string;
  currency: string;
  payoutRailType: "Local Bank" | "Mobile Money" | "Mobile Money / Bank";
  settlementRailProtocol: string;
  flagCode: string;
  sla: string;
}

export const CLEARING_RAILS_MATRIX: Record<string, CorridorClearingRail> = {
  NGN: {
    country: "Nigeria",
    currency: "NGN",
    payoutRailType: "Local Bank",
    settlementRailProtocol: "NIP Instant Interbank / NIBSS Direct Debit",
    flagCode: "ng",
    sla: "< 90s instant clearing",
  },
  KES: {
    country: "Kenya",
    currency: "KES",
    payoutRailType: "Mobile Money / Bank",
    settlementRailProtocol: "Safaricom M-Pesa B2C API / PesaLink RTGS",
    flagCode: "ke",
    sla: "< 60s real-time settlement",
  },
  GHS: {
    country: "Ghana",
    currency: "GHS",
    payoutRailType: "Local Bank",
    settlementRailProtocol: "GhIPSS Instant Pay (GIP) / Ecobank API",
    flagCode: "gh",
    sla: "< 90s instant clearing",
  },
  ZAR: {
    country: "South Africa",
    currency: "ZAR",
    payoutRailType: "Local Bank",
    settlementRailProtocol: "SARB PayShap / Real-Time Clearing (RTC)",
    flagCode: "za",
    sla: "< 30s PayShap instant",
  },
  XOF: {
    country: "Francophone WA",
    currency: "XOF",
    payoutRailType: "Local Bank",
    settlementRailProtocol: "BCEAO STAR-UEMOA / Wave / Orange Money",
    flagCode: "ci",
    sla: "< 2 mins direct clearing",
  },
  RWF: {
    country: "Rwanda",
    currency: "RWF",
    payoutRailType: "Local Bank",
    settlementRailProtocol: "Bank of Kigali Direct / RSwitch / MTN MoMo",
    flagCode: "rw",
    sla: "< 90s instant clearing",
  },
  UGX: {
    country: "Uganda",
    currency: "UGX",
    payoutRailType: "Mobile Money / Bank",
    settlementRailProtocol: "Bank of Uganda ACH / MTN / Airtel Money",
    flagCode: "ug",
    sla: "< 90s instant clearing",
  },
  EGP: {
    country: "Egypt",
    currency: "EGP",
    payoutRailType: "Local Bank",
    settlementRailProtocol: "IPN Instant Payment Network / Meeza",
    flagCode: "eg",
    sla: "< 60s IPN clearing",
  },
  TZS: {
    country: "Tanzania",
    currency: "TZS",
    payoutRailType: "Mobile Money / Bank",
    settlementRailProtocol: "TIPS Instant Payment / Vodacom M-Pesa",
    flagCode: "tz",
    sla: "< 90s instant clearing",
  },
  USD: {
    country: "United States",
    currency: "USD",
    payoutRailType: "Local Bank",
    settlementRailProtocol: "FedNow / ACH Direct Settlement",
    flagCode: "us",
    sla: "< 15 mins clearing",
  },
  GBP: {
    country: "United Kingdom",
    currency: "GBP",
    payoutRailType: "Local Bank",
    settlementRailProtocol: "Faster Payments Scheme (FPS)",
    flagCode: "gb",
    sla: "< 60s FPS clearing",
  },
  EUR: {
    country: "European Union",
    currency: "EUR",
    payoutRailType: "Local Bank",
    settlementRailProtocol: "SEPA Instant Credit Transfer (SCT Inst)",
    flagCode: "eu",
    sla: "< 10s SEPA instant",
  },
};

export function getClearingRail(currency: string, country?: string): CorridorClearingRail {
  if (CLEARING_RAILS_MATRIX[currency]) {
    return CLEARING_RAILS_MATRIX[currency];
  }
  // Try by country lookup
  if (country) {
    const found = Object.values(CLEARING_RAILS_MATRIX).find(
      (c) => c.country.toLowerCase() === country.toLowerCase()
    );
    if (found) return found;
  }
  return {
    country: country || "Pan-Africa",
    currency,
    payoutRailType: "Local Bank",
    settlementRailProtocol: "Pan-African Payment and Settlement System (PAPSS)",
    flagCode: "ng",
    sla: "< 90s instant clearing",
  };
}

// ==========================================
// 5. Supported Currencies & Metadata
// ==========================================
export interface CurrencyInfo {
  code: string;
  name: string;
  symbol: string;
  country: string;
  flagCode: string;
}

export const SUPPORTED_SOURCE_CURRENCIES: CurrencyInfo[] = [
  { code: "USD", name: "US Dollar", symbol: "$", country: "United States", flagCode: "us" },
  { code: "NGN", name: "Nigerian Naira", symbol: "₦", country: "Nigeria", flagCode: "ng" },
  { code: "KES", name: "Kenyan Shilling", symbol: "KSh", country: "Kenya", flagCode: "ke" },
  { code: "ZAR", name: "South African Rand", symbol: "R", country: "South Africa", flagCode: "za" },
  { code: "GHS", name: "Ghanaian Cedi", symbol: "GH₵", country: "Ghana", flagCode: "gh" },
  { code: "XOF", name: "West African CFA", symbol: "CFA", country: "Côte d’Ivoire", flagCode: "ci" },
  { code: "EGP", name: "Egyptian Pound", symbol: "E£", country: "Egypt", flagCode: "eg" },
  { code: "RWF", name: "Rwandan Franc", symbol: "FRw", country: "Rwanda", flagCode: "rw" },
  { code: "UGX", name: "Ugandan Shilling", symbol: "USh", country: "Uganda", flagCode: "ug" },
  { code: "EUR", name: "Euro", symbol: "€", country: "European Union", flagCode: "eu" },
  { code: "GBP", name: "British Pound", symbol: "£", country: "United Kingdom", flagCode: "gb" },
];

export const CORRIDOR_RECEIVE_CURRENCIES: CurrencyInfo[] = [
  { code: "NGN", name: "Nigerian Naira", symbol: "₦", country: "Nigeria", flagCode: "ng" },
  { code: "KES", name: "Kenyan Shilling", symbol: "KSh", country: "Kenya", flagCode: "ke" },
  { code: "GHS", name: "Ghanaian Cedi", symbol: "GH₵", country: "Ghana", flagCode: "gh" },
  { code: "ZAR", name: "South African Rand", symbol: "R", country: "South Africa", flagCode: "za" },
  { code: "XOF", name: "West African CFA", symbol: "CFA", country: "Francophone WA", flagCode: "ci" },
  { code: "RWF", name: "Rwandan Franc", symbol: "FRw", country: "Rwanda", flagCode: "rw" },
  { code: "UGX", name: "Ugandan Shilling", symbol: "USh", country: "Uganda", flagCode: "ug" },
  { code: "EGP", name: "Egyptian Pound", symbol: "E£", country: "Egypt", flagCode: "eg" },
  { code: "TZS", name: "Tanzanian Shilling", symbol: "TSh", country: "Tanzania", flagCode: "tz" },
];

export const COUNTRY_TO_CURRENCY: Record<string, string> = {
  Nigeria: "NGN",
  Kenya: "KES",
  Ghana: "GHS",
  "South Africa": "ZAR",
  Rwanda: "RWF",
  Uganda: "UGX",
  Egypt: "EGP",
  Tanzania: "TZS",
  "Côte d’Ivoire": "XOF",
  Senegal: "XOF",
  Benin: "XOF",
  "Burkina Faso": "XOF",
  Mali: "XOF",
  Niger: "XOF",
  Togo: "XOF",
  "United States": "USD",
  "United Kingdom": "GBP",
};

// ==========================================
// 6. Corridor Partner Banks & Institutions
// ==========================================
export const CORRIDOR_BANKS: Record<string, string[]> = {
  Nigeria: [
    "Access Bank",
    "First Bank of Nigeria",
    "Guaranty Trust Bank (GTBank)",
    "Moniepoint MFB",
    "OPay Digital Services",
    "United Bank for Africa (UBA)",
    "Zenith Bank",
    "Kuda Bank",
    "Fidelity Bank",
  ],
  Kenya: [
    "Equity Bank Kenya",
    "KCB Bank Kenya",
    "Co-operative Bank of Kenya",
    "Absa Bank Kenya",
    "Standard Chartered Kenya",
    "NCBA Bank",
    "Stanbic Bank Kenya",
  ],
  Ghana: [
    "Ecobank Ghana",
    "GCB Bank",
    "Stanbic Bank Ghana",
    "Absa Bank Ghana",
    "Fidelity Bank Ghana",
    "Zenith Bank Ghana",
    "CalBank",
  ],
  "South Africa": [
    "Standard Bank",
    "First National Bank (FNB)",
    "Absa Bank",
    "Nedbank",
    "Capitec Bank",
    "Investec",
  ],
  Rwanda: [
    "Bank of Kigali",
    "I&M Bank Rwanda",
    "Equity Bank Rwanda",
    "Cogebanque",
    "BPR Bank Rwanda",
  ],
  Uganda: [
    "Stanbic Bank Uganda",
    "Centenary Bank",
    "Standard Chartered Uganda",
    "dfcu Bank",
    "Absa Bank Uganda",
  ],
  Egypt: [
    "National Bank of Egypt (NBE)",
    "Banque Misr",
    "Commercial International Bank (CIB)",
    "QNB Alahli",
    "AlexBank",
  ],
  "Francophone WA": [
    "Ecobank UEMOA",
    "Société Générale Côte d'Ivoire",
    "BOA (Bank of Africa)",
    "Coris Bank International",
    "Orange Bank Africa",
  ],
};

// ==========================================
// 7. Interbank Name Resolution Engine (Section 3.2)
// ==========================================
const DEMO_DIRECTORIES: Record<string, string[]> = {
  Nigeria: [
    "Ada Okafor",
    "Chinedu Eze",
    "Zainab Bello",
    "Babatunde Adeleke",
    "Fatima Mohammed",
    "Emeka Okonkwo",
    "Ngozi Adeleke",
  ],
  Kenya: [
    "David Kamau",
    "Grace Wanjiku",
    "Brian Kiprop",
    "Faith Muthoni",
    "Kevin Omondi",
    "Mercy Chebet",
  ],
  Ghana: [
    "Daniel Mensah",
    "Amara Boateng",
    "Kwame Asante",
    "Akosua Addo",
    "Kofi Osei",
    "Abena Mensah",
  ],
  "South Africa": [
    "Amara Ndlovu",
    "Sipho Dlamini",
    "Lerato Khumalo",
    "Thabo Mokoena",
    "Nomvula Sithole",
  ],
  Rwanda: [
    "Jean-Paul Mugisha",
    "Aline Uwase",
    "Eric Nshimiyimana",
    "Diane Uwimana",
  ],
  Uganda: [
    "Patrick Okello",
    "Brenda Namubiru",
    "Joseph Mukasa",
    "Sarah Atuhaire",
  ],
  default: [
    "Ibrahim Diallo",
    "Kofi Mensah",
    "Amina Yusuf",
    "Samuel Kibet",
    "Folashade Balogun",
    "Tariq Mansoor",
  ],
};

/**
 * Simulates real-time interbank NIBSS/GhIPSS/PesaLink name resolution
 */
export function resolveInterbankAccountName(
  accountNumber: string,
  _bankName: string,
  country: string
): string {
  const digits = accountNumber.replace(/\D/g, "");
  if (digits.length < 8) return "";

  const list = DEMO_DIRECTORIES[country] || DEMO_DIRECTORIES.default;
  const numSum = digits.split("").reduce((acc, char) => acc + parseInt(char, 10), 0);
  const nameIndex = numSum % list.length;
  return list[nameIndex];
}

// ==========================================
// 8. Corporate Funding Source Entities (Section 4)
// ==========================================
export interface CorporateFundingSource {
  id: string;
  institutionName: string;
  accountLabel: string;
  maskedNumber: string; // e.g. "•••• 4910"
  type: "corporate_bank" | "corporate_card";
  rail: string; // e.g. "Direct RTGS / NIBSS Mandate"
  currency: string;
  dailyLimitUsd: number;
  usedTodayUsd: number;
  feePercent: number; // e.g. 0.15%
  settlementSpeed: string;
  mandateRef: string; // e.g. "MND-99402-STN"
  verified: boolean;
  isDefault?: boolean;
}

export type PassThroughStatus =
  | "pending_approval"
  | "source_debited"
  | "clearing"
  | "completed";

export const INITIAL_CORPORATE_FUNDING_SOURCES: CorporateFundingSource[] = [
  {
    id: "cfs-01",
    institutionName: "Standard Bank Commercial",
    accountLabel: "Treasury Primary Mandate",
    maskedNumber: "•••• 4910",
    type: "corporate_bank",
    rail: "Direct RTGS / NIBSS Mandate",
    currency: "USD",
    dailyLimitUsd: 250000,
    usedTodayUsd: 14500,
    feePercent: 0.15,
    settlementSpeed: "Instant clearing (< 60s)",
    mandateRef: "MND-99402-STN",
    verified: true,
    isDefault: true,
  },
  {
    id: "cfs-02",
    institutionName: "Ecobank Pan-African Treasury",
    accountLabel: "West & Central Multi-Corridor",
    maskedNumber: "•••• 8102",
    type: "corporate_bank",
    rail: "SWIFT / Direct ACH Mandate",
    currency: "USD",
    dailyLimitUsd: 150000,
    usedTodayUsd: 3200,
    feePercent: 0.20,
    settlementSpeed: "Same-day clearing",
    mandateRef: "MND-44210-ECO",
    verified: true,
    isDefault: false,
  },
  {
    id: "cfs-03",
    institutionName: "Commercial Visa Commercial Debit",
    accountLabel: "Emergency Instant Float",
    maskedNumber: "•••• 6229",
    type: "corporate_card",
    rail: "Visa Direct Commercial Direct Debit",
    currency: "USD",
    dailyLimitUsd: 50000,
    usedTodayUsd: 0,
    feePercent: 0.95,
    settlementSpeed: "Sub-second instant pull",
    mandateRef: "MND-78192-VIS",
    verified: true,
    isDefault: false,
  },
];

// ==========================================
// 9. Consumer Payment Rails (Section 3.2)
// ==========================================
export type PersonalPaymentMethod = "bank" | "card" | "mobile";

export interface ConsumerLinkedBank {
  id: string;
  bank: string;
  account: string; // e.g. "•••• 6789"
  mandateRef: string;
  rail: string;
  verified: boolean;
  isDefault?: boolean;
}

export const DEFAULT_CONSUMER_LINKED_BANKS: ConsumerLinkedBank[] = [
  {
    id: "clb-01",
    bank: "GTBank (Guaranty Trust Bank)",
    account: "•••• 6789",
    mandateRef: "MND-88219-NIP",
    rail: "Direct NIBSS Direct Debit Mandate",
    verified: true,
    isDefault: true,
  },
  {
    id: "clb-02",
    bank: "Access Bank",
    account: "•••• 4410",
    mandateRef: "MND-31902-ACC",
    rail: "NIP Interbank Mandate",
    verified: true,
    isDefault: false,
  },
];

