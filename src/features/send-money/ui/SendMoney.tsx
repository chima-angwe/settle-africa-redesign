import type React from "react";
import { useState, useRef } from "react";
import { Icon } from "@/shared/ui";
import type { Page } from "@/shared/types";
import { CountryFlag, CountrySelect, countryFlag } from "@/entities/country";
import {
  useSendMoneyFlow,
  type UseSendMoneyFlowProps,
} from "../model/useSendMoneyFlow";
import {
  SUPPORTED_SOURCE_CURRENCIES,
  CORRIDOR_BANKS,
} from "../model/data";

export interface SendMoneyProps extends UseSendMoneyFlowProps {
  setPage: (page: Page) => void;
  aside?: React.ReactNode;
}

export function SendMoney(props: SendMoneyProps) {
  const { setPage, recipients, aside } = props;
  const flow = useSendMoneyFlow(props);

  const [recipientTab, setRecipientTab] = useState<"saved" | "new">(() =>
    props.targetRecipientId || recipients.length === 0 ? "new" : "saved"
  );
  const [recipientSearch, setRecipientSearch] = useState("");
  const [copiedRef, setCopiedRef] = useState(false);
  const [pin, setPin] = useState("");
  const [pinError, setPinError] = useState("");
  const pinInputRef = useRef<HTMLInputElement>(null);

  const formatAmount = (num: number, maxDecimals = 2) => {
    return num.toLocaleString("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: maxDecimals,
    });
  };

  const copyRef = (text: string) => {
    navigator.clipboard?.writeText(text);
    setCopiedRef(true);
    setTimeout(() => setCopiedRef(false), 2000);
  };

  const handleReset = () => {
    setPin("");
    setPinError("");
    flow.resetFlow();
  };

  const handleBack = () => {
    setPinError("");
    flow.goBack();
  };

  const handleConfirmTransfer = () => {
    if (pin.length < 4) {
      setPinError("Please enter your 4-digit PIN to authorize payment");
      pinInputRef.current?.focus();
      return;
    }
    setPinError("");
    flow.confirmTransfer();
  };

  const filteredRecipients = recipients.filter((r) =>
    `${r.name} ${r.country} ${r.provider || ""} ${r.account}`
      .toLowerCase()
      .includes(recipientSearch.toLowerCase())
  );

  // ==========================================
  // Processing View
  // ==========================================
  if (flow.step === "processing") {
    return (
      <div className="max-w-md mx-auto py-16 px-4 text-center">
        <div className="w-14 h-14 mx-auto mb-6 rounded-full border-2 border-line border-t-ink animate-spin" />
        <h2 className="text-xl font-heading font-bold text-ink mb-2">
          Processing payment
        </h2>
        <p className="text-muted text-sm mb-8">
          {flow.processingMessage || "Routing transfer through clearing rail..."}
        </p>

        <div className="w-full bg-soft h-1 rounded-full overflow-hidden mb-6">
          <div
            className="bg-ink h-full transition-all duration-300"
            style={{ width: `${flow.processingProgress}%` }}
          />
        </div>

        <div className="text-xs text-muted flex items-center justify-between px-1">
          <span>{flow.sendCurrency} → {flow.targetCurrency}</span>
          <span className="font-mono">{flow.clearingRail.settlementRailProtocol}</span>
        </div>
      </div>
    );
  }

  // ==========================================
  // Success Result View
  // ==========================================
  if (flow.step === "success" && flow.completedTransfer) {
    const t = flow.completedTransfer;
    return (
      <div className="max-w-md mx-auto py-10 px-4">
        <div className="bg-paper border border-line rounded-2xl p-6 sm:p-8 text-center shadow-subtle">
          <div className="w-12 h-12 bg-ink text-inverse-text rounded-full flex items-center justify-center mx-auto mb-5">
            <Icon name="check" size={22} />
          </div>

          <h2 className="text-2xl font-heading font-bold text-ink mb-1">
            Payment sent
          </h2>
          <p className="text-muted text-sm mb-6">
            {formatAmount(t.recipientAmount || 0)} {t.recipientCurrency} is on its way to{" "}
            <strong className="text-ink font-semibold">{t.name}</strong>.
          </p>

          <div className="bg-soft border border-line rounded-xl p-4 text-left text-xs space-y-2.5 mb-6">
            <div className="flex justify-between">
              <span className="text-muted">Amount sent</span>
              <span className="text-ink font-medium">
                {formatAmount(t.amount)} {t.currency}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted">Fee (1%)</span>
              <span className="text-ink font-medium">
                {formatAmount(t.feeAmount || 0)} {t.currency}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted">Recipient gets</span>
              <span className="text-ink font-semibold">
                {formatAmount(t.recipientAmount || 0)} {t.recipientCurrency}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted">Destination bank</span>
              <span className="text-ink font-medium">{t.provider}</span>
            </div>
            <div className="flex justify-between pt-2 border-t border-line">
              <span className="text-muted">Reference</span>
              <button
                type="button"
                className="font-mono text-ink flex items-center gap-1 hover:underline"
                onClick={() => copyRef(t.id)}
              >
                <span>{t.id}</span>
                <Icon name={copiedRef ? "check" : "copy"} size={12} />
              </button>
            </div>
          </div>

          <div className="space-y-2">
            <button
              type="button"
              className="button button-primary w-full h-11 text-sm font-medium"
              onClick={() => setPage("Transactions")}
            >
              View in transactions
            </button>
            <button
              type="button"
              className="button button-quiet w-full h-11 text-sm text-muted hover:text-ink"
              onClick={handleReset}
            >
              Send another payment
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ==========================================
  // Failed Result View
  // ==========================================
  if (flow.step === "failed") {
    return (
      <div className="max-w-md mx-auto py-10 px-4">
        <div className="bg-paper border border-line rounded-2xl p-6 sm:p-8 text-center shadow-subtle">
          <div className="w-12 h-12 bg-rose-100 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 rounded-full flex items-center justify-center mx-auto mb-5 border border-rose-200 dark:border-rose-900">
            <Icon name="x" size={22} />
          </div>

          <h2 className="text-2xl font-heading font-bold text-ink mb-2">
            Transfer failed
          </h2>
          <p className="text-muted text-sm mb-6">
            {flow.error || "The partner clearing rail timed out. Your account was not charged."}
          </p>

          <div className="space-y-2">
            <button
              type="button"
              className="button button-primary w-full h-11 text-sm font-medium"
              onClick={flow.retryTransfer}
            >
              Try again
            </button>
            <button
              type="button"
              className="button button-quiet w-full h-11 text-sm text-muted hover:text-ink"
              onClick={handleBack}
            >
              Edit details
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ==========================================
  // Main 3-Step Flow (from -> to -> review)
  // ==========================================
  return (
    <div className={`${aside ? "max-w-5xl" : "max-w-xl"} mx-auto py-4 sm:py-8 px-4`}>
      {/* Quiet, Minimal Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-heading font-bold text-ink tracking-tight">
          Send money
        </h1>
      </div>

      <div className={aside ? "grid grid-cols-1 lg:grid-cols-12 gap-6 items-start" : ""}>
        <div className={aside ? "lg:col-span-8 min-w-0" : ""}>
          {/* Minimal Progress Line (3 steps) */}
          <div className="mb-6">
            <div className="flex items-center justify-between text-xs mb-2">
              <span className="font-medium text-ink">
                {flow.step === "from" && "1. Amount & Method"}
                {flow.step === "to" && "2. Recipient"}
                {flow.step === "review" && "3. Review"}
              </span>
              <span className="text-muted">
                {flow.step === "from" && "Step 1 of 3"}
                {flow.step === "to" && "Step 2 of 3"}
                {flow.step === "review" && "Step 3 of 3"}
              </span>
            </div>
            <div className="w-full bg-soft h-1 rounded-full overflow-hidden">
              <div
                className="bg-ink h-full transition-all duration-300"
                style={{
                  width:
                    flow.step === "from"
                      ? "33.3%"
                      : flow.step === "to"
                      ? "66.6%"
                      : "100%",
                }}
              />
            </div>
          </div>

          {/* Main Focus Card */}
          <div className="bg-paper border border-line rounded-2xl p-6 sm:p-8 shadow-subtle space-y-6">
        {/* ========================================================= */}
        {/* STEP 1: AMOUNT & PAYMENT METHOD                          */}
        {/* ========================================================= */}
        {flow.step === "from" && (
          <div className="space-y-6">
            {/* Amount & Currency Conversion Group */}
            <div className="space-y-2">
              {/* You Send Input */}
              <div className="border border-line rounded-xl p-3.5 bg-paper hover:border-ink/40 focus-within:!border-ink transition-colors">
                <span className="text-[11px] font-medium text-muted block mb-1">
                  You send
                </span>
                <div className="flex items-center gap-3">
                  <input
                    type="number"
                    min="1"
                    step="any"
                    value={flow.amount}
                    onChange={(e) => flow.setAmount(e.target.value)}
                    placeholder="0.00"
                    className="w-full text-2xl sm:text-3xl font-heading font-semibold text-ink bg-transparent outline-none placeholder:text-subtle"
                    autoFocus
                  />
                  <div className="flex items-center gap-1.5 pl-3 border-l border-line shrink-0">
                    <CountryFlag
                      code={
                        SUPPORTED_SOURCE_CURRENCIES.find(
                          (c) => c.code === flow.sendCurrency
                        )?.flagCode || "us"
                      }
                      country={flow.sendCurrency}
                    />
                    <select
                      value={flow.sendCurrency}
                      onChange={(e) => flow.setSendCurrency(e.target.value)}
                      className="send-currency-inline bg-transparent font-medium text-ink text-sm outline-none cursor-pointer"
                      aria-label="Select sending currency"
                    >
                      {SUPPORTED_SOURCE_CURRENCIES.map((c) => (
                        <option key={c.code} value={c.code}>
                          {c.code}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* Calm, Single-Line Rate & Fee Breakdown */}
              <div className="flex items-center justify-between px-2 text-xs text-muted">
                <span>
                  Fee: <strong className="text-ink font-medium">1% ({formatAmount(flow.calculation.feeAmount)} {flow.sendCurrency})</strong>
                </span>
                <span>
                  1 {flow.sendCurrency} = <strong className="text-ink font-medium">{formatAmount(flow.calculation.exchangeRate, 4)} {flow.targetCurrency}</strong>
                </span>
              </div>

              {/* Recipient Receives Output */}
              <div className="border border-line rounded-xl p-3.5 bg-soft">
                <span className="text-[11px] font-medium text-muted block mb-1">
                  Recipient receives
                </span>
                <div className="flex items-center justify-between gap-3">
                  <div className="text-2xl sm:text-3xl font-heading font-semibold text-ink">
                    {formatAmount(flow.calculation.recipientReceives)}
                  </div>
                  <div className="flex items-center gap-1.5 pl-3 border-l border-line shrink-0 font-medium text-ink text-sm">
                    <CountryFlag
                      code={countryFlag(flow.targetCountry)}
                      country={flow.targetCountry}
                    />
                    <span>{flow.targetCurrency}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Payment Method (Segmented Control) */}
            <div className="pt-2">
              <label className="text-xs font-semibold text-muted uppercase tracking-wider block mb-2.5">
                Pay with
              </label>

              <div className="grid grid-cols-3 gap-1 p-1 bg-soft rounded-xl border border-line mb-4">
                {[
                  { key: "bank", label: "Bank account" },
                  { key: "card", label: "Card" },
                  { key: "mobile", label: "Mobile money" },
                ].map((m) => {
                  const isSel = flow.paymentMethod === m.key;
                  return (
                    <button
                      key={m.key}
                      type="button"
                      className={`h-9 text-xs rounded-lg transition-all ${
                        isSel
                          ? "bg-paper text-ink font-semibold shadow-xs"
                          : "text-muted hover:text-ink font-medium"
                      }`}
                      onClick={() => flow.setPaymentMethod(m.key as any)}
                    >
                      {m.label}
                    </button>
                  );
                })}
              </div>

              {/* Conditional Method Inputs */}
              {flow.paymentMethod === "bank" && (
                <div className="border border-line rounded-xl p-3.5 bg-paper flex items-center justify-between text-xs">
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="w-8 h-8 rounded-full bg-soft flex items-center justify-center shrink-0 text-ink">
                      <Icon name="building" size={15} />
                    </span>
                    <div className="min-w-0">
                      <strong className="text-ink font-semibold block truncate">
                        {flow.linkedBanks[0]?.bank || "Primary Linked Bank"}
                      </strong>
                    </div>
                  </div>
                  {flow.linkedBanks.length > 1 && (
                    <select
                      value={flow.linkedBankId}
                      onChange={(e) => flow.setLinkedBankId(e.target.value)}
                      className="bg-soft border border-line text-ink rounded-lg px-2 py-1 text-xs outline-none"
                    >
                      {flow.linkedBanks.map((b) => (
                        <option key={b.id} value={b.id}>
                          {b.account}
                        </option>
                      ))}
                    </select>
                  )}
                </div>
              )}

              {flow.paymentMethod === "card" && (
                <div className="space-y-2.5">
                  <input
                    type="text"
                    maxLength={19}
                    placeholder="Card number (16 digits)"
                    value={flow.cardData.number}
                    onChange={(e) => {
                      const v = e.target.value.replace(/\D/g, "").slice(0, 16);
                      const fmt = v.match(/.{1,4}/g)?.join(" ") || v;
                      flow.setCardData({ ...flow.cardData, number: fmt });
                    }}
                    className="w-full h-11 px-3.5 border border-line rounded-xl bg-paper text-ink text-sm outline-none focus:border-ink"
                  />
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="text"
                      maxLength={5}
                      placeholder="MM/YY"
                      value={flow.cardData.expiry}
                      onChange={(e) => {
                        let v = e.target.value.replace(/\D/g, "").slice(0, 4);
                        if (v.length >= 3) v = `${v.slice(0, 2)}/${v.slice(2)}`;
                        flow.setCardData({ ...flow.cardData, expiry: v });
                      }}
                      className="w-full h-11 px-3.5 border border-line rounded-xl bg-paper text-ink text-sm outline-none focus:border-ink"
                    />
                    <input
                      type="password"
                      maxLength={4}
                      placeholder="CVV"
                      value={flow.cardData.cvv}
                      onChange={(e) => {
                        const v = e.target.value.replace(/\D/g, "").slice(0, 4);
                        flow.setCardData({ ...flow.cardData, cvv: v });
                      }}
                      className="w-full h-11 px-3.5 border border-line rounded-xl bg-paper text-ink text-sm outline-none focus:border-ink"
                    />
                  </div>
                </div>
              )}

              {flow.paymentMethod === "mobile" && (
                <div>
                  <input
                    type="tel"
                    placeholder="Sender phone number (for instant authorization prompt)"
                    value={flow.senderPhone}
                    onChange={(e) => flow.setSenderPhone(e.target.value)}
                    className="w-full h-11 px-3.5 border border-line rounded-xl bg-paper text-ink text-sm outline-none focus:border-ink"
                  />
                </div>
              )}
            </div>

            {/* Error Message */}
            {flow.error && (
              <p className="text-xs text-rose-600 dark:text-rose-400 font-medium">
                {flow.error}
              </p>
            )}

            {/* Primary Action Button */}
            <div className="pt-2">
              <button
                type="button"
                className="button button-primary w-full h-12 text-sm font-semibold rounded-xl"
                onClick={flow.goToTo}
                disabled={!flow.isFromValid}
              >
                Continue
              </button>
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* STEP 2: RECIPIENT DETAILS                                */}
        {/* ========================================================= */}
        {flow.step === "to" && (
          <div className="space-y-5">
            {/* Tab switch if user has saved recipients */}
            {recipients.length > 0 && (
              <div className="grid grid-cols-2 gap-1 p-1 bg-soft rounded-xl border border-line">
                <button
                  type="button"
                  className={`h-9 text-xs rounded-lg transition-all ${
                    recipientTab === "saved"
                      ? "bg-paper text-ink font-semibold shadow-xs"
                      : "text-muted hover:text-ink font-medium"
                  }`}
                  onClick={() => setRecipientTab("saved")}
                >
                  Saved recipients ({recipients.length})
                </button>
                <button
                  type="button"
                  className={`h-9 text-xs rounded-lg transition-all ${
                    recipientTab === "new"
                      ? "bg-paper text-ink font-semibold shadow-xs"
                      : "text-muted hover:text-ink font-medium"
                  }`}
                  onClick={() => {
                    setRecipientTab("new");
                    flow.clearSelectedBeneficiary();
                  }}
                >
                  New recipient
                </button>
              </div>
            )}

            {/* Pick from Saved Recipients */}
            {recipientTab === "saved" && recipients.length > 0 ? (
              <div className="space-y-3">
                <div className="relative">
                  <Icon
                    name="search"
                    size={14}
                    className="absolute left-3 top-3 text-muted"
                  />
                  <input
                    type="text"
                    placeholder="Search by name, bank, or account..."
                    value={recipientSearch}
                    onChange={(e) => setRecipientSearch(e.target.value)}
                    className="w-full h-9 pl-8 pr-3 text-xs border border-line rounded-lg bg-paper text-ink outline-none focus:border-ink"
                  />
                </div>

                <div className="space-y-1.5 max-h-64 overflow-y-auto pr-1">
                  {filteredRecipients.map((r) => {
                    const isSel = flow.selectedBeneficiaryId === r.id;
                    return (
                      <button
                        key={r.id}
                        type="button"
                        className={`w-full p-3 rounded-xl border text-left flex items-center justify-between gap-3 transition-colors ${
                          isSel
                            ? "border-ink bg-soft"
                            : "border-line bg-paper hover:bg-soft"
                        }`}
                        onClick={() => flow.selectBeneficiary(r)}
                      >
                        <div className="min-w-0">
                          <strong className="text-xs text-ink block truncate font-semibold">
                            {r.name}
                          </strong>
                          <span className="text-[11px] text-muted block truncate">
                            {r.country} · {r.provider || r.method}
                          </span>
                        </div>
                        <span className="text-xs font-mono text-muted shrink-0">
                          {r.account}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            ) : (
              /* Enter New Recipient */
              <div className="space-y-4">
                <div>
                  <label className="text-xs font-medium text-muted block mb-1.5">
                    Destination country
                  </label>
                  <CountrySelect
                    value={flow.targetCountry}
                    onChange={flow.setTargetCountry}
                  />
                </div>

                <div>
                  <label className="text-xs font-medium text-muted block mb-1.5">
                    Destination bank
                  </label>
                  <select
                    value={flow.bankName}
                    onChange={(e) => flow.setBankName(e.target.value)}
                    className="w-full h-11 pl-3.5 pr-10 border border-line rounded-xl bg-paper text-ink text-sm outline-none focus:border-ink font-medium cursor-pointer"
                  >
                    {(CORRIDOR_BANKS[flow.targetCountry] || CORRIDOR_BANKS.Nigeria).map(
                      (b) => (
                        <option key={b} value={b}>
                          {b}
                        </option>
                      )
                    )}
                  </select>
                </div>

                <div>
                  <label className="text-xs font-medium text-muted block mb-1.5">
                    Account number
                  </label>
                  <input
                    type="text"
                    inputMode="numeric"
                    placeholder="Enter account number (min. 8 digits)"
                    value={flow.accountNumber}
                    onChange={(e) => flow.setAccountNumber(e.target.value)}
                    className="w-full h-11 px-3.5 border border-line rounded-xl bg-paper text-ink font-mono text-sm outline-none focus:border-ink"
                  />

                  {/* Clean, Non-intrusive Name Verification Indicator */}
                  {flow.isResolvingName && (
                    <p className="text-xs text-muted flex items-center gap-1.5 mt-2">
                      <span className="w-3 h-3 rounded-full border border-muted border-t-transparent animate-spin inline-block" />
                      <span>Verifying account name...</span>
                    </p>
                  )}

                  {!flow.isResolvingName && flow.accountName && (
                    <p className="text-xs text-ink font-medium flex items-center gap-1.5 mt-2">
                      <Icon name="check" size={14} className="text-emerald-600" />
                      <span>Verified: <strong>{flow.accountName}</strong></span>
                    </p>
                  )}
                </div>

                {/* Save Recipient Checkbox */}
                {!flow.selectedBeneficiaryId && flow.accountName && (
                  <label className="flex items-center gap-2 text-xs text-muted hover:text-ink cursor-pointer pt-1">
                    <input
                      type="checkbox"
                      checked={flow.saveBeneficiary}
                      onChange={(e) => flow.setSaveBeneficiary(e.target.checked)}
                      className="w-3.5 h-3.5 rounded text-ink"
                    />
                    <span>Save recipient for future transfers</span>
                  </label>
                )}
              </div>
            )}

            {/* Error Notice */}
            {flow.error && (
              <p className="text-xs text-rose-600 dark:text-rose-400 font-medium">
                {flow.error}
              </p>
            )}

            {/* Navigation Actions */}
            <div className="flex items-center justify-between pt-4 border-t border-line">
              <button
                type="button"
                className="button button-quiet text-xs h-10 px-4 text-muted hover:text-ink"
                onClick={flow.goBack}
              >
                ← Back
              </button>
              <button
                type="button"
                className="button button-primary h-11 px-6 text-sm font-semibold rounded-xl"
                onClick={flow.goToReview}
                disabled={!flow.isToValid}
              >
                Continue to review
              </button>
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* STEP 3: REVIEW & CONFIRM (with PIN entry under Reference) */}
        {/* ========================================================= */}
        {flow.step === "review" && (
          <div className="space-y-6">
            {/* Hero Conversion Summary */}
            <div className="text-center py-3 border-b border-line">
              <span className="text-[11px] font-semibold text-muted uppercase tracking-wider block mb-1">
                You are sending
              </span>
              <div className="text-2xl sm:text-3xl font-heading font-bold text-ink">
                {formatAmount(flow.calculation.amount)} {flow.sendCurrency}
                <span className="text-muted mx-2 font-normal">→</span>
                {formatAmount(flow.calculation.recipientReceives)} {flow.targetCurrency}
              </div>
            </div>

            {/* Clean Line-Item Review */}
            <div className="text-xs divide-y divide-line">
              <div className="flex justify-between py-2.5">
                <span className="text-muted">Recipient</span>
                <strong className="text-ink font-semibold">{flow.accountName}</strong>
              </div>
              <div className="flex justify-between py-2.5">
                <span className="text-muted">Bank & account</span>
                <span className="text-ink font-medium">
                  {flow.bankName} · {flow.accountNumber}
                </span>
              </div>
              <div className="flex justify-between py-2.5">
                <span className="text-muted">Clearing protocol</span>
                <span className="text-ink font-medium">
                  {flow.clearingRail.settlementRailProtocol}
                </span>
              </div>
              <div className="flex justify-between py-2.5">
                <span className="text-muted">Guaranteed rate</span>
                <span className="text-ink font-medium">
                  1 {flow.sendCurrency} = {formatAmount(flow.calculation.exchangeRate, 4)} {flow.targetCurrency}
                </span>
              </div>
              <div className="flex justify-between py-2.5">
                <span className="text-muted">Transfer fee (1%)</span>
                <span className="text-ink font-medium">
                  {formatAmount(flow.calculation.feeAmount)} {flow.sendCurrency}
                </span>
              </div>
              <div className="flex justify-between py-2.5 font-bold text-ink">
                <span>Total debited</span>
                <span>
                  {formatAmount(flow.calculation.totalDebit)} {flow.sendCurrency}
                </span>
              </div>
            </div>

            {/* Reference Section */}
            <div>
              <label className="text-[11px] font-medium text-muted block mb-1">
                Reference
              </label>
              <input
                type="text"
                placeholder="Add a note or reference"
                value={flow.description}
                onChange={(e) => flow.setDescription(e.target.value)}
                className="w-full h-10 px-3.5 border border-line rounded-xl bg-paper text-ink text-xs outline-none focus:border-ink"
              />
            </div>

            {/* Security PIN Section (Under Reference, not inside an input, big asterisks like ****) */}
            <div className="pt-2">
              <label className="text-[11px] font-semibold text-muted uppercase tracking-wider block text-center mb-2.5">
                Security PIN
              </label>

              {/* Big Asterisk Display: **** */}
              <div
                className="flex items-center justify-center gap-3 py-1 cursor-pointer select-none"
                onClick={() => pinInputRef.current?.focus()}
                role="button"
                tabIndex={0}
                aria-label="Enter 4-digit PIN"
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    pinInputRef.current?.focus();
                  }
                }}
              >
                {[0, 1, 2, 3].map((idx) => {
                  const isFilled = pin.length > idx;
                  const isCurrent = pin.length === idx;
                  return (
                    <div
                      key={idx}
                      className={`w-12 h-14 rounded-xl border flex items-center justify-center transition-all ${
                        isFilled
                          ? "border-ink bg-paper text-ink shadow-xs"
                          : isCurrent
                          ? "border-ink ring-1 ring-ink bg-paper"
                          : "border-line bg-soft text-subtle"
                      }`}
                    >
                      <span className="text-3xl sm:text-4xl font-heading font-bold select-none leading-none">
                        {isFilled ? "*" : ""}
                      </span>
                    </div>
                  );
                })}
              </div>

              {/* Hidden real input for physical/touch keyboard entry */}
              <input
                ref={pinInputRef}
                type="password"
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={4}
                value={pin}
                onChange={(e) => {
                  const clean = e.target.value.replace(/\D/g, "").slice(0, 4);
                  setPin(clean);
                  if (clean.length === 4) setPinError("");
                }}
                className="sr-only"
                autoFocus
              />

              {/* Minimal On-Screen Numeric Keypad */}
              <div className="max-w-[210px] mx-auto grid grid-cols-3 gap-1.5 pt-3">
                {["1", "2", "3", "4", "5", "6", "7", "8", "9"].map((num) => (
                  <button
                    key={num}
                    type="button"
                    className="h-10 text-sm font-semibold rounded-lg border border-line bg-paper hover:bg-soft text-ink active:scale-95 transition-all"
                    onClick={() => {
                      if (pin.length < 4) {
                        const next = pin + num;
                        setPin(next);
                        if (next.length === 4) setPinError("");
                      }
                    }}
                  >
                    {num}
                  </button>
                ))}
                <button
                  type="button"
                  className="h-10 text-xs text-muted hover:text-ink font-medium rounded-lg transition-colors"
                  onClick={() => setPin("")}
                >
                  Clear
                </button>
                <button
                  type="button"
                  className="h-10 text-sm font-semibold rounded-lg border border-line bg-paper hover:bg-soft text-ink active:scale-95 transition-all"
                  onClick={() => {
                    if (pin.length < 4) {
                      const next = pin + "0";
                      setPin(next);
                      if (next.length === 4) setPinError("");
                    }
                  }}
                >
                  0
                </button>
                <button
                  type="button"
                  className="h-10 flex items-center justify-center text-muted hover:text-ink rounded-lg transition-colors"
                  onClick={() => setPin((prev) => prev.slice(0, -1))}
                  aria-label="Delete digit"
                >
                  <Icon name="close" size={14} />
                </button>
              </div>

              {pinError && (
                <p className="text-xs text-rose-600 dark:text-rose-400 font-medium text-center mt-2.5">
                  {pinError}
                </p>
              )}
            </div>

            {/* Navigation Actions */}
            <div className="flex items-center justify-between pt-4 border-t border-line">
              <button
                type="button"
                className="button button-quiet text-xs h-10 px-4 text-muted hover:text-ink"
                onClick={handleBack}
              >
                ← Back
              </button>
              <button
                type="button"
                className="button button-primary h-12 px-6 text-sm font-semibold rounded-xl"
                onClick={handleConfirmTransfer}
              >
                Send {formatAmount(flow.calculation.totalDebit)} {flow.sendCurrency}
              </button>
            </div>
          </div>
        )}
          </div>
        </div>

        {aside && (
          <aside className="lg:col-span-4 min-w-0 lg:sticky lg:top-6 lg:mt-[52px]">
            {aside}
          </aside>
        )}
      </div>
    </div>
  );
}
