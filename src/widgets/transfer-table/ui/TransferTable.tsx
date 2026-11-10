import { useState, type ReactNode } from "react";
import { Icon } from "@/shared/ui";
import type { Transfer } from "@/entities/transfer";
import { CountryBadge } from "@/entities/country";

export interface TransferTableProps {
  transfers: Transfer[];
  onSelect: (transfer: Transfer) => void;
  className?: string;
  paginate?: boolean;
  pageSize?: number;
  pageSizeOptions?: number[];
  currentPage?: number;
  onPageChange?: (page: number) => void;
  emptyTitle?: string;
  emptySubtitle?: string;
  emptyAction?: ReactNode;
}

function getPageNumbers(currentPage: number, totalPages: number): (number | string)[] {
  if (totalPages <= 5) {
    return Array.from({ length: totalPages }, (_, i) => i + 1);
  }

  const pages: (number | string)[] = [1];

  if (currentPage > 3) {
    pages.push("ellipsis-start");
  }

  const start = Math.max(2, currentPage - 1);
  const end = Math.min(totalPages - 1, currentPage + 1);

  for (let i = start; i <= end; i++) {
    pages.push(i);
  }

  if (currentPage < totalPages - 2) {
    pages.push("ellipsis-end");
  }

  pages.push(totalPages);
  return pages;
}

export function TransferTable({
  transfers,
  onSelect,
  className = "",
  paginate = false,
  pageSize = 5,
  pageSizeOptions = [5, 10, 20],
  currentPage: controlledPage,
  onPageChange,
  emptyTitle = "No transactions found",
  emptySubtitle,
  emptyAction,
}: TransferTableProps) {
  const [internalPage, setInternalPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(pageSize);

  const [prevTransfers, setPrevTransfers] = useState(transfers);
  if (prevTransfers !== transfers) {
    setPrevTransfers(transfers);
    setInternalPage(1);
  }

  const effectivePageSize = paginate ? rowsPerPage : Math.max(1, transfers.length);
  const totalPages = Math.max(1, Math.ceil(transfers.length / effectivePageSize));

  const rawPage = controlledPage !== undefined ? controlledPage : internalPage;
  const currentPage = Math.min(Math.max(1, rawPage), totalPages);

  const handlePageChange = (newPage: number) => {
    const targetPage = Math.min(Math.max(1, newPage), totalPages);
    if (onPageChange) {
      onPageChange(targetPage);
    } else {
      setInternalPage(targetPage);
    }
  };

  const startIndex = (currentPage - 1) * effectivePageSize;
  const endIndex = Math.min(startIndex + effectivePageSize, transfers.length);
  const displayedTransfers = paginate
    ? transfers.slice(startIndex, endIndex)
    : transfers;

  const pageNumbers = getPageNumbers(currentPage, totalPages);

  if (transfers.length === 0) {
    return (
      <div className={`table-wrap border border-line rounded-2xl bg-paper overflow-hidden shadow-subtle ${className}`}>
        <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
          <span className="inline-grid w-12 h-12 place-items-center rounded-2xl bg-soft text-muted mb-3.5">
            <Icon name="inbox" size={22} />
          </span>
          <h3 className="text-sm font-heading font-bold text-ink m-0">
            {emptyTitle}
          </h3>
          {emptySubtitle && (
            <p className="text-xs text-muted mt-1.5 max-w-xs m-0 leading-relaxed">
              {emptySubtitle}
            </p>
          )}
          {emptyAction && <div className="mt-4">{emptyAction}</div>}
        </div>
      </div>
    );
  }

  return (
    <div className={`table-wrap border border-line rounded-2xl bg-paper overflow-hidden shadow-subtle ${className}`}>
      <div className="overflow-x-auto">
        <table className="transfer-table w-full min-w-[680px] border-collapse text-left">
          <thead className="bg-soft">
            <tr>
              <th className="p-[12px_14px] border-b border-line text-muted text-[7px] font-bold tracking-[1.1px]">RECIPIENT</th>
              <th className="p-[12px_14px] border-b border-line text-muted text-[7px] font-bold tracking-[1.1px]">REFERENCE</th>
              <th className="p-[12px_14px] border-b border-line text-muted text-[7px] font-bold tracking-[1.1px]">DATE</th>
              <th className="p-[12px_14px] border-b border-line text-muted text-[7px] font-bold tracking-[1.1px]">AMOUNT SENT</th>
              <th className="p-[12px_14px] border-b border-line text-muted text-[7px] font-bold tracking-[1.1px]">STATUS</th>
              <th className="p-[12px_14px] border-b border-line w-10" />
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {displayedTransfers.map((transfer) => (
              <tr key={transfer.id} className="hover:bg-soft transition-colors">
                <td className="p-[12px_14px] whitespace-nowrap">
                  <span className="table-recipient flex items-center gap-[9px]">
                    <span className="avatar avatar-soft inline-flex w-8 h-8 flex-none items-center justify-center border border-line rounded-full bg-soft text-ink text-[9px] font-bold">
                      {transfer.name
                        .split(" ")
                        .map((part) => part[0])
                        .slice(0, 2)
                        .join("")}
                    </span>
                    <span className="grid gap-[3px]">
                      <strong className="text-ink text-[9px] font-bold">{transfer.name}</strong>
                      <small>
                        <CountryBadge country={transfer.country} />
                      </small>
                    </span>
                  </span>
                </td>
                <td className="p-[12px_14px] whitespace-nowrap">
                  <code className="text-muted font-mono text-[8px] bg-soft px-1 py-0.5 rounded">{transfer.id}</code>
                </td>
                <td className="p-[12px_14px] text-muted text-[9px] whitespace-nowrap">{transfer.date}</td>
                <td className="p-[12px_14px] whitespace-nowrap">
                  <strong className="text-ink text-[9px] font-bold">
                    {transfer.currency} {transfer.amount.toFixed(2)}
                  </strong>
                </td>
                <td className="p-[12px_14px] whitespace-nowrap">
                  <span
                    className={`status inline-flex items-center gap-1.5 px-[7px] py-1 border border-line rounded-[2px] text-ink text-[8px] font-semibold status-${transfer.status.toLowerCase()}`}
                  >
                    <i className={`w-1.5 h-1.5 rounded-full ${transfer.status === "Completed" ? "bg-emerald-600 dark:bg-emerald-400" : transfer.status === "Processing" ? "bg-amber-600 dark:bg-amber-400" : "bg-muted"}`} />
                    {transfer.status}
                  </span>
                </td>
                <td className="p-[12px_14px] text-right whitespace-nowrap">
                  <button
                    type="button"
                    className="row-arrow inline-grid w-[27px] h-[27px] place-items-center border border-transparent hover:border-line rounded text-ink transition-colors cursor-pointer"
                    onClick={() => onSelect(transfer)}
                    aria-label={`View ${transfer.id}`}
                  >
                    <Icon name="chevron" size={17} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {paginate && transfers.length > 0 && (
        <div className="table-pagination flex flex-col sm:flex-row items-center justify-between gap-3 p-3.5 border-t border-line bg-paper text-muted text-[9px]">
          <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-start">
            <span>
              Showing <strong className="text-ink font-semibold">{startIndex + 1}</strong>–
              <strong className="text-ink font-semibold">{endIndex}</strong> of{" "}
              <strong className="text-ink font-semibold">{transfers.length}</strong> transactions
            </span>
            {pageSizeOptions.length > 1 && (
              <label className="flex items-center gap-1.5 text-[8px]">
                <span className="text-muted">Rows:</span>
                <select
                  value={rowsPerPage}
                  onChange={(e) => {
                    setRowsPerPage(Number(e.target.value));
                    handlePageChange(1);
                  }}
                  className="h-[26px] px-2 border border-line bg-soft text-ink text-[8px] font-semibold rounded outline-none cursor-pointer hover:border-ink transition-colors"
                  aria-label="Rows per page"
                >
                  {pageSizeOptions.map((opt) => (
                    <option key={opt} value={opt}>
                      {opt}
                    </option>
                  ))}
                </select>
              </label>
            )}
          </div>

          <div className="flex items-center gap-1.5 w-full sm:w-auto justify-end">
            <button
              type="button"
              disabled={currentPage <= 1}
              onClick={() => handlePageChange(currentPage - 1)}
              className="inline-flex items-center gap-1 h-[28px] px-2.5 border border-line rounded bg-paper text-ink text-[9px] font-bold hover:bg-soft disabled:opacity-30 disabled:pointer-events-none cursor-pointer transition-colors"
              aria-label="Previous page"
            >
              <span className="rotate-180 inline-flex" aria-hidden="true">
                <Icon name="chevron" size={12} />
              </span>
              <span>Prev</span>
            </button>

            <div className="flex items-center gap-1">
              {pageNumbers.map((p, idx) =>
                typeof p === "number" ? (
                  <button
                    key={p}
                    type="button"
                    onClick={() => handlePageChange(p)}
                    className={`min-w-[28px] h-[28px] px-1.5 inline-flex items-center justify-center border text-[9px] font-bold rounded cursor-pointer transition-colors ${
                      currentPage === p
                        ? "border-ink bg-ink text-inverse-text"
                        : "border-line bg-paper text-ink hover:bg-soft"
                    }`}
                    aria-current={currentPage === p ? "page" : undefined}
                    aria-label={`Page ${p}`}
                  >
                    {p}
                  </button>
                ) : (
                  <span key={`ellipsis-${idx}`} className="px-1 text-muted text-[9px]">
                    …
                  </span>
                )
              )}
            </div>

            <button
              type="button"
              disabled={currentPage >= totalPages}
              onClick={() => handlePageChange(currentPage + 1)}
              className="inline-flex items-center gap-1 h-[28px] px-2.5 border border-line rounded bg-paper text-ink text-[9px] font-bold hover:bg-soft disabled:opacity-30 disabled:pointer-events-none cursor-pointer transition-colors"
              aria-label="Next page"
            >
              <span>Next</span>
              <span className="inline-flex" aria-hidden="true">
                <Icon name="chevron" size={12} />
              </span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
