import { Icon } from "../icon";

export interface StatCardProps {
  label: string;
  value: string;
  note?: string;
  icon: string;
  tag?: string;
}

export function StatCard({
  label,
  value,
  icon,
}: StatCardProps) {
  return (
    <div className="stat-card flex flex-col justify-between p-4 sm:p-5 border-r border-line last:border-r-0 bg-transparent min-h-[104px]">
      <div className="flex w-full items-center justify-between gap-2 mb-3">
        <span className="stat-label text-muted text-[11px] font-medium">
          {label}
        </span>
        <span className="stat-icon inline-grid w-8 h-8 place-items-center border border-line rounded-lg bg-soft text-ink shrink-0">
          <Icon name={icon} size={15} />
        </span>
      </div>
      <strong className="stat-value font-heading font-bold text-lg sm:text-xl tracking-[-0.4px] text-ink">
        {value}
      </strong>
    </div>
  );
}
