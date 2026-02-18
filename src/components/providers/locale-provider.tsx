"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  useTransition,
  type PropsWithChildren,
} from "react";
import { useRouter } from "next/navigation";

import { defaultLocale, type Locale } from "@/lib/i18n/config";

type LocaleContextValue = {
  locale: Locale;
  isPending: boolean;
  t: (esText: string, enText: string) => string;
  setLocale: (nextLocale: Locale) => void;
  toggleLocale: () => void;
};

const LocaleContext = createContext<LocaleContextValue | null>(null);

export function LocaleProvider({
  locale,
  children,
}: PropsWithChildren<{ locale: Locale }>) {
  const router = useRouter();
  const [currentLocale, setCurrentLocale] = useState<Locale>(locale ?? defaultLocale);
  const [isPending, startTransition] = useTransition();

  const setLocale = useCallback(
    (nextLocale: Locale) => {
      if (nextLocale === currentLocale) {
        return;
      }

      const previousLocale = currentLocale;
      setCurrentLocale(nextLocale);

      startTransition(async () => {
        const response = await fetch("/api/preferences/locale", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ locale: nextLocale }),
        });

        if (!response.ok) {
          setCurrentLocale(previousLocale);
          return;
        }

        router.refresh();
      });
    },
    [currentLocale, router],
  );

  const toggleLocale = useCallback(() => {
    setLocale(currentLocale === "es" ? "en" : "es");
  }, [currentLocale, setLocale]);

  const value = useMemo<LocaleContextValue>(
    () => ({
      locale: currentLocale,
      isPending,
      t: (esText, enText) => (currentLocale === "en" ? enText : esText),
      setLocale,
      toggleLocale,
    }),
    [currentLocale, isPending, setLocale, toggleLocale],
  );

  return <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>;
}

export function useLocale() {
  const context = useContext(LocaleContext);

  if (!context) {
    throw new Error("useLocale must be used within LocaleProvider");
  }

  return context;
}
