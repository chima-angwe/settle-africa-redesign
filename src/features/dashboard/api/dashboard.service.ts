import { apiClient, dashboardEndpoints } from "@/shared/api";
import { mapDashboardCentralResponseToDomain } from "./dashboard.mapper";
import type {
  DashboardCentralResponseDto,
  DashboardSummary,
} from "./dashboard.types";

export const dashboardService = {
  getCentral: async (signal?: AbortSignal): Promise<DashboardSummary> => {
    const response = await apiClient.get<DashboardCentralResponseDto>(
      dashboardEndpoints.central,
      { signal },
    );

    return mapDashboardCentralResponseToDomain(response.data);
  },
};
