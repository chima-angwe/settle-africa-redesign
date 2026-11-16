import { useState } from "react";
import { CountryCurrencySelect, countryCurrencies } from "@/entities/country";
import { getExchangeRate } from "@/features/send-money";

export interface TransferCalculatorProps {
  onSend?: () => void;
  className?: string;
}

export function TransferCalculator({ className = "" }: TransferCalculatorProps) {
  const [amount, setAmount] = useState("1000");
  const [fromCountry, setFromCountry] = useState("Nigeria");
  const [toCountry, setToCountry] = useState("Kenya");

  const from = countryCurrencies[fromCountry] || "NGN";
  const to = countryCurrencies[toCountry] || "KES";

  const rate = getExchangeRate(from, to);
  const numericAmount = parseFloat(amount) || 0;
  const converted = Math.max(0, numericAmount) * rate;

  const formatAmount = (value: number, maxDecimals = 2) =>
    value.toLocaleString("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: maxDecimals,
    });

  const swap = () => {
    setFromCountry(toCountry);
    setToCountry(fromCountry);
  };

  return (
    <div
      className={`bg-paper border border-line rounded-2xl p-4 sm:p-5 shadow-subtle space-y-3 ${className}`}
    >
      <div className="flex items-center justify-between">
        <h2 className="text-xs font-heading font-bold text-ink uppercase tracking-wider">
          Calculator
        </h2>
      </div>

      {/* Input 1: Amount & Source Country/Currency */}
      <div className="border border-line rounded-xl px-3 py-2.5 bg-paper flex items-center gap-2 focus-within:border-ink transition-colors">
        <input
          type="number"
          min="0"
          step="any"
          aria-label="Amount"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          placeholder="0.00"
          className="w-full min-w-0 text-lg font-heading font-bold text-ink bg-transparent outline-none placeholder:text-subtle"
        />
        <div className="pl-2 border-l border-line shrink-0">
          <CountryCurrencySelect
            country={fromCountry}
            onChange={(nextCountry) => setFromCountry(nextCountry)}
            ariaLabel="From African country and currency"
          />
        </div>
      </div>

      {/* Rate & Swap Divider */}
      <div className="flex items-center justify-between px-1">
        <span className="text-[11px] font-mono text-muted">
          1 {from} = {formatAmount(rate, rate < 1 ? 4 : 2)} {to}
        </span>
        <button
          type="button"
          onClick={swap}
          className="w-7 h-7 rounded-full border border-line bg-soft hover:border-ink text-ink text-xs flex items-center justify-center cursor-pointer transition-colors"
          aria-label="Swap currencies"
        >
          ↕
        </button>
      </div>

      {/* Input 2: Converted Output & Target Country/Currency */}
      <div className="border border-line rounded-xl px-3 py-2.5 bg-soft flex items-center gap-2">
        <output className="w-full min-w-0 text-lg font-heading font-bold text-ink truncate">
          {formatAmount(converted)}
        </output>
        <div className="pl-2 border-l border-line shrink-0">
          <CountryCurrencySelect
            country={toCountry}
            onChange={(nextCountry) => setToCountry(nextCountry)}
            ariaLabel="To African country and currency"
          />
        </div>
      </div>
    </div>
  );
}
