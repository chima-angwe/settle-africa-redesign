import type { Recipient } from "./types";

export const initialRecipients: Recipient[] = [
  {
    id: 1,
    name: "Sarah Okafor",
    country: "Nigeria",
    method: "Bank transfer",
    account: "•••• 6789",
    initials: "SO",
    provider: "GTBank",
  },
  {
    id: 2,
    name: "David Kamau",
    country: "Kenya",
    method: "M-Pesa",
    account: "+254 ••• •• 456",
    initials: "DK",
    provider: "M-Pesa",
  },
  {
    id: 3,
    name: "Amara Boateng",
    country: "Ghana",
    method: "Mobile money",
    account: "•••• 3456",
    initials: "AB",
    provider: "MTN MoMo",
  },
];

export const businessRecipients: Recipient[] = [
  {
    id: 11,
    name: "Nuru Office Supplies",
    country: "Kenya",
    method: "Bank transfer",
    account: "•••• 0912",
    initials: "NO",
    provider: "Equity Bank",
  },
  {
    id: 12,
    name: "Kora Logistics Ltd",
    country: "Ghana",
    method: "Bank transfer",
    account: "•••• 4421",
    initials: "KL",
    provider: "Ecobank Ghana",
  },
  {
    id: 13,
    name: "Amina Yusuf",
    country: "Nigeria",
    method: "Bank transfer",
    account: "•••• 8830",
    initials: "AY",
    provider: "Zenith Bank",
  },
];

