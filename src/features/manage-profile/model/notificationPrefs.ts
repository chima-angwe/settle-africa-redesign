export const NOTIFICATION_PREFS_KEY = "settle-demo-notifications";

export interface NotificationPreferences {
  transferUpdates: boolean;
  rateAlerts: boolean;
  productNews: boolean;
}

const DEFAULT_PREFS: NotificationPreferences = {
  transferUpdates: true,
  rateAlerts: false,
  productNews: false,
};

export function loadNotificationPreferences(): NotificationPreferences {
  try {
    const raw = localStorage.getItem(NOTIFICATION_PREFS_KEY);
    if (!raw) return DEFAULT_PREFS;
    const parsed = JSON.parse(raw) as Partial<NotificationPreferences>;
    return {
      transferUpdates:
        typeof parsed.transferUpdates === "boolean"
          ? parsed.transferUpdates
          : DEFAULT_PREFS.transferUpdates,
      rateAlerts:
        typeof parsed.rateAlerts === "boolean"
          ? parsed.rateAlerts
          : DEFAULT_PREFS.rateAlerts,
      productNews:
        typeof parsed.productNews === "boolean"
          ? parsed.productNews
          : DEFAULT_PREFS.productNews,
    };
  } catch {
    return DEFAULT_PREFS;
  }
}

export function saveNotificationPreferences(next: NotificationPreferences): void {
  try {
    localStorage.setItem(NOTIFICATION_PREFS_KEY, JSON.stringify(next));
    window.dispatchEvent(new Event("settle-notifications-prefs-updated"));
  } catch {
    // ignore
  }
}
