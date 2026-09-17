import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import { de } from "./de";
import { en } from "./en";
import type { Locale } from "./util";
import { fill, lookup } from "./util";
import "./verify";

const LOCALE_KEY = "household-chores.locale";
const catalogs = { en, de } as const;

type Vars = Record<string, string | number>;

export type Translate = (path: string, vars?: Vars) => string;

type LocaleValue = {
  locale: Locale;
  setLocale: (next: Locale) => void;
  t: Translate;
};

const LocaleContext = createContext<LocaleValue | null>(null);

function readLocale(): Locale {
  const stored = localStorage.getItem(LOCALE_KEY);
  if (stored === "en" || stored === "de") return stored;
  return navigator.language.toLowerCase().startsWith("de") ? "de" : "en";
}

export function LocaleProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>(readLocale);

  useEffect(() => {
    localStorage.setItem(LOCALE_KEY, locale);
    document.documentElement.lang = locale;
  }, [locale]);

  const setLocale = useCallback((next: Locale) => {
    setLocaleState(next);
  }, []);

  const t = useCallback<Translate>(
    (path, vars) => fill(lookup(catalogs[locale], path), vars),
    [locale],
  );

  const value = useMemo<LocaleValue>(() => ({ locale, setLocale, t }), [locale, setLocale, t]);
  return <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>;
}

export function useI18n(): LocaleValue {
  const value = useContext(LocaleContext);
  if (!value) throw new Error("useI18n must be used inside a LocaleProvider");
  return value;
}
