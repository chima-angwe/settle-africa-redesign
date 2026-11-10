import type React from "react";
import { useState, useRef } from "react";
import { Icon } from "@/shared/ui";
import { parseCsvLine } from "@/shared/lib";
import type { Transfer } from "@/entities/transfer";
import { countries, CountryBadge } from "@/entities/country";
import {
  CORRIDOR_BANKS,
  COUNTRY_TO_CURRENCY,
  resolveInterbankAccountName,
} from "@/features/send-money";

export interface BulkTransferProps {
  setTransfers: React.Dispatch<React.SetStateAction<Transfer[]>>;
  onTrackTransfer: (transfer: Transfer) => void;
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
}

const CURRENCY_SYMBOLS: Record<string, string> = {
  NGN: "₦",
  KES: "KSh ",
  GHS: "GH₵ ",
  ZAR: "R ",
  RWF: "FRw ",
  UGX: "USh ",
  EGP: "E£ ",
  TZS: "TSh ",
  XOF: "CFA ",
  USD: "$",
};

function createEmptyRow(indexKey?: string): BulkRecipientRow {
  return {
    key: indexKey || `row-${Date.now()}-${Math.floor(Math.random() * 10000)}`,
    country: "Nigeria",
    accountNumber: "",
    bank: "",
    recipientName: "",
    amount: "",
    narration: "",
    isLookingUp: false,
  };
}

export function BulkTransfer({
  setTransfers,
  onTrackTransfer,
}: BulkTransferProps) {
  const [rows, setRows] = useState<BulkRecipientRow[]>(() => [
    createEmptyRow("row-initial-1"),
  ]);
  const [submitted, setSubmitted] = useState<Transfer[]>([]);
  const [batchId, setBatchId] = useState("");
  const [error, setError] = useState("");
  const [isDragging, setIsDragging] = useState(false);

  const lookupTimersRef = useRef<Record<string, ReturnType<typeof setTimeout>>>({});
  const fileInputRef = useRef<HTMLInputElement>(null);

  const isRowVerified = (row: BulkRecipientRow) => {
    const cleanDigits = row.accountNumber.replace(/\D/g, "");
    return (
      cleanDigits.length >= 8 &&
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

  const primaryCurrency =
    COUNTRY_TO_CURRENCY[rows[0]?.country || "Nigeria"] || "NGN";
  const primarySymbol = CURRENCY_SYMBOLS[primaryCurrency] || "₦";

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

    if (digits.length >= 8 && bankName) {
      setRows((prev) =>
        prev.map((r) => (r.key === key ? { ...r, isLookingUp: true } : r))
      );
      lookupTimersRef.current[key] = setTimeout(() => {
        const resolved = resolveInterbankAccountName(digits, bankName, country);
        setRows((prev) =>
          prev.map((r) =>
            r.key === key
              ? { ...r, recipientName: resolved, isLookingUp: false }
              : r
          )
        );
      }, 300);
    } else {
      setRows((prev) =>
        prev.map((r) =>
          r.key === key
            ? { ...r, recipientName: "", isLookingUp: false }
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

        if (field === "accountNumber") {
          const clean = value.replace(/\D/g, "").slice(0, 16);
          const nextRow = { ...row, accountNumber: clean };
          triggerNameLookup(key, clean, nextRow.bank, nextRow.country);
          return nextRow;
        }

        if (field === "bank") {
          const nextRow = { ...row, bank: value };
          const digits = nextRow.accountNumber.replace(/\D/g, "");
          triggerNameLookup(key, digits, value, nextRow.country);
          return nextRow;
        }

        if (field === "country") {
          const nextRow = {
            ...row,
            country: value,
            bank: "",
            recipientName: "",
          };
          return nextRow;
        }

        return { ...row, [field]: value };
      })
    );
  };

  const addRow = () => {
    setRows((current) => [...current, createEmptyRow()]);
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
        const rawCountry = countryIdx >= 0 ? cells[countryIdx] || "Nigeria" : "Nigeria";
        const matchedCountry =
          countries.find((c) => c.toLowerCase() === rawCountry.toLowerCase()) ||
          "Nigeria";
        const rawAcc = (cells[accIdx] || "").replace(/\D/g, "").slice(0, 16);
        const rawBank =
          bankIdx >= 0
            ? cells[bankIdx] || ""
            : (CORRIDOR_BANKS[matchedCountry] || CORRIDOR_BANKS.Nigeria)[0] || "";
        const resolvedName =
          nameIdx >= 0 && cells[nameIdx]?.trim()
            ? cells[nameIdx].trim()
            : rawAcc.length >= 8 && rawBank
              ? resolveInterbankAccountName(rawAcc, rawBank, matchedCountry)
              : "";

        return {
          key: `csv-${Date.now()}-${idx}`,
          country: matchedCountry,
          accountNumber: rawAcc,
          bank: rawBank,
          recipientName: resolvedName,
          amount: cells[amountIdx] || "",
          narration: narrationIdx >= 0 ? cells[narrationIdx] || "" : "",
          isLookingUp: false,
        };
      });

      setRows(imported);
      setSubmitted([]);
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

  const createBatch = () => {
    if (validRows.length === 0) {
      setError("Complete at least one recipient with verified account and amount.");
      return;
    }
    if (validRows.length !== rows.length) {
      setError("Please complete or remove unfinished recipient rows.");
      return;
    }

    const now = Date.now();
    const id = "BT-" + String(now).slice(-7);
    const created: Transfer[] = rows.map((row, index) => {
      const curr = COUNTRY_TO_CURRENCY[row.country] || "NGN";
      return {
        id: "BP-" + String(now).slice(-6) + "-" + String(index + 1).padStart(2, "0"),
        batchId: id,
        name: row.recipientName.trim(),
        country: row.country,
        amount: Number(row.amount),
        currency: curr,
        provider: row.bank,
        method: "Bank transfer",
        description: row.narration.trim() || undefined,
        status: "Processing",
        date: "Just now",
      };
    });

    setTransfers((current) => [...created, ...current]);
    setBatchId(id);
    setSubmitted(created);
    setError("");
  };

  // ==========================================
  // Batch Confirmation Receipt View
  // ==========================================
  if (submitted.length > 0) {
    return (
      <div className="max-w-5xl mx-auto py-2 sm:py-6 px-4 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <h1 className="text-2xl font-heading font-bold text-ink m-0">
            Batch submitted
          </h1>
          <button
            type="button"
            className="button button-secondary h-10 px-4 rounded-xl text-xs font-semibold cursor-pointer"
            onClick={() => {
              setRows([createEmptyRow()]);
              setSubmitted([]);
              setBatchId("");
            }}
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
                {batchId} · {submitted.length} payments
              </strong>
              <span className="text-xs text-muted">Processing across partner rails</span>
            </div>
          </div>
          <div className="sm:text-right">
            <span className="text-[10px] font-bold text-muted uppercase tracking-wider block">
              BATCH TOTAL
            </span>
            <strong className="text-xl font-heading font-bold text-ink font-mono">
              {primarySymbol}
              {submitted
                .reduce((s, t) => s + t.amount, 0)
                .toLocaleString("en-US", { minimumFractionDigits: 2 })}
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
                <strong className="text-xs font-heading font-bold text-ink font-mono">
                  {CURRENCY_SYMBOLS[t.currency] || `${t.currency} `}
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
            const rowCurrency = COUNTRY_TO_CURRENCY[row.country] || "NGN";
            const rowSymbol = CURRENCY_SYMBOLS[rowCurrency] || "₦";
            const banks = CORRIDOR_BANKS[row.country] || CORRIDOR_BANKS.Nigeria;
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
                    <select
                      value={row.country}
                      onChange={(e) =>
                        handleFieldChange(row.key, "country", e.target.value)
                      }
                      aria-label={`Recipient ${index + 1} country`}
                      className="h-8 pl-2.5 border border-line rounded-lg bg-soft text-ink text-[11px] font-medium outline-none cursor-pointer"
                    >
                      {Object.keys(CORRIDOR_BANKS).map((c) => (
                        <option key={c} value={c}>
                          {c}
                        </option>
                      ))}
                    </select>
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
                    <select
                      value={row.bank}
                      onChange={(e) =>
                        handleFieldChange(row.key, "bank", e.target.value)
                      }
                      className="w-full h-11 pl-3.5 pr-10 border border-line rounded-xl bg-paper text-ink text-xs sm:text-sm outline-none focus:border-ink cursor-pointer"
                    >
                      <option value="">Select bank...</option>
                      {banks.map((b) => (
                        <option key={b} value={b}>
                          {b}
                        </option>
                      ))}
                    </select>
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
          onClick={createBatch}
          disabled={validRows.length === 0 || validRows.length !== rows.length}
          className="button button-primary h-11 px-6 rounded-xl text-xs font-bold inline-flex items-center gap-2 cursor-pointer disabled:opacity-40 disabled:pointer-events-none transition-all"
        >
          <span>Continue</span>
          <Icon name="chevron" size={14} />
        </button>
      </div>
    </div>
  );
}
