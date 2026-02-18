import { cache } from "react";
import { getServerSession, type Session } from "next-auth";

import { isSuperAdminEmail } from "@/lib/admin";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { ensureUserAccess } from "@/lib/user-access";

type SessionContext = {
  session: Session;
  user: {
    id: string;
    name: string | null;
    email: string;
    activeWorkspaceId: string | null;
    memberships: Array<{
      workspaceId: string;
      role: string;
      workspace: {
        id: string;
        name: string;
      };
    }>;
  };
};

const getValidatedSessionContext = cache(async (): Promise<SessionContext> => {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    throw new Error("UNAUTHORIZED");
  }

  const dbUser = await db.user.findUnique({
    where: { id: session.user.id },
    select: {
      id: true,
      name: true,
      email: true,
      activeWorkspaceId: true,
      accessStatus: true,
      accessDisabledUntil: true,
      memberships: {
        orderBy: { createdAt: "asc" },
        select: {
          workspaceId: true,
          role: true,
          workspace: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      },
    },
  });

  if (!dbUser) {
    throw new Error("UNAUTHORIZED");
  }

  const accessAllowed = await ensureUserAccess({
    id: dbUser.id,
    accessStatus: dbUser.accessStatus,
    accessDisabledUntil: dbUser.accessDisabledUntil,
  });

  if (!accessAllowed) {
    throw new Error("ACCOUNT_DISABLED");
  }

  return {
    session,
    user: {
      id: dbUser.id,
      name: dbUser.name,
      email: dbUser.email,
      activeWorkspaceId: dbUser.activeWorkspaceId,
      memberships: dbUser.memberships,
    },
  };
});

export async function getSessionOrThrow() {
  const context = await getValidatedSessionContext();
  return context.session;
}

export async function getWorkspaceContextOrThrow() {
  const { session, user } = await getValidatedSessionContext();

  const activeWorkspaceId =
    session.user.activeWorkspaceId ?? user.activeWorkspaceId ?? user.memberships[0]?.workspaceId ?? null;

  if (!activeWorkspaceId) {
    throw new Error("WORKSPACE_NOT_SELECTED");
  }

  const membership = user.memberships.find((item) => item.workspaceId === activeWorkspaceId);

  if (!membership) {
    throw new Error("WORKSPACE_FORBIDDEN");
  }

  return {
    userId: user.id,
    workspaceId: activeWorkspaceId,
    role: membership.role,
  };
}

export async function getAppShellContextOrThrow() {
  const { session, user } = await getValidatedSessionContext();

  const activeWorkspaceId =
    session.user.activeWorkspaceId ?? user.activeWorkspaceId ?? user.memberships[0]?.workspaceId ?? null;

  return {
    userId: user.id,
    userName: user.name ?? "Operador",
    userEmail: user.email,
    activeWorkspaceId,
    memberships: user.memberships.map((membership) => ({
      id: membership.workspaceId,
      name: membership.workspace.name,
      role: membership.role,
    })),
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
