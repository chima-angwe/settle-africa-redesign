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
    onNotice("Support request submitted.");
  };
  return (
    <div className="settings-content">
      <div className="support-topics">
        <button
          type="button"
          onClick={() => setTopic("Transfer question")}
          className={topic === "Transfer question" ? "selected" : ""}
        >
          <Icon name="send" />
          <span>
            <strong>Transfer question</strong>
          </span>
          <Icon name="chevron" size={15} />
        </button>
        <button
          type="button"
          onClick={() => setTopic("Account help")}
          className={topic === "Account help" ? "selected" : ""}
        >
          <Icon name="user" />
          <span>
            <strong>Account help</strong>
          </span>
          <Icon name="chevron" size={15} />
        </button>
      </div>
      <form className="settings-form" onSubmit={submit}>
        <label>
          Topic
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
        <button className="button button-primary cursor-pointer" type="submit">
          Send request <span>→</span>
        </button>
      </form>
    </div>
  );
}
