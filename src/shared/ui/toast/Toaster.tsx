import { useSyncExternalStore } from "react";
import { Icon } from "@/shared/ui/icon";
import {
  getToastSnapshot,
  subscribeToasts,
  toast,
  type ToastVariant,
} from "./toast-store";

const VARIANT_STYLES: Record<
  ToastVariant,
  {
    accent: string;
    badge: string;
    icon: string;
  }
> = {
  success: {
    accent: "border-l-emerald-500",
    badge:
      "bg-emerald-500/12 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400",
    icon: "check",
  },
  error: {
    accent: "border-l-rose-500",
    badge:
      "bg-rose-500/12 text-rose-600 dark:bg-rose-500/20 dark:text-rose-400",
    icon: "close",
  },
  info: {
    accent: "border-l-ink",
    badge: "bg-soft text-ink",
    icon: "bell",
  },
};

export function Toaster() {
  const items = useSyncExternalStore(
    subscribeToasts,
    getToastSnapshot,
    getToastSnapshot,
  );

  if (items.length === 0) {
    return null;
  }

  return (
    <div
      className="fixed top-4 right-4 z-[9999] flex flex-col gap-2.5 w-[min(370px,calc(100vw-2rem))] pointer-events-none"
      aria-live="polite"
      aria-relevant="additions removals"
    >
      {items.map((item) => {
        const style = VARIANT_STYLES[item.variant];
        return (
          <div
            key={item.id}
            role={item.variant === "error" ? "alert" : "status"}
            className={`toast-item pointer-events-auto flex items-start gap-3 rounded-xl border border-line border-l-4 ${style.accent} bg-paper px-3.5 py-3 shadow-lg`}
          >
            <span
              className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-lg ${style.badge}`}
            >
              <Icon name={style.icon} size={14} />
            </span>
            <p className="m-0 flex-1 text-xs leading-relaxed font-medium text-ink break-words">
              {item.message}
            </p>
            <button
              type="button"
              onClick={() => toast.dismiss(item.id)}
              aria-label="Dismiss notification"
              className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-lg text-muted hover:bg-soft hover:text-ink transition-colors cursor-pointer"
            >
              <Icon name="close" size={13} />
            </button>
          </div>
        );
      })}
    </div>
  );
}
