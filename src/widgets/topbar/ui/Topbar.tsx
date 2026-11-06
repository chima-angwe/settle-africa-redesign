import React from "react";
import { Icon } from "@/shared/ui";
import { ThemeToggle } from "@/features/theme-toggle";
import { AccountSwitcher } from "@/features/account-switcher";
import type { AccountType, Theme } from "@/shared/types";

export interface TopbarProps {
  mobileNav: boolean;
  setMobileNav: React.Dispatch<React.SetStateAction<boolean>>;
  theme: Theme;
  onToggleTheme: () => void;
  accountType: AccountType;
  name: string;
  businessName: string;
  onSwitchAccount: (type: AccountType) => void;
}

export function Topbar({
  mobileNav,
  setMobileNav,
  theme,
  onToggleTheme,
  accountType,
  name,
  businessName,
  onSwitchAccount,
}: TopbarProps) {
  return (
    <header className="topbar sticky top-0 z-20 flex min-h-[70px] items-center justify-between px-4 sm:px-8 border-b border-line bg-paper">
      <button
        type="button"
        className="mobile-menu inline-grid md:hidden w-[33px] h-[33px] flex-none place-items-center border border-line rounded-full bg-paper text-ink"
        onClick={() => setMobileNav((open) => !open)}
        aria-label={mobileNav ? "Close navigation" : "Open navigation"}
      >
        <Icon name={mobileNav ? "close" : "menu"} />
      </button>
      <div className="topbar-right ml-auto flex items-center gap-[11px]">
        <ThemeToggle theme={theme} onToggle={onToggleTheme} />
        <button
          type="button"
          className="icon-button notification relative inline-grid w-[34px] h-[34px] place-items-center border border-transparent hover:border-line rounded-full bg-transparent hover:bg-soft text-ink transition-colors"
          aria-label="Notifications"
        >
          <Icon name="bell" />
          <i className="absolute top-[7px] right-[7px] w-[5px] h-[5px] rounded-full bg-ink" />
        </button>
        <div className="topbar-divider hidden sm:block h-6 border-l border-line" />
        <AccountSwitcher
          accountType={accountType}
          name={name}
          businessName={businessName}
          onSwitchAccount={onSwitchAccount}
        />
      </div>
    </header>
  );
}

