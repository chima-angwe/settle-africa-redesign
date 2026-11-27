export interface TransactionDestinationDto {
  country?: unknown;
  name?: unknown;
  category?: unknown;
  means?: unknown;
  meansid?: unknown;
  method?: unknown;
  details?: {
    phone?: unknown;
    mail?: unknown;
    address?: unknown;
  } | null;
}

export interface TransactionHistoryItemDto {
  id: unknown;
  recipient?: unknown;
  country?: unknown;
  amount: unknown;
  currency?: unknown;
  status: unknown;
  timestamp?: unknown;
  statusdate?: unknown;
  destination?: unknown;
}

export interface TransactionHistoryResponseDto {
  status: string;
  message?: string;
  code?: string | number;
  locale?: string;
  data:
    | TransactionHistoryItemDto[]
    | {
        transactions?: TransactionHistoryItemDto[];
      };
}
