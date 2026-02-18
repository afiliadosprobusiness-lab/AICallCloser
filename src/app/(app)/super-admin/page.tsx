import { redirect } from "next/navigation";

import { SuperAdminPanel } from "@/components/super-admin/super-admin-panel";
import { isSuperAdminEmail } from "@/lib/admin";
import { getSessionOrThrow } from "@/lib/session";
import { getSuperAdminOverview } from "@/modules/super-admin/service";

export default async function SuperAdminPage() {
  const session = await getSessionOrThrow();

  if (!isSuperAdminEmail(session.user.email)) {
    redirect("/dashboard");
  }

  const overview = await getSuperAdminOverview();

  return (
    <SuperAdminPanel
      metrics={overview.metrics}
      users={overview.users}
      workspaces={overview.workspaces}
      recentLeads={overview.recentLeads}
    />
  );
}
