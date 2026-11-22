import type { AccountType } from "@/shared/types";

const ACCOUNTS_STORAGE_KEY = "settle-demo-accounts";

export interface StoredAccount {
  accountType: AccountType;
  country: string;
  fullName: string;
  businessName: string;
  businessRegistrationNumber?: string;
  email: string;
  phone: string;
  password: string;
  dateOfBirth: string;
  address: string;
  occupation: string;
  businessCategory: string;
}

export function isValidEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
}

export function normalizePhoneDigits(value: string): string {
  return value.replace(/\D/g, "");
}

export function isValidPhone(value: string): boolean {
  const digits = normalizePhoneDigits(value);
  return digits.length >= 7 && digits.length <= 15;
}

export function getStoredAccounts(): StoredAccount[] {
  try {
    const raw = localStorage.getItem(ACCOUNTS_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function getAccountsForType(accountType: AccountType): StoredAccount[] {
  return getStoredAccounts().filter((acc) => acc.accountType === accountType);
}

export function findAccountByIdentifier(
  accountType: AccountType,
  identifier: string,
): StoredAccount | undefined {
  const cleanEmail = identifier.trim().toLowerCase();
  const cleanDigits = normalizePhoneDigits(identifier);

  return getAccountsForType(accountType).find((acc) => {
    if (accountType === "business") {
      return acc.email.trim().toLowerCase() === cleanEmail;
    }
    const storedDigits = normalizePhoneDigits(acc.phone);
    if (cleanEmail.includes("@")) {
      return acc.email.trim().toLowerCase() === cleanEmail;
    }
    return (
      storedDigits.length > 0 &&
      (storedDigits === cleanDigits ||
        (cleanDigits.length >= 7 && storedDigits.endsWith(cleanDigits.slice(-9))) ||
        (storedDigits.length >= 7 && cleanDigits.endsWith(storedDigits.slice(-9))))
    );
  });
}

export function findAccountByEmail(
  accountType: AccountType,
  email: string,
): StoredAccount | undefined {
  const cleanEmail = email.trim().toLowerCase();
  return getAccountsForType(accountType).find(
    (acc) => acc.email.trim().toLowerCase() === cleanEmail,
  );
}

export function hasDuplicateAccount(
  accountType: AccountType,
  email: string,
  phone: string,
): boolean {
  const cleanEmail = email.trim().toLowerCase();
  const cleanDigits = normalizePhoneDigits(phone);
  return getAccountsForType(accountType).some(
    (acc) =>
      acc.email.trim().toLowerCase() === cleanEmail ||
      (cleanDigits.length >= 7 && normalizePhoneDigits(acc.phone) === cleanDigits),
  );
}

export function saveStoredAccount(account: StoredAccount): void {
  const accounts = getStoredAccounts();
  const next = [
    account,
    ...accounts.filter(
      (acc) =>
        !(
          acc.accountType === account.accountType &&
          acc.email.trim().toLowerCase() === account.email.trim().toLowerCase()
        ),
    ),
  ];
  localStorage.setItem(ACCOUNTS_STORAGE_KEY, JSON.stringify(next));
}

export function updateStoredPassword(
  accountType: AccountType,
  email: string,
  newPassword: string,
): boolean {
  const cleanEmail = email.trim().toLowerCase();
  const accounts = getStoredAccounts();
  let updated = false;
  const next = accounts.map((acc) => {
    if (
      acc.accountType === accountType &&
      acc.email.trim().toLowerCase() === cleanEmail
    ) {
      updated = true;
      return { ...acc, password: newPassword };
    }
    return acc;
  });
  if (updated) {
    localStorage.setItem(ACCOUNTS_STORAGE_KEY, JSON.stringify(next));
  }
  return updated;
}
