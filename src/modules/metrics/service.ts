import { addDays, startOfDay } from "date-fns";

import { db } from "@/lib/db";

export async function getDashboardMetrics(workspaceId: string) {
  const sevenDaysAgo = startOfDay(addDays(new Date(), -6));

  const [
    callsTotal,
    callsCompleted,
    callsNoAnswer,
    qualifiedLeads,
    scheduledLeads,
    newLeads,
    unqualifiedLeads,
    wonLeads,
    lostLeads,
    handoffs,
    recentCalls,
    dailyMetrics,
    activeNumbers,
    agentConfig,
    avgDurationAggregate,
  ] = await Promise.all([
    db.call.count({ where: { workspaceId } }),
    db.call.count({ where: { workspaceId, status: "completed" } }),
    db.call.count({ where: { workspaceId, status: "no_answer" } }),
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
    db.lead.count({
      where: {
        workspaceId,
        status: "new",
      },
    }),
    db.lead.count({
      where: {
        workspaceId,
        status: "unqualified",
      },
    }),
    db.lead.count({
      where: {
        workspaceId,
        status: "won",
      },
    }),
    db.lead.count({
      where: {
        workspaceId,
        status: "lost",
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
    db.twilioPhoneNumber.count({
      where: {
        workspaceId,
        isActive: true,
      },
    }),
    db.agentConfig.findUnique({
      where: { workspaceId },
      select: {
        id: true,
        handoffEnabled: true,
        handoffPhone: true,
        systemPrompt: true,
        qualificationChecklist: true,
      },
    }),
    db.call.aggregate({
      where: {
        workspaceId,
        durationSeconds: {
          not: null,
        },
      },
      _avg: {
        durationSeconds: true,
      },
    }),
  ]);

  const checklistSize = Array.isArray(agentConfig?.qualificationChecklist)
    ? agentConfig.qualificationChecklist.length
    : 0;

  const readinessChecks = [
    Boolean(agentConfig?.id),
    activeNumbers > 0,
    Boolean(!agentConfig?.handoffEnabled || agentConfig?.handoffPhone),
    Boolean((agentConfig?.systemPrompt?.length ?? 0) >= 140 && checklistSize >= 3),
    recentCalls.length > 0,
  ];

  const readinessScore = Math.round(
    (readinessChecks.filter(Boolean).length / readinessChecks.length) * 100,
  );
  const avgDurationSeconds = Math.round(avgDurationAggregate._avg.durationSeconds ?? 0);
  const noAnswerRate = callsTotal > 0 ? Math.round((callsNoAnswer / callsTotal) * 100) : 0;
  const winRate = callsTotal > 0 ? Math.round((wonLeads / callsTotal) * 100) : 0;

  return {
    callsTotal,
    callsCompleted,
    callsNoAnswer,
    qualifiedLeads,
    scheduledLeads,
    newLeads,
    unqualifiedLeads,
    wonLeads,
    lostLeads,
    handoffs,
    closeRate: callsTotal > 0 ? Math.round((scheduledLeads / callsTotal) * 100) : 0,
    winRate,
    noAnswerRate,
    avgDurationSeconds,
    activeNumbers,
    readinessScore,
    readinessChecks,
    recentCalls,
    dailyMetrics,
  };
}
