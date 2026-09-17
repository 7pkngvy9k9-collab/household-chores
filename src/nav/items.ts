export type NavItem = {
  to: string;
  label: string;
  icon: string;
  end?: boolean;
};

export const PRIMARY_NAV: NavItem[] = [
  { to: "/", label: "Overview", icon: "home", end: true },
  { to: "/tasks", label: "Tasks", icon: "tasks" },
  { to: "/shopping", label: "Shopping", icon: "shopping" },
  { to: "/finances", label: "Finances", icon: "finances" },
  { to: "/calendar", label: "Calendar", icon: "calendar" },
];

export const SECONDARY_NAV: NavItem[] = [
  { to: "/noticeboard", label: "Noticeboard", icon: "notice" },
  { to: "/members", label: "Members", icon: "members" },
  { to: "/settings", label: "Settings", icon: "settings" },
];

export const MOBILE_PRIMARY_NAV: NavItem[] = PRIMARY_NAV.filter(
  (item) => item.to !== "/calendar",
);
