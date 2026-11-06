import { Icon } from "@/shared/ui";
import type { Transfer } from "@/entities/transfer";
import { CountryBadge } from "@/entities/country";

export interface TransferTableProps {
  transfers: Transfer[];
  onSelect: (transfer: Transfer) => void;
  className?: string;
}

export function TransferTable({
  transfers,
  onSelect,
  className = "",
}: TransferTableProps) {
  return (
    <div className={`table-wrap overflow-x-auto border border-line bg-paper ${className}`}>
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
          {transfers.map((transfer) => (
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
  );
}

