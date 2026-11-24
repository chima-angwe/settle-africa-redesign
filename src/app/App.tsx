import { useCallback, useEffect, useRef, useState } from "react";
import type { Page, AccountType, Theme } from "@/shared/types";
import {
  clearSession,
  getSession,
  isSessionExpired,
  refreshSession,
  startSession,
} from "@/shared/lib";
import type { Recipient } from "@/entities/recipient";
import { initialRecipients, businessRecipients } from "@/entities/recipient";
import {
  initialTransfers,
  businessTransfers,
  BUSINESS_APPROVAL_REQUESTS,
  loadApprovedIds,
  type Transfer,
} from "@/entities/transfer";
import {
  INITIAL_CORPORATE_FUNDING_SOURCES,
  STORAGE_KEYS,
  type RetryTransferDraft,
} from "@/features/send-money";

import { Sidebar } from "@/widgets/sidebar";
import { Topbar } from "@/widgets/topbar";
import { TransactionDetailsDrawer } from "@/widgets/transaction-details-drawer";

import { AuthPage } from "@/pages/auth";
import { DashboardPage } from "@/pages/dashboard";
import { BusinessDashboardPage } from "@/pages/business-dashboard";
import { SendMoneyPage } from "@/pages/send-money";
import { BulkTransferPage } from "@/pages/bulk-transfer";
import { RecipientsPage } from "@/pages/recipients";
import { TransactionsPage } from "@/pages/transactions";
import { TrackTransactionPage } from "@/pages/track-transaction";
import { LinkedBanksPage } from "@/pages/linked-banks";
import { ProfilePage } from "@/pages/profile";
import {
  VERIFICATION_UPDATED_EVENT,
  loadVerificationRecord,
  type ProfileTab,
  type VerificationRecord,
} from "@/features/manage-profile";
import { WalletPage } from "@/pages/wallet";
import { NotificationsPage } from "@/pages/notifications";

function readStoredAccountData(): {
  data: Record<AccountType, { recipients: Recipient[]; transfers: Transfer[] }>;
  error: string | null;
} {
  try {
    const resetFlag = "settle-demo-transfers-empty-v1";
    if (localStorage.getItem(resetFlag) !== "true") {
      localStorage.setItem(resetFlag, "true");
      localStorage.setItem("settle-demo-individual-transfers", "[]");
      localStorage.setItem("settle-demo-transfers", "[]");
      localStorage.setItem("settle-demo-business-transfers", "[]");
    }

    const safeParse = <T,>(raw: string | null, fallback: T): T => {
      if (!raw || raw === "null") return fallback;
      return JSON.parse(raw) || fallback;
    };

    return {
      data: {
        individual: {
          recipients: safeParse(
            localStorage.getItem(STORAGE_KEYS.BENEFICIARIES) ||
              localStorage.getItem("settle-demo-individual-recipients") ||
              localStorage.getItem("settle-demo-recipients"),
            initialRecipients,
          ),
          transfers: safeParse(
            localStorage.getItem("settle-demo-individual-transfers") ||
              localStorage.getItem("settle-demo-transfers"),
            initialTransfers,
          ),
        },
        business: {
          recipients: safeParse(
            localStorage.getItem("settle-demo-business-recipients"),
            businessRecipients,
          ),
          transfers: safeParse(
            localStorage.getItem("settle-demo-business-transfers"),
            businessTransfers,
          ),
        },
      },
      error: null,
    };
  } catch {
    return {
      data: {
        individual: { recipients: initialRecipients, transfers: initialTransfers },
        business: { recipients: businessRecipients, transfers: businessTransfers },
      },
      error: "Some saved transfer history could not be read from browser storage.",
    };
  }
}

export function App() {
  const [page, setPage] = useState<Page>("Dashboard");
  const [accountType, setAccountType] = useState<AccountType>(() => {
    const directKey = localStorage.getItem(STORAGE_KEYS.ACCOUNT_TYPE);
    if (directKey === "business") return "business";
    return localStorage.getItem("settle-demo-account-type") === "business"
      ? "business"
      : "individual";
  });
  const [businessName, setBusinessName] = useState(
    () => localStorage.getItem("settle-demo-business-name") || "Chima Ventures",
  );
  const [theme, setTheme] = useState<Theme>(() =>
    localStorage.getItem("settle-demo-theme") === "dark" ? "dark" : "light",
  );
  const [signedIn, setSignedIn] = useState(() => {
    if (localStorage.getItem("settle-demo-user") !== "true") return false;
    if (isSessionExpired()) {
      clearSession();
      return false;
    }
    if (!getSession()) {
      startSession();
    }
    return true;
  });
  const [sessionNotice, setSessionNotice] = useState(() => {
    if (localStorage.getItem("settle-demo-user") === "true" && isSessionExpired()) {
      return "Your session has expired. Please sign in again.";
    }
    return "";
  });
  const [authMode, setAuthMode] = useState<"signin" | "signup" | "forgot">(
    "signin",
  );
  const [name, setName] = useState(() => {
    const savedName = localStorage.getItem("settle-demo-name");
    if (!savedName || savedName === "Osunjimi Ibrahim") {
      localStorage.setItem("settle-demo-name", "Chima Angwe");
      return "Chima Angwe";
    }
    return savedName;
  });

  const [initialStorageSnapshot] = useState(() => readStoredAccountData());
  const [dataLoadError, setDataLoadError] = useState<string | null>(
    () => initialStorageSnapshot.error,
  );
  const [accountData, setAccountData] = useState<
    Record<AccountType, { recipients: Recipient[]; transfers: Transfer[] }>
  >(() => initialStorageSnapshot.data);

  const loadStoredAccountData = useCallback(() => {
    const next = readStoredAccountData();
    setDataLoadError(next.error);
    return next.data;
  }, []);

  const { recipients, transfers } = accountData[accountType];

  const setRecipients: React.Dispatch<React.SetStateAction<Recipient[]>> = (
    action,
  ) =>
    setAccountData((current) => ({
      ...current,
      [accountType]: {
        ...current[accountType],
        recipients:
          typeof action === "function"
            ? action(current[accountType].recipients)
            : action,
      },
    }));

  const setTransfers: React.Dispatch<React.SetStateAction<Transfer[]>> = (
    action,
  ) =>
    setAccountData((current) => ({
      ...current,
      [accountType]: {
        ...current[accountType],
        transfers:
          typeof action === "function"
            ? action(current[accountType].transfers)
            : action,
      },
    }));

  const [mobileNav, setMobileNav] = useState(false);
  const [query, setQuery] = useState("");
  const [activeTransfer, setActiveTransfer] = useState<Transfer | null>(null);
  const [profileTab, setProfileTab] = useState<ProfileTab>("Profile");
  const [openVerificationPanel, setOpenVerificationPanel] = useState(false);
  const [verificationRecord, setVerificationRecord] = useState<VerificationRecord>(
    () => loadVerificationRecord(accountType),
  );
  const [supportTransferRef, setSupportTransferRef] = useState("");
  const [retryDraft, setRetryDraft] = useState<RetryTransferDraft | null>(null);
  const [targetRecipientId, setTargetRecipientId] = useState<number | null>(
    null,
  );
  const [pendingApprovalCount, setPendingApprovalCount] = useState<number>(() => {
    const approved = loadApprovedIds();
    return BUSINESS_APPROVAL_REQUESTS.filter((r) => !approved.includes(r.id)).length;
  });

  useEffect(() => {
    const syncVerification = () =>
      setVerificationRecord(loadVerificationRecord(accountType));
    syncVerification();
    window.addEventListener(VERIFICATION_UPDATED_EVENT, syncVerification);
    return () =>
      window.removeEventListener(VERIFICATION_UPDATED_EVENT, syncVerification);
  }, [accountType]);

  useEffect(() => {
    const syncApprovals = () => {
      const approved = loadApprovedIds();
      setPendingApprovalCount(
        BUSINESS_APPROVAL_REQUESTS.filter((r) => !approved.includes(r.id)).length,
      );
    };
    window.addEventListener("settle-approvals-updated", syncApprovals);
    return () => window.removeEventListener("settle-approvals-updated", syncApprovals);
  }, []);

  // Initialize Section 7 corporate funding sources if not present
  useEffect(() => {
    if (!localStorage.getItem(STORAGE_KEYS.FUNDING_SOURCES)) {
      localStorage.setItem(
        STORAGE_KEYS.FUNDING_SOURCES,
        JSON.stringify(INITIAL_CORPORATE_FUNDING_SOURCES),
      );
    }
  }, []);

  useEffect(() => {
    localStorage.setItem(
      `settle-demo-${accountType}-recipients`,
      JSON.stringify(recipients),
    );
    if (accountType === "individual") {
      localStorage.setItem(
        "settle-demo-recipients",
        JSON.stringify(recipients),
      );
      localStorage.setItem(
        STORAGE_KEYS.BENEFICIARIES,
        JSON.stringify(recipients),
      );
    }
    localStorage.setItem(
      STORAGE_KEYS.ACCOUNT_TYPE,
      accountType === "business" ? "business" : "personal",
    );
  }, [accountType, recipients]);

  useEffect(() => {
    localStorage.setItem(
      `settle-demo-${accountType}-transfers`,
      JSON.stringify(transfers),
    );
    if (accountType === "individual") {
      localStorage.setItem("settle-demo-transfers", JSON.stringify(transfers));
    }
  }, [accountType, transfers]);

  const lastActivityRefreshRef = useRef(0);

  const expireSession = useCallback((message: string) => {
    clearSession();
    setSignedIn(false);
    setAuthMode("signin");
    setSessionNotice(message);
    setActiveTransfer(null);
  }, []);

  const ensureActiveSession = useCallback(() => {
    if (isSessionExpired()) {
      expireSession("Your session expired. Please sign in again to continue.");
      return false;
    }
    refreshSession();
    return true;
  }, [expireSession]);

  useEffect(() => {
    if (!signedIn) return;
    if (!getSession()) {
      startSession();
    }

    const handleActivity = () => {
      const now = Date.now();
      if (now - lastActivityRefreshRef.current < 15000) return;
      lastActivityRefreshRef.current = now;
      if (isSessionExpired()) {
        expireSession("Your session has expired due to inactivity. Please sign in again.");
      } else {
        refreshSession();
      }
    };

    const checkExpiry = () => {
      if (isSessionExpired()) {
        expireSession("Your session has expired due to inactivity. Please sign in again.");
      }
    };

    const interval = window.setInterval(checkExpiry, 10000);
    window.addEventListener("pointerdown", handleActivity);
    window.addEventListener("keydown", handleActivity);
    window.addEventListener("focus", checkExpiry);
    window.addEventListener("storage", checkExpiry);
    document.addEventListener("visibilitychange", checkExpiry);

    return () => {
      window.clearInterval(interval);
      window.removeEventListener("pointerdown", handleActivity);
      window.removeEventListener("keydown", handleActivity);
      window.removeEventListener("focus", checkExpiry);
      window.removeEventListener("storage", checkExpiry);
      document.removeEventListener("visibilitychange", checkExpiry);
    };
  }, [signedIn, expireSession]);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    localStorage.setItem("settle-demo-theme", theme);
  }, [theme]);

  const toggleTheme = () =>
    setTheme((current) => (current === "light" ? "dark" : "light"));

  const switchAccount = (type: AccountType) => {
    setAccountType(type);
    localStorage.setItem("settle-demo-account-type", type);
    localStorage.setItem(
      STORAGE_KEYS.ACCOUNT_TYPE,
      type === "business" ? "business" : "personal",
    );
    setPage("Dashboard");
  };

  const handleLogout = () => {
    clearSession();
    setSessionNotice("");
    setSignedIn(false);
    setAuthMode("signin");
  };

  const openVerificationFlow = useCallback(() => {
    setOpenVerificationPanel(true);
    setProfileTab("Profile");
    setPage("Profile");
  }, []);

  const openHelp = useCallback(() => {
    setSupportTransferRef("");
    setProfileTab("Help & support");
    setPage("Profile");
  }, []);

  const handleContactSupport = useCallback((transfer: Transfer) => {
    setActiveTransfer(null);
    setSupportTransferRef(transfer.id);
    setProfileTab("Help & support");
    setPage("Profile");
  }, []);

  const handleCancelTransfer = useCallback(
    (transfer: Transfer) => {
      const reason = "Cancelled by sender before settlement.";
      setAccountData((current) => ({
        ...current,
        [accountType]: {
          ...current[accountType],
          transfers: current[accountType].transfers.map((item) =>
            item.id === transfer.id
              ? { ...item, status: "Cancelled", cancellationReason: reason }
              : item,
          ),
        },
      }));
      setActiveTransfer((current) =>
        current && current.id === transfer.id
          ? { ...current, status: "Cancelled", cancellationReason: reason }
          : current,
      );
    },
    [accountType],
  );

  const handleRetryTransfer = useCallback((transfer: Transfer) => {
    const methodKey =
      transfer.method === "Cash pickup"
        ? "cash"
        : transfer.method === "Mobile money" || transfer.method === "M-Pesa"
          ? "mobile"
          : "bank";
    setRetryDraft({
      amount: String(transfer.amount),
      targetCountry: transfer.country,
      payoutMethod: methodKey,
      bankName: transfer.provider || "",
      accountName: transfer.name,
      pickupCity: transfer.pickupCity,
      recipientPhone: transfer.recipientPhone,
      description: transfer.description,
    });
    setTargetRecipientId(null);
    setActiveTransfer(null);
    setPage("Send money");
  }, []);

  if (!signedIn) {
    return (
      <AuthPage
        mode={authMode}
        setMode={setAuthMode}
        theme={theme}
        onToggleTheme={toggleTheme}
        accountType={accountType}
        onAccountTypeChange={setAccountType}
        initialCountry={
          localStorage.getItem(`settle-demo-${accountType}-country`) ||
          "Nigeria"
        }
        sessionNotice={sessionNotice}
        onClearSessionNotice={() => setSessionNotice("")}
        onComplete={({
          accountType: selectedType,
          country,
          fullName,
          businessName: company,
          email,
          phone,
          dateOfBirth,
          address,
          occupation,
          businessCategory,
        }) => {
          setAccountType(selectedType);
          localStorage.setItem("settle-demo-account-type", selectedType);
          localStorage.setItem(
            STORAGE_KEYS.ACCOUNT_TYPE,
            selectedType === "business" ? "business" : "personal",
          );
          localStorage.setItem(`settle-demo-${selectedType}-country`, country);
          if (fullName) {
            setName(fullName);
            localStorage.setItem("settle-demo-name", fullName);
          }
          if (selectedType === "business" && company) {
            setBusinessName(company);
            localStorage.setItem("settle-demo-business-name", company);
          }
          if (email)
            localStorage.setItem(`settle-demo-${selectedType}-email`, email);
          if (phone)
            localStorage.setItem(`settle-demo-${selectedType}-phone`, phone);
          if (dateOfBirth)
            localStorage.setItem(
              `settle-demo-${selectedType}-dob`,
              dateOfBirth,
            );
          if (address)
            localStorage.setItem(
              `settle-demo-${selectedType}-address`,
              address,
            );
          if (occupation)
            localStorage.setItem(
              `settle-demo-${selectedType}-occupation`,
              occupation,
            );
          if (businessCategory)
            localStorage.setItem(
              "settle-demo-business-category",
              businessCategory,
            );
          if (authMode === "signup") {
            setAuthMode("signin");
            setSignedIn(false);
          } else {
            startSession();
            setSessionNotice("");
            setSignedIn(true);
          }
        }}
      />
    );
  }

  const hasActiveNotifications =
    verificationRecord.status !== "approved" ||
    (accountType === "business" && pendingApprovalCount > 0) ||
    transfers.some(
      (t) =>
        t.status === "Pending" ||
        t.status === "Processing" ||
        t.status === "Failed",
    );

  return (
    <div className="portal">
      <Sidebar
        page={page}
        setPage={(nextPage) => {
          if (nextPage === "Profile") {
            setProfileTab("Profile");
          }
          setPage(nextPage);
        }}
        accountType={accountType}
        mobileNav={mobileNav}
        setMobileNav={setMobileNav}
        onLogout={handleLogout}
        onClearTargetRecipient={() => {
          setTargetRecipientId(null);
          setRetryDraft(null);
        }}
        onOpenHelp={openHelp}
        isHelpActive={profileTab === "Help & support"}
      />
      <main className="main-area">
        <Topbar
          mobileNav={mobileNav}
          setMobileNav={setMobileNav}
          theme={theme}
          onToggleTheme={toggleTheme}
          accountType={accountType}
          name={name}
          businessName={businessName}
          onSwitchAccount={switchAccount}
          onOpenNotifications={() => setPage("Notifications")}
          hasNotificationDot={hasActiveNotifications}
        />
        <div className="page-content">
          {page === "Dashboard" &&
            (accountType === "business" ? (
              <BusinessDashboardPage
                businessName={businessName}
                transfers={transfers}
                recipientsCount={recipients.length}
                loadError={dataLoadError}
                onRetryLoad={() => setAccountData(loadStoredAccountData())}
                setPage={(nextPage) => {
                  if (nextPage === "Send money") setTargetRecipientId(null);
                  setPage(nextPage);
                }}
                onSelectTransfer={setActiveTransfer}
              />
            ) : (
              <DashboardPage
                name={name}
                transfers={transfers}
                recipientsCount={recipients.length}
                loadError={dataLoadError}
                onRetryLoad={() => setAccountData(loadStoredAccountData())}
                setPage={(nextPage) => {
                  if (nextPage === "Send money") setTargetRecipientId(null);
                  setPage(nextPage);
                }}
                onSelectTransfer={setActiveTransfer}
              />
            ))}
          {page === "Wallet" && (
            <WalletPage
              country={
                localStorage.getItem(`settle-demo-${accountType}-country`) ||
                "Nigeria"
              }
              setPage={setPage}
              onBeforeSubmit={ensureActiveSession}
              onRecordTransfer={(newTransfer) =>
                setTransfers((current) => [newTransfer, ...current])
              }
            />
          )}
          {page === "Send money" && (
            <SendMoneyPage
              recipients={recipients}
              targetRecipientId={targetRecipientId}
              retryDraft={retryDraft}
              defaultCountry={
                localStorage.getItem(`settle-demo-${accountType}-country`) ||
                "Nigeria"
              }
              setTargetRecipientId={setTargetRecipientId}
              setRecipients={setRecipients}
              transfers={transfers}
              setTransfers={setTransfers}
              onBeforeSubmit={ensureActiveSession}
              onContactSupport={handleContactSupport}
              accountType={accountType}
              verificationStatus={verificationRecord.status}
              onOpenVerification={openVerificationFlow}
              setPage={setPage}
            />
          )}
          {page === "Bulk transfer" && accountType === "business" && (
            <BulkTransferPage
              setTransfers={setTransfers}
              onTrackTransfer={setActiveTransfer}
              onBeforeSubmit={ensureActiveSession}
              verificationStatus={verificationRecord.status}
              onOpenVerification={openVerificationFlow}
            />
          )}
          {page === "Recipients" && (
            <RecipientsPage
              recipients={recipients}
              setRecipients={setRecipients}
              onSend={(id) => {
                setTargetRecipientId(id);
                setPage("Send money");
              }}
              query={query}
              setQuery={setQuery}
            />
          )}
          {page === "Transactions" && (
            <TransactionsPage
              transfers={transfers}
              query={query}
              setQuery={setQuery}
              onSelectTransfer={setActiveTransfer}
            />
          )}
          {page === "Track transaction" && (
            <TrackTransactionPage transfers={transfers} />
          )}
          {page === "Profile" && (
            <ProfilePage
              name={accountType === "business" ? businessName : name}
              setName={
                accountType === "business"
                  ? (next) => {
                      setBusinessName(next);
                      localStorage.setItem("settle-demo-business-name", next);
                    }
                  : setName
              }
              onLogout={handleLogout}
              accountType={accountType}
              activeTab={profileTab}
              onTabChange={(nextTab) => {
                setProfileTab(nextTab);
                if (nextTab !== "Profile") setOpenVerificationPanel(false);
              }}
              supportTransferRef={supportTransferRef}
              onClearSupportTransferRef={() => setSupportTransferRef("")}
              transfers={transfers}
              openVerification={openVerificationPanel}
              onStartTransfer={() => setPage("Send money")}
            />
          )}
          {page === "Notifications" && (
            <NotificationsPage
              accountType={accountType}
              transfers={transfers}
              recipientsCount={recipients.length}
              setPage={setPage}
              onSelectTransfer={setActiveTransfer}
              onOpenPreferences={() => {
                setProfileTab("Notifications");
                setPage("Profile");
              }}
              onOpenVerification={openVerificationFlow}
            />
          )}
          {page === "Linked banks" && (
            <LinkedBanksPage
              country={
                localStorage.getItem(`settle-demo-${accountType}-country`) ||
                "Nigeria"
              }
              onNotice={() => {}}
            />
          )}
        </div>
      </main>
      {activeTransfer && (
        <TransactionDetailsDrawer
          transfer={activeTransfer}
          onClose={() => setActiveTransfer(null)}
          onContactSupport={handleContactSupport}
          onCancelTransfer={handleCancelTransfer}
          onRetryTransfer={handleRetryTransfer}
        />
      )}
    </div>
  );
}

export default App;
