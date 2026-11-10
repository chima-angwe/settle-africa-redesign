import { useState } from 'react';
import { Icon } from '@/shared/ui';

export function NotificationSettings() {
  const [settings, setSettings] = useState<Record<string, boolean>>(() =>
    JSON.parse(
      localStorage.getItem("settle-demo-notifications") ||
        '{"transferUpdates":true,"securityAlerts":true,"productNews":false}',
    ),
  );
  const options: [keyof typeof settings, string][] = [
    ["transferUpdates", "Transfer updates"],
    ["securityAlerts", "Security alerts"],
    ["productNews", "Product news"],
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
      </div>
      {options.map(([key, title]) => (
        <div className="setting-card" key={key}>
          <div className="setting-copy">
            <span className="setting-icon">
              <Icon name={key === "securityAlerts" ? "shield" : "bell"} />
            </span>
            <div>
              <strong>{title}</strong>
            </div>
          </div>
          <button
            type="button"
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
