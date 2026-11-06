import { Icon, LogoMark } from "@/shared/ui";
import type { AccountType, Page } from "@/shared/types";

export interface SidebarProps {
  page: Page;
  setPage: (page: Page) => void;
  accountType: AccountType;
  mobileNav: boolean;
  setMobileNav: (open: boolean) => void;
  onLogout: () => void;
  onClearTargetRecipient?: () => void;
}

export function Sidebar({
  page,
  setPage,
  accountType,
  mobileNav,
  setMobileNav,
  onLogout,
  onClearTargetRecipient,
}: SidebarProps) {
  const navItems: { label: Page; icon: string }[] = [
    { label: "Dashboard", icon: "grid" },
    { label: "Send money", icon: "send" },
    ...(accountType === "business"
      ? [{ label: "Bulk transfer" as Page, icon: "upload" }]
      : []),
    { label: "Track transaction", icon: "search" },
    { label: "Transactions", icon: "clock" },
    { label: "Recipients", icon: "users" },
  ];

  return (
    <>
      {mobileNav && (
        <button
          type="button"
          className="scrim"
          aria-label="Close navigation"
          onClick={() => setMobileNav(false)}
        />
      )}
      <aside className={`sidebar ${mobileNav ? "sidebar-open" : ""}`}>
        <button
          type="button"
          className="brand"
          onClick={() => {
            setPage("Dashboard");
            setMobileNav(false);
          }}
        >
          <LogoMark />
          <span className="brand-copy">
            <strong>Settle Africa</strong>
            <small>
              {accountType === "business" ? "BUSINESS" : "INDIVIDUAL"}
            </small>
          </span>
        </button>
        <div className="nav-caption">WORKSPACE</div>
        <nav className="main-nav" aria-label="Main navigation">
          {navItems.map((item) => (
            <button
              type="button"
              key={item.label}
              className={`nav-item ${page === item.label ? "active" : ""}`}
              onClick={() => {
                if (item.label === "Send money" && onClearTargetRecipient) {
                  onClearTargetRecipient();
                }
                setPage(item.label);
                setMobileNav(false);
              }}
            >
              <Icon name={item.icon} />
              <span>{item.label}</span>
              {item.label === "Track transaction" && <i className="nav-dot" />}
            </button>
          ))}
        </nav>
        <div className="sidebar-bottom">
          <div className="nav-caption">ACCOUNT</div>
          <button
            type="button"
            className={`nav-item ${page === "Linked banks" ? "active" : ""}`}
            onClick={() => {
              setPage("Linked banks");
              setMobileNav(false);
            }}
          >
            <Icon name="card" />
            <span>Linked banks</span>
          </button>
          <button
            type="button"
            className={`nav-item ${page === "Profile" ? "active" : ""}`}
            onClick={() => {
              setPage("Profile");
              setMobileNav(false);
            }}
          >
            <Icon name="user" />
            <span>Profile & settings</span>
          </button>
          <div className="sidebar-help">
            <span className="help-mark">?</span>
            <span>
              <strong>Need a hand?</strong>
              <small>Our team is here to help</small>
            </span>
            <Icon name="chevron" size={16} />
          </div>
          <button type="button" className="nav-item logout" onClick={onLogout}>
            <Icon name="logout" />
            <span>Sign out</span>
          </button>
        </div>
        <div className="sidebar-footnote">A clearer way to move money.</div>
      </aside>
    </>
  );
}

