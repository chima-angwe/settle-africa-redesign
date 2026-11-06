import { Icon } from "../icon";

export interface QuickActionProps {
  icon: string;
  title: string;
  note: string;
  onClick: () => void;
}

export function QuickAction({
  icon,
  title,
  note,
  onClick,
}: QuickActionProps) {
  return (
    <button
      type="button"
      className="quick-card flex min-h-[70px] items-center gap-2.5 p-[11px] border border-line rounded-[3px] bg-paper text-ink text-left hover:border-ink transition-colors"
      onClick={onClick}
    >
      <span className="quick-icon inline-grid w-[29px] h-[29px] shrink-0 place-items-center border border-line rounded-full bg-paper text-ink">
        <Icon name={icon} />
      </span>
      <span className="flex flex-1 flex-col gap-1 min-w-0">
        <strong className="text-[9px] font-bold text-ink truncate">{title}</strong>
        <small className="text-muted text-[8px] truncate">{note}</small>
      </span>
      <Icon name="chevron" size={17} className="text-subtle shrink-0" />
    </button>
  );
}

