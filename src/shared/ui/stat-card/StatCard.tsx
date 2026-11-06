import { Icon } from "../icon";

export interface StatCardProps {
  label: string;
  value: string;
  note: string;
  icon: string;
  tag?: string;
}

export function StatCard({
  label,
  value,
  note,
  icon,
  tag,
}: StatCardProps) {
  return (
    <div className="stat-card flex min-h-[127px] flex-col items-start p-4 border-r border-line last:border-r-0 bg-transparent">
      <div className="stat-top flex w-full items-center justify-between mb-[11px]">
        <span className="stat-icon inline-grid w-[29px] h-[29px] place-items-center border border-line rounded-full bg-paper text-ink">
          <Icon name={icon} />
        </span>
        {tag && (
          <span
            className={`stat-tag px-1.5 py-1 border border-line rounded-[2px] text-muted text-[6px] font-bold tracking-[0.8px] ${tag === "ACTION NEEDED" ? "tag-warn text-ink border-ink" : ""}`}
          >
            {tag}
          </span>
        )}
      </div>
      <span className="stat-label text-muted text-[9px]">{label}</span>
      <strong className="stat-value mt-1 font-heading font-bold text-base tracking-[-0.4px] text-ink">{value}</strong>
      <span className="stat-note mt-1 text-subtle text-[8px]">{note}</span>
    </div>
  );
}

