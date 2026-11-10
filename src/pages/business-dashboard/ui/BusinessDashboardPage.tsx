import { useState, useEffect } from "react";
import { StatCard, QuickAction } from "@/shared/ui";
import { RateMarquee } from "@/widgets/rate-marquee";
import { TransferTable } from "@/widgets/transfer-table";
import {
  BUSINESS_APPROVAL_REQUESTS,
  loadApprovedIds,
  type Transfer,
} from "@/entities/transfer";
import type { Page } from "@/shared/types";

export interface BusinessDashboardPageProps {
  businessName: string;
  transfers: Transfer[];
  setPage: (page: Page) => void;
  onSelectTransfer: (transfer: Transfer) => void;
}

export function BusinessDashboardPage({
  businessName,
  transfers,
  setPage,
  onSelectTransfer,
}: BusinessDashboardPageProps) {
  const [approved, setApproved] = useState<string[]>(() => loadApprovedIds());

  useEffect(() => {
    const sync = () => setApproved(loadApprovedIds());
    window.addEventListener("settle-approvals-updated", sync);
    return () => window.removeEventListener("settle-approvals-updated", sync);
  }, []);

  const totalUsd = transfers.reduce(
    (sum, item) =>
      sum +
      (item.usdAmount ??
        (item.currency === "GBP"
          ? item.amount * 1.27
          : item.currency === "EUR"
            ? item.amount * 1.08
            : item.currency === "NGN"
              ? item.amount / 1550
              : item.amount)),
    0,
  );

  const pendingApprovals = BUSINESS_APPROVAL_REQUESTS.filter(
    (item) => !approved.includes(item.id),
  ).length;

  return (
    <>
      <div className="page-heading dashboard-heading flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-6">
        <h1 className="my-0 text-ink font-heading font-bold text-[clamp(24px,3vw,32px)] leading-[1.15] tracking-[-1px]">
          {businessName}
        </h1>
      </div>

      {/* Two Prominent Quick Action Buttons */}
      <div className="grid grid-cols-2 gap-3 mb-6">
        <QuickAction
          icon="send"
          title="New payment"
          variant="primary"
          onClick={() => setPage("Send money")}
        />
        <QuickAction
          icon="upload"
          title="Bulk transfer"
          variant="secondary"
          onClick={() => setPage("Bulk transfer")}
        />
      </div>

      <div className="stat-grid business-stat-grid grid grid-cols-2 lg:grid-cols-4 gap-0 border border-line bg-paper rounded-2xl overflow-hidden">
        <StatCard
          label="Monthly transfer limit"
          value="₦25,000,000"
          icon="card"
        />
        <StatCard
          label="Sent this month"
          value={`$${totalUsd.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
          icon="send"
        />
        <StatCard
          label="Needs approval"
          value={String(pendingApprovals)}
          icon="clock"
        />
        <StatCard
          label="Team members"
          value="4 members"
          icon="users"
        />
      </div>

      <RateMarquee />

      <section className="content-section activity-section mt-8">
        <div className="section-heading flex items-center justify-between mb-3">
          <h2 className="my-0 font-heading font-bold text-sm tracking-[-0.3px] text-ink">
            Recent business payments
          </h2>
          <button
            type="button"
            className="link-button text-ink font-bold text-[10px] hover:underline cursor-pointer"
            onClick={() => setPage("Transactions")}
          >
            View all <span>→</span>
          </button>
        </div>
        <TransferTable
          transfers={transfers.slice(0, 3)}
          onSelect={onSelectTransfer}
        />
      </section>
    </>
  );
}
