type IconProps = {
  name: string;
  className?: string;
};

const paths: Record<string, string> = {
  home: "M4 11 12 4l8 7M6 10v10h12V10",
  tasks: "M9 6h11M9 12h11M9 18h11M4.5 6h.01M4.5 12h.01M4.5 18h.01",
  shopping: "M6 7h15l-1.5 9H8L6 7zm0 0  -1-3H3M9 20h.01M18 20h.01",
  finances: "M4 19V5m0 14h16M8 15v4m4-8v8m4-5v5",
  calendar: "M8 3v3M16 3v3M5 8h14M6 5h12a1 1 0 0 1 1 1v13a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1z",
  notice: "M7 4h10v12H7zM9 20h6M12 16v4",
  members: "M16 20v-1.2A3.2 3.2 0 0 0 12.8 15.6H11A3.2 3.2 0 0 0 7.8 18.8V20M12 12.2a3.1 3.1 0 1 0 0-6.2 3.1 3.1 0 0 0 0 6.2M19 20v-1.1A2.6 2.6 0 0 0 17 16.5M5 20v-1.1A2.6 2.6 0 0 1 7 16.5",
  settings:
    "M12 15.2a3.2 3.2 0 1 0 0-6.4 3.2 3.2 0 0 0 0 6.4M19.4 13a7.4 7.4 0 0 0 0-2l1.8-1.4-1.8-3.2-2.2.9a7.4 7.4 0 0 0-1.7-1L15.2 3h-6.4l-.3 2.3a7.4 7.4 0 0 0-1.7 1l-2.2-.9-1.8 3.2L4.6 11a7.4 7.4 0 0 0 0 2l-1.8 1.4 1.8 3.2 2.2-.9a7.4 7.4 0 0 0 1.7 1l.3 2.3h6.4l.3-2.3a7.4 7.4 0 0 0 1.7-1l2.2.9 1.8-3.2z",
  more: "M6 12h.01M12 12h.01M18 12h.01",
  sun: "M12 4V2m0 20v-2m8-8h2M2 12h2m13.7-5.7 1.4-1.4M6.9 17.1 5.5 18.5m12.6 0-1.4-1.4M6.9 6.9 5.5 5.5M16 12a4 4 0 1 1-8 0 4 4 0 0 1 8 0",
  moon: "M20 14.3A8.3 8.3 0 1 1 9.7 4 6.8 6.8 0 0 0 20 14.3",
  refresh: "M20 12a8 8 0 1 1-2.2-5.6L20 8M20 8V4m0 4h-4",
};

export function Icon({ name, className = "icon" }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d={paths[name] ?? paths.home}
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
