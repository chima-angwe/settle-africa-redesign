import type { Transfer } from "./types";

export const initialTransfers: Transfer[] = [
  {
    id: "ST-240918",
    name: "Sarah Okafor",
    country: "Nigeria",
    amount: 250,
    currency: "USD",
    status: "Completed",
    date: "Today, 10:42 AM",
  },
  {
    id: "ST-240905",
    name: "David Kamau",
    country: "Kenya",
    amount: 120,
    currency: "USD",
    status: "Processing",
    date: "Yesterday, 4:18 PM",
  },
  {
    id: "ST-240872",
    name: "Amara Boateng",
    country: "Ghana",
    amount: 80,
    currency: "USD",
    status: "Completed",
    date: "Oct 18, 2026",
  },
  {
    id: "ST-240841",
    name: "Sarah Okafor",
    country: "Nigeria",
    amount: 200,
    currency: "USD",
    status: "Pending",
    date: "Oct 16, 2026",
  },
];

export const businessTransfers: Transfer[] = [
  {
    id: "BZ-1042",
    name: "Nuru Office Supplies",
    country: "Kenya",
    amount: 184,
    currency: "USD",
    status: "Processing",
    date: "Today, 9:15 AM",
  },
  {
    id: "BZ-1038",
    name: "Kora Logistics Ltd",
    country: "Ghana",
    amount: 95,
    currency: "USD",
    status: "Completed",
    date: "Yesterday, 2:40 PM",
  },
  {
    id: "BZ-1031",
    name: "Amina Yusuf",
    country: "Nigeria",
    amount: 320,
    currency: "USD",
    status: "Completed",
    date: "Oct 22, 2026",
  },
];

