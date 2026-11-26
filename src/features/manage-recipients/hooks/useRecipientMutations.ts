import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { Recipient } from "@/entities/recipient";
import type { ApiError } from "@/shared/api";
import { recipientKeys } from "../api/recipient.keys";
import { recipientService } from "../api/recipient.service";
import type {
  CreateRecipientRequest,
  UpdateRecipientRequest,
} from "../api/recipient.types";

export function useCreateRecipient() {
  const queryClient = useQueryClient();

  return useMutation<Recipient, ApiError, CreateRecipientRequest>({
    mutationFn: (payload) => recipientService.createRecipient(payload),
    onSuccess: (created) => {
      queryClient.setQueryData(recipientKeys.detail(created.id), created);
      void queryClient.invalidateQueries({ queryKey: recipientKeys.lists() });
    },
  });
}

export interface UpdateRecipientVariables {
  recipientId: string | number;
  payload: UpdateRecipientRequest;
}

export function useUpdateRecipient() {
  const queryClient = useQueryClient();

  return useMutation<Recipient, ApiError, UpdateRecipientVariables>({
    mutationFn: ({ recipientId, payload }) =>
      recipientService.updateRecipient(recipientId, payload),
    onSuccess: (updated) => {
      queryClient.setQueryData(recipientKeys.detail(updated.id), updated);
      void queryClient.invalidateQueries({ queryKey: recipientKeys.lists() });
    },
  });
}

export function useDeleteRecipient() {
  const queryClient = useQueryClient();

  return useMutation<void, ApiError, string | number>({
    mutationFn: (recipientId) => recipientService.deleteRecipient(recipientId),
    onSuccess: (_data, recipientId) => {
      queryClient.removeQueries({
        queryKey: recipientKeys.detail(recipientId),
      });
      void queryClient.invalidateQueries({ queryKey: recipientKeys.lists() });
    },
  });
}
