import type React from "react";
import { useEffect, useId, useState } from "react";
import { CountrySelect } from "@/entities/country";
import { Icon } from "@/shared/ui";
import type { AccountType } from "@/shared/types";
import {
  VERIFICATION_DOCUMENT_TYPES,
  VERIFICATION_UPDATED_EVENT,
  applyVerificationDecision,
  getVerificationStatusMeta,
  loadVerificationRecord,
  requiresBackDocument,
  requiresExpiryDate,
  saveVerificationRecord,
  submitVerificationRecord,
  syncPersonalDetailsToProfileStorage,
  validateDocumentSubmission,
  validatePersonalVerification,
  validateVerificationFile,
  type VerificationDocumentDetails,
  type VerificationDocumentType,
  type VerificationPersonalDetails,
  type VerificationRecord,
  type VerificationStatus,
} from "../model/verification";

type VerificationStep = 1 | 2 | 3;

const BUSINESS_CATEGORIES = [
  "Retail & E-commerce",
  "Logistics & Supply Chain",
  "Technology & Software",
  "Professional Services",
  "Manufacturing & Trade",
  "Agriculture & Food",
];

function formatBytes(bytes: number): string {
  if (!bytes) return "";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function StatusToneBadge({
  status,
  accountType,
}: {
  status: VerificationStatus;
  accountType: AccountType;
}) {
  const meta = getVerificationStatusMeta(status, accountType);
  const styleMap: Record<VerificationStatus, string> = {
    approved:
      "border-emerald-200 dark:border-emerald-900 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300",
    pending:
      "border-amber-200 dark:border-amber-900 bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300",
    unsuccessful:
      "border-rose-200 dark:border-rose-900 bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300",
    not_started:
      "border-line bg-paper text-ink",
  };
  const dotColorMap: Record<VerificationStatus, string> = {
    approved: "bg-emerald-500",
    pending: "bg-amber-500",
    unsuccessful: "bg-rose-500",
    not_started: "bg-rose-500",
  };
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-[10px] font-bold tracking-wider uppercase whitespace-nowrap ${styleMap[status]}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${dotColorMap[status]}`} />
      <span>{meta.badge}</span>
    </span>
  );
}

interface DocumentUploadFieldProps {
  label: string;
  helper: string;
  accept: string;
  fileName: string;
  fileSize: number;
  error?: string;
  onSelect: (file: File) => void;
  onClear: () => void;
}

function DocumentUploadField({
  label,
  helper,
  accept,
  fileName,
  fileSize,
  error,
  onSelect,
  onClear,
}: DocumentUploadFieldProps) {
  const inputId = useId();
  return (
    <div className="space-y-1.5">
      <label
        htmlFor={inputId}
        className="text-xs font-medium text-muted block"
      >
        {label}
      </label>
      <div
        className={`border rounded-xl p-3.5 bg-paper transition-colors ${
          error ? "border-rose-500" : "border-line"
        }`}
      >
        {fileName ? (
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5 min-w-0">
              <span className="w-8 h-8 rounded-lg bg-soft border border-line flex items-center justify-center shrink-0 text-ink">
                <Icon name="check" size={14} />
              </span>
              <div className="min-w-0">
                <strong className="text-xs font-semibold text-ink block truncate">
                  {fileName}
                </strong>
                {fileSize > 0 && (
                  <span className="text-[11px] text-muted block">
                    {formatBytes(fileSize)}
                  </span>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <label
                htmlFor={inputId}
                className="text-xs font-semibold text-ink hover:underline cursor-pointer"
              >
                Replace
              </label>
              <button
                type="button"
                onClick={onClear}
                className="text-xs text-muted hover:text-rose-600 dark:hover:text-rose-400 cursor-pointer"
              >
                Remove
              </button>
            </div>
          </div>
        ) : (
          <label
            htmlFor={inputId}
            className="flex items-center justify-between gap-3 cursor-pointer"
          >
            <div className="min-w-0">
              <strong className="text-xs font-semibold text-ink block">
                Choose file to upload
              </strong>
              <span className="text-[11px] text-muted block mt-0.5">
                {helper}
              </span>
            </div>
            <span className="button button-secondary button-small shrink-0">
              Upload
            </span>
          </label>
        )}
        <input
          id={inputId}
          type="file"
          accept={accept}
          className="sr-only"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) onSelect(file);
            e.target.value = "";
          }}
        />
      </div>
      {error && (
        <p className="text-[11px] text-rose-600 dark:text-rose-400">{error}</p>
      )}
    </div>
  );
}

export interface VerificationGateBannerProps {
  status: VerificationStatus;
  accountType?: AccountType;
  outcomeReason?: string;
  onOpenVerification?: () => void;
  className?: string;
}

export function VerificationGateBanner({
  status,
  accountType = "individual",
  outcomeReason,
  onOpenVerification,
  className = "",
}: VerificationGateBannerProps) {
  if (status === "approved") return null;
  const meta = getVerificationStatusMeta(status, accountType, outcomeReason);
  const record = loadVerificationRecord(accountType);
  const steps = record.nextSteps;

  return (
    <div
      role="alert"
      className={`rounded-2xl border p-4 sm:p-5 space-y-3 ${
        status === "unsuccessful"
          ? "border-rose-200 dark:border-rose-900 bg-rose-50/70 dark:bg-rose-950/30"
          : status === "pending"
            ? "border-amber-200 dark:border-amber-900 bg-amber-50/70 dark:bg-amber-950/30"
            : "border-line bg-soft"
      } ${className}`}
    >
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
        <div className="flex items-start gap-3 min-w-0">
          <span className="w-9 h-9 rounded-xl bg-paper border border-line flex items-center justify-center shrink-0 text-ink">
            <Icon name="shield" size={17} />
          </span>
          <div className="space-y-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <strong className="text-sm font-heading font-bold text-ink">
                {meta.title}
              </strong>
              <StatusToneBadge status={status} accountType={accountType} />
            </div>
            <p className="text-xs text-muted leading-relaxed m-0">
              {meta.description}
            </p>
          </div>
        </div>
        {onOpenVerification && (
          <button
            type="button"
            onClick={onOpenVerification}
            className="button button-primary h-9 px-4 rounded-xl text-xs font-semibold shrink-0 cursor-pointer self-start"
          >
            {meta.ctaLabel}
          </button>
        )}
      </div>

      {steps.length > 0 && (
        <div className="pt-2 border-t border-line/70 text-[11px] text-muted space-y-1">
          <span className="font-semibold text-ink block">Next steps</span>
          <ul className="list-disc pl-4 space-y-0.5 m-0">
            {steps.map((step) => (
              <li key={step}>{step}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

export interface VerificationFlowProps {
  accountType: AccountType;
  forceExpanded?: boolean;
  onNotice?: (message: string) => void;
  onProfileSynced?: (name: string) => void;
  onStartTransfer?: () => void;
}

export function VerificationFlow({
  accountType,
  forceExpanded = false,
  onNotice,
  onProfileSynced,
  onStartTransfer,
}: VerificationFlowProps) {
  const isBusiness = accountType === "business";
  const [record, setRecord] = useState<VerificationRecord>(() =>
    loadVerificationRecord(accountType),
  );
  const [manualExpanded, setManualExpanded] = useState<boolean | null>(null);
  const expanded = manualExpanded ?? (forceExpanded || record.status !== "approved");
  const [step, setStep] = useState<VerificationStep>(() => {
    const initial = loadVerificationRecord(accountType);
    return initial.status === "not_started" ? 1 : 3;
  });
  const [personal, setPersonal] = useState<VerificationPersonalDetails>(
    () => record.personal,
  );
  const [document, setDocument] = useState<VerificationDocumentDetails>(
    () => record.document,
  );
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    const syncFromStorage = () => {
      const next = loadVerificationRecord(accountType);
      setRecord(next);
      setPersonal(next.personal);
      setDocument(next.document);
    };
    window.addEventListener(VERIFICATION_UPDATED_EVENT, syncFromStorage);
    return () =>
      window.removeEventListener(VERIFICATION_UPDATED_EVENT, syncFromStorage);
  }, [accountType]);

  const meta = getVerificationStatusMeta(
    record.status,
    accountType,
    record.outcomeReason,
  );

  const updatePersonalField = <K extends keyof VerificationPersonalDetails>(
    key: K,
    value: VerificationPersonalDetails[K],
  ) => {
    setPersonal((prev) => ({ ...prev, [key]: value }));
    setErrors((prev) => {
      if (!prev[key]) return prev;
      const next = { ...prev };
      delete next[key];
      return next;
    });
  };

  const updateDocumentField = <K extends keyof VerificationDocumentDetails>(
    key: K,
    value: VerificationDocumentDetails[K],
  ) => {
    setDocument((prev) => ({ ...prev, [key]: value }));
    setErrors((prev) => {
      if (!prev[key]) return prev;
      const next = { ...prev };
      delete next[key];
      return next;
    });
  };

  const handleFilePick = (
    target: "front" | "back" | "selfie",
    file: File,
  ) => {
    const fileErr = validateVerificationFile(file, target === "selfie");
    const errKey =
      target === "front"
        ? "frontFileName"
        : target === "back"
          ? "backFileName"
          : "selfieFileName";
    if (fileErr) {
      setErrors((prev) => ({ ...prev, [errKey]: fileErr }));
      return;
    }
    setErrors((prev) => {
      const next = { ...prev };
      delete next[errKey];
      return next;
    });
    if (target === "front") {
      setDocument((prev) => ({
        ...prev,
        frontFileName: file.name,
        frontFileSize: file.size,
      }));
    } else if (target === "back") {
      setDocument((prev) => ({
        ...prev,
        backFileName: file.name,
        backFileSize: file.size,
      }));
    } else {
      setDocument((prev) => ({
        ...prev,
        selfieFileName: file.name,
        selfieFileSize: file.size,
      }));
    }
  };

  const handleContinueToDocuments = (event: React.FormEvent) => {
    event.preventDefault();
    const validationErrors = validatePersonalVerification(personal, accountType);
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }
    setErrors({});
    const updatedRecord: VerificationRecord = {
      ...record,
      personal,
      document: {
        ...document,
        issuingCountry: document.issuingCountry || personal.country,
      },
    };
    saveVerificationRecord(accountType, updatedRecord);
    syncPersonalDetailsToProfileStorage(accountType, personal);
    onProfileSynced?.(isBusiness ? personal.businessName : personal.fullName);
    setRecord(updatedRecord);
    setStep(2);
  };

  const handleSubmitVerification = (event: React.FormEvent) => {
    event.preventDefault();
    const docErrors = validateDocumentSubmission(document);
    if (Object.keys(docErrors).length > 0) {
      setErrors(docErrors);
      return;
    }
    setErrors({});
    const submitted = submitVerificationRecord(accountType, personal, document);
    setRecord(submitted);
    onProfileSynced?.(isBusiness ? personal.businessName : personal.fullName);
    onNotice?.("Verification submitted and currently pending review.");
    setStep(3);
  };

  const handleDecisionSimulation = (decision: "approved" | "unsuccessful") => {
    const updated = applyVerificationDecision(accountType, decision);
    setRecord(updated);
    onNotice?.(
      decision === "approved"
        ? "Verification approved. Transfers are now unlocked."
        : "Verification marked unsuccessful. Review the next steps to resubmit.",
    );
  };

  const stepItems: { id: VerificationStep; label: string }[] = [
    { id: 1, label: isBusiness ? "1. Business & Rep" : "1. Personal details" },
    { id: 2, label: "2. Identity document" },
    { id: 3, label: "3. Status" },
  ];

  return (
    <section className="profile-kyc-panel space-y-4">
      <div className="profile-section-heading">
        <h2>{isBusiness ? "Business verification" : "KYC & compliance"}</h2>
        <button
          type="button"
          className="cursor-pointer hover:underline"
          onClick={() => setManualExpanded(!expanded)}
        >
          {expanded ? "Hide steps" : "Open steps"}
        </button>
      </div>

      {/* Summary Banner */}
      <div className="profile-kyc-status">
        <span className="profile-kyc-icon">
          <Icon name="shield" size={20} />
        </span>
        <div className="min-w-0">
          <strong>{meta.title}</strong>
          <p>{meta.description}</p>
        </div>
        <StatusToneBadge status={record.status} accountType={accountType} />
        <button
          type="button"
          className="button button-primary button-small cursor-pointer"
          onClick={() => {
            setManualExpanded(true);
            if (record.status === "not_started") setStep(1);
            else if (record.status === "unsuccessful") setStep(2);
            else setStep(3);
          }}
        >
          {meta.ctaLabel}
        </button>
      </div>

      {/* Guided 3-Step Flow */}
      {expanded && (
        <div className="border border-line rounded-2xl bg-soft/60 p-4 sm:p-5 space-y-5">
          {/* Stepper Bar */}
          <div className="grid grid-cols-3 gap-1.5 p-1 bg-paper rounded-xl border border-line">
            {stepItems.map((item) => {
              const isActive = step === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => {
                    if (item.id === 2) {
                      const pErrs = validatePersonalVerification(personal, accountType);
                      if (Object.keys(pErrs).length > 0) {
                        setErrors(pErrs);
                        setStep(1);
                        return;
                      }
                    }
                    setErrors({});
                    setStep(item.id);
                  }}
                  className={`h-9 px-2 text-[11px] sm:text-xs rounded-lg transition-all truncate cursor-pointer ${
                    isActive
                      ? "bg-soft text-ink font-semibold shadow-xs"
                      : "text-muted hover:text-ink font-medium"
                  }`}
                >
                  {item.label}
                </button>
              );
            })}
          </div>

          {/* STEP 1: PERSONAL DETAILS */}
          {step === 1 && (
            <form onSubmit={handleContinueToDocuments} className="space-y-4">
              <div className="space-y-1">
                <h3 className="text-sm font-heading font-bold text-ink m-0">
                  {isBusiness
                    ? "Business & representative details"
                    : "Personal details"}
                </h3>
                <p className="text-xs text-muted m-0">
                  Enter your legal details exactly as they appear on your government ID.
                </p>
              </div>

              {isBusiness && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-medium text-muted block mb-1.5">
                      Registered business name
                    </label>
                    <input
                      type="text"
                      value={personal.businessName}
                      onChange={(e) => updatePersonalField("businessName", e.target.value)}
                      placeholder="e.g. Chima Ventures Ltd"
                      className={`w-full h-11 px-3.5 border rounded-xl bg-paper text-ink text-sm outline-none focus:border-ink ${
                        errors.businessName ? "border-rose-500" : "border-line"
                      }`}
                    />
                    {errors.businessName && (
                      <p className="text-[11px] text-rose-600 dark:text-rose-400 mt-1">
                        {errors.businessName}
                      </p>
                    )}
                  </div>
                  <div>
                    <label className="text-xs font-medium text-muted block mb-1.5">
                      Registration / RC number
                    </label>
                    <input
                      type="text"
                      value={personal.businessRegistrationNumber}
                      onChange={(e) =>
                        updatePersonalField("businessRegistrationNumber", e.target.value)
                      }
                      placeholder="e.g. RC-1492031"
                      className={`w-full h-11 px-3.5 border rounded-xl bg-paper text-ink font-mono text-sm outline-none focus:border-ink ${
                        errors.businessRegistrationNumber ? "border-rose-500" : "border-line"
                      }`}
                    />
                    {errors.businessRegistrationNumber && (
                      <p className="text-[11px] text-rose-600 dark:text-rose-400 mt-1">
                        {errors.businessRegistrationNumber}
                      </p>
                    )}
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-muted block mb-1.5">
                    {isBusiness
                      ? "Representative full legal name"
                      : "Full legal name (as on ID)"}
                  </label>
                  <input
                    type="text"
                    value={personal.fullName}
                    onChange={(e) => updatePersonalField("fullName", e.target.value)}
                    placeholder="e.g. Chima Angwe"
                    className={`w-full h-11 px-3.5 border rounded-xl bg-paper text-ink text-sm outline-none focus:border-ink ${
                      errors.fullName ? "border-rose-500" : "border-line"
                    }`}
                  />
                  {errors.fullName && (
                    <p className="text-[11px] text-rose-600 dark:text-rose-400 mt-1">
                      {errors.fullName}
                    </p>
                  )}
                </div>

                <div>
                  <label className="text-xs font-medium text-muted block mb-1.5">
                    Date of birth
                  </label>
                  <input
                    type="date"
                    value={personal.dateOfBirth}
                    onChange={(e) => updatePersonalField("dateOfBirth", e.target.value)}
                    className={`w-full h-11 px-3.5 border rounded-xl bg-paper text-ink text-sm outline-none focus:border-ink ${
                      errors.dateOfBirth ? "border-rose-500" : "border-line"
                    }`}
                  />
                  {errors.dateOfBirth && (
                    <p className="text-[11px] text-rose-600 dark:text-rose-400 mt-1">
                      {errors.dateOfBirth}
                    </p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-muted block mb-1.5">
                    Email address
                  </label>
                  <input
                    type="email"
                    value={personal.email}
                    onChange={(e) => updatePersonalField("email", e.target.value)}
                    placeholder="name@example.com"
                    className={`w-full h-11 px-3.5 border rounded-xl bg-paper text-ink text-sm outline-none focus:border-ink ${
                      errors.email ? "border-rose-500" : "border-line"
                    }`}
                  />
                  {errors.email && (
                    <p className="text-[11px] text-rose-600 dark:text-rose-400 mt-1">
                      {errors.email}
                    </p>
                  )}
                </div>

                <div>
                  <label className="text-xs font-medium text-muted block mb-1.5">
                    Phone number
                  </label>
                  <input
                    type="tel"
                    value={personal.phone}
                    onChange={(e) => updatePersonalField("phone", e.target.value)}
                    placeholder="801 234 5678"
                    className={`w-full h-11 px-3.5 border rounded-xl bg-paper text-ink font-mono text-sm outline-none focus:border-ink ${
                      errors.phone ? "border-rose-500" : "border-line"
                    }`}
                  />
                  {errors.phone && (
                    <p className="text-[11px] text-rose-600 dark:text-rose-400 mt-1">
                      {errors.phone}
                    </p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-muted block mb-1.5">
                    Country of residence
                  </label>
                  <CountrySelect
                    value={personal.country}
                    onChange={(nextCountry) =>
                      updatePersonalField("country", nextCountry)
                    }
                  />
                  {errors.country && (
                    <p className="text-[11px] text-rose-600 dark:text-rose-400 mt-1">
                      {errors.country}
                    </p>
                  )}
                </div>

                {isBusiness ? (
                  <div>
                    <label className="text-xs font-medium text-muted block mb-1.5">
                      Business category
                    </label>
                    <select
                      value={personal.businessCategory}
                      onChange={(e) =>
                        updatePersonalField("businessCategory", e.target.value)
                      }
                      className={`w-full h-11 pl-3.5 pr-10 border rounded-xl bg-paper text-ink text-sm outline-none focus:border-ink cursor-pointer ${
                        errors.businessCategory ? "border-rose-500" : "border-line"
                      }`}
                    >
                      <option value="">Select category</option>
                      {BUSINESS_CATEGORIES.map((cat) => (
                        <option key={cat} value={cat}>
                          {cat}
                        </option>
                      ))}
                    </select>
                    {errors.businessCategory && (
                      <p className="text-[11px] text-rose-600 dark:text-rose-400 mt-1">
                        {errors.businessCategory}
                      </p>
                    )}
                  </div>
                ) : (
                  <div>
                    <label className="text-xs font-medium text-muted block mb-1.5">
                      Occupation / source of funds
                    </label>
                    <input
                      type="text"
                      value={personal.occupation}
                      onChange={(e) => updatePersonalField("occupation", e.target.value)}
                      placeholder="e.g. Software Engineer, Merchant"
                      className={`w-full h-11 px-3.5 border rounded-xl bg-paper text-ink text-sm outline-none focus:border-ink ${
                        errors.occupation ? "border-rose-500" : "border-line"
                      }`}
                    />
                    {errors.occupation && (
                      <p className="text-[11px] text-rose-600 dark:text-rose-400 mt-1">
                        {errors.occupation}
                      </p>
                    )}
                  </div>
                )}
              </div>

              <div>
                <label className="text-xs font-medium text-muted block mb-1.5">
                  {isBusiness
                    ? "Registered business address"
                    : "Residential street address"}
                </label>
                <input
                  type="text"
                  value={personal.address}
                  onChange={(e) => updatePersonalField("address", e.target.value)}
                  placeholder="House number, street, city"
                  className={`w-full h-11 px-3.5 border rounded-xl bg-paper text-ink text-sm outline-none focus:border-ink ${
                    errors.address ? "border-rose-500" : "border-line"
                  }`}
                />
                {errors.address && (
                  <p className="text-[11px] text-rose-600 dark:text-rose-400 mt-1">
                    {errors.address}
                  </p>
                )}
              </div>

              <div className="flex justify-end pt-2 border-t border-line">
                <button
                  type="submit"
                  className="button button-primary h-10 px-5 rounded-xl text-xs font-semibold cursor-pointer"
                >
                  Save &amp; continue to ID submission →
                </button>
              </div>
            </form>
          )}

          {/* STEP 2: IDENTITY DOCUMENT SUBMISSION */}
          {step === 2 && (
            <form onSubmit={handleSubmitVerification} className="space-y-4">
              <div className="space-y-1">
                <h3 className="text-sm font-heading font-bold text-ink m-0">
                  Identity document submission
                </h3>
                <p className="text-xs text-muted m-0">
                  Submit an unexpired government-issued ID and a matching selfie.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-muted block mb-1.5">
                    Document type
                  </label>
                  <select
                    value={document.documentType}
                    onChange={(e) =>
                      updateDocumentField(
                        "documentType",
                        e.target.value as VerificationDocumentType,
                      )
                    }
                    className="w-full h-11 pl-3.5 pr-10 border border-line rounded-xl bg-paper text-ink text-sm outline-none focus:border-ink cursor-pointer"
                  >
                    {VERIFICATION_DOCUMENT_TYPES.map((type) => (
                      <option key={type} value={type}>
                        {type}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-xs font-medium text-muted block mb-1.5">
                    Issuing country
                  </label>
                  <CountrySelect
                    value={document.issuingCountry}
                    onChange={(nextCountry) =>
                      updateDocumentField("issuingCountry", nextCountry)
                    }
                  />
                  {errors.issuingCountry && (
                    <p className="text-[11px] text-rose-600 dark:text-rose-400 mt-1">
                      {errors.issuingCountry}
                    </p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-muted block mb-1.5">
                    Document number
                  </label>
                  <input
                    type="text"
                    value={document.documentNumber}
                    onChange={(e) =>
                      updateDocumentField("documentNumber", e.target.value)
                    }
                    placeholder="e.g. A12345678"
                    className={`w-full h-11 px-3.5 border rounded-xl bg-paper text-ink font-mono text-sm outline-none focus:border-ink ${
                      errors.documentNumber ? "border-rose-500" : "border-line"
                    }`}
                  />
                  {errors.documentNumber && (
                    <p className="text-[11px] text-rose-600 dark:text-rose-400 mt-1">
                      {errors.documentNumber}
                    </p>
                  )}
                </div>

                <div>
                  <label className="text-xs font-medium text-muted block mb-1.5">
                    Expiry date{" "}
                    {requiresExpiryDate(document.documentType)
                      ? "(required)"
                      : "(optional)"}
                  </label>
                  <input
                    type="date"
                    value={document.expiryDate}
                    onChange={(e) =>
                      updateDocumentField("expiryDate", e.target.value)
                    }
                    className={`w-full h-11 px-3.5 border rounded-xl bg-paper text-ink text-sm outline-none focus:border-ink ${
                      errors.expiryDate ? "border-rose-500" : "border-line"
                    }`}
                  />
                  {errors.expiryDate && (
                    <p className="text-[11px] text-rose-600 dark:text-rose-400 mt-1">
                      {errors.expiryDate}
                    </p>
                  )}
                </div>
              </div>

              <div className="space-y-3">
                <DocumentUploadField
                  label={`Front of ${document.documentType}`}
                  helper="PNG, JPG, WEBP, or PDF · Max 5 MB · All 4 corners visible"
                  accept="image/*,.pdf"
                  fileName={document.frontFileName}
                  fileSize={document.frontFileSize}
                  error={errors.frontFileName}
                  onSelect={(file) => handleFilePick("front", file)}
                  onClear={() =>
                    setDocument((prev) => ({
                      ...prev,
                      frontFileName: "",
                      frontFileSize: 0,
                    }))
                  }
                />

                {requiresBackDocument(document.documentType) && (
                  <DocumentUploadField
                    label={`Back of ${document.documentType}`}
                    helper="PNG, JPG, WEBP, or PDF · Max 5 MB"
                    accept="image/*,.pdf"
                    fileName={document.backFileName}
                    fileSize={document.backFileSize}
                    error={errors.backFileName}
                    onSelect={(file) => handleFilePick("back", file)}
                    onClear={() =>
                      setDocument((prev) => ({
                        ...prev,
                        backFileName: "",
                        backFileSize: 0,
                      }))
                    }
                  />
                )}

                <DocumentUploadField
                  label="Selfie / liveness photo"
                  helper="PNG, JPG, or WEBP · Clear front-facing photo matching your ID"
                  accept="image/*"
                  fileName={document.selfieFileName}
                  fileSize={document.selfieFileSize}
                  error={errors.selfieFileName}
                  onSelect={(file) => handleFilePick("selfie", file)}
                  onClear={() =>
                    setDocument((prev) => ({
                      ...prev,
                      selfieFileName: "",
                      selfieFileSize: 0,
                    }))
                  }
                />
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-line">
                <button
                  type="button"
                  onClick={() => {
                    setErrors({});
                    setStep(1);
                  }}
                  className="button button-quiet h-10 px-4 rounded-xl text-xs font-semibold cursor-pointer"
                >
                  ← Back to personal details
                </button>
                <button
                  type="submit"
                  className="button button-primary h-10 px-5 rounded-xl text-xs font-semibold cursor-pointer"
                >
                  Submit for verification
                </button>
              </div>
            </form>
          )}

          {/* STEP 3: VERIFICATION STATUS & OUTCOMES */}
          {step === 3 && (
            <div className="space-y-4">
              <div className="rounded-xl border border-line bg-paper p-4 space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <strong className="text-sm font-heading font-bold text-ink">
                    {meta.title}
                  </strong>
                  <StatusToneBadge status={record.status} accountType={accountType} />
                </div>

                <p className="text-xs text-muted leading-relaxed m-0">
                  {meta.description}
                </p>

                {record.referenceId && (
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-2 border-t border-line text-xs">
                    <div>
                      <span className="text-[11px] text-muted block">Reference</span>
                      <strong className="font-mono text-ink">{record.referenceId}</strong>
                    </div>
                    {record.submittedAt && (
                      <div>
                        <span className="text-[11px] text-muted block">Submitted</span>
                        <strong className="text-ink">{record.submittedAt}</strong>
                      </div>
                    )}
                    <div>
                      <span className="text-[11px] text-muted block">Document</span>
                      <strong className="text-ink">{record.document.documentType}</strong>
                    </div>
                  </div>
                )}

                {record.status === "unsuccessful" && record.outcomeReason && (
                  <div className="rounded-xl border border-rose-200 dark:border-rose-900 bg-rose-50/70 dark:bg-rose-950/30 p-3 text-xs text-rose-700 dark:text-rose-300">
                    <strong className="block font-semibold mb-0.5">
                      Why verification failed
                    </strong>
                    <span>{record.outcomeReason}</span>
                  </div>
                )}

                <div className="pt-2 border-t border-line space-y-1.5 text-xs">
                  <span className="font-semibold text-ink block">Next steps</span>
                  <ol className="list-decimal pl-4 space-y-1 text-muted m-0">
                    {record.nextSteps.map((nextStep) => (
                      <li key={nextStep}>{nextStep}</li>
                    ))}
                  </ol>
                </div>
              </div>

              {record.status === "pending" && (
                <div className="rounded-xl border border-dashed border-line bg-paper px-4 py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="text-xs">
                    <strong className="text-ink block font-semibold">
                      Review outcome preview
                    </strong>
                    <span className="text-muted">
                      Simulate the compliance check decision for this submission.
                    </span>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={() => handleDecisionSimulation("approved")}
                      className="button button-primary button-small cursor-pointer"
                    >
                      Approve check
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDecisionSimulation("unsuccessful")}
                      className="button button-secondary button-small cursor-pointer"
                    >
                      Mark unsuccessful
                    </button>
                  </div>
                </div>
              )}

              <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-line">
                {record.status === "not_started" && (
                  <button
                    type="button"
                    onClick={() => setStep(1)}
                    className="button button-primary h-10 px-5 rounded-xl text-xs font-semibold cursor-pointer"
                  >
                    Start personal details
                  </button>
                )}

                {record.status === "unsuccessful" && (
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setStep(1)}
                      className="button button-secondary h-10 px-4 rounded-xl text-xs font-semibold cursor-pointer"
                    >
                      Review personal details
                    </button>
                    <button
                      type="button"
                      onClick={() => setStep(2)}
                      className="button button-primary h-10 px-5 rounded-xl text-xs font-semibold cursor-pointer"
                    >
                      Update ID &amp; resubmit
                    </button>
                  </div>
                )}

                {record.status === "pending" && (
                  <button
                    type="button"
                    onClick={() => setStep(2)}
                    className="button button-quiet h-10 px-4 rounded-xl text-xs font-semibold cursor-pointer"
                  >
                    Edit submitted documents
                  </button>
                )}

                {record.status === "approved" && (
                  <>
                    <button
                      type="button"
                      onClick={() => setStep(1)}
                      className="button button-quiet h-10 px-4 rounded-xl text-xs font-semibold cursor-pointer"
                    >
                      View submitted details
                    </button>
                    {onStartTransfer && (
                      <button
                        type="button"
                        onClick={onStartTransfer}
                        className="button button-primary h-10 px-5 rounded-xl text-xs font-semibold cursor-pointer"
                      >
                        Send money →
                      </button>
                    )}
                  </>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </section>
  );
}
