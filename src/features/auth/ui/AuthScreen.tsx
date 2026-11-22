import { useState } from "react";
import { Icon, LogoMark } from "@/shared/ui";
import { CountrySelect, callingCodes } from "@/entities/country";
import {
  findAccountByEmail,
  findAccountByIdentifier,
  getAccountsForType,
  hasDuplicateAccount,
  isValidEmail,
  isValidPhone,
  saveStoredAccount,
  updateStoredPassword,
} from "@/shared/lib";
import type { AccountType, Theme } from "@/shared/types";

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

const SIGNUP_STEPS = ["Contact", "Verify", "Profile"] as const;

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
  const [otp, setOtp] = useState("");
  const [resetOtp, setResetOtp] = useState("");
  const [dateOfBirth, setDateOfBirth] = useState("");
  const [address, setAddress] = useState("");
  const [occupation, setOccupation] = useState("");
  const [businessCategory, setBusinessCategory] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");

  const formattedPhone = `${callingCodes[country] || ""} ${phone.trim()}`.trim();

  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    setError("");
    setNotice("");
    onClearSessionNotice?.();

    if (mode === "forgot") {
      if (forgotStage === 1) {
        if (!isValidEmail(email)) {
          setError("Enter a valid email address linked to your account.");
          return;
        }
        const registered = getAccountsForType(accountType);
        if (registered.length > 0 && !findAccountByEmail(accountType, email)) {
          setError("No account found with that email address.");
          return;
        }
        setForgotStage(2);
        setResetOtp("");
        setNewPassword("");
        setConfirmNewPassword("");
        setNotice(`Verification code sent to ${email.trim()}. Use 123456 for this prototype.`);
        return;
      }

      if (resetOtp !== "123456") {
        setError("That verification code did not match. Use 123456 for this prototype.");
        return;
      }
      if (newPassword.length < 8) {
        setError("Create a new password with at least 8 characters.");
        return;
      }
      if (newPassword !== confirmNewPassword) {
        setError("Your passwords do not match.");
        return;
      }
      updateStoredPassword(accountType, email, newPassword);
      setForgotStage(1);
      setResetOtp("");
      setNewPassword("");
      setConfirmNewPassword("");
      setShowPassword(false);
      setMode("signin");
      setNotice("Password updated. Sign in with your new password.");
      return;
    }

    if (mode === "signup" && stage === 1) {
      if (accountType === "business" && businessName.trim().length < 2) {
        setError("Enter your business name to continue.");
        return;
      }
      if (accountType === "business" && businessRegistrationNumber.trim().length < 2) {
        setError("Enter your company registration number to continue.");
        return;
      }
      if (fullName.trim().length < 2) {
        setError("Enter your full name to continue.");
        return;
      }
      if (!isValidEmail(email)) {
        setError("Enter a valid email address.");
        return;
      }
      if (!isValidPhone(phone)) {
        setError("Enter a valid phone number (7 to 15 digits).");
        return;
      }
      if (!country) {
        setError("Select your country to continue.");
        return;
      }
      if (hasDuplicateAccount(accountType, email, phone)) {
        setError("An account with this email or phone already exists. Sign in or reset your password.");
        return;
      }
      setNotice(`Demo verification code sent to ${formattedPhone || phone}.`);
      setStage(2);
      return;
    }

    if (mode === "signup" && stage === 2) {
      if (otp !== "123456") {
        setError("That code did not match. Use 123456 for this prototype.");
        return;
      }
      setNotice("");
      setStage(3);
      return;
    }

    if (mode === "signup" && stage === 3) {
      if (!dateOfBirth) {
        setError("Enter your date of birth to continue.");
        return;
      }
      const parsedDob = new Date(dateOfBirth);
      if (Number.isNaN(parsedDob.getTime()) || parsedDob > new Date()) {
        setError("Enter a valid date of birth.");
        return;
      }
      if (accountType === "business" ? !businessCategory : !occupation) {
        setError("Complete your profile details.");
        return;
      }
      if (address.trim().length < 5) {
        setError("Enter your full residential address to continue.");
        return;
      }
      if (password.length < 8) {
        setError("Create a password with at least 8 characters.");
        return;
      }
      if (password !== confirmPassword) {
        setError("Your passwords do not match.");
        return;
      }

      saveStoredAccount({
        accountType,
        country,
        fullName: fullName.trim(),
        businessName: businessName.trim(),
        businessRegistrationNumber: businessRegistrationNumber.trim() || undefined,
        email: email.trim(),
        phone: phone.trim(),
        password,
        dateOfBirth,
        address: address.trim(),
        occupation,
        businessCategory,
      });
    }

    let matchedAccount = undefined;
    if (mode === "signin") {
      if (accountType === "business") {
        if (!isValidEmail(email)) {
          setError("Enter a valid business email address.");
          return;
        }
      } else if (!isValidPhone(phone)) {
        setError("Enter a valid phone number.");
        return;
      }
      if (!password.trim()) {
        setError("Enter your password to sign in.");
        return;
      }

      const registered = getAccountsForType(accountType);
      if (registered.length > 0) {
        matchedAccount = findAccountByIdentifier(
          accountType,
          accountType === "business" ? email : phone,
        );
        if (!matchedAccount) {
          setError("No account found for those details. Check your entry or register.");
          return;
        }
        if (matchedAccount.password !== password) {
          setError("Incorrect password. Try again or reset your password.");
          return;
        }
      } else if (password.trim().length < 6) {
        setError("Password must be at least 6 characters.");
        return;
      }
    }

    onComplete({
      accountType,
      country: matchedAccount?.country || country,
      fullName:
        mode === "signup"
          ? fullName.trim()
          : matchedAccount?.fullName ||
            (accountType === "individual"
              ? localStorage.getItem("settle-demo-name") || "Chima Angwe"
              : ""),
      businessName:
        mode === "signup"
          ? businessName.trim()
          : matchedAccount?.businessName ||
            localStorage.getItem("settle-demo-business-name") ||
            "Chima Ventures",
      email: (matchedAccount?.email || email).trim(),
      phone: (matchedAccount?.phone || phone).trim(),
      dateOfBirth: matchedAccount?.dateOfBirth || dateOfBirth,
      address: (matchedAccount?.address || address).trim(),
      occupation: matchedAccount?.occupation || occupation,
      businessCategory: matchedAccount?.businessCategory || businessCategory,
    });

    if (mode === "signup") {
      setMode("signin");
      setNotice("Your account is ready. Sign in to continue.");
      setPassword("");
      setConfirmPassword("");
      setShowPassword(false);
      setStage(1);
    }
  };

  const heading =
    mode === "signup"
      ? stage === 1
        ? "Create your account"
        : stage === 2
          ? "Verify your phone"
          : "Complete your profile"
      : mode === "forgot"
        ? forgotStage === 1
          ? "Recover account access"
          : "Set a new password"
        : "Welcome back";

  const changeAccountType = (nextType: AccountType) => {
    onAccountTypeChange(nextType);
    setCountry(
      localStorage.getItem(`settle-demo-${nextType}-country`) || "Nigeria",
    );
    setError("");
    setNotice("");
    onClearSessionNotice?.();
  };

  const switchMode = (nextMode: "signin" | "signup" | "forgot") => {
    setError("");
    setNotice("");
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

          {sessionNotice && !error && !notice && (
            <div className="notice error-notice auth-notice" role="alert">
              <span>{sessionNotice}</span>
            </div>
          )}

          {notice && (
            <div className="notice success-notice auth-notice">
              <Icon name="check" size={15} />
              <span>{notice}</span>
            </div>
          )}

          <form
            noValidate
            onSubmit={submit}
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
                      <CountrySelect value={country} onChange={setCountry} />
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
              <div className="otp-panel">
                <span className="otp-icon">
                  <Icon name="phone" size={20} />
                </span>
                <label>
                  6-digit verification code
                  <input
                    required
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    pattern="[0-9]{6}"
                    maxLength={6}
                    value={otp}
                    onChange={(e) =>
                      setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))
                    }
                    placeholder="000000"
                  />
                </label>
                <div className="otp-meta">
                  <small>
                    Prototype code: <strong>123456</strong>
                  </small>
                  <button
                    type="button"
                    className="text-button otp-resend"
                    onClick={() =>
                      setNotice(
                        `Demo code resent to ${formattedPhone || phone}: 123456`,
                      )
                    }
                  >
                    Resend code
                  </button>
                </div>
              </div>
            )}

            {mode === "signup" && stage === 3 && (
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
                      <select
                        required
                        value={businessCategory}
                        onChange={(e) => setBusinessCategory(e.target.value)}
                      >
                        <option value="">Choose category</option>
                        {[
                          "Retail and trade",
                          "Professional services",
                          "Technology",
                          "Logistics",
                          "Other",
                        ].map((item) => (
                          <option key={item}>{item}</option>
                        ))}
                      </select>
                    </label>
                  ) : (
                    <label>
                      Occupation
                      <select
                        required
                        value={occupation}
                        onChange={(e) => setOccupation(e.target.value)}
                      >
                        <option value="">Choose occupation</option>
                        {[
                          "Salaried employee",
                          "Self-employed",
                          "Student",
                          "Other",
                        ].map((item) => (
                          <option key={item}>{item}</option>
                        ))}
                      </select>
                    </label>
                  )}
                </div>

                <label className="auth-full-field">
                  Residential address
                  <input
                    required
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder="Street address and city"
                    autoComplete="street-address"
                  />
                </label>

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
              </>
            )}

            {(mode === "signin" || mode === "forgot") && (
              <>
                {(mode === "forgot" && forgotStage === 1) ||
                (mode === "signin" && accountType === "business") ? (
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

            {error && (
              <div className="notice error-notice auth-notice" role="alert">
                <span>{error}</span>
              </div>
            )}

            <div className="auth-actions">
              {((mode === "signup" && stage > 1) ||
                (mode === "forgot" && forgotStage > 1)) && (
                <button
                  type="button"
                  className="button button-quiet auth-back"
                  onClick={() => {
                    setError("");
                    setNotice("");
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
              >
                {mode === "signup"
                  ? stage === 1
                    ? "Send code"
                    : stage === 2
                      ? "Verify & continue"
                      : "Create account"
                  : mode === "forgot"
                    ? forgotStage === 1
                      ? "Send recovery code"
                      : "Update password"
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
