export type TransferStatus = "Pending" | "Completed" | "Processing";

export interface Transfer {
  id: string;
  name: string;
  country: string;
  amount: number;
  currency: string;
  status: TransferStatus;
  date: string;
  batchId?: string;
  provider?: string;
  method?: string;
  usdAmount?: number;
  recipientAmount?: number;
  recipientCurrency?: string;
  feeAmount?: number;
  feeCurrency?: string;
  exchangeRate?: number;
  description?: string;
}

export interface BulkDraft {
  key: string;
  name: string;
  country: string;
  account: string;
  amount: string;
}

