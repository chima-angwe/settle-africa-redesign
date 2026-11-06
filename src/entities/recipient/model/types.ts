export interface Recipient {
  id: number;
  name: string;
  country: string;
  method: string;
  account: string;
  initials: string;
  provider?: string;
}

