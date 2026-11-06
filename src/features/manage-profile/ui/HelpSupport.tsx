import type React from 'react';
import { useState } from 'react';
import { Icon } from '@/shared/ui';

export interface HelpSupportProps {
  onNotice: (notice: string) => void;
}

export function HelpSupport({ onNotice }: { onNotice: (notice: string) => void }) {
  const [topic, setTopic] = useState("Transfer question");
  const [message, setMessage] = useState("");
  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    if (!message.trim()) return;
    setMessage("");
    onNotice(
      "Your support request was saved as a prototype example. No message was sent.",
    );
  };
  return (
    <div className="settings-content">
      <div className="support-banner">
        <span className="support-mark">?</span>
        <div>
          <strong>How can we help?</strong>
          <p>
            Tell us what you need help with and we’ll guide you to the right
            place.
          </p>
        </div>
      </div>
      <div className="support-topics">
        <button
          onClick={() => setTopic("Transfer question")}
          className={topic === "Transfer question" ? "selected" : ""}
        >
          <Icon name="send" />
          <span>
            <strong>Transfer question</strong>
            <small>Rates, fees, and transfer progress</small>
          </span>
          <Icon name="chevron" size={15} />
        </button>
        <button
          onClick={() => setTopic("Account help")}
          className={topic === "Account help" ? "selected" : ""}
        >
          <Icon name="user" />
          <span>
            <strong>Account help</strong>
            <small>Sign-in, profile, or verification</small>
          </span>
          <Icon name="chevron" size={15} />
        </button>
      </div>
      <form className="settings-form" onSubmit={submit}>
        <label>
          What do you need help with?
          <select
            value={topic}
            onChange={(event) => setTopic(event.target.value)}
          >
            <option>Transfer question</option>
            <option>Account help</option>
            <option>Something else</option>
          </select>
        </label>
        <label>
          Message
          <textarea
            value={message}
            onChange={(event) => setMessage(event.target.value)}
            rows={4}
            placeholder="Describe what you need help with"
          />
        </label>
        <button className="button button-primary" type="submit">
          Prepare support request <span>→</span>
        </button>
        <p className="prototype-caption">
          This prototype will not send your message.
        </p>
      </form>
    </div>
  );
}