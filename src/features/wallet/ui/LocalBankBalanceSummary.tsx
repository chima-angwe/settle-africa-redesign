import { useState } from "react";
import { Icon } from "@/shared/ui";
import type { LinkedBankBalance } from "../model/types";
import { formatCurrencyValue } from "../model/walletStore";

export interface LocalBankBalanceSummaryProps {
  banks: LinkedBankBalance[];
  onBuyAirtimeClick?: () => void;
  onLinkBankClick?: () => void;
}

export function LocalBankBalanceSummary({
  banks,
  onLinkBankClick,
}: LocalBankBalanceSummaryProps) {
  const [hidden, setHidden] = useState(false);

  const currency = banks[0]?.currency || "NGN";
  const totalBalance = banks.reduce((sum, b) => sum + (b.balance || 0), 0);
  const primaryBank = banks.find((b) => b.isDefault) || banks[0];

  return (
    <div className="space-y-4">
      {/* Minimal Hero Balance Card */}
      <div className="bg-ink text-inverse-text rounded-2xl p-6 shadow-subtle">
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-1">
            <span className="text-xs font-medium opacity-75 block">
              Local balance
            </span>
            <div className="text-3xl sm:text-4xl font-heading font-bold tracking-tight font-mono">
              {hidden ? "********" : formatCurrencyValue(totalBalance, currency)}
            </div>
          </div>

          <button
            type="button"
            onClick={() => setHidden((prev) => !prev)}
            className="w-9 h-9 rounded-lg bg-white/15 hover:bg-white/25 flex items-center justify-center transition-colors cursor-pointer shrink-0"
            aria-label={hidden ? "Show balance" : "Hide balance"}
          >
            <Icon name={hidden ? "eyeOff" : "eye"} size={16} />
          </button>
        </div>

        <div className="border-t border-white/15 mt-5 pt-3.5 flex items-center justify-between gap-3">
          <strong className="text-xs font-mono font-medium opacity-85 truncate">
            {primaryBank
              ? `${primaryBank.bank} · ${primaryBank.account}`
              : "No banks linked"}
          </strong>

          {onLinkBankClick && (
            <button
              type="button"
              onClick={onLinkBankClick}
              className="px-3.5 py-2 rounded-lg bg-white/15 hover:bg-white/25 text-xs font-semibold transition-colors cursor-pointer shrink-0 inline-flex items-center gap-1.5"
            >
              <Icon name="plus" size={14} />
              <span>Link bank account</span>
            </button>
          )}
        </div>
      </div>

      {/* Minimal Linked Bank Cards */}
      {banks.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {banks.map((item) => (
            <div
              key={item.id}
              className="bg-paper border border-line rounded-2xl p-4 flex items-center justify-between gap-3 shadow-subtle"
            >
              <div className="flex items-center gap-3 min-w-0">
                <span className="w-9 h-9 rounded-xl bg-soft border border-line flex items-center justify-center shrink-0 text-ink">
                  <Icon name="building" size={16} />
                </span>
                <div className="min-w-0">
                  <strong className="text-xs sm:text-sm font-semibold text-ink block truncate">
                    {item.bank}
                  </strong>
                  <span className="text-[11px] text-muted font-mono block">
                    •••• {item.account}
                  </span>
                </div>
              </div>

              <strong className="text-sm font-heading font-bold text-ink font-mono shrink-0">
                {hidden ? "******" : formatCurrencyValue(item.balance, item.currency)}
              </strong>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
