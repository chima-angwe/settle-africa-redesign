import type React from "react";
import { useEffect, useMemo, useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { getErrorMessage } from "@/shared/api";
import { CustomSelect, Icon } from "@/shared/ui";
import { formatTransferTimestamp, parseCsvLine } from "@/shared/lib";
import type { Transfer } from "@/entities/transfer";
import { CountryBadge } from "@/entities/country";
import { useLocales } from "@/features/locales";
import {
  VerificationGateBanner,
  type VerificationStatus,
} from "@/features/manage-profile";
import {
  INITIAL_CORPORATE_FUNDING_SOURCES,
  STORAGE_KEYS,
  SUCCESS_PROBABILITY,
  ScheduledPaymentControl,
  getScheduleLabel,
  getTomorrowIsoDate,
  sendMoneyKeys,
  sendMoneyService,
  type CorporateFundingSource,
  type ScheduleConfig,
} from "@/features/send-money";

type BulkStep = "form" | "payment" | "processing" | "success" | "failed";

export interface BulkTransferProps {
  setTransfers: React.Dispatch<React.SetStateAction<Transfer[]>>;
  onTrackTransfer: (transfer: Transfer) => void;
  onBeforeSubmit?: () => boolean;
  verificationStatus?: VerificationStatus;
  onOpenVerification?: () => void;
}

interface BulkRecipientRow {
  key: string;
  country: string;
  accountNumber: string;
  bank: string;
  recipientName: string;
  amount: string;
  narration: string;
  isLookingUp?: boolean;
  lookupError?: string;
}

function createEmptyRow(indexKey?: string, defaultCountry = ""): BulkRecipientRow {
  return {
    key: indexKey || `row-${Date.now()}-${Math.floor(Math.random() * 10000)}`,
    country: defaultCountry,
    accountNumber: "",
    bank: "",
    recipientName: "",
    amount: "",
    narration: "",
    isLookingUp: false,
    lookupError: undefined,
  };
}

export function BulkTransfer({
  setTransfers,
  onTrackTransfer,
  onBeforeSubmit,
  verificationStatus,
  onOpenVerification,
}: BulkTransferProps) {
  const queryClient = useQueryClient();
  const localesQuery = useLocales();
  const locales = useMemo(() => localesQuery.data ?? [], [localesQuery.data]);
  const supportedCountries = useMemo(
    () => locales.map((locale) => locale.name),
    [locales],
  );
  const localesByCountry = useMemo(() => {
    const map = new Map<string, (typeof locales)[number]>();
    for (const locale of locales) {
      map.set(locale.name.toLowerCase(), locale);
    }
    return map;
  }, [locales]);

  const isVerificationBlocked = Boolean(
    verificationStatus && verificationStatus !== "approved",
  );
  const [rows, setRows] = useState<BulkRecipientRow[]>(() => [
    createEmptyRow("row-initial-1", ""),
  ]);
  const lookupSeqRef = useRef<Record<string, number>>({});
  const [step, setStep] = useState<BulkStep>("form");
  const [submitted, setSubmitted] = useState<Transfer[]>([]);
  const [batchId, setBatchId] = useState("");
  const [error, setError] = useState("");
  const [paymentError, setPaymentError] = useState("");
  const [processingProgress, setProcessingProgress] = useState(0);
  const [processingMessage, setProcessingMessage] = useState("");
  const [isDragging, setIsDragging] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const isSubmittingRef = useRef(false);
  const completedBatchKeysRef = useRef<Set<string>>(new Set());
  const batchKeyRef = useRef("batch-initial");
  const [schedule, setSchedule] = useState<ScheduleConfig>(() => ({
    enabled: false,
    mode: "now",
    date: getTomorrowIsoDate(),
    frequency: "Monthly",
  }));

  const fundingSources = useMemo<CorporateFundingSource[]>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.FUNDING_SOURCES);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {
      // ignore
    }
    return INITIAL_CORPORATE_FUNDING_SOURCES;
  }, []);

  const [selectedSourceId, setSelectedSourceId] = useState<string>(
    () => fundingSources.find((s) => s.isDefault)?.id || fundingSources[0]?.id || "cfs-01"
  );

  const selectedSource =
    fundingSources.find((s) => s.id === selectedSourceId) || fundingSources[0];

  const lookupTimersRef = useRef<Record<string, ReturnType<typeof setTimeout>>>({});
  const paymentTimersRef = useRef<ReturnType<typeof setTimeout>[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const clearPaymentTimers = () => {
    paymentTimersRef.current.forEach((t) => clearTimeout(t));
    paymentTimersRef.current = [];
  };

  useEffect(() => {
    const lookupTimers = lookupTimersRef.current;
    return () => {
      Object.values(lookupTimers).forEach((t) => clearTimeout(t));
      clearPaymentTimers();
    };
  }, []);

  const isRowVerified = (row: BulkRecipientRow) => {
    const cleanDigits = row.accountNumber.replace(/\D/g, "");
    return (
      cleanDigits.length >= 10 &&
      Boolean(row.bank.trim()) &&
      Boolean(row.recipientName.trim())
    );
  };

  const isRowValid = (row: BulkRecipientRow) => {
    const amt = Number(row.amount);
    return isRowVerified(row) && Number.isFinite(amt) && amt > 0;
  };

  const verifiedCount = rows.filter(isRowVerified).length;
  const validRows = rows.filter(isRowValid);

  const firstLocale =
    localesByCountry.get((rows[0]?.country || "").toLowerCase()) ?? locales[0] ?? null;
  const primaryCurrency = firstLocale?.currency.code || "";
  const primarySymbol = firstLocale?.currency.symbol || (primaryCurrency ? `${primaryCurrency} ` : "");

  const totalAmount = rows.reduce((sum, row) => {
    const val = Number(row.amount);
    return sum + (Number.isFinite(val) && val > 0 ? val : 0);
  }, 0);

  const triggerNameLookup = (
    key: string,
    digits: string,
    bankName: string,
    country: string
  ) => {
    if (lookupTimersRef.current[key]) {
      clearTimeout(lookupTimersRef.current[key]);
    }

    const locale =
      localesByCountry.get(country.toLowerCase()) ?? locales[0] ?? null;
    const matchedMethod = locale?.methods.find(
      (method) =>
        method.name.toLowerCase() === bankName.toLowerCase() ||
        method.id === bankName,
    );
    const bankId = matchedMethod?.id?.trim() || "";

    if (digits.length >= 10 && bankId) {
      const seq = (lookupSeqRef.current[key] ?? 0) + 1;
      lookupSeqRef.current[key] = seq;
      setRows((prev) =>
        prev.map((r) =>
          r.key === key ? { ...r, isLookingUp: true, lookupError: undefined } : r,
        )
      );
      lookupTimersRef.current[key] = setTimeout(() => {
        void queryClient
          .fetchQuery({
            queryKey: sendMoneyKeys.lookup(digits, bankId),
            queryFn: ({ signal }) => sendMoneyService.lookupAccount(digits, bankId, signal),
            staleTime: 60 * 1000,
          })
          .then((result) => {
            if (lookupSeqRef.current[key] !== seq) return;
            setRows((prev) =>
              prev.map((r) =>
                r.key === key
                  ? {
                      ...r,
                      recipientName: result.name,
                      lookupError: undefined,
                      isLookingUp: false,
                    }
                  : r,
              ),
            );
          })
          .catch((err) => {
            if (lookupSeqRef.current[key] !== seq) return;
            setRows((prev) =>
              prev.map((r) =>
                r.key === key
                  ? {
                      ...r,
                      recipientName: "",
                      lookupError: getErrorMessage(err, "Unable to verify account name."),
                      isLookingUp: false,
                    }
                  : r,
              ),
            );
          });
      }, 300);
    } else {
      setRows((prev) =>
        prev.map((r) =>
          r.key === key
            ? { ...r, recipientName: "", lookupError: undefined, isLookingUp: false }
            : r
        )
      );
    }
  };

  const handleFieldChange = (
    key: string,
    field: keyof BulkRecipientRow,
    value: string
  ) => {
    setError("");
    setRows((current) =>
      current.map((row) => {
        if (row.key !== key) return row;
        const resolvedCountry =
          row.country || locales[0]?.name || "";

        if (field === "accountNumber") {
          const clean = value.replace(/\D/g, "").slice(0, 16);
          const nextRow = { ...row, country: resolvedCountry, accountNumber: clean };
          triggerNameLookup(key, clean, nextRow.bank, resolvedCountry);
          return nextRow;
        }

        if (field === "bank") {
          const nextRow = { ...row, country: resolvedCountry, bank: value };
          const digits = nextRow.accountNumber.replace(/\D/g, "");
          triggerNameLookup(key, digits, value, resolvedCountry);
          return nextRow;
        }

        if (field === "country") {
          const nextRow = {
            ...row,
            country: value,
            bank: "",
            recipientName: "",
            lookupError: undefined,
          };
          return nextRow;
        }

        return { ...row, [field]: value };
      })
    );
  };

  const addRow = () => {
    setRows((current) => [...current, createEmptyRow(undefined, locales[0]?.name || "")]);
  };

  const removeRow = (key: string) => {
    if (rows.length <= 1) return;
    setRows((current) => current.filter((r) => r.key !== key));
  };

  const importCsv = async (file?: File) => {
    if (!file) return;
    setError("");
    try {
      const lines = (await file.text())
        .split(/\r?\n/)
        .filter((line) => line.trim());
      if (lines.length < 2) {
        throw new Error("CSV needs a header row and at least one recipient.");
      }

      const headers = parseCsvLine(lines[0]).map((v) => v.toLowerCase().trim());
      const find = (...names: string[]) =>
        headers.findIndex((h) => names.includes(h));

      const accIdx = find(
        "account number",
        "account",
        "phone",
        "mobile number",
        "bank or wallet"
      );
      const bankIdx = find("bank name", "bank", "institution");
      const nameIdx = find("recipient name", "recipient", "name", "beneficiary");
      const countryIdx = find("country", "destination country");
      const amountIdx = find("amount", "amount usd", "amount ngn");
      const narrationIdx = find("narration", "note", "description", "reference");

      if (accIdx < 0 || amountIdx < 0) {
        throw new Error(
          "Include columns: Account Number, Bank Name, Amount, Narration."
        );
      }

      const imported: BulkRecipientRow[] = lines.slice(1).map((line, idx) => {
        const cells = parseCsvLine(line);
        const rawCountry = countryIdx >= 0 ? cells[countryIdx] || "" : "";
        const matchedLocale =
          localesByCountry.get(rawCountry.toLowerCase()) ?? locales[0] ?? null;
        const matchedCountry = matchedLocale?.name || rawCountry.trim();
        const rawAcc = (cells[accIdx] || "").replace(/\D/g, "").slice(0, 16);
        const rawBank =
          bankIdx >= 0
            ? cells[bankIdx] || ""
            : matchedLocale?.methods[0]?.name || "";
        const resolvedName =
          nameIdx >= 0 && cells[nameIdx]?.trim() ? cells[nameIdx].trim() : "";

        return {
          key: `csv-${Date.now()}-${idx}`,
          country: matchedCountry,
          accountNumber: rawAcc,
          bank: rawBank,
          recipientName: resolvedName,
          amount: cells[amountIdx] || "",
          narration: narrationIdx >= 0 ? cells[narrationIdx] || "" : "",
          isLookingUp: false,
          lookupError: undefined,
        };
      });

      setRows(imported);
      setSubmitted([]);
      setStep("form");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not read CSV file.");
    }
  };

  const downloadTemplate = () => {
    const csv =
      "Account Number,Bank Name,Amount,Narration\n0123456789,Guaranty Trust Bank (GTBank),50000,Salary\n9876543210,Access Bank,25000,Vendor Payout";
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
    const link = document.createElement("a");
    link.href = url;
    link.download = "settle-bulk-transfer-template.csv";
    link.click();
    URL.revokeObjectURL(url);
  };

  const feePercent = selectedSource?.feePercent ?? 0.15;
  const feeAmount = totalAmount * (feePercent / 100);
  const totalDebit = totalAmount + feeAmount;

  const goToPayment = () => {
    if (isVerificationBlocked) {
      setError("Complete business verification before initiating a batch payment.");
      return;
    }
    if (validRows.length === 0) {
      setError("Complete at least one recipient with verified account and amount.");
      return;
    }
    if (validRows.length !== rows.length) {
      setError("Please complete or remove unfinished recipient rows.");
      return;
    }
    setError("");
    setPaymentError("");
    setStep("payment");
  };

  const executeBatchPayment = () => {
    if (isVerificationBlocked) {
      setPaymentError("Complete business verification before submitting a batch transfer.");
      return;
    }
    if (onBeforeSubmit && !onBeforeSubmit()) return;
    if (isSubmittingRef.current || step === "processing" || step === "success") return;
    if (completedBatchKeysRef.current.has(batchKeyRef.current)) return;

    isSubmittingRef.current = true;
    setIsSubmitting(true);
    clearPaymentTimers();
    setPaymentError("");
    setStep("processing");
    setProcessingProgress(20);
    setProcessingMessage("Authorizing corporate treasury debit mandate...");

    const t1 = setTimeout(() => {
      setProcessingProgress(60);
      setProcessingMessage(`Dispatching ${rows.length} payouts across corridor rails...`);
    }, 750);

    const t2 = setTimeout(() => {
      setProcessingProgress(100);
      setProcessingMessage("Confirming batch settlement...");

      const isSuccess = Math.random() < SUCCESS_PROBABILITY;
      const scheduleLabel = getScheduleLabel(schedule);
      const isScheduledLater = schedule.enabled && schedule.mode === "later";
      const now = Date.now();
      const id = "BT-" + String(now).slice(-7);
      const timestamp = formatTransferTimestamp();
      const created: Transfer[] = rows.map((row, index) => {
        const rowLocale =
          localesByCountry.get((row.country || "").toLowerCase()) ?? locales[0] ?? null;
        const curr = rowLocale?.currency.code || "";
        return {
          id: "BP-" + String(now).slice(-6) + "-" + String(index + 1).padStart(2, "0"),
          batchId: id,
          name: row.recipientName.trim(),
          country: rowLocale?.name || row.country,
          amount: Number(row.amount),
          currency: curr,
          provider: row.bank,
          method: selectedSource?.type === "corporate_card" ? "Corporate Card" : "Bank transfer",
          description: row.narration.trim() || undefined,
          schedule: scheduleLabel,
          status: !isSuccess ? "Failed" : isScheduledLater ? "Pending" : "Completed",
          date: scheduleLabel || timestamp,
        };
      });

      setTransfers((current) => [...created, ...current]);
      setBatchId(id);
      setSubmitted(created);
      isSubmittingRef.current = false;
      setIsSubmitting(false);

      if (isSuccess) {
        completedBatchKeysRef.current.add(batchKeyRef.current);
        setStep("success");
      } else {
        setPaymentError(
          "Partner clearing rail timed out or declined the batch authorization. Your funding source was not charged."
        );
        setStep("failed");
      }
    }, 1700);

    paymentTimersRef.current = [t1, t2];
  };

  const resetBatch = () => {
    clearPaymentTimers();
    isSubmittingRef.current = false;
    setIsSubmitting(false);
    batchKeyRef.current = `batch-${Date.now()}`;
    setRows([createEmptyRow()]);
    setSubmitted([]);
    setBatchId("");
    setError("");
    setPaymentError("");
    setProcessingProgress(0);
    setProcessingMessage("");
    setSchedule({
      enabled: false,
      mode: "now",
      date: getTomorrowIsoDate(),
      frequency: "Monthly",
    });
    setStep("form");
  };

  // ==========================================
  // Step 2: Make Payment View
  // ==========================================
  if (step === "payment") {
    return (
      <div className="max-w-5xl mx-auto py-2 sm:py-6 px-4 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl sm:text-2xl font-heading font-bold text-ink tracking-tight m-0">
              Make payment
            </h1>
            <p className="text-xs text-muted mt-0.5 m-0">
              Select your funding source and authorize this {rows.length}-recipient batch
            </p>
          </div>
          <button
            type="button"
            onClick={() => setStep("form")}
            className="button button-quiet h-10 px-4 rounded-xl text-xs font-semibold cursor-pointer self-start sm:self-auto"
          >
            ← Back to recipients
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          <div className="lg:col-span-7 space-y-5">
            {/* Funding Source Selection */}
            <div className="bg-paper border border-line rounded-2xl p-5 sm:p-6 shadow-subtle space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-xs sm:text-sm font-heading font-bold text-ink m-0">
                  Funding source
                </h2>
                <span className="text-[11px] text-muted">
                  Corporate treasury mandate
                </span>
              </div>

              <div className="space-y-2.5">
                {fundingSources.map((source) => {
                  const isSelected = source.id === selectedSource?.id;
                  return (
                    <button
                      key={source.id}
                      type="button"
                      onClick={() => setSelectedSourceId(source.id)}
                      className={`w-full p-3.5 rounded-xl border text-left flex items-center justify-between gap-3 transition-colors cursor-pointer ${
                        isSelected
                          ? "border-ink bg-soft"
                          : "border-line bg-paper hover:bg-soft/60"
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <span className="w-9 h-9 rounded-xl bg-paper border border-line flex items-center justify-center shrink-0 text-ink">
                          <Icon
                            name={source.type === "corporate_card" ? "card" : "building"}
                            size={16}
                          />
                        </span>
                        <div className="min-w-0">
                          <strong className="text-xs sm:text-sm font-semibold text-ink block truncate">
                            {source.institutionName} · {source.maskedNumber}
                          </strong>
                          <span className="text-[11px] text-muted block truncate">
                            {source.accountLabel} · {source.settlementSpeed}
                          </span>
                        </div>
                      </div>
                      <span className="text-[11px] font-mono font-semibold text-ink shrink-0">
                        {source.feePercent}% fee
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Recipients Breakdown */}
            <div className="bg-paper border border-line rounded-2xl overflow-hidden shadow-subtle">
              <div className="px-5 py-3.5 border-b border-line flex items-center justify-between bg-soft/40">
                <strong className="text-xs font-heading font-bold text-ink">
                  Recipients ({rows.length})
                </strong>
                <span className="text-[11px] text-muted">Verified</span>
              </div>
              <div className="divide-y divide-line max-h-72 overflow-y-auto">
                {rows.map((row) => {
                  const rowLocale =
                    localesByCountry.get((row.country || "").toLowerCase()) ?? locales[0] ?? null;
                  const curr = rowLocale?.currency.code || "";
                  const sym = rowLocale?.currency.symbol || (curr ? `${curr} ` : "");
                  return (
                    <div
                      key={row.key}
                      className="px-5 py-3 flex items-center justify-between gap-3 text-xs"
                    >
                      <div className="min-w-0">
                        <strong className="text-ink font-semibold block truncate">
                          {row.recipientName}
                        </strong>
                        <span className="text-[11px] text-muted block truncate">
                          {row.country} · {row.bank} · {row.accountNumber}
                        </span>
                      </div>
                      <strong className="font-mono font-semibold text-ink shrink-0">
                        {sym}
                        {Number(row.amount).toLocaleString("en-US", {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}
                      </strong>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Right Summary & Authorize Card */}
          <div className="lg:col-span-5 bg-paper border border-line rounded-2xl p-5 sm:p-6 shadow-subtle space-y-5">
            <h2 className="text-sm font-heading font-bold text-ink m-0">
              Payment summary
            </h2>

            <div className="text-xs divide-y divide-line">
              <div className="flex justify-between py-2.5">
                <span className="text-muted">Recipients</span>
                <strong className="text-ink font-semibold">{rows.length}</strong>
              </div>
              <div className="flex justify-between py-2.5">
                <span className="text-muted">Batch subtotal</span>
                <span className="text-ink font-mono font-medium">
                  {primarySymbol}
                  {totalAmount.toLocaleString("en-US", {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </span>
              </div>
              <div className="flex justify-between py-2.5">
                <span className="text-muted">Processing fee ({feePercent}%)</span>
                <span className="text-ink font-mono font-medium">
                  {primarySymbol}
                  {feeAmount.toLocaleString("en-US", {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </span>
              </div>
              {getScheduleLabel(schedule) && (
                <div className="flex justify-between py-2.5">
                  <span className="text-muted">Schedule</span>
                  <span className="text-ink font-semibold">
                    {getScheduleLabel(schedule)}
                  </span>
                </div>
              )}
              <div className="flex justify-between py-3 font-bold text-ink text-sm">
                <span>Total debit</span>
                <span className="font-mono">
                  {primarySymbol}
                  {totalDebit.toLocaleString("en-US", {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </span>
              </div>
            </div>

            <ScheduledPaymentControl value={schedule} onChange={setSchedule} />

            <div className="space-y-2.5 pt-1">
              <button
                type="button"
                onClick={executeBatchPayment}
                disabled={
                  isSubmitting ||
                  isVerificationBlocked ||
                  (schedule.enabled && schedule.mode !== "now" && !schedule.date)
                }
                className="button button-primary w-full h-11 rounded-xl text-xs sm:text-sm font-bold cursor-pointer disabled:opacity-40 disabled:pointer-events-none"
              >
                {schedule.enabled && schedule.mode === "later"
                  ? "Schedule batch payment"
                  : schedule.enabled && schedule.mode === "recurring"
                    ? "Set up recurring batch"
                    : "Make payment"}
              </button>
              <button
                type="button"
                onClick={() => setStep("form")}
                className="button button-quiet w-full h-10 rounded-xl text-xs font-semibold cursor-pointer"
              >
                Edit recipients
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ==========================================
  // Step 3: Processing View
  // ==========================================
  if (step === "processing") {
    return (
      <div className="max-w-md mx-auto py-16 px-4 text-center">
        <div className="w-14 h-14 mx-auto mb-6 rounded-full border-2 border-line border-t-ink animate-spin" />
        <h2 className="text-xl font-heading font-bold text-ink mb-2">
          Processing batch payment
        </h2>
        <p className="text-muted text-sm mb-8">
          {processingMessage || "Routing payouts across partner rails..."}
        </p>

        <div className="w-full bg-soft h-1 rounded-full overflow-hidden mb-6">
          <div
            className="bg-ink h-full transition-all duration-300"
            style={{ width: `${processingProgress}%` }}
          />
        </div>

        <div className="text-xs text-muted flex items-center justify-between px-1">
          <span>{rows.length} recipients</span>
          <span className="font-mono">{selectedSource?.institutionName}</span>
        </div>
      </div>
    );
  }

  // ==========================================
  // Step 4b: Failed View
  // ==========================================
  if (step === "failed") {
    return (
      <div className="max-w-md mx-auto py-10 px-4">
        <div className="bg-paper border border-line rounded-2xl p-6 sm:p-8 text-center shadow-subtle">
          <div className="w-12 h-12 bg-rose-100 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 rounded-full flex items-center justify-center mx-auto mb-5 border border-rose-200 dark:border-rose-900">
            <Icon name="close" size={22} />
          </div>

          <h2 className="text-2xl font-heading font-bold text-ink mb-2">
            Batch payment failed
          </h2>
          <p className="text-muted text-sm mb-6">
            {paymentError ||
              "The partner clearing rail timed out. Your funding source was not charged."}
          </p>

          <div className="bg-soft border border-line rounded-xl p-4 text-left text-xs space-y-2 mb-6">
            <div className="flex justify-between">
              <span className="text-muted">Batch reference</span>
              <span className="font-mono font-semibold text-ink">{batchId}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted">Recipients</span>
              <span className="font-medium text-ink">{submitted.length}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted">Attempted total</span>
              <span className="font-mono font-semibold text-ink">
                {primarySymbol}
                {totalDebit.toLocaleString("en-US", {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </span>
            </div>
          </div>

          <div className="space-y-2">
            <button
              type="button"
              disabled={isSubmitting}
              className="button button-primary w-full h-11 text-sm font-medium rounded-xl cursor-pointer disabled:opacity-40 disabled:pointer-events-none"
              onClick={executeBatchPayment}
            >
              Try again
            </button>
            <button
              type="button"
              className="button button-quiet w-full h-11 text-sm text-muted hover:text-ink rounded-xl cursor-pointer"
              onClick={() => setStep("payment")}
            >
              Back to make payment
            </button>
            <button
              type="button"
              className="w-full h-9 text-xs font-medium text-muted hover:text-ink cursor-pointer"
              onClick={() => setStep("form")}
            >
              Edit recipients
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ==========================================
  // Step 4a: Success / Batch Confirmation Receipt View
  // ==========================================
  if (step === "success" && submitted.length > 0) {
    return (
      <div className="max-w-5xl mx-auto py-2 sm:py-6 px-4 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <h1 className="text-2xl font-heading font-bold text-ink m-0">
            {submitted[0]?.schedule
              ? "Batch payment scheduled"
              : "Batch payment successful"}
          </h1>
          <button
            type="button"
            className="button button-secondary h-10 px-4 rounded-xl text-xs font-semibold cursor-pointer"
            onClick={resetBatch}
          >
            New batch
          </button>
        </div>

        <div className="bg-paper border border-line rounded-2xl p-6 shadow-subtle flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <span className="w-11 h-11 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
              <Icon name="checkCircle" size={22} />
            </span>
            <div>
              <strong className="text-sm font-bold text-ink block">
                {batchId} · {submitted.length} payments{" "}
                {submitted[0]?.schedule ? "scheduled" : "completed"}
              </strong>
              <span className="text-xs text-muted">
                Paid via {selectedSource?.institutionName} ({selectedSource?.maskedNumber})
                {submitted[0]?.schedule ? ` · ${submitted[0].schedule}` : ""}
              </span>
            </div>
          </div>
          <div className="sm:text-right">
            <span className="text-[10px] font-bold text-muted uppercase tracking-wider block">
              TOTAL PAID
            </span>
            <strong className="text-xl font-heading font-bold text-ink font-mono">
              {primarySymbol}
              {totalDebit.toLocaleString("en-US", {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}
            </strong>
          </div>
        </div>

        <div className="bg-paper border border-line rounded-2xl overflow-hidden shadow-subtle divide-y divide-line">
          {submitted.map((t) => (
            <div
              key={t.id}
              className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-soft transition-colors"
            >
              <div className="flex items-center gap-3 min-w-0">
                <CountryBadge country={t.country} />
                <div className="min-w-0">
                  <strong className="text-xs font-bold text-ink block truncate">
                    {t.name}
                  </strong>
                  <span className="text-[11px] text-muted font-mono block truncate">
                    {t.provider} · {t.id}
                  </span>
                </div>
              </div>
              <div className="flex items-center justify-between sm:justify-end gap-4 shrink-0">
                <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
                  <Icon name="check" size={12} />
                  Completed
                </span>
                <strong className="text-xs font-heading font-bold text-ink font-mono">
                  {locales.find((locale) => locale.currency.code === t.currency)?.currency.symbol ||
                    (t.currency ? `${t.currency} ` : "")}
                  {t.amount.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                </strong>
                <button
                  type="button"
                  onClick={() => onTrackTransfer(t)}
                  className="button button-secondary h-8 px-3 rounded-lg text-[11px] font-semibold cursor-pointer"
                >
                  Track
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // ==========================================
  // Main Add Recipients / Bulk Transfer Form
  // ==========================================
  return (
    <div className="max-w-5xl mx-auto py-2 sm:py-6 px-4 space-y-6">
      {/* Top Header with Live Verified & Total Badges */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-heading font-bold text-ink tracking-tight m-0">
            Add Recipients
          </h1>
          <p className="text-xs text-muted mt-0.5 m-0">
            Add recipients manually or upload a CSV file
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <span
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold border ${
              verifiedCount === rows.length && rows.length > 0
                ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20"
                : "bg-rose-500/10 text-rose-700 dark:text-rose-400 border-rose-500/20"
            }`}
          >
            {verifiedCount}/{rows.length} Verified
          </span>
          <span className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20 font-mono">
            Total: {primarySymbol}
            {totalAmount.toLocaleString("en-US", {
              maximumFractionDigits: 2,
            })}
          </span>
        </div>
      </div>

      {isVerificationBlocked && verificationStatus && (
        <VerificationGateBanner
          status={verificationStatus}
          accountType="business"
          onOpenVerification={onOpenVerification}
        />
      )}

      {localesQuery.isError && (
        <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-between gap-3 text-xs text-rose-700 dark:text-rose-300 font-medium">
          <span>{getErrorMessage(localesQuery.error, "Unable to load supported countries and banks.")}</span>
          <button
            type="button"
            onClick={() => void localesQuery.refetch()}
            className="font-semibold underline hover:opacity-80 shrink-0 cursor-pointer"
          >
            Retry
          </button>
        </div>
      )}

      {error && (
        <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-700 dark:text-amber-400 font-medium">
          {error}
        </div>
      )}

      {/* Bulk Upload via CSV Card */}
      <div className="bg-paper border border-line rounded-2xl p-5 sm:p-6 shadow-subtle space-y-4">
        <div className="flex items-center gap-2 text-xs sm:text-sm font-heading font-bold text-ink">
          <Icon name="inbox" size={16} className="text-ink" />
          <span>Bulk Upload via CSV</span>
        </div>

        <div
          onDragOver={(e) => {
            e.preventDefault();
            setIsDragging(true);
          }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={(e) => {
            e.preventDefault();
            setIsDragging(false);
            const file = e.dataTransfer.files?.[0];
            if (file) void importCsv(file);
          }}
          onClick={() => fileInputRef.current?.click()}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              fileInputRef.current?.click();
            }
          }}
          className={`border-2 border-dashed rounded-xl py-8 px-4 flex flex-col items-center justify-center text-center transition-colors cursor-pointer ${
            isDragging
              ? "border-ink bg-soft"
              : "border-line hover:border-ink/40 hover:bg-soft/40"
          }`}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv,text/csv"
            className="sr-only"
            onChange={(e) => {
              void importCsv(e.target.files?.[0]);
              e.currentTarget.value = "";
            }}
          />
          <Icon name="upload" size={22} className="text-muted mb-2" />
          <p className="text-xs font-medium text-ink m-0">
            Drag &amp; drop your CSV file here, or{" "}
            <span className="font-bold underline">browse</span>
          </p>
          <span className="text-[11px] text-muted mt-1">
            Columns: Account Number, Bank Name, Amount, Narration
          </span>
        </div>

        <div className="flex justify-end">
          <button
            type="button"
            onClick={downloadTemplate}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-ink hover:underline cursor-pointer"
          >
            <Icon name="download" size={14} />
            <span>Download CSV Template</span>
          </button>
        </div>
      </div>

      {/* Recipient List Section */}
      <div className="space-y-3">
        <h2 className="text-xs sm:text-sm font-heading font-bold text-ink m-0">
          Recipient List
        </h2>

        <div className="space-y-4">
          {rows.map((row, index) => {
            const rowLocale =
              localesByCountry.get((row.country || "").toLowerCase()) ?? locales[0] ?? null;
            const effectiveRowCountry = rowLocale?.name || "";
            const rowCurrency = rowLocale?.currency.code || "";
            const rowSymbol =
              rowLocale?.currency.symbol || (rowCurrency ? `${rowCurrency} ` : "");
            const banks = (rowLocale?.methods ?? []).map((method) => method.name);
            const verified = isRowVerified(row);

            return (
              <div
                key={row.key}
                className="bg-paper border border-line rounded-2xl p-5 shadow-subtle space-y-4"
              >
                {/* Row Header: RECIPIENT N + Country selector + Verified/Remove */}
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5">
                    <span className="text-[11px] font-bold text-muted uppercase tracking-wider">
                      RECIPIENT {index + 1}
                    </span>
                    <CustomSelect
                      value={effectiveRowCountry}
                      onChange={(value) =>
                        handleFieldChange(row.key, "country", value)
                      }
                      disabled={supportedCountries.length === 0}
                      placeholder={localesQuery.isLoading ? "Loading..." : "Select country"}
                      ariaLabel={`Recipient ${index + 1} country`}
                      modalTitle={`Recipient ${index + 1} country`}
                      options={supportedCountries}
                      triggerClassName="h-8 px-2.5 rounded-lg bg-soft text-[11px] font-medium"
                    />
                    {verified && (
                      <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-700 dark:text-emerald-400">
                        <Icon name="check" size={12} />
                        Verified
                      </span>
                    )}
                  </div>

                  {rows.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeRow(row.key)}
                      aria-label={`Remove recipient ${index + 1}`}
                      className="w-7 h-7 rounded-lg text-muted hover:text-rose-600 dark:hover:text-rose-400 hover:bg-soft flex items-center justify-center transition-colors cursor-pointer"
                    >
                      <Icon name="close" size={14} />
                    </button>
                  )}
                </div>

                {/* 4-Column Field Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
                  {/* Account Number */}
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-semibold text-ink block">
                      Account Number
                    </label>
                    <input
                      type="text"
                      inputMode="numeric"
                      maxLength={16}
                      value={row.accountNumber}
                      onChange={(e) =>
                        handleFieldChange(
                          row.key,
                          "accountNumber",
                          e.target.value
                        )
                      }
                      placeholder="10-digit account"
                      className="w-full h-11 px-3.5 border border-line rounded-xl bg-paper text-ink font-mono text-xs sm:text-sm outline-none focus:border-ink placeholder:text-muted/60"
                    />
                  </div>

                  {/* Bank */}
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-semibold text-ink block">
                      Bank
                    </label>
                    <CustomSelect
                      value={row.bank}
                      onChange={(value) =>
                        handleFieldChange(row.key, "bank", value)
                      }
                      disabled={banks.length === 0}
                      placeholder={banks.length === 0 ? "Loading banks..." : "Select bank..."}
                      modalTitle="Select recipient bank"
                      options={banks}
                      triggerClassName="h-11 px-3.5 rounded-xl text-xs sm:text-sm font-normal"
                    />
                  </div>

                  {/* Recipient Name (Auto-filled on lookup) */}
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-semibold text-ink block">
                      Recipient Name
                    </label>
                    <input
                      type="text"
                      value={
                        row.isLookingUp
                          ? "Resolving account..."
                          : row.recipientName
                      }
                      onChange={(e) =>
                        handleFieldChange(
                          row.key,
                          "recipientName",
                          e.target.value
                        )
                      }
                      placeholder="Auto-filled on lookup"
                      className="w-full h-11 px-3.5 border border-line rounded-xl bg-soft text-ink text-xs sm:text-sm outline-none focus:border-ink placeholder:text-muted/60"
                    />
                    {!row.isLookingUp && row.lookupError && (
                      <p className="text-[11px] text-rose-600 dark:text-rose-400">
                        {row.lookupError}
                      </p>
                    )}
                  </div>

                  {/* Amount */}
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-semibold text-ink block">
                      Amount ({rowSymbol.trim()})
                    </label>
                    <div className="flex items-center h-11 px-3.5 border border-line rounded-xl bg-paper focus-within:border-ink transition-colors">
                      <span className="text-xs sm:text-sm font-mono text-muted mr-1.5 select-none">
                        {rowSymbol}
                      </span>
                      <input
                        type="number"
                        min="0.01"
                        step="any"
                        value={row.amount}
                        onChange={(e) =>
                          handleFieldChange(row.key, "amount", e.target.value)
                        }
                        placeholder="0.00"
                        className="w-full bg-transparent border-0 outline-none text-xs sm:text-sm font-mono text-ink placeholder:text-muted/60"
                      />
                    </div>
                  </div>
                </div>

                {/* Narration (Optional) */}
                <div className="space-y-1.5">
                  <label className="text-[11px] font-semibold text-ink block">
                    Narration (Optional)
                  </label>
                  <input
                    type="text"
                    value={row.narration}
                    onChange={(e) =>
                      handleFieldChange(row.key, "narration", e.target.value)
                    }
                    placeholder="e.g. Salary, Vendor Payout"
                    className="w-full h-11 px-3.5 border border-line rounded-xl bg-paper text-ink text-xs sm:text-sm outline-none focus:border-ink placeholder:text-muted/60"
                  />
                </div>
              </div>
            );
          })}
        </div>

        {/* Add Another Recipient Bar */}
        <button
          type="button"
          onClick={addRow}
          className="w-full h-11 border border-line rounded-xl bg-paper hover:bg-soft hover:border-ink/40 text-xs font-semibold text-ink flex items-center justify-center gap-2 transition-colors cursor-pointer"
        >
          <Icon name="plus" size={15} />
          <span>Add Another Recipient</span>
        </button>
      </div>

      {/* Bottom Submit Row */}
      <div className="flex items-center justify-end pt-2">
        <button
          type="button"
          onClick={goToPayment}
          disabled={
            isVerificationBlocked ||
            validRows.length === 0 ||
            validRows.length !== rows.length
          }
          className="button button-primary h-11 px-6 rounded-xl text-xs font-bold inline-flex items-center gap-2 cursor-pointer disabled:opacity-40 disabled:pointer-events-none transition-all"
        >
          <span>Continue</span>
          <Icon name="chevron" size={14} />
        </button>
      </div>
    </div>
  );
}
