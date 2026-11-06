import { StatCard, QuickAction } from "@/shared/ui";
import { RateMarquee } from "@/widgets/rate-marquee";
import { TransferCalculator } from "@/widgets/transfer-calculator";
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
  return (
    <>
      <div className="page-heading dashboard-heading flex flex-col sm:flex-row sm:items-end justify-between gap-5 mb-7">
        <div>
          <h1 className="my-[6px] text-ink font-heading font-bold text-[clamp(25px,3vw,35px)] leading-[1.15] tracking-[-1.4px]">Good morning, {firstName}</h1>
        </div>
      </div>
      <div className="stat-grid grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-0 border border-line bg-paper">
        <StatCard
          label="Transfer limit"
          value="₦1,000,000"
          note="Available this month"
          icon="card"
          tag="AVAILABLE"
        />
        <StatCard
          label="Sent this month"
          value="$450.00"
          note="Across 4 transfers"
          icon="send"
        />
        <StatCard
          label="In progress"
          value="1 transfer"
          note="Estimated arrival · Today"
          icon="clock"
        />
        <StatCard
          label="Account status"
          value="Unverified"
          note="Complete verification"
          icon="shield"
          tag="ACTION NEEDED"
        />
      </div>
      <section className="content-section dashboard-quick-section mt-8">
        <div className="section-heading flex items-center justify-between mb-3">
          <div>
            <h2 className="my-0 font-heading font-bold text-sm tracking-[-0.3px] text-ink">Quick actions</h2>
          </div>
        </div>
        <div className="quick-grid grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
          <QuickAction
            icon="send"
            title="Send money"
            note="Start a new transfer"
            onClick={() => setPage("Send money")}
          />
          <QuickAction
            icon="users"
            title="Recipients"
            note="Manage saved people"
            onClick={() => setPage("Recipients")}
          />
          <QuickAction
            icon="clock"
            title="Transactions"
            note="See your transfer history"
            onClick={() => setPage("Transactions")}
          />
          <QuickAction
            icon="search"
            title="Track a transfer"
            note="Follow a payment"
            onClick={() => setPage("Track transaction")}
          />
        </div>
      </section>
      <RateMarquee />
      <TransferCalculator onSend={() => setPage("Send money")} />
      <section className="content-section activity-section mt-8">
        <div className="section-heading flex items-center justify-between mb-3">
          <div>
            <h2 className="my-0 font-heading font-bold text-sm tracking-[-0.3px] text-ink">Recent activity</h2>
            <p className="my-0 text-muted text-[9px]">Your latest money movements.</p>
          </div>
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

