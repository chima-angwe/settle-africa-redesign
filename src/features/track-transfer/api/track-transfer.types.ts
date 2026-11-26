import type { TransferStatus } from "@/entities/transfer";

export interface TrackTransactionDestinationPayload {
  country: string;
}

export interface TrackTransactionRequest {
  id: string;
  name: string;
  destinaton: TrackTransactionDestinationPayload;
}

export interface TrackTransactionResponseDataDto {
  id?: unknown;
  status?: unknown;
  timestamp?: unknown;
  statusdate?: unknown;
  message?: unknown;
  reason?: unknown;
}

export interface TrackTransactionResponseDto {
  status: string;
  message?: string;
  code?: string | number;
  data?: TrackTransactionResponseDataDto | null;
}

export interface TrackTransactionResult {
  id: string;
  status: TransferStatus;
  rawStatus: string;
  timestamp: string;
  message?: string;
}
