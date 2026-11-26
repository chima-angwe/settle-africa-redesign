export type MeansOfIdType =
  | "National ID"
  | "International Passport"
  | "Driver's Licence"
  | "Voter's Card";

export const MEANS_OF_ID_OPTIONS: readonly MeansOfIdType[] = [
  "National ID",
  "International Passport",
  "Driver's Licence",
  "Voter's Card",
];

export type BusinessMeansOfIdType =
  | "Certificate of Incorporation"
  | "CAC Registration"
  | "Business Permit"
  | "Tax Identification (TIN)"
  | "Other";

export const BUSINESS_MEANS_OF_ID_OPTIONS: readonly BusinessMeansOfIdType[] = [
  "Certificate of Incorporation",
  "CAC Registration",
  "Business Permit",
  "Tax Identification (TIN)",
  "Other",
];

export interface RegisterIdentityPayload {
  name: string;
  meansofid: string;
  idno: string;
  idfile: string;
  country: string;
  phone: string;
}

export type RegisterIndividualIdentityPayload = RegisterIdentityPayload;

export interface RegisterBusinessDetailsPayload {
  name: string;
  phone: string;
  address: string;
  meansofid: string;
  idno: string;
  idfile: string;
  country: string;
}

export interface RegisterAuthDataPayload {
  pin: string;
}

export type RegisterIndividualAuthDataPayload = RegisterAuthDataPayload;

export interface RegisterIndividualRequest {
  password: string;
  type: "individual";
  geoip: string;
  country: string;
  identity: RegisterIdentityPayload;
  authdata: RegisterAuthDataPayload;
}

export interface RegisterBusinessRequest {
  type: "business";
  geoip: string;
  country: string;
  password: string;
  identity: RegisterIdentityPayload;
  business: RegisterBusinessDetailsPayload;
  authdata: RegisterAuthDataPayload;
}

export interface RegisterResponseDto {
  status: string;
  vault: string;
  code: string;
}

export type RegisterIndividualResponseDto = RegisterResponseDto;
export type RegisterBusinessResponseDto = RegisterResponseDto;

export interface RegisterResult {
  status: string;
  vault: string;
  code: string;
}

export type RegisterIndividualResult = RegisterResult;
export type RegisterBusinessResult = RegisterResult;

export interface RegisterIndividualFormInput {
  password: string;
  country: string;
  name: string;
  meansOfId: string;
  idNumber: string;
  idFile: string;
  idCountry?: string;
  phone: string;
  pin: string;
  geoip?: string;
}

export interface RegisterBusinessFormInput {
  password: string;
  country: string;
  name: string;
  meansOfId: string;
  idNumber: string;
  idFile: string;
  idCountry?: string;
  phone: string;
  businessName: string;
  businessPhone: string;
  businessAddress: string;
  businessMeansOfId: string;
  businessIdNumber: string;
  businessIdFile: string;
  businessCountry?: string;
  pin: string;
  geoip?: string;
}

export interface LoginRequest {
  phone: string;
  password: string;
}

export interface LoginResponseDataDto {
  phone: string;
  token: string;
  expiry: string;
}

export interface LoginResponseDto {
  status: string;
  vault: string;
  message: string;
  code: string;
  locale?: string;
  data: LoginResponseDataDto;
}

export interface LoginResult {
  status: string;
  message: string;
  locale?: string;
  authHeaders: {
    vault: string;
    code: string;
    phone: string;
    token: string;
    expiry: string;
  };
}

export type OtpPurpose = "registration" | (string & {});

export interface RequestOtpRequest {
  phone: string;
  purpose: OtpPurpose;
}

export interface VerifyOtpRequest {
  phone: string;
  key: string;
}

export interface OtpStatusResponseDto {
  status: string;
  message: string;
}

export interface OtpStatusResult {
  status: string;
  message: string;
}
