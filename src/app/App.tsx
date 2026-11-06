import { useEffect, useState } from "react";
import type { Page, AccountType, Theme } from "@/shared/types";
import type { Recipient } from "@/entities/recipient";
import { initialRecipients, businessRecipients } from "@/entities/recipient";
import type { Transfer } from "@/entities/transfer";
import { initialTransfers, businessTransfers } from "@/entities/transfer";

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

export function App() {
  const [page, setPage] = useState<Page>("Dashboard");
  const [accountType, setAccountType] = useState<AccountType>(() =>
    localStorage.getItem("settle-demo-account-type") === "business"
      ? "business"
      : "individual",
  );
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
  >(() => ({
    individual: {
      recipients:
        JSON.parse(
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
  }));

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
    }
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
        <footer className="page-footer flex min-h-[52px] items-center gap-5 px-4 sm:px-8 border-t border-line bg-paper text-subtle text-[8px]">
          <span>© 2026 Settle Africa</span>
          <span className="ml-auto flex items-center gap-1">
            <i className="secure-dot inline-block w-1.5 h-1.5 rounded-full bg-ink" /> Your account is protected
          </span>
          <a href="#support" className="text-muted hover:underline">Help & support</a>
        </footer>
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

