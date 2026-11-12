import { useState, useId, useRef, useEffect } from "react";
import { Icon } from "@/shared/ui";
import type {
  LinkedBankBalance,
  AirtimeTransaction,
  TopupMode,
  DataPlanCategory,
} from "../model/types";
import {
  COUNTRY_CURRENCY_MAP,
  COUNTRY_OPERATORS,
  PRESET_AMOUNTS,
  getDataPlans,
  formatCurrencyValue,
  saveLinkedBankBalances,
  loadAirtimeHistory,
  saveAirtimeHistory,
} from "../model/walletStore";
import { OperatorLogo } from "./OperatorLogo";

export interface AirtimePurchaseCardProps {
  country: string;
  banks: LinkedBankBalance[];
  initialMode?: TopupMode;
  onSuccess?: (tx: AirtimeTransaction) => void;
  onLinkBankClick?: () => void;
  onBack?: () => void;
}

const PLAN_CATEGORIES: Array<"All" | DataPlanCategory> = [
  "All",
  "Daily",
  "Weekly",
  "Monthly",
];

export function AirtimePurchaseCard({
  country,
  banks,
  initialMode = "airtime",
  onSuccess,
  onLinkBankClick,
  onBack,
}: AirtimePurchaseCardProps) {
  const phoneInputId = useId();
  const amountInputId = useId();
  const dropdownRef = useRef<HTMLDivElement>(null);

  const countryInfo = COUNTRY_CURRENCY_MAP[country] || COUNTRY_CURRENCY_MAP.Nigeria;
  const currency = countryInfo.code;
  const operators = COUNTRY_OPERATORS[country] || COUNTRY_OPERATORS.Nigeria;
  const presets = PRESET_AMOUNTS[currency] || PRESET_AMOUNTS.NGN;
  const minAmount = presets[0] || 50;
  const dataPlans = getDataPlans(currency);

  const [mode, setMode] = useState<TopupMode>(initialMode);
  const [phone, setPhone] = useState<string>("");
  const [selectedOperator, setSelectedOperator] = useState<string>("");
  const [dropdownOpen, setDropdownOpen] = useState<boolean>(false);
  const [amountInput, setAmountInput] = useState<string>("");
  const [planCategory, setPlanCategory] = useState<"All" | DataPlanCategory>("All");
  const [selectedPlanId, setSelectedPlanId] = useState<string>("");
  const [selectedBankId, setSelectedBankId] = useState<string>(() => {
    const defaultBank = banks.find((b) => b.isDefault) || banks[0];
    return defaultBank?.id || "";
  });

  const [status, setStatus] = useState<"idle" | "processing" | "success">("idle");
  const [latestTx, setLatestTx] = useState<AirtimeTransaction | null>(null);
  const [error, setError] = useState<string>("");

  useEffect(() => {
    if (!dropdownOpen) return;
    const handleOutside = (event: MouseEvent) => {
      if (!dropdownRef.current?.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleOutside);
    return () => document.removeEventListener("mousedown", handleOutside);
  }, [dropdownOpen]);

  const selectedBank = banks.find((b) => b.id === selectedBankId) || banks[0];
  const selectedOperatorObj = operators.find((o) => o.name === selectedOperator);
  const activeOperator = selectedOperatorObj ? selectedOperatorObj.name : "";
  const selectedPlan = dataPlans.find((p) => p.id === selectedPlanId) || null;
  const filteredPlans =
    planCategory === "All"
      ? dataPlans
      : dataPlans.filter((p) => p.category === planCategory);

  const numericAmount = parseFloat(amountInput) || 0;
  const purchaseAmount = mode === "data" ? selectedPlan?.price ?? 0 : numericAmount;
  const cleanPhone = phone.replace(/\D/g, "");
  const isPhoneValid = cleanPhone.length >= 7;
  const hasInsufficientBalance = selectedBank
    ? selectedBank.balance < purchaseAmount
    : true;
  const isSelectionValid =
    mode === "data" ? Boolean(selectedPlan) : numericAmount >= minAmount;
  const isFormValid =
    isPhoneValid &&
    Boolean(activeOperator) &&
    isSelectionValid &&
    !hasInsufficientBalance &&
    Boolean(selectedBank);

  const handleModeSwitch = (nextMode: TopupMode) => {
    if (nextMode === mode) return;
    setMode(nextMode);
    setError("");
  };

  const handleContinue = () => {
    if (!selectedBank) {
      setError("Select an account");
      return;
    }
    if (!isPhoneValid) {
      setError("Enter a valid phone number");
      return;
    }
    if (!activeOperator) {
      setError("Choose a network provider");
      return;
    }
    if (mode === "airtime" && numericAmount < minAmount) {
      setError(`Minimum amount is ${countryInfo.symbol}${minAmount}`);
      return;
    }
    if (mode === "data" && !selectedPlan) {
      setError("Select a data plan");
      return;
    }
    if (hasInsufficientBalance) {
      setError("Insufficient balance");
      return;
    }

    setError("");
    setStatus("processing");

    setTimeout(() => {
      const updatedBanks = banks.map((b) => {
        if (b.id === selectedBank.id) {
          return {
            ...b,
            balance: Math.max(0, b.balance - purchaseAmount),
          };
        }
        return b;
      });
      saveLinkedBankBalances(updatedBanks);

      const prefix = mode === "data" ? "DAT" : "AIR";
      const refId = `${prefix}-${Math.floor(10000 + Math.random() * 90000)}`;
      const newTx: AirtimeTransaction = {
        id: refId,
        type: mode,
        operator: activeOperator,
        phoneNumber: phone,
        amount: purchaseAmount,
        currency,
        bankName: selectedBank.bank,
        date: "Just now",
        reference: `REF-${refId}-${selectedBank.account}`,
        status: "Completed",
        ...(mode === "data" && selectedPlan
          ? {
              planName: selectedPlan.dataAmount,
              validity: selectedPlan.validity,
            }
          : {}),
      };

      const existingHistory = loadAirtimeHistory();
      saveAirtimeHistory([newTx, ...existingHistory]);

      setLatestTx(newTx);
      setStatus("success");
      if (onSuccess) {
        onSuccess(newTx);
      }
    }, 1000);
  };

  const handleReset = () => {
    setStatus("idle");
    setLatestTx(null);
    setPhone("");
    setSelectedOperator("");
    setAmountInput("");
    setSelectedPlanId("");
    setError("");
  };

  if (banks.length === 0) {
    return (
      <div className="bg-paper border border-line rounded-2xl p-6 shadow-subtle text-center space-y-3">
        <p className="text-xs text-muted">
          Link a bank account to buy airtime or data
        </p>
        {onLinkBankClick && (
          <button
            type="button"
            onClick={onLinkBankClick}
            className="button button-primary px-4 py-2 text-xs font-semibold rounded-lg inline-flex items-center gap-1.5 cursor-pointer"
          >
            <Icon name="plus" size={14} />
            <span>Link bank</span>
          </button>
        )}
      </div>
    );
  }

  if (status === "success" && latestTx) {
    const isDataTx = latestTx.type === "data";
    return (
      <div className="bg-paper border border-line rounded-2xl p-6 sm:p-8 shadow-subtle space-y-5">
        <div className="text-center space-y-2">
          <div className="flex justify-center">
            <OperatorLogo operator={latestTx.operator} size={40} />
          </div>
          <h3 className="text-base font-heading font-bold text-ink">
            {isDataTx ? "Data plan activated" : "Airtime sent"}
          </h3>
        </div>

        <div className="p-4 bg-soft rounded-xl border border-line/70 space-y-2 text-xs">
          {isDataTx && latestTx.planName && (
            <div className="flex justify-between items-center text-muted">
              <span>Data plan</span>
              <strong className="text-ink font-semibold">
                {latestTx.planName}
                {latestTx.validity ? ` · ${latestTx.validity}` : ""}
              </strong>
            </div>
          )}
          <div className="flex justify-between items-center text-muted">
            <span>Amount</span>
            <strong className="text-ink font-bold font-mono">
              {formatCurrencyValue(latestTx.amount, latestTx.currency)}
            </strong>
          </div>
          <div className="flex justify-between items-center text-muted">
            <span>Phone</span>
            <strong className="text-ink font-mono">{latestTx.phoneNumber}</strong>
          </div>
          <div className="flex justify-between items-center text-muted">
            <span>Network</span>
            <strong className="text-ink font-medium">{latestTx.operator}</strong>
          </div>
          <div className="flex justify-between items-center text-muted pt-2 border-t border-line">
            <span>Balance</span>
            <strong className="text-ink font-bold font-mono">
              {formatCurrencyValue(selectedBank?.balance ?? 0, currency)}
            </strong>
          </div>
        </div>

        <button
          type="button"
          onClick={handleReset}
          className="button button-primary w-full h-11 text-xs font-bold rounded-xl cursor-pointer"
        >
          Buy again
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="bg-paper border border-line rounded-2xl p-5 sm:p-6 shadow-subtle space-y-5">
        {/* Airtime / Data Mode Switcher */}
        <div
          role="tablist"
          aria-label="Purchase type"
          className="grid grid-cols-2 gap-1 p-1 bg-soft border border-line rounded-xl"
        >
          {(
            [
              { id: "airtime", label: "Airtime" },
              { id: "data", label: "Data plans" },
            ] as const
          ).map((tab) => {
            const active = mode === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                role="tab"
                aria-selected={active}
                onClick={() => handleModeSwitch(tab.id)}
                className={`h-9 rounded-lg text-xs transition-all cursor-pointer ${
                  active
                    ? "bg-ink text-inverse-text font-bold shadow-xs"
                    : "text-muted hover:text-ink font-medium"
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </div>

        {error && (
          <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-700 dark:text-amber-400">
            {error}
          </div>
        )}

        {/* 1. Phone Number */}
        <div className="space-y-1.5">
          <label
            htmlFor={phoneInputId}
            className="text-xs font-bold text-ink block"
          >
            Phone Number
          </label>
          <input
            id={phoneInputId}
            type="tel"
            value={phone}
            onChange={(e) => {
              setPhone(e.target.value);
              setError("");
            }}
            placeholder="08012345678"
            className="w-full h-11 px-3.5 border border-line rounded-xl bg-paper text-sm font-mono text-ink outline-none focus:border-ink placeholder:text-muted/60 transition-colors"
          />
        </div>

        {/* 2. Network Provider Dropdown with Operator Logos */}
        <div className="space-y-1.5" ref={dropdownRef}>
          <label className="text-xs font-bold text-ink block">
            Network Provider
          </label>
          <div className="relative">
            <button
              type="button"
              aria-expanded={dropdownOpen}
              onClick={() => setDropdownOpen((o) => !o)}
              className={`w-full h-11 px-3.5 border rounded-xl bg-paper flex items-center justify-between gap-2 text-left text-xs sm:text-sm outline-none transition-colors cursor-pointer ${
                dropdownOpen ? "border-ink" : "border-line hover:border-ink/50"
              }`}
            >
              {selectedOperatorObj ? (
                <span className="flex items-center gap-2.5 min-w-0">
                  <OperatorLogo
                    operator={selectedOperatorObj.name}
                    code={selectedOperatorObj.code}
                    size={22}
                  />
                  <span className="font-medium text-ink truncate">
                    {selectedOperatorObj.name}
                  </span>
                </span>
              ) : (
                <span className="text-muted">Choose network provider</span>
              )}
              <Icon
                name="chevron"
                size={15}
                className={`text-muted shrink-0 transition-transform ${
                  dropdownOpen ? "-rotate-90" : "rotate-90"
                }`}
              />
            </button>

            {dropdownOpen && (
              <div
                role="listbox"
                className="absolute z-40 left-0 right-0 top-[calc(100%+6px)] bg-paper border border-line rounded-xl shadow-card overflow-hidden divide-y divide-line/60"
              >
                {operators.map((op) => {
                  const isSel = selectedOperator === op.name;
                  return (
                    <button
                      key={op.code}
                      type="button"
                      role="option"
                      aria-selected={isSel}
                      onClick={() => {
                        setSelectedOperator(op.name);
                        setDropdownOpen(false);
                        setError("");
                      }}
                      className={`w-full px-3.5 py-2.5 flex items-center justify-between gap-3 text-left text-xs sm:text-sm hover:bg-soft transition-colors cursor-pointer ${
                        isSel ? "bg-soft font-semibold text-ink" : "text-ink"
                      }`}
                    >
                      <span className="flex items-center gap-2.5 min-w-0">
                        <OperatorLogo
                          operator={op.name}
                          code={op.code}
                          size={22}
                        />
                        <span>{op.name}</span>
                      </span>
                      {isSel && (
                        <Icon name="check" size={14} className="text-ink shrink-0" />
                      )}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* 3 & 4. Airtime Amount OR Data Plan Selection */}
        {mode === "airtime" ? (
          <>
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label
                  htmlFor={amountInputId}
                  className="text-[10px] font-bold text-muted uppercase tracking-wider"
                >
                  AMOUNT
                </label>
                <span className="text-[11px] font-mono text-muted">
                  Available{" "}
                  <strong className="text-ink font-semibold">
                    {selectedBank
                      ? formatCurrencyValue(selectedBank.balance, selectedBank.currency)
                      : formatCurrencyValue(0, currency)}
                  </strong>
                </span>
              </div>
              <div className="flex items-center h-11 px-3.5 border border-line rounded-xl bg-paper focus-within:border-ink transition-colors">
                <span className="text-sm font-mono font-semibold text-ink mr-2 select-none">
                  {countryInfo.symbol}
                </span>
                <input
                  id={amountInputId}
                  type="number"
                  min={minAmount}
                  step="any"
                  value={amountInput}
                  onChange={(e) => {
                    setAmountInput(e.target.value);
                    setError("");
                  }}
                  placeholder={`Min: ${minAmount.toFixed(2)}`}
                  className="w-full bg-transparent border-0 outline-none text-sm font-mono text-ink placeholder:text-muted/60"
                />
              </div>
              {hasInsufficientBalance && numericAmount > 0 && (
                <p className="text-[11px] text-amber-700 dark:text-amber-400">
                  Amount exceeds available account balance.
                </p>
              )}
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-bold text-muted uppercase tracking-wider block">
                QUICK AMOUNTS
              </label>
              <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
                {presets.map((val) => {
                  const isSel = numericAmount === val;
                  return (
                    <button
                      key={val}
                      type="button"
                      onClick={() => {
                        setAmountInput(String(val));
                        setError("");
                      }}
                      className={`h-10 px-2 text-xs rounded-xl border text-center transition-all cursor-pointer font-mono font-medium ${
                        isSel
                          ? "bg-ink text-inverse-text border-ink font-bold shadow-xs"
                          : "bg-paper text-ink border-line hover:border-ink/40 hover:bg-soft"
                      }`}
                    >
                      {countryInfo.symbol}
                      {val.toLocaleString()}
                    </button>
                  );
                })}
              </div>
            </div>
          </>
        ) : (
          <div className="space-y-3">
            <div className="flex items-center justify-between gap-2">
              <span className="text-[10px] font-bold text-muted uppercase tracking-wider">
                DATA PLAN
              </span>
              <span className="text-[11px] font-mono text-muted">
                Available{" "}
                <strong className="text-ink font-semibold">
                  {selectedBank
                    ? formatCurrencyValue(selectedBank.balance, selectedBank.currency)
                    : formatCurrencyValue(0, currency)}
                </strong>
              </span>
            </div>

            {/* Category filter pills */}
            <div className="flex items-center gap-1.5 flex-wrap">
              {PLAN_CATEGORIES.map((category) => {
                const isActive = planCategory === category;
                return (
                  <button
                    key={category}
                    type="button"
                    onClick={() => setPlanCategory(category)}
                    className={`h-7 px-3 rounded-lg text-[11px] border transition-colors cursor-pointer ${
                      isActive
                        ? "bg-ink text-inverse-text border-ink font-semibold"
                        : "bg-soft text-muted border-line hover:text-ink"
                    }`}
                  >
                    {category}
                  </button>
                );
              })}
            </div>

            {/* Dummy Data Plans Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {filteredPlans.map((plan) => {
                const isSel = selectedPlanId === plan.id;
                return (
                  <button
                    key={plan.id}
                    type="button"
                    onClick={() => {
                      setSelectedPlanId(plan.id);
                      setError("");
                    }}
                    className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between gap-1.5 ${
                      isSel
                        ? "bg-ink text-inverse-text border-ink shadow-xs"
                        : "bg-paper text-ink border-line hover:border-ink/40 hover:bg-soft"
                    }`}
                  >
                    <div>
                      <div className="text-sm font-heading font-bold leading-tight">
                        {plan.dataAmount}
                      </div>
                      <div
                        className={`text-[11px] mt-0.5 ${
                          isSel ? "opacity-80" : "text-muted"
                        }`}
                      >
                        {plan.validity}
                      </div>
                    </div>
                    <div className="text-xs font-mono font-semibold pt-1">
                      {countryInfo.symbol}
                      {plan.price.toLocaleString()}
                    </div>
                  </button>
                );
              })}
            </div>

            {selectedPlan && hasInsufficientBalance && (
              <p className="text-[11px] text-amber-700 dark:text-amber-400">
                Selected plan exceeds available account balance.
              </p>
            )}
          </div>
        )}

        {/* 5. Account Selector */}
        {banks.length > 1 && (
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-muted uppercase tracking-wider block">
              ACCOUNT
            </label>
            <select
              value={selectedBankId}
              onChange={(e) => {
                setSelectedBankId(e.target.value);
                setError("");
              }}
              className="w-full h-11 pl-3.5 pr-10 border border-line bg-soft text-ink text-xs font-medium rounded-xl outline-none cursor-pointer hover:border-ink transition-colors"
            >
              {banks.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.bank} (•••• {b.account})
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Bottom Action Bar (< Back / Continue >) */}
      <div className="flex items-center justify-between gap-3 pt-1">
        <button
          type="button"
          onClick={onBack ? onBack : handleReset}
          className="h-10 px-4 border border-line rounded-xl bg-paper text-ink text-xs font-semibold hover:bg-soft transition-colors cursor-pointer inline-flex items-center gap-1.5"
        >
          <Icon name="chevron" size={14} className="rotate-180" />
          <span>Back</span>
        </button>

        <button
          type="button"
          disabled={status === "processing" || !isFormValid}
          onClick={handleContinue}
          className="button button-primary h-10 px-6 rounded-xl text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer disabled:opacity-40 disabled:pointer-events-none transition-all"
        >
          {status === "processing" ? (
            <>
              <span className="w-3.5 h-3.5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
              <span>Processing...</span>
            </>
          ) : (
            <>
              <span>
                {mode === "data" && selectedPlan
                  ? `Buy ${selectedPlan.dataAmount}`
                  : "Continue"}
              </span>
              <Icon name="chevron" size={14} />
            </>
          )}
        </button>
      </div>
    </div>
  );
}
