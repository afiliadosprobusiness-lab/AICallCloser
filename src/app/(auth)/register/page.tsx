import Link from "next/link";
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";

import { isSuperAdminEmail } from "@/lib/admin";
import { OnboardingWorkspaceForm } from "@/components/auth/onboarding-workspace-form";
import { RegisterForm } from "@/components/auth/register-form";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { translate } from "@/lib/i18n/config";
import { getRequestLocale } from "@/lib/i18n/server";

export default async function RegisterPage() {
  const locale = await getRequestLocale();
  const t = (esText: string, enText: string) => translate(locale, esText, enText);
  const session = await getServerSession(authOptions);

  if (session?.user?.id) {
    if (isSuperAdminEmail(session.user.email)) {
      redirect("/super-admin");
    }

    const user = await db.user.findUnique({
      where: { id: session.user.id },
      include: {
        memberships: {
          orderBy: { createdAt: "asc" },
          include: { workspace: true },
        },
      },
    });

    if (user?.memberships.length) {
      redirect("/dashboard");
    }

    return (
      <div className="space-y-5">
        <div>
          <h2 className="font-serif text-2xl text-[#F5F3EE]">{t("Termina tu registro", "Finish your sign up")}</h2>
          <p className="text-sm text-[#B9B4A9]">{t("Crea tu workspace para activar el dashboard.", "Create your workspace to activate the dashboard.")}</p>
        </div>
        <OnboardingWorkspaceForm
          defaultName={session.user.name ?? ""}
          defaultWorkspace={(session.user.name ?? "My Workspace").replace(/\s+/g, " ").trim()}
        />
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div>
        <h2 className="font-serif text-2xl text-[#F5F3EE]">{t("Crear workspace", "Create workspace")}</h2>
        <p className="text-sm text-[#B9B4A9]">{t("Configura tu plataforma de cierre con IA.", "Set up your AI closing platform.")}</p>
      </div>
      <RegisterForm />
      <p className="text-center text-sm text-[#B9B4A9]">
        {t("Ya tienes cuenta?", "Already have an account?")} {" "}
        <Link href="/sign-in" className="text-[#E5C76B] hover:text-[#F2D98E]">
          {t("Iniciar sesion", "Sign in")}
        </Link>
      </p>
    </div>
  );
}
