import { useEffect, useRef, useState } from "react";
import { CustomSelect, Icon, LogoMark, toast } from "@/shared/ui";
import { getErrorMessage, isApiError } from "@/shared/api";
import { CountrySelect, callingCodes } from "@/entities/country";
import {
  findAccountByEmail,
  getAccountsForType,
  hasDuplicateAccount,
  isValidEmail,
  isValidPhone,
  setAuthCookies,
  updateStoredPassword,
} from "@/shared/lib";
import type { AccountType, Theme } from "@/shared/types";
import {
  mapLoginInputToRequest,
  mapRegisterBusinessInputToRequest,
  mapRegisterIndividualInputToRequest,
} from "../api/auth.mapper";
import {
  BUSINESS_MEANS_OF_ID_OPTIONS,
  MEANS_OF_ID_OPTIONS,
} from "../api/auth.types";
import { useLogin } from "../hooks/useLogin";
import { useRegisterBusiness } from "../hooks/useRegisterBusiness";
import { useRegisterIndividual } from "../hooks/useRegisterIndividual";

const MAX_ID_FILE_BYTES = 5 * 1024 * 1024;

function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") {
        resolve(reader.result);
      } else {
        reject(new Error("Could not read selected ID file."));
      }
    };
    reader.onerror = () => reject(new Error("Could not read selected ID file."));
    reader.readAsDataURL(file);
  });
}

export interface AuthCompleteData {
  accountType: AccountType;
  country: string;
  fullName: string;
  businessName: string;
  email: string;
  phone: string;
  dateOfBirth: string;
  address: string;
  occupation: string;
  businessCategory: string;
  vault?: string;
  registrationCode?: string;
}

export interface AuthScreenProps {
  mode: "signin" | "signup" | "forgot";
  setMode: (mode: "signin" | "signup" | "forgot") => void;
  theme: Theme;
  onToggleTheme: () => void;
  accountType: AccountType;
  onAccountTypeChange: (type: AccountType) => void;
  initialCountry: string;
  sessionNotice?: string;
  onClearSessionNotice?: () => void;
  onComplete: (account: AuthCompleteData) => void;
}

const SIGNUP_STEPS = ["Contact", "Profile", "Security"] as const;

export function AuthScreen({
  mode,
  setMode,
  accountType,
  onAccountTypeChange,
  initialCountry,
  sessionNotice = "",
  onClearSessionNotice,
  onComplete,
}: AuthScreenProps) {
  const [fullName, setFullName] = useState("");
  const [businessName, setBusinessName] = useState("");
  const [businessRegistrationNumber, setBusinessRegistrationNumber] = useState("");
  const [country, setCountry] = useState(initialCountry);
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [stage, setStage] = useState(1);
  const [forgotStage, setForgotStage] = useState<1 | 2>(1);
  const [resetOtp, setResetOtp] = useState("");
  const [dateOfBirth, setDateOfBirth] = useState("");
  const [address, setAddress] = useState("");
  const [occupation, setOccupation] = useState("");
  const [businessCategory, setBusinessCategory] = useState("");
  const [meansOfId, setMeansOfId] = useState("");
  const [idNumber, setIdNumber] = useState("");
  const [idCountry, setIdCountry] = useState(initialCountry);
  const [idFileDataUrl, setIdFileDataUrl] = useState("");
  const [idFileName, setIdFileName] = useState("");
  const [idFileSize, setIdFileSize] = useState(0);
  const [businessPhone, setBusinessPhone] = useState("");
  const [businessCountry, setBusinessCountry] = useState(initialCountry);
  const [businessMeansOfId, setBusinessMeansOfId] = useState("");
  const [businessIdFileDataUrl, setBusinessIdFileDataUrl] = useState("");
  const [businessIdFileName, setBusinessIdFileName] = useState("");
  const [businessIdFileSize, setBusinessIdFileSize] = useState(0);
  const [pin, setPin] = useState("");
  const [confirmPin, setConfirmPin] = useState("");
  const [showPin, setShowPin] = useState(false);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const idFileInputRef = useRef<HTMLInputElement | null>(null);
  const businessIdFileInputRef = useRef<HTMLInputElement | null>(null);
  const loginMutation = useLogin();
  const registerIndividualMutation = useRegisterIndividual();
  const registerBusinessMutation = useRegisterBusiness();

  const isAuthSubmitting =
    loginMutation.isPending ||
    registerIndividualMutation.isPending ||
    registerBusinessMutation.isPending;

  useEffect(() => {
    if (!sessionNotice) return;
    toast.error(sessionNotice);
    onClearSessionNotice?.();
  }, [sessionNotice, onClearSessionNotice]);

  const apiPhone =
    `${callingCodes[country] || ""}${phone.replace(/\s+/g, "")}`.trim() ||
    phone.trim();
  const apiBusinessPhone =
    `${callingCodes[businessCountry] || ""}${businessPhone.replace(/\s+/g, "")}`.trim() ||
    businessPhone.trim();

  const handleFileUpload = async (
    event: React.ChangeEvent<HTMLInputElement>,
    target: "identity" | "business",
  ) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    if (file.size > MAX_ID_FILE_BYTES) {
      toast.error("ID file must be 5 MB or smaller.");
      return;
    }

    try {
      const encoded = await readFileAsDataUrl(file);
      if (target === "business") {
        setBusinessIdFileDataUrl(encoded);
        setBusinessIdFileName(file.name);
        setBusinessIdFileSize(file.size);
      } else {
        setIdFileDataUrl(encoded);
        setIdFileName(file.name);
        setIdFileSize(file.size);
      }
    } catch (fileError) {
      toast.error(
        getErrorMessage(fileError, "Could not read selected ID file."),
      );
    }
  };

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    onClearSessionNotice?.();

    if (mode === "forgot") {
      if (forgotStage === 1) {
        if (!isValidEmail(email)) {
          toast.error("Enter a valid email address linked to your account.");
          return;
        }
        const registered = getAccountsForType(accountType);
        if (registered.length > 0 && !findAccountByEmail(accountType, email)) {
          toast.error("No account found with that email address.");
          return;
        }
        setForgotStage(2);
        setResetOtp("");
        setNewPassword("");
        setConfirmNewPassword("");
        toast.success(`Verification code sent to ${email.trim()}. Use 123456 for this prototype.`);
        return;
      }

      if (resetOtp !== "123456") {
        toast.error("That verification code did not match. Use 123456 for this prototype.");
        return;
      }
      if (newPassword.length < 8) {
        toast.error("Create a new password with at least 8 characters.");
        return;
      }
      if (newPassword !== confirmNewPassword) {
        toast.error("Your passwords do not match.");
        return;
      }
      updateStoredPassword(accountType, email, newPassword);
      setForgotStage(1);
      setResetOtp("");
      setNewPassword("");
      setConfirmNewPassword("");
      setShowPassword(false);
      setMode("signin");
      toast.success("Password updated. Sign in with your new password.");
      return;
    }

    if (mode === "signup" && stage === 1) {
      if (accountType === "business" && businessName.trim().length < 2) {
        toast.error("Enter your business name to continue.");
        return;
      }
      if (accountType === "business" && businessRegistrationNumber.trim().length < 2) {
        toast.error("Enter your company registration number to continue.");
        return;
      }
      if (fullName.trim().length < 2) {
        toast.error("Enter your full name to continue.");
        return;
      }
      if (!isValidEmail(email)) {
        toast.error("Enter a valid email address.");
        return;
      }
      if (!isValidPhone(phone)) {
        toast.error("Enter a valid phone number (7 to 15 digits).");
        return;
      }
      if (!country) {
        toast.error("Select your country to continue.");
        return;
      }
      if (hasDuplicateAccount(accountType, email, phone)) {
        toast.error("An account with this email or phone already exists. Sign in or reset your password.");
        return;
      }

      setStage(2);
      return;
    }

    if (mode === "signup" && stage === 2) {
      if (!dateOfBirth) {
        toast.error("Enter your date of birth to continue.");
        return;
      }
      const parsedDob = new Date(dateOfBirth);
      if (Number.isNaN(parsedDob.getTime()) || parsedDob > new Date()) {
        toast.error("Enter a valid date of birth.");
        return;
      }
      if (accountType === "business" ? !businessCategory : !occupation) {
        toast.error("Complete your profile details.");
        return;
      }
      if (address.trim().length < 5) {
        toast.error(
          accountType === "business"
            ? "Enter your full business address to continue."
            : "Enter your full residential address to continue.",
        );
        return;
      }
      if (!meansOfId) {
        toast.error("Select a valid means of identification.");
        return;
      }
      if (idNumber.trim().length < 4) {
        toast.error("Enter your identification number.");
        return;
      }
      if (!idCountry) {
        toast.error("Select your ID issuing country.");
        return;
      }
      if (accountType === "business") {
        if (!businessCountry) {
          toast.error("Select your business registration country.");
          return;
        }
        if (!isValidPhone(businessPhone)) {
          toast.error("Enter a valid business phone number (7 to 15 digits).");
          return;
        }
        if (!businessMeansOfId) {
          toast.error("Select your business registration document type.");
          return;
        }
      }

      setStage(3);
      return;
    }

    if (mode === "signup" && stage === 3) {
      if (!idFileDataUrl) {
        toast.error("Upload a clear copy of your identification document.");
        return;
      }
      if (accountType === "business" && !businessIdFileDataUrl) {
        toast.error("Upload a clear copy of your business document.");
        return;
      }
      if (password.length < 8) {
        toast.error("Create a password with at least 8 characters.");
        return;
      }
      if (password !== confirmPassword) {
        toast.error("Your passwords do not match.");
        return;
      }
      if (!/^\d{4,6}$/.test(pin)) {
        toast.error("Create a 4 to 6 digit numeric transaction PIN.");
        return;
      }
      if (pin !== confirmPin) {
        toast.error("Your transaction PINs do not match.");
        return;
      }

      try {
        const result =
          accountType === "business"
            ? await registerBusinessMutation.mutateAsync(
                mapRegisterBusinessInputToRequest({
                  password,
                  country,
                  name: fullName,
                  meansOfId,
                  idNumber,
                  idFile: idFileDataUrl,
                  idCountry,
                  phone: apiPhone,
                  businessName,
                  businessPhone: apiBusinessPhone,
                  businessAddress: address,
                  businessMeansOfId,
                  businessIdNumber: businessRegistrationNumber,
                  businessIdFile: businessIdFileDataUrl,
                  businessCountry,
                  pin,
                }),
              )
            : await registerIndividualMutation.mutateAsync(
                mapRegisterIndividualInputToRequest({
                  password,
                  country,
                  name: fullName,
                  meansOfId,
                  idNumber,
                  idFile: idFileDataUrl,
                  idCountry,
                  phone: apiPhone,
                  pin,
                }),
              );

        setAuthCookies({
          vault: result.vault,
          code: result.code,
        });

        onComplete({
          accountType,
          country,
          fullName: fullName.trim(),
          businessName: accountType === "business" ? businessName.trim() : "",
          email: email.trim(),
          phone: phone.trim(),
          dateOfBirth,
          address: address.trim(),
          occupation: accountType === "individual" ? occupation : "",
          businessCategory:
            accountType === "business" ? businessCategory : "",
          vault: result.vault,
          registrationCode: result.code,
        });

        setMode("signin");
        toast.success(
          result.code
            ? `Your account is ready (Ref: ${result.code}). Sign in to continue.`
            : "Your account is ready. Sign in to continue.",
        );
        setMeansOfId("");
        setIdNumber("");
        setIdFileDataUrl("");
        setIdFileName("");
        setIdFileSize(0);
        setBusinessPhone("");
        setBusinessMeansOfId("");
        setBusinessIdFileDataUrl("");
        setBusinessIdFileName("");
        setBusinessIdFileSize(0);
        setPin("");
        setConfirmPin("");
        setShowPin(false);
        setPassword("");
        setConfirmPassword("");
        setShowPassword(false);
        setStage(1);
        return;
      } catch (err) {
        const baseMessage = getErrorMessage(
          err,
          "Unable to register your account. Please try again.",
        );
        const firstFieldError =
          isApiError(err) && err.fieldErrors
            ? Object.values(err.fieldErrors).flat()[0]
            : undefined;
        toast.error(firstFieldError || baseMessage);
        return;
      }
    }

    if (mode === "signin") {
      if (!isValidPhone(phone)) {
        toast.error("Enter a valid phone number.");
        return;
      }
      if (!password.trim()) {
        toast.error("Enter your password to sign in.");
        return;
      }

      const cleanLoginPhone = phone.replace(/\s+/g, "").trim();

      try {
        const result = await loginMutation.mutateAsync(
          mapLoginInputToRequest({
            phone: cleanLoginPhone,
            password,
          }),
        );

        setAuthCookies(result.authHeaders);

        onComplete({
          accountType,
          country:
            localStorage.getItem(`settle-demo-${accountType}-country`) ||
            country,
          fullName:
            accountType === "individual"
              ? localStorage.getItem("settle-demo-name") || "Chima Angwe"
              : "",
          businessName:
            localStorage.getItem("settle-demo-business-name") ||
            "Chima Ventures",
          email: (
            localStorage.getItem(`settle-demo-${accountType}-email`) || email
          ).trim(),
          phone: cleanLoginPhone,
          dateOfBirth,
          address: address.trim(),
          occupation,
          businessCategory,
          vault: result.authHeaders.vault,
          registrationCode: result.authHeaders.code,
        });

        setPassword("");
        setShowPassword(false);
        toast.success(result.message || "Account logged in successfully.");
        return;
      } catch (err) {
        const baseMessage = getErrorMessage(
          err,
          "Unable to sign in. Check your phone number and password.",
        );
        const firstFieldError =
          isApiError(err) && err.fieldErrors
            ? Object.values(err.fieldErrors).flat()[0]
            : undefined;
        toast.error(firstFieldError || baseMessage);
        return;
      }
    }
  };

  const heading =
    mode === "signup"
      ? stage === 1
        ? "Create your account"
        : stage === 2
          ? "Complete your profile"
          : "Verify ID & set security"
      : mode === "forgot"
        ? forgotStage === 1
          ? "Recover account access"
          : "Set a new password"
        : "Welcome back";

  const changeAccountType = (nextType: AccountType) => {
    const nextCountry =
      localStorage.getItem(`settle-demo-${nextType}-country`) || "Nigeria";
    onAccountTypeChange(nextType);
    setCountry(nextCountry);
    setIdCountry(nextCountry);
    setBusinessCountry(nextCountry);
    onClearSessionNotice?.();
  };

  const switchMode = (nextMode: "signin" | "signup" | "forgot") => {
    onClearSessionNotice?.();
    setShowPassword(false);
    setStage(1);
    setForgotStage(1);
    setResetOtp("");
    setNewPassword("");
    setConfirmNewPassword("");
    setMode(nextMode);
  };

  return (
    <div className={`auth-page ${mode === "signup" ? "auth-onboarding" : ""}`}>
      <div className="auth-decoration auth-orbit-one" />
      <div className="auth-decoration auth-orbit-two" />

      <header className="auth-top">
        <a className="brand auth-brand" href="#home">
          <LogoMark />
          <span className="brand-copy">
            <strong>Settle Africa</strong>
          </span>
        </a>
      </header>

      <main
        className={`auth-layout ${mode === "signup" ? "auth-layout-signup" : ""}`}
      >
        <section className="auth-story" aria-hidden={mode === "signup"}>
          <h1>
            Across borders.
            <br />
            <em>Without the guesswork.</em>
          </h1>

          <div className="auth-story-points">
            <div>
              <span className="story-icon">
                <Icon name="eye" size={16} />
              </span>
              <span>
                <strong>Know before you send</strong>
              </span>
            </div>
            <div>
              <span className="story-icon">
                <Icon name="search" size={16} />
              </span>
              <span>
                <strong>Follow every transfer</strong>
              </span>
            </div>
          </div>

          <div className="auth-route">
            <div className="route-track">
              <span className="route-circle">N</span>
              <div className="route-line">
                <b />
                <b />
                <b />
              </div>
              <span className="route-circle route-end">L</span>
            </div>
            <strong>
              Nairobi <span>→</span> Lagos
            </strong>
          </div>
        </section>

        <section
          className={`auth-card ${mode === "signup" ? `auth-card-signup signup-stage-${stage}` : ""}`}
        >
          <div className="auth-card-head">
            <h2>{heading}</h2>
          </div>

          {(mode === "signin" || (mode === "signup" && stage === 1)) && (
            <div
              className="auth-account-switch"
              role="group"
              aria-label="Choose account type"
            >
              <button
                type="button"
                className={accountType === "individual" ? "selected" : ""}
                onClick={() => changeAccountType("individual")}
              >
                <Icon name="user" size={15} /> Individual
              </button>
              <button
                type="button"
                className={accountType === "business" ? "selected" : ""}
                onClick={() => changeAccountType("business")}
              >
                <Icon name="building" size={15} /> Business
              </button>
            </div>
          )}

          {mode === "signup" && (
            <div
              className="signup-progress"
              aria-label={`Signup step ${stage} of ${SIGNUP_STEPS.length}`}
            >
              {SIGNUP_STEPS.map((label, index) => (
                <div
                  className={
                    stage === index + 1
                      ? "active"
                      : stage > index + 1
                        ? "complete"
                        : ""
                  }
                  key={label}
                >
                  <i>{stage > index + 1 ? "✓" : `0${index + 1}`}</i>
                  <span>{label}</span>
                </div>
              ))}
            </div>
          )}

          <form
            noValidate
            onSubmit={(event) => {
              void submit(event);
            }}
            className={`auth-form ${mode === "signup" ? "auth-signup-form" : ""}`}
          >
            {mode === "signup" && stage === 1 && (
              <>
                {accountType === "business" && (
                  <div className="auth-field-row">
                    <label>
                      Business name
                      <input
                        required
                        value={businessName}
                        onChange={(e) => setBusinessName(e.target.value)}
                        placeholder="e.g. Chima Ventures"
                        autoComplete="organization"
                      />
                    </label>
                    <label>
                      Registration no.
                      <input
                        required
                        value={businessRegistrationNumber}
                        onChange={(e) =>
                          setBusinessRegistrationNumber(e.target.value)
                        }
                        placeholder="e.g. RC 1234567"
                        autoComplete="off"
                      />
                    </label>
                  </div>
                )}

                <div className="auth-field-row">
                  <label>
                    {accountType === "business" ? "Your full name" : "Full name"}
                    <input
                      required
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="e.g. Chima Angwe"
                      autoComplete="name"
                    />
                  </label>
                  <label>
                    Email address
                    <input
                      required
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="you@example.com"
                      autoComplete="email"
                    />
                  </label>
                </div>

                <div className="auth-phone-country-field">
                  <label className="auth-phone-label" htmlFor="signup-phone">
                    Phone number
                  </label>
                  <div className="auth-phone-country-control">
                    <div className="auth-phone-country-select">
                      <CountrySelect
                        value={country}
                        onChange={(nextCountry) => {
                          setCountry(nextCountry);
                          if (!idCountry || idCountry === country) {
                            setIdCountry(nextCountry);
                          }
                          if (!businessCountry || businessCountry === country) {
                            setBusinessCountry(nextCountry);
                          }
                        }}
                      />
                    </div>
                    <div className="auth-phone-input-wrap">
                      <span>{callingCodes[country] || "+"}</span>
                      <input
                        id="signup-phone"
                        required
                        type="tel"
                        value={phone}
                        onChange={(e) =>
                          setPhone(e.target.value.replace(/[^0-9 ]/g, ""))
                        }
                        placeholder="801 234 5678"
                        autoComplete="tel-national"
                      />
                    </div>
                  </div>
                </div>
              </>
            )}

            {mode === "signup" && stage === 2 && (
              <>
                <div className="auth-field-row">
                  <label>
                    Date of birth
                    <input
                      required
                      type="date"
                      value={dateOfBirth}
                      onChange={(e) => setDateOfBirth(e.target.value)}
                    />
                  </label>
                  {accountType === "business" ? (
                    <label>
                      Business type
                      <CustomSelect
                        value={businessCategory}
                        onChange={setBusinessCategory}
                        placeholder="Choose category"
                        modalTitle="Select business type"
                        triggerClassName="h-[40px] px-3 rounded-[11px] text-[13px] font-normal"
                        options={[
                          "Retail and trade",
                          "Professional services",
                          "Technology",
                          "Logistics",
                          "Other",
                        ]}
                      />
                    </label>
                  ) : (
                    <label>
                      Occupation
                      <CustomSelect
                        value={occupation}
                        onChange={setOccupation}
                        placeholder="Choose occupation"
                        modalTitle="Select occupation"
                        triggerClassName="h-[40px] px-3 rounded-[11px] text-[13px] font-normal"
                        options={[
                          "Salaried employee",
                          "Self-employed",
                          "Student",
                          "Other",
                        ]}
                      />
                    </label>
                  )}
                </div>

                <label className="auth-full-field">
                  {accountType === "business"
                    ? "Business address"
                    : "Residential address"}
                  <input
                    required
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder="Street address and city"
                    autoComplete="street-address"
                  />
                </label>

                {accountType === "business" && (
                  <>
                    <div className="auth-phone-country-field">
                      <label
                        className="auth-phone-label"
                        htmlFor="signup-business-phone"
                      >
                        Business phone &amp; country
                      </label>
                      <div className="auth-phone-country-control">
                        <div className="auth-phone-country-select">
                          <CountrySelect
                            value={businessCountry}
                            onChange={setBusinessCountry}
                          />
                        </div>
                        <div className="auth-phone-input-wrap">
                          <span>{callingCodes[businessCountry] || "+"}</span>
                          <input
                            id="signup-business-phone"
                            required
                            type="tel"
                            value={businessPhone}
                            onChange={(e) =>
                              setBusinessPhone(
                                e.target.value.replace(/[^0-9 ]/g, ""),
                              )
                            }
                            placeholder="801 234 5678"
                            autoComplete="tel-national"
                          />
                        </div>
                      </div>
                    </div>

                    <label className="auth-full-field">
                      Business document type
                      <CustomSelect
                        value={businessMeansOfId}
                        onChange={setBusinessMeansOfId}
                        placeholder="Choose business document"
                        modalTitle="Select business document type"
                        triggerClassName="h-[40px] px-3 rounded-[11px] text-[13px] font-normal"
                        options={BUSINESS_MEANS_OF_ID_OPTIONS}
                      />
                    </label>
                  </>
                )}

                <div className="auth-field-row">
                  <label>
                    {accountType === "business"
                      ? "Owner means of ID"
                      : "Means of ID"}
                    <CustomSelect
                      value={meansOfId}
                      onChange={setMeansOfId}
                      placeholder="Choose ID type"
                      modalTitle="Select means of ID"
                      triggerClassName="h-[40px] px-3 rounded-[11px] text-[13px] font-normal"
                      options={MEANS_OF_ID_OPTIONS}
                    />
                  </label>
                  <label>
                    {accountType === "business" ? "Owner ID number" : "ID number"}
                    <input
                      required
                      value={idNumber}
                      onChange={(e) => setIdNumber(e.target.value)}
                      placeholder="e.g. A01234567"
                      autoComplete="off"
                    />
                  </label>
                </div>

                <div className="auth-phone-country-field">
                  <span className="auth-phone-label">
                    {accountType === "business"
                      ? "Owner ID issuing country"
                      : "ID issuing country"}
                  </span>
                  <div className="auth-phone-country-select">
                    <CountrySelect value={idCountry} onChange={setIdCountry} />
                  </div>
                </div>
              </>
            )}

            {mode === "signup" && stage === 3 && (
              <>
                <div className="auth-phone-country-field">
                  <span className="auth-phone-label">
                    {accountType === "business"
                      ? "Upload owner ID document"
                      : "Upload ID document"}
                  </span>
                  <input
                    ref={idFileInputRef}
                    type="file"
                    accept="image/*,.pdf"
                    className="hidden"
                    onChange={(event) => {
                      void handleFileUpload(event, "identity");
                    }}
                  />
                  {idFileDataUrl ? (
                    <div className="h-[42px] px-3 rounded-[11px] border border-line bg-paper flex items-center justify-between gap-2 text-xs">
                      <span className="truncate text-ink font-medium">
                        {idFileName} ({Math.max(1, Math.round(idFileSize / 1024))} KB)
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          setIdFileDataUrl("");
                          setIdFileName("");
                          setIdFileSize(0);
                        }}
                        className="text-[11px] font-semibold text-muted hover:text-ink shrink-0 cursor-pointer"
                      >
                        Remove
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => idFileInputRef.current?.click()}
                      className="h-[42px] px-3 rounded-[11px] border border-dashed border-line bg-paper hover:border-ink text-xs text-muted flex items-center justify-between gap-2 transition-colors cursor-pointer"
                    >
                      <span className="truncate">Upload ID (JPG, PNG, PDF)</span>
                      <span className="text-[11px] font-semibold text-ink shrink-0">
                        Browse
                      </span>
                    </button>
                  )}
                </div>

                {accountType === "business" && (
                  <div className="auth-phone-country-field">
                    <span className="auth-phone-label">
                      Upload business registration document
                    </span>
                    <input
                      ref={businessIdFileInputRef}
                      type="file"
                      accept="image/*,.pdf"
                      className="hidden"
                      onChange={(event) => {
                        void handleFileUpload(event, "business");
                      }}
                    />
                    {businessIdFileDataUrl ? (
                      <div className="h-[42px] px-3 rounded-[11px] border border-line bg-paper flex items-center justify-between gap-2 text-xs">
                        <span className="truncate text-ink font-medium">
                          {businessIdFileName} (
                          {Math.max(1, Math.round(businessIdFileSize / 1024))} KB)
                        </span>
                        <button
                          type="button"
                          onClick={() => {
                            setBusinessIdFileDataUrl("");
                            setBusinessIdFileName("");
                            setBusinessIdFileSize(0);
                          }}
                          className="text-[11px] font-semibold text-muted hover:text-ink shrink-0 cursor-pointer"
                        >
                          Remove
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => businessIdFileInputRef.current?.click()}
                        className="h-[42px] px-3 rounded-[11px] border border-dashed border-line bg-paper hover:border-ink text-xs text-muted flex items-center justify-between gap-2 transition-colors cursor-pointer"
                      >
                        <span className="truncate">
                          Upload business doc (JPG, PNG, PDF)
                        </span>
                        <span className="text-[11px] font-semibold text-ink shrink-0">
                          Browse
                        </span>
                      </button>
                    )}
                  </div>
                )}

                <div className="auth-field-row">
                  <label>
                    Create password
                    <div className="password-wrap">
                      <input
                        required
                        minLength={8}
                        type={showPassword ? "text" : "password"}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="8+ characters"
                        autoComplete="new-password"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword((v) => !v)}
                        aria-label={
                          showPassword ? "Hide password" : "Show password"
                        }
                      >
                        <Icon name={showPassword ? "eyeOff" : "eye"} size={16} />
                      </button>
                    </div>
                  </label>

                  <label>
                    Confirm password
                    <div className="password-wrap">
                      <input
                        required
                        minLength={8}
                        type={showPassword ? "text" : "password"}
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="Re-enter password"
                        autoComplete="new-password"
                      />
                    </div>
                  </label>
                </div>

                <div className="auth-field-row">
                  <label>
                    Transaction PIN
                    <div className="password-wrap">
                      <input
                        required
                        inputMode="numeric"
                        pattern="[0-9]{4,6}"
                        maxLength={6}
                        type={showPin ? "text" : "password"}
                        value={pin}
                        onChange={(e) =>
                          setPin(e.target.value.replace(/\D/g, "").slice(0, 6))
                        }
                        placeholder="4–6 digits"
                        autoComplete="off"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPin((v) => !v)}
                        aria-label={showPin ? "Hide PIN" : "Show PIN"}
                      >
                        <Icon name={showPin ? "eyeOff" : "eye"} size={16} />
                      </button>
                    </div>
                  </label>

                  <label>
                    Confirm PIN
                    <div className="password-wrap">
                      <input
                        required
                        inputMode="numeric"
                        pattern="[0-9]{4,6}"
                        maxLength={6}
                        type={showPin ? "text" : "password"}
                        value={confirmPin}
                        onChange={(e) =>
                          setConfirmPin(
                            e.target.value.replace(/\D/g, "").slice(0, 6),
                          )
                        }
                        placeholder="Re-enter PIN"
                        autoComplete="off"
                      />
                    </div>
                  </label>
                </div>
              </>
            )}

            {(mode === "signin" || mode === "forgot") && (
              <>
                {mode === "forgot" && forgotStage === 1 ? (
                  <label>
                    Email address
                    <input
                      required
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="you@example.com"
                      autoComplete="email"
                    />
                  </label>
                ) : mode === "signin" ? (
                  <label>
                    Phone number
                    <input
                      required
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="+234 801 234 5678"
                      autoComplete="tel"
                    />
                  </label>
                ) : null}

                {mode === "forgot" && forgotStage === 2 && (
                  <>
                    <label>
                      6-digit verification code
                      <input
                        required
                        inputMode="numeric"
                        autoComplete="one-time-code"
                        maxLength={6}
                        value={resetOtp}
                        onChange={(e) =>
                          setResetOtp(e.target.value.replace(/\D/g, "").slice(0, 6))
                        }
                        placeholder="123456"
                      />
                    </label>
                    <label>
                      New password
                      <div className="password-wrap">
                        <input
                          required
                          minLength={8}
                          type={showPassword ? "text" : "password"}
                          value={newPassword}
                          onChange={(e) => setNewPassword(e.target.value)}
                          placeholder="8+ characters"
                          autoComplete="new-password"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword((v) => !v)}
                          aria-label={
                            showPassword ? "Hide password" : "Show password"
                          }
                        >
                          <Icon name={showPassword ? "eyeOff" : "eye"} size={16} />
                        </button>
                      </div>
                    </label>
                    <label>
                      Confirm new password
                      <div className="password-wrap">
                        <input
                          required
                          minLength={8}
                          type={showPassword ? "text" : "password"}
                          value={confirmNewPassword}
                          onChange={(e) => setConfirmNewPassword(e.target.value)}
                          placeholder="Re-enter password"
                          autoComplete="new-password"
                        />
                      </div>
                    </label>
                  </>
                )}

                {mode === "signin" && (
                  <label>
                    <span className="auth-label-row">
                      <span>Password</span>
                      <button
                        type="button"
                        className="forgot-link"
                        onClick={() => switchMode("forgot")}
                      >
                        Forgot password?
                      </button>
                    </span>
                    <div className="password-wrap">
                      <input
                        required
                        type={showPassword ? "text" : "password"}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Enter your password"
                        autoComplete="current-password"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword((v) => !v)}
                        aria-label={
                          showPassword ? "Hide password" : "Show password"
                        }
                      >
                        <Icon name={showPassword ? "eyeOff" : "eye"} size={16} />
                      </button>
                    </div>
                  </label>
                )}
              </>
            )}

            <div className="auth-actions">
              {((mode === "signup" && stage > 1) ||
                (mode === "forgot" && forgotStage > 1)) && (
                  <button
                    type="button"
                    className="button button-quiet auth-back"
                    disabled={isAuthSubmitting}
                    onClick={() => {
                      if (mode === "forgot") setForgotStage(1);
                      else setStage(stage - 1);
                    }}
                  >
                    ← Back
                  </button>
                )}
              <button
                className="button button-primary auth-submit"
                type="submit"
                disabled={isAuthSubmitting}
              >
                {mode === "signup"
                  ? stage === 1 || stage === 2
                    ? "Continue"
                    : registerIndividualMutation.isPending ||
                        registerBusinessMutation.isPending
                      ? "Creating account..."
                      : "Create account"
                  : mode === "forgot"
                    ? forgotStage === 1
                      ? "Send recovery code"
                      : "Update password"
                    : loginMutation.isPending
                      ? "Signing in..."
                      : "Sign in"}
                <span>→</span>
              </button>
            </div>
          </form>

          {mode !== "forgot" ? (
            <div className="auth-switch">
              {mode === "signin" ? (
                <>
                  New to Settle?{" "}
                  <button type="button" onClick={() => switchMode("signup")}>
                    Create an account
                  </button>
                </>
              ) : stage === 1 ? (
                <>
                  Already have an account?{" "}
                  <button type="button" onClick={() => switchMode("signin")}>
                    Sign in
                  </button>
                </>
              ) : (
                <button type="button" onClick={() => switchMode("signin")}>
                  Return to sign in
                </button>
              )}
            </div>
          ) : (
            <div className="auth-switch">
              <button type="button" onClick={() => switchMode("signin")}>
                Back to sign in
              </button>
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
