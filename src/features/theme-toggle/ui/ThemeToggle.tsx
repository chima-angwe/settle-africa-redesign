import { Icon } from "@/shared/ui";
import type { Theme } from "@/shared/types";

export interface ThemeToggleProps {
  theme: Theme;
  onToggle: () => void;
  className?: string;
}

export function ThemeToggle({
  theme,
  onToggle,
  className = "",
}: ThemeToggleProps) {
  return (
    <button
      type="button"
      className={`icon-button theme-toggle inline-grid w-[34px] h-[34px] place-items-center border border-line rounded-full bg-transparent text-ink hover:border-line hover:bg-soft transition-colors ${className}`}
      onClick={onToggle}
      aria-label={`Switch to ${theme === "light" ? "dark" : "light"} mode`}
      title={`Switch to ${theme === "light" ? "dark" : "light"} mode`}
    >
      <Icon name={theme === "light" ? "moon" : "sun"} size={17} />
    </button>
  );
}

