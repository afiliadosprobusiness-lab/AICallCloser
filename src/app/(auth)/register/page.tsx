import Link from "next/link";
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";

import { isSuperAdminEmail } from "@/lib/admin";
import { OnboardingWorkspaceForm } from "@/components/auth/onboarding-workspace-form";
import { RegisterForm } from "@/components/auth/register-form";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";

export default async function RegisterPage() {
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
          <h2 className="font-serif text-2xl text-[#F5F3EE]">Termina tu registro</h2>
          <p className="text-sm text-[#B9B4A9]">Crea tu workspace para activar el dashboard.</p>
        </div>
        <OnboardingWorkspaceForm
          defaultName={session.user.name ?? ""}
          defaultWorkspace={(session.user.name ?? "Mi Workspace").replace(/\s+/g, " ").trim()}
        />
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div>
        <h2 className="font-serif text-2xl text-[#F5F3EE]">Crear workspace</h2>
        <p className="text-sm text-[#B9B4A9]">Configura tu plataforma de cierre con IA.</p>
      </div>
      <RegisterForm />
      <p className="text-center text-sm text-[#B9B4A9]">
        ¿Ya tienes cuenta?{" "}
        <Link href="/sign-in" className="text-[#E5C76B] hover:text-[#F2D98E]">
          Iniciar sesión
        </Link>
      </p>
    </div>
  );
}
