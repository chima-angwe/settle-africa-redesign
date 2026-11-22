import { useState } from "react";
import { Icon } from "@/shared/ui";
import {
  loadNotificationPreferences,
  saveNotificationPreferences,
  type NotificationPreferences,
} from "../model/notificationPrefs";

export interface NotificationSettingsProps {
  onSaved?: (notice: string) => void;
}

export function NotificationSettings({ onSaved }: NotificationSettingsProps) {
  const [settings, setSettings] = useState<NotificationPreferences>(() =>
    loadNotificationPreferences(),
  );

  const requiredMessages = [
    {
      key: "verificationSecurity",
      title: "Verification & security alerts",
      description: "Identity checks, password resets, and session security notices.",
      icon: "shield",
    },
    {
      key: "paymentService",
      title: "Payment issues & service notices",
      description: "Failed transfers, cancellations, and regulatory updates.",
      icon: "bell",
    },
  ];

  const optionalOptions: {
    key: keyof NotificationPreferences;
    title: string;
    description: string;
    icon: string;
  }[] = [
      {
        key: "transferUpdates",
        title: "Transfer & top-up confirmations",
        description: "In-app updates when payments or top-ups complete.",
        icon: "send",
      },
      {
        key: "rateAlerts",
        title: "Exchange rate alerts",
        description: "Updates when supported corridor FX rates move.",
        icon: "bell",
      },
      {
        key: "productNews",
        title: "Product news & updates",
        description: "New routes, delivery partners, and feature releases.",
        icon: "bell",
      },
    ];

  const toggle = (key: keyof NotificationPreferences) => {
    setSettings((current) => {
      const next = { ...current, [key]: !current[key] };
      saveNotificationPreferences(next);
      onSaved?.("Notification preferences updated.");
      return next;
    });
  };

  return (
    <div className="settings-content">
      <div className="settings-section-title">
        <h3>Required service messages</h3>
      </div>
      <p className="prototype-caption">
        Always active to protect your account and notify you about verification or payment issues.
      </p>

      {requiredMessages.map((item) => (
        <div className="setting-card" key={item.key}>
          <div className="setting-copy">
            <span className="setting-icon">
              <Icon name={item.icon} />
            </span>
            <div>
              <strong>{item.title}</strong>
              <small className="block text-[11px] text-muted mt-0.5">
                {item.description}
              </small>
            </div>
          </div>
          <span className="px-2.5 py-1 rounded-lg bg-soft border border-line text-[10px] font-semibold text-muted shrink-0">
            Required
          </span>
        </div>
      ))}

      <div className="settings-section-title pt-3">
        <h3>Optional communication preferences</h3>
      </div>

      {optionalOptions.map((item) => (
        <div className="setting-card" key={item.key}>
          <div className="setting-copy">
            <span className="setting-icon">
              <Icon name={item.icon} />
            </span>
            <div>
              <strong>{item.title}</strong>
              <small className="block text-[11px] text-muted mt-0.5">
                {item.description}
              </small>
            </div>
          </div>
          <button
            type="button"
            className={`toggle ${settings[item.key] ? "on" : ""}`}
            role="switch"
            aria-checked={settings[item.key]}
            aria-label={`Toggle ${item.title}`}
            onClick={() => toggle(item.key)}
          >
            <i />
          </button>
        </div>
      ))}
    </div>
  );
}
