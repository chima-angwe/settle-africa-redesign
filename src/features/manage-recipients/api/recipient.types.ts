import type { Recipient } from "@/entities/recipient";
import type { PaginatedResponse, PaginationParams } from "@/shared/api";

/**
 * Query filters supported by the recipients list hook/service.
 * TODO(api-contract): Confirm exact query parameter names with backend.
 */
export interface RecipientFilters extends PaginationParams {
  search?: string;
  country?: string;
  method?: string;
}

/**
 * Raw recipient payload expected from the backend API.
 * TODO(api-contract): Replace placeholder fields with the confirmed backend DTO schema.
 */
export interface RecipientDto {
  id: number | string;
  name: string;
  country: string;
  method: string;
  account: string;
  initials?: string;
  provider?: string;
  createdAt?: string;
  updatedAt?: string;
}

export type RecipientListResponseDto =
  | RecipientDto[]
  | PaginatedResponse<RecipientDto>;

/**
 * Payload sent when creating a new recipient.
 * TODO(api-contract): Confirm required/optional fields with backend.
 */
export interface CreateRecipientRequest {
  name: string;
  country: string;
  method: string;
  account: string;
  provider?: string;
}

export type UpdateRecipientRequest = Partial<CreateRecipientRequest>;

export interface RecipientListResult {
  items: Recipient[];
  total: number;
  page: number;
  limit: number;
}
