const encodeParam = (value: string): string => encodeURIComponent(value);

export const walletEndpoints = {
  linkedBanks: "/wallet/linked-banks",
  linkBank: "/wallet/linked-banks",
  unlinkBank: (bankId: string) =>
    `/wallet/linked-banks/${encodeParam(bankId)}`,
  airtimePurchase: "/wallet/airtime",
  airtimeHistory: "/wallet/airtime",
  dataPlans: "/wallet/data-plans",
} as const;
