import { useState, useMemo } from "react";
import { CountryFlag } from "@/entities/country";
import {
  getExchangeRate,
  SUPPORTED_SOURCE_CURRENCIES,
  CORRIDOR_RECEIVE_CURRENCIES,
} from "@/features/send-money";

export interface TransferCalculatorProps {
  onSend?: () => void;
  className?: string;
}

export function TransferCalculator({ className = "" }: TransferCalculatorProps) {
  const currencies = useMemo(() => {
    const map = new Map<string, (typeof SUPPORTED_SOURCE_CURRENCIES)[number]>();
    for (const c of SUPPORTED_SOURCE_CURRENCIES) map.set(c.code, c);
    for (const c of CORRIDOR_RECEIVE_CURRENCIES) {
      if (!map.has(c.code)) map.set(c.code, c);
    }
    return Array.from(map.values());
  }, []);

  const [amount, setAmount] = useState("100");
  const [from, setFrom] = useState("USD");
  const [to, setTo] = useState("NGN");

  const fromMeta = currencies.find((item) => item.code === from) || currencies[0];
  const toMeta = currencies.find((item) => item.code === to) || currencies[1];

  const rate = getExchangeRate(from, to);
  const numericAmount = parseFloat(amount) || 0;
  const converted = Math.max(0, numericAmount) * rate;

  const formatAmount = (value: number, maxDecimals = 2) =>
    value.toLocaleString("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: maxDecimals,
    });

  const swap = () => {
    setFrom(to);
    setTo(from);
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

      {/* Input 1: Amount & Source Currency */}
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
        <div className="flex items-center gap-1.5 pl-2 border-l border-line shrink-0">
          <CountryFlag code={fromMeta.flagCode} country={fromMeta.country} />
          <select
            aria-label="From currency"
            value={from}
            onChange={(e) => setFrom(e.target.value)}
            className="send-currency-inline bg-transparent font-semibold text-ink text-xs outline-none cursor-pointer"
          >
            {currencies.map((c) => (
              <option key={c.code} value={c.code}>
                {c.code}
              </option>
            ))}
          </select>
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

      {/* Input 2 (Converted Output & Target Currency) */}
      <div className="border border-line rounded-xl px-3 py-2.5 bg-soft flex items-center gap-2">
        <output className="w-full min-w-0 text-lg font-heading font-bold text-ink truncate">
          {formatAmount(converted)}
        </output>
        <div className="flex items-center gap-1.5 pl-2 border-l border-line shrink-0">
          <CountryFlag code={toMeta.flagCode} country={toMeta.country} />
          <select
            aria-label="To currency"
            value={to}
            onChange={(e) => setTo(e.target.value)}
            className="send-currency-inline bg-transparent font-semibold text-ink text-xs outline-none cursor-pointer"
          >
            {currencies.map((c) => (
              <option key={c.code} value={c.code}>
                {c.code}
              </option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
}
