import { useState, useMemo } from "react";
import { CustomSelect, Icon, PageHeading } from "@/shared/ui";
import { getErrorMessage } from "@/shared/api";
import { useTransactions } from "@/features/transactions";
import {
  DashboardErrorState,
  DashboardListSkeleton,
} from "@/widgets/dashboard-overview";
import { TransferTable } from "@/widgets/transfer-table";
import type { Transfer } from "@/entities/transfer";

export interface TransactionsPageProps {
  query: string;
  setQuery: (q: string) => void;
  onSelectTransfer: (transfer: Transfer) => void;
}

export function TransactionsPage({
  query,
  setQuery,
  onSelectTransfer,
}: TransactionsPageProps) {
  const {
    data: transfers = [],
    isLoading,
    isError,
    error,
    refetch,
  } = useTransactions();
  const [status, setStatus] = useState("All statuses");
  const [typeFilter, setTypeFilter] = useState("All types");
  const [dateFilter, setDateFilter] = useState("all");

  const hasActiveFilters =
    Boolean(query.trim()) ||
    status !== "All statuses" ||
    typeFilter !== "All types" ||
    dateFilter !== "all";

  const filtered = useMemo(
    () =>
      transfers.filter((item) => {
        const searchTarget = `${item.name} ${item.id} ${item.country} ${item.provider || ""} ${item.method || ""} ${item.status} ${item.description || ""}`.toLowerCase();
        if (!searchTarget.includes(query.toLowerCase())) return false;
        if (status !== "All statuses" && item.status !== status) return false;
        if (
          typeFilter !== "All types" &&
          (item.method || "Bank transfer").toLowerCase() !== typeFilter.toLowerCase()
        ) {
          return false;
        }
        if (dateFilter === "today") {
          const d = item.date.toLowerCase();
          if (!d.includes("today") && !d.includes("just now")) return false;
        }
        return true;
      }),
    [transfers, query, status, typeFilter, dateFilter],
  );

  const clearFilters = () => {
    setQuery("");
    setStatus("All statuses");
    setTypeFilter("All types");
    setDateFilter("all");
  };

  return (
    <>
      <PageHeading
        title="Transactions"
        action={
          transfers.length > 0 ? (
            <button
              type="button"
              className="button button-secondary inline-flex min-h-[40px] items-center justify-center gap-2 px-4 rounded-xl border border-line bg-paper text-ink text-xs font-semibold hover:bg-soft transition-colors cursor-pointer"
              onClick={() => {
                const csv = [
                  "Reference,Recipient,Country,Amount,Currency,Status,Date",
                  ...transfers.map(
                    (item) =>
                      `${item.id},${item.name},${item.country},${item.amount},${item.currency},${item.status},${item.date}`,
                  ),
                ].join("\n");
                const url = URL.createObjectURL(
                  new Blob([csv], { type: "text/csv" }),
                );
                const link = document.createElement("a");
                link.href = url;
                link.download = "settle-transactions.csv";
                link.click();
                URL.revokeObjectURL(url);
              }}
            >
              <Icon name="download" size={16} /> Export
            </button>
          ) : undefined
        }
      />

      {/* Search & Filter Toolbar */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 mb-5">
        <label className="flex-1 lg:max-w-md h-11 px-3.5 border border-line rounded-xl bg-paper flex items-center gap-2.5 text-muted focus-within:border-ink transition-colors">
          <Icon name="search" size={16} className="shrink-0" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search description, bank, reference..."
            className="w-full h-full bg-transparent border-0 outline-none text-ink text-xs sm:text-sm placeholder:text-muted/70"
          />
        </label>

        <div className="flex flex-wrap items-center gap-2.5 shrink-0">
          <CustomSelect
            value={dateFilter}
            onChange={setDateFilter}
            ariaLabel="Filter by date"
            modalTitle="Filter by date"
            leftIcon={<Icon name="calendar" size={15} className="text-muted" />}
            triggerClassName="h-11 px-3.5 rounded-xl text-xs font-medium min-w-[148px]"
            options={[
              { value: "all", label: "Filter by date" },
              { value: "today", label: "Today" },
              { value: "7d", label: "Last 7 days" },
              { value: "30d", label: "Last 30 days" },
            ]}
          />

          <CustomSelect
            value={typeFilter}
            onChange={setTypeFilter}
            ariaLabel="Filter by type"
            modalTitle="Filter by transfer type"
            triggerClassName="h-11 px-3.5 rounded-xl text-xs font-medium min-w-[132px]"
            options={[
              "All types",
              "Bank transfer",
              "Mobile money",
              "Cash pickup",
              "Airtime top-up",
              "Data top-up",
              "Card",
            ]}
          />

          <CustomSelect
            value={status}
            onChange={setStatus}
            ariaLabel="Filter by status"
            modalTitle="Filter by status"
            triggerClassName="h-11 px-3.5 rounded-xl text-xs font-medium min-w-[132px]"
            options={[
              "All statuses",
              "Pending",
              "Processing",
              "Completed",
              "Failed",
              "Cancelled",
            ]}
          />
        </div>
      </div>

      {/* Transactions Card / Loading / Error / Empty State */}
      {isLoading ? (
        <DashboardListSkeleton rows={5} />
      ) : isError ? (
        <DashboardErrorState
          title="Unable to load transactions"
          message={getErrorMessage(
            error,
            "Could not retrieve transaction history.",
          )}
          onRetry={() => {
            void refetch();
          }}
        />
      ) : (
        <TransferTable
          transfers={filtered}
          onSelect={onSelectTransfer}
          paginate={true}
          pageSize={5}
          emptyTitle="No transactions found"
          emptySubtitle="We couldn't find any transaction matching your current criteria."
          emptyAction={
            hasActiveFilters ? (
              <button
                type="button"
                className="button button-secondary button-small px-4 py-2 text-xs font-semibold rounded-xl cursor-pointer"
                onClick={clearFilters}
              >
                Clear filters
              </button>
            ) : undefined
          }
        />
      )}
    </>
  );
}
