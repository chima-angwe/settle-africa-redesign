import { useState } from "react";
import { Icon, LogoMark } from "@/shared/ui";
import { ThemeToggle } from "@/features/theme-toggle";
import { CountryBadge, CountrySelect, callingCodes } from "@/entities/country";
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
  onComplete: (account: AuthCompleteData) => void;
}

export function AuthScreen({
  mode,
  setMode,
  theme,
  onToggleTheme,
  accountType,
  onAccountTypeChange,
  initialCountry,
  onComplete,
}: AuthScreenProps) {
  const [fullName, setFullName] = useState("");
  const [businessName, setBusinessName] = useState("");
  const [businessRegistrationNumber, setBusinessRegistrationNumber] = useState("");
  const [country, setCountry] = useState(initialCountry);
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [stage, setStage] = useState(1);
  const [otp, setOtp] = useState("");
  const [dateOfBirth, setDateOfBirth] = useState("");
  const [address, setAddress] = useState("");
  const [occupation, setOccupation] = useState("");
  const [businessCategory, setBusinessCategory] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");

  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    setError("");
    setNotice("");
    if (mode === "forgot") {
      if (!email.trim()) {
        setError("Enter the email address linked to your account.");
        return;
      }
      setNotice(
        "If an account exists for that email, a reset link is on its way.",
      );
      return;
    }
    if (mode === "signup" && stage === 1) {
      if (accountType === "business" && !businessName.trim()) {
        setError("Enter your business name to continue.");
        return;
      }
      if (accountType === "business" && !businessRegistrationNumber.trim()) {
        setError("Enter your company registration number to continue.");
        return;
      }
      if (!fullName.trim() || !email.trim() || !phone.trim() || !country) {
        setError("Complete the required contact details.");
        return;
      }
      setNotice(`Demo verification code sent to ${phone}.`);
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
      if (
        !dateOfBirth ||
        (accountType === "business" ? !businessCategory : !occupation)
      ) {
        setError("Complete your profile details.");
        return;
      }
      setStage(4);
      return;
    }
    if (mode === "signup" && stage === 4) {
      if (!address.trim()) {
        setError("Enter your residential address to continue.");
        return;
      }
      setStage(5);
      return;
    }
    if (mode === "signup" && stage === 5) {
      if (password.length < 8) {
        setError("Create a password with at least 8 characters.");
        return;
      }
      if (password !== confirmPassword) {
        setError("Your passwords do not match.");
        return;
      }
    }
    if (
      mode === "signin" &&
      (!(accountType === "business" ? email.trim() : phone.trim()) ||
        !password.trim())
    ) {
      setError("Enter your sign-in details.");
      return;
    }
    onComplete({
      accountType,
      country,
      fullName:
        mode === "signup"
          ? fullName.trim()
          : accountType === "individual"
            ? localStorage.getItem("settle-demo-name") || "Chima Angwe"
            : "",
      businessName:
        mode === "signup"
          ? businessName.trim()
          : localStorage.getItem("settle-demo-business-name") ||
            "Chima Ventures",
      email: email.trim(),
      phone: phone.trim(),
      dateOfBirth,
      address: address.trim(),
      occupation,
      businessCategory,
    });
    if (mode === "signup") {
      setMode("signin");
      setNotice("Your account is ready. Sign in to continue.");
      setPassword("");
      setConfirmPassword("");
      setStage(1);
    }
  };

  const heading =
    mode === "signup"
      ? "Create your account"
      : mode === "forgot"
        ? "Reset your password"
        : "Welcome back";

  const changeAccountType = (nextType: AccountType) => {
    onAccountTypeChange(nextType);
    setCountry(
      localStorage.getItem(`settle-demo-${nextType}-country`) || "Nigeria",
    );
    setError("");
    setNotice("");
  };

  return (
    <div className={`auth-page ${mode === "signup" ? "auth-onboarding" : ""}`}>
      <div className="auth-decoration auth-orbit-one" />
      <div className="auth-decoration auth-orbit-two" />
      <div className="auth-top">
        <a className="brand auth-brand flex items-center gap-[11px] p-0 text-ink text-left" href="#home">
          <LogoMark />
          <span className="brand-copy flex flex-col gap-[3px]">
            <strong className="font-heading font-bold text-[13px] tracking-[-0.3px] text-ink">Settle Africa</strong>
            <small className="text-[#929292] text-[8px] font-semibold tracking-[1.5px] uppercase">MOVE MONEY, WITH CLARITY</small>
          </span>
        </a>
        <div className="auth-top-actions flex items-center gap-3.5">
          <ThemeToggle theme={theme} onToggle={onToggleTheme} />
          <div className="auth-top-note hidden sm:flex items-center gap-1.5 text-muted text-[9px]">
            <Icon name="shield" size={16} /> Secure, private transfers
          </div>
        </div>
      </div>
      <div
        className={`auth-layout ${mode === "signup" ? "auth-layout-signup" : ""}`}
      >
        <section className="auth-story hidden md:block">
          <span className="eyebrow text-muted text-[8px] font-bold tracking-[1.65px] flex items-center gap-2">
            <i className="w-1.5 h-1.5 rounded-full bg-current inline-block" /> MONEY THAT MOVES WITH YOU
          </span>
          <h1 className="my-5 text-ink font-heading font-bold text-[clamp(34px,4.4vw,53px)] leading-tight tracking-[-2.5px]">
            Across borders.
            <br />
            <em className="text-muted font-normal italic font-serif">Without the guesswork.</em>
          </h1>
          <div className="auth-story-points grid gap-4 mt-[30px]">
            <div className="flex items-center gap-3">
              <span className="story-icon grid w-[34px] h-[34px] place-items-center border border-line rounded-full text-ink">
                <Icon name="eye" />
              </span>
              <span className="grid gap-0.5">
                <strong className="text-[10px] font-bold text-ink">Know before you send</strong>
                <small className="text-muted text-[9px]">See your rate and fees upfront.</small>
              </span>
            </div>
            <div className="flex items-center gap-3">
              <span className="story-icon grid w-[34px] h-[34px] place-items-center border border-line rounded-full text-ink">
                <Icon name="search" />
              </span>
              <span className="grid gap-0.5">
                <strong className="text-[10px] font-bold text-ink">Follow every transfer</strong>
                <small className="text-muted text-[9px]">Track your money from send to receive.</small>
              </span>
            </div>
          </div>
          <div className="auth-route flex max-w-[400px] items-center gap-3.5 mt-[35px] p-4 border border-line bg-paper">
            <span className="route-circle grid w-[29px] h-[29px] place-items-center border border-ink rounded-full text-ink font-bold text-xs">N</span>
            <div className="flex-1">
              <small className="text-muted text-[7px] tracking-[1px] uppercase">YOUR MONEY, ON ITS WAY</small>
              <div className="route-line relative h-px my-2 border-t border-dashed border-muted">
                <b className="absolute -top-[3px] left-[20%] w-[5px] h-[5px] rounded-full bg-ink" />
                <b className="absolute -top-[3px] left-[54%] w-[5px] h-[5px] rounded-full bg-ink" />
                <b className="absolute -top-[3px] right-[17%] w-[5px] h-[5px] rounded-full bg-ink" />
              </div>
              <strong className="text-[9px] text-ink font-bold">
                Nairobi <span className="mx-1 text-muted">→</span> Lagos
              </strong>
            </div>
            <span className="route-circle route-end grid w-[29px] h-[29px] place-items-center border border-ink rounded-full bg-ink text-inverse-text font-bold text-xs">L</span>
          </div>
        </section>
        <section
          className={`auth-card ${mode === "signup" ? `auth-card-signup signup-stage-${stage}` : ""}`}
        >
          <div className="auth-card-brand flex items-center justify-center gap-2 mb-5 text-[8px] font-bold tracking-[1.5px]">
            <LogoMark />
            <span>SETTLE AFRICA</span>
          </div>
          <span className="auth-label block text-muted text-center text-[7px] font-bold tracking-[1.5px] uppercase">
            {mode === "forgot"
              ? "ACCOUNT ACCESS"
              : `${accountType === "business" ? "BUSINESS" : "INDIVIDUAL"} ACCOUNT`}
          </span>
          <h2 className="my-2 font-heading font-bold text-[21px] tracking-[-0.7px] text-center text-ink">
            {mode === "signup" && stage > 1
              ? stage === 2
                ? "Verify your phone"
                : stage === 3
                  ? "Personal details"
                  : stage === 4
                    ? "Your address"
                    : "Secure your account"
              : heading}
          </h2>
          {(mode === "signin" || (mode === "signup" && stage === 1)) && (
            <div
              className="auth-account-switch"
              aria-label="Choose account type"
            >
              <button
                type="button"
                className={accountType === "individual" ? "selected" : ""}
                onClick={() => changeAccountType("individual")}
              >
                <Icon name="user" size={16} /> Individual
              </button>
              <button
                type="button"
                className={accountType === "business" ? "selected" : ""}
                onClick={() => changeAccountType("business")}
              >
                <Icon name="building" size={16} /> Business
              </button>
            </div>
          )}
          {mode === "signup" && (
            <div
              className="signup-progress"
              aria-label={`Signup step ${stage} of 5`}
            >
              {["Contact", "Verify", "Profile", "Address", "Password"].map(
                (label, index) => (
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
                ),
              )}
            </div>
          )}
          {notice && (
            <div className="notice success-notice flex items-center gap-2 p-3 border border-line border-l-[3px] border-l-ink bg-paper text-ink text-[9px] mb-3">
              <Icon name="check" size={16} />
              {notice}
            </div>
          )}
          <form
            onSubmit={submit}
            className={`auth-form ${mode === "signup" ? "auth-signup-form" : ""}`}
          >
            {mode === "signup" && stage === 1 && (
              <>
                {accountType === "business" && (
                  <label className="grid gap-1.5 text-muted text-[8px] font-bold">
                    Business name
                    <input
                      required
                      value={businessName}
                      onChange={(e) => setBusinessName(e.target.value)}
                      placeholder="e.g. Chima Ventures"
                      autoComplete="organization"
                    />
                  </label>
                )}
                {accountType === "business" && (
                  <label className="grid gap-1.5 text-muted text-[8px] font-bold">
                    Company registration number
                    <input
                      required
                      value={businessRegistrationNumber}
                      onChange={(e) => setBusinessRegistrationNumber(e.target.value)}
                      placeholder="e.g. RC 1234567"
                      autoComplete="off"
                    />
                  </label>
                )}
                <label className="grid gap-1.5 text-muted text-[8px] font-bold">
                  {accountType === "business" ? "Your full name" : "Full name"}
                  <input
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="e.g. Chima Angwe"
                    autoComplete="name"
                  />
                </label>
                <label className="grid gap-1.5 text-muted text-[8px] font-bold">
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
                <div className="auth-phone-country-field">
                  <label className="auth-phone-label text-muted text-[8px] font-bold">Phone number</label>
                  <div className="auth-phone-country-control">
                    <div className="auth-phone-country-select">
                      <CountrySelect value={country} onChange={setCountry} />
                    </div>
                    <div className="auth-phone-input-wrap">
                      <span>{callingCodes[country] || "+"}</span>
                      <input
                        required
                        type="tel"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value.replace(/[^0-9 ]/g, ""))}
                        placeholder="801 234 5678"
                        autoComplete="tel-national"
                      />
                    </div>
                  </div>
                  <small className="auth-field-hint text-subtle text-[8px]">Your country will be the default for transfers.</small>
                </div>
              </>
            )}
            {mode === "signup" && stage === 2 && (
              <div className="otp-panel">
                <span className="otp-icon inline-grid w-11 h-11 place-items-center border border-line rounded-full bg-soft text-ink mb-2">
                  <Icon name="phone" size={22} />
                </span>
                <p className="text-muted text-xs">
                  Enter the 6-digit code sent to <strong>{phone}</strong>.
                </p>
                <label className="grid gap-1.5 text-muted text-[8px] font-bold">
                  Verification code
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
                    className="text-center font-mono tracking-widest text-base"
                  />
                </label>
                <small className="text-muted text-[8px]">
                  Prototype code: <strong>123456</strong>
                </small>
                <button
                  type="button"
                  className="text-button otp-resend text-[9px] font-bold text-ink underline"
                  onClick={() =>
                    setNotice(`Demo code resent to ${phone}: 123456`)
                  }
                >
                  Resend code
                </button>
              </div>
            )}
            {mode === "signup" && stage === 3 && (
              <>
                <label className="grid gap-1.5 text-muted text-[8px] font-bold">
                  Date of birth
                  <input
                    required
                    type="date"
                    value={dateOfBirth}
                    onChange={(e) => setDateOfBirth(e.target.value)}
                  />
                </label>
                {accountType === "business" ? (
                  <label className="grid gap-1.5 text-muted text-[8px] font-bold">
                    Business type
                    <select
                      required
                      value={businessCategory}
                      onChange={(e) => setBusinessCategory(e.target.value)}
                    >
                      <option value="">Choose a category</option>
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
                  <label className="grid gap-1.5 text-muted text-[8px] font-bold">
                    Occupation
                    <select
                      required
                      value={occupation}
                      onChange={(e) => setOccupation(e.target.value)}
                    >
                      <option value="">Choose your occupation</option>
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
              </>
            )}
            {mode === "signup" && stage === 4 && (
              <>
                <label className="grid gap-1.5 text-muted text-[8px] font-bold">
                  Residential address
                  <input
                    required
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder="Street address and city"
                    autoComplete="street-address"
                  />
                </label>
                <div className="signup-country-summary flex items-center gap-2 p-2.5 border border-line rounded bg-soft text-ink">
                  <span className="signup-country-icon inline-grid w-6 h-6 place-items-center border border-line rounded-full bg-paper">
                    <Icon name="check" size={17} />
                  </span>
                  <span className="grid gap-0.5">
                    <strong>
                      <CountryBadge country={country} />
                    </strong>
                    <small className="text-muted text-[8px]">
                      Your selected country will be used as the default in
                      transfers.
                    </small>
                  </span>
                </div>
              </>
            )}
            {mode === "signup" && stage === 5 && (
              <>
                <label className="signup-password-field grid gap-1.5 text-muted text-[8px] font-bold">
                  Create password
                  <div className="password-wrap relative">
                    <input
                      required
                      minLength={8}
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="At least 8 characters"
                      autoComplete="new-password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((v) => !v)}
                      aria-label={
                        showPassword ? "Hide password" : "Show password"
                      }
                      className="absolute top-2 right-2.5 text-muted"
                    >
                      <Icon name="eye" size={17} />
                    </button>
                  </div>
                </label>
                <label className="signup-confirm-field grid gap-1.5 text-muted text-[8px] font-bold">
                  Confirm password
                  <input
                    required
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Re-enter your password"
                    autoComplete="new-password"
                  />
                </label>
              </>
            )}
            {(mode === "signin" || mode === "forgot") && (
              <>
                {mode === "forgot" || accountType === "business" ? (
                  <label className="grid gap-1.5 text-muted text-[8px] font-bold">
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
                ) : (
                  <label className="grid gap-1.5 text-muted text-[8px] font-bold">
                    Phone number
                    <input
                      required
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="Phone number"
                      autoComplete="tel"
                    />
                  </label>
                )}
                {mode === "signin" && (
                  <label className="grid gap-1.5 text-muted text-[8px] font-bold">
                    Password
                    <div className="password-wrap relative">
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
                        className="absolute top-2 right-2.5 text-muted"
                      >
                        <Icon name="eye" size={17} />
                      </button>
                    </div>
                  </label>
                )}
                {mode === "signin" && (
                  <button
                    type="button"
                    className="forgot-link justify-self-end text-ink text-[8px] font-bold hover:underline"
                    onClick={() => {
                      setError("");
                      setMode("forgot");
                    }}
                  >
                    Forgot password?
                  </button>
                )}
              </>
            )}
            {error && <div className="notice error-notice flex items-center gap-2 p-3 border border-line border-l-[3px] border-l-ink bg-paper text-ink text-[9px]">{error}</div>}
            {mode === "signup" && stage > 1 && (
              <button
                type="button"
                className="button button-quiet auth-back inline-flex min-h-[42px] items-center justify-center gap-2 px-4 rounded border border-line bg-transparent text-ink text-[10px] font-bold hover:bg-soft transition-colors"
                onClick={() => {
                  setError("");
                  setNotice("");
                  setStage(stage - 1);
                }}
              >
                ← Back
              </button>
            )}
            <button className="button button-primary auth-submit inline-flex min-h-[42px] items-center justify-center gap-2 px-4 rounded border border-transparent bg-ink text-inverse-text text-[10px] font-bold hover:opacity-90 transition-all cursor-pointer" type="submit">
              {mode === "signup"
                ? stage === 1
                  ? "Send verification code"
                  : stage === 2
                    ? "Verify phone number"
                    : stage === 5
                      ? "Create account"
                      : "Continue"
                : mode === "forgot"
                  ? "Send reset link"
                  : "Sign in"}
              <span>→</span>
            </button>
          </form>
          {mode !== "forgot" && (
            <div className="auth-switch text-center text-muted text-[8px] mt-4">
              {mode === "signin" ? (
                <>
                  New to Settle?{" "}
                  <button
                    type="button"
                    className="text-ink font-bold hover:underline"
                    onClick={() => {
                      setError("");
                      setNotice("");
                      setStage(1);
                      setMode("signup");
                    }}
                  >
                    Create an account
                  </button>
                </>
              ) : stage === 1 ? (
                <>
                  Already have an account?{" "}
                  <button
                    type="button"
                    className="text-ink font-bold hover:underline"
                    onClick={() => {
                      setError("");
                      setNotice("");
                      setStage(1);
                      setMode("signin");
                    }}
                  >
                    Sign in
                  </button>
                </>
              ) : (
                <button
                  type="button"
                  className="text-ink font-bold hover:underline"
                  onClick={() => {
                    setError("");
                    setNotice("");
                    setStage(1);
                    setMode("signin");
                  }}
                >
                  Return to sign in
                </button>
              )}
            </div>
          )}
          {mode === "forgot" && (
            <div className="auth-switch text-center text-muted text-[8px] mt-4">
              <button
                type="button"
                className="text-ink font-bold hover:underline"
                onClick={() => {
                  setError("");
                  setNotice("");
                  setMode("signin");
                }}
              >
                Back to sign in
              </button>
            </div>
          )}
          {mode !== "signup" || stage === 5 ? (
            <div className="auth-legal text-center text-subtle text-[7px] leading-relaxed mt-4">
              By continuing, you agree to our <a href="#terms" className="underline">Terms</a> and{" "}
              <a href="#privacy" className="underline">Privacy Policy</a>.
            </div>
          ) : null}
        </section>
      </div>
      <div className="auth-footer flex justify-between items-center text-subtle text-[8px] mt-auto pt-4 border-t border-line/40">
        <span>© 2026 Settle Africa</span>
        <span className="flex items-center gap-1.5">
          <i className="secure-dot inline-block w-1.5 h-1.5 rounded-full bg-ink" /> Protected connection
        </span>
      </div>
    </div>
  );
}

