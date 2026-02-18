import Link from "next/link";

import { ResetPasswordForm } from "@/components/auth/reset-password-form";
import { Button } from "@/components/ui/button";
import { translate } from "@/lib/i18n/config";
import { getRequestLocale } from "@/lib/i18n/server";

type ResetPasswordPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function ResetPasswordPage({ searchParams }: ResetPasswordPageProps) {
  const locale = await getRequestLocale();
  const t = (esText: string, enText: string) => translate(locale, esText, enText);
  const resolvedSearchParams = await searchParams;
  const tokenParam = resolvedSearchParams.token;
  const token = Array.isArray(tokenParam) ? tokenParam[0] : tokenParam ?? null;

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
        <h2 className="font-serif text-2xl text-[#F5F3EE]">{t("Nueva contrasena", "New password")}</h2>
        <p className="text-sm text-[#B9B4A9]">
          {t("Define una contrasena segura para volver a entrar a tu workspace.", "Set a secure password to sign in to your workspace again.")}
        </p>
      </div>

      <ResetPasswordForm token={token} />
    </div>
  );
}
