"use client";

import { useEffect } from "react";

import { useTheme } from "@/components/providers/theme-provider";

function applyWidgetTheme(theme: "dark" | "light") {
  const widgetRoot = document.getElementById("lw-root");
  if (!widgetRoot) return;
  widgetRoot.setAttribute("data-theme", theme);
}

export function ExternalWidgetThemeSync() {
  const { theme } = useTheme();

  useEffect(() => {
    const nextTheme = theme === "light" ? "light" : "dark";

    applyWidgetTheme(nextTheme);

    const observer = new MutationObserver(() => {
      applyWidgetTheme(nextTheme);
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: false,
    });

    const interval = window.setInterval(() => {
      applyWidgetTheme(nextTheme);
    }, 800);

    return () => {
      observer.disconnect();
      window.clearInterval(interval);
    };
  }, [theme]);

  return null;
}
