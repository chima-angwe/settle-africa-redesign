export interface TransactionHistoryItemDto {
  id: string;
  recipient: string;
  country: string;
  amount: number;
  status: string;
  timestamp: string;
}

export interface TransactionHistoryResponseDto {
  status: string;
  data: TransactionHistoryItemDto[];
}
