import { StatCard, QuickAction } from "@/shared/ui";
import { RateMarquee } from "@/widgets/rate-marquee";
import { TransferTable } from "@/widgets/transfer-table";
import type { Transfer } from "@/entities/transfer";
import type { Page } from "@/shared/types";

export interface DashboardPageProps {
  name: string;
  transfers: Transfer[];
  setPage: (page: Page) => void;
  onSelectTransfer: (transfer: Transfer) => void;
}

export function DashboardPage({
  name,
  transfers,
  setPage,
  onSelectTransfer,
}: DashboardPageProps) {
  const firstName = name.split(" ")[0];

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
  const inProgressCount = transfers.filter(
    (item) => item.status === "Pending" || item.status === "Processing",
  ).length;

  return (
    <>
      <div className="page-heading dashboard-heading flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-6">
        <h1 className="my-0 text-ink font-heading font-bold text-[clamp(24px,3vw,32px)] leading-[1.15] tracking-[-1px]">
          Good morning, {firstName}
        </h1>
      </div>

      {/* Two Prominent Quick Action Buttons */}
      <div className="grid grid-cols-2 gap-3 mb-6">
        <QuickAction
          icon="send"
          title="Send money"
          variant="primary"
          onClick={() => setPage("Send money")}
        />
        <QuickAction
          icon="wallet"
          title="Wallet"
          variant="secondary"
          onClick={() => setPage("Wallet")}
        />
      </div>

      {/* Minimal Metric Grid */}
      <div className="stat-grid grid grid-cols-2 lg:grid-cols-4 gap-0 border border-line bg-paper rounded-2xl overflow-hidden">
        <StatCard
          label="Transfer limit"
          value="₦1,000,000"
          icon="card"
        />
        <StatCard
          label="Sent this month"
          value={`$${totalUsd.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
          icon="send"
        />
        <StatCard
          label="In progress"
          value={`${inProgressCount} ${inProgressCount === 1 ? "transfer" : "transfers"}`}
          icon="clock"
        />
        <StatCard
          label="Account status"
          value="Unverified"
          icon="shield"
        />
      </div>

      <RateMarquee />

      <section className="content-section activity-section mt-8">
        <div className="section-heading flex items-center justify-between mb-3">
          <h2 className="my-0 font-heading font-bold text-sm tracking-[-0.3px] text-ink">
            Recent activity
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
