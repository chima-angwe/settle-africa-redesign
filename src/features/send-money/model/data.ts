import { callingCodes, countryCurrencies } from "@/entities/country";

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
  XAF: 610.0,
  EGP: 48.5,
  RWF: 1370.0,
  UGX: 3720.0,
  TZS: 2670.0,
  DZD: 134.0,
  AOA: 915.0,
  BWP: 13.6,
  BIF: 2890.0,
  CVE: 101.0,
  KMF: 452.0,
  CDF: 2850.0,
  DJF: 177.7,
  ERN: 15.0,
  SZL: 18.2,
  ETB: 120.0,
  GMD: 70.0,
  GNF: 8600.0,
  LSL: 18.2,
  LRD: 192.0,
  LYD: 4.8,
  MGA: 4550.0,
  MWK: 1735.0,
  MRU: 39.7,
  MUR: 46.2,
  MAD: 9.9,
  MZN: 63.9,
  NAD: 18.2,
  STN: 22.5,
  SCR: 13.8,
  SLE: 22.5,
  SOS: 571.0,
  SSP: 3200.0,
  SDG: 601.0,
  TND: 3.12,
  ZMW: 26.5,
  ZWG: 13.8,
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
  customExchangeRate?: number,
  customFeeAmount?: number
): PersonalRemittanceCalculation {
  const safeAmount = Math.max(0, isNaN(amount) ? 0 : amount);
  const rate = customExchangeRate ?? getExchangeRate(sourceCurrency, targetCurrency);
  const feeAmount =
    customFeeAmount !== undefined && Number.isFinite(customFeeAmount)
      ? Math.max(0, customFeeAmount)
      : safeAmount * FEE_RATE;
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
// 5. Currency Metadata
// ==========================================
export const COUNTRY_TO_CURRENCY: Record<string, string> = {
  ...countryCurrencies,
};

export type DeliveryMethodKey = "bank" | "mobile" | "cash";

const SOUTH_AFRICA_BRANCH_CODES: Record<string, string> = {
  "Standard Bank": "051001",
  "First National Bank (FNB)": "250655",
  "Absa Bank": "632005",
  Nedbank: "198765",
  "Capitec Bank": "470010",
  Investec: "580105",
};

export function getDefaultRoutingCode(country: string, provider?: string): string {
  if (country !== "South Africa") return "";
  return (provider && SOUTH_AFRICA_BRANCH_CODES[provider]) || "250655";
}

export interface DeliveryMethodAvailability {
  supported: boolean;
  bank: boolean;
  mobile: boolean;
  cash: boolean;
  banks: string[];
  wallets: string[];
  agents: string[];
  unsupportedReason?: string;
}

export const PICKUP_ID_TYPES = [
  "National ID",
  "International Passport",
  "Driver's Licence",
] as const;

export interface DeliveryFieldSpec {
  method: DeliveryMethodKey;
  providerLabel: string;
  accountLabel: string;
  accountPlaceholder: string;
  accountInputMode: "numeric" | "text" | "tel";
  accountHint: string;
  allowAlphanumeric: boolean;
  minLength: number;
  maxLength: number;
  requiresRoutingCode: boolean;
  routingCodeLabel?: string;
  routingCodePlaceholder?: string;
  routingCodeHint?: string;
  defaultRoutingCode?: string;
  pickupCityPlaceholder: string;
  requiredChecklist: string[];
}

interface BankFormatRule {
  accountLabel: string;
  accountPlaceholder: string;
  accountHint: string;
  allowAlphanumeric?: boolean;
  minLength: number;
  maxLength: number;
  requiresRoutingCode?: boolean;
  routingCodeLabel?: string;
  routingCodePlaceholder?: string;
  routingCodeHint?: string;
  pickupCityPlaceholder: string;
  mobileDigits: [number, number];
  mobilePlaceholder: string;
}

const ROUTE_RULES: Record<string, BankFormatRule> = {
  Nigeria: {
    accountLabel: "NUBAN account number (10 digits)",
    accountPlaceholder: "0123456789",
    accountHint: "10-digit NUBAN required for NIBSS instant clearing",
    minLength: 10,
    maxLength: 10,
    pickupCityPlaceholder: "e.g. Lagos, Abuja, Port Harcourt",
    mobileDigits: [10, 11],
    mobilePlaceholder: "0801 234 5678",
  },
  Kenya: {
    accountLabel: "Bank account number (8–14 digits)",
    accountPlaceholder: "1102345678",
    accountHint: "8 to 14 digits for PesaLink / RTGS settlement",
    minLength: 8,
    maxLength: 14,
    pickupCityPlaceholder: "e.g. Nairobi, Mombasa, Kisumu",
    mobileDigits: [9, 10],
    mobilePlaceholder: "0712 345 678",
  },
  Ghana: {
    accountLabel: "Bank account number (10–16 digits)",
    accountPlaceholder: "1400123456789",
    accountHint: "10 to 16 digits for GhIPSS Instant Pay (GIP)",
    minLength: 10,
    maxLength: 16,
    pickupCityPlaceholder: "e.g. Accra, Kumasi, Takoradi",
    mobileDigits: [9, 10],
    mobilePlaceholder: "024 123 4567",
  },
  "South Africa": {
    accountLabel: "Bank account number (9–11 digits)",
    accountPlaceholder: "62012345678",
    accountHint: "9 to 11 digits plus 6-digit universal branch code",
    minLength: 9,
    maxLength: 11,
    requiresRoutingCode: true,
    routingCodeLabel: "Universal branch code (6 digits)",
    routingCodePlaceholder: "250655",
    routingCodeHint: "Auto-filled for your selected bank; edit if branch-specific",
    pickupCityPlaceholder: "e.g. Johannesburg, Cape Town, Durban",
    mobileDigits: [9, 10],
    mobilePlaceholder: "082 123 4567",
  },
  "Côte d’Ivoire": {
    accountLabel: "RIB / BCEAO IBAN or account number",
    accountPlaceholder: "CI93 CI00 8011 1100 0123 4567 89",
    accountHint: "28-character Ivorian IBAN (CI...) or 12–24 character RIB",
    allowAlphanumeric: true,
    minLength: 12,
    maxLength: 28,
    pickupCityPlaceholder: "e.g. Abidjan, Bouaké, Yamoussoukro",
    mobileDigits: [10, 10],
    mobilePlaceholder: "07 12 34 56 78",
  },
  Rwanda: {
    accountLabel: "Bank account number (10–16 digits)",
    accountPlaceholder: "00040012345678",
    accountHint: "10 to 16 digits for RSwitch / Bank of Kigali clearing",
    minLength: 10,
    maxLength: 16,
    pickupCityPlaceholder: "e.g. Kigali, Huye, Musanze",
    mobileDigits: [9, 10],
    mobilePlaceholder: "078 123 4567",
  },
  Uganda: {
    accountLabel: "Bank account number (10–16 digits)",
    accountPlaceholder: "9030012345678",
    accountHint: "10 to 16 digits for Bank of Uganda ACH settlement",
    minLength: 10,
    maxLength: 16,
    pickupCityPlaceholder: "e.g. Kampala, Entebbe, Jinja",
    mobileDigits: [9, 10],
    mobilePlaceholder: "077 123 4567",
  },
  Egypt: {
    accountLabel: "Egyptian IBAN or bank account number",
    accountPlaceholder: "EG380002000156789012345678901",
    accountHint: "29-character EG IBAN or 10–18 digit local account for IPN",
    allowAlphanumeric: true,
    minLength: 10,
    maxLength: 29,
    pickupCityPlaceholder: "e.g. Cairo, Alexandria, Giza",
    mobileDigits: [10, 11],
    mobilePlaceholder: "010 1234 5678",
  },
  Tanzania: {
    accountLabel: "Bank account number (10–16 digits)",
    accountPlaceholder: "0150123456789",
    accountHint: "10 to 16 digits for TIPS instant bank settlement",
    minLength: 10,
    maxLength: 16,
    pickupCityPlaceholder: "e.g. Dar es Salaam, Arusha, Dodoma",
    mobileDigits: [9, 10],
    mobilePlaceholder: "071 234 5678",
  },
};

const DEFAULT_ROUTE_RULE: BankFormatRule = {
  accountLabel: "Bank account number",
  accountPlaceholder: "0123456789",
  accountHint: "Enter the recipient's bank account number or IBAN",
  allowAlphanumeric: true,
  minLength: 6,
  maxLength: 34,
  pickupCityPlaceholder: "e.g. City centre",
  mobileDigits: [7, 12],
  mobilePlaceholder: "0712 345 678",
};

function getRouteRule(country: string): BankFormatRule {
  if (ROUTE_RULES[country]) return ROUTE_RULES[country];
  const normalized = country.trim().replace(/'/g, "’").toLowerCase();
  const matched = Object.entries(ROUTE_RULES).find(
    ([key]) => key.toLowerCase() === normalized,
  );
  return matched?.[1] || DEFAULT_ROUTE_RULE;
}

export function getDeliveryFieldSpec(
  country: string,
  method: DeliveryMethodKey,
  provider?: string,
): DeliveryFieldSpec {
  const rule = getRouteRule(country);
  const dialCode = callingCodes[country] || "+";

  if (method === "mobile") {
    const [minPhone, maxPhone] = rule.mobileDigits;
    const digitRange = minPhone === maxPhone ? `${minPhone} digits` : `${minPhone}–${maxPhone} digits`;
    return {
      method,
      providerLabel: "Mobile money provider",
      accountLabel: `Mobile wallet number (${dialCode})`,
      accountPlaceholder: rule.mobilePlaceholder,
      accountInputMode: "tel",
      accountHint: `Enter ${digitRange} registered on ${provider || "the mobile wallet"}`,
      allowAlphanumeric: false,
      minLength: minPhone,
      maxLength: maxPhone + 4, // allows optional country code prefix
      requiresRoutingCode: false,
      pickupCityPlaceholder: rule.pickupCityPlaceholder,
      requiredChecklist: [
        "Mobile money provider",
        `Registered wallet number (${dialCode})`,
        "Wallet holder verification",
      ],
    };
  }

  if (method === "cash") {
    return {
      method,
      providerLabel: "Pickup network",
      accountLabel: `Recipient mobile number (${dialCode})`,
      accountPlaceholder: rule.mobilePlaceholder,
      accountInputMode: "tel",
      accountHint: "Used to send pickup confirmation SMS and collection code",
      allowAlphanumeric: false,
      minLength: 7,
      maxLength: 15,
      requiresRoutingCode: false,
      pickupCityPlaceholder: rule.pickupCityPlaceholder,
      requiredChecklist: [
        "Pickup network",
        "Recipient full legal name (as on ID)",
        `Recipient phone (${dialCode}) & pickup city`,
        "Accepted government ID type",
      ],
    };
  }

  const defaultRoutingCode = getDefaultRoutingCode(country, provider);
  const checklist = ["Destination bank", rule.accountLabel];
  if (rule.requiresRoutingCode) {
    checklist.push("6-digit branch code");
  }
  checklist.push("Verified account holder name");

  return {
    method,
    providerLabel: "Destination bank",
    accountLabel: rule.accountLabel,
    accountPlaceholder: rule.accountPlaceholder,
    accountInputMode: rule.allowAlphanumeric ? "text" : "numeric",
    accountHint: rule.accountHint,
    allowAlphanumeric: Boolean(rule.allowAlphanumeric),
    minLength: rule.minLength,
    maxLength: rule.maxLength,
    requiresRoutingCode: Boolean(rule.requiresRoutingCode),
    routingCodeLabel: rule.routingCodeLabel,
    routingCodePlaceholder: rule.routingCodePlaceholder,
    routingCodeHint: rule.routingCodeHint,
    defaultRoutingCode,
    pickupCityPlaceholder: rule.pickupCityPlaceholder,
    requiredChecklist: checklist,
  };
}

export interface DeliveryValidationInput {
  country: string;
  method: DeliveryMethodKey;
  provider: string;
  availableProviders?: readonly string[];
  isCountrySupported?: boolean;
  isMethodAvailable?: boolean;
  accountNumber: string;
  routingCode?: string;
  accountName: string;
  recipientPhone?: string;
  pickupCity?: string;
  isResolvingName?: boolean;
}

export interface DeliveryFieldErrors {
  country?: string;
  provider?: string;
  accountNumber?: string;
  routingCode?: string;
  accountName?: string;
  recipientPhone?: string;
  pickupCity?: string;
}

export interface DeliveryValidationResult {
  valid: boolean;
  error: string | null;
  fieldErrors: DeliveryFieldErrors;
}

function normalizeLocalPhoneDigits(rawPhone: string, country: string): string {
  const digits = rawPhone.replace(/\D/g, "");
  const dialDigits = (callingCodes[country] || "").replace(/\D/g, "");
  if (dialDigits && digits.startsWith(dialDigits) && digits.length > dialDigits.length + 5) {
    return digits.slice(dialDigits.length);
  }
  return digits;
}

export function validateDeliveryDetails(
  input: DeliveryValidationInput,
): DeliveryValidationResult {
  const fieldErrors: DeliveryFieldErrors = {};

  if (!input.country.trim() || input.isCountrySupported === false) {
    const msg = input.country.trim()
      ? `Payouts to ${input.country} are not supported.`
      : "Select a supported destination country.";
    fieldErrors.country = msg;
    return { valid: false, error: msg, fieldErrors };
  }

  if (input.isMethodAvailable === false) {
    const label =
      input.method === "mobile"
        ? "Mobile money"
        : input.method === "cash"
          ? "Cash pickup"
          : "Bank transfer";
    const msg = `${label} is not available for ${input.country}.`;
    return { valid: false, error: msg, fieldErrors };
  }

  const providers = input.availableProviders ?? [];
  const trimmedProvider = input.provider.trim();
  const isProviderSupported =
    Boolean(trimmedProvider) &&
    providers.some(
      (provider) => provider.trim().toLowerCase() === trimmedProvider.toLowerCase(),
    );
  if (!isProviderSupported) {
    const msg =
      input.method === "cash"
        ? "Select a supported cash pickup network."
        : input.method === "mobile"
          ? "Select a supported mobile money provider."
          : "Select a supported destination bank.";
    fieldErrors.provider = msg;
    return { valid: false, error: msg, fieldErrors };
  }

  const rule = getRouteRule(input.country);

  if (input.method === "cash") {
    const trimmedName = input.accountName.trim();
    const nameParts = trimmedName.split(/\s+/).filter(Boolean);
    if (trimmedName.length < 4 || nameParts.length < 2) {
      const msg = "Enter the recipient's full legal name (first and last name matching government ID).";
      fieldErrors.accountName = msg;
      return { valid: false, error: msg, fieldErrors };
    }
    const localPhone = normalizeLocalPhoneDigits(input.recipientPhone || "", input.country);
    const [minPhone, maxPhone] = rule.mobileDigits;
    if (localPhone.length < Math.min(7, minPhone) || localPhone.length > Math.max(12, maxPhone + 1)) {
      const msg = `Enter a valid ${input.country} mobile number (${callingCodes[input.country] || "+"}) for pickup notifications.`;
      fieldErrors.recipientPhone = msg;
      return { valid: false, error: msg, fieldErrors };
    }
    if ((input.pickupCity || "").trim().length < 2) {
      const msg = `Enter the destination pickup city (${rule.pickupCityPlaceholder}).`;
      fieldErrors.pickupCity = msg;
      return { valid: false, error: msg, fieldErrors };
    }
    return { valid: true, error: null, fieldErrors };
  }

  if (input.isResolvingName) {
    return {
      valid: false,
      error: "Please wait for recipient verification to complete.",
      fieldErrors,
    };
  }

  if (input.method === "mobile") {
    const localPhone = normalizeLocalPhoneDigits(input.accountNumber, input.country);
    const [minPhone, maxPhone] = rule.mobileDigits;
    if (localPhone.length < minPhone || localPhone.length > maxPhone) {
      const expected = minPhone === maxPhone ? `${minPhone}` : `${minPhone}–${maxPhone}`;
      const msg = `Enter a valid ${input.country} mobile wallet number (${expected} local digits).`;
      fieldErrors.accountNumber = msg;
      return { valid: false, error: msg, fieldErrors };
    }
    if (!input.accountName.trim()) {
      const msg = "Wallet holder verification is required before continuing.";
      fieldErrors.accountNumber = msg;
      return { valid: false, error: msg, fieldErrors };
    }
    return { valid: true, error: null, fieldErrors };
  }

  // Bank transfer validation
  const compact = input.accountNumber.replace(/[\s-]+/g, "").toUpperCase();
  if (rule.allowAlphanumeric) {
    if (input.country === "Côte d’Ivoire") {
      const validIban = /^CI\d{2}[A-Z0-9]{24}$/.test(compact);
      const validRib = /^[A-Z0-9]{12,24}$/.test(compact);
      if (!validIban && !validRib) {
        const msg = "Enter a valid 28-character Ivorian IBAN (CI...) or 12–24 character RIB.";
        fieldErrors.accountNumber = msg;
        return { valid: false, error: msg, fieldErrors };
      }
    } else if (input.country === "Egypt") {
      const validEgIban = /^EG\d{27}$/.test(compact);
      const validLocalAcc = /^\d{10,18}$/.test(compact);
      if (!validEgIban && !validLocalAcc) {
        const msg = "Enter a valid 29-character Egyptian IBAN (EG...) or 10–18 digit account number.";
        fieldErrors.accountNumber = msg;
        return { valid: false, error: msg, fieldErrors };
      }
    } else if (compact.length < rule.minLength || compact.length > rule.maxLength) {
      const msg = `Enter a valid ${input.country} bank account number (${rule.minLength}–${rule.maxLength} characters).`;
      fieldErrors.accountNumber = msg;
      return { valid: false, error: msg, fieldErrors };
    }
  } else {
    const digitsOnly = input.accountNumber.replace(/\D/g, "");
    if (digitsOnly.length < rule.minLength || digitsOnly.length > rule.maxLength) {
      const rangeText =
        rule.minLength === rule.maxLength
          ? `exactly ${rule.minLength} digits`
          : `${rule.minLength}–${rule.maxLength} digits`;
      const msg = `Enter a valid ${input.country} bank account number (${rangeText}).`;
      fieldErrors.accountNumber = msg;
      return { valid: false, error: msg, fieldErrors };
    }
  }

  if (rule.requiresRoutingCode) {
    const branchDigits = (input.routingCode || "").replace(/\D/g, "");
    if (branchDigits.length !== 6) {
      const msg = "Enter a valid 6-digit South African bank branch code.";
      fieldErrors.routingCode = msg;
      return { valid: false, error: msg, fieldErrors };
    }
  }

  if (!input.accountName.trim()) {
    const msg = "Enter a valid account number to verify the recipient's bank account name.";
    fieldErrors.accountNumber = msg;
    return { valid: false, error: msg, fieldErrors };
  }

  return { valid: true, error: null, fieldErrors };
}

export interface DeliveryInstructionDetails {
  headline: string;
  eta: string;
  summary: string;
  steps: string[];
}

export function getDeliveryInstructionDetails(
  country: string,
  method: DeliveryMethodKey,
  provider: string,
  city?: string,
  recipientName?: string,
  idType?: string,
): DeliveryInstructionDetails {
  const currency = COUNTRY_TO_CURRENCY[country] || "NGN";
  const rail = getClearingRail(currency, country);
  const chosenProvider = provider || "partner provider";

  if (method === "mobile") {
    const summary = `Instant ${currency} mobile wallet credit via ${chosenProvider} (${rail.sla}). Ensure the recipient's number is registered and within wallet tier limits.`;
    return {
      headline: `Mobile money payout · ${chosenProvider}`,
      eta: rail.sla,
      summary,
      steps: [
        `Funds settle directly in ${currency} to the recipient's ${chosenProvider} wallet (${rail.sla}).`,
        "Recipient number must be active and registered for mobile money in " + country + ".",
        "An instant SMS / app notification is sent once funds are credited.",
      ],
    };
  }

  if (method === "cash") {
    const location = city?.trim() ? `${city.trim()}, ${country}` : country;
    const requiredId = idType || "valid government photo ID";
    const holder = recipientName?.trim() || "the named recipient";
    const summary = `Cash ready in minutes at ${chosenProvider} locations in ${location}. Recipient needs ${requiredId} matching ${holder} and the PK pickup code.`;
    return {
      headline: `Cash pickup · ${chosenProvider}`,
      eta: "Ready within minutes · Valid 30 days",
      summary,
      steps: [
        `Collect cash in ${currency} at any participating ${chosenProvider} branch in ${location}.`,
        `Recipient must present an original ${requiredId} matching "${holder}".`,
        "Share the generated PK pickup reference code (also sent via SMS) at the counter.",
      ],
    };
  }

  const routeNote =
    country === "South Africa"
      ? "6-digit branch code routes the payout through SARB PayShap / RTC."
      : country === "Côte d’Ivoire"
        ? "Ensure the BCEAO RIB or CI IBAN matches the receiving bank branch."
        : country === "Egypt"
          ? "29-character EG IBAN or local account settles over Egypt IPN."
          : `Recipient name is verified against ${chosenProvider} before clearing.`;
  const summary = `Direct ${currency} bank deposit to ${chosenProvider} via ${rail.settlementRailProtocol} (${rail.sla}). ${routeNote}`;
  return {
    headline: `Bank transfer · ${chosenProvider}`,
    eta: rail.sla,
    summary,
    steps: [
      `Settled directly into the ${chosenProvider} account in ${currency} via ${rail.settlementRailProtocol}.`,
      routeNote,
      "Transfers are non-reversible once cleared; verify account details on the review screen.",
    ],
  };
}

export function getDeliveryInstructions(
  country: string,
  method: DeliveryMethodKey,
  provider: string,
  city?: string,
  recipientName?: string,
  idType?: string,
): string {
  return getDeliveryInstructionDetails(
    country,
    method,
    provider,
    city,
    recipientName,
    idType,
  ).summary;
}

// ==========================================
// 6. Corporate Funding Source Entities (Section 4)
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

