"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  useTransition,
  type PropsWithChildren,
} from "react";

import { normalizeTheme, themeStorageKey, type Theme } from "@/lib/theme/config";

type ThemeContextValue = {
  theme: Theme;
  isPending: boolean;
  setTheme: (nextTheme: Theme) => void;
  toggleTheme: () => void;
};

const ThemeContext = createContext<ThemeContextValue | null>(null);

function applyThemeToDocument(theme: Theme) {
  const root = document.documentElement;
  root.classList.remove("dark", "light");
  root.classList.add(theme);
  root.dataset.theme = theme;
  root.style.colorScheme = theme;
}

export function ThemeProvider({
  theme,
  children,
}: PropsWithChildren<{ theme: Theme }>) {
  const [currentTheme, setCurrentTheme] = useState<Theme>(normalizeTheme(theme));
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    applyThemeToDocument(currentTheme);
    localStorage.setItem(themeStorageKey, currentTheme);
  }, [currentTheme]);

  useEffect(() => {
    const onStorage = (event: StorageEvent) => {
      if (event.key !== themeStorageKey) return;
      setCurrentTheme(normalizeTheme(event.newValue));
    };

    window.addEventListener("storage", onStorage);
    return () => {
      window.removeEventListener("storage", onStorage);
    };
  }, []);

  const setTheme = useCallback((nextTheme: Theme) => {
    const normalizedNext = normalizeTheme(nextTheme);
    if (normalizedNext === currentTheme) return;

    const previousTheme = currentTheme;
    setCurrentTheme(normalizedNext);

    startTransition(async () => {
      const response = await fetch("/api/preferences/theme", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ theme: normalizedNext }),
      });

      if (!response.ok) {
        setCurrentTheme(previousTheme);
      }
    });
  }, [currentTheme]);

  const toggleTheme = useCallback(() => {
    setTheme(currentTheme === "dark" ? "light" : "dark");
  }, [currentTheme, setTheme]);

  const value = useMemo<ThemeContextValue>(
    () => ({
      theme: currentTheme,
      isPending,
      setTheme,
      toggleTheme,
    }),
    [currentTheme, isPending, setTheme, toggleTheme],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const context = useContext(ThemeContext);

  if (!context) {
    throw new Error("useTheme must be used within ThemeProvider");
  }

  return context;
}
