import type { Transfer } from "@/entities/transfer";
import { countryCurrencies } from "@/entities/country";

const FALLBACK_USD_RATES: Record<string, number> = {
  NGN: 1550,
  GHS: 15.2,
  KES: 129,
  UGX: 3720,
  TZS: 2670,
  RWF: 1370,
  EGP: 48.5,
  ZAR: 18.2,
  XOF: 610,
};

export function formatTransferTimestamp(date: Date = new Date()): string {
  const formatted = date.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
  return `Today, ${formatted}`;
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export function buildReceiptData(transfer: Transfer) {
  const toCurrency =
    transfer.recipientCurrency || countryCurrencies[transfer.country] || "NGN";
  const rate = transfer.exchangeRate ?? FALLBACK_USD_RATES[toCurrency] ?? 1;
  const feeAmount = transfer.feeAmount ?? 2.99;
  const feeCurrency = transfer.feeCurrency || transfer.currency;
  const recipientAmount =
    transfer.recipientAmount ?? (transfer.usdAmount ?? transfer.amount) * rate;
  const totalDebited =
    feeCurrency === transfer.currency ? transfer.amount + feeAmount : transfer.amount;

  return {
    reference: transfer.id,
    date: transfer.date,
    status: transfer.status,
    recipient: transfer.name,
    country: transfer.country,
    method: transfer.method || "Bank transfer",
    provider: transfer.provider || "Partner clearing rail",
    amountSent: `${transfer.amount.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ${transfer.currency}`,
    fee: `${feeAmount.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ${feeCurrency}`,
    totalDebited: `${totalDebited.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ${transfer.currency}`,
    exchangeRate: `1 ${transfer.currency} = ${rate.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 4 })} ${toCurrency}`,
    recipientGets: `${recipientAmount.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ${toCurrency}`,
    schedule: transfer.schedule,
    description: transfer.description,
    pickupCode: transfer.pickupCode,
    pickupCity: transfer.pickupCity,
    deliveryInstructions: transfer.deliveryInstructions,
    reason: transfer.failureReason || transfer.cancellationReason,
  };
}

export function downloadTransferReceipt(transfer: Transfer): void {
  const receipt = buildReceiptData(transfer);
  const rows: [string, string][] = [
    ["Transaction reference", receipt.reference],
    ["Status", receipt.status],
    ["Date", receipt.date],
    ["Recipient", `${receipt.recipient} (${receipt.country})`],
    [
      "Payout method",
      `${receipt.method} · ${receipt.provider}${receipt.pickupCity ? ` (${receipt.pickupCity})` : ""}`,
    ],
    ["Amount sent", receipt.amountSent],
    ["Exchange rate", receipt.exchangeRate],
    ["Transfer fee", receipt.fee],
    ["Total debited", receipt.totalDebited],
    ["Recipient gets", receipt.recipientGets],
  ];
  if (receipt.pickupCode) rows.push(["Pickup code", receipt.pickupCode]);
  if (receipt.schedule) rows.push(["Schedule", receipt.schedule]);
  if (receipt.description) rows.push(["Reference note", receipt.description]);
  if (receipt.deliveryInstructions) {
    rows.push(["Delivery instructions", receipt.deliveryInstructions]);
  }
  if (receipt.reason) rows.push(["Status note", receipt.reason]);

  const rowsHtml = rows
    .map(
      ([label, value]) =>
        `<tr><th>${escapeHtml(label)}</th><td>${escapeHtml(value)}</td></tr>`,
    )
    .join("");

  const html = `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <title>Settle Africa Receipt — ${escapeHtml(receipt.reference)}</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; background: #f5f5f3; color: #101010; margin: 0; padding: 32px 16px; }
    .card { max-width: 520px; margin: 0 auto; background: #fff; border: 1px solid #e3e3e0; border-radius: 16px; padding: 28px; }
    .brand { font-size: 13px; font-weight: 700; letter-spacing: 0.04em; text-transform: uppercase; color: #717171; margin-bottom: 6px; }
    h1 { font-size: 22px; margin: 0 0 4px; }
    .sub { font-size: 13px; color: #717171; margin: 0 0 20px; }
    table { width: 100%; border-collapse: collapse; font-size: 13px; }
    th, td { padding: 10px 0; border-top: 1px solid #e3e3e0; text-align: left; }
    th { color: #717171; font-weight: 500; width: 44%; }
    td { text-align: right; font-weight: 600; color: #101010; }
    .foot { margin-top: 20px; font-size: 11px; color: #717171; text-align: center; }
  </style>
</head>
<body>
  <div class="card">
    <div class="brand">Settle Africa</div>
    <h1>Transfer Receipt</h1>
    <p class="sub">${escapeHtml(receipt.reference)} · ${escapeHtml(receipt.status)}</p>
    <table>${rowsHtml}</table>
    <p class="foot">Generated from Settle Africa · Keep this receipt for your records.</p>
  </div>
</body>
</html>`;

  const blob = new Blob([html], { type: "text/html;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `settle-receipt-${transfer.id}.html`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
