import type React from 'react';
import { useState } from 'react';
import { Icon, PageHeading } from '@/shared/ui';
import { parseCsvLine } from '@/shared/lib';
import type { Transfer, BulkDraft } from '@/entities/transfer';
import { countryCodes, countries, CountryBadge, CountrySelect } from '@/entities/country';

export interface BulkTransferProps {
  setTransfers: React.Dispatch<React.SetStateAction<Transfer[]>>;
  onTrackTransfer: (transfer: Transfer) => void;
}

export function BulkTransfer({
  setTransfers,
  onTrackTransfer,
}: {
  setTransfers: React.Dispatch<React.SetStateAction<Transfer[]>>;
  onTrackTransfer: (transfer: Transfer) => void;
}) {
  const [rows, setRows] = useState<BulkDraft[]>([]);
  const [submitted, setSubmitted] = useState<Transfer[]>([]);
  const [batchId, setBatchId] = useState("");
  const [error, setError] = useState("");
  const rowError = (row: BulkDraft) =>
    !row.name.trim()
      ? "Add a recipient name"
      : !countryCodes[row.country]
        ? "Choose a supported country"
        : !row.account.trim()
          ? "Add bank or wallet details"
          : !Number.isFinite(Number(row.amount)) || Number(row.amount) <= 0
            ? "Enter an amount above zero"
            : "";
  const validRows = rows.filter((row) => !rowError(row));
  const total = validRows.reduce((sum, row) => sum + Number(row.amount), 0);
  const update = (
    key: string,
    field: keyof Omit<BulkDraft, "key">,
    value: string,
  ) =>
    setRows((current) =>
      current.map((row) =>
        row.key === key ? { ...row, [field]: value } : row,
      ),
    );
  const addRow = (row: Partial<BulkDraft> = {}) =>
    setRows((current) => [
      ...current,
      {
        key: String(Date.now()) + Math.random(),
        name: row.name || "",
        country: row.country || "",
        account: row.account || "",
        amount: row.amount || "",
      },
    ]);
  const importCsv = async (file?: File) => {
    if (!file) return;
    setError("");
    try {
      const lines = (await file.text())
        .split(/\r?\n/)
        .filter((line) => line.trim());
      if (lines.length < 2)
        throw new Error("The CSV needs a header row and at least one payment.");
      const headers = parseCsvLine(lines[0]).map((value) =>
        value.toLowerCase(),
      );
      const find = (...names: string[]) =>
        headers.findIndex((header) => names.includes(header));
      const nameIndex = find(
        "recipient",
        "recipient name",
        "name",
        "beneficiary",
      );
      const countryIndex = find("country", "destination country");
      const accountIndex = find(
        "account",
        "account number",
        "phone",
        "mobile number",
        "bank or wallet",
      );
      const amountIndex = find("amount", "amount usd", "usd amount");
      if (
        [nameIndex, countryIndex, accountIndex, amountIndex].some(
          (index) => index < 0,
        )
      )
        throw new Error(
          "Include these CSV columns: Recipient, Country, Account, Amount.",
        );
      const imported = lines.slice(1).map((line) => {
        const cells = parseCsvLine(line);
        const rawCountry = cells[countryIndex] || "";
        const country =
          countries.find(
            (item: string) => item.toLowerCase() === rawCountry.toLowerCase(),
          ) ||
          countries.find(
            (item: string) =>
              countryCodes[item]?.toLowerCase() === rawCountry.toLowerCase(),
          ) ||
          rawCountry;
        return {
          key: String(Date.now()) + Math.random(),
          name: cells[nameIndex] || "",
          country,
          account: cells[accountIndex] || "",
          amount: cells[amountIndex] || "",
        };
      });
      setRows(imported);
      setSubmitted([]);
      setError(
        String(imported.length) +
          " payment rows imported. Review the details before creating the batch.",
      );
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : "We could not read that CSV file.",
      );
    }
  };
  const loadSample = () => {
    setRows([
      {
        key: "sample-1",
        name: "Nuru Office Supplies",
        country: "Kenya",
        account: "•••• 0912",
        amount: "184",
      },
      {
        key: "sample-2",
        name: "Kora Logistics Ltd",
        country: "Ghana",
        account: "•••• 4421",
        amount: "95",
      },
      {
        key: "sample-3",
        name: "Amina Yusuf",
        country: "Nigeria",
        account: "•••• 8830",
        amount: "320",
      },
    ]);
    setSubmitted([]);
    setError("Sample payments loaded. Review and create this demo batch.");
  };
  const downloadTemplate = () => {
    const csv =
      "Recipient,Country,Account,Amount\nSample Supplier,Kenya,123456789,150.00";
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
    const link = document.createElement("a");
    link.href = url;
    link.download = "settle-bulk-transfer-template.csv";
    link.click();
    URL.revokeObjectURL(url);
  };
  const createBatch = () => {
    if (rows.length === 0) {
      setError("Add payments or import a CSV file first.");
      return;
    }
    const invalid = rows.find((row) => rowError(row));
    if (invalid) {
      setError(
        (invalid.name || "A payment row") + ": " + rowError(invalid) + ".",
      );
      return;
    }
    const now = Date.now(),
      id = "BT-" + String(now).slice(-7);
    const created = rows.map(
      (row, index): Transfer => ({
        id:
          "BP-" +
          String(now).slice(-6) +
          "-" +
          String(index + 1).padStart(2, "0"),
        batchId: id,
        name: row.name.trim(),
        country: row.country,
        amount: Number(row.amount),
        currency: "USD",
        status: "Processing",
        date: "Just now",
      }),
    );
    setTransfers((current) => [...created, ...current]);
    setBatchId(id);
    setSubmitted(created);
    setError("");
  };
  if (submitted.length)
    return (
      <>
        <PageHeading
          eyebrow="BUSINESS PAYMENTS"
          title="Batch created"
          subtitle={
            batchId +
            " · " +
            submitted.length +
            " payments are now in your payment history."
          }
          action={
            <button
              className="button button-secondary"
              onClick={() => {
                setRows([]);
                setSubmitted([]);
                setBatchId("");
              }}
            >
              Create another batch
            </button>
          }
        />
        <div className="bulk-confirmation">
          <span className="bulk-success-icon">
            <Icon name="checkCircle" size={25} />
          </span>
          <div>
            <h2>Your payment batch is ready</h2>
            <p>
              Each payment has its own reference, so you can follow its status
              separately.
            </p>
          </div>
          <div className="bulk-confirmation-total">
            <small>BATCH TOTAL</small>
            <strong>
              USD{" "}
              {submitted
                .reduce((sum, transfer) => sum + transfer.amount, 0)
                .toLocaleString("en-US", { minimumFractionDigits: 2 })}
            </strong>
          </div>
        </div>
        <section className="content-section bulk-results">
          <div className="section-heading">
            <div>
              <h2>Payments in this batch</h2>
              <p>Open a payment to see its reference and current status.</p>
            </div>
          </div>
          {submitted.map((transfer) => (
            <article className="bulk-result-row" key={transfer.id}>
              <CountryBadge country={transfer.country} />
              <div className="bulk-result-payee">
                <strong>{transfer.name}</strong>
                <small>
                  {transfer.id} · {transfer.batchId}
                </small>
              </div>
              <strong className="bulk-result-amount">
                USD {transfer.amount.toFixed(2)}
              </strong>
              <span className="status status-processing">
                <i />
                Processing
              </span>
              <button
                className="button button-secondary button-small"
                onClick={() => onTrackTransfer(transfer)}
              >
                Track payment
              </button>
            </article>
          ))}
        </section>
        <p className="prototype-caption">
          Demo payment references are also available in Track transaction and
          Transactions.
        </p>
      </>
    );
  return (
    <>
      <PageHeading
        eyebrow="BUSINESS PAYMENTS"
        title="Bulk transfer"
        subtitle="Prepare payments together, then track each one by reference."
        action={
          <button
            className="button button-secondary"
            onClick={downloadTemplate}
          >
            <Icon name="download" size={16} /> CSV template
          </button>
        }
      />
      <section className="bulk-import-panel">
        <div className="bulk-import-icon">
          <Icon name="upload" size={22} />
        </div>
        <div className="bulk-import-copy">
          <h2>Start with a payment list</h2>
          <p>
            Upload a CSV with recipient, country, account and amount columns.
            You can review and edit each payment before creating the batch.
          </p>
        </div>
        <label className="button button-primary bulk-file-button">
          <Icon name="upload" size={16} /> Choose CSV
          <input
            type="file"
            accept=".csv,text/csv"
            onChange={(event) => {
              void importCsv(event.target.files?.[0]);
              event.currentTarget.value = "";
            }}
          />
        </label>
      </section>
      <div className="bulk-demo-actions">
        <span>Or start with sample data</span>
        <button className="link-button" onClick={loadSample}>
          Load sample payments <span>→</span>
        </button>
      </div>
      {error && (
        <div
          className={
            "notice " +
            (error.includes("imported") || error.includes("Sample")
              ? "success-notice"
              : "error-notice")
          }
        >
          {error}
        </div>
      )}
      <section className="content-section bulk-editor">
        <div className="section-heading">
          <div>
            <h2>Review payments</h2>
            <p>
              {rows.length} {rows.length === 1 ? "payment" : "payments"} added
            </p>
          </div>
          <button
            className="button button-secondary button-small"
            onClick={() => addRow()}
          >
            <Icon name="plus" size={15} /> Add payment
          </button>
        </div>
        {rows.length === 0 ? (
          <div className="bulk-empty">
            <span className="bulk-empty-mark">
              <Icon name="upload" size={19} />
            </span>
            <strong>Your payment list will appear here</strong>
            <span>Upload a CSV or add recipients one at a time.</span>
          </div>
        ) : (
          <div className="bulk-rows">
            <div className="bulk-row bulk-row-heading">
              <span />
              <span>RECIPIENT</span>
              <span>COUNTRY</span>
              <span>ACCOUNT / PHONE</span>
              <span>AMOUNT · USD</span>
              <span />
            </div>
            {rows.map((row, index) => (
              <div className="bulk-row" key={row.key}>
                <span className="bulk-row-index">
                  {String(index + 1).padStart(2, "0")}
                </span>
                <input
                  aria-label={"Recipient " + (index + 1)}
                  value={row.name}
                  onChange={(event) =>
                    update(row.key, "name", event.target.value)
                  }
                  placeholder="Recipient name"
                />
                <CountrySelect
                  value={row.country}
                  onChange={(country: string) => update(row.key, "country", country)}
                />
                <input
                  aria-label={"Account " + (index + 1)}
                  value={row.account}
                  onChange={(event) =>
                    update(row.key, "account", event.target.value)
                  }
                  placeholder="Account or phone"
                />
                <input
                  aria-label={"Amount " + (index + 1)}
                  type="number"
                  min="0.01"
                  value={row.amount}
                  onChange={(event) =>
                    update(row.key, "amount", event.target.value)
                  }
                  placeholder="0.00"
                />
                <button
                  className="icon-button bulk-remove"
                  aria-label={"Remove payment " + (index + 1)}
                  onClick={() =>
                    setRows((current) =>
                      current.filter((item) => item.key !== row.key),
                    )
                  }
                >
                  <Icon name="close" size={16} />
                </button>
                {rowError(row) && (
                  <small className="bulk-row-error">{rowError(row)}</small>
                )}
              </div>
            ))}
          </div>
        )}
        {rows.length > 0 && (
          <footer className="bulk-editor-footer">
            <div>
              <span>{validRows.length} ready</span>
              <strong>
                Batch total · USD{" "}
                {total.toLocaleString("en-US", {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </strong>
            </div>
            <button
              className="button button-primary"
              onClick={createBatch}
              disabled={validRows.length !== rows.length}
            >
              Create demo batch <span>→</span>
            </button>
          </footer>
        )}
        <p className="prototype-caption">
          Prototype only. Creating a batch records simulated payments in this
          business account; no funds are sent.
        </p>
      </section>
    </>
  );
}