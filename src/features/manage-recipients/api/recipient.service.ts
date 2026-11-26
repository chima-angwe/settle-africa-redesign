import type { Recipient } from "@/entities/recipient";
import { apiClient, recipientEndpoints } from "@/shared/api";
import {
  mapRecipientDtoToDomain,
  mapRecipientListDtoToDomain,
} from "./recipient.mapper";
import type {
  CreateRecipientRequest,
  RecipientDto,
  RecipientFilters,
  RecipientListResponseDto,
  RecipientListResult,
  UpdateRecipientRequest,
} from "./recipient.types";

function serializeRecipientFilters(
  filters?: RecipientFilters,
): Record<string, string | number> | undefined {
  if (!filters) {
    return undefined;
  }

  const params: Record<string, string | number> = {};

  if (filters.search?.trim()) params.search = filters.search.trim();
  if (filters.country?.trim()) params.country = filters.country.trim();
  if (filters.method?.trim()) params.method = filters.method.trim();
  if (filters.page !== undefined) params.page = filters.page;
  if (filters.limit !== undefined) params.limit = filters.limit;
  if (filters.sortBy?.trim()) params.sortBy = filters.sortBy.trim();
  if (filters.sortOrder) params.sortOrder = filters.sortOrder;

  return Object.keys(params).length > 0 ? params : undefined;
}

export const recipientService = {
  getRecipients: async (
    filters?: RecipientFilters,
    signal?: AbortSignal,
  ): Promise<RecipientListResult> => {
    const response = await apiClient.get<RecipientListResponseDto>(
      recipientEndpoints.list,
      {
        params: serializeRecipientFilters(filters),
        signal,
      },
    );

    return mapRecipientListDtoToDomain(response.data);
  },

  getRecipientById: async (
    recipientId: string | number,
    signal?: AbortSignal,
  ): Promise<Recipient> => {
    const response = await apiClient.get<RecipientDto>(
      recipientEndpoints.getById(recipientId),
      { signal },
    );

    return mapRecipientDtoToDomain(response.data);
  },

  createRecipient: async (
    payload: CreateRecipientRequest,
  ): Promise<Recipient> => {
    const response = await apiClient.post<RecipientDto>(
      recipientEndpoints.create,
      payload,
    );

    return mapRecipientDtoToDomain(response.data);
  },

  updateRecipient: async (
    recipientId: string | number,
    payload: UpdateRecipientRequest,
  ): Promise<Recipient> => {
    const response = await apiClient.patch<RecipientDto>(
      recipientEndpoints.update(recipientId),
      payload,
    );

    return mapRecipientDtoToDomain(response.data);
  },

  deleteRecipient: async (recipientId: string | number): Promise<void> => {
    await apiClient.delete(recipientEndpoints.delete(recipientId));
  },
};
