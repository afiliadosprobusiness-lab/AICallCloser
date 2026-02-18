"use client";

import { LogOut } from "lucide-react";
import { signOut } from "next-auth/react";

import { useLocale } from "@/components/providers/locale-provider";
import { Button } from "@/components/ui/button";

export function SignOutButton() {
  const { t } = useLocale();

  return (
    <Button
      variant="ghost"
      className="h-10 rounded-xl border border-[#E5C76B]/25 bg-white/5 px-3 text-[#F5F3EE] hover:bg-white/10"
      onClick={() => signOut({ callbackUrl: "/sign-in" })}
      type="button"
    >
      <LogOut className="mr-2 h-4 w-4" />
      {t("Salir", "Sign out")}
    </Button>
  );
}
