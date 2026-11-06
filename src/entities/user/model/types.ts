import type { AccountType } from "@/shared/types";

export interface UserProfile {
  name: string;
  email: string;
  phone: string;
  country: string;
  accountType: AccountType;
  businessName?: string;
  businessCategory?: string;
  occupation?: string;
  dateOfBirth?: string;
  address?: string;
}

