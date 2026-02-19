"use client";

import { LogOut } from "lucide-react";
import { signOut } from "next-auth/react";

import { useLocale } from "@/components/providers/locale-provider";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function SignOutButton({ compact = false }: { compact?: boolean }) {
  const { t } = useLocale();
  const label = t("Salir", "Sign out");

  return (
    <Button
      variant="ghost"
      className={cn(
        "rounded-xl border border-[#E5C76B]/25 bg-white/5 text-[#F5F3EE] hover:bg-white/10",
        compact ? "h-9 px-2.5" : "h-10 px-3",
      )}
      onClick={() => signOut({ callbackUrl: "/sign-in" })}
      type="button"
      aria-label={label}
    >
      <LogOut className={cn("h-4 w-4", !compact && "mr-2")} />
      <span className={cn(compact && "sr-only")}>{label}</span>
    </Button>
  );
}
