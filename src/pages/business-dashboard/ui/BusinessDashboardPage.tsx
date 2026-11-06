import { useState } from "react";
import { Icon, StatCard, QuickAction } from "@/shared/ui";
import { RateMarquee } from "@/widgets/rate-marquee";
import { TransferTable } from "@/widgets/transfer-table";
import type { Transfer } from "@/entities/transfer";
import type { Page } from "@/shared/types";

export interface BusinessDashboardPageProps {
  businessName: string;
  transfers: Transfer[];
  setPage: (page: Page) => void;
  onSelectTransfer: (transfer: Transfer) => void;
}

export function BusinessDashboardPage({
  businessName,
  transfers,
  setPage,
  onSelectTransfer,
}: BusinessDashboardPageProps) {
  const [approved, setApproved] = useState<string[]>(() =>
    JSON.parse(localStorage.getItem("settle-demo-business-approved") || "[]"),
  );

  const requests = [
    {
      id: "AP-1042",
      payee: "Nuru Office Supplies",
      detail: "Kenya · Bank transfer",
      amount: "KES 184,000",
    },
    {
      id: "AP-1041",
      payee: "Kora Logistics Ltd",
      detail: "Ghana · Bank transfer",
      amount: "GHS 12,600",
    },
  ];

  const approve = (id: string) =>
    setApproved((current) => {
      const next = [...new Set([...current, id])];
      localStorage.setItem(
        "settle-demo-business-approved",
        JSON.stringify(next),
      );
      return next;
    });

  return (
    <>
      <div className="business-welcome flex flex-col sm:flex-row sm:items-end justify-between gap-5 mb-7">
        <div>
          <span className="eyebrow text-muted text-[8px] font-bold tracking-[1.65px] flex items-center gap-1.5 uppercase">
            <Icon name="building" size={14} /> BUSINESS WORKSPACE · DEMO
          </span>
          <h1 className="my-[6px] text-ink font-heading font-bold text-[clamp(25px,3vw,35px)] leading-[1.15] tracking-[-1.4px]">{businessName}</h1>
          <p className="m-0 text-muted text-[11px]">
            Payments, recipients and activity for your business in one place.
          </p>
        </div>
        <div className="business-welcome-actions flex items-center gap-2">
          <button
            type="button"
            className="button button-secondary inline-flex min-h-[42px] items-center justify-center gap-2 px-4 rounded border border-line bg-paper text-ink text-[10px] font-bold hover:bg-soft transition-colors"
            onClick={() => setPage("Bulk transfer")}
          >
            <Icon name="upload" size={17} /> Bulk transfer
          </button>
          <button
            type="button"
            className="button button-primary inline-flex min-h-[42px] items-center justify-center gap-2 px-4 rounded border border-transparent bg-ink text-inverse-text text-[10px] font-bold hover:opacity-90 transition-all cursor-pointer"
            onClick={() => setPage("Send money")}
          >
            <Icon name="plus" size={17} /> New payment
          </button>
        </div>
      </div>
      <div className="business-demo-note flex items-center gap-3 p-3 mb-6 border border-line rounded bg-soft text-ink">
        <span className="inline-grid w-7 h-7 place-items-center border border-line rounded-full bg-paper text-ink">
          <Icon name="shield" size={17} />
        </span>
        <div className="grid gap-0.5">
          <strong className="text-xs font-bold">Prototype workspace</strong>
          <small className="text-muted text-[9px]">
            Figures, approvals and payment activity shown here are sample data.
            No payments are sent.
          </small>
        </div>
      </div>
      <div className="stat-grid business-stat-grid grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-0 border border-line bg-paper">
        <StatCard
          label="Monthly transfer limit"
          value="₦25,000,000"
          note="Illustrative account limit"
          icon="card"
          tag="DEMO"
        />
        <StatCard
          label="Sent this month"
          value="₦4,280,000"
          note="Across 18 payments"
          icon="send"
        />
        <StatCard
          label="Needs approval"
          value={String(
            requests.filter((item) => !approved.includes(item.id)).length,
          )}
          note="Payments awaiting review"
          icon="clock"
          tag="REVIEW"
        />
        <StatCard
          label="Team members"
          value="4 members"
          note="Owner and 3 team members"
          icon="users"
        />
      </div>
      <section className="content-section dashboard-quick-section mt-8">
        <div className="section-heading flex items-center justify-between mb-3">
          <div>
            <h2 className="my-0 font-heading font-bold text-sm tracking-[-0.3px] text-ink">Business actions</h2>
            <p className="my-0 text-muted text-[9px]">Common tasks for your team.</p>
          </div>
        </div>
        <div className="quick-grid grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2.5">
          <QuickAction
            icon="send"
            title="New payment"
            note="Send to a business recipient"
            onClick={() => setPage("Send money")}
          />
          <QuickAction
            icon="upload"
            title="Bulk transfer"
            note="Pay several recipients at once"
            onClick={() => setPage("Bulk transfer")}
          />
          <QuickAction
            icon="users"
            title="Recipients"
            note="Manage saved payees"
            onClick={() => setPage("Recipients")}
          />
          <QuickAction
            icon="clock"
            title="Payment history"
            note="Review business transfers"
            onClick={() => setPage("Transactions")}
          />
          <QuickAction
            icon="search"
            title="Track a payment"
            note="Follow a transfer"
            onClick={() => setPage("Track transaction")}
          />
        </div>
      </section>
      <RateMarquee />
      <section className="content-section business-approvals mt-8">
        <div className="section-heading flex items-center justify-between mb-3">
          <div>
            <h2 className="my-0 font-heading font-bold text-sm tracking-[-0.3px] text-ink">Payment approvals</h2>
            <p className="my-0 text-muted text-[9px]">Review outgoing payments before they are released.</p>
          </div>
          <span className="approval-count text-muted text-[8px] font-bold border border-line px-2 py-0.5 rounded">
            {requests.filter((item) => !approved.includes(item.id)).length} to review
          </span>
        </div>
        <div className="approval-list grid gap-2 border border-line p-3 bg-paper rounded">
          {requests.map((item) => (
            <article className="approval-row flex items-center justify-between gap-3 p-2.5 border-b border-line last:border-b-0" key={item.id}>
              <span className="approval-avatar inline-grid w-8 h-8 place-items-center border border-line rounded-full bg-soft text-ink">
                <Icon name="building" size={18} />
              </span>
              <div className="approval-payee flex-1 grid gap-0.5">
                <strong className="text-xs font-bold text-ink">{item.payee}</strong>
                <small className="text-muted text-[9px]">
                  {item.detail} · Ref {item.id}
                </small>
              </div>
              <strong className="approval-amount text-xs font-bold text-ink">{item.amount}</strong>
              {approved.includes(item.id) ? (
                <span className="approval-done inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400 text-xs font-medium">
                  <Icon name="checkCircle" size={16} /> Approved in demo
                </span>
              ) : (
                <button
                  type="button"
                  className="button button-secondary button-small text-xs px-2.5 py-1 border border-line rounded hover:bg-soft"
                  onClick={() => approve(item.id)}
                >
                  Approve demo
                </button>
              )}
            </article>
          ))}
        </div>
        <p className="prototype-caption text-muted text-[8px] mt-2 italic">
          Approval actions update this local demo only. Team roles and payment
          release require backend support.
        </p>
      </section>
      <section className="content-section activity-section mt-8">
        <div className="section-heading flex items-center justify-between mb-3">
          <div>
            <h2 className="my-0 font-heading font-bold text-sm tracking-[-0.3px] text-ink">Recent business payments</h2>
            <p className="my-0 text-muted text-[9px]">Latest payment activity for this demo account.</p>
          </div>
          <button
            type="button"
            className="link-button text-ink font-bold text-[10px] hover:underline cursor-pointer"
            onClick={() => setPage("Transactions")}
          >
            View all <span>→</span>
          </button>
        </div>
        <TransferTable
          transfers={transfers.slice(0, 3)}
          onSelect={onSelectTransfer}
        />
      </section>
    </>
  );
}

