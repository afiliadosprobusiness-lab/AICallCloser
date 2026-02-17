import { getServerSession } from "next-auth";

import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";

export async function getSessionOrThrow() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    throw new Error("UNAUTHORIZED");
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
