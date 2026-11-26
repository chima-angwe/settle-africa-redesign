import type React from "react";
import { useState } from "react";
import { CustomSelect, Icon, toast } from "@/shared/ui";
import type { Transfer } from "@/entities/transfer";

const SUPPORT_TICKETS_KEY = "settle-demo-support-tickets";

export interface SupportTicket {
  id: string;
  topic: string;
  transferRef?: string;
  message: string;
  status: "Open";
  createdAt: string;
}

export interface HelpSupportProps {
  onNotice: (notice: string) => void;
  initialTransferRef?: string;
  onClearTransferRef?: () => void;
  transfers?: Transfer[];
}

const HELP_GUIDES: Record<string, string> = {
  "Transfer question":
    "Most transfers settle in under 90 seconds. Attach a transfer reference below if a payout is delayed or failed.",
  "Account help":
    "Update your profile, two-step verification, or password from Profile & settings. Sessions lock after 15 minutes of inactivity.",
  "Something else":
    "Share the details below and our support team will respond in your in-app ticket queue.",
};

function loadTickets(): SupportTicket[] {
  try {
    const raw = localStorage.getItem(SUPPORT_TICKETS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function HelpSupport({
  onNotice,
  initialTransferRef = "",
  onClearTransferRef,
  transfers = [],
}: HelpSupportProps) {
  const [topic, setTopic] = useState("Transfer question");
  const [transferRef, setTransferRef] = useState(initialTransferRef);
  const [prevInitialTransferRef, setPrevInitialTransferRef] = useState(initialTransferRef);
  const [message, setMessage] = useState("");
  const [tickets, setTickets] = useState<SupportTicket[]>(() => loadTickets());

  if (prevInitialTransferRef !== initialTransferRef) {
    setPrevInitialTransferRef(initialTransferRef);
    if (initialTransferRef) {
      setTransferRef(initialTransferRef);
      setTopic("Transfer question");
    }
  }

  const matchedTransfer = transferRef.trim()
    ? transfers.find(
        (t) => t.id.toLowerCase() === transferRef.trim().toLowerCase(),
      )
    : undefined;

  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    const cleanMessage = message.trim();
    if (cleanMessage.length < 5) {
      toast.error("Describe your issue in at least 5 characters.");
      return;
    }

    const ticketId = `SUP-${Math.floor(100000 + Math.random() * 900000)}`;
    const cleanRef = transferRef.trim();
    const newTicket: SupportTicket = {
      id: ticketId,
      topic,
      transferRef: cleanRef || undefined,
      message: cleanMessage,
      status: "Open",
      createdAt: new Date().toLocaleString("en-US", {
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      }),
    };

    const next = [newTicket, ...tickets].slice(0, 10);
    setTickets(next);
    try {
      localStorage.setItem(SUPPORT_TICKETS_KEY, JSON.stringify(next));
    } catch {
      // ignore
    }

    setMessage("");
    setTransferRef("");
    onClearTransferRef?.();
    onNotice(
      cleanRef
        ? `Support request ${ticketId} submitted for ${cleanRef}.`
        : `Support request ${ticketId} submitted.`,
    );
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

      <p className="prototype-caption">{HELP_GUIDES[topic] || HELP_GUIDES["Something else"]}</p>

      <form className="settings-form" onSubmit={submit} noValidate>
        <label>
          Topic
          <CustomSelect
            value={topic}
            onChange={setTopic}
            modalTitle="Select support topic"
            triggerClassName="h-[38px] px-2.5 rounded-[2px] text-[11px] font-medium"
            options={["Transfer question", "Account help", "Something else"]}
          />
        </label>

        <label>
          Transfer reference (optional)
          <input
            value={transferRef}
            onChange={(event) => {
              setTransferRef(event.target.value);
              if (!event.target.value.trim()) onClearTransferRef?.();
            }}
            placeholder="e.g. ST-240918"
            list={transfers.length > 0 ? "support-transfer-refs" : undefined}
          />
          {transfers.length > 0 && (
            <datalist id="support-transfer-refs">
              {transfers.slice(0, 10).map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name} · {t.currency} {t.amount.toFixed(2)} ({t.status})
                </option>
              ))}
            </datalist>
          )}
        </label>

        {matchedTransfer && (
          <div className="notice auth-notice">
            <Icon name="send" size={14} />
            <span>
              Linked: <strong>{matchedTransfer.id}</strong> · {matchedTransfer.name} (
              {matchedTransfer.currency} {matchedTransfer.amount.toFixed(2)} ·{" "}
              {matchedTransfer.status})
            </span>
          </div>
        )}

        <label>
          Message
          <textarea
            value={message}
            onChange={(event) => {
              setMessage(event.target.value);
            }}
            rows={4}
            placeholder={
              transferRef.trim()
                ? `Describe the issue with ${transferRef.trim()}`
                : "Describe what you need help with"
            }
          />
        </label>

        <button className="button button-primary cursor-pointer" type="submit">
          Send request <span>→</span>
        </button>
      </form>

      {tickets.length > 0 && (
        <div className="pt-3 border-t border-line space-y-2">
          <div className="settings-section-title">
            <h3>Recent requests</h3>
          </div>
          <div className="space-y-2">
            {tickets.slice(0, 3).map((ticket) => (
              <div
                key={ticket.id}
                className="p-3 rounded-xl border border-line bg-paper flex items-center justify-between gap-3 text-xs"
              >
                <div className="min-w-0">
                  <strong className="text-ink font-semibold block truncate">
                    {ticket.id} · {ticket.topic}
                    {ticket.transferRef ? ` (${ticket.transferRef})` : ""}
                  </strong>
                  <span className="text-muted text-[11px] block truncate">
                    {ticket.message}
                  </span>
                </div>
                <span className="text-[11px] font-medium text-muted shrink-0">
                  {ticket.status} · {ticket.createdAt}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
