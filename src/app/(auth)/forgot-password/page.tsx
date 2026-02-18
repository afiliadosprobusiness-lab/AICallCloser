import Link from "next/link";

import { ForgotPasswordForm } from "@/components/auth/forgot-password-form";
import { Button } from "@/components/ui/button";
import { getRequestLocale } from "@/lib/i18n/server";
import { translate } from "@/lib/i18n/config";

export default async function ForgotPasswordPage() {
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
          <Link href="/sign-in">{t("Volver a iniciar sesion", "Back to sign in")}</Link>
        </Button>
      </div>

      <div>
        <h2 className="font-serif text-2xl text-[#F5F3EE]">{t("Recuperar contrasena", "Recover password")}</h2>
        <p className="text-sm text-[#B9B4A9]">
          {t("Ingresa tu email y te enviamos un enlace para restablecer acceso.", "Enter your email and we will send you a link to reset access.")}
        </p>
      </div>

      <ForgotPasswordForm />
    </div>
  );
}
