import type React from 'react';
import { useState } from 'react';
import { Icon } from '@/shared/ui';

export interface SecuritySettingsProps {
  onSaved: (notice: string) => void;
}

export function SecuritySettings({ onSaved }: { onSaved: (notice: string) => void }) {
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const [twoStep, setTwoStep] = useState(
    () => localStorage.getItem("settle-demo-two-step") === "true",
  );
  const [error, setError] = useState("");
  const savePassword = (event: React.FormEvent) => {
    event.preventDefault();
    setError("");
    if (!current || !next || !confirm) {
      setError("Complete all password fields.");
      return;
    }
    if (next.length < 8) {
      setError("Use at least 8 characters for your new password.");
      return;
    }
    if (next !== confirm) {
      setError("The new passwords do not match.");
      return;
    }
    setCurrent("");
    setNext("");
    setConfirm("");
    onSaved("Password change saved for this prototype session only.");
  };
  const toggleTwoStep = () => {
    const value = !twoStep;
    setTwoStep(value);
    localStorage.setItem("settle-demo-two-step", String(value));
    onSaved(
      `Two-step verification ${value ? "enabled" : "disabled"} in this prototype.`,
    );
  };
  return (
    <div className="settings-content">
      <div className="setting-card">
        <div className="setting-copy">
          <span className="setting-icon">
            <Icon name="shield" />
          </span>
          <div>
            <strong>Two-step verification</strong>
            <p>
              Add another step when signing in to help protect your account.
            </p>
          </div>
        </div>
        <button
          className={`toggle ${twoStep ? "on" : ""}`}
          role="switch"
          aria-checked={twoStep}
          aria-label="Toggle two-step verification"
          onClick={toggleTwoStep}
        >
          <i />
        </button>
      </div>
      <form className="settings-form" onSubmit={savePassword}>
        <div className="settings-section-title">
          <h3>Change password</h3>
          <p>Choose a strong password you don’t use elsewhere.</p>
        </div>
        <label>
          Current password
          <input
            type="password"
            value={current}
            onChange={(event) => setCurrent(event.target.value)}
            autoComplete="current-password"
          />
        </label>
        <label>
          New password
          <input
            type="password"
            value={next}
            onChange={(event) => setNext(event.target.value)}
            autoComplete="new-password"
          />
        </label>
        <label>
          Confirm new password
          <input
            type="password"
            value={confirm}
            onChange={(event) => setConfirm(event.target.value)}
            autoComplete="new-password"
          />
        </label>
        {error && <div className="notice error-notice">{error}</div>}
        <button className="button button-primary" type="submit">
          Update password
        </button>
        <p className="prototype-caption">
          Password changes are not sent to a server in this prototype.
        </p>
      </form>
    </div>
  );
}
