import { db } from "@/lib/db";

export async function getUserWorkspaces(userId: string) {
  return db.workspaceMember.findMany({
    where: { userId },
    include: {
      workspace: true,
    },
    orderBy: {
      createdAt: "asc",
    },
  });
}

export async function setActiveWorkspace(params: { userId: string; workspaceId: string }) {
  const membership = await db.workspaceMember.findUnique({
    where: {
      workspaceId_userId: {
        workspaceId: params.workspaceId,
        userId: params.userId,
      },
    },
  });

  if (!membership) {
    throw new Error("WORKSPACE_FORBIDDEN");
  }

  return db.user.update({
    where: { id: params.userId },
    data: { activeWorkspaceId: params.workspaceId },
  });
}
