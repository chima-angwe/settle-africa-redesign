const encodeParam = (value: string): string => encodeURIComponent(value);

export const transferEndpoints = {
  list: "/transactions",
  history: "/transactions",
  getById: (transferId: string) => `/transfers/${encodeParam(transferId)}`,
  create: "/transfers",
  cancel: (transferId: string) =>
    `/transfers/${encodeParam(transferId)}/cancel`,
  track: (reference: string) =>
    `/transfers/track/${encodeParam(reference)}`,
  quote: "/transfers/quote",
  bulkCreate: "/transfers/bulk",
} as const;
