import type React from "react";
import { useState } from "react";
import { Icon, PageHeading } from "@/shared/ui";
import {
  COUNTRY_CURRENCY_MAP,
  formatCurrencyValue,
  loadLinkedBankBalances,
  saveLinkedBankBalances,
  type LinkedBankBalance,
} from "@/features/wallet";

export interface LinkedBanksProps {
  country: string;
  onNotice: (message: string) => void;
}

export type LinkedAccountItem = LinkedBankBalance;

export function LinkedBanks({ country, onNotice }: LinkedBanksProps) {
  const banksByCountry: Record<string, string[]> = {
    Nigeria: [
      "Access Bank",
      "First Bank of Nigeria",
      "Guaranty Trust Bank (GTBank)",
      "Moniepoint MFB",
      "OPay",
      "United Bank for Africa (UBA)",
      "Zenith Bank",
      "Kuda Bank",
      "Fidelity Bank",
    ],
    Ghana: [
      "Absa Bank Ghana",
      "Ecobank Ghana",
      "Fidelity Bank Ghana",
      "GCB Bank",
      "Stanbic Bank Ghana",
    ],
    Kenya: [
      "Absa Bank Kenya",
      "Co-operative Bank of Kenya",
      "Equity Bank",
      "KCB Bank",
      "Standard Chartered Kenya",
    ],
    "South Africa": [
      "Absa",
      "Capitec Bank",
      "First National Bank (FNB)",
      "Nedbank",
      "Standard Bank",
    ],
    Rwanda: ["Bank of Kigali", "Equity Bank Rwanda", "I&M Bank Rwanda"],
    Uganda: ["Stanbic Bank Uganda", "Centenary Bank", "Absa Bank Uganda"],
    Egypt: ["National Bank of Egypt", "Banque Misr", "CIB Egypt"],
  };

  const availableBanks =
    banksByCountry[country] || banksByCountry.Nigeria;

  const [linked, setLinked] = useState<LinkedAccountItem[]>(() =>
    loadLinkedBankBalances(country)
  );

  const [bank, setBank] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const persistLinked = (items: LinkedAccountItem[]) => {
    setLinked(items);
    saveLinkedBankBalances(items);
  };

  const connect = (event: React.FormEvent) => {
    event.preventDefault();
    const cleanDigits = accountNumber.replace(/\D/g, "");
    if (!bank || cleanDigits.length < 8) return;

    const countryMeta = COUNTRY_CURRENCY_MAP[country] || COUNTRY_CURRENCY_MAP.Nigeria;

    const newAccountItem: LinkedAccountItem = {
      id: `lb-${Date.now()}`,
      bank,
      account: cleanDigits.slice(-4),
      mandateRef: `MND-${Math.floor(10000 + Math.random() * 90000)}-DEB`,
      isDefault: linked.length === 0,
      country,
      balance: 350000,
      currency: countryMeta.code,
    };

    const next = [...linked, newAccountItem];
    persistLinked(next);
    setBank("");
    setAccountNumber("");
    setSuccessMessage(`${bank} linked.`);
    onNotice("Bank account linked.");
    setTimeout(() => setSuccessMessage(""), 3500);
  };

  const makeDefault = (id: string) => {
    const next = linked.map((item) => ({
      ...item,
      isDefault: item.id === id,
    }));
    persistLinked(next);
  };

  const remove = (id: string) => {
    const next = linked.filter((item) => item.id !== id);
    if (next.length > 0 && !next.some((item) => item.isDefault)) {
      next[0].isDefault = true;
    }
    persistLinked(next);
  };

  return (
    <div className="max-w-3xl mx-auto py-2 sm:py-6 px-4">
      <PageHeading title="Linked banks" />

      <div className="space-y-8 mt-4">
        <section className="space-y-3">
          {linked.length > 0 && (
            <h2 className="text-xs font-heading font-bold text-ink uppercase tracking-wider">
              Connected bank accounts ({linked.length})
            </h2>
          )}

          {linked.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {linked.map((item) => (
                <div
                  key={item.id}
                  className="bg-paper border border-line rounded-2xl p-4 sm:p-5 flex flex-col justify-between gap-4 shadow-subtle hover:border-ink/30 transition-colors"
                >
                  <div>
                    <div className="flex items-start justify-between gap-2 mb-3">
                      <div className="flex items-center gap-3 min-w-0">
                        <span className="w-10 h-10 rounded-xl bg-soft border border-line flex items-center justify-center shrink-0 text-ink">
                          <Icon name="building" size={18} />
                        </span>
                        <div className="min-w-0">
                          <strong className="text-sm font-semibold text-ink block truncate">
                            {item.bank}
                          </strong>
                          <span className="text-xs text-muted font-mono block">
                            •••• {item.account}
                          </span>
                        </div>
                      </div>
                      {item.isDefault ? (
                        <span className="text-[10px] font-bold text-ink px-2 py-0.5 rounded-full bg-soft border border-line shrink-0">
                          PRIMARY
                        </span>
                      ) : (
                        <span className="text-[10px] text-muted px-2 py-0.5 rounded-full bg-soft shrink-0">
                          ACTIVE
                        </span>
                      )}
                    </div>

                    <div className="p-3 bg-soft rounded-xl border border-line/60">
                      <span className="text-[10px] font-semibold text-muted uppercase tracking-wider block mb-0.5">
                        Local Balance
                      </span>
                      <span className="text-base font-heading font-bold text-ink font-mono">
                        {formatCurrencyValue(item.balance ?? 350000, item.currency || "NGN")}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-2.5 border-t border-line text-xs">
                    {!item.isDefault ? (
                      <button
                        type="button"
                        className="text-xs font-semibold text-ink hover:underline cursor-pointer"
                        onClick={() => makeDefault(item.id)}
                      >
                        Set as primary
                      </button>
                    ) : (
                      <span className="text-[11px] text-muted flex items-center gap-1 font-medium">
                        <Icon name="check" size={13} className="text-emerald-600 dark:text-emerald-400" />
                        Primary
                      </span>
                    )}
                    <button
                      type="button"
                      className="text-xs text-muted hover:text-rose-600 dark:hover:text-rose-400 transition-colors cursor-pointer"
                      onClick={() => remove(item.id)}
                    >
                      Remove
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="border border-line rounded-2xl bg-paper shadow-subtle py-12 px-6 flex flex-col items-center justify-center text-center">
              <span className="inline-grid w-12 h-12 place-items-center rounded-2xl bg-soft text-muted mb-3">
                <Icon name="building" size={20} />
              </span>
              <h3 className="text-sm font-heading font-bold text-ink m-0">
                No linked account yet
              </h3>
            </div>
          )}
        </section>

        <section className="bg-paper border border-line rounded-2xl p-6 sm:p-7 shadow-subtle space-y-5">
          <h3 className="text-base font-heading font-bold text-ink">
            {linked.length > 0 ? "Link another bank account" : "Link bank account"}
          </h3>

          <form onSubmit={connect} className="space-y-4">
            <div>
              <label className="text-xs font-medium text-muted block mb-1.5">
                Bank name
              </label>
              <select
                required
                value={bank}
                onChange={(e) => setBank(e.target.value)}
                className="w-full h-11 pl-3.5 pr-10 border border-line rounded-xl bg-paper text-ink text-sm outline-none focus:border-ink font-medium cursor-pointer"
              >
                <option value="">Select your bank</option>
                {availableBanks.map((b) => (
                  <option key={b} value={b}>
                    {b}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-xs font-medium text-muted block mb-1.5">
                Account number
              </label>
              <input
                required
                type="text"
                inputMode="numeric"
                maxLength={16}
                value={accountNumber}
                onChange={(e) =>
                  setAccountNumber(e.target.value.replace(/\D/g, "").slice(0, 16))
                }
                placeholder="10-digit account number"
                className="w-full h-11 px-3.5 border border-line rounded-xl bg-paper text-ink font-mono text-sm outline-none focus:border-ink"
              />
            </div>

            {successMessage && (
              <p className="text-xs text-emerald-600 dark:text-emerald-400 font-medium">
                {successMessage}
              </p>
            )}

            <div className="pt-1">
              <button
                type="submit"
                className="button button-primary h-11 px-6 text-sm font-semibold rounded-xl cursor-pointer inline-flex items-center gap-1.5"
                disabled={!bank || accountNumber.replace(/\D/g, "").length < 8}
              >
                <Icon name="plus" size={16} />
                <span>Link bank account</span>
              </button>
            </div>
          </form>
        </section>
      </div>
    </div>
  );
}
