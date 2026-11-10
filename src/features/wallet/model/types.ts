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

export interface AirtimeTransaction {
  id: string;
  operator: string;
  phoneNumber: string;
  amount: number;
  currency: string;
  bankName: string;
  date: string;
  reference: string;
  status: "Completed" | "Processing" | "Failed";
}

