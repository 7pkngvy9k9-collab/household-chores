export type NavItem = {
  to: string;
  label: string;
  icon: string;
  end?: boolean;
};

export const PRIMARY_NAV: NavItem[] = [
  { to: "/tasks", label: "Tasks", icon: "tasks" },
  { to: "/shopping", label: "Shopping", icon: "shopping" },
  { to: "/noticeboard", label: "Pinboard", icon: "notice" },
  { to: "/finances", label: "Finances", icon: "finances" },
];

export const HOUSEHOLD_NAV: NavItem[] = [
  { to: "/overview", label: "Overview", icon: "home" },
  { to: "/calendar", label: "Calendar", icon: "calendar" },
  { to: "/polls", label: "Polls", icon: "notice" },
  { to: "/members", label: "Members", icon: "members" },
  { to: "/settings", label: "Settings", icon: "settings" },
];
