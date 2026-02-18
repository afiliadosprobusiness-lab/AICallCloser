import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";

import { isSuperAdminEmail } from "@/lib/admin";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { ensureUserAccess } from "@/lib/user-access";

export default async function PostAuthPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    redirect("/sign-in");
  }

  const dbUser = await db.user.findUnique({
    where: { id: session.user.id },
    select: {
      id: true,
      email: true,
      accessStatus: true,
      accessDisabledUntil: true,
      memberships: {
        select: { workspaceId: true },
        orderBy: { createdAt: "asc" },
      },
    },
  });

  if (!dbUser) {
    redirect("/sign-in");
  }

  const accessAllowed = await ensureUserAccess({
    id: dbUser.id,
    accessStatus: dbUser.accessStatus,
    accessDisabledUntil: dbUser.accessDisabledUntil,
  });

  if (!accessAllowed) {
    redirect("/sign-in");
  }

  if (isSuperAdminEmail(dbUser.email)) {
    redirect("/super-admin");
  }

  if (dbUser.memberships.length === 0) {
    redirect("/register");
  }

  redirect("/dashboard");
}
