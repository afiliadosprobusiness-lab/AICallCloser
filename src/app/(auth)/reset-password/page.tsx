import Link from "next/link";

import { ResetPasswordForm } from "@/components/auth/reset-password-form";
import { Button } from "@/components/ui/button";

type ResetPasswordPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function ResetPasswordPage({ searchParams }: ResetPasswordPageProps) {
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
          <Link href="/sign-in">Volver a iniciar sesión</Link>
        </Button>
      </div>

      <div>
        <h2 className="font-serif text-2xl text-[#F5F3EE]">Nueva contraseña</h2>
        <p className="text-sm text-[#B9B4A9]">
          Define una contraseña segura para volver a entrar a tu workspace.
        </p>
      </div>

      <ResetPasswordForm token={token} />
    </div>
  );
}
