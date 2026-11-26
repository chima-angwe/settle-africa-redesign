import { StatCard, QuickAction } from "@/shared/ui";
import { getErrorMessage } from "@/shared/api";
import {
  formatDashboardCurrency,
  useDashboardCentral,
} from "@/features/dashboard";
import { RateMarquee } from "@/widgets/rate-marquee";
import { TransferTable } from "@/widgets/transfer-table";
import {
  DashboardErrorState,
  DashboardStatsSkeleton,
} from "@/widgets/dashboard-overview";
import type { Transfer } from "@/entities/transfer";
import type { Page } from "@/shared/types";

export interface DashboardPageProps {
  name: string;
  transfers: Transfer[];
  recipientsCount?: number;
  loadError?: string | null;
  onRetryLoad?: () => void;
  setPage: (page: Page) => void;
  onSelectTransfer: (transfer: Transfer) => void;
}

export function DashboardPage({
  name,
  transfers,
  recipientsCount = 0,
  loadError = null,
  onRetryLoad,
  setPage,
  onSelectTransfer,
}: DashboardPageProps) {
  const {
    data: centralData,
    isLoading: isCentralLoading,
    isError: isCentralError,
    error: centralError,
    refetch: refetchCentral,
  } = useDashboardCentral();

  const firstName = name.split(" ")[0];
  const activeError =
    loadError ||
    (isCentralError
      ? getErrorMessage(centralError, "Unable to load dashboard summary.")
      : null);

  const handleRetry = () => {
    onRetryLoad?.();
    void refetchCentral();
  };

  const inProgressCount = transfers.filter(
    (item) => item.status === "Pending" || item.status === "Processing",
  ).length;
  const failedCount = transfers.filter((item) => item.status === "Failed").length;
  const pendingActionsCount =
    inProgressCount + failedCount + (recipientsCount === 0 ? 1 : 0) + 1;

  const limitDisplay = centralData
    ? formatDashboardCurrency(centralData.limit, centralData.countryId, 0)
    : "—";
  const sentThisWeekDisplay = centralData
    ? formatDashboardCurrency(centralData.thisWeek, centralData.countryId, 2)
    : "—";

  return (
    <>
      <div className="page-heading dashboard-heading flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-6">
        <h1 className="my-0 text-ink font-heading font-bold text-[clamp(24px,3vw,32px)] leading-[1.15] tracking-[-1px]">
          Good morning, {firstName}
        </h1>
      </div>

      {activeError && (
        <DashboardErrorState message={activeError} onRetry={handleRetry} />
      )}

      {/* Minimal Metric Grid */}
      {isCentralLoading ? (
        <DashboardStatsSkeleton />
      ) : (
        <div className="stat-grid grid grid-cols-2 lg:grid-cols-4 gap-0 border border-line bg-paper rounded-2xl overflow-hidden">
          <StatCard
            label="Transfer limit"
            value={limitDisplay}
            icon="card"
          />
          <StatCard
            label="Sent this week"
            value={sentThisWeekDisplay}
            icon="send"
          />
          <StatCard
            label="In progress"
            value={`${inProgressCount} ${inProgressCount === 1 ? "transfer" : "transfers"}`}
            icon="clock"
          />
          <StatCard
            label="Pending actions"
            value={`${pendingActionsCount} ${pendingActionsCount === 1 ? "action" : "actions"}`}
            icon="shield"
            onClick={() => setPage("Notifications")}
          />
        </div>
      )}

      {/* Entry Points: Send Money, Manage Recipients, Wallet */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6">
        <QuickAction
          icon="send"
          title="Send money"
          variant="primary"
          onClick={() => setPage("Send money")}
        />
        <QuickAction
          icon="users"
          title="Manage recipients"
          variant="secondary"
          onClick={() => setPage("Recipients")}
        />
        <QuickAction
          icon="wallet"
          title="Wallet"
          variant="secondary"
          onClick={() => setPage("Wallet")}
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
          emptyTitle="No transfers yet"
          emptySubtitle="Start a local or cross-border transfer to see your recent activity here."
          emptyAction={
            <button
              type="button"
              className="button button-primary button-small px-4 py-2 text-xs font-semibold rounded-xl cursor-pointer"
              onClick={() => setPage("Send money")}
            >
              Send money
            </button>
          }
        />
      </section>
    </>
  );
}
