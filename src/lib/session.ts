import { getServerSession } from "next-auth";

import { isSuperAdminEmail } from "@/lib/admin";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { ensureUserAccess } from "@/lib/user-access";

export async function getSessionOrThrow() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    throw new Error("UNAUTHORIZED");
  }

  const dbUser = await db.user.findUnique({
    where: { id: session.user.id },
    select: {
      id: true,
      accessStatus: true,
      accessDisabledUntil: true,
    },
  });

  if (!dbUser) {
    throw new Error("UNAUTHORIZED");
  }

  const accessAllowed = await ensureUserAccess(dbUser);

  if (!accessAllowed) {
    throw new Error("ACCOUNT_DISABLED");
  }

  return session;
}

export async function getWorkspaceContextOrThrow() {
  const session = await getSessionOrThrow();

  const userId = session.user.id;
  const workspaceId = session.user.activeWorkspaceId;

  if (!workspaceId) {
    throw new Error("WORKSPACE_NOT_SELECTED");
  }

  const membership = await db.workspaceMember.findUnique({
    where: {
      workspaceId_userId: {
        workspaceId,
        userId,
      },
    },
  });

  if (!membership) {
    throw new Error("WORKSPACE_FORBIDDEN");
  }

  return {
    userId,
    workspaceId,
    role: membership.role,
  };
}

export async function getSuperAdminSessionOrThrow() {
  const session = await getSessionOrThrow();
  const email = session.user.email?.toLowerCase() ?? null;

  if (!isSuperAdminEmail(email)) {
    throw new Error("FORBIDDEN");
  }

  return session;
}
