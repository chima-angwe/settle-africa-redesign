import { apiClient, transferEndpoints } from "@/shared/api";
import { mapTrackTransactionResponseToDomain } from "./track-transfer.mapper";
import type {
  TrackTransactionRequest,
  TrackTransactionResponseDto,
  TrackTransactionResult,
} from "./track-transfer.types";

export const trackTransferService = {
  trackTransaction: async (
    payload: TrackTransactionRequest,
    signal?: AbortSignal,
  ): Promise<TrackTransactionResult> => {
    const response = await apiClient.post<TrackTransactionResponseDto>(
      transferEndpoints.track,
      payload,
      { signal },
    );

    return mapTrackTransactionResponseToDomain(response.data);
  },
};
