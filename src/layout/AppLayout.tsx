import { useState } from "react";
import { NavLink, Outlet } from "react-router-dom";

import { useAuth } from "../auth/AuthProvider";
import { Icon } from "../components/Icons";
import { ThemeToggle } from "../components/ThemeToggle";
import { NotificationBell } from "../notifications/NotificationBell";
import { useHousehold } from "../household/HouseholdProvider";
import { MOBILE_PRIMARY_NAV, PRIMARY_NAV, SECONDARY_NAV, type NavItem } from "../nav/items";

function navClassName({ isActive }: { isActive: boolean }): string {
  return `nav-link${isActive ? " active" : ""}`;
}

function NavList({ items }: { items: NavItem[] }) {
  return (
    <nav className="side-nav" aria-label="Household">
      {items.map((item) => (
        <NavLink key={item.to} to={item.to} end={item.end} className={navClassName}>
          <Icon name={item.icon} />
          {item.label}
        </NavLink>
      ))}
    </nav>
  );
}

export function AppLayout() {
  const { signOut } = useAuth();
  const { household } = useHousehold();
  const [moreOpen, setMoreOpen] = useState(false);

  if (!household) return null;

  const mark = household.name.trim().slice(0, 1).toUpperCase() || "H";

  return (
    <div className="app-frame">
      <aside className="sidebar">
        <div className="sidebar-brand">
          <div className="brand-mark" aria-hidden="true">
            {mark}
          </div>
          <div>
            <p className="sidebar-kicker">Household</p>
            <h1 className="brand">{household.name}</h1>
          </div>
        </div>
        <p className="invite-chip">
          Invite <strong>{household.inviteCode}</strong>
        </p>
        <NavList items={PRIMARY_NAV} />
        <p className="nav-label">Manage</p>
        <NavList items={SECONDARY_NAV} />
        <div className="sidebar-foot">
          <NotificationBell />
          <ThemeToggle />
          <button className="ghost" type="button" onClick={() => void signOut()}>
            Sign out
          </button>
        </div>
      </aside>

      <main className="app-main">
        <Outlet />
      </main>

      <nav className="bottom-nav" aria-label="Primary">
        {MOBILE_PRIMARY_NAV.map((item) => (
          <NavLink key={item.to} to={item.to} end={item.end} className={navClassName}>
            <Icon name={item.icon} />
            {item.label}
          </NavLink>
        ))}
        <button
          className={`nav-link${moreOpen ? " active" : ""}`}
          type="button"
          aria-expanded={moreOpen}
          onClick={() => setMoreOpen((open) => !open)}
        >
          <Icon name="more" />
          More
        </button>
      </nav>

      {moreOpen ? (
        <div className="more-sheet" role="dialog" aria-label="More">
          <button className="more-backdrop" type="button" onClick={() => setMoreOpen(false)}>
            <span className="sr-only">Close menu</span>
          </button>
          <div className="card more-panel">
            <div className="composer-head">
              <h2 className="section-title" style={{ margin: 0 }}>
                More
              </h2>
              <button className="ghost" type="button" onClick={() => setMoreOpen(false)}>
                Close
              </button>
            </div>
            <nav className="more-nav" onClick={() => setMoreOpen(false)}>
              <NavList items={[{ to: "/calendar", label: "Calendar", icon: "calendar" }, ...SECONDARY_NAV]} />
            </nav>
            <div className="sidebar-foot">
              <ThemeToggle />
              <button className="ghost" type="button" onClick={() => void signOut()}>
                Sign out
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
