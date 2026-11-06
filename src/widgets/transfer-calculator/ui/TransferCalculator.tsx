import { useState } from "react";
import { CountryFlag } from "@/entities/country";

export interface TransferCalculatorProps {
  onSend: () => void;
  className?: string;
}

export function TransferCalculator({ onSend, className = "" }: TransferCalculatorProps) {
  const currencies = [
    { code: "USD", flag: "🇺🇸", country: "United States", ngn: 1550 },
    { code: "NGN", flag: "🇳🇬", country: "Nigeria", ngn: 1 },
    { code: "KES", flag: "🇰🇪", country: "Kenya", ngn: 11.4 },
    { code: "GHS", flag: "🇬🇭", country: "Ghana", ngn: 104 },
    { code: "UGX", flag: "🇺🇬", country: "Uganda", ngn: 0.41 },
  ];
  const [amount, setAmount] = useState("100");
  const [from, setFrom] = useState("USD");
  const [to, setTo] = useState("NGN");
  const sender = currencies.find((item) => item.code === from) || currencies[0];
  const receiver = currencies.find((item) => item.code === to) || currencies[1];
  const rate = sender.ngn / receiver.ngn;
  const converted = (Number(amount) || 0) * rate;
  const format = (value: number) =>
    value.toLocaleString("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });

  return (
    <section className={`content-section calculator-section mt-8 ${className}`}>
      <div className="section-heading flex items-center justify-between mb-3">
        <div>
          <h2 className="my-0 font-heading font-bold text-sm tracking-[-0.3px] text-ink">Transfer calculator</h2>
          <p className="my-0 text-muted text-[9px]">Get an estimate before you send.</p>
        </div>
        <span className="calculator-demo text-muted text-[8px] font-bold flex items-center gap-1.5 border border-line px-2 py-0.5 rounded">
          <i className="w-1.5 h-1.5 rounded-full bg-ink inline-block" /> DEMO RATE
        </span>
      </div>
      <div className="calculator-card">
        <div className="calculator-chart">
          <div className="calculator-rate">
            1 {from} <span>=</span> {format(rate)} {to}
          </div>
          <div className="chart-area">
            <svg
              viewBox="0 0 520 190"
              role="img"
              aria-label="Illustrative exchange rate chart"
            >
              <path
                className="chart-gridline"
                d="M0 35H520M0 95H520M0 155H520"
              />
              <path
                className="chart-line"
                d="M4 113 42 51 76 63 112 137 151 126 190 45 228 71 265 80 305 98 345 72 381 109 420 150 458 130 495 158 516 137"
              />
              <circle className="chart-point" cx="516" cy="137" r="5" />
            </svg>
            <div className="chart-dates">
              <span>30 days ago</span>
              <span>Today</span>
            </div>
          </div>
        </div>
        <div className="calculator-controls">
          <label className="calculator-field">
            <span>You send</span>
            <div>
              <input
                aria-label="Amount to send"
                type="number"
                min="0"
                value={amount}
                onChange={(event) => setAmount(event.target.value)}
              />
              <span className="currency-choice">
                <CountryFlag
                  code={
                    from === "USD"
                      ? "us"
                      : from === "NGN"
                        ? "ng"
                        : from === "KES"
                          ? "ke"
                          : from === "GHS"
                            ? "gh"
                            : "ug"
                  }
                  country={
                    currencies.find((item) => item.code === from)?.country ||
                    from
                  }
                />
                <select
                  aria-label="Sending currency"
                  value={from}
                  onChange={(event) => setFrom(event.target.value)}
                >
                  {currencies.map((item) => (
                    <option key={item.code} value={item.code}>
                      {item.code}
                    </option>
                  ))}
                </select>
              </span>
            </div>
          </label>
          <button
            type="button"
            className="calculator-swap"
            aria-label="Swap currencies"
            onClick={() => {
              setFrom(to);
              setTo(from);
            }}
          >
            ↕
          </button>
          <label className="calculator-field">
            <span>Recipient gets</span>
            <div>
              <output>{format(converted)}</output>
              <span className="currency-choice">
                <CountryFlag
                  code={
                    to === "USD"
                      ? "us"
                      : to === "NGN"
                        ? "ng"
                        : to === "KES"
                          ? "ke"
                          : to === "GHS"
                            ? "gh"
                            : "ug"
                  }
                  country={
                    currencies.find((item) => item.code === to)?.country || to
                  }
                />
                <select
                  aria-label="Receiving currency"
                  value={to}
                  onChange={(event) => setTo(event.target.value)}
                >
                  {currencies.map((item) => (
                    <option key={item.code} value={item.code}>
                      {item.code}
                    </option>
                  ))}
                </select>
              </span>
            </div>
          </label>
          <div className="calculator-meta">
            <div>
              <span>Transfer fee</span>
              <strong>{from} 2.99</strong>
            </div>
            <div>
              <span>Estimated arrival</span>
              <strong>Minutes</strong>
            </div>
          </div>
          <button type="button" className="button calculator-send" onClick={onSend}>
            Send money <span>→</span>
          </button>
          <small className="calculator-disclaimer">
            Illustrative rates only. Final rates and fees may vary.
          </small>
        </div>
      </div>
    </section>
  );
}

