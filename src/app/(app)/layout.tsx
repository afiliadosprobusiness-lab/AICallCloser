import { redirect } from "next/navigation";

import { AppShell } from "@/components/app/app-shell";
import { isSuperAdminEmail } from "@/lib/admin";
import { getAppShellContextOrThrow } from "@/lib/session";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  let context: Awaited<ReturnType<typeof getAppShellContextOrThrow>>;

  try {
    context = await getAppShellContextOrThrow();
  } catch (error) {
    if (
      error instanceof Error &&
      (error.message === "UNAUTHORIZED" || error.message === "ACCOUNT_DISABLED")
    ) {
      redirect("/sign-in");
    }

    throw error;
  }

  const isSuperAdmin = isSuperAdminEmail(context.userEmail);

  if (context.memberships.length === 0 && !isSuperAdmin) {
    redirect("/register");
  }

  return (
    <AppShell
      userName={context.userName}
      activeWorkspaceId={context.activeWorkspaceId}
      isSuperAdmin={isSuperAdmin}
      workspaces={context.memberships}
    >
      {children}
    </AppShell>
  );
}
