import { useState, useEffect, useMemo, useRef, useCallback } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "@/shared/ui";
import { getErrorMessage, isApiError } from "@/shared/api";
import { env } from "@/shared/config";
import type { Recipient } from "@/entities/recipient";
import type { Transfer } from "@/entities/transfer";
import {
  buildLocaleRateMap,
  useLocales,
  type LocaleCountry,
  type LocaleMethod,
} from "@/features/locales";
import type { VerificationStatus } from "@/features/manage-profile";
import { trackTransferService } from "@/features/track-transfer";
import { transactionKeys } from "@/features/transactions";
import { formatTransferTimestamp } from "@/shared/lib";
import { sendMoneyKeys } from "../api/send-money.keys";
import { mapSendFundsInputToRequest } from "../api/send-money.mapper";
import { sendMoneyService } from "../api/send-money.service";
import type {
  CombiCheckRequest,
  RecipientCategory,
} from "../api/send-money.types";
import { useCombiCheck } from "../hooks/useCombiCheck";
import { useSendFunds } from "../hooks/useSendFunds";
import {
  STORAGE_KEYS,
  calculatePersonalRemittance,
  getClearingRail,
  DEFAULT_CONSUMER_LINKED_BANKS,
  COUNTRY_TO_CURRENCY,
  PICKUP_ID_TYPES,
  getDefaultRoutingCode,
  getDeliveryFieldSpec,
  getDeliveryInstructionDetails,
  validateDeliveryDetails,
  type DeliveryFieldErrors,
  type DeliveryMethodKey,
  type PersonalPaymentMethod,
  type ConsumerLinkedBank,
} from "./data";
import {
  getScheduleLabel,
  getTomorrowIsoDate,
  type ScheduleConfig,
} from "./schedule";

export type FlowStep =
  | "from"
  | "to"
  | "review"
  | "processing"
  | "pending"
  | "success"
  | "failed";
export type PayoutMethod = DeliveryMethodKey;

export interface CardInputs {
  number: string;
  expiry: string;
  cvv: string;
  name: string;
}

export interface RetryTransferDraft {
  amount: string;
  sendCountry?: string;
  targetCountry: string;
  payoutMethod: PayoutMethod;
  bankName: string;
  accountName: string;
  accountNumber?: string;
  routingCode?: string;
  pickupCity?: string;
  pickupIdType?: string;
  recipientPhone?: string;
  description?: string;
}

export interface UseSendMoneyFlowProps {
  recipients: Recipient[];
  targetRecipientId: number | null;
  defaultCountry: string;
  setTargetRecipientId: (id: number | null) => void;
  setRecipients: (items: Recipient[]) => void;
  transfers: Transfer[];
  setTransfers: (items: Transfer[]) => void;
  onBeforeSubmit?: () => boolean;
  retryDraft?: RetryTransferDraft | null;
  verificationStatus?: VerificationStatus;
}

function createSubmissionId() {
  return `sub-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function classifyLocaleMethod(method: LocaleMethod): DeliveryMethodKey {
  const haystack = `${method.type} ${method.category} ${method.name}`.toLowerCase();
  if (haystack.includes("cash") || haystack.includes("pickup")) {
    return "cash";
  }
  if (
    haystack.includes("mobile") ||
    haystack.includes("momo") ||
    haystack.includes("wallet")
  ) {
    return "mobile";
  }
  return "bank";
}

function groupLocaleMethods(locale: LocaleCountry | null): Record<DeliveryMethodKey, LocaleMethod[]> {
  const grouped: Record<DeliveryMethodKey, LocaleMethod[]> = {
    bank: [],
    mobile: [],
    cash: [],
  };
  if (!locale) return grouped;

  for (const method of locale.methods) {
    grouped[classifyLocaleMethod(method)].push(method);
  }
  return grouped;
}

function isValidCardExpiry(expiry: string): boolean {
  const match = expiry.match(/^(\d{2})\/(\d{2})$/);
  if (!match) return false;
  const month = Number(match[1]);
  const year = 2000 + Number(match[2]);
  if (month < 1 || month > 12) return false;
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth() + 1;
  return year > currentYear || (year === currentYear && month >= currentMonth);
}

function inferRecipientMethod(methodStr?: string, locale?: LocaleCountry | null): PayoutMethod {
  const lower = (methodStr || "").toLowerCase();
  if (lower.includes("cash")) return "cash";
  if (
    (lower.includes("mobile") || lower.includes("m-pesa")) &&
    (!locale || groupLocaleMethods(locale).mobile.length > 0)
  ) {
    return "mobile";
  }
  return "bank";
}

function parseUrlParams(
  recipients: Recipient[],
  targetRecipientId: number | null,
  retryDraft?: RetryTransferDraft | null,
) {
  let source = "NGN";
  let sourceCountry = "Nigeria";
  let target = "NGN";
  let country = "Nigeria";
  let amt = "500";
  let beneficiaryId: number | null = targetRecipientId;
  let payoutMethod: PayoutMethod = "bank";
  let bank = "";
  let accNum = "";
  let accName = "";
  let routingCode = "";
  let pickupCity = "";
  let pickupIdType: string = PICKUP_ID_TYPES[0];
  let recipientPhone = "";
  let description = "";

  if (typeof window !== "undefined") {
    const searchParams = new URLSearchParams(window.location.search);
    const sourceParam = searchParams.get("source");
    const targetParam = searchParams.get("target");
    const amountParam = searchParams.get("amount");
    const bParam = searchParams.get("beneficiary");

    if (sourceParam) {
      const upperSource = sourceParam.toUpperCase();
      const sourceMatch = Object.keys(COUNTRY_TO_CURRENCY).find(
        (c) => COUNTRY_TO_CURRENCY[c] === upperSource
      );
      if (sourceMatch) {
        source = upperSource;
        sourceCountry = sourceMatch;
      }
    }
    if (targetParam) {
      const upperTarget = targetParam.toUpperCase();
      const match = Object.keys(COUNTRY_TO_CURRENCY).find(
        (c) => COUNTRY_TO_CURRENCY[c] === upperTarget
      );
      if (match) {
        target = upperTarget;
        country = match;
      }
    }
    if (amountParam && !isNaN(parseFloat(amountParam))) {
      amt = amountParam;
    }
    if (bParam) {
      beneficiaryId = Number(bParam);
    }
  }

  if (retryDraft) {
    amt = retryDraft.amount || amt;
    if (retryDraft.sendCountry && COUNTRY_TO_CURRENCY[retryDraft.sendCountry]) {
      sourceCountry = retryDraft.sendCountry;
      source = COUNTRY_TO_CURRENCY[retryDraft.sendCountry];
    }
    country = retryDraft.targetCountry;
    target = COUNTRY_TO_CURRENCY[retryDraft.targetCountry] || target;
    payoutMethod = retryDraft.payoutMethod;
    bank = retryDraft.bankName;
    accName = retryDraft.accountName;
    accNum = retryDraft.accountNumber || "";
    routingCode = retryDraft.routingCode || getDefaultRoutingCode(country, bank);
    pickupCity = retryDraft.pickupCity || "";
    pickupIdType = retryDraft.pickupIdType || PICKUP_ID_TYPES[0];
    recipientPhone = retryDraft.recipientPhone || "";
    description = retryDraft.description || "";
  } else if (beneficiaryId) {
    const found = recipients.find((r) => r.id === beneficiaryId);
    if (found) {
      country = found.country;
      target = COUNTRY_TO_CURRENCY[found.country] || "NGN";
      payoutMethod = inferRecipientMethod(found.method);
      bank = found.provider || "";
      accNum = found.account.replace(/[^0-9]/g, "");
      accName = found.name;
      routingCode = getDefaultRoutingCode(country, bank);
      if (payoutMethod === "cash") {
        recipientPhone = accNum;
      }
    }
  }

  if (!routingCode) {
    routingCode = getDefaultRoutingCode(country, bank);
  }

  return {
    source,
    sourceCountry,
    target,
    country,
    amt,
    beneficiaryId,
    payoutMethod,
    bank,
    accNum,
    accName,
    routingCode,
    pickupCity,
    pickupIdType,
    recipientPhone,
    description,
  };
}

export function useSendMoneyFlow({
  recipients,
  targetRecipientId,
  defaultCountry,
  setTargetRecipientId,
  setRecipients,
  transfers,
  setTransfers,
  onBeforeSubmit,
  retryDraft,
  verificationStatus,
}: UseSendMoneyFlowProps) {
  const initialParams = useMemo(() => {
    const parsed = parseUrlParams(recipients, targetRecipientId, retryDraft);
    if (!retryDraft && !targetRecipientId && defaultCountry && COUNTRY_TO_CURRENCY[defaultCountry]) {
      const nextTargetCountry = defaultCountry === "Nigeria" ? "Kenya" : defaultCountry;
      parsed.country = nextTargetCountry;
      parsed.target = COUNTRY_TO_CURRENCY[nextTargetCountry] || parsed.target;
      parsed.routingCode = getDefaultRoutingCode(nextTargetCountry, parsed.bank);
    }
    return parsed;
  }, [recipients, targetRecipientId, defaultCountry, retryDraft]);

  // Step state machine: [from] -> [to] -> [review] -> [processing] -> [success | failed]
  const [step, setStep] = useState<FlowStep>("from");

  // Step 1: Source & Amount Inputs
  const [amount, setAmount] = useState<string>(() => initialParams.amt);
  const [sendCountry, setSendCountry] = useState<string>(() => initialParams.sourceCountry);
  const [paymentMethod, setPaymentMethod] = useState<PersonalPaymentMethod>("bank");

  // Conditional Inputs based on paymentMethod
  const [linkedBankId, setLinkedBankId] = useState<string>(
    DEFAULT_CONSUMER_LINKED_BANKS[0]?.id || "clb-01"
  );
  const [cardData, setCardData] = useState<CardInputs>({
    number: "",
    expiry: "",
    cvv: "",
    name: "",
  });
  const [senderPhone, setSenderPhone] = useState<string>("");

  // Step 2: Recipient & Delivery Method Inputs
  const [targetCountry, setTargetCountry] = useState<string>(() => initialParams.country);
  const [payoutMethod, setPayoutMethod] = useState<PayoutMethod>(() => initialParams.payoutMethod);
  const [bankName, setBankName] = useState<string>(() => initialParams.bank);
  const [selectedMethodId, setSelectedMethodId] = useState<string>("");
  const [accountNumber, setAccountNumber] = useState<string>(() => initialParams.accNum);
  const [routingCode, setRoutingCode] = useState<string>(() => initialParams.routingCode);
  const [accountName, setAccountName] = useState<string>(() => initialParams.accName);
  const [accountLookupError, setAccountLookupError] = useState<string | null>(null);
  const [pickupCity, setPickupCity] = useState<string>(() => initialParams.pickupCity);
  const [pickupIdType, setPickupIdType] = useState<string>(() => initialParams.pickupIdType);
  const [recipientPhone, setRecipientPhone] = useState<string>(() => initialParams.recipientPhone);
  const [recipientCategory, setRecipientCategory] = useState<RecipientCategory>("individual");
  const [recipientEmail, setRecipientEmail] = useState<string>("");
  const [recipientAddress, setRecipientAddress] = useState<string>("");
  const [fieldErrors, setFieldErrors] = useState<DeliveryFieldErrors>({});
  const [isResolvingName, setIsResolvingName] = useState<boolean>(false);
  const [selectedBeneficiaryId, setSelectedBeneficiaryId] = useState<number | null>(
    () => initialParams.beneficiaryId
  );
  const [saveBeneficiary, setSaveBeneficiary] = useState<boolean>(false);

  // Step 3: Review & Description
  const [description, setDescription] = useState<string>(() => initialParams.description);

  // Scheduled payment options
  const [schedule, setSchedule] = useState<ScheduleConfig>(() => ({
    enabled: false,
    mode: "now",
    date: getTomorrowIsoDate(),
    frequency: "Monthly",
  }));

  // Processing & Execution State
  const [processingProgress, setProcessingProgress] = useState<number>(0);
  const [processingMessage, setProcessingMessage] = useState<string>("");
  const [error, setError] = useState<string | null>(null);
  const [completedTransfer, setCompletedTransfer] = useState<Transfer | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [isCheckingStatus, setIsCheckingStatus] = useState<boolean>(false);

  const verificationTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lookupSeqRef = useRef<number>(0);
  const isSubmittingRef = useRef<boolean>(false);
  const submissionIdRef = useRef<string>("sub-initial");
  const completedSubmissionIdsRef = useRef<Set<string>>(new Set());
  const lastAuthRef = useRef<{ pin: string; otp: string }>({ pin: "", otp: "" });
  const queryClient = useQueryClient();
  const localesQuery = useLocales();
  const sendFundsMutation = useSendFunds();

  const locales = useMemo(() => localesQuery.data ?? [], [localesQuery.data]);
  const localeRatesMap = useMemo(() => buildLocaleRateMap(locales), [locales]);
  const supportedCountries = useMemo(
    () => locales.map((locale) => locale.name),
    [locales],
  );
  const currencyByCountry = useMemo(() => {
    const map: Record<string, string> = {};
    for (const locale of locales) {
      if (locale.currency.code) {
        map[locale.name] = locale.currency.code;
      }
    }
    return map;
  }, [locales]);
  const isoByCountry = useMemo(() => {
    const map: Record<string, string> = {};
    for (const locale of locales) {
      if (locale.iso) {
        map[locale.name] = locale.iso.toLowerCase();
      }
    }
    return map;
  }, [locales]);

  const sendLocale = useMemo(() => {
    if (locales.length === 0) return null;
    return (
      locales.find((locale) => locale.name.toLowerCase() === sendCountry.toLowerCase()) ??
      locales.find((locale) => locale.name.toLowerCase() === "nigeria") ??
      locales[0]
    );
  }, [locales, sendCountry]);

  const effectiveSendCountry = sendLocale?.name || "";

  const targetLocale = useMemo(() => {
    if (locales.length === 0) return null;
    return (
      locales.find((locale) => locale.name.toLowerCase() === targetCountry.toLowerCase()) ??
      locales.find(
        (locale) => locale.name.toLowerCase() !== effectiveSendCountry.toLowerCase(),
      ) ??
      locales[0]
    );
  }, [locales, targetCountry, effectiveSendCountry]);

  const effectiveTargetCountry = targetLocale?.name || "";
  const effectiveSendCurrency = sendLocale?.currency.code || "";
  const effectiveTargetCurrency = targetLocale?.currency.code || "";

  // Sync consumer linked banks from localStorage
  const linkedBanks: ConsumerLinkedBank[] = useMemo(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.LINKED_BANKS);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed.map((item: { bank: string; account: string }, index: number) => ({
            id: `linked-${index}`,
            bank: item.bank,
            account: `•••• ${item.account}`,
            mandateRef: `MND-1004${index}-DEB`,
            rail: "Direct NIBSS Direct Debit Mandate",
            verified: true,
            isDefault: index === 0,
          }));
        }
      }
    } catch {
      // ignore
    }
    return DEFAULT_CONSUMER_LINKED_BANKS;
  }, []);

  const localeMethodsByType = useMemo(() => groupLocaleMethods(targetLocale), [targetLocale]);

  const deliveryAvailability = useMemo(() => {
    if (!targetLocale) {
      return {
        supported: false,
        bank: false,
        mobile: false,
        cash: false,
        banks: [],
        wallets: [],
        agents: [],
        unsupportedReason: localesQuery.isError
          ? getErrorMessage(localesQuery.error, "Unable to load supported routes from server.")
          : "Loading supported routes from server...",
      };
    }

    if (targetLocale.methods.length === 0) {
      return {
        supported: false,
        bank: false,
        mobile: false,
        cash: false,
        banks: [],
        wallets: [],
        agents: [],
        unsupportedReason: `No payout methods available for ${targetLocale.name}.`,
      };
    }

    return {
      supported: true,
      bank: localeMethodsByType.bank.length > 0,
      mobile: localeMethodsByType.mobile.length > 0,
      cash: localeMethodsByType.cash.length > 0,
      banks: localeMethodsByType.bank.map((method) => method.name),
      wallets: localeMethodsByType.mobile.map((method) => method.name),
      agents: localeMethodsByType.cash.map((method) => method.name),
      unsupportedReason: undefined,
    };
  }, [targetLocale, localeMethodsByType, localesQuery.isError, localesQuery.error]);

  const effectivePayoutMethod: PayoutMethod = deliveryAvailability[payoutMethod]
    ? payoutMethod
    : deliveryAvailability.bank
      ? "bank"
      : deliveryAvailability.mobile
        ? "mobile"
        : deliveryAvailability.cash
          ? "cash"
          : payoutMethod;

  const availableWallets = deliveryAvailability.wallets;

  const availableMethods = useMemo(() => {
    if (!targetLocale) return [];
    return localeMethodsByType[effectivePayoutMethod];
  }, [targetLocale, localeMethodsByType, effectivePayoutMethod]);

  const selectedMethod = useMemo(() => {
    if (availableMethods.length === 0) return null;
    return (
      availableMethods.find((method) => method.id === selectedMethodId) ||
      availableMethods.find((method) => method.name.toLowerCase() === bankName.toLowerCase()) ||
      availableMethods[0]
    );
  }, [availableMethods, selectedMethodId, bankName]);

  const effectiveBankName = selectedMethod?.name || "";
  const effectiveMethodId = selectedMethod?.id || "";

  const availableProviders = useMemo(
    () => availableMethods.map((method) => method.name),
    [availableMethods],
  );

  const deliverySpec = useMemo(
    () => getDeliveryFieldSpec(effectiveTargetCountry, effectivePayoutMethod, effectiveBankName),
    [effectiveTargetCountry, effectivePayoutMethod, effectiveBankName]
  );

  const deliveryInstructionDetails = useMemo(
    () =>
      getDeliveryInstructionDetails(
        effectiveTargetCountry,
        effectivePayoutMethod,
        effectiveBankName,
        pickupCity,
        accountName,
        pickupIdType
      ),
    [effectiveTargetCountry, effectivePayoutMethod, effectiveBankName, pickupCity, accountName, pickupIdType]
  );

  const deliveryInstructions = deliveryInstructionDetails.summary;

  const triggerAccountLookup = useCallback(
    (cleanAccountNumber: string, methodId: string) => {
      if (verificationTimerRef.current) {
        clearTimeout(verificationTimerRef.current);
        verificationTimerRef.current = null;
      }

      const actno = cleanAccountNumber.trim();
      const bankId = methodId.trim();

      if (actno.length < 10 || !bankId) {
        if (!selectedBeneficiaryId) {
          setAccountName("");
        }
        setAccountLookupError(null);
        setIsResolvingName(false);
        return;
      }

      const seq = ++lookupSeqRef.current;
      setIsResolvingName(true);
      setAccountLookupError(null);

      verificationTimerRef.current = setTimeout(() => {
        void queryClient
          .fetchQuery({
            queryKey: sendMoneyKeys.lookup(actno, bankId),
            queryFn: ({ signal }) => sendMoneyService.lookupAccount(actno, bankId, signal),
            staleTime: 60 * 1000,
          })
          .then((result) => {
            if (lookupSeqRef.current !== seq) return;
            setAccountName(result.name);
            setAccountLookupError(null);
            setFieldErrors((prev) => ({
              ...prev,
              accountName: undefined,
              accountNumber: undefined,
            }));
          })
          .catch((err) => {
            if (lookupSeqRef.current !== seq) return;
            if (!selectedBeneficiaryId) {
              setAccountName("");
            }
            setAccountLookupError(
              getErrorMessage(err, "Unable to verify recipient account name."),
            );
          })
          .finally(() => {
            if (lookupSeqRef.current === seq) {
              setIsResolvingName(false);
            }
          });
      }, 350);
    },
    [queryClient, selectedBeneficiaryId],
  );

  // Update target country handler (preserves entered details when possible)
  const handleCountryChange = useCallback(
    (newCountry: string) => {
      setTargetCountry(newCountry);
      setFieldErrors({});
      setError(null);
      setAccountLookupError(null);

      const nextLocale =
        locales.find((locale) => locale.name.toLowerCase() === newCountry.toLowerCase()) ?? null;
      const nextGrouped = groupLocaleMethods(nextLocale);
      const hasLocaleMethods = Boolean(nextLocale && nextLocale.methods.length > 0);
      const availability = hasLocaleMethods
        ? {
            supported: true,
            bank: nextGrouped.bank.length > 0,
            mobile: nextGrouped.mobile.length > 0,
            cash: nextGrouped.cash.length > 0,
          }
        : {
            supported: false,
            bank: false,
            mobile: false,
            cash: false,
          };

      const nextMethod: PayoutMethod = availability[effectivePayoutMethod]
        ? effectivePayoutMethod
        : availability.bank
          ? "bank"
          : availability.mobile
            ? "mobile"
            : availability.cash
              ? "cash"
              : "bank";
      if (nextMethod !== effectivePayoutMethod) {
        setPayoutMethod(nextMethod);
      }

      const nextLocaleMethod = nextGrouped[nextMethod][0] ?? null;
      const nextProvider = nextLocaleMethod?.name || "";
      const nextMethodId = nextLocaleMethod?.id || "";

      setBankName(nextProvider);
      setSelectedMethodId(nextMethodId);
      setRoutingCode(
        nextMethod === "bank" ? getDefaultRoutingCode(newCountry, nextProvider) : ""
      );

      if (!selectedBeneficiaryId && nextMethod !== "cash") {
        const cleaned = accountNumber.replace(/[^a-zA-Z0-9]/g, "");
        if (cleaned.length >= 10 && nextMethodId && availability.supported) {
          triggerAccountLookup(cleaned, nextMethodId);
        } else {
          setAccountName("");
        }
      }
    },
    [locales, effectivePayoutMethod, selectedBeneficiaryId, accountNumber, triggerAccountLookup]
  );

  const handlePayoutMethodChange = useCallback(
    (nextMethod: PayoutMethod) => {
      if (!deliveryAvailability.supported) {
        setError(
          deliveryAvailability.unsupportedReason || `${targetCountry} is not supported at launch.`
        );
        return;
      }
      if (!deliveryAvailability[nextMethod]) {
        const label =
          nextMethod === "mobile"
            ? "Mobile money"
            : nextMethod === "cash"
              ? "Cash pickup"
              : "Bank transfer";
        setError(`${label} is not available in ${targetCountry}.`);
        return;
      }
      setPayoutMethod(nextMethod);
      const nextLocaleMethod = localeMethodsByType[nextMethod][0] ?? null;
      const nextProvider = nextLocaleMethod?.name || "";
      const nextMethodId = nextLocaleMethod?.id || "";

      setBankName(nextProvider);
      setSelectedMethodId(nextMethodId);
      setRoutingCode(
        nextMethod === "bank" ? getDefaultRoutingCode(targetCountry, nextProvider) : ""
      );
      setFieldErrors({});
      setError(null);
      setAccountLookupError(null);

      if (!selectedBeneficiaryId && nextMethod !== "cash") {
        const cleaned = accountNumber.replace(/[^a-zA-Z0-9]/g, "");
        if (cleaned.length >= 10 && nextMethodId) {
          triggerAccountLookup(cleaned, nextMethodId);
        } else {
          setAccountName("");
        }
      }
    },
    [
      deliveryAvailability,
      targetCountry,
      localeMethodsByType,
      selectedBeneficiaryId,
      accountNumber,
      triggerAccountLookup,
    ]
  );

  const handleBankNameChange = useCallback(
    (nextBank: string) => {
      const matchedMethod = availableMethods.find(
        (method) => method.id === nextBank || method.name === nextBank,
      );
      const resolvedName = matchedMethod?.name || nextBank;
      const resolvedId = matchedMethod?.id || "";

      setBankName(resolvedName);
      setSelectedMethodId(resolvedId);
      setFieldErrors((prev) => ({ ...prev, provider: undefined }));
      setAccountLookupError(null);

      if (effectivePayoutMethod === "bank") {
        const nextDefaultCode = getDefaultRoutingCode(targetCountry, resolvedName);
        if (nextDefaultCode) {
          setRoutingCode(nextDefaultCode);
        }
      }
      if (!selectedBeneficiaryId && effectivePayoutMethod !== "cash") {
        const cleaned = accountNumber.replace(/[^a-zA-Z0-9]/g, "");
        if (cleaned.length >= 10 && resolvedId) {
          triggerAccountLookup(cleaned, resolvedId);
        } else if (!resolvedId) {
          setAccountName("");
        }
      }
    },
    [
      availableMethods,
      selectedBeneficiaryId,
      effectivePayoutMethod,
      accountNumber,
      targetCountry,
      triggerAccountLookup,
    ]
  );

  // Interbank / Wallet Account Verification trigger via GET /lookup/{actno}/{bankId}
  const handleAccountNumberChange = useCallback(
    (val: string) => {
      setAccountNumber(val);
      setFieldErrors((prev) => ({ ...prev, accountNumber: undefined }));
      setError(null);
      setAccountLookupError(null);
      if (effectivePayoutMethod === "cash") return;

      const cleaned = deliverySpec.allowAlphanumeric
        ? val.replace(/[^a-zA-Z0-9]/g, "")
        : val.replace(/\D/g, "");

      triggerAccountLookup(cleaned, effectiveMethodId);
    },
    [effectivePayoutMethod, deliverySpec.allowAlphanumeric, triggerAccountLookup, effectiveMethodId]
  );

  // Clean up timers on unmount
  useEffect(() => {
    return () => {
      if (verificationTimerRef.current) clearTimeout(verificationTimerRef.current);
    };
  }, []);

  // Mathematical & Cost Calculations + /combicheck validation (temporarily disabled while endpoint returns 404)
  const isCombiCheckEnabled = false;
  const numericAmount = parseFloat(amount) || 0;
  const normalizedAmountForCheck =
    Number.isFinite(numericAmount) && numericAmount > 0
      ? String(numericAmount)
      : "";
  const [debouncedCheckAmount, setDebouncedCheckAmount] = useState<string>(
    () => normalizedAmountForCheck,
  );

  useEffect(() => {
    if (!isCombiCheckEnabled) return;
    const timer = setTimeout(
      () => {
        setDebouncedCheckAmount(normalizedAmountForCheck);
      },
      normalizedAmountForCheck ? 350 : 0,
    );
    return () => clearTimeout(timer);
  }, [isCombiCheckEnabled, normalizedAmountForCheck]);

  const effectiveCheckAmount = normalizedAmountForCheck ? debouncedCheckAmount : "";
  const isAmountDebouncing =
    isCombiCheckEnabled &&
    Boolean(normalizedAmountForCheck) &&
    effectiveCheckAmount !== normalizedAmountForCheck;

  const combiCheckPayload = useMemo<CombiCheckRequest>(
    () => ({
      amount: effectiveCheckAmount,
      destination: {
        country: effectiveTargetCountry.trim(),
        category: recipientCategory,
        means: effectiveBankName.trim(),
      },
      instrument: {
        type: paymentMethod,
      },
    }),
    [
      effectiveCheckAmount,
      effectiveTargetCountry,
      recipientCategory,
      effectiveBankName,
      paymentMethod,
    ],
  );

  const isCombiInputReady = Boolean(
    isCombiCheckEnabled &&
      localesQuery.isSuccess &&
      locales.length > 0 &&
      normalizedAmountForCheck &&
      combiCheckPayload.destination.country &&
      combiCheckPayload.destination.category &&
      combiCheckPayload.destination.means &&
      combiCheckPayload.instrument.type,
  );

  const shouldRunCombiCheck = Boolean(
    isCombiInputReady &&
      effectiveCheckAmount &&
      (step === "from" || step === "to" || step === "review"),
  );

  const combiCheckQuery = useCombiCheck(combiCheckPayload, {
    enabled: shouldRunCombiCheck,
  });

  const isCombiChecking = Boolean(
    isCombiInputReady &&
      (step === "from" || step === "to" || step === "review") &&
      (isAmountDebouncing || combiCheckQuery.isPending || combiCheckQuery.isFetching),
  );

  const combiCheckResult =
    isCombiCheckEnabled && !isCombiChecking && combiCheckQuery.isSuccess
      ? combiCheckQuery.data
      : null;
  const isCombiAllowed = !isCombiCheckEnabled || Boolean(combiCheckResult?.allowed);
  const hasVerifiedFee = !isCombiCheckEnabled || Boolean(combiCheckResult && combiCheckResult.allowed);
  const combiCheckError =
    isCombiCheckEnabled && !isCombiChecking && combiCheckQuery.isError
      ? getErrorMessage(
          combiCheckQuery.error,
          "Unable to validate transfer combination. Please try again.",
        )
      : null;
  const combiCheckUnsupportedMessage =
    isCombiCheckEnabled && combiCheckResult && !combiCheckResult.allowed
      ? combiCheckResult.message ||
        `This transfer combination (${effectiveTargetCountry} · ${effectiveBankName} · ${paymentMethod}) is not supported. Change the amount, destination country, payout method, or payment method.`
      : null;

  const liveExchangeRate = useMemo(() => {
    if (!effectiveSendCurrency || !effectiveTargetCurrency) return 0;
    if (effectiveSendCurrency === effectiveTargetCurrency) return 1;
    const srcRate = localeRatesMap[effectiveSendCurrency.toUpperCase()];
    const dstRate = localeRatesMap[effectiveTargetCurrency.toUpperCase()];
    if (srcRate && dstRate && srcRate > 0) {
      return dstRate / srcRate;
    }
    return 0;
  }, [effectiveSendCurrency, effectiveTargetCurrency, localeRatesMap]);

  const calculation = useMemo(() => {
    const backendFee = isCombiCheckEnabled
      ? combiCheckResult
        ? combiCheckResult.fee
        : 0
      : undefined;
    return calculatePersonalRemittance(
      numericAmount,
      effectiveSendCurrency,
      effectiveTargetCurrency,
      liveExchangeRate,
      backendFee,
    );
  }, [
    isCombiCheckEnabled,
    numericAmount,
    effectiveSendCurrency,
    effectiveTargetCurrency,
    liveExchangeRate,
    combiCheckResult,
  ]);

  const clearingRail = useMemo(() => {
    return getClearingRail(effectiveTargetCurrency, effectiveTargetCountry);
  }, [effectiveTargetCurrency, effectiveTargetCountry]);

  const isLocalRoute =
    Boolean(effectiveSendCountry) && effectiveSendCountry === effectiveTargetCountry;

  // Validation Gates
  const getFromValidationError = useCallback((): string | null => {
    if (!localesQuery.isSuccess || locales.length === 0) {
      return localesQuery.isError
        ? getErrorMessage(localesQuery.error, "Unable to load supported countries and rates.")
        : "Loading supported countries and rates from server...";
    }
    if (isNaN(numericAmount) || numericAmount <= 0) {
      return "Enter a valid transfer amount greater than 0.";
    }
    if (paymentMethod === "card") {
      const cleanNum = cardData.number.replace(/\D/g, "");
      if (cleanNum.length < 16) {
        return "Enter a valid 16-digit card number.";
      }
      if (!isValidCardExpiry(cardData.expiry)) {
        return "Enter a valid card expiry date (MM/YY).";
      }
      if (!cardData.cvv || cardData.cvv.length < 3) {
        return "Enter a valid 3 or 4-digit CVV.";
      }
    }
    if (paymentMethod === "mobile") {
      const cleanPhone = senderPhone.replace(/\D/g, "");
      if (cleanPhone.length < 8) {
        return "Enter a valid sender phone number (at least 8 digits).";
      }
    }
    if (schedule.enabled && schedule.mode !== "now") {
      if (!schedule.date) {
        return "Select a valid schedule date.";
      }
      const todayIso = new Date().toISOString().split("T")[0];
      if (schedule.date < todayIso) {
        return "Schedule date cannot be in the past.";
      }
    }
    return null;
  }, [
    localesQuery.isSuccess,
    localesQuery.isError,
    localesQuery.error,
    locales.length,
    numericAmount,
    paymentMethod,
    cardData,
    senderPhone,
    schedule,
  ]);

  const isFromValid = useMemo(() => getFromValidationError() === null, [getFromValidationError]);

  const isToValid = useMemo(() => {
    return validateDeliveryDetails({
      country: effectiveTargetCountry,
      method: effectivePayoutMethod,
      provider: effectiveBankName,
      availableProviders,
      isCountrySupported: deliveryAvailability.supported,
      isMethodAvailable: deliveryAvailability[effectivePayoutMethod],
      accountNumber,
      routingCode,
      accountName,
      recipientPhone,
      pickupCity,
      isResolvingName,
    }).valid;
  }, [
    effectiveTargetCountry,
    effectivePayoutMethod,
    effectiveBankName,
    availableProviders,
    deliveryAvailability,
    accountNumber,
    routingCode,
    accountName,
    recipientPhone,
    pickupCity,
    isResolvingName,
  ]);

  // Beneficiary Selection Handler
  const selectBeneficiary = useCallback(
    (beneficiary: Recipient) => {
      setSelectedBeneficiaryId(beneficiary.id);
      setTargetRecipientId(beneficiary.id);
      setTargetCountry(beneficiary.country);
      const matchedLocale =
        locales.find((locale) => locale.name.toLowerCase() === beneficiary.country.toLowerCase()) ??
        null;

      const nextMethod = inferRecipientMethod(beneficiary.method, matchedLocale);
      setPayoutMethod(nextMethod);
      const localeGroup = groupLocaleMethods(matchedLocale);
      const matchedLocaleMethod =
        localeGroup[nextMethod].find(
          (method) =>
            beneficiary.provider &&
            method.name.toLowerCase() === beneficiary.provider.toLowerCase(),
        ) ||
        localeGroup[nextMethod][0] ||
        null;

      const nextProvider = matchedLocaleMethod?.name || beneficiary.provider || "";
      setBankName(nextProvider);
      setSelectedMethodId(matchedLocaleMethod?.id || "");
      setRoutingCode(
        nextMethod === "bank" ? getDefaultRoutingCode(beneficiary.country, nextProvider) : ""
      );
      const spec = getDeliveryFieldSpec(beneficiary.country, nextMethod, nextProvider);
      const cleanAcc = beneficiary.account.replace(/[^0-9]/g, "");
      if (nextMethod === "cash") {
        setRecipientPhone(cleanAcc.length >= 7 ? cleanAcc : "8012345678");
        setPickupCity((prev) => prev || beneficiary.country);
      } else {
        const minDemoDigits = Math.max(10, spec.minLength);
        const fallbackAcc = "0123456789012345".slice(0, minDemoDigits);
        setAccountNumber(cleanAcc.length >= spec.minLength ? cleanAcc : fallbackAcc);
      }
      setAccountName(beneficiary.name);
      setAccountLookupError(null);
      setFieldErrors({});
      setError(null);
    },
    [locales, setTargetRecipientId]
  );

  const clearSelectedBeneficiary = useCallback(() => {
    setSelectedBeneficiaryId(null);
    setTargetRecipientId(null);
    setAccountNumber("");
    setAccountName("");
    setAccountLookupError(null);
    setRecipientPhone("");
    setPickupCity("");
    setRoutingCode(
      effectivePayoutMethod === "bank"
        ? getDefaultRoutingCode(targetCountry, effectiveBankName)
        : ""
    );
    setFieldErrors({});
    setError(null);
  }, [setTargetRecipientId, effectivePayoutMethod, targetCountry, effectiveBankName]);

  // Navigation Handlers
  const goToTo = useCallback(() => {
    if (!env.bypassKycVerification && verificationStatus && verificationStatus !== "approved") {
      setError("Complete identity verification before initiating a transfer.");
      return;
    }
    const validationError = getFromValidationError();
    if (validationError) {
      setError(validationError);
      return;
    }
    if (isCombiChecking) {
      setError("Please wait while we verify your transfer combination.");
      return;
    }
    if (combiCheckError) {
      setError(combiCheckError);
      return;
    }
    if (!isCombiAllowed) {
      setError(
        combiCheckUnsupportedMessage ||
          "Selected transfer combination is not supported. Adjust your selection to continue.",
      );
      return;
    }
    setError(null);
    setStep("to");
  }, [
    getFromValidationError,
    verificationStatus,
    isCombiChecking,
    combiCheckError,
    isCombiAllowed,
    combiCheckUnsupportedMessage,
  ]);

  const goToReview = useCallback(() => {
    const result = validateDeliveryDetails({
      country: effectiveTargetCountry,
      method: effectivePayoutMethod,
      provider: effectiveBankName,
      availableProviders,
      isCountrySupported: deliveryAvailability.supported,
      isMethodAvailable: deliveryAvailability[effectivePayoutMethod],
      accountNumber,
      routingCode,
      accountName,
      recipientPhone,
      pickupCity,
      isResolvingName,
    });
    if (!result.valid) {
      setFieldErrors(result.fieldErrors);
      setError(result.error);
      return;
    }
    if (isCombiChecking) {
      setError("Please wait while we verify your transfer combination.");
      return;
    }
    if (combiCheckError) {
      setError(combiCheckError);
      return;
    }
    if (!isCombiAllowed) {
      setError(
        combiCheckUnsupportedMessage ||
          "Selected transfer combination is not supported. Change your destination, payout method, or payment method.",
      );
      return;
    }
    setFieldErrors({});
    setError(null);
    setStep("review");
  }, [
    effectiveTargetCountry,
    effectivePayoutMethod,
    effectiveBankName,
    availableProviders,
    deliveryAvailability,
    accountNumber,
    routingCode,
    accountName,
    recipientPhone,
    pickupCity,
    isResolvingName,
    isCombiChecking,
    combiCheckError,
    isCombiAllowed,
    combiCheckUnsupportedMessage,
  ]);

  const goBack = useCallback(() => {
    if (isSubmittingRef.current) return;
    setError(null);
    if (step === "to") setStep("from");
    if (step === "review") setStep("to");
    if (step === "failed") setStep("review");
  }, [step]);

  // Execution Step: [processing] -> [pending | success | failed]
  const confirmTransfer = useCallback(
    async (pin: string, otp = "") => {
      lastAuthRef.current = { pin, otp };
      if (!env.bypassKycVerification && verificationStatus && verificationStatus !== "approved") {
        const msg = "Complete identity verification before sending a transfer.";
        setError(msg);
        toast.error(msg);
        return;
      }
      if (onBeforeSubmit && !onBeforeSubmit()) return;
      if (
        isSubmittingRef.current ||
        step === "processing" ||
        step === "pending" ||
        step === "success"
      ) {
        return;
      }
      if (completedSubmissionIdsRef.current.has(submissionIdRef.current)) {
        return;
      }
      if (isCombiChecking || !isCombiAllowed) {
        const msg =
          combiCheckError ||
          combiCheckUnsupportedMessage ||
          "Wait for combination validation before sending this transfer.";
        setError(msg);
        toast.error(msg);
        return;
      }

      isSubmittingRef.current = true;
      setIsSubmitting(true);
      setError(null);
      setCompletedTransfer(null);
      setStep("processing");
      setProcessingProgress(45);
      setProcessingMessage(
        isLocalRoute
          ? `Routing local clearing (${effectiveSendCurrency})...`
          : `Sending cross-border transfer (${effectiveSendCurrency} → ${effectiveTargetCurrency})...`,
      );

      const selectedBank =
        linkedBanks.find((b) => b.id === linkedBankId) || linkedBanks[0];
      const bankAccountDigits =
        selectedBank?.account.replace(/\D/g, "") || selectedBank?.mandateRef || "";
      const parsedMeansId = Number(effectiveMethodId);
      const resolvedMeansId =
        effectiveMethodId && Number.isFinite(parsedMeansId)
          ? parsedMeansId
          : (selectedBeneficiaryId ?? 0);

      const payload = mapSendFundsInputToRequest({
        amount: numericAmount,
        narration: description,
        schedule,
        targetCountry: effectiveTargetCountry,
        recipientName: accountName,
        recipientCategory,
        bankName: effectiveBankName || clearingRail.settlementRailProtocol,
        meansId: resolvedMeansId,
        payoutMethod: effectivePayoutMethod,
        recipientPhone,
        recipientEmail,
        recipientAddress,
        paymentMethod,
        bankAccountNumber: bankAccountDigits,
        cardNumber: cardData.number,
        cardExpiry: cardData.expiry,
        cardCvv: cardData.cvv,
        senderPhone,
        pin,
        otp,
      });

      try {
        const result = await sendFundsMutation.mutateAsync(payload);
        setProcessingProgress(100);
        setProcessingMessage(result.message || "Transfer response received.");

        const scheduleLabel = getScheduleLabel(schedule);
        const transferDate = result.statusDate || scheduleLabel || formatTransferTimestamp();
        const transferStatus = result.transactionStatus;
        const methodLabel =
          effectivePayoutMethod === "cash"
            ? "Cash pickup"
            : effectivePayoutMethod === "mobile"
              ? "Mobile money"
              : "Bank transfer";

        const newTransfer: Transfer = {
          id: result.reference || `ST-${Math.floor(100000 + Math.random() * 900000)}`,
          name: result.recipient || accountName.trim() || "Recipient",
          country: effectiveTargetCountry,
          amount: result.amount || numericAmount,
          currency: effectiveSendCurrency,
          status: transferStatus,
          date: transferDate,
          provider: result.bank || effectiveBankName || clearingRail.settlementRailProtocol,
          method: methodLabel,
          usdAmount: effectiveSendCurrency === "USD" ? numericAmount : undefined,
          recipientAmount: calculation.recipientReceives,
          recipientCurrency: effectiveTargetCurrency,
          feeAmount: calculation.feeAmount,
          feeCurrency: effectiveSendCurrency,
          exchangeRate: calculation.exchangeRate,
          description: description.trim() || `Transfer to ${accountName.trim()}`,
          schedule: scheduleLabel,
          pickupCity: effectivePayoutMethod === "cash" ? pickupCity.trim() : undefined,
          recipientPhone: recipientPhone.trim() || undefined,
          deliveryInstructions,
          payTo: result.payTo,
          failureReason: transferStatus === "Failed" ? result.message : undefined,
        };

        completedSubmissionIdsRef.current.add(submissionIdRef.current);
        setTransfers([newTransfer, ...transfers]);
        setCompletedTransfer(newTransfer);

        if (transferStatus === "Failed" || transferStatus === "Cancelled") {
          const failMsg =
            result.message ||
            (transferStatus === "Cancelled"
              ? "Transfer was cancelled."
              : "Transfer failed.");
          isSubmittingRef.current = false;
          setIsSubmitting(false);
          setError(failMsg);
          toast.error(failMsg);
          setStep("failed");
          return;
        }

        if (saveBeneficiary && !selectedBeneficiaryId) {
          const accLabel =
            effectivePayoutMethod === "cash"
              ? recipientPhone.trim()
              : `•••• ${accountNumber.slice(-4)}`;
          const newBeneficiary: Recipient = {
            id: Date.now(),
            name: accountName.trim(),
            country: effectiveTargetCountry,
            method: methodLabel,
            account: accLabel,
            initials: accountName
              .trim()
              .split(" ")
              .map((p) => p[0])
              .slice(0, 2)
              .join("")
              .toUpperCase(),
            provider: effectiveBankName,
          };
          const updatedRecipients = [newBeneficiary, ...recipients];
          setRecipients(updatedRecipients);

          try {
            localStorage.setItem(
              STORAGE_KEYS.BENEFICIARIES,
              JSON.stringify(updatedRecipients),
            );
          } catch {
            // ignore
          }
        }

        isSubmittingRef.current = false;
        setIsSubmitting(false);

        if (transferStatus === "Pending" || transferStatus === "Processing") {
          toast.info(result.message || "Transaction initiated and pending.");
          setStep("pending");
          return;
        }

        toast.success(result.message || "Transfer completed successfully.");
        setStep("success");
      } catch (err) {
        const baseMessage = getErrorMessage(
          err,
          "Transfer could not be completed. Please retry.",
        );
        const firstFieldError =
          isApiError(err) && err.fieldErrors
            ? Object.values(err.fieldErrors).flat()[0]
            : undefined;
        const finalMessage = firstFieldError || baseMessage;

        isSubmittingRef.current = false;
        setIsSubmitting(false);
        setError(finalMessage);
        toast.error(finalMessage);
        setStep("failed");
      }
    },
    [
      verificationStatus,
      onBeforeSubmit,
      step,
      isLocalRoute,
      effectiveSendCurrency,
      effectiveTargetCurrency,
      linkedBanks,
      linkedBankId,
      numericAmount,
      description,
      schedule,
      effectiveTargetCountry,
      accountName,
      recipientCategory,
      effectiveBankName,
      effectiveMethodId,
      clearingRail.settlementRailProtocol,
      selectedBeneficiaryId,
      effectivePayoutMethod,
      recipientPhone,
      recipientEmail,
      recipientAddress,
      paymentMethod,
      isCombiChecking,
      isCombiAllowed,
      combiCheckError,
      combiCheckUnsupportedMessage,
      cardData.number,
      cardData.expiry,
      cardData.cvv,
      senderPhone,
      sendFundsMutation,
      calculation.recipientReceives,
      calculation.feeAmount,
      calculation.exchangeRate,
      pickupCity,
      deliveryInstructions,
      setTransfers,
      transfers,
      saveBeneficiary,
      accountNumber,
      recipients,
      setRecipients,
    ],
  );

  const retryTransfer = useCallback(() => {
    void confirmTransfer(lastAuthRef.current.pin, lastAuthRef.current.otp);
  }, [confirmTransfer]);

  const checkPendingStatus = useCallback(async () => {
    if (!completedTransfer || isCheckingStatus) return;
    setIsCheckingStatus(true);
    try {
      const tracked = await trackTransferService.trackTransaction({
        id: completedTransfer.id,
        name: completedTransfer.name,
        destinaton: {
          country: completedTransfer.country,
        },
      });
      void queryClient.invalidateQueries({ queryKey: transactionKeys.lists() });

      const updatedTransfer: Transfer = {
        ...completedTransfer,
        status: tracked.status,
        date: tracked.timestamp || completedTransfer.date,
        failureReason:
          tracked.status === "Failed"
            ? tracked.message || completedTransfer.failureReason
            : completedTransfer.failureReason,
        cancellationReason:
          tracked.status === "Cancelled"
            ? tracked.message || completedTransfer.cancellationReason
            : completedTransfer.cancellationReason,
      };

      setCompletedTransfer(updatedTransfer);
      setTransfers(
        transfers.map((item) =>
          item.id === updatedTransfer.id ? updatedTransfer : item,
        ),
      );

      if (tracked.status === "Completed") {
        toast.success(tracked.message || "Transfer completed.");
        setStep("success");
      } else if (tracked.status === "Failed" || tracked.status === "Cancelled") {
        const failMsg =
          tracked.message ||
          updatedTransfer.failureReason ||
          updatedTransfer.cancellationReason ||
          `Transfer ${tracked.status.toLowerCase()}.`;
        setError(failMsg);
        toast.error(failMsg);
        setStep("failed");
      } else {
        toast.info(
          tracked.message ||
            `Transaction is still ${tracked.status.toLowerCase()}.`,
        );
      }
    } catch (err) {
      toast.error(getErrorMessage(err, "Unable to check transaction status."));
    } finally {
      setIsCheckingStatus(false);
    }
  }, [completedTransfer, isCheckingStatus, queryClient, setTransfers, transfers]);

  const swapCountries = useCallback(() => {
    const prevSendCountry = effectiveSendCountry;
    const prevTargetCountry = effectiveTargetCountry;

    const currentConverted = calculation.recipientReceives;
    if (numericAmount > 0 && currentConverted > 0) {
      const rounded = Number(currentConverted.toFixed(2));
      setAmount(String(rounded));
    }

    setSendCountry(prevTargetCountry);
    handleCountryChange(prevSendCountry);
  }, [
    effectiveSendCountry,
    effectiveTargetCountry,
    calculation.recipientReceives,
    numericAmount,
    handleCountryChange,
  ]);

  const resetFlow = useCallback(() => {
    isSubmittingRef.current = false;
    setIsSubmitting(false);
    submissionIdRef.current = createSubmissionId();
    lastAuthRef.current = { pin: "", otp: "" };
    setStep("from");
    setAmount("500");
    setPayoutMethod("bank");
    setSelectedMethodId("");
    setAccountNumber("");
    setRoutingCode(getDefaultRoutingCode(targetCountry, effectiveBankName));
    setAccountName("");
    setAccountLookupError(null);
    setPickupCity("");
    setPickupIdType(PICKUP_ID_TYPES[0]);
    setRecipientPhone("");
    setRecipientCategory("individual");
    setRecipientEmail("");
    setRecipientAddress("");
    setFieldErrors({});
    setSelectedBeneficiaryId(null);
    setTargetRecipientId(null);
    setDescription("");
    setSchedule({
      enabled: false,
      mode: "now",
      date: getTomorrowIsoDate(),
      frequency: "Monthly",
    });
    setError(null);
    setCompletedTransfer(null);
    setProcessingProgress(0);
    setProcessingMessage("");
  }, [setTargetRecipientId, targetCountry, effectiveBankName]);

  return {
    step,
    setStep,
    amount,
    setAmount,
    sendCountry: effectiveSendCountry,
    setSendCountry,
    sendCurrency: effectiveSendCurrency,
    setSendCurrency: (_currency: string) => {},
    paymentMethod,
    setPaymentMethod,
    linkedBankId,
    setLinkedBankId,
    cardData,
    setCardData,
    senderPhone,
    setSenderPhone,
    targetCountry: effectiveTargetCountry,
    setTargetCountry: handleCountryChange,
    targetCurrency: effectiveTargetCurrency,
    setTargetCurrency: (_currency: string) => {},
    payoutMethod: effectivePayoutMethod,
    setPayoutMethod: handlePayoutMethodChange,
    deliveryAvailability,
    deliverySpec,
    deliveryInstructionDetails,
    deliveryInstructions,
    availableWallets,
    availableProviders,
    availableMethods,
    selectedMethod,
    supportedCountries,
    currencyByCountry,
    isoByCountry,
    localeRatesMap,
    isLoadingLocales: localesQuery.isLoading,
    localesError: localesQuery.isError
      ? getErrorMessage(localesQuery.error, "Unable to load supported currencies and routes.")
      : null,
    refetchLocales: localesQuery.refetch,
    bankName: effectiveBankName,
    setBankName: handleBankNameChange,
    accountNumber,
    setAccountNumber: handleAccountNumberChange,
    routingCode,
    setRoutingCode: (val: string) => {
      setRoutingCode(val.replace(/\D/g, "").slice(0, 6));
      setFieldErrors((prev) => ({ ...prev, routingCode: undefined }));
      setError(null);
    },
    accountName,
    setAccountName: (val: string) => {
      setAccountName(val);
      setAccountLookupError(null);
      setFieldErrors((prev) => ({ ...prev, accountName: undefined }));
      setError(null);
    },
    accountLookupError,
    pickupCity,
    setPickupCity: (val: string) => {
      setPickupCity(val);
      setFieldErrors((prev) => ({ ...prev, pickupCity: undefined }));
      setError(null);
    },
    pickupIdType,
    setPickupIdType,
    recipientPhone,
    setRecipientPhone: (val: string) => {
      setRecipientPhone(val);
      setFieldErrors((prev) => ({ ...prev, recipientPhone: undefined }));
      setError(null);
    },
    recipientCategory,
    setRecipientCategory,
    recipientEmail,
    setRecipientEmail,
    recipientAddress,
    setRecipientAddress,
    fieldErrors,
    isResolvingName,
    selectedBeneficiaryId,
    saveBeneficiary,
    setSaveBeneficiary,
    description,
    setDescription,
    schedule,
    setSchedule,
    processingProgress,
    processingMessage,
    error,
    completedTransfer,
    isSubmitting,
    isCheckingStatus,
    isLocalRoute,
    linkedBanks,
    calculation,
    isCombiChecking,
    isCombiAllowed,
    hasVerifiedFee,
    combiCheckError,
    combiCheckUnsupportedMessage,
    refetchCombiCheck: combiCheckQuery.refetch,
    clearingRail,
    isFromValid,
    isToValid,
    selectBeneficiary,
    clearSelectedBeneficiary,
    goToTo,
    goToReview,
    goBack,
    confirmTransfer,
    retryTransfer,
    checkPendingStatus,
    swapCountries,
    resetFlow,
  };
}
