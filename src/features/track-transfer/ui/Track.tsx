import type React from "react";
import { useMemo, useState } from "react";
import { getErrorMessage } from "@/shared/api";
import { Icon, PageHeading } from "@/shared/ui";
import type { Transfer } from "@/entities/transfer";
import { CountrySelect } from "@/entities/country";
import { useLocales } from "@/features/locales";
import { useTransactions } from "@/features/transactions";
import { useTrackTransaction } from "../hooks/useTrackTransaction";
import type { TrackTransactionResult } from "../api/track-transfer.types";

export interface TrackProps {
  transfers: Transfer[];
}

export function Track({ transfers }: TrackProps) {
  const { data: liveTransfers = [] } = useTransactions();
  const { data: locales = [] } = useLocales();
  const trackMutation = useTrackTransaction();

  const knownTransfers = useMemo(() => {
    const byId = new Map<string, Transfer>();
    for (const item of liveTransfers) {
      byId.set(item.id.toLowerCase(), item);
    }
    for (const item of transfers) {
      if (!byId.has(item.id.toLowerCase())) {
        byId.set(item.id.toLowerCase(), item);
      }
    }
    return Array.from(byId.values());
  }, [liveTransfers, transfers]);

  const supportedCountries = useMemo(
    () => locales.map((locale) => locale.name),
    [locales],
  );
  const isoByCountry = useMemo(() => {
    const map: Record<string, string> = {};
    for (const locale of locales) {
      if (locale.iso) {
        map[locale.name] = locale.iso.toLowerCase();
      }
    }
    return map;
  }, [locales]);

  const [reference, setReference] = useState("");
  const [recipientName, setRecipientName] = useState("");
  const [country, setCountry] = useState("");
  const [trackedResult, setTrackedResult] = useState<{
    result: TrackTransactionResult;
    name: string;
    country: string;
    matched?: Transfer;
  } | null>(null);
  const [error, setError] = useState("");

  const findKnownTransfer = (refId: string) =>
    knownTransfers.find(
      (item) => item.id.trim().toLowerCase() === refId.trim().toLowerCase(),
    );

  const runTrack = (refId: string, nameVal: string, countryVal: string) => {
    const cleanId = refId.trim();
    const cleanName = nameVal.trim();
    const cleanCountry = countryVal.trim();

    if (!cleanId) {
      setError("Enter a transfer reference.");
      return;
    }

    setError("");
    trackMutation.mutate(
      {
        id: cleanId,
        name: cleanName,
        destinaton: {
          country: cleanCountry,
        },
      },
      {
        onSuccess: (result) => {
          const matched = findKnownTransfer(result.id) ?? findKnownTransfer(cleanId);
          setTrackedResult({
            result,
            name: cleanName || matched?.name || "Recipient",
            country: cleanCountry || matched?.country || "",
            matched,
          });
        },
        onError: (err) => {
          setTrackedResult(null);
          setError(getErrorMessage(err, "Unable to track transaction."));
        },
      },
    );
  };

  const handleReferenceChange = (nextRef: string) => {
    setReference(nextRef);
    setError("");
    const matched = findKnownTransfer(nextRef);
    if (matched) {
      setRecipientName(matched.name);
      setCountry(matched.country);
    }
  };

  const lookup = (event: React.FormEvent) => {
    event.preventDefault();
    const matched = findKnownTransfer(reference);
    const resolvedName = recipientName.trim() || matched?.name || "";
    const resolvedCountry = country.trim() || matched?.country || "";
    runTrack(reference, resolvedName, resolvedCountry);
  };

  const activeStatus = trackedResult?.result.status;
  const completed = activeStatus === "Completed";
  const processing = activeStatus === "Processing";
  const failed = activeStatus === "Failed";
  const cancelled = activeStatus === "Cancelled";
  const terminated = failed || cancelled;

  return (
    <>
      <PageHeading title="Track a transfer" />
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
              onChange={(e) => handleReferenceChange(e.target.value)}
              placeholder="e.g. 37fe577c"
            />
            <button
              className="button button-primary cursor-pointer disabled:opacity-50"
              type="submit"
              disabled={trackMutation.isPending}
            >
              {trackMutation.isPending ? "Tracking..." : "Track transfer"} <span>→</span>
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-2">
            <div>
              <label
                htmlFor="track-recipient-name"
                className="block text-[10px] font-bold tracking-wider uppercase text-muted mb-1"
              >
                Recipient name
              </label>
              <input
                id="track-recipient-name"
                value={recipientName}
                onChange={(e) => setRecipientName(e.target.value)}
                placeholder="e.g. John Doe"
                className="w-full"
              />
            </div>
            <div>
              <span className="block text-[10px] font-bold tracking-wider uppercase text-muted mb-1">
                Destination country
              </span>
              {supportedCountries.length > 0 ? (
                <CountrySelect
                  value={country}
                  countries={supportedCountries}
                  isoByCountry={isoByCountry}
                  onChange={setCountry}
                  placeholder="Select country"
                />
              ) : (
                <input
                  value={country}
                  onChange={(e) => setCountry(e.target.value)}
                  placeholder="e.g. Kenya"
                  className="w-full"
                />
              )}
            </div>
          </div>

          {error && <small className="field-error">{error}</small>}
        </form>

        {knownTransfers.length > 0 && (
          <div className="track-example">
            <span>Recent references</span>
            {knownTransfers.slice(0, 4).map((item) => (
              <button
                key={item.id}
                type="button"
                disabled={trackMutation.isPending}
                onClick={() => {
                  setReference(item.id);
                  setRecipientName(item.name);
                  setCountry(item.country);
                  runTrack(item.id, item.name, item.country);
                }}
              >
                {item.id}
              </button>
            ))}
          </div>
        )}
      </section>

      {trackedResult && (
        <section className="track-result">
          <div className="track-result-head">
            <span className={`status status-${trackedResult.result.status.toLowerCase()}`}>
              <i />
              {trackedResult.result.status}
            </span>
            <span>
              <code>{trackedResult.result.id}</code>
            </span>
          </div>
          <h2>
            {trackedResult.name}
            {trackedResult.country ? ` · ${trackedResult.country}` : ""}
          </h2>
          <p>
            {trackedResult.matched
              ? `${trackedResult.matched.currency} ${trackedResult.matched.amount.toFixed(2)} · `
              : ""}
            {trackedResult.result.timestamp || trackedResult.matched?.date || "Updated just now"}
          </p>
          <div className="timeline">
            <div className="timeline-item complete">
              <span>
                <Icon name="check" size={13} />
              </span>
              <div>
                <strong>Request received</strong>
              </div>
            </div>
            <div
              className={`timeline-item ${completed ? "complete" : terminated ? "" : "current"}`}
            >
              <span>
                {completed ? (
                  <Icon name="check" size={13} />
                ) : terminated ? (
                  <Icon name="close" size={12} />
                ) : (
                  <i />
                )}
              </span>
              <div>
                <strong>
                  {completed
                    ? "Transfer completed"
                    : failed
                      ? "Transfer failed"
                      : cancelled
                        ? "Transfer cancelled"
                        : processing
                          ? "Transfer processing"
                          : "Awaiting settlement"}
                </strong>
                {trackedResult.result.message && (
                  <small>{trackedResult.result.message}</small>
                )}
                {!trackedResult.result.message && failed && (
                  <small>
                    {trackedResult.matched?.failureReason ||
                      "Partner clearing rail declined or timed out."}
                  </small>
                )}
                {!trackedResult.result.message && cancelled && (
                  <small>
                    {trackedResult.matched?.cancellationReason ||
                      "Cancelled before settlement."}
                  </small>
                )}
              </div>
            </div>
            <div className={`timeline-item ${completed ? "complete" : ""}`}>
              <span>{completed ? <Icon name="check" size={13} /> : <i />}</span>
              <div>
                <strong>
                  {terminated
                    ? "Delivery not completed"
                    : trackedResult.matched?.method === "Cash pickup"
                      ? "Ready for cash pickup"
                      : "Recipient delivery"}
                </strong>
              </div>
            </div>
          </div>
        </section>
      )}
    </>
  );
}
