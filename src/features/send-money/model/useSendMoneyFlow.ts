import { useState, useEffect, useMemo, useRef, useCallback } from "react";
import type { Recipient } from "@/entities/recipient";
import type { Transfer } from "@/entities/transfer";
import { formatTransferTimestamp } from "@/shared/lib";
import {
  PROCESSING_DURATION_MS,
  SUCCESS_PROBABILITY,
  STORAGE_KEYS,
  calculatePersonalRemittance,
  getClearingRail,
  resolveInterbankAccountName,
  DEFAULT_CONSUMER_LINKED_BANKS,
  CORRIDOR_BANKS,
  COUNTRY_TO_CURRENCY,
  getCorridorBanks,
  getDeliveryInstructions,
  getDeliveryMethodAvailability,
  getPayoutProviders,
  getPayoutWallets,
  type DeliveryMethodKey,
  type PersonalPaymentMethod,
  type ConsumerLinkedBank,
} from "./data";
import {
  getScheduleLabel,
  getTomorrowIsoDate,
  type ScheduleConfig,
} from "./schedule";

export type FlowStep = "from" | "to" | "review" | "processing" | "success" | "failed";
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
  pickupCity?: string;
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
}

function createSubmissionId() {
  return `sub-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
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

function inferRecipientMethod(methodStr?: string, country?: string): PayoutMethod {
  const lower = (methodStr || "").toLowerCase();
  if (lower.includes("cash")) return "cash";
  if (
    (lower.includes("mobile") || lower.includes("m-pesa")) &&
    (!country || getPayoutWallets(country).length > 0)
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
  let pickupCity = "";
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
    pickupCity = retryDraft.pickupCity || "";
    recipientPhone = retryDraft.recipientPhone || "";
    description = retryDraft.description || "";
  } else if (beneficiaryId) {
    const found = recipients.find((r) => r.id === beneficiaryId);
    if (found) {
      country = found.country;
      target = COUNTRY_TO_CURRENCY[found.country] || "NGN";
      payoutMethod = inferRecipientMethod(found.method, found.country);
      bank = found.provider || getPayoutProviders(found.country, payoutMethod)[0] || "";
      accNum = found.account.replace(/[^0-9]/g, "");
      accName = found.name;
      if (payoutMethod === "cash") {
        recipientPhone = accNum;
      }
    }
  }

  if (!bank) {
    bank = getPayoutProviders(country, payoutMethod)[0] || CORRIDOR_BANKS.Nigeria[0];
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
    pickupCity,
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
}: UseSendMoneyFlowProps) {
  const initialParams = useMemo(() => {
    const parsed = parseUrlParams(recipients, targetRecipientId, retryDraft);
    if (!retryDraft && !targetRecipientId && defaultCountry && COUNTRY_TO_CURRENCY[defaultCountry]) {
      const nextTargetCountry = defaultCountry === "Nigeria" ? "Kenya" : defaultCountry;
      parsed.country = nextTargetCountry;
      parsed.target = COUNTRY_TO_CURRENCY[nextTargetCountry] || parsed.target;
      parsed.bank = getCorridorBanks(nextTargetCountry)[0] || parsed.bank;
    }
    return parsed;
  }, [recipients, targetRecipientId, defaultCountry, retryDraft]);

  // Step state machine: [from] -> [to] -> [review] -> [processing] -> [success | failed]
  const [step, setStep] = useState<FlowStep>("from");

  // Step 1: Source & Amount Inputs
  const [amount, setAmount] = useState<string>(() => initialParams.amt);
  const [sendCountry, setSendCountry] = useState<string>(() => initialParams.sourceCountry);
  const [sendCurrency, setSendCurrency] = useState<string>(() => initialParams.source);
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
  const [targetCurrency, setTargetCurrency] = useState<string>(() => initialParams.target);
  const [payoutMethod, setPayoutMethod] = useState<PayoutMethod>(() => initialParams.payoutMethod);
  const [bankName, setBankName] = useState<string>(() => initialParams.bank);
  const [accountNumber, setAccountNumber] = useState<string>(() => initialParams.accNum);
  const [accountName, setAccountName] = useState<string>(() => initialParams.accName);
  const [pickupCity, setPickupCity] = useState<string>(() => initialParams.pickupCity);
  const [recipientPhone, setRecipientPhone] = useState<string>(() => initialParams.recipientPhone);
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

  const verificationTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const processingTimersRef = useRef<ReturnType<typeof setTimeout>[]>([]);
  const isSubmittingRef = useRef<boolean>(false);
  const submissionIdRef = useRef<string>("sub-initial");
  const completedSubmissionIdsRef = useRef<Set<string>>(new Set());

  const clearProcessingTimers = useCallback(() => {
    processingTimersRef.current.forEach((t) => clearTimeout(t));
    processingTimersRef.current = [];
  }, []);

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

  const deliveryAvailability = useMemo(
    () => getDeliveryMethodAvailability(targetCountry),
    [targetCountry]
  );

  const availableWallets = deliveryAvailability.wallets;

  const availableProviders = useMemo(
    () => getPayoutProviders(targetCountry, payoutMethod),
    [targetCountry, payoutMethod]
  );

  const deliveryInstructions = useMemo(
    () => getDeliveryInstructions(targetCountry, payoutMethod, bankName, pickupCity),
    [targetCountry, payoutMethod, bankName, pickupCity]
  );

  // Update target country handler (preserves entered details when possible)
  const handleCountryChange = useCallback(
    (newCountry: string) => {
      setTargetCountry(newCountry);
      const newCurr = COUNTRY_TO_CURRENCY[newCountry] || "NGN";
      setTargetCurrency(newCurr);

      const availability = getDeliveryMethodAvailability(newCountry);
      const nextMethod: PayoutMethod =
        payoutMethod === "mobile" && !availability.mobile ? "bank" : payoutMethod;
      if (nextMethod !== payoutMethod) {
        setPayoutMethod(nextMethod);
      }

      const providers = getPayoutProviders(newCountry, nextMethod);
      const nextProvider = providers[0] || "";
      setBankName(nextProvider);

      if (!selectedBeneficiaryId && nextMethod !== "cash") {
        const digits = accountNumber.replace(/\D/g, "");
        if (digits.length >= 8 && nextProvider) {
          setAccountName(resolveInterbankAccountName(digits, nextProvider, newCountry));
        } else {
          setAccountName("");
        }
      }
    },
    [payoutMethod, selectedBeneficiaryId, accountNumber]
  );

  const handlePayoutMethodChange = useCallback(
    (nextMethod: PayoutMethod) => {
      const availability = getDeliveryMethodAvailability(targetCountry);
      if (nextMethod === "mobile" && !availability.mobile) {
        setError(`Mobile money is not available in ${targetCountry}.`);
        return;
      }
      setPayoutMethod(nextMethod);
      const providers = getPayoutProviders(targetCountry, nextMethod);
      const nextProvider = providers[0] || "";
      setBankName(nextProvider);
      setError(null);

      if (!selectedBeneficiaryId && nextMethod !== "cash") {
        const digits = accountNumber.replace(/\D/g, "");
        if (digits.length >= 8 && nextProvider) {
          setAccountName(resolveInterbankAccountName(digits, nextProvider, targetCountry));
        }
      }
    },
    [targetCountry, selectedBeneficiaryId, accountNumber]
  );

  const handleBankNameChange = useCallback(
    (nextBank: string) => {
      setBankName(nextBank);
      if (!selectedBeneficiaryId && payoutMethod !== "cash") {
        const digits = accountNumber.replace(/\D/g, "");
        if (digits.length >= 8 && nextBank) {
          setAccountName(resolveInterbankAccountName(digits, nextBank, targetCountry));
        }
      }
    },
    [selectedBeneficiaryId, payoutMethod, accountNumber, targetCountry]
  );

  // Interbank Account Verification trigger: accountNumber.length >= 8
  const handleAccountNumberChange = useCallback(
    (val: string) => {
      setAccountNumber(val);
      setError(null);
      if (payoutMethod === "cash") return;

      const rawDigits = val.replace(/\D/g, "");

      if (verificationTimerRef.current) clearTimeout(verificationTimerRef.current);

      if (rawDigits.length >= 8) {
        setIsResolvingName(true);
        verificationTimerRef.current = setTimeout(() => {
          const resolved = resolveInterbankAccountName(rawDigits, bankName, targetCountry);
          setAccountName(resolved);
          setIsResolvingName(false);
        }, 350);
      } else {
        if (!selectedBeneficiaryId) {
          setAccountName("");
        }
        setIsResolvingName(false);
      }
    },
    [payoutMethod, bankName, targetCountry, selectedBeneficiaryId]
  );

  // Clean up timers on unmount
  useEffect(() => {
    return () => {
      if (verificationTimerRef.current) clearTimeout(verificationTimerRef.current);
      clearProcessingTimers();
    };
  }, [clearProcessingTimers]);

  // Mathematical & Cost Calculations
  const numericAmount = parseFloat(amount) || 0;
  const calculation = useMemo(() => {
    return calculatePersonalRemittance(numericAmount, sendCurrency, targetCurrency);
  }, [numericAmount, sendCurrency, targetCurrency]);

  const clearingRail = useMemo(() => {
    return getClearingRail(targetCurrency, targetCountry);
  }, [targetCurrency, targetCountry]);

  const isLocalRoute = sendCountry === targetCountry;

  // Validation Gates
  const getFromValidationError = useCallback((): string | null => {
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
  }, [numericAmount, paymentMethod, cardData, senderPhone, schedule]);

  const isFromValid = useMemo(() => getFromValidationError() === null, [getFromValidationError]);

  const isToValid = useMemo(() => {
    if (!bankName.trim()) return false;
    if (payoutMethod === "cash") {
      const cleanPhone = recipientPhone.replace(/\D/g, "");
      return (
        accountName.trim().length >= 3 &&
        cleanPhone.length >= 7 &&
        pickupCity.trim().length >= 2
      );
    }
    const cleanNum = accountNumber.replace(/\D/g, "");
    return !isResolvingName && cleanNum.length >= 8 && accountName.trim().length > 0;
  }, [bankName, payoutMethod, recipientPhone, accountName, pickupCity, isResolvingName, accountNumber]);

  // Beneficiary Selection Handler
  const selectBeneficiary = useCallback(
    (beneficiary: Recipient) => {
      setSelectedBeneficiaryId(beneficiary.id);
      setTargetRecipientId(beneficiary.id);
      setTargetCountry(beneficiary.country);
      const currency = COUNTRY_TO_CURRENCY[beneficiary.country] || "NGN";
      setTargetCurrency(currency);

      const nextMethod = inferRecipientMethod(beneficiary.method, beneficiary.country);
      setPayoutMethod(nextMethod);
      setBankName(
        beneficiary.provider || getPayoutProviders(beneficiary.country, nextMethod)[0] || ""
      );
      const cleanAcc = beneficiary.account.replace(/[^0-9]/g, "");
      if (nextMethod === "cash") {
        setRecipientPhone(cleanAcc.length >= 7 ? cleanAcc : "8012345678");
        setPickupCity((prev) => prev || beneficiary.country);
      } else {
        setAccountNumber(cleanAcc.length >= 8 ? cleanAcc : "0123456789");
      }
      setAccountName(beneficiary.name);
      setError(null);
    },
    [setTargetRecipientId]
  );

  const clearSelectedBeneficiary = useCallback(() => {
    setSelectedBeneficiaryId(null);
    setTargetRecipientId(null);
    setAccountNumber("");
    setAccountName("");
    setRecipientPhone("");
    setPickupCity("");
  }, [setTargetRecipientId]);

  // Navigation Handlers
  const goToTo = useCallback(() => {
    const validationError = getFromValidationError();
    if (validationError) {
      setError(validationError);
      return;
    }
    setError(null);
    setStep("to");
  }, [getFromValidationError]);

  const goToReview = useCallback(() => {
    setError(null);
    if (payoutMethod !== "cash" && isResolvingName) {
      setError("Please wait for recipient verification to complete.");
      return;
    }
    if (!bankName.trim()) {
      setError(
        payoutMethod === "cash"
          ? "Select a cash pickup agent to continue."
          : payoutMethod === "mobile"
            ? "Select a mobile money provider to continue."
            : "Select a destination bank to continue."
      );
      return;
    }
    if (payoutMethod === "cash") {
      if (accountName.trim().length < 3) {
        setError("Enter the recipient's full legal name (matching government ID).");
        return;
      }
      if (recipientPhone.replace(/\D/g, "").length < 7) {
        setError("Enter a valid recipient phone number for pickup notifications.");
        return;
      }
      if (pickupCity.trim().length < 2) {
        setError("Enter the destination pickup city or branch area.");
        return;
      }
      setStep("review");
      return;
    }

    const cleanNum = accountNumber.replace(/\D/g, "");
    if (cleanNum.length < 8 || !accountName.trim()) {
      setError(
        payoutMethod === "mobile"
          ? "Enter a valid recipient mobile number (at least 8 digits)."
          : "Enter a valid account number (at least 8 digits) to verify recipient."
      );
      return;
    }
    setStep("review");
  }, [payoutMethod, isResolvingName, bankName, accountName, recipientPhone, pickupCity, accountNumber]);

  const goBack = useCallback(() => {
    if (isSubmittingRef.current) return;
    setError(null);
    if (step === "to") setStep("from");
    if (step === "review") setStep("to");
    if (step === "failed") setStep("review");
  }, [step]);

  // Execution Step: [processing] -> [success | failed]
  const confirmTransfer = useCallback(() => {
    if (onBeforeSubmit && !onBeforeSubmit()) return;
    if (isSubmittingRef.current || step === "processing" || step === "success") {
      return;
    }
    if (completedSubmissionIdsRef.current.has(submissionIdRef.current)) {
      return;
    }

    isSubmittingRef.current = true;
    setIsSubmitting(true);
    clearProcessingTimers();
    setError(null);
    setStep("processing");
    setProcessingProgress(15);
    setProcessingMessage("Authorizing consumer debit mandate...");

    const t1 = setTimeout(() => {
      setProcessingProgress(45);
      setProcessingMessage(
        isLocalRoute
          ? `Routing local clearing via Settle Treasury (${sendCurrency})...`
          : `Triangulating FX corridor via Settle Treasury (${sendCurrency} → ${targetCurrency})...`
      );
    }, 1200);

    const t2 = setTimeout(() => {
      setProcessingProgress(78);
      setProcessingMessage(
        payoutMethod === "cash"
          ? `Generating pickup authorization with ${bankName}...`
          : `Dispatching to corridor clearing rail (${clearingRail.settlementRailProtocol})...`
      );
    }, 2500);

    const t3 = setTimeout(() => {
      setProcessingProgress(100);
      setProcessingMessage("Confirming settlement...");

      const isSuccess = Math.random() < SUCCESS_PROBABILITY;
      const scheduleLabel = getScheduleLabel(schedule);
      const isScheduledLater = schedule.enabled && schedule.mode === "later";
      const transferDate = scheduleLabel || formatTransferTimestamp();

      const transferId = `ST-${Math.floor(100000 + Math.random() * 900000)}`;
      const pickupCode =
        payoutMethod === "cash" && isSuccess
          ? `PK-${Math.floor(100000 + Math.random() * 900000)}`
          : undefined;
      const failureReason = !isSuccess
        ? "Partner clearing rail timed out or declined the payout authorization. Your account was not charged."
        : undefined;

      const methodLabel =
        payoutMethod === "cash"
          ? "Cash pickup"
          : payoutMethod === "mobile"
            ? "Mobile money"
            : "Bank transfer";

      const newTransfer: Transfer = {
        id: transferId,
        name: accountName.trim() || "Demo Recipient",
        country: targetCountry,
        amount: numericAmount,
        currency: sendCurrency,
        status: !isSuccess ? "Failed" : isScheduledLater ? "Pending" : "Completed",
        date: transferDate,
        provider: bankName || clearingRail.settlementRailProtocol,
        method: methodLabel,
        usdAmount: sendCurrency === "USD" ? numericAmount : undefined,
        recipientAmount: calculation.recipientReceives,
        recipientCurrency: targetCurrency,
        feeAmount: calculation.feeAmount,
        feeCurrency: sendCurrency,
        exchangeRate: calculation.exchangeRate,
        description: description.trim() || `Transfer to ${accountName.trim()}`,
        schedule: scheduleLabel,
        failureReason,
        pickupCode,
        pickupCity: payoutMethod === "cash" ? pickupCity.trim() : undefined,
        recipientPhone: payoutMethod === "cash" ? recipientPhone.trim() : undefined,
        deliveryInstructions,
      };

      isSubmittingRef.current = false;
      setIsSubmitting(false);

      if (isSuccess) {
        completedSubmissionIdsRef.current.add(submissionIdRef.current);
        setTransfers([newTransfer, ...transfers]);
        setCompletedTransfer(newTransfer);

        if (saveBeneficiary && !selectedBeneficiaryId) {
          const accLabel =
            payoutMethod === "cash"
              ? recipientPhone.trim()
              : `•••• ${accountNumber.slice(-4)}`;
          const newBeneficiary: Recipient = {
            id: Date.now(),
            name: accountName.trim(),
            country: targetCountry,
            method: methodLabel,
            account: accLabel,
            initials: accountName
              .trim()
              .split(" ")
              .map((p) => p[0])
              .slice(0, 2)
              .join("")
              .toUpperCase(),
            provider: bankName,
          };
          const updatedRecipients = [newBeneficiary, ...recipients];
          setRecipients(updatedRecipients);

          try {
            localStorage.setItem(STORAGE_KEYS.BENEFICIARIES, JSON.stringify(updatedRecipients));
          } catch {
            // ignore
          }
        }

        setStep("success");
      } else {
        setTransfers([newTransfer, ...transfers]);
        setCompletedTransfer(newTransfer);
        setError(failureReason || "Transfer could not be completed. Please retry.");
        setStep("failed");
      }
    }, PROCESSING_DURATION_MS);

    processingTimersRef.current = [t1, t2, t3];
  }, [
    onBeforeSubmit,
    step,
    clearProcessingTimers,
    isLocalRoute,
    sendCurrency,
    targetCurrency,
    clearingRail,
    accountName,
    targetCountry,
    numericAmount,
    bankName,
    payoutMethod,
    calculation,
    description,
    pickupCity,
    recipientPhone,
    deliveryInstructions,
    setTransfers,
    transfers,
    saveBeneficiary,
    selectedBeneficiaryId,
    accountNumber,
    recipients,
    setRecipients,
    schedule,
  ]);

  const retryTransfer = useCallback(() => {
    confirmTransfer();
  }, [confirmTransfer]);

  const swapCountries = useCallback(() => {
    const prevSendCountry = sendCountry;
    const prevSendCurrency = sendCurrency;
    const prevTargetCountry = targetCountry;
    const prevTargetCurrency = targetCurrency;

    const currentConverted = calculation.recipientReceives;
    if (numericAmount > 0 && currentConverted > 0) {
      const rounded = Number(currentConverted.toFixed(2));
      setAmount(String(rounded));
    }

    setSendCountry(prevTargetCountry);
    setSendCurrency(prevTargetCurrency);
    handleCountryChange(prevSendCountry);
    setTargetCurrency(prevSendCurrency);
  }, [
    sendCountry,
    sendCurrency,
    targetCountry,
    targetCurrency,
    calculation.recipientReceives,
    numericAmount,
    handleCountryChange,
  ]);

  const resetFlow = useCallback(() => {
    clearProcessingTimers();
    isSubmittingRef.current = false;
    setIsSubmitting(false);
    submissionIdRef.current = createSubmissionId();
    setStep("from");
    setAmount("500");
    setPayoutMethod("bank");
    setAccountNumber("");
    setAccountName("");
    setPickupCity("");
    setRecipientPhone("");
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
  }, [clearProcessingTimers, setTargetRecipientId]);

  return {
    step,
    setStep,
    amount,
    setAmount,
    sendCountry,
    setSendCountry,
    sendCurrency,
    setSendCurrency,
    paymentMethod,
    setPaymentMethod,
    linkedBankId,
    setLinkedBankId,
    cardData,
    setCardData,
    senderPhone,
    setSenderPhone,
    targetCountry,
    setTargetCountry: handleCountryChange,
    targetCurrency,
    setTargetCurrency,
    payoutMethod,
    setPayoutMethod: handlePayoutMethodChange,
    deliveryAvailability,
    deliveryInstructions,
    availableWallets,
    availableProviders,
    bankName,
    setBankName: handleBankNameChange,
    accountNumber,
    setAccountNumber: handleAccountNumberChange,
    accountName,
    setAccountName,
    pickupCity,
    setPickupCity,
    recipientPhone,
    setRecipientPhone,
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
    isLocalRoute,
    linkedBanks,
    calculation,
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
    swapCountries,
    resetFlow,
  };
}
