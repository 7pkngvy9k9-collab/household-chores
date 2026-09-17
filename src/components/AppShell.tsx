import type { ReactNode } from "react";

import { useAuth } from "../auth/AuthProvider";
import { ThemeToggle } from "./ThemeToggle";

type Props = {
  title: string;
  subtitle: ReactNode;
  onRefresh: () => void;
  children: ReactNode;
};

export function AppShell({ title, subtitle, onRefresh, children }: Props) {
  const { signOut } = useAuth();

  return (
    <>
      <header className="topbar">
        <div>
          <h1 className="brand">{title}</h1>
          <p className="sub">{subtitle}</p>
        </div>
        <div className="who">
          <button className="ghost" type="button" onClick={onRefresh}>
            Refresh
          </button>
          <button className="ghost" type="button" onClick={() => void signOut()}>
            Sign out
          </button>
          <ThemeToggle />
        </div>
      </header>
      {children}
    </>
  );
}
