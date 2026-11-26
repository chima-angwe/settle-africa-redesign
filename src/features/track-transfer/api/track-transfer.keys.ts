export const trackTransferKeys = {
  all: ["track-transfer"] as const,
  detail: (id: string) => [...trackTransferKeys.all, "detail", id] as const,
} as const;
