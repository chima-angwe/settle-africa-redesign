import { Icon } from "@/shared/ui";
import {
  formatScheduleDate,
  getScheduleLabel,
  getTodayIsoDate,
  getTomorrowIsoDate,
  type RecurringFrequency,
  type ScheduleConfig,
} from "../model/schedule";

export interface ScheduledPaymentControlProps {
  value: ScheduleConfig;
  onChange: (next: ScheduleConfig) => void;
}

const FREQUENCIES: RecurringFrequency[] = [
  "Weekly",
  "Bi-weekly",
  "Monthly",
  "Quarterly",
];

export function ScheduledPaymentControl({
  value,
  onChange,
}: ScheduledPaymentControlProps) {
  const minDate = getTodayIsoDate();
  const activeSummary = getScheduleLabel(value);

  const toggleEnabled = () => {
    const nextEnabled = !value.enabled;
    onChange({
      ...value,
      enabled: nextEnabled,
      mode: nextEnabled && value.mode === "now" ? "later" : value.mode,
      date: value.date || getTomorrowIsoDate(),
    });
  };

  return (
    <div className="border border-line rounded-xl p-3.5 bg-soft/60 space-y-3">
      {/* Toggle Header */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5 min-w-0">
          <span className="w-8 h-8 rounded-lg bg-paper border border-line flex items-center justify-center shrink-0 text-ink">
            <Icon name="calendar" size={15} />
          </span>
          <div className="min-w-0">
            <strong className="text-xs font-semibold text-ink block">
              Scheduled payment
            </strong>
            <span className="text-[11px] text-muted block truncate">
              {activeSummary || "Send now, schedule for later, or repeat"}
            </span>
          </div>
        </div>

        <button
          type="button"
          role="switch"
          aria-checked={value.enabled}
          aria-label="Toggle scheduled payment"
          onClick={toggleEnabled}
          className={`relative inline-flex h-6 w-10 shrink-0 items-center rounded-full border transition-colors cursor-pointer ${
            value.enabled
              ? "bg-ink border-ink"
              : "bg-paper border-line"
          }`}
        >
          <span
            className={`inline-block h-4 w-4 rounded-full transition-transform ${
              value.enabled
                ? "translate-x-5 bg-inverse-text"
                : "translate-x-1 bg-muted"
            }`}
          />
        </button>
      </div>

      {/* Expanded Schedule Options */}
      {value.enabled && (
        <div className="space-y-3 pt-2 border-t border-line/80">
          <div
            className="grid grid-cols-3 gap-1 p-1 bg-paper rounded-xl border border-line"
            role="radiogroup"
            aria-label="Payment schedule option"
          >
            {[
              { key: "now" as const, label: "Send now" },
              { key: "later" as const, label: "Schedule later" },
              { key: "recurring" as const, label: "Recurring" },
            ].map((option) => {
              const selected = value.mode === option.key;
              return (
                <button
                  key={option.key}
                  type="button"
                  role="radio"
                  aria-checked={selected}
                  onClick={() =>
                    onChange({
                      ...value,
                      mode: option.key,
                      date: value.date || getTomorrowIsoDate(),
                    })
                  }
                  className={`h-8 px-2 rounded-lg text-[11px] transition-all cursor-pointer truncate ${
                    selected
                      ? "bg-ink text-inverse-text font-semibold"
                      : "text-muted hover:text-ink font-medium"
                  }`}
                >
                  {option.label}
                </button>
              );
            })}
          </div>

          {value.mode === "now" && (
            <p className="text-[11px] text-muted m-0">
              Payment will be sent immediately once confirmed.
            </p>
          )}

          {(value.mode === "later" || value.mode === "recurring") && (
            <div className="space-y-2.5">
              <div>
                <label className="text-[11px] font-medium text-muted block mb-1">
                  {value.mode === "recurring" ? "Start date" : "Scheduled date"}
                </label>
                <input
                  type="date"
                  min={minDate}
                  value={value.date}
                  onChange={(e) =>
                    onChange({ ...value, date: e.target.value })
                  }
                  className="w-full h-10 px-3 border border-line rounded-xl bg-paper text-ink text-xs font-medium outline-none focus:border-ink"
                />
              </div>

              {value.mode === "recurring" && (
                <div>
                  <span className="text-[11px] font-medium text-muted block mb-1.5">
                    Repeat frequency
                  </span>
                  <div className="grid grid-cols-4 gap-1.5">
                    {FREQUENCIES.map((freq) => {
                      const active = value.frequency === freq;
                      return (
                        <button
                          key={freq}
                          type="button"
                          onClick={() =>
                            onChange({ ...value, frequency: freq })
                          }
                          className={`h-8 rounded-lg border text-[11px] font-medium transition-colors cursor-pointer ${
                            active
                              ? "border-ink bg-paper text-ink font-semibold"
                              : "border-line bg-paper/60 text-muted hover:text-ink"
                          }`}
                        >
                          {freq}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {value.date && (
                <p className="text-[11px] text-muted m-0">
                  {value.mode === "later"
                    ? `Will be sent once on ${formatScheduleDate(value.date)}.`
                    : `Sends ${value.frequency.toLowerCase()} automatically based on ${formatScheduleDate(value.date)}.`}
                </p>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
