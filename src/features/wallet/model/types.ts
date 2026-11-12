export interface LinkedBankBalance {
  id: string;
  bank: string;
  account: string; // last 4 digits
  mandateRef: string;
  isDefault?: boolean;
  country: string;
  balance: number;
  currency: string;
}

export interface AirtimeOperator {
  name: string;
  code: string;
}

export type TopupMode = "airtime" | "data";

export type DataPlanCategory = "Daily" | "Weekly" | "Monthly";

export interface DataPlan {
  id: string;
  dataAmount: string;
  validity: string;
  price: number;
  category: DataPlanCategory;
  note?: string;
}

export interface AirtimeTransaction {
  id: string;
  type?: TopupMode;
  operator: string;
  phoneNumber: string;
  amount: number;
  currency: string;
  bankName: string;
  date: string;
  reference: string;
  status: "Completed" | "Processing" | "Failed";
  planName?: string;
  validity?: string;
}

