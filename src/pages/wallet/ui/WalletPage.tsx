import { useState, useEffect, useRef } from "react";
import type { Page } from "@/shared/types";
import {
  loadLinkedBankBalances,
  LocalBankBalanceSummary,
  AirtimePurchaseCard,
  type LinkedBankBalance,
} from "@/features/wallet";

export interface WalletPageProps {
  country: string;
  setPage: (page: Page) => void;
}

export function WalletPage({ country, setPage }: WalletPageProps) {
  const [banks, setBanks] = useState<LinkedBankBalance[]>(() =>
    loadLinkedBankBalances(country)
  );

  const airtimeSectionRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleWalletUpdate = () => {
      setBanks(loadLinkedBankBalances(country));
    };

    window.addEventListener("settle-wallet-updated", handleWalletUpdate);
    return () => {
      window.removeEventListener("settle-wallet-updated", handleWalletUpdate);
    };
  }, [country]);

  const scrollToAirtime = () => {
    airtimeSectionRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <div className="max-w-4xl mx-auto py-2 sm:py-6 px-4 space-y-6">
      {/* Local Bank Wallet Summary & Connected Banks */}
      <section>
        <LocalBankBalanceSummary
          banks={banks}
          onBuyAirtimeClick={scrollToAirtime}
          onLinkBankClick={() => setPage("Linked banks")}
        />
      </section>

      {/* Airtime Purchase Flow */}
      <section ref={airtimeSectionRef}>
        <AirtimePurchaseCard
          country={country}
          banks={banks}
          onLinkBankClick={() => setPage("Linked banks")}
          onBack={() => setPage("Dashboard")}
        />
      </section>
    </div>
  );
}
