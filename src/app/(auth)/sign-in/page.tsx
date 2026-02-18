import Link from "next/link";

import { SignInForm } from "@/components/auth/sign-in-form";
import { Button } from "@/components/ui/button";
import { translate } from "@/lib/i18n/config";
import { getRequestLocale } from "@/lib/i18n/server";

export default async function SignInPage() {
  const locale = await getRequestLocale();
  const t = (esText: string, enText: string) => translate(locale, esText, enText);

  return (
    <div className="space-y-5">
      <div className="flex justify-start">
        <Button
          asChild
          variant="ghost"
          className="h-9 rounded-lg border border-white/10 bg-white/[0.03] px-3 text-[#CFCBC1] hover:bg-white/[0.08] hover:text-[#F5F3EE]"
        >
          <Link href="/">{t("Volver al inicio", "Back to home")}</Link>
        </Button>
      </div>
      <div>
        <h2 className="font-serif text-2xl text-[#F5F3EE]">{t("Acceder", "Sign in")}</h2>
        <p className="text-sm text-[#B9B4A9]">{t("Ingresa a tu workspace premium.", "Access your premium workspace.")}</p>
      </div>
      <SignInForm />
      <p className="text-center text-sm text-[#B9B4A9]">
        {t("No tienes cuenta?", "No account yet?")} {" "}
        <Link href="/register" className="text-[#E5C76B] hover:text-[#F2D98E]">
          {t("Crear cuenta", "Create account")}
        </Link>
      </p>
    </div>
  );
}
