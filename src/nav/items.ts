export type NavItem = {
  to: string;
  labelKey: string;
  icon: string;
  end?: boolean;
};

export const PRIMARY_NAV: NavItem[] = [
  { to: "/tasks", labelKey: "nav.tasks", icon: "tasks" },
  { to: "/shopping", labelKey: "nav.shopping", icon: "shopping" },
  { to: "/noticeboard", labelKey: "nav.pinboard", icon: "notice" },
  { to: "/finances", labelKey: "nav.finances", icon: "finances" },
];

export const HOUSEHOLD_NAV: NavItem[] = [
  { to: "/overview", labelKey: "nav.overview", icon: "home" },
  { to: "/calendar", labelKey: "nav.calendar", icon: "calendar" },
  { to: "/polls", labelKey: "nav.polls", icon: "notice" },
  { to: "/members", labelKey: "nav.members", icon: "members" },
  { to: "/settings", labelKey: "nav.settings", icon: "settings" },
];
