import type React from 'react';
import { useState } from 'react';
import { Icon, PageHeading } from '@/shared/ui';
import type { Recipient } from '@/entities/recipient';
import { CountryBadge, CountrySelect } from '@/entities/country';

export interface RecipientsProps {
  recipients: Recipient[];
  setRecipients: React.Dispatch<React.SetStateAction<Recipient[]>>;
  onSend: (id: number) => void;
  query: string;
  setQuery: (query: string) => void;
}

export function Recipients({
  recipients,
  setRecipients,
  onSend,
  query,
  setQuery,
}: {
  recipients: Recipient[];
  setRecipients: (items: Recipient[]) => void;
  onSend: (id: number) => void;
  query: string;
  setQuery: (q: string) => void;
}) {
  const [showAdd, setShowAdd] = useState(false);
  const [editingRecipient, setEditingRecipient] = useState<Recipient | null>(
    null,
  );
  const [recipientName, setRecipientName] = useState("");
  const [country, setCountry] = useState("Nigeria");
  const [account, setAccount] = useState("");
  const [method, setMethod] = useState("Bank transfer");
  const [notice, setNotice] = useState("");
  const filtered = recipients.filter((item) =>
    `${item.name} ${item.country} ${item.method}`
      .toLowerCase()
      .includes(query.toLowerCase()),
  );
  const closeRecipientModal = () => {
    setShowAdd(false);
    setEditingRecipient(null);
    setRecipientName("");
    setCountry("Nigeria");
    setAccount("");
    setMethod("Bank transfer");
  };
  const editRecipient = (recipient: Recipient) => {
    setEditingRecipient(recipient);
    setRecipientName(recipient.name);
    setCountry(recipient.country);
    setAccount(recipient.account);
    setMethod(recipient.method);
  };
  const add = (event: React.FormEvent) => {
    event.preventDefault();
    if (!recipientName.trim() || !account.trim()) return;
    const nextRecipient = {
      id: editingRecipient?.id || Date.now(),
      name: recipientName.trim(),
      country,
      method,
      account: account.trim(),
      initials: recipientName
        .trim()
        .split(" ")
        .map((part) => part[0])
        .slice(0, 2)
        .join("")
        .toUpperCase(),
    };
    setRecipients(
      editingRecipient
        ? recipients.map((item) =>
            item.id === editingRecipient.id ? nextRecipient : item,
          )
        : [...recipients, nextRecipient],
    );
    setNotice(
      editingRecipient
        ? `${recipientName.trim()}’s details were updated.`
        : `${recipientName.trim()} was added to your recipients.`,
    );
    closeRecipientModal();
    setTimeout(() => setNotice(""), 3500);
  };
  return (
    <>
      <PageHeading
        eyebrow="YOUR PEOPLE"
        title="Recipients"
        subtitle=""
        action={
          <button
            className="button button-primary"
            onClick={() => {
              closeRecipientModal();
              setShowAdd(true);
            }}
          >
            <Icon name="plus" /> Add recipient
          </button>
        }
      />
      {notice && (
        <div className="notice success-notice recipient-notice">
          <Icon name="check" size={16} />
          {notice}
        </div>
      )}
      <div className="list-toolbar">
        <label className="search-field">
          <Icon name="search" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search recipients"
          />
        </label>
        <span>
          {filtered.length} saved{" "}
          {filtered.length === 1 ? "recipient" : "recipients"}
        </span>
      </div>
      <div className="recipient-grid">
        {filtered.map((recipient) => (
          <article className="recipient-card" key={recipient.id}>
            <div className="recipient-card-top">
              <span className="avatar avatar-soft">{recipient.initials}</span>
              <button
                className="more-button"
                aria-label={`Edit ${recipient.name}`}
                title="Edit recipient"
                onClick={() => editRecipient(recipient)}
              >
                •••
              </button>
            </div>
            <h3>{recipient.name}</h3>
            <p>
              <CountryBadge country={recipient.country} /> <span>·</span>{" "}
              {recipient.method}
            </p>
            <div className="recipient-account">
              <span>Account details</span>
              <strong>{recipient.account}</strong>
            </div>
            <div className="recipient-card-actions">
              <button
                className="button button-primary"
                onClick={() => onSend(recipient.id)}
              >
                Send money <span>→</span>
              </button>
              <button
                className="icon-button"
                title={`Remove ${recipient.name}`}
                aria-label={`Remove ${recipient.name}`}
                onClick={() => {
                  if (
                    window.confirm(
                      `Remove ${recipient.name} from your saved recipients?`,
                    )
                  ) {
                    setRecipients(
                      recipients.filter((item) => item.id !== recipient.id),
                    );
                    setNotice(
                      `${recipient.name} was removed from your recipients.`,
                    );
                    setTimeout(() => setNotice(""), 3500);
                  }
                }}
              >
                <Icon name="close" size={17} />
              </button>
            </div>
          </article>
        ))}
        {filtered.length === 0 && (
          <div className="empty-state">
            <span className="empty-icon">
              <Icon name="users" size={22} />
            </span>
            <h3>No recipients found</h3>
            <p>Try a different search or add someone new.</p>
            <button
              className="button button-primary"
              onClick={() => {
                closeRecipientModal();
                setShowAdd(true);
              }}
            >
              Add a recipient
            </button>
          </div>
        )}
      </div>
      {(showAdd || editingRecipient) && (
        <div className="modal-scrim" onClick={closeRecipientModal}>
          <div
            className="modal-card"
            onClick={(event) => event.stopPropagation()}
          >
            <button
              className="modal-close icon-button"
              onClick={closeRecipientModal}
              aria-label="Close"
            >
              <Icon name="close" />
            </button>
            <span className="eyebrow">
              {editingRecipient ? "EDIT RECIPIENT" : "NEW RECIPIENT"}
            </span>
            <h2>
              {editingRecipient
                ? "Update recipient details"
                : "Add someone to your list"}
            </h2>
            <p>
              {editingRecipient
                ? "Keep their payout details up to date."
                : "You can save someone now and send to them later."}
            </p>
            <form className="modal-form" onSubmit={add}>
              <label>
                Recipient’s full name
                <input
                  required
                  value={recipientName}
                  onChange={(e) => setRecipientName(e.target.value)}
                  placeholder="e.g. Ada Okafor"
                />
              </label>
              <div className="country-field">
                <span>Country</span>
                <CountrySelect value={country} onChange={setCountry} />
              </div>
              <label>
                Receiving method
                <select
                  value={method}
                  onChange={(e) => setMethod(e.target.value)}
                >
                  <option>Bank transfer</option>
                  <option>Mobile money</option>
                  <option>M-Pesa</option>
                </select>
              </label>
              <label>
                Account number or phone
                <input
                  required
                  value={account}
                  onChange={(e) => setAccount(e.target.value)}
                  placeholder="Enter recipient details"
                />
              </label>
              <button className="button button-primary" type="submit">
                {editingRecipient ? "Save changes" : "Save recipient"}{" "}
                <span>→</span>
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
