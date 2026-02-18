import { UserAccessStatus } from "@prisma/client";

import { db } from "@/lib/db";

const RECENT_USERS_LIMIT = 120;
const RECENT_LEADS_LIMIT = 200;

export async function getSuperAdminOverview() {
  const [
    usersTotal,
    workspacesTotal,
    leadsTotal,
    callsTotal,
    scheduledLeads,
    qualifiedLeads,
    handoffsTotal,
    users,
    workspaces,
    recentLeads,
  ] = await Promise.all([
    db.user.count(),
    db.workspace.count(),
    db.lead.count(),
    db.call.count(),
    db.lead.count({ where: { status: "scheduled" } }),
    db.lead.count({ where: { status: "qualified" } }),
    db.handoff.count(),
    db.user.findMany({
      orderBy: { createdAt: "desc" },
      take: RECENT_USERS_LIMIT,
      select: {
        id: true,
        name: true,
        email: true,
        createdAt: true,
        accessStatus: true,
        accessReason: true,
        accessDisabledUntil: true,
        _count: {
          select: {
            memberships: true,
          },
        },
      },
    }),
    db.workspace.findMany({
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        name: true,
        slug: true,
        createdAt: true,
        owner: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        _count: {
          select: {
            members: true,
            leads: true,
            calls: true,
          },
        },
      },
    }),
    db.lead.findMany({
      orderBy: { createdAt: "desc" },
      take: RECENT_LEADS_LIMIT,
      select: {
        id: true,
        fullName: true,
        email: true,
        phone: true,
        company: true,
        status: true,
        score: true,
        createdAt: true,
        workspace: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
      },
    }),
  ]);

  const conversionRate = leadsTotal > 0 ? Math.round((scheduledLeads / leadsTotal) * 100) : 0;

  return {
    metrics: {
      usersTotal,
      workspacesTotal,
      leadsTotal,
      callsTotal,
      scheduledLeads,
      qualifiedLeads,
      handoffsTotal,
      conversionRate,
    },
    users,
    workspaces,
    recentLeads,
  };
}

export async function updateUserAccessStatus(params: {
  userId: string;
  status: UserAccessStatus;
  reason?: string | null;
  disabledHours?: number | null;
}) {
  const disabledUntil =
    params.status === "temporarily_disabled"
      ? new Date(Date.now() + Math.max(1, params.disabledHours ?? 24) * 60 * 60 * 1000)
      : null;

  return db.user.update({
    where: { id: params.userId },
    data: {
      accessStatus: params.status,
      accessReason: params.reason?.trim() ? params.reason.trim() : null,
      accessDisabledUntil: disabledUntil,
      accessUpdatedAt: new Date(),
    },
    select: {
      id: true,
      email: true,
      accessStatus: true,
      accessDisabledUntil: true,
      accessReason: true,
    },
  });
}
