import { useState, useEffect } from "react";
import { Icon, PageHeading } from "@/shared/ui";
import {
  BUSINESS_APPROVAL_REQUESTS,
  loadApprovedIds,
  saveApprovedIds,
  type Transfer,
} from "@/entities/transfer";
import { loadNotificationPreferences } from "@/features/manage-profile/model/notificationPrefs";
import {
  VERIFICATION_UPDATED_EVENT,
  getVerificationStatusMeta,
  loadVerificationRecord,
} from "@/features/manage-profile";
import type { AccountType, Page } from "@/shared/types";

export interface NotificationsPageProps {
  accountType: AccountType;
  transfers?: Transfer[];
  recipientsCount?: number;
  setPage?: (page: Page) => void;
  onSelectTransfer?: (transfer: Transfer) => void;
  onOpenPreferences?: () => void;
  onOpenVerification?: () => void;
}

interface NotificationItem {
  id: string;
  icon: string;
  category: "Verification" | "Payment" | "Transfer";
  required: boolean;
  title: string;
  subtitle: string;
  amount?: string;
  actionLabel?: string;
  onAction?: () => void;
  statusBadge?: string;
}

export function NotificationsPage({
  accountType,
  transfers = [],
  recipientsCount = 0,
  setPage,
  onSelectTransfer,
  onOpenPreferences,
  onOpenVerification,
}: NotificationsPageProps) {
  const [approved, setApproved] = useState<string[]>(() => loadApprovedIds());
  const [prefs, setPrefs] = useState(() => loadNotificationPreferences());
  const [verification, setVerification] = useState(() =>
    loadVerificationRecord(accountType),
  );

  useEffect(() => {
    const syncApprovals = () => setApproved(loadApprovedIds());
    const syncPrefs = () => setPrefs(loadNotificationPreferences());
    const syncVerification = () =>
      setVerification(loadVerificationRecord(accountType));
    syncVerification();
    window.addEventListener("settle-approvals-updated", syncApprovals);
    window.addEventListener("settle-notifications-prefs-updated", syncPrefs);
    window.addEventListener(VERIFICATION_UPDATED_EVENT, syncVerification);
    return () => {
      window.removeEventListener("settle-approvals-updated", syncApprovals);
      window.removeEventListener("settle-notifications-prefs-updated", syncPrefs);
      window.removeEventListener(VERIFICATION_UPDATED_EVENT, syncVerification);
    };
  }, [accountType]);

  const approve = (id: string) => {
    const next = [...new Set([...approved, id])];
    setApproved(next);
    saveApprovedIds(next);
  };

  const twoStepEnabled = localStorage.getItem("settle-demo-two-step") === "true";
  const verificationMeta = getVerificationStatusMeta(
    verification.status,
    accountType,
    verification.outcomeReason,
  );

  // Verification notifications (required service messages)
  const verificationItems: NotificationItem[] = [
    ...(verification.status !== "approved"
      ? [
          {
            id: "verify-kyc",
            icon: "shield",
            category: "Verification" as const,
            required: true,
            title: verificationMeta.title,
            subtitle: verificationMeta.description,
            statusBadge: verificationMeta.badge,
            actionLabel: verificationMeta.ctaLabel,
            onAction: () =>
              onOpenVerification ? onOpenVerification() : setPage?.("Profile"),
          },
        ]
      : []),
    ...(!twoStepEnabled
      ? [
          {
            id: "verify-2fa",
            icon: "shield",
            category: "Verification" as const,
            required: true,
            title: "Two-step verification is off",
            subtitle: "Enable two-step verification in Security settings for account protection",
            actionLabel: "Enable",
            onAction: () => setPage?.("Profile"),
          },
        ]
      : []),
  ];

  // Transfer & payment notifications
  // Required service messages (Failed, Cancelled, Pending, Processing) always show;
  // Optional completion updates respect `prefs.transferUpdates`.
  const transferItems: NotificationItem[] = transfers
    .filter((item) => {
      const isUrgentOrService =
        item.status === "Failed" ||
        item.status === "Cancelled" ||
        item.status === "Pending" ||
        item.status === "Processing";
      return isUrgentOrService || prefs.transferUpdates;
    })
    .slice(0, 8)
    .map((item) => {
      const isTopup =
        item.method === "Airtime top-up" || item.method === "Data top-up";
      const isIssue = item.status === "Failed" || item.status === "Cancelled";
      const title =
        item.status === "Failed"
          ? `Payment failed: ${item.name}`
          : item.status === "Cancelled"
            ? `Transfer cancelled: ${item.name}`
            : item.status === "Completed"
              ? isTopup
                ? `${item.method} completed: ${item.name}`
                : `Transfer completed: ${item.name}`
              : `${item.status} transfer: ${item.name}`;

      return {
        id: `tx-${item.id}`,
        icon: isIssue ? "close" : item.status === "Completed" ? "check" : "clock",
        category: isTopup ? ("Payment" as const) : ("Transfer" as const),
        required: isIssue || item.status === "Pending" || item.status === "Processing",
        title,
        subtitle: `${item.id} · ${item.date}${
          item.failureReason
            ? ` · ${item.failureReason}`
            : item.cancellationReason
              ? ` · ${item.cancellationReason}`
              : ""
        }`,
        amount: `${item.currency} ${item.amount.toFixed(2)}`,
        actionLabel: isIssue ? "Review & retry" : "View details",
        onAction: () => onSelectTransfer?.(item),
      };
    });

  // Business approval items (required service messages)
  const businessApprovalItems: NotificationItem[] =
    accountType === "business"
      ? BUSINESS_APPROVAL_REQUESTS.map((item) => {
          const isApproved = approved.includes(item.id);
          return {
            id: item.id,
            icon: "building",
            category: "Payment" as const,
            required: true,
            title: isApproved ? `Approved: ${item.payee}` : `Approval required: ${item.payee}`,
            subtitle: `${item.detail} · ${item.id}`,
            amount: item.amount,
            actionLabel: isApproved ? undefined : "Approve",
            onAction: isApproved ? undefined : () => approve(item.id),
            statusBadge: isApproved ? "Approved" : undefined,
          };
        })
      : [];

  const recipientSetupItems: NotificationItem[] =
    accountType !== "business" && recipientsCount === 0
      ? [
          {
            id: "add-recipient",
            icon: "users",
            category: "Transfer",
            required: false,
            title: "Add a saved recipient",
            subtitle: "Save bank, mobile money, or cash pickup details",
            actionLabel: "Manage",
            onAction: () => setPage?.("Recipients"),
          },
        ]
      : [];

  const allItems: NotificationItem[] = [
    ...businessApprovalItems,
    ...transferItems,
    ...verificationItems,
    ...recipientSetupItems,
  ];

  return (
    <div className="w-full space-y-6">
      <PageHeading
        title="Notifications"
        action={
          onOpenPreferences ? (
            <button
              type="button"
              onClick={onOpenPreferences}
              className="button button-secondary inline-flex min-h-[38px] items-center justify-center gap-2 px-4 rounded-xl border border-line bg-paper text-ink text-xs font-semibold hover:bg-soft transition-colors cursor-pointer"
            >
              Preferences
            </button>
          ) : undefined
        }
      />

      {allItems.length === 0 ? (
        <div className="w-full border border-line rounded-2xl bg-paper shadow-subtle py-16 px-6 flex flex-col items-center justify-center text-center">
          <span className="inline-grid w-12 h-12 place-items-center rounded-2xl bg-soft text-muted mb-3">
            <Icon name="bell" size={20} />
          </span>
          <h3 className="text-sm font-heading font-bold text-ink m-0">
            No notifications yet
          </h3>
        </div>
      ) : (
        <div className="w-full bg-paper border border-line rounded-2xl overflow-hidden shadow-subtle divide-y divide-line">
          {allItems.map((item) => (
            <div
              key={item.id}
              className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-soft/40 transition-colors"
            >
              <div className="flex items-center gap-3 min-w-0">
                <span className="w-9 h-9 rounded-xl bg-soft border border-line flex items-center justify-center shrink-0 text-ink">
                  <Icon name={item.icon} size={16} />
                </span>
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <strong className="text-xs sm:text-sm font-semibold text-ink truncate">
                      {item.title}
                    </strong>
                    <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-soft border border-line text-muted">
                      {item.category}
                      {item.required ? " · Required" : ""}
                    </span>
                  </div>
                  <span className="text-[11px] text-muted block truncate mt-0.5">
                    {item.subtitle}
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0 pl-12 sm:pl-0">
                {item.amount && (
                  <strong className="text-xs sm:text-sm font-heading font-bold text-ink font-mono">
                    {item.amount}
                  </strong>
                )}

                {item.statusBadge ? (
                  <span className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400 text-xs font-semibold px-2.5 py-1 rounded-lg bg-emerald-500/10">
                    <Icon name="check" size={13} />
                    <span>{item.statusBadge}</span>
                  </span>
                ) : item.actionLabel && item.onAction ? (
                  <button
                    type="button"
                    onClick={item.onAction}
                    className="button button-primary h-8 px-3.5 rounded-lg text-xs font-semibold cursor-pointer"
                  >
                    {item.actionLabel}
                  </button>
                ) : null}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
