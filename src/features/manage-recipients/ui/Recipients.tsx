import type React from "react";
import { useState } from "react";
import { Icon, PageHeading } from "@/shared/ui";
import type { Recipient } from "@/entities/recipient";
import { CountryBadge, CountrySelect } from "@/entities/country";

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
  const [editingRecipient, setEditingRecipient] = useState<Recipient | null>(null);
  const [recipientName, setRecipientName] = useState("");
  const [country, setCountry] = useState("Nigeria");
  const [account, setAccount] = useState("");
  const [method, setMethod] = useState("Bank transfer");
  const [notice, setNotice] = useState("");

  const filtered = recipients.filter((item) =>
    `${item.name} ${item.country} ${item.method} ${item.account}`
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

  const removeRecipient = (recipient: Recipient) => {
    if (window.confirm(`Remove ${recipient.name}?`)) {
      setRecipients(recipients.filter((item) => item.id !== recipient.id));
      setNotice(`${recipient.name} removed.`);
      setTimeout(() => setNotice(""), 3000);
    }
  };

  const saveRecipient = (event: React.FormEvent) => {
    event.preventDefault();
    if (!recipientName.trim() || !account.trim()) return;
    const nextRecipient: Recipient = {
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
        ? `${recipientName.trim()} updated.`
        : `${recipientName.trim()} added.`,
    );
    closeRecipientModal();
    setTimeout(() => setNotice(""), 3000);
  };

  return (
    <div className="space-y-6">
      <PageHeading
        title="Recipients"
        action={
          <button
            type="button"
            className="button button-primary h-10 px-4 rounded-xl text-xs font-semibold inline-flex items-center gap-1.5 cursor-pointer"
            onClick={() => {
              closeRecipientModal();
              setShowAdd(true);
            }}
          >
            <Icon name="plus" size={15} />
            <span>Add recipient</span>
          </button>
        }
      />

      {notice && (
        <div className="notice success-notice rounded-xl px-4 py-2.5 text-xs flex items-center gap-2">
          <Icon name="check" size={15} />
          <span>{notice}</span>
        </div>
      )}

      {/* Clean Search Bar */}
      <div className="flex items-center justify-between gap-3">
        <label className="w-full max-w-md h-11 px-3.5 border border-line rounded-xl bg-paper flex items-center gap-2.5 text-muted focus-within:border-ink transition-colors">
          <Icon name="search" size={16} className="shrink-0" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search recipients..."
            className="w-full h-full bg-transparent border-0 outline-none text-ink text-xs sm:text-sm placeholder:text-muted/70"
          />
        </label>
      </div>

      {/* Recipient Grid or Empty State */}
      {filtered.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((recipient) => (
            <article
              key={recipient.id}
              className="bg-paper border border-line rounded-2xl p-4 sm:p-5 flex flex-col justify-between gap-4 shadow-subtle hover:border-ink/30 transition-colors"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-3 min-w-0">
                  <span className="w-10 h-10 rounded-xl bg-soft border border-line flex items-center justify-center shrink-0 text-ink font-heading font-bold text-xs">
                    {recipient.initials}
                  </span>
                  <div className="min-w-0">
                    <strong className="text-sm font-semibold text-ink block truncate">
                      {recipient.name}
                    </strong>
                    <span className="text-[11px] text-muted flex items-center gap-1 mt-0.5">
                      <CountryBadge country={recipient.country} />
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-0.5 shrink-0">
                  <button
                    type="button"
                    aria-label={`Edit ${recipient.name}`}
                    title="Edit"
                    onClick={() => editRecipient(recipient)}
                    className="w-8 h-8 rounded-lg text-muted hover:text-ink hover:bg-soft flex items-center justify-center transition-colors cursor-pointer"
                  >
                    <Icon name="edit" size={14} />
                  </button>
                  <button
                    type="button"
                    aria-label={`Remove ${recipient.name}`}
                    title="Remove"
                    onClick={() => removeRecipient(recipient)}
                    className="w-8 h-8 rounded-lg text-muted hover:text-rose-600 dark:hover:text-rose-400 hover:bg-soft flex items-center justify-center transition-colors cursor-pointer"
                  >
                    <Icon name="close" size={14} />
                  </button>
                </div>
              </div>

              <div className="px-3.5 py-2.5 bg-soft rounded-xl border border-line/60 flex items-center justify-between gap-2 text-xs">
                <span className="text-muted text-[11px] truncate">
                  {recipient.method}
                </span>
                <strong className="font-mono font-semibold text-ink shrink-0">
                  {recipient.account}
                </strong>
              </div>

              <button
                type="button"
                onClick={() => onSend(recipient.id)}
                className="button button-primary w-full h-10 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <span>Send money</span>
                <Icon name="chevron" size={14} />
              </button>
            </article>
          ))}
        </div>
      ) : (
        <div className="border border-line rounded-2xl bg-paper shadow-subtle py-16 px-6 flex flex-col items-center justify-center text-center">
          <span className="inline-grid w-12 h-12 place-items-center rounded-2xl bg-soft text-muted mb-3.5">
            <Icon name="users" size={22} />
          </span>
          <h3 className="text-sm font-heading font-bold text-ink m-0">
            No recipients found
          </h3>
          <div className="mt-4">
            {query ? (
              <button
                type="button"
                className="button button-secondary h-10 px-4 rounded-xl text-xs font-semibold cursor-pointer"
                onClick={() => setQuery("")}
              >
                Clear search
              </button>
            ) : (
              <button
                type="button"
                className="button button-primary h-10 px-4 rounded-xl text-xs font-semibold inline-flex items-center gap-1.5 cursor-pointer"
                onClick={() => {
                  closeRecipientModal();
                  setShowAdd(true);
                }}
              >
                <Icon name="plus" size={15} />
                <span>Add recipient</span>
              </button>
            )}
          </div>
        </div>
      )}

      {/* Minimal Add / Edit Recipient Modal */}
      {(showAdd || editingRecipient) && (
        <div className="modal-scrim" onClick={closeRecipientModal}>
          <div
            className="bg-paper border border-line rounded-2xl p-6 sm:p-7 w-full max-w-md shadow-card relative space-y-5"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-heading font-bold text-ink m-0">
                {editingRecipient ? "Edit recipient" : "Add recipient"}
              </h2>
              <button
                type="button"
                onClick={closeRecipientModal}
                aria-label="Close"
                className="w-8 h-8 rounded-lg text-muted hover:text-ink hover:bg-soft flex items-center justify-center transition-colors cursor-pointer"
              >
                <Icon name="close" size={16} />
              </button>
            </div>

            <form className="space-y-4" onSubmit={saveRecipient}>
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted block">
                  Full name
                </label>
                <input
                  required
                  value={recipientName}
                  onChange={(e) => setRecipientName(e.target.value)}
                  placeholder="Ada Okafor"
                  className="w-full h-11 px-3.5 border border-line rounded-xl bg-paper text-ink text-sm outline-none focus:border-ink"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted block">
                  Country
                </label>
                <CountrySelect value={country} onChange={setCountry} />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted block">
                  Receiving method
                </label>
                <select
                  value={method}
                  onChange={(e) => setMethod(e.target.value)}
                  className="w-full h-11 pl-3.5 pr-10 border border-line rounded-xl bg-paper text-ink text-sm outline-none focus:border-ink font-medium cursor-pointer"
                >
                  <option>Bank transfer</option>
                  <option>Mobile money</option>
                  <option>M-Pesa</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted block">
                  Account or phone
                </label>
                <input
                  required
                  value={account}
                  onChange={(e) => setAccount(e.target.value)}
                  placeholder="Account number or phone"
                  className="w-full h-11 px-3.5 border border-line rounded-xl bg-paper text-ink font-mono text-sm outline-none focus:border-ink"
                />
              </div>

              <div className="pt-1">
                <button
                  type="submit"
                  className="button button-primary w-full h-11 rounded-xl text-xs font-bold cursor-pointer"
                >
                  {editingRecipient ? "Save changes" : "Save recipient"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
