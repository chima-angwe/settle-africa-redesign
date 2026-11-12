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

interface NavItemConfig {
  page: Page;
  label: string;
  icon: string;
}

interface NavSection {
  title: string;
  items: NavItemConfig[];
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
  const sections: NavSection[] = [
    {
      title: "OVERVIEW",
      items: [
        { page: "Dashboard", label: "Dashboard", icon: "grid" },
        { page: "Wallet", label: "Wallet", icon: "wallet" },
      ],
    },
    {
      title: "PAYMENTS",
      items: [
        { page: "Send money", label: "Send money", icon: "send" },
        ...(accountType === "business"
          ? [
              {
                page: "Bulk transfer" as Page,
                label: "Bulk transfer",
                icon: "upload",
              },
            ]
          : []),
        { page: "Recipients", label: "Recipients", icon: "users" },
      ],
    },
    {
      title: "ACTIVITY",
      items: [
        { page: "Transactions", label: "Transactions", icon: "clock" },
        { page: "Track transaction", label: "Track transaction", icon: "search" },
        { page: "Notifications", label: "Notifications", icon: "bell" },
      ],
    },
  ];

  const accountItems: NavItemConfig[] = [
    { page: "Linked banks", label: "Linked banks", icon: "card" },
    { page: "Profile", label: "Profile & settings", icon: "user" },
  ];

  const handleNavClick = (targetPage: Page) => {
    if (targetPage === "Send money" && onClearTargetRecipient) {
      onClearTargetRecipient();
    }
    setPage(targetPage);
    setMobileNav(false);
  };

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
      <aside
        className={`sidebar ${mobileNav ? "sidebar-open" : ""} [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden`}
      >
        <button
          type="button"
          className="brand"
          onClick={() => handleNavClick("Dashboard")}
        >
          <LogoMark />
          <span className="brand-copy">
            <strong>Settle Africa</strong>
            <small>
              {accountType === "business" ? "BUSINESS" : "INDIVIDUAL"}
            </small>
          </span>
        </button>

        <nav className="sidebar-nav main-nav mt-5 space-y-4" aria-label="Main navigation">
          {sections.map((section, idx) => (
            <div
              key={section.title}
              className={idx > 0 ? "pt-3 border-t border-[#242424]" : ""}
            >
              <span className="block px-3 mb-1.5 text-[9px] font-bold tracking-[1.6px] text-white/70 uppercase">
                {section.title}
              </span>
              <div className="grid gap-1">
                {section.items.map((item) => {
                  const isActive = page === item.page;
                  return (
                    <button
                      type="button"
                      key={item.page}
                      className={`nav-item !min-h-[42px] ${
                        isActive
                          ? "active !bg-white !text-black border-white"
                          : "!text-white hover:!text-white hover:!bg-[#252525]"
                      }`}
                      onClick={() => handleNavClick(item.page)}
                    >
                      <Icon
                        name={item.icon}
                        className={isActive ? "!text-black" : "!text-white"}
                      />
                      <span className={isActive ? "!text-black font-semibold" : "!text-white"}>
                        {item.label}
                      </span>
                      {isActive && <i className="nav-dot" />}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        <div className="sidebar-bottom mt-auto pt-3 border-t border-[#242424]">
          <span className="block px-3 mb-1.5 text-[9px] font-bold tracking-[1.6px] text-white/70 uppercase">
            ACCOUNT
          </span>
          <div className="grid gap-1">
            {accountItems.map((item) => {
              const isActive = page === item.page;
              return (
                <button
                  type="button"
                  key={item.page}
                  className={`nav-item !min-h-[42px] ${
                    isActive
                      ? "active !bg-white !text-black border-white"
                      : "!text-white hover:!text-white hover:!bg-[#252525]"
                  }`}
                  onClick={() => handleNavClick(item.page)}
                >
                  <Icon
                    name={item.icon}
                    className={isActive ? "!text-black" : "!text-white"}
                  />
                  <span className={isActive ? "!text-black font-semibold" : "!text-white"}>
                    {item.label}
                  </span>
                  {isActive && <i className="nav-dot" />}
                </button>
              );
            })}
            <button
              type="button"
              className="nav-item logout !min-h-[42px] !text-white hover:!text-white hover:!bg-[#252525]"
              onClick={onLogout}
            >
              <Icon name="logout" className="!text-white" />
              <span className="!text-white">Sign out</span>
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}
