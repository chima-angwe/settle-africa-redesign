import { useEffect, useState } from "react";
import type { Page, AccountType, Theme } from "@/shared/types";
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
import { WalletPage } from "@/pages/wallet";
import { NotificationsPage } from "@/pages/notifications";

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
  const [signedIn, setSignedIn] = useState(
    () => localStorage.getItem("settle-demo-user") === "true",
  );
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

  const [accountData, setAccountData] = useState<
    Record<AccountType, { recipients: Recipient[]; transfers: Transfer[] }>
  >(() => {
    const resetFlag = "settle-demo-transfers-empty-v1";
    if (localStorage.getItem(resetFlag) !== "true") {
      localStorage.setItem(resetFlag, "true");
      localStorage.setItem("settle-demo-individual-transfers", "[]");
      localStorage.setItem("settle-demo-transfers", "[]");
      localStorage.setItem("settle-demo-business-transfers", "[]");
    }

    return {
      individual: {
        recipients:
          JSON.parse(
            localStorage.getItem(STORAGE_KEYS.BENEFICIARIES) ||
              localStorage.getItem("settle-demo-individual-recipients") ||
              localStorage.getItem("settle-demo-recipients") ||
              "null",
          ) || initialRecipients,
        transfers:
          JSON.parse(
            localStorage.getItem("settle-demo-individual-transfers") ||
              localStorage.getItem("settle-demo-transfers") ||
              "null",
          ) || initialTransfers,
      },
      business: {
        recipients:
          JSON.parse(
            localStorage.getItem("settle-demo-business-recipients") || "null",
          ) || businessRecipients,
        transfers:
          JSON.parse(
            localStorage.getItem("settle-demo-business-transfers") || "null",
          ) || businessTransfers,
      },
    };
  });

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
  const [targetRecipientId, setTargetRecipientId] = useState<number | null>(
    null,
  );
  const [pendingApprovalCount, setPendingApprovalCount] = useState<number>(() => {
    const approved = loadApprovedIds();
    return BUSINESS_APPROVAL_REQUESTS.filter((r) => !approved.includes(r.id)).length;
  });

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

  useEffect(() => {
    if (signedIn) localStorage.setItem("settle-demo-user", "true");
    else localStorage.removeItem("settle-demo-user");
  }, [signedIn]);

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
    setSignedIn(false);
    setAuthMode("signin");
  };

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
            setSignedIn(true);
          }
        }}
      />
    );
  }

  return (
    <div className="portal">
      <Sidebar
        page={page}
        setPage={setPage}
        accountType={accountType}
        mobileNav={mobileNav}
        setMobileNav={setMobileNav}
        onLogout={handleLogout}
        onClearTargetRecipient={() => setTargetRecipientId(null)}
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
          hasNotificationDot={
            accountType === "business" && pendingApprovalCount > 0
          }
        />
        <div className="page-content">
          {page === "Dashboard" &&
            (accountType === "business" ? (
              <BusinessDashboardPage
                businessName={businessName}
                transfers={transfers}
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
            />
          )}
          {page === "Send money" && (
            <SendMoneyPage
              recipients={recipients}
              targetRecipientId={targetRecipientId}
              defaultCountry={
                localStorage.getItem(`settle-demo-${accountType}-country`) ||
                "Nigeria"
              }
              setTargetRecipientId={setTargetRecipientId}
              setRecipients={setRecipients}
              transfers={transfers}
              setTransfers={setTransfers}
              setPage={setPage}
            />
          )}
          {page === "Bulk transfer" && accountType === "business" && (
            <BulkTransferPage
              setTransfers={setTransfers}
              onTrackTransfer={setActiveTransfer}
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
            />
          )}
          {page === "Notifications" && (
            <NotificationsPage accountType={accountType} />
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
        />
      )}
    </div>
  );
}

export default App;
