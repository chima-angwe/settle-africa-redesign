export interface PaymentApprovalRequest {
  id: string;
  payee: string;
  detail: string;
  amount: string;
}

export const BUSINESS_APPROVAL_REQUESTS: PaymentApprovalRequest[] = [
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

const APPROVED_STORAGE_KEY = "settle-demo-business-approved";

export function loadApprovedIds(): string[] {
  try {
    const raw = localStorage.getItem(APPROVED_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch {
    // ignore
  }
  return [];
}

export function saveApprovedIds(ids: string[]): void {
  try {
    localStorage.setItem(APPROVED_STORAGE_KEY, JSON.stringify(ids));
    window.dispatchEvent(new Event("settle-approvals-updated"));
  } catch {
    // ignore
  }
}

