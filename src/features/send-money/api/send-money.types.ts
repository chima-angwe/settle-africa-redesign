import type { ScheduleConfig } from "../model/schedule";
import type { PersonalPaymentMethod } from "../model/data";
import type { PayoutMethod } from "../model/useSendMoneyFlow";

export type RecipientCategory = "individual" | "business";

export interface SendFundsSchedulePayload {
  type: "now" | "schedule later" | "recurring" | string;
  date: string;
}

export interface SendFundsDestinationDetailsPayload {
  phone: string;
  mail: string;
  address: string;
}

export interface SendFundsDestinationPayload {
  country: string;
  name: string;
  category: string;
  means: string;
  meansid: number;
  method: string;
  details: SendFundsDestinationDetailsPayload;
}

export interface SendFundsInstrumentPayload {
  type: string;
  number: string;
  expiry: string;
  cvv: string;
}

export interface SendFundsAuthDataPayload {
  pin: number;
  otp: string;
  biotoken: string;
}

export interface SendFundsRequest {
  amount: number;
  narration: string;
  whentosend: SendFundsSchedulePayload;
  destination: SendFundsDestinationPayload;
  instrument: SendFundsInstrumentPayload;
  geoip: string;
  authdata: SendFundsAuthDataPayload;
  signature: string;
}

export interface SendFundsPayToDto {
  bankname?: unknown;
  accountno?: unknown;
  accountname?: unknown;
}

export interface SendFundsPayTo {
  bankName: string;
  accountNumber: string;
  accountName: string;
}

export interface SendFundsResponseDataDto {
  id?: unknown;
  reference?: unknown;
  status?: unknown;
  amount?: unknown;
  statusdate?: unknown;
  recipient?: unknown;
  bank?: unknown;
  payto?: SendFundsPayToDto | null;
  destination?: Record<string, unknown> | null;
  source?: Record<string, unknown> | null;
}

export interface SendFundsResponseDto {
  status: string;
  message: string;
  code?: string | number;
  locale?: string;
  data: SendFundsResponseDataDto;
}

export interface SendFundsResult {
  status: string;
  transactionStatus: "Pending" | "Completed" | "Processing" | "Failed" | "Cancelled";
  rawStatus: string;
  message: string;
  reference: string;
  amount: number;
  recipient: string;
  bank: string;
  statusDate: string;
  payTo?: SendFundsPayTo;
}

export interface SendFundsFormInput {
  amount: number;
  narration: string;
  schedule: ScheduleConfig;
  targetCountry: string;
  recipientName: string;
  recipientCategory: RecipientCategory;
  bankName: string;
  meansId?: number;
  payoutMethod: PayoutMethod;
  recipientPhone: string;
  recipientEmail: string;
  recipientAddress: string;
  paymentMethod: PersonalPaymentMethod;
  bankAccountNumber: string;
  cardNumber: string;
  cardExpiry: string;
  cardCvv: string;
  senderPhone: string;
  pin: string;
  otp?: string;
  biotoken?: string;
  geoip?: string;
}

export interface AccountLookupResponseDataDto {
  name?: unknown;
}

export interface AccountLookupResponseDto {
  status: string;
  message?: string;
  code?: string | number;
  data?: AccountLookupResponseDataDto | null;
}

export interface AccountLookupResult {
  name: string;
}

export interface CombiCheckDestinationPayload {
  country: string;
  category: string;
  means: string;
}

export interface CombiCheckInstrumentPayload {
  type: string;
}

export interface CombiCheckRequest {
  amount: string;
  destination: CombiCheckDestinationPayload;
  instrument: CombiCheckInstrumentPayload;
}

export interface CombiCheckResponseDataDto {
  allowed?: unknown;
  fee?: unknown;
  message?: unknown;
  reason?: unknown;
}

export interface CombiCheckResponseDto {
  status: string;
  message?: string;
  data?: CombiCheckResponseDataDto | null;
}

export interface CombiCheckResult {
  allowed: boolean;
  fee: number;
  message?: string;
}
