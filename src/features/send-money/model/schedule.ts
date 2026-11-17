export type ScheduleMode = "now" | "later" | "recurring";
export type RecurringFrequency = "Weekly" | "Bi-weekly" | "Monthly" | "Quarterly";

export interface ScheduleConfig {
  enabled: boolean;
  mode: ScheduleMode;
  date: string;
  frequency: RecurringFrequency;
}

export function getTomorrowIsoDate(): string {
  const date = new Date();
  date.setDate(date.getDate() + 1);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function getTodayIsoDate(): string {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function formatScheduleDate(dateStr: string): string {
  if (!dateStr) return "";
  const parsed = new Date(`${dateStr}T12:00:00`);
  if (Number.isNaN(parsed.getTime())) return dateStr;
  return parsed.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function getScheduleLabel(schedule: ScheduleConfig): string | undefined {
  if (!schedule.enabled || schedule.mode === "now") return undefined;
  const formatted = formatScheduleDate(schedule.date);
  if (schedule.mode === "later") {
    return formatted ? `Scheduled for ${formatted}` : "Scheduled for later";
  }
  return formatted
    ? `Recurring · ${schedule.frequency} from ${formatted}`
    : `Recurring · ${schedule.frequency}`;
}
