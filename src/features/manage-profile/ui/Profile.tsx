import type React from 'react';
import { useEffect, useState } from 'react';
import { Icon, PageHeading, toast } from '@/shared/ui';
import { CountryBadge } from '@/entities/country';
import type { Transfer } from '@/entities/transfer';
import type { AccountType } from '@/shared/types';
import {
  VERIFICATION_UPDATED_EVENT,
  loadVerificationRecord,
  saveVerificationRecord,
  type VerificationStatus,
} from '../model/verification';
import { VerificationFlow } from './VerificationFlow';
import { SecuritySettings } from './SecuritySettings';
import { NotificationSettings } from './NotificationSettings';
import { HelpSupport } from './HelpSupport';

export type ProfileTab = "Profile" | "Security" | "Notifications" | "Help & support";

export interface ProfileProps {
  name: string;
  setName: (name: string) => void;
  onLogout: () => void;
  accountType: AccountType;
  activeTab?: ProfileTab;
  onTabChange?: (tab: ProfileTab) => void;
  supportTransferRef?: string;
  onClearSupportTransferRef?: () => void;
  transfers?: Transfer[];
  openVerification?: boolean;
  onStartTransfer?: () => void;
}

export function Profile({
  name,
  setName,
  onLogout,
  accountType,
  activeTab,
  onTabChange,
  supportTransferRef,
  onClearSupportTransferRef,
  transfers = [],
  openVerification = false,
  onStartTransfer,
}: ProfileProps) {
  const isBusiness = accountType === "business";
  const [draft, setDraft] = useState(name);
  const [verificationStatus, setVerificationStatus] = useState<VerificationStatus>(
    () => loadVerificationRecord(accountType).status,
  );

  useEffect(() => {
    const sync = () =>
      setVerificationStatus(loadVerificationRecord(accountType).status);
    window.addEventListener(VERIFICATION_UPDATED_EVENT, sync);
    return () => window.removeEventListener(VERIFICATION_UPDATED_EVENT, sync);
  }, [accountType]);
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
  const [internalTab, setInternalTab] = useState<ProfileTab>("Profile");
  const tab = activeTab ?? internalTab;
  const setTab = (next: ProfileTab) => {
    setInternalTab(next);
    onTabChange?.(next);
  };
  const profileCountry =
    localStorage.getItem(`settle-demo-${accountType}-country`) || "Nigeria";
  const save = (event: React.FormEvent) => {
    event.preventDefault();
    const cleanName = draft.trim();
    if (!cleanName) {
      toast.error(
        isBusiness
          ? "Enter your business name."
          : "Enter your full name.",
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
    const currentVerification = loadVerificationRecord(accountType);
    saveVerificationRecord(accountType, {
      ...currentVerification,
      personal: {
        ...currentVerification.personal,
        ...(isBusiness ? { businessName: cleanName } : { fullName: cleanName }),
        email: email.trim(),
        phone: phone.trim(),
      },
    });
    toast.success("Profile updated.");
  };
  const tabs = ["Profile", "Security", "Notifications", "Help & support"];
  return (
    <>
      <PageHeading title="Profile & settings" />
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
                  {isBusiness ? "Business account" : "Individual account"}
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
                  <strong>{isBusiness ? "BIZ-0001" : "SET-0001"}</strong>
                </div>
                <div>
                  <span>Account type</span>
                  <strong>{isBusiness ? "Business" : "Individual"}</strong>
                </div>
                {isBusiness && (
                  <div>
                    <span>Business category</span>
                    <strong>Small business</strong>
                  </div>
                )}
                {isBusiness && (
                  <div>
                    <span>Registration status</span>
                    <strong>
                      {verificationStatus === "approved"
                        ? "Verified"
                        : verificationStatus === "pending"
                          ? "Pending review"
                          : verificationStatus === "unsuccessful"
                            ? "Resubmission needed"
                            : "Details needed"}
                    </strong>
                  </div>
                )}
              </div>
            </section>
            <VerificationFlow
              key={accountType}
              accountType={accountType}
              forceExpanded={openVerification}
              onNotice={(message) => {
                toast.success(message);
              }}
              onProfileSynced={(syncedName) => {
                if (syncedName.trim()) {
                  setDraft(syncedName.trim());
                  setName(syncedName.trim());
                }
              }}
              onStartTransfer={onStartTransfer}
            />
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
                <button className="button button-primary cursor-pointer" type="submit">
                  Save changes <span>→</span>
                </button>
              </form>
            </section>
          </div>
        ) : (
          <section className="profile-secondary-panel">
            {tab === "Security" ? (
              <SecuritySettings onSaved={(msg) => toast.success(msg)} />
            ) : tab === "Notifications" ? (
              <NotificationSettings onSaved={(msg) => toast.success(msg)} />
            ) : (
              <HelpSupport
                onNotice={(msg) => toast.success(msg)}
                initialTransferRef={supportTransferRef}
                onClearTransferRef={onClearSupportTransferRef}
                transfers={transfers}
              />
            )}
          </section>
        )}
        <nav className="profile-tabs" aria-label="Profile settings">
          {tabs.map((item) => (
            <button
              type="button"
              key={item}
              className={tab === item ? "selected" : ""}
              onClick={() => setTab(item as ProfileTab)}
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
          <button type="button" className="profile-tab-signout" onClick={onLogout}>
            <Icon name="logout" size={17} />
            Sign out
          </button>
        </nav>
      </div>
    </>
  );
}
