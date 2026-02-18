"use client";

import { Languages } from "lucide-react";

import { Button } from "@/components/ui/button";
import { useLocale } from "@/components/providers/locale-provider";
import { cn } from "@/lib/utils";

export function LanguageToggle({ compact = false }: { compact?: boolean }) {
  const { locale, isPending, toggleLocale, t } = useLocale();

  return (
    <Button
      type="button"
      variant="ghost"
      disabled={isPending}
      onClick={toggleLocale}
      className={cn(
        "h-10 rounded-xl border border-white/12 bg-white/[0.03] px-3 text-[#EDE8DD] hover:bg-white/[0.08]",
        compact ? "h-9 px-2.5 text-xs" : "text-sm",
      )}
      aria-label={t("Cambiar idioma", "Change language")}
    >
      <Languages className="mr-2 h-4 w-4" />
      {locale === "es" ? "ES / EN" : "EN / ES"}
    </Button>
  );
}
