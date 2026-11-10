import { Icon } from "../icon";

export interface QuickActionProps {
  icon: string;
  title: string;
  note?: string;
  variant?: "primary" | "secondary";
  onClick: () => void;
}

export function QuickAction({
  icon,
  title,
  variant = "primary",
  onClick,
}: QuickActionProps) {
  const isPrimary = variant === "primary";

  return (
    <button
      type="button"
      onClick={onClick}
      className={`quick-action-btn flex flex-col items-center justify-center gap-2 min-h-[84px] py-4 px-5 rounded-2xl border transition-all cursor-pointer active:scale-[0.99] ${
        isPrimary
          ? "bg-ink text-inverse-text border-ink hover:opacity-90 shadow-subtle"
          : "bg-paper text-ink border-line hover:border-ink hover:bg-soft shadow-subtle"
      }`}
    >
      <span
        className={`inline-grid w-8 h-8 place-items-center rounded-lg ${
          isPrimary ? "bg-white/15 text-inverse-text" : "bg-soft text-ink border border-line"
        }`}
      >
        <Icon name={icon} size={16} />
      </span>
      <strong className="text-xs sm:text-sm font-heading font-bold tracking-tight">
        {title}
      </strong>
    </button>
  );
}
