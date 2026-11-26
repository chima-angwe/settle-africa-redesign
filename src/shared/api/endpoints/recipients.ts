const encodeParam = (value: string | number): string =>
  encodeURIComponent(String(value));

export const recipientEndpoints = {
  list: "/recipients",
  getById: (recipientId: string | number) =>
    `/recipients/${encodeParam(recipientId)}`,
  create: "/recipients",
  update: (recipientId: string | number) =>
    `/recipients/${encodeParam(recipientId)}`,
  delete: (recipientId: string | number) =>
    `/recipients/${encodeParam(recipientId)}`,
} as const;
