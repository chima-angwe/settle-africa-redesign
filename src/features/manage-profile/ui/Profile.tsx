import type React from 'react';
import { useState } from 'react';
import { Icon, PageHeading } from '@/shared/ui';
import { CountryBadge } from '@/entities/country';
import type { AccountType } from '@/shared/types';
import { SecuritySettings } from './SecuritySettings';
import { NotificationSettings } from './NotificationSettings';
import { HelpSupport } from './HelpSupport';

export interface ProfileProps {
  name: string;
  setName: (name: string) => void;
  onLogout: () => void;
  accountType: AccountType;
}

export function Profile({
  name,
  setName,
  onLogout,
  accountType,
}: {
  name: string;
  setName: (name: string) => void;
  onLogout: () => void;
  accountType: AccountType;
}) {
  const isBusiness = accountType === "business";
  const [draft, setDraft] = useState(name);
  const [email, setEmail] = useState(
    () =>
      localStorage.getItem(`settle-demo-${accountType}-email`) ||
      (!isBusiness ? localStorage.getItem("settle-demo-email") : null) ||
      (isBusiness
        ? "accounts@chimaventures.example"
        : "chima.angwe@example.com"),
  );
  const [phone, setPhone] = useState(
    () =>
      localStorage.getItem(`settle-demo-${accountType}-phone`) ||
      (!isBusiness ? localStorage.getItem("settle-demo-phone") : null) ||
      "801 234 5678",
  );
  const [notice, setNotice] = useState("");
  const [tab, setTab] = useState("Profile");
  const profileCountry =
    localStorage.getItem(`settle-demo-${accountType}-country`) || "Nigeria";
  const save = (event: React.FormEvent) => {
    event.preventDefault();
    const cleanName = draft.trim();
    if (!cleanName) {
      setNotice(
        isBusiness
          ? "Enter your business name before saving."
          : "Enter your full name before saving.",
      );
      return;
    }
    setDraft(cleanName);
    setName(cleanName);
    localStorage.setItem(
      isBusiness ? "settle-demo-business-name" : "settle-demo-name",
      cleanName,
    );
    localStorage.setItem(`settle-demo-${accountType}-email`, email.trim());
    localStorage.setItem(`settle-demo-${accountType}-phone`, phone.trim());
    localStorage.setItem(
      isBusiness ? "settle-demo-business-email" : "settle-demo-email",
      email.trim(),
    );
    localStorage.setItem(
      isBusiness ? "settle-demo-business-phone" : "settle-demo-phone",
      phone.trim(),
    );
    setNotice("Your profile was updated in this prototype.");
    setTimeout(() => setNotice(""), 3000);
  };
  const tabs = ["Profile", "Security", "Notifications", "Help & support"];
  return (
    <>
      <PageHeading
        eyebrow={isBusiness ? "BUSINESS ACCOUNT" : "YOUR ACCOUNT"}
        title="Profile & settings"
        subtitle=""
      />
      {notice && (
        <div className="notice success-notice">
          <Icon name="check" size={16} />
          {notice}
        </div>
      )}
      <div className="profile-v2">
        {tab === "Profile" ? (
          <div className="profile-overview">
            <section className="profile-hero">
              <span className="avatar avatar-light profile-hero-avatar">
                {isBusiness ? (
                  <Icon name="building" size={28} />
                ) : (
                  name
                    .split(" ")
                    .map((part) => part[0])
                    .slice(0, 2)
                    .join("")
                    .toUpperCase()
                )}
              </span>
              <div className="profile-hero-copy">
                <h2>{name}</h2>
                <span className="profile-tier">
                  <Icon name="shield" size={14} />{" "}
                  {isBusiness
                    ? "Business account · Demo"
                    : "Individual account · Demo"}
                </span>
              </div>
              <span className="profile-hero-mark">SETTLE AFRICA</span>
            </section>
            <section className="profile-summary-card">
              <h2>
                {isBusiness ? "Business account summary" : "Account summary"}
              </h2>
              <div className="profile-summary-grid">
                <div>
                  <span>Account reference</span>
                  <strong>
                    {isBusiness ? "BIZ-0001" : "SET-0001"} <small>DEMO</small>
                  </strong>
                </div>
                <div>
                  <span>Account type</span>
                  <strong>{isBusiness ? "Business" : "Individual"}</strong>
                </div>
                {isBusiness && (
                  <div>
                    <span>Business category</span>
                    <strong>
                      Small business <small>DEMO</small>
                    </strong>
                  </div>
                )}
                {isBusiness && (
                  <div>
                    <span>Registration status</span>
                    <strong>Details needed</strong>
                  </div>
                )}
              </div>
            </section>
            <section className="profile-kyc-panel">
              <div className="profile-section-heading">
                <h2>
                  {isBusiness ? "Business verification" : "KYC & compliance"}
                </h2>
                <button
                  onClick={() =>
                    setNotice(
                      `${isBusiness ? "Business" : "Identity"} verification will be connected in a later milestone.`,
                    )
                  }
                >
                  View verification <span>›</span>
                </button>
              </div>
              <div className="profile-kyc-status">
                <span className="profile-kyc-icon">
                  <Icon name="shield" size={20} />
                </span>
                <div>
                  <strong>
                    {isBusiness
                      ? "Company verification"
                      : "Identity verification"}
                  </strong>
                  <p>
                    {isBusiness
                      ? "Business verification requirements will depend on the supported markets and service providers."
                      : "Complete verification to unlock higher transfer limits and account features."}
                  </p>
                </div>
                <span className="verification-badge warning-badge">
                  NOT VERIFIED
                </span>
                <button
                  className="button button-primary button-small"
                  onClick={() =>
                    setNotice(
                      `${isBusiness ? "Business" : "Identity"} verification will be connected in a later milestone.`,
                    )
                  }
                >
                  Start verification
                </button>
              </div>
            </section>
            <section className="profile-personal-card">
              <div className="profile-section-heading">
                <div>
                  <h2>
                    {isBusiness ? "Business details" : "Personal details"}
                  </h2>
                </div>
              </div>
              <form className="profile-details-form" onSubmit={save}>
                <label className="profile-detail-row">
                  <span>{isBusiness ? "Business name" : "Full name"}</span>
                  <input
                    required
                    value={draft}
                    onChange={(e) => setDraft(e.target.value)}
                  />
                </label>
                <label className="profile-detail-row">
                  <span>{isBusiness ? "Business email" : "Email address"}</span>
                  <input
                    required
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </label>
                <label className="profile-detail-row">
                  <span>{isBusiness ? "Business phone" : "Phone number"}</span>
                  <input
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                  />
                </label>
                <div className="profile-detail-row">
                  <span>Country</span>
                  <strong>
                    <CountryBadge country={profileCountry} />
                  </strong>
                </div>
                <button className="button button-primary" type="submit">
                  Save changes <span>→</span>
                </button>
              </form>
            </section>
          </div>
        ) : (
          <section className="profile-secondary-panel">
            {tab === "Security" ? (
              <SecuritySettings onSaved={setNotice} />
            ) : tab === "Notifications" ? (
              <NotificationSettings />
            ) : (
              <HelpSupport onNotice={setNotice} />
            )}
          </section>
        )}
        <nav className="profile-tabs" aria-label="Profile settings">
          {tabs.map((item) => (
            <button
              key={item}
              className={tab === item ? "selected" : ""}
              onClick={() => setTab(item)}
            >
              <Icon
                name={
                  item === "Profile"
                    ? "user"
                    : item === "Security"
                      ? "shield"
                      : item === "Notifications"
                        ? "bell"
                        : "search"
                }
                size={17}
              />
              {item}
            </button>
          ))}
          <button className="profile-tab-signout" onClick={onLogout}>
            <Icon name="logout" size={17} />
            Sign out
          </button>
        </nav>
      </div>
    </>
  );
}