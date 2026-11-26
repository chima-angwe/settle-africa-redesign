import { Icon } from "@/shared/ui";

export function DashboardStatsSkeleton() {
  return (
    <div
      className="stat-grid grid grid-cols-2 lg:grid-cols-4 gap-0 border border-line bg-paper rounded-2xl overflow-hidden animate-pulse"
      aria-busy="true"
      aria-label="Loading dashboard metrics"
    >
      {[0, 1, 2, 3].map((idx) => (
        <div
          key={idx}
          className="stat-card flex flex-col justify-between p-4 sm:p-5 border-r border-line last:border-r-0 min-h-[104px]"
        >
          <div className="flex w-full items-center justify-between gap-2 mb-3">
            <span className="h-3 w-20 rounded bg-soft" />
            <span className="w-8 h-8 rounded-lg bg-soft" />
          </div>
          <span className="h-6 w-24 rounded bg-soft" />
        </div>
      ))}
    </div>
  );
}

export function DashboardListSkeleton({ rows = 3 }: { rows?: number }) {
  return (
    <div
      className="border border-line rounded-2xl bg-paper overflow-hidden shadow-subtle divide-y divide-line animate-pulse"
      aria-busy="true"
    >
      {Array.from({ length: rows }, (_, idx) => (
        <div
          key={idx}
          className="p-4 flex items-center justify-between gap-4"
        >
          <div className="flex items-center gap-3 min-w-0">
            <span className="w-8 h-8 rounded-full bg-soft shrink-0" />
            <div className="space-y-2">
              <span className="block h-3 w-32 rounded bg-soft" />
              <span className="block h-2.5 w-20 rounded bg-soft" />
            </div>
          </div>
          <span className="h-6 w-16 rounded bg-soft shrink-0" />
        </div>
      ))}
    </div>
  );
}

export function DashboardErrorState({
  title = "Unable to load overview data",
  message,
  onRetry,
}: {
  title?: string;
  message: string;
  onRetry: () => void;
}) {
  return (
    <div
      role="alert"
      className="border border-line rounded-2xl bg-paper p-5 shadow-subtle flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6"
    >
      <div className="flex items-start gap-3">
        <span className="w-9 h-9 rounded-xl bg-rose-500/10 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0">
          <Icon name="close" size={16} />
        </span>
        <div>
          <strong className="text-xs sm:text-sm font-heading font-bold text-ink block">
            {title}
          </strong>
          <span className="text-xs text-muted block mt-0.5">{message}</span>
        </div>
      </div>
      <button
        type="button"
        onClick={onRetry}
        className="button button-secondary h-9 px-4 rounded-xl text-xs font-semibold shrink-0 cursor-pointer"
      >
        Try again
      </button>
    </div>
  );
}
