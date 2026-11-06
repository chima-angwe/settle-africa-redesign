import { useState } from 'react';
import { Icon } from '@/shared/ui';

export function NotificationSettings() {
  const [settings, setSettings] = useState<Record<string, boolean>>(() =>
    JSON.parse(
      localStorage.getItem("settle-demo-notifications") ||
        '{"transferUpdates":true,"securityAlerts":true,"productNews":false}',
    ),
  );
  const options: [keyof typeof settings, string, string][] = [
    [
      "transferUpdates",
      "Transfer updates",
      "Get updates when a transfer status changes.",
    ],
    [
      "securityAlerts",
      "Security alerts",
      "Know when important account activity happens.",
    ],
    [
      "productNews",
      "Product news",
      "Hear about new features and service updates.",
    ],
  ];
  const toggle = (key: keyof typeof settings) =>
    setSettings((current) => {
      const next = { ...current, [key]: !current[key] };
      localStorage.setItem("settle-demo-notifications", JSON.stringify(next));
      return next;
    });
  return (
    <div className="settings-content">
      <div className="settings-section-title">
        <h3>Notification preferences</h3>
        <p>These preferences are saved on this device for the prototype.</p>
      </div>
      {options.map(([key, title, description]) => (
        <div className="setting-card" key={key}>
          <div className="setting-copy">
            <span className="setting-icon">
              <Icon name={key === "securityAlerts" ? "shield" : "bell"} />
            </span>
            <div>
              <strong>{title}</strong>
              <p>{description}</p>
            </div>
          </div>
          <button
            className={`toggle ${settings[key] ? "on" : ""}`}
            role="switch"
            aria-checked={settings[key]}
            aria-label={`Toggle ${title}`}
            onClick={() => toggle(key)}
          >
            <i />
          </button>
        </div>
      ))}
    </div>
  );
}
