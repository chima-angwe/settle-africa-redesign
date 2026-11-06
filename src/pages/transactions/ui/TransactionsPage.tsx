import { useState } from "react";
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
  const filtered = transfers.filter(
    (item) =>
      `${item.name} ${item.id} ${item.country}`
        .toLowerCase()
        .includes(query.toLowerCase()) &&
      (status === "All statuses" || item.status === status),
  );
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
  const clearFilters = () => {
    setQuery("");
    setStatus("All statuses");
  };

  return (
    <>
      <PageHeading
        eyebrow="MONEY IN MOTION"
        title="Transactions"
        subtitle=""
        action={
          <button
            type="button"
            className="button button-secondary inline-flex min-h-[42px] items-center justify-center gap-2 px-4 rounded border border-line bg-paper text-ink text-[10px] font-bold hover:bg-soft transition-colors cursor-pointer"
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
              link.download = "settle-transactions-demo.csv";
              link.click();
              URL.revokeObjectURL(url);
            }}
          >
            <Icon name="download" size={17} /> Export
          </button>
        }
      />
      <div className="transaction-stats grid grid-cols-2 md:grid-cols-4 my-5 border border-line bg-paper">
        <div className="grid gap-1.5 p-3.5 border-r border-line">
          <small className="text-muted text-[7px] font-bold tracking-[1px] uppercase">TRANSFERRED</small>
          <strong className="font-heading font-bold text-base text-ink">
            ${totalUsd.toLocaleString(undefined, { maximumFractionDigits: 2 })}
            <span className="text-muted text-[9px] font-normal"> USD</span>
          </strong>
        </div>
        <div className="grid gap-1.5 p-3.5 border-r border-line">
          <small className="text-muted text-[7px] font-bold tracking-[1px] uppercase">TRANSFERS</small>
          <strong className="font-heading font-bold text-base text-ink">{transfers.length}</strong>
        </div>
        <div className="grid gap-1.5 p-3.5 border-r border-line">
          <small className="text-muted text-[7px] font-bold tracking-[1px] uppercase">RECIPIENTS</small>
          <strong className="font-heading font-bold text-base text-ink">{new Set(transfers.map((item) => item.name)).size}</strong>
        </div>
        <div className="grid gap-1.5 p-3.5">
          <small className="text-muted text-[7px] font-bold tracking-[1px] uppercase">IN PROGRESS</small>
          <strong className="font-heading font-bold text-base text-ink">
            {
              transfers.filter(
                (item) =>
                  item.status === "Pending" || item.status === "Processing",
              ).length
            }
          </strong>
        </div>
      </div>
      <div className="list-toolbar transaction-toolbar flex flex-wrap items-center gap-2.5 my-4">
        <label className="search-field flex flex-1 min-w-[240px] h-[39px] items-center gap-2 px-2.5 border border-line bg-paper text-muted">
          <Icon name="search" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by name or reference"
            className="w-full h-full bg-transparent border-0 outline-none text-ink text-[9px]"
          />
        </label>
        <select
          className="filter-select h-[39px] px-2.5 border border-line bg-paper text-ink text-[9px]"
          value={status}
          onChange={(e) => setStatus(e.target.value)}
        >
          <option>All statuses</option>
          <option>Pending</option>
          <option>Processing</option>
          <option>Completed</option>
        </select>
        <button
          type="button"
          className="button button-secondary button-small h-[39px] px-3 border border-line rounded bg-paper text-ink text-[9px] font-bold hover:bg-soft transition-colors cursor-pointer"
          onClick={clearFilters}
        >
          Clear filters
        </button>
      </div>
      <div className="table-panel border border-line bg-paper">
        <div className="table-panel-heading flex items-center justify-between p-3.5 border-b border-line">
          <div>
            <h2 className="my-0 font-heading font-bold text-sm tracking-[-0.3px] text-ink">Transfer history</h2>
            <p className="my-0 text-muted text-[9px]">{filtered.length} transactions</p>
          </div>
        </div>
        <TransferTable transfers={filtered} onSelect={onSelectTransfer} />
        {filtered.length === 0 && (
          <div className="table-empty p-8 text-center text-muted text-[9px]">No transactions match your search.</div>
        )}
      </div>
    </>
  );
}

