import type React from 'react';
import { useState } from 'react';
import { Icon, PageHeading } from '@/shared/ui';
import type { Transfer } from '@/entities/transfer';

export interface TrackProps {
  transfers: Transfer[];
}

export function Track({ transfers }: { transfers: Transfer[] }) {
  const [reference, setReference] = useState("");
  const [result, setResult] = useState<Transfer | null | undefined>(undefined);
  const [error, setError] = useState("");
  const lookup = (event: React.FormEvent) => {
    event.preventDefault();
    setError("");
    const found = transfers.find(
      (item) => item.id.toLowerCase() === reference.trim().toLowerCase(),
    );
    setResult(found || null);
    if (!reference.trim()) setError("Enter a transfer reference to search.");
  };
  const completed = result?.status === "Completed";
  const processing = result?.status === "Processing";
  return (
    <>
      <PageHeading
        eyebrow="TRANSFER STATUS"
        title="Track a transfer"
        subtitle="Enter a payment reference."
      />
      <section className="track-panel">
        <div className="track-icon">
          <Icon name="search" size={22} />
        </div>
        <form className="track-form" onSubmit={lookup}>
          <label htmlFor="reference">REFERENCE NUMBER</label>
          <div>
            <input
              id="reference"
              value={reference}
              onChange={(e) => setReference(e.target.value)}
              placeholder="e.g. ST-240918"
            />
            <button className="button button-primary" type="submit">
              Track transfer <span>→</span>
            </button>
          </div>
          {error && <small className="field-error">{error}</small>}
        </form>
        <div className="track-example">
          <span>Demo references</span>
          {transfers.slice(0, 3).map((item) => (
            <button
              key={item.id}
              onClick={() => {
                setReference(item.id);
                setResult(item);
                setError("");
              }}
            >
              {item.id}
            </button>
          ))}
        </div>
      </section>
      {result && result !== null && (
        <section className="track-result">
          <div className="track-result-head">
            <span className={`status status-${result.status.toLowerCase()}`}>
              <i />
              {result.status}
            </span>
            <span>
              Reference <code>{result.id}</code>
            </span>
          </div>
          <h2>
            {result.name} · {result.country}
          </h2>
          <p>
            {result.currency} {result.amount.toFixed(2)} · {result.date}
          </p>
          <div className="timeline">
            <div className="timeline-item complete">
              <span>
                <Icon name="check" size={13} />
              </span>
              <div>
                <strong>Request received</strong>
                <small>Reference created in this demo.</small>
              </div>
            </div>
            <div
              className={`timeline-item ${completed ? "complete" : "current"}`}
            >
              <span>{completed ? <Icon name="check" size={13} /> : <i />}</span>
              <div>
                <strong>
                  {completed
                    ? "Transfer completed"
                    : processing
                      ? "Transfer processing"
                      : "Awaiting processing"}
                </strong>
                <small>
                  {completed
                    ? "Marked complete in this demo."
                    : processing
                      ? "Status is simulated; no payment provider is connected."
                      : "This demo request has not been sent to a payment provider."}
                </small>
              </div>
            </div>
            <div className={`timeline-item ${completed ? "complete" : ""}`}>
              <span>{completed ? <Icon name="check" size={13} /> : <i />}</span>
              <div>
                <strong>Recipient delivery</strong>
                <small>
                  {completed
                    ? "Marked delivered in this demo."
                    : "Delivery updates appear when a provider is connected."}
                </small>
              </div>
            </div>
          </div>
        </section>
      )}
      {result === null && (
        <div className="notice error-notice track-not-found">
          No demo transfer found with that reference. Check the number and try
          again.
        </div>
      )}
    </>
  );
}