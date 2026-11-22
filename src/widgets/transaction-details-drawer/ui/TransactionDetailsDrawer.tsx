import { useState, useEffect } from "react";
import { Icon } from "@/shared/ui";
import { downloadTransferReceipt } from "@/shared/lib";
import { TransferStatusBadge, type Transfer } from "@/entities/transfer";
import { CountryBadge } from "@/entities/country";

export interface TransactionDetailsDrawerProps {
  transfer: Transfer;
  onClose: () => void;
  onContactSupport?: (transfer: Transfer) => void;
  onCancelTransfer?: (transfer: Transfer) => void;
  onRetryTransfer?: (transfer: Transfer) => void;
}

export function TransactionDetailsDrawer({
  transfer,
  onClose,
  onContactSupport,
  onCancelTransfer,
  onRetryTransfer,
}: TransactionDetailsDrawerProps) {
  const [notice, setNotice] = useState("");
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [onClose]);

  const currency: Record<string, string> = {
    Nigeria: "NGN",
    Ghana: "GHS",
    Kenya: "KES",
    Uganda: "UGX",
    Tanzania: "TZS",
    Rwanda: "RWF",
    Egypt: "EGP",
  };
  const rate: Record<string, number> = {
    NGN: 1550,
    GHS: 15.2,
    KES: 129,
    UGX: 3720,
    TZS: 2670,
    RWF: 1370,
    EGP: 48.5,
  };
  const toCurrency =
    transfer.recipientCurrency || currency[transfer.country] || "NGN";
  const hasRate =
    transfer.recipientAmount !== undefined || rate[toCurrency] !== undefined;
  const converted =
    transfer.recipientAmount ??
    (transfer.usdAmount ?? transfer.amount) * (rate[toCurrency] || 0);

  const isCompleted = transfer.status === "Completed";
  const isProcessing = transfer.status === "Processing";
  const isPending = transfer.status === "Pending";
  const isFailed = transfer.status === "Failed";
  const isCancelled = transfer.status === "Cancelled";

  const explanation = isFailed
    ? transfer.failureReason ||
      "Partner clearing rail timed out or declined the authorization. Your account was not charged."
    : isCancelled
      ? transfer.cancellationReason ||
        "This transfer was cancelled before settlement. Any held funds have been released."
      : "";

  const providerLabel =
    transfer.method === "Airtime top-up" || transfer.method === "Data top-up"
      ? "Operator & source"
      : transfer.method === "Cash pickup"
        ? "Pickup network"
        : transfer.method === "Mobile money" || transfer.method === "M-Pesa"
          ? "Mobile money provider"
          : "Destination bank";

  const timelineSteps = [
    {
      label: "Transfer initiated",
      detail: transfer.date,
      state: "complete" as const,
    },
    {
      label: "Payment & compliance check",
      detail: isPending ? "Scheduled for release" : "Mandate authorized",
      state: isPending ? ("current" as const) : ("complete" as const),
    },
    {
      label: isFailed
        ? "Corridor clearing failed"
        : isCancelled
          ? "Transfer cancelled"
          : "Corridor clearing",
      detail: isFailed
        ? explanation
        : isCancelled
          ? explanation
          : isCompleted
            ? "Settled on partner rail"
            : isProcessing
              ? "In progress on clearing rail"
              : "Queued for scheduled release",
      state: isCompleted
        ? ("complete" as const)
        : isProcessing
          ? ("current" as const)
          : isFailed || isCancelled
            ? ("failed" as const)
            : ("upcoming" as const),
    },
    {
      label:
        transfer.method === "Cash pickup"
          ? "Ready for cash pickup"
          : "Recipient delivery",
      detail: isCompleted
        ? transfer.pickupCode
          ? `Pickup code ${transfer.pickupCode}`
          : "Delivered to recipient"
        : isFailed || isCancelled
          ? "Payout not completed"
          : "Awaiting clearing",
      state: isCompleted ? ("complete" as const) : ("upcoming" as const),
    },
  ];

  const copyReference = async () => {
    try {
      await navigator.clipboard.writeText(transfer.id);
      setNotice("Reference copied.");
    } catch {
      setNotice(`Reference: ${transfer.id}`);
    }
  };

  return (
    <div
      className="details-backdrop"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <aside
        className="details-drawer"
        role="dialog"
        aria-modal="true"
        aria-labelledby="details-title"
      >
        <header className="details-header">
          <button
            type="button"
            className="details-back"
            onClick={onClose}
            aria-label="Close transaction details"
          >
            ←
          </button>
          <div>
            <h2 id="details-title">Transaction details</h2>
          </div>
          <button type="button" className="icon-button" onClick={onClose} aria-label="Close">
            <Icon name="close" />
          </button>
        </header>
        <div className="details-body">
          <div className="details-recipient">
            <span className="avatar avatar-soft avatar-large">
              {transfer.name
                .split(" ")
                .map((part) => part[0])
                .slice(0, 2)
                .join("")}
            </span>
            <TransferStatusBadge status={transfer.status} />
            <small>Sent to {transfer.name}</small>
            <strong>
              {transfer.currency} {transfer.amount.toFixed(2)}
            </strong>
            <span>{transfer.date}</span>
          </div>

          {(isFailed || isCancelled) && (
            <div
              className="notice error-notice flex flex-col items-start gap-2 text-xs"
              role="alert"
            >
              <strong className="font-semibold">
                {isFailed ? "Why this transfer failed" : "Why this transfer was cancelled"}
              </strong>
              <span>{explanation}</span>
              <span className="text-[11px] opacity-90">
                Next steps: Retry with the same details, edit recipient information, or contact support with reference {transfer.id}.
              </span>
            </div>
          )}

          <section className="detail-box">
            <h3>
              <span className="detail-box-icon">
                <Icon name="card" size={15} />
              </span>
              TRANSFER BREAKDOWN
            </h3>
            <div>
              <span>You sent</span>
              <strong>
                {transfer.currency} {transfer.amount.toFixed(2)}
              </strong>
            </div>
            <div>
              <span>Exchange rate</span>
              <strong>
                {hasRate
                  ? `1 ${transfer.currency} = ${(transfer.exchangeRate ?? rate[toCurrency]).toLocaleString(undefined, { maximumFractionDigits: 4 })} ${toCurrency}`
                  : "Rate unavailable"}
              </strong>
            </div>
            <div>
              <span>Transfer fee</span>
              <strong>
                {(transfer.feeAmount ?? 2.99).toFixed(2)}{" "}
                {transfer.feeCurrency || transfer.currency}
              </strong>
            </div>
            <div className="detail-total">
              <span>Recipient gets</span>
              <strong>
                {hasRate
                  ? `${converted.toLocaleString(undefined, { maximumFractionDigits: 2 })} ${toCurrency}`
                  : "Rate unavailable"}
              </strong>
            </div>
            {transfer.schedule && (
              <div>
                <span>Schedule</span>
                <strong>{transfer.schedule}</strong>
              </div>
            )}
            {transfer.description && (
              <div>
                <span>Description</span>
                <strong>{transfer.description}</strong>
              </div>
            )}
            {transfer.provider && (
              <div>
                <span>{providerLabel}</span>
                <strong>
                  {transfer.provider}
                  {transfer.pickupCity ? ` (${transfer.pickupCity})` : ""}
                </strong>
              </div>
            )}
            {transfer.pickupCode && (
              <div>
                <span>Pickup code</span>
                <strong className="font-mono">{transfer.pickupCode}</strong>
              </div>
            )}
            <div>
              <span>Recipient</span>
              <strong>
                {transfer.name}
                <small>
                  <CountryBadge country={transfer.country} /> ·{" "}
                  {transfer.method || "Bank transfer"}
                </small>
              </strong>
            </div>
            {transfer.deliveryInstructions && (
              <div>
                <span>Delivery instructions</span>
                <strong className="text-right font-normal text-muted max-w-[210px]">
                  {transfer.deliveryInstructions}
                </strong>
              </div>
            )}
          </section>

          <section className="detail-box">
            <h3>
              <span className="detail-box-icon">
                <Icon name="clock" size={15} />
              </span>
              STATUS TIMELINE
            </h3>
            <div className="timeline !mt-1">
              {timelineSteps.map((stepItem) => (
                <div
                  key={stepItem.label}
                  className={`timeline-item !min-h-[44px] ${
                    stepItem.state === "complete"
                      ? "complete"
                      : stepItem.state === "current"
                        ? "current"
                        : ""
                  }`}
                >
                  <span>
                    {stepItem.state === "complete" ? (
                      <Icon name="check" size={12} />
                    ) : stepItem.state === "failed" ? (
                      <Icon name="close" size={11} />
                    ) : (
                      <i />
                    )}
                  </span>
                  <div>
                    <strong>{stepItem.label}</strong>
                    <small>{stepItem.detail}</small>
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section className="reference-box">
            <span>TRANSACTION REFERENCE</span>
            <button type="button" onClick={copyReference}>
              <code>{transfer.id}</code>
              <Icon name="copy" size={15} />
            </button>
          </section>
          {transfer.batchId && (
            <section className="reference-box bulk-reference-box">
              <span>BULK BATCH REFERENCE</span>
              <code>{transfer.batchId}</code>
            </section>
          )}
          {notice && (
            <div className="notice success-notice details-notice">
              <Icon name="check" size={15} />
              {notice}
            </div>
          )}

          {(isFailed || isCancelled) && onRetryTransfer && (
            <button
              type="button"
              className="button button-secondary w-full cursor-pointer"
              onClick={() => onRetryTransfer(transfer)}
            >
              Retry / resend transfer
            </button>
          )}

          {(isPending || isProcessing) && onCancelTransfer && (
            <button
              type="button"
              className="button button-secondary w-full cursor-pointer"
              onClick={() => {
                onCancelTransfer(transfer);
                setNotice("Transfer cancelled.");
              }}
            >
              Cancel transfer
            </button>
          )}

          <button
            type="button"
            className="report-issue"
            onClick={() => {
              if (onContactSupport) {
                onContactSupport(transfer);
              } else {
                setNotice("Issue report logged.");
              }
            }}
          >
            <Icon name="help" size={15} /> Contact support about this transfer
          </button>
        </div>
        <footer className="details-footer">
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              className="button button-secondary cursor-pointer"
              onClick={() => copyReference()}
            >
              <Icon name="copy" size={15} /> Copy ref
            </button>
            <button
              type="button"
              className="button button-primary cursor-pointer"
              onClick={() => {
                downloadTransferReceipt(transfer);
                setNotice("Receipt downloaded.");
              }}
            >
              <Icon name="download" size={15} /> Download receipt
            </button>
          </div>
        </footer>
      </aside>
    </div>
  );
}
