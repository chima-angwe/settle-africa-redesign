import { keepPreviousData, useQuery } from "@tanstack/react-query";
import type { Recipient } from "@/entities/recipient";
import type { ApiError } from "@/shared/api";
import { recipientKeys } from "../api/recipient.keys";
import { recipientService } from "../api/recipient.service";
import type {
  RecipientFilters,
  RecipientListResult,
} from "../api/recipient.types";

export interface UseRecipientsOptions {
  enabled?: boolean;
  staleTime?: number;
}

export function useRecipients(
  filters: RecipientFilters = {},
  options: UseRecipientsOptions = {},
) {
  return useQuery<RecipientListResult, ApiError>({
    queryKey: recipientKeys.list(filters),
    queryFn: ({ signal }) => recipientService.getRecipients(filters, signal),
    enabled: options.enabled ?? true,
    staleTime: options.staleTime,
    placeholderData: keepPreviousData,
  });
}

export function useRecipient(
  recipientId: string | number | null | undefined,
  options: { enabled?: boolean } = {},
) {
  const hasRecipientId =
    recipientId !== null && recipientId !== undefined && String(recipientId) !== "";

  return useQuery<Recipient, ApiError>({
    queryKey: recipientKeys.detail(recipientId ?? ""),
    queryFn: ({ signal }) => {
      if (!hasRecipientId) {
        return Promise.reject(new Error("Recipient ID is required."));
      }
      return recipientService.getRecipientById(recipientId, signal);
    },
    enabled: (options.enabled ?? true) && hasRecipientId,
  });
}
