"use client";

import { Moon, Sun } from "lucide-react";

import { useLocale } from "@/components/providers/locale-provider";
import { useTheme } from "@/components/providers/theme-provider";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function ThemeToggle({ compact = false }: { compact?: boolean }) {
  const { theme, toggleTheme, isPending } = useTheme();
  const { t } = useLocale();
  const isDark = theme === "dark";

  return (
    <Button
      type="button"
      variant="ghost"
      disabled={isPending}
      onClick={toggleTheme}
      className={cn(
        "h-10 rounded-xl border border-white/12 bg-white/[0.03] px-3 text-[#EDE8DD] hover:bg-white/[0.08]",
        compact ? "h-9 w-9 px-0 text-xs" : "text-sm",
      )}
      aria-label={t("Cambiar tema", "Change theme")}
      title={isDark ? t("Cambiar a claro", "Switch to light") : t("Cambiar a oscuro", "Switch to dark")}
    >
      {isDark ? (
        <Sun className={cn("h-4 w-4", compact ? "" : "mr-2")} />
      ) : (
        <Moon className={cn("h-4 w-4", compact ? "" : "mr-2")} />
      )}
      {!compact ? <span>{isDark ? t("Claro", "Light") : t("Oscuro", "Dark")}</span> : null}
    </Button>
  );
}
