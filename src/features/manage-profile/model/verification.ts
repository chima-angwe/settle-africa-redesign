import type { AccountType } from "@/shared/types";

export type VerificationStatus =
  | "not_started"
  | "pending"
  | "approved"
  | "unsuccessful";

export type VerificationDocumentType =
  | "National ID"
  | "International Passport"
  | "Driver's Licence"
  | "Voter's Card";

export const VERIFICATION_DOCUMENT_TYPES: readonly VerificationDocumentType[] = [
  "National ID",
  "International Passport",
  "Driver's Licence",
  "Voter's Card",
];

export interface VerificationPersonalDetails {
  fullName: string;
  email: string;
  phone: string;
  dateOfBirth: string;
  country: string;
  address: string;
  occupation: string;
  businessName: string;
  businessRegistrationNumber: string;
  businessCategory: string;
}

export interface VerificationDocumentDetails {
  documentType: VerificationDocumentType;
  documentNumber: string;
  issuingCountry: string;
  expiryDate: string;
  frontFileName: string;
  frontFileSize: number;
  backFileName: string;
  backFileSize: number;
  selfieFileName: string;
  selfieFileSize: number;
}

export interface VerificationRecord {
  status: VerificationStatus;
  personal: VerificationPersonalDetails;
  document: VerificationDocumentDetails;
  referenceId?: string;
  submittedAt?: string;
  reviewedAt?: string;
  outcomeReason?: string;
  nextSteps: string[];
}

export const VERIFICATION_UPDATED_EVENT = "settle-verification-updated";
const MAX_UPLOAD_BYTES = 5 * 1024 * 1024;

function getStorageKey(accountType: AccountType) {
  return `settle_africa_kyc_${accountType}`;
}

export function isVerificationApproved(status?: VerificationStatus): boolean {
  return status === "approved";
}

export function requiresBackDocument(docType: VerificationDocumentType): boolean {
  return docType === "National ID" || docType === "Driver's Licence";
}

export function requiresExpiryDate(docType: VerificationDocumentType): boolean {
  return docType === "International Passport" || docType === "Driver's Licence";
}

export function getDefaultNextSteps(
  status: VerificationStatus,
  accountType: AccountType,
): string[] {
  if (status === "approved") {
    return [
      "Your identity verification is complete and all launch transfer corridors are unlocked.",
      "Keep your contact details up to date in Profile settings.",
    ];
  }
  if (status === "pending") {
    return [
      "Compliance review is in progress and typically takes 5–15 minutes.",
      "Outgoing transfers remain paused until verification is approved.",
      "You will receive an update in Notifications once the check finishes.",
    ];
  }
  if (status === "unsuccessful") {
    return [
      "Review the rejection reason above and verify your legal name and date of birth match your ID.",
      "Upload a clear, uncropped photo of your identity document and selfie with no glare.",
      "Resubmit your verification to unlock transfers.",
    ];
  }
  return [
    accountType === "business"
      ? "Confirm your business and authorized representative details."
      : "Confirm your personal details (legal name, date of birth, and residential address).",
    "Upload a valid government-issued identity document and selfie.",
    "Wait for compliance approval before sending transfers.",
  ];
}

function getHydratedDefaults(accountType: AccountType): VerificationRecord {
  const isBusiness = accountType === "business";
  const country =
    (typeof window !== "undefined" &&
      localStorage.getItem(`settle-demo-${accountType}-country`)) ||
    "Nigeria";
  const fullName =
    (typeof window !== "undefined" &&
      (localStorage.getItem("settle-demo-name") || "")) ||
    "Chima Angwe";
  const businessName =
    (typeof window !== "undefined" &&
      localStorage.getItem("settle-demo-business-name")) ||
    "Chima Ventures";
  const email =
    (typeof window !== "undefined" &&
      (localStorage.getItem(`settle-demo-${accountType}-email`) ||
        (!isBusiness ? localStorage.getItem("settle-demo-email") : null))) ||
    (isBusiness ? "accounts@chimaventures.example" : "chima.angwe@example.com");
  const phone =
    (typeof window !== "undefined" &&
      (localStorage.getItem(`settle-demo-${accountType}-phone`) ||
        (!isBusiness ? localStorage.getItem("settle-demo-phone") : null))) ||
    "801 234 5678";
  const dateOfBirth =
    (typeof window !== "undefined" &&
      localStorage.getItem(`settle-demo-${accountType}-dob`)) ||
    "";
  const address =
    (typeof window !== "undefined" &&
      localStorage.getItem(`settle-demo-${accountType}-address`)) ||
    "";
  const occupation =
    (typeof window !== "undefined" &&
      localStorage.getItem(`settle-demo-${accountType}-occupation`)) ||
    "";
  const businessCategory =
    (typeof window !== "undefined" &&
      localStorage.getItem("settle-demo-business-category")) ||
    "";

  return {
    status: "not_started",
    personal: {
      fullName,
      email,
      phone,
      dateOfBirth,
      country,
      address,
      occupation,
      businessName,
      businessRegistrationNumber: "",
      businessCategory,
    },
    document: {
      documentType: "National ID",
      documentNumber: "",
      issuingCountry: country,
      expiryDate: "",
      frontFileName: "",
      frontFileSize: 0,
      backFileName: "",
      backFileSize: 0,
      selfieFileName: "",
      selfieFileSize: 0,
    },
    nextSteps: getDefaultNextSteps("not_started", accountType),
  };
}

export function loadVerificationRecord(
  accountType: AccountType,
): VerificationRecord {
  const defaults = getHydratedDefaults(accountType);
  if (typeof window === "undefined") return defaults;

  try {
    const raw = localStorage.getItem(getStorageKey(accountType));
    if (!raw) return defaults;
    const parsed = JSON.parse(raw) as Partial<VerificationRecord>;
    const status: VerificationStatus =
      parsed.status === "pending" ||
      parsed.status === "approved" ||
      parsed.status === "unsuccessful"
        ? parsed.status
        : "not_started";

    return {
      status,
      personal: { ...defaults.personal, ...parsed.personal },
      document: { ...defaults.document, ...parsed.document },
      referenceId: parsed.referenceId,
      submittedAt: parsed.submittedAt,
      reviewedAt: parsed.reviewedAt,
      outcomeReason: parsed.outcomeReason,
      nextSteps:
        Array.isArray(parsed.nextSteps) && parsed.nextSteps.length > 0
          ? parsed.nextSteps
          : getDefaultNextSteps(status, accountType),
    };
  } catch {
    return defaults;
  }
}

export function saveVerificationRecord(
  accountType: AccountType,
  record: VerificationRecord,
): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(getStorageKey(accountType), JSON.stringify(record));
    window.dispatchEvent(new Event(VERIFICATION_UPDATED_EVENT));
  } catch {
    // ignore storage quota errors
  }
}

export function validatePersonalVerification(
  details: VerificationPersonalDetails,
  accountType: AccountType,
): Record<string, string> {
  const errors: Record<string, string> = {};
  const trimmedName = details.fullName.trim();
  if (trimmedName.length < 3 || trimmedName.split(/\s+/).filter(Boolean).length < 2) {
    errors.fullName = "Enter your full legal name (first and last name matching your ID).";
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(details.email.trim())) {
    errors.email = "Enter a valid email address.";
  }

  const phoneDigits = details.phone.replace(/\D/g, "");
  if (phoneDigits.length < 7 || phoneDigits.length > 15) {
    errors.phone = "Enter a valid phone number (7 to 15 digits).";
  }

  if (!details.dateOfBirth) {
    errors.dateOfBirth = "Enter your date of birth.";
  } else {
    const dob = new Date(details.dateOfBirth);
    const today = new Date();
    if (Number.isNaN(dob.getTime()) || dob > today) {
      errors.dateOfBirth = "Enter a valid date of birth.";
    } else {
      const ageCutoff = new Date(
        today.getFullYear() - 18,
        today.getMonth(),
        today.getDate(),
      );
      if (dob > ageCutoff) {
        errors.dateOfBirth = "You must be at least 18 years old to verify your account.";
      }
    }
  }

  if (!details.country.trim()) {
    errors.country = "Select your country of residence.";
  }

  if (details.address.trim().length < 5) {
    errors.address = "Enter your complete residential or registered street address.";
  }

  if (accountType === "business") {
    if (details.businessName.trim().length < 2) {
      errors.businessName = "Enter your registered business name.";
    }
    if (details.businessRegistrationNumber.trim().length < 4) {
      errors.businessRegistrationNumber =
        "Enter your company registration / incorporation number.";
    }
    if (!details.businessCategory.trim()) {
      errors.businessCategory = "Select or enter your business category.";
    }
  } else if (details.occupation.trim().length < 2) {
    errors.occupation = "Enter your occupation or primary source of funds.";
  }

  return errors;
}

export function validateVerificationFile(
  file: File,
  requireImageOnly = false,
): string | null {
  if (file.size > MAX_UPLOAD_BYTES) {
    return "File must be 5 MB or smaller.";
  }
  const lower = file.name.toLowerCase();
  const isImage =
    file.type.startsWith("image/") ||
    /\.(png|jpe?g|webp|heic)$/i.test(lower);
  const isPdf = file.type === "application/pdf" || /\.pdf$/i.test(lower);
  if (requireImageOnly && !isImage) {
    return "Upload an image file (PNG, JPG, or WEBP) for your selfie.";
  }
  if (!isImage && !isPdf) {
    return "Upload a PNG, JPG, WEBP, or PDF file.";
  }
  return null;
}

export function validateDocumentSubmission(
  doc: VerificationDocumentDetails,
): Record<string, string> {
  const errors: Record<string, string> = {};
  const cleanNumber = doc.documentNumber.replace(/[\s-]+/g, "");
  if (cleanNumber.length < 6 || !/^[a-zA-Z0-9]+$/.test(cleanNumber)) {
    errors.documentNumber =
      "Enter a valid document number (at least 6 letters or numbers).";
  }

  if (!doc.issuingCountry.trim()) {
    errors.issuingCountry = "Select the issuing country.";
  }

  if (requiresExpiryDate(doc.documentType)) {
    if (!doc.expiryDate) {
      errors.expiryDate = `Enter the ${doc.documentType.toLowerCase()} expiry date.`;
    } else {
      const todayIso = new Date().toISOString().split("T")[0];
      if (doc.expiryDate <= todayIso) {
        errors.expiryDate = "Document is expired. Provide a valid, unexpired document.";
      }
    }
  }

  if (!doc.frontFileName.trim()) {
    errors.frontFileName = "Upload the front side of your identity document.";
  }

  if (requiresBackDocument(doc.documentType) && !doc.backFileName.trim()) {
    errors.backFileName = `Upload the back side of your ${doc.documentType}.`;
  }

  if (!doc.selfieFileName.trim()) {
    errors.selfieFileName = "Upload a clear front-facing selfie for identity matching.";
  }

  return errors;
}

export function syncPersonalDetailsToProfileStorage(
  accountType: AccountType,
  personal: VerificationPersonalDetails,
): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(`settle-demo-${accountType}-country`, personal.country);
  localStorage.setItem(`settle-demo-${accountType}-email`, personal.email.trim());
  localStorage.setItem(`settle-demo-${accountType}-phone`, personal.phone.trim());
  localStorage.setItem(`settle-demo-${accountType}-dob`, personal.dateOfBirth);
  localStorage.setItem(`settle-demo-${accountType}-address`, personal.address.trim());
  localStorage.setItem(
    `settle-demo-${accountType}-occupation`,
    personal.occupation.trim(),
  );
  if (accountType === "business") {
    if (personal.businessName.trim()) {
      localStorage.setItem("settle-demo-business-name", personal.businessName.trim());
    }
    if (personal.businessCategory.trim()) {
      localStorage.setItem(
        "settle-demo-business-category",
        personal.businessCategory.trim(),
      );
    }
  } else if (personal.fullName.trim()) {
    localStorage.setItem("settle-demo-name", personal.fullName.trim());
  }
}

export function submitVerificationRecord(
  accountType: AccountType,
  personal: VerificationPersonalDetails,
  document: VerificationDocumentDetails,
): VerificationRecord {
  syncPersonalDetailsToProfileStorage(accountType, personal);
  const nowLabel = new Date().toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
  const record: VerificationRecord = {
    status: "pending",
    personal,
    document,
    referenceId: `KYC-${Math.floor(100000 + Math.random() * 900000)}`,
    submittedAt: nowLabel,
    reviewedAt: undefined,
    outcomeReason: undefined,
    nextSteps: getDefaultNextSteps("pending", accountType),
  };
  saveVerificationRecord(accountType, record);
  return record;
}

export function applyVerificationDecision(
  accountType: AccountType,
  decision: "approved" | "unsuccessful",
  reason?: string,
): VerificationRecord {
  const current = loadVerificationRecord(accountType);
  const nowLabel = new Date().toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
  const outcomeReason =
    decision === "unsuccessful"
      ? reason ||
        "Document image was unclear or the submitted personal details did not match the identity document."
      : undefined;

  const updated: VerificationRecord = {
    ...current,
    status: decision,
    reviewedAt: nowLabel,
    outcomeReason,
    nextSteps: getDefaultNextSteps(decision, accountType),
  };
  saveVerificationRecord(accountType, updated);
  return updated;
}

export function getVerificationStatusMeta(
  status: VerificationStatus,
  accountType: AccountType,
  outcomeReason?: string,
) {
  const entityLabel = accountType === "business" ? "Business verification" : "Identity verification";
  if (status === "approved") {
    return {
      badge: "VERIFIED",
      title: `${entityLabel} approved`,
      description:
        "Your identity check passed. You can send local and cross-border transfers.",
      tone: "approved" as const,
      ctaLabel: "View details",
    };
  }
  if (status === "pending") {
    return {
      badge: "PENDING REVIEW",
      title: `${entityLabel} under review`,
      description:
        "We received your details and identity documents. Transfers stay locked until review completes.",
      tone: "pending" as const,
      ctaLabel: "Check status",
    };
  }
  if (status === "unsuccessful") {
    return {
      badge: "UNSUCCESSFUL",
      title: `${entityLabel} unsuccessful`,
      description:
        outcomeReason ||
        "We could not verify your identity document. Update your details or upload a clearer photo.",
      tone: "unsuccessful" as const,
      ctaLabel: "Fix & resubmit",
    };
  }
  return {
    badge: "NOT VERIFIED",
    title: `${entityLabel} required`,
    description:
      "Complete your personal details and submit a valid government ID before sending transfers.",
    tone: "not_started" as const,
    ctaLabel: "Start verification",
  };
}
