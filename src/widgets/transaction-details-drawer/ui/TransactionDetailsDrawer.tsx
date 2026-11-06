import { useState, useEffect } from 'react';
import { Icon } from '@/shared/ui';
import type { Transfer } from '@/entities/transfer';
import { CountryBadge } from '@/entities/country';

export interface TransactionDetailsDrawerProps {
  transfer: Transfer;
  onClose: () => void;
}

export function TransactionDetailsDrawer({
  transfer,
  onClose,
}: {
  transfer: Transfer;
  onClose: () => void;
}) {
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
            className="details-back"
            onClick={onClose}
            aria-label="Close transaction details"
          >
            ←
          </button>
          <div>
            <span className="eyebrow">TRANSFER ACTIVITY</span>
            <h2 id="details-title">Transaction details</h2>
          </div>
          <button className="icon-button" onClick={onClose} aria-label="Close">
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
            <span className={`status status-${transfer.status.toLowerCase()}`}>
              <i />
              {transfer.status}
            </span>
            <small>Sent to {transfer.name}</small>
            <strong>
              {transfer.currency} {transfer.amount.toFixed(2)}
            </strong>
            <span>{transfer.date}</span>
          </div>
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
              <span>
                Exchange rate <i className="demo-pill">DEMO</i>
              </span>
              <strong>
                {hasRate
                  ? `1 ${transfer.currency} = ${(transfer.exchangeRate ?? rate[toCurrency]).toLocaleString(undefined, { maximumFractionDigits: 4 })} ${toCurrency}`
                  : "Rate unavailable in demo"}
              </strong>
            </div>
            <div>
              <span>
                Transfer fee <i className="demo-pill">DEMO</i>
              </span>
              <strong>
                {(transfer.feeAmount ?? 2.99).toFixed(2)}{" "}
                {transfer.feeCurrency || transfer.currency}
              </strong>
            </div>
            <div className="detail-total">
              <span>Estimated recipient gets</span>
              <strong>
                {hasRate
                  ? `${converted.toLocaleString(undefined, { maximumFractionDigits: 2 })} ${toCurrency}`
                  : "Rate unavailable in demo"}
              </strong>
            </div>
            {transfer.description && (
              <div>
                <span>Description</span>
                <strong>{transfer.description}</strong>
              </div>
            )}
            {transfer.provider && (
              <div>
                <span>
                  {transfer.method === "Mobile money" ||
                  transfer.method === "M-Pesa"
                    ? "Mobile money provider"
                    : "Destination bank"}
                </span>
                <strong>{transfer.provider}</strong>
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
          </section>
          <section className="reference-box">
            <span>TRANSACTION REFERENCE</span>
            <button onClick={copyReference}>
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
          <p className="details-disclaimer">
            Demo transaction details. Rates, fees, statuses, and delivery
            information are simulated.
          </p>
          <button
            className="report-issue"
            onClick={() =>
              setNotice(
                "Issue reporting will be available when the support workflow is connected.",
              )
            }
          >
            <Icon name="search" size={15} /> Report an issue
          </button>
        </div>
        <footer className="details-footer">
          <button
            className="button button-primary"
            onClick={() =>
              setNotice(
                "Receipt sharing will be available when connected to the transfer service.",
              )
            }
          >
            <Icon name="copy" size={15} /> Share receipt
          </button>
        </footer>
      </aside>
    </div>
  );
}
