export type NavItem = {
  to: string;
  label: string;
  icon: string;
  end?: boolean;
};

export const PRIMARY_NAV: NavItem[] = [
  { to: "/", label: "Overview", icon: "🏠", end: true },
  { to: "/tasks", label: "Tasks", icon: "🧹" },
  { to: "/shopping", label: "Shopping", icon: "🛒" },
  { to: "/finances", label: "Finances", icon: "💰" },
  { to: "/calendar", label: "Calendar", icon: "📅" },
];

export const SECONDARY_NAV: NavItem[] = [
  { to: "/noticeboard", label: "Noticeboard", icon: "📌" },
  { to: "/members", label: "Members", icon: "👥" },
  { to: "/settings", label: "Settings", icon: "⚙️" },
];

export const MOBILE_PRIMARY_NAV: NavItem[] = PRIMARY_NAV.filter(
  (item) => item.to !== "/calendar",
);
