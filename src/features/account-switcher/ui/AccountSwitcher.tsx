import { useState } from "react";
import { Icon } from "@/shared/ui";
import type { AccountType } from "@/shared/types";

export interface AccountSwitcherProps {
  accountType: AccountType;
  name: string;
  businessName: string;
  onSwitchAccount: (type: AccountType) => void;
}

export function AccountSwitcher({
  accountType,
  name,
  businessName,
  onSwitchAccount,
}: AccountSwitcherProps) {
  const [accountMenuOpen, setAccountMenuOpen] = useState(false);

  const getInitials = (text: string) =>
    text
      .split(" ")
      .map((part) => part[0])
      .slice(0, 2)
      .join("")
      .toUpperCase();

  const handleSelect = (type: AccountType) => {
    onSwitchAccount(type);
    setAccountMenuOpen(false);
  };

  return (
    <div className="account-switcher relative">
      <button
        type="button"
        className="profile-chip flex items-center gap-[11px] p-[7px_10px_7px_7px] border border-line rounded-[18px] bg-paper text-ink text-left hover:border-ink hover:bg-soft transition-all"
        aria-expanded={accountMenuOpen}
        aria-haspopup="menu"
        onClick={() => setAccountMenuOpen((open) => !open)}
        aria-label="Switch account"
      >
        <span className="profile-avatar-wrap relative inline-flex">
          <span className="avatar avatar-dark inline-flex w-10 h-10 flex-none items-center justify-center border border-ink rounded-full bg-ink text-inverse-text text-[13px] font-bold">
            {accountType === "business" ? getInitials(businessName) : getInitials(name)}
          </span>
          <i className="profile-presence absolute -right-px -bottom-px w-[11px] h-[11px] border-2 border-paper rounded-full bg-[#777]" />
        </span>
        <span className="profile-copy hidden sm:grid gap-0.5">
          <strong className="profile-name text-[13px] font-bold text-ink">
            {accountType === "business" ? businessName : name}
          </strong>
          <small className="text-muted text-[9px] font-bold tracking-[1px] uppercase">
            {accountType === "business" ? "BUSINESS ACCOUNT" : "PERSONAL ACCOUNT"}
          </small>
        </span>
        <span className={`profile-open hidden sm:grid w-[25px] h-[25px] place-items-center ml-1 rounded-full bg-soft text-muted transition-transform ${accountMenuOpen ? "-rotate-90" : "rotate-90"}`}>
          <Icon name="chevron" size={15} />
        </span>
      </button>

      {accountMenuOpen && (
        <>
          <button
            type="button"
            className="account-menu-scrim fixed inset-0 z-40 w-full h-full border-0 bg-transparent"
            aria-label="Close account switcher"
            onClick={() => setAccountMenuOpen(false)}
          />
          <div
            className="account-switch-menu absolute z-50 top-[calc(100%+10px)] right-0 w-[min(320px,calc(100vw-24px))] p-[9px] border border-line rounded-[20px] bg-paper shadow-card dark:shadow-card-dark text-ink animate-drawer-in"
            role="menu"
            aria-label="Switch account"
          >
            <div className="account-switch-title grid gap-1 p-[10px_11px_13px] border-b border-line">
              <strong className="text-ink font-heading font-bold text-sm">Switch account</strong>
              <small className="text-muted text-[11px]">Your Settle profiles</small>
            </div>
            <button
              type="button"
              role="menuitem"
              className={`account-switch-option flex w-full items-center gap-[11px] mt-[5px] p-2.5 border rounded-[14px] text-ink text-left transition-colors ${accountType === "individual" ? "border-line bg-soft" : "border-transparent hover:border-line hover:bg-soft"}`}
              onClick={() => handleSelect("individual")}
            >
              <span className="account-option-avatar inline-flex w-8 h-8 items-center justify-center rounded-full bg-soft text-ink font-bold text-xs border border-line">
                {getInitials(name)}
              </span>
              <span className="flex-1 grid gap-0.5">
                <strong className="text-xs text-ink">{name}</strong>
                <small className="text-muted text-[11px]">Individual account</small>
              </span>
              {accountType === "individual" && (
                <Icon name="checkCircle" size={18} className="text-ink shrink-0" />
              )}
            </button>
            <button
              type="button"
              role="menuitem"
              className={`account-switch-option flex w-full items-center gap-[11px] mt-[5px] p-2.5 border rounded-[14px] text-ink text-left transition-colors ${accountType === "business" ? "border-line bg-soft" : "border-transparent hover:border-line hover:bg-soft"}`}
              onClick={() => handleSelect("business")}
            >
              <span className="account-option-avatar inline-flex w-8 h-8 items-center justify-center rounded-full bg-soft text-ink border border-line">
                <Icon name="building" size={18} />
              </span>
              <span className="flex-1 grid gap-0.5">
                <strong className="text-xs text-ink">{businessName}</strong>
                <small className="text-muted text-[11px]">Business account · Demo</small>
              </span>
              {accountType === "business" && (
                <Icon name="checkCircle" size={18} className="text-ink shrink-0" />
              )}
            </button>
            <div className="account-switch-footnote mt-2 pt-2 border-t border-line/60 px-2 text-subtle text-[10px] leading-relaxed">
              Switching keeps your personal and business views separate.
            </div>
          </div>
        </>
      )}
    </div>
  );
}

