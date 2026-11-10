import { useState, useMemo } from "react";
import { Icon, PageHeading } from "@/shared/ui";
import { TransferTable } from "@/widgets/transfer-table";
import type { Transfer } from "@/entities/transfer";

export interface TransactionsPageProps {
  transfers: Transfer[];
  query: string;
  setQuery: (q: string) => void;
  onSelectTransfer: (transfer: Transfer) => void;
}

export function TransactionsPage({
  transfers,
  query,
  setQuery,
  onSelectTransfer,
}: TransactionsPageProps) {
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
        const searchTarget = `${item.name} ${item.id} ${item.country} ${item.provider || ""} ${item.description || ""}`.toLowerCase();
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
          <div className="relative flex items-center">
            <Icon
              name="calendar"
              size={15}
              className="pointer-events-none absolute left-3.5 text-muted"
            />
            <select
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="h-11 pl-9 pr-9 border border-line rounded-xl bg-paper text-ink text-xs font-medium outline-none cursor-pointer hover:border-ink/40 transition-colors"
              aria-label="Filter by date"
            >
              <option value="all">Filter by date</option>
              <option value="today">Today</option>
              <option value="7d">Last 7 days</option>
              <option value="30d">Last 30 days</option>
            </select>
          </div>

          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="h-11 pl-3.5 pr-9 border border-line rounded-xl bg-paper text-ink text-xs font-medium outline-none cursor-pointer hover:border-ink/40 transition-colors"
            aria-label="Filter by type"
          >
            <option value="All types">All types</option>
            <option value="Bank transfer">Bank transfer</option>
            <option value="Mobile money">Mobile money</option>
            <option value="Card">Card</option>
          </select>

          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="h-11 pl-3.5 pr-9 border border-line rounded-xl bg-paper text-ink text-xs font-medium outline-none cursor-pointer hover:border-ink/40 transition-colors"
            aria-label="Filter by status"
          >
            <option value="All statuses">All statuses</option>
            <option value="Pending">Pending</option>
            <option value="Processing">Processing</option>
            <option value="Completed">Completed</option>
          </select>
        </div>
      </div>

      {/* Transactions Card / Empty State */}
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
    </>
  );
}
