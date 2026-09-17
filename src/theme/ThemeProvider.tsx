import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

// Same key the prototype used, so existing visitors keep their preference.
const THEME_KEY = "household-chores.theme";

type ThemeValue = {
  dark: boolean;
  toggle: () => void;
};

const ThemeContext = createContext<ThemeValue | null>(null);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [dark, setDark] = useState(() => localStorage.getItem(THEME_KEY) === "1");

  useEffect(() => {
    document.documentElement.classList.toggle("theme-dark", dark);
    localStorage.setItem(THEME_KEY, dark ? "1" : "0");
  }, [dark]);

  const toggle = useCallback(() => setDark((current) => !current), []);
  const value = useMemo<ThemeValue>(() => ({ dark, toggle }), [dark, toggle]);

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme(): ThemeValue {
  const value = useContext(ThemeContext);
  if (!value) throw new Error("useTheme must be used inside a ThemeProvider");
  return value;
}
