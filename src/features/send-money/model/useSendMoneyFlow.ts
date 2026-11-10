import { useState, useEffect, useMemo, useRef, useCallback } from "react";
import type { Recipient } from "@/entities/recipient";
import type { Transfer } from "@/entities/transfer";
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
  type PersonalPaymentMethod,
  type ConsumerLinkedBank,
} from "./data";

export type FlowStep = "from" | "to" | "review" | "processing" | "success" | "failed";

export interface CardInputs {
  number: string;
  expiry: string;
  cvv: string;
  name: string;
}

export interface UseSendMoneyFlowProps {
  recipients: Recipient[];
  targetRecipientId: number | null;
  defaultCountry: string;
  setTargetRecipientId: (id: number | null) => void;
  setRecipients: (items: Recipient[]) => void;
  transfers: Transfer[];
  setTransfers: (items: Transfer[]) => void;
}

function parseUrlParams(recipients: Recipient[], targetRecipientId: number | null) {
  let source = "USD";
  let target = "NGN";
  let country = "Nigeria";
  let amt = "500";
  let beneficiaryId: number | null = targetRecipientId;
  let bank = "";
  let accNum = "";
  let accName = "";

  if (typeof window !== "undefined") {
    const searchParams = new URLSearchParams(window.location.search);
    const sourceParam = searchParams.get("source");
    const targetParam = searchParams.get("target");
    const amountParam = searchParams.get("amount");
    const bParam = searchParams.get("beneficiary");

    if (sourceParam) source = sourceParam.toUpperCase();
    if (targetParam) {
      target = targetParam.toUpperCase();
      const match = Object.keys(COUNTRY_TO_CURRENCY).find(
        (c) => COUNTRY_TO_CURRENCY[c] === targetParam.toUpperCase()
      );
      if (match) country = match;
    }
    if (amountParam && !isNaN(parseFloat(amountParam))) {
      amt = amountParam;
    }
    if (bParam) {
      beneficiaryId = Number(bParam);
    }
  }

  if (beneficiaryId) {
    const found = recipients.find((r) => r.id === beneficiaryId);
    if (found) {
      country = found.country;
      target = COUNTRY_TO_CURRENCY[found.country] || "NGN";
      bank = found.provider || CORRIDOR_BANKS[found.country]?.[0] || "";
      accNum = found.account.replace(/[^0-9]/g, "");
      accName = found.name;
    }
  }

  if (!bank) {
    bank = CORRIDOR_BANKS[country]?.[0] || CORRIDOR_BANKS.Nigeria[0];
  }

  return { source, target, country, amt, beneficiaryId, bank, accNum, accName };
}

export function useSendMoneyFlow({
  recipients,
  targetRecipientId,
  defaultCountry,
  setTargetRecipientId,
  setRecipients,
  transfers,
  setTransfers,
}: UseSendMoneyFlowProps) {
  const initialParams = useMemo(() => {
    const parsed = parseUrlParams(recipients, targetRecipientId);
    if (!targetRecipientId && defaultCountry) {
      parsed.country = defaultCountry;
      parsed.target = COUNTRY_TO_CURRENCY[defaultCountry] || parsed.target;
      parsed.bank = CORRIDOR_BANKS[defaultCountry]?.[0] || parsed.bank;
    }
    return parsed;
  }, [recipients, targetRecipientId, defaultCountry]);

  // Step state machine: [from] -> [to] -> [review] -> [processing] -> [success | failed]
  const [step, setStep] = useState<FlowStep>("from");

  // Step 1: Source & Amount Inputs
  const [amount, setAmount] = useState<string>(() => initialParams.amt);
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

  // Step 2: Recipient Inputs
  const [targetCountry, setTargetCountry] = useState<string>(() => initialParams.country);
  const [targetCurrency, setTargetCurrency] = useState<string>(() => initialParams.target);
  const [bankName, setBankName] = useState<string>(() => initialParams.bank);
  const [accountNumber, setAccountNumber] = useState<string>(() => initialParams.accNum);
  const [accountName, setAccountName] = useState<string>(() => initialParams.accName);
  const [isResolvingName, setIsResolvingName] = useState<boolean>(false);
  const [selectedBeneficiaryId, setSelectedBeneficiaryId] = useState<number | null>(
    () => initialParams.beneficiaryId
  );
  const [saveBeneficiary, setSaveBeneficiary] = useState<boolean>(false);

  // Step 3: Review & Description
  const [description, setDescription] = useState<string>("");

  // Processing & Execution State
  const [processingProgress, setProcessingProgress] = useState<number>(0);
  const [processingMessage, setProcessingMessage] = useState<string>("");
  const [error, setError] = useState<string | null>(null);
  const [completedTransfer, setCompletedTransfer] = useState<Transfer | null>(null);

  const verificationTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const processingTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

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

  // Update target country handler
  const handleCountryChange = useCallback((newCountry: string) => {
    setTargetCountry(newCountry);
    const newCurr = COUNTRY_TO_CURRENCY[newCountry] || "NGN";
    setTargetCurrency(newCurr);
    const banks = CORRIDOR_BANKS[newCountry] || CORRIDOR_BANKS.Nigeria;
    setBankName(banks[0] || "");
    if (!selectedBeneficiaryId) {
      setAccountName("");
    }
  }, [selectedBeneficiaryId]);

  // Interbank Account Verification trigger: accountNumber.length >= 8
  const handleAccountNumberChange = useCallback((val: string) => {
    setAccountNumber(val);
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
  }, [bankName, targetCountry, selectedBeneficiaryId]);

  // Clean up timers on unmount
  useEffect(() => {
    return () => {
      if (verificationTimerRef.current) clearTimeout(verificationTimerRef.current);
      if (processingTimerRef.current) clearTimeout(processingTimerRef.current);
    };
  }, []);

  // Mathematical & Cost Calculations (Section 2)
  const numericAmount = parseFloat(amount) || 0;
  const calculation = useMemo(() => {
    return calculatePersonalRemittance(numericAmount, sendCurrency, targetCurrency);
  }, [numericAmount, sendCurrency, targetCurrency]);

  const clearingRail = useMemo(() => {
    return getClearingRail(targetCurrency, targetCountry);
  }, [targetCurrency, targetCountry]);

  // Validation Gates
  const isFromValid = useMemo(() => {
    if (isNaN(numericAmount) || numericAmount <= 0) return false;
    if (paymentMethod === "card") {
      const cleanNum = cardData.number.replace(/\D/g, "");
      if (cleanNum.length < 16) return false;
      if (!cardData.expiry || cardData.expiry.length < 4) return false;
      if (!cardData.cvv || cardData.cvv.length < 3) return false;
    }
    if (paymentMethod === "mobile") {
      const cleanPhone = senderPhone.replace(/\D/g, "");
      if (cleanPhone.length < 8) return false;
    }
    return true;
  }, [numericAmount, paymentMethod, cardData, senderPhone]);

  const isToValid = useMemo(() => {
    const cleanNum = accountNumber.replace(/\D/g, "");
    return cleanNum.length >= 8 && accountName.trim().length > 0 && bankName.trim().length > 0;
  }, [accountNumber, accountName, bankName]);

  // Beneficiary Selection Handler
  const selectBeneficiary = useCallback((beneficiary: Recipient) => {
    setSelectedBeneficiaryId(beneficiary.id);
    setTargetRecipientId(beneficiary.id);
    setTargetCountry(beneficiary.country);
    const currency = COUNTRY_TO_CURRENCY[beneficiary.country] || "NGN";
    setTargetCurrency(currency);
    setBankName(beneficiary.provider || CORRIDOR_BANKS[beneficiary.country]?.[0] || "");
    const cleanAcc = beneficiary.account.replace(/[^0-9]/g, "");
    setAccountNumber(cleanAcc.length >= 8 ? cleanAcc : "0123456789");
    setAccountName(beneficiary.name);
    setError(null);
  }, [setTargetRecipientId]);

  const clearSelectedBeneficiary = useCallback(() => {
    setSelectedBeneficiaryId(null);
    setTargetRecipientId(null);
    setAccountNumber("");
    setAccountName("");
  }, [setTargetRecipientId]);

  // Navigation Handlers
  const goToTo = useCallback(() => {
    setError(null);
    if (!isFromValid) {
      if (numericAmount <= 0) {
        setError("Please enter a valid transfer amount greater than 0.");
      } else if (paymentMethod === "card") {
        setError("Please complete all valid 16-digit card details.");
      } else if (paymentMethod === "mobile") {
        setError("Please enter a valid sender phone number for direct STK push.");
      }
      return;
    }
    setStep("to");
  }, [isFromValid, numericAmount, paymentMethod]);

  const goToReview = useCallback(() => {
    setError(null);
    if (!isToValid) {
      setError("Please ensure account number (at least 8 digits) and verified name are valid.");
      return;
    }
    setStep("review");
  }, [isToValid]);

  const goBack = useCallback(() => {
    setError(null);
    if (step === "to") setStep("from");
    if (step === "review") setStep("to");
    if (step === "failed") setStep("review");
  }, [step]);

  // Execution Step: [processing] -> [success | failed]
  const confirmTransfer = useCallback(() => {
    setError(null);
    setStep("processing");
    setProcessingProgress(15);
    setProcessingMessage("Authorizing consumer debit mandate...");

    const t1 = setTimeout(() => {
      setProcessingProgress(45);
      setProcessingMessage(`Triangulating FX corridor via Settle Treasury (${sendCurrency} → ${targetCurrency})...`);
    }, 1200);

    const t2 = setTimeout(() => {
      setProcessingProgress(78);
      setProcessingMessage(`Dispatching to corridor clearing rail (${clearingRail.settlementRailProtocol})...`);
    }, 2500);

    const t3 = setTimeout(() => {
      setProcessingProgress(100);
      setProcessingMessage("Confirming interbank settlement...");

      // 90% probability -> success; 10% probability -> failed
      const isSuccess = Math.random() < SUCCESS_PROBABILITY;

      const transferId = `ST-${Math.floor(100000 + Math.random() * 900000)}`;
      const newTransfer: Transfer = {
        id: transferId,
        name: accountName || "Demo Recipient",
        country: targetCountry,
        amount: numericAmount,
        currency: sendCurrency,
        status: isSuccess ? "Completed" : "Failed",
        date: "Just now",
        provider: bankName || clearingRail.settlementRailProtocol,
        method: paymentMethod === "bank" ? "Bank Direct Debit" : paymentMethod === "card" ? "Debit Card" : "Mobile Money",
        usdAmount: sendCurrency === "USD" ? numericAmount : undefined,
        recipientAmount: calculation.recipientReceives,
        recipientCurrency: targetCurrency,
        feeAmount: calculation.feeAmount,
        feeCurrency: sendCurrency,
        exchangeRate: calculation.exchangeRate,
        description: description.trim() || `Transfer to ${accountName}`,
      };

      if (isSuccess) {
        // Push completed transaction to storage
        setTransfers([newTransfer, ...transfers]);
        setCompletedTransfer(newTransfer);

        // Save beneficiary if checked
        if (saveBeneficiary && !selectedBeneficiaryId) {
          const newBeneficiary: Recipient = {
            id: Date.now(),
            name: accountName,
            country: targetCountry,
            method: paymentMethod === "mobile" ? "Mobile money" : "Bank transfer",
            account: `•••• ${accountNumber.slice(-4)}`,
            initials: accountName
              .split(" ")
              .map((p) => p[0])
              .slice(0, 2)
              .join("")
              .toUpperCase(),
            provider: bankName,
          };
          const updatedRecipients = [newBeneficiary, ...recipients];
          setRecipients(updatedRecipients);

          // Sync to Section 7 persistence key
          try {
            localStorage.setItem(STORAGE_KEYS.BENEFICIARIES, JSON.stringify(updatedRecipients));
          } catch {
            // ignore
          }
        }

        setStep("success");
      } else {
        // Failed path
        setTransfers([newTransfer, ...transfers]);
        setCompletedTransfer(newTransfer);
        setError("Partner interbank clearing rail timed out or reported a momentary network decline. Please retry.");
        setStep("failed");
      }
    }, PROCESSING_DURATION_MS);

    processingTimerRef.current = t3;

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
    };
  }, [
    sendCurrency,
    targetCurrency,
    clearingRail,
    accountName,
    targetCountry,
    numericAmount,
    bankName,
    paymentMethod,
    calculation,
    description,
    setTransfers,
    transfers,
    saveBeneficiary,
    selectedBeneficiaryId,
    accountNumber,
    recipients,
    setRecipients,
  ]);

  const retryTransfer = useCallback(() => {
    confirmTransfer();
  }, [confirmTransfer]);

  const resetFlow = useCallback(() => {
    setStep("from");
    setAmount("500");
    setAccountNumber("");
    setAccountName("");
    setSelectedBeneficiaryId(null);
    setTargetRecipientId(null);
    setDescription("");
    setError(null);
    setCompletedTransfer(null);
    setProcessingProgress(0);
    setProcessingMessage("");
  }, [setTargetRecipientId]);

  return {
    step,
    setStep,
    amount,
    setAmount,
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
    bankName,
    setBankName,
    accountNumber,
    setAccountNumber: handleAccountNumberChange,
    accountName,
    setAccountName,
    isResolvingName,
    selectedBeneficiaryId,
    saveBeneficiary,
    setSaveBeneficiary,
    description,
    setDescription,
    processingProgress,
    processingMessage,
    error,
    completedTransfer,
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
    resetFlow,
  };
}
