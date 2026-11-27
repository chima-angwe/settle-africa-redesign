import { useState } from "react";
import { CountryCurrencySelect, countryCurrencies } from "@/entities/country";
import { getExchangeRate } from "@/features/send-money";

export interface TransferCalculatorProps {
  onSend?: () => void;
  className?: string;
  amount?: string;
  onAmountChange?: (value: string) => void;
  fromCountry?: string;
  onFromCountryChange?: (country: string, currency: string) => void;
  toCountry?: string;
  onToCountryChange?: (country: string, currency: string) => void;
  fromCountries?: readonly string[];
  toCountries?: readonly string[];
  ratesMap?: Record<string, number>;
  currencyByCountry?: Record<string, string>;
  isoByCountry?: Record<string, string>;
  onSwap?: () => void;
  feeAmount?: number;
  totalDebit?: number;
}

export function TransferCalculator({
  className = "",
  amount: controlledAmount,
  onAmountChange,
  fromCountry: controlledFromCountry,
  onFromCountryChange,
  toCountry: controlledToCountry,
  onToCountryChange,
  fromCountries,
  toCountries,
  ratesMap,
  currencyByCountry,
  isoByCountry,
  onSwap,
}: TransferCalculatorProps) {
  const [internalAmount, setInternalAmount] = useState("500");
  const [internalFromCountry, setInternalFromCountry] = useState("Nigeria");
  const [internalToCountry, setInternalToCountry] = useState("Kenya");

  const amount = controlledAmount !== undefined ? controlledAmount : internalAmount;
  const fromCountry =
    controlledFromCountry !== undefined ? controlledFromCountry : internalFromCountry;
  const toCountry =
    controlledToCountry !== undefined ? controlledToCountry : internalToCountry;

  const setAmount = (val: string) => {
    if (onAmountChange) onAmountChange(val);
    else setInternalAmount(val);
  };

  const setFromCountry = (country: string, currency: string) => {
    if (onFromCountryChange) onFromCountryChange(country, currency);
    else setInternalFromCountry(country);
  };

  const setToCountry = (country: string, currency: string) => {
    if (onToCountryChange) onToCountryChange(country, currency);
    else setInternalToCountry(country);
  };

  const from =
    currencyByCountry?.[fromCountry] ||
    (fromCountries !== undefined ? "" : countryCurrencies[fromCountry] || "NGN");
  const to =
    currencyByCountry?.[toCountry] ||
    (toCountries !== undefined ? "" : countryCurrencies[toCountry] || "KES");

  const rate =
    ratesMap !== undefined
      ? from && to
        ? getExchangeRate(from, to, ratesMap, {})
        : 0
      : getExchangeRate(from || "NGN", to || "KES");
  const numericAmount = parseFloat(amount) || 0;
  const safeAmount = Math.max(0, numericAmount);
  const converted = safeAmount * rate;


  const formatAmount = (value: number, maxDecimals = 2) =>
    value.toLocaleString("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: maxDecimals,
    });

  const handleSwap = () => {
    if (onSwap) {
      onSwap();
      return;
    }
    if (safeAmount > 0 && converted > 0) {
      setInternalAmount(String(Number(converted.toFixed(2))));
    }
    setInternalFromCountry(toCountry);
    setInternalToCountry(fromCountry);
  };

  return (
    <div
      className={`bg-paper border border-line rounded-2xl p-4 sm:p-5 shadow-subtle space-y-3 ${className}`}
    >
      <div className="flex items-center justify-between">
        <h2 className="text-xs font-heading font-bold text-ink uppercase tracking-wider m-0">
          Swap
        </h2>
        <span className="text-[11px] font-mono text-muted">
          1 {from} = {formatAmount(rate, rate < 1 ? 4 : 2)} {to}
        </span>
      </div>

      {/* Input 1: Amount & Source Country/Currency */}
      <div className="border border-line rounded-xl px-3 py-2.5 bg-paper focus-within:border-ink transition-colors">
        <span className="text-[10px] font-medium text-muted block mb-1">
          Sending ({fromCountry})
        </span>
        <div className="flex items-center gap-2">
          <input
            type="number"
            min="0"
            step="any"
            aria-label="Sending amount"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="0.00"
            className="w-full min-w-0 text-lg font-heading font-bold text-ink bg-transparent outline-none placeholder:text-subtle"
          />
          <div className="pl-2 border-l border-line shrink-0">
            <CountryCurrencySelect
              country={fromCountry}
              onChange={setFromCountry}
              countries={fromCountries}
              currencyByCountry={currencyByCountry}
              isoByCountry={isoByCountry}
              ariaLabel="From African country and currency"
            />
          </div>
        </div>
      </div>

      {/* Two-Arrow Inline Swap (not a button) */}
      <div className="flex items-center justify-center -my-1">
        <span
          role="button"
          tabIndex={0}
          onClick={handleSwap}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              handleSwap();
            }
          }}
          aria-label="Swap sending and receiving countries"
          title="Swap currencies"
          className="inline-flex items-center justify-center p-1 text-muted hover:text-ink cursor-pointer select-none transition-transform hover:scale-110 active:scale-95"
        >
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d="m3 16 4 4 4-4" />
            <path d="M7 20V4" />
            <path d="m21 8-4-4-4 4" />
            <path d="M17 4v16" />
          </svg>
        </span>
      </div>

      {/* Input 2: Converted Output & Target Country/Currency */}
      <div className="border border-line rounded-xl px-3 py-2.5 bg-soft">
        <span className="text-[10px] font-medium text-muted block mb-1">
          Receiving ({toCountry})
        </span>
        <div className="flex items-center gap-2">
          <output className="w-full min-w-0 text-lg font-heading font-bold text-ink truncate">
            {formatAmount(converted)}
          </output>
          <div className="pl-2 border-l border-line shrink-0">
            <CountryCurrencySelect
              country={toCountry}
              onChange={setToCountry}
              countries={toCountries}
              currencyByCountry={currencyByCountry}
              isoByCountry={isoByCountry}
              ariaLabel="To African country and currency"
            />
          </div>
        </div>
      </div>

    </div>
  );
}
