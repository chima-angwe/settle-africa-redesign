const encodeParam = (value: string): string => encodeURIComponent(value);

export const transferEndpoints = {
  list: "/transactions",
  history: "/transactions",
  send: "/send",
  combicheck: "/combicheck",
  lookup: (actno: string, bankId: string) =>
    `/lookup/${encodeParam(actno)}/${encodeParam(bankId)}`,
  getById: (transferId: string) => `/transfers/${encodeParam(transferId)}`,
  create: "/transfers",
  cancel: (transferId: string) =>
    `/transfers/${encodeParam(transferId)}/cancel`,
  track: "/track",
  quote: "/transfers/quote",
  bulkCreate: "/transfers/bulk",
} as const;
