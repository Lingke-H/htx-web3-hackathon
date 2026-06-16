"use client";

import {
  createContext,
  startTransition,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import {
  getDemoContent,
  localeOptions,
  type DemoContent,
  type Locale,
} from "@/lib/demo-data";

const STORAGE_KEY = "veil-scout-locale";

type AppStateValue = {
  content: DemoContent;
  locale: Locale;
  localeOptions: typeof localeOptions;
  setLocale: (locale: Locale) => void;
};

const AppStateContext = createContext<AppStateValue | null>(null);

export function AppStateProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>("en");

  useEffect(() => {
    const saved = window.localStorage.getItem(STORAGE_KEY);
    let frame = 0;

    if (saved === "en" || saved === "zh") {
      frame = window.requestAnimationFrame(() => {
        setLocaleState(saved);
      });
    }

    return () => {
      if (frame) {
        window.cancelAnimationFrame(frame);
      }
    };
  }, []);

  useEffect(() => {
    document.documentElement.lang = locale;
    window.localStorage.setItem(STORAGE_KEY, locale);
  }, [locale]);

  const value: AppStateValue = {
    content: getDemoContent(locale),
    locale,
    localeOptions,
    setLocale(nextLocale) {
      startTransition(() => {
        setLocaleState(nextLocale);
      });
    },
  };

  return <AppStateContext.Provider value={value}>{children}</AppStateContext.Provider>;
}

export function useAppState() {
  const context = useContext(AppStateContext);

  if (!context) {
    throw new Error("useAppState must be used within AppStateProvider");
  }

  return context;
}
