import type { RecipientFilters } from "./recipient.types";

export const recipientKeys = {
  all: ["recipients"] as const,
  lists: () => [...recipientKeys.all, "list"] as const,
  list: (filters: RecipientFilters = {}) =>
    [...recipientKeys.lists(), filters] as const,
  details: () => [...recipientKeys.all, "detail"] as const,
  detail: (recipientId: string | number) =>
    [...recipientKeys.details(), String(recipientId)] as const,
};
