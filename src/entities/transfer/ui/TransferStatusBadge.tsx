import type { TransferStatus } from "../model/types";

export function TransferStatusBadge({ status }: { status: TransferStatus | string }) {
  const dotColor =
    status === "Completed"
      ? "bg-emerald-600 dark:bg-emerald-400"
      : status === "Processing"
        ? "bg-amber-600 dark:bg-amber-400"
        : "bg-muted";

  return (
    <span className="status inline-flex items-center gap-1.5 px-[7px] py-1 border border-line rounded-[2px] text-ink text-[8px] font-semibold tracking-wide">
      <i className={`w-1.5 h-1.5 rounded-full ${dotColor}`} />
      <span>{status}</span>
    </span>
  );
}

