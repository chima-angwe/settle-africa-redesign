import { useQuery } from "@tanstack/react-query";
import type { ApiError } from "@/shared/api";
import { dashboardKeys } from "../api/dashboard.keys";
import { dashboardService } from "../api/dashboard.service";
import type { DashboardSummary } from "../api/dashboard.types";

export interface UseDashboardCentralOptions {
  enabled?: boolean;
  staleTime?: number;
}

export function useDashboardCentral(options: UseDashboardCentralOptions = {}) {
  return useQuery<DashboardSummary, ApiError>({
    queryKey: dashboardKeys.central(),
    queryFn: ({ signal }) => dashboardService.getCentral(signal),
    enabled: options.enabled ?? true,
    staleTime: options.staleTime,
  });
}
