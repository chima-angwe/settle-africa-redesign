export interface CombiCheckKeyParams {
  amount: string;
  country: string;
  category: string;
  means: string;
  instrumentType: string;
}

export const sendMoneyKeys = {
  all: ["send-money"] as const,
  lookup: (actno: string, bankId: string) =>
    [...sendMoneyKeys.all, "lookup", actno, bankId] as const,
  combiCheck: (params: CombiCheckKeyParams) =>
    [...sendMoneyKeys.all, "combicheck", params] as const,
} as const;
