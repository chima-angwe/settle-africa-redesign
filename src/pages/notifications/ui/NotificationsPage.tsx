import { useState, useEffect } from "react";
import { Icon, PageHeading } from "@/shared/ui";
import {
  BUSINESS_APPROVAL_REQUESTS,
  loadApprovedIds,
  saveApprovedIds,
} from "@/entities/transfer";
import type { AccountType } from "@/shared/types";

export interface NotificationsPageProps {
  accountType: AccountType;
}

export function NotificationsPage({ accountType }: NotificationsPageProps) {
  const [approved, setApproved] = useState<string[]>(() => loadApprovedIds());

  useEffect(() => {
    const sync = () => setApproved(loadApprovedIds());
    window.addEventListener("settle-approvals-updated", sync);
    return () => window.removeEventListener("settle-approvals-updated", sync);
  }, []);

  const approve = (id: string) => {
    const next = [...new Set([...approved, id])];
    setApproved(next);
    saveApprovedIds(next);
  };

  if (accountType !== "business") {
    return (
      <div className="max-w-3xl mx-auto py-2 sm:py-6 px-4">
        <PageHeading title="Notifications" />
        <div className="border border-line rounded-2xl bg-paper shadow-subtle py-16 px-6 flex flex-col items-center justify-center text-center">
          <span className="inline-grid w-12 h-12 place-items-center rounded-2xl bg-soft text-muted mb-3">
            <Icon name="bell" size={20} />
          </span>
          <h3 className="text-sm font-heading font-bold text-ink m-0">
            No notifications yet
          </h3>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto py-2 sm:py-6 px-4">
      <PageHeading title="Notifications" />

      <div className="bg-paper border border-line rounded-2xl overflow-hidden shadow-subtle divide-y divide-line">
        {BUSINESS_APPROVAL_REQUESTS.map((item) => {
          const isApproved = approved.includes(item.id);
          return (
            <div
              key={item.id}
              className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-soft/40 transition-colors"
            >
              <div className="flex items-center gap-3 min-w-0">
                <span className="w-9 h-9 rounded-xl bg-soft border border-line flex items-center justify-center shrink-0 text-ink">
                  <Icon name="building" size={16} />
                </span>
                <div className="min-w-0">
                  <strong className="text-xs sm:text-sm font-semibold text-ink block truncate">
                    {item.payee}
                  </strong>
                  <span className="text-[11px] text-muted block truncate">
                    {item.detail} · {item.id}
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0 pl-12 sm:pl-0">
                <strong className="text-xs sm:text-sm font-heading font-bold text-ink font-mono">
                  {item.amount}
                </strong>

                {isApproved ? (
                  <span className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400 text-xs font-semibold px-2.5 py-1 rounded-lg bg-emerald-500/10">
                    <Icon name="check" size={13} />
                    <span>Approved</span>
                  </span>
                ) : (
                  <button
                    type="button"
                    onClick={() => approve(item.id)}
                    className="button button-primary h-8 px-3.5 rounded-lg text-xs font-semibold cursor-pointer"
                  >
                    Approve
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

