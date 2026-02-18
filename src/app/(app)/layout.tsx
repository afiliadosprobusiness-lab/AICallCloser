import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";

import { AppShell } from "@/components/app/app-shell";
import { isSuperAdminEmail } from "@/lib/admin";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { ensureUserAccess } from "@/lib/user-access";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    redirect("/sign-in");
  }

  const user = await db.user.findUnique({
    where: { id: session.user.id },
    include: {
      memberships: {
        include: {
          workspace: true,
        },
        orderBy: { createdAt: "asc" },
      },
    },
  });

  if (!user) {
    redirect("/sign-in");
  }

  const accessAllowed = await ensureUserAccess({
    id: user.id,
    accessStatus: user.accessStatus,
    accessDisabledUntil: user.accessDisabledUntil,
  });

  if (!accessAllowed) {
    redirect("/sign-in");
  }

  const isSuperAdmin = isSuperAdminEmail(user.email);

  if (user.memberships.length === 0 && !isSuperAdmin) {
    redirect("/register");
  }

  const activeWorkspaceId =
    session.user.activeWorkspaceId ??
    user.activeWorkspaceId ??
    user.memberships[0]?.workspaceId ??
    null;

  return (
    <AppShell
      userName={user.name ?? "Operador"}
      activeWorkspaceId={activeWorkspaceId}
      isSuperAdmin={isSuperAdmin}
      workspaces={user.memberships.map((member) => ({
        id: member.workspaceId,
        name: member.workspace.name,
        role: member.role,
      }))}
    >
      {children}
    </AppShell>
  );
}
