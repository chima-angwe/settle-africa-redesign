export interface DashboardCentralDataDto {
  limit: number;
  today: number;
  thisweek: number;
  fullname: string;
  phone: string;
  countryid: string;
  category: string;
}

export interface DashboardCentralResponseDto {
  status: string;
  data: DashboardCentralDataDto;
  message?: string;
  code?: number;
}

export interface DashboardSummary {
  limit: number;
  today: number;
  thisWeek: number;
  fullName: string;
  phone: string;
  countryId: string;
  category: string;
  message?: string;
}
