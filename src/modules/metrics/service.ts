import { addDays, startOfDay } from "date-fns";

import { db } from "@/lib/db";

export async function getDashboardMetrics(workspaceId: string) {
  const sevenDaysAgo = startOfDay(addDays(new Date(), -6));

  const [callsTotal, qualifiedLeads, scheduledLeads, handoffs, recentCalls, dailyMetrics] =
    await Promise.all([
      db.call.count({ where: { workspaceId } }),
      db.lead.count({
        where: {
          workspaceId,
          status: "qualified",
        },
      }),
      db.lead.count({
        where: {
          workspaceId,
          status: "scheduled",
        },
      }),
      db.handoff.count({ where: { workspaceId } }),
      db.call.findMany({
        where: { workspaceId },
        include: {
          lead: true,
        },
        orderBy: { startedAt: "desc" },
        take: 8,
      }),
      db.metricDaily.findMany({
        where: {
          workspaceId,
          date: {
            gte: sevenDaysAgo,
          },
        },
        orderBy: { date: "asc" },
      }),
    ]);

  return {
    callsTotal,
    qualifiedLeads,
    scheduledLeads,
    handoffs,
    closeRate: callsTotal > 0 ? Math.round((scheduledLeads / callsTotal) * 100) : 0,
    recentCalls,
    dailyMetrics,
  };
}
