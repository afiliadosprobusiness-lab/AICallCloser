import { CallObjective, CallOutcome, CallStatus, LeadStatus, Prisma, TranscriptSpeaker } from "@prisma/client";

import { type AIDecision } from "@/lib/ai/types";
import { db } from "@/lib/db";

function hasMissingColumnError(error: unknown, columnName: string) {
  if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2022") {
    return true;
  }

  if (!(error instanceof Error)) {
    return false;
  }

  return error.message.toLowerCase().includes(columnName.toLowerCase());
}

export async function createInboundCall(params: {
  workspaceId: string;
  twilioCallSid: string;
  fromNumber: string;
  toNumber: string;
}) {
  const lead = await db.lead.upsert({
    where: {
      workspaceId_phone: {
        workspaceId: params.workspaceId,
        phone: params.fromNumber,
      },
    },
    update: {},
    create: {
      workspaceId: params.workspaceId,
      phone: params.fromNumber,
      source: "inbound_call",
      status: LeadStatus.new,
    },
    select: {
      id: true,
    },
  });

  const existing = await db.call.findUnique({
    where: { twilioCallSid: params.twilioCallSid },
    select: {
      id: true,
      workspaceId: true,
      leadId: true,
      twilioCallSid: true,
      fromNumber: true,
      toNumber: true,
      status: true,
      outcome: true,
      durationSeconds: true,
      summary: true,
      startedAt: true,
      endedAt: true,
      createdAt: true,
      updatedAt: true,
      lead: {
        select: {
          id: true,
          phone: true,
        },
      },
    },
  });

  if (existing) {
    const call = await db.call.update({
      where: { id: existing.id },
      data: {
        status: existing.endedAt ? existing.status : CallStatus.in_progress,
        leadId: lead.id,
        fromNumber: params.fromNumber,
        toNumber: params.toNumber,
      },
      select: {
        id: true,
        workspaceId: true,
        leadId: true,
        twilioCallSid: true,
        fromNumber: true,
        toNumber: true,
        status: true,
        outcome: true,
        durationSeconds: true,
        summary: true,
        startedAt: true,
        endedAt: true,
        createdAt: true,
        updatedAt: true,
        lead: {
          select: {
            id: true,
            phone: true,
          },
        },
      },
    });

    return { call, isNew: false };
  }

  const call = await db.call.create({
    data: {
      workspaceId: params.workspaceId,
      twilioCallSid: params.twilioCallSid,
      fromNumber: params.fromNumber,
      toNumber: params.toNumber,
      status: CallStatus.in_progress,
      leadId: lead.id,
    },
    select: {
      id: true,
      workspaceId: true,
      leadId: true,
      twilioCallSid: true,
      fromNumber: true,
      toNumber: true,
      status: true,
      outcome: true,
      durationSeconds: true,
      summary: true,
      startedAt: true,
      endedAt: true,
      createdAt: true,
      updatedAt: true,
      lead: {
        select: {
          id: true,
          phone: true,
        },
      },
    },
  });

  return { call, isNew: true };
}

export async function appendTranscriptTurn(params: {
  workspaceId: string;
  callId: string;
  speaker: TranscriptSpeaker;
  text: string;
  metadata?: Prisma.InputJsonValue;
}) {
  return db.transcriptTurn.create({
    data: {
      workspaceId: params.workspaceId,
      callId: params.callId,
      speaker: params.speaker,
      text: params.text,
      metadata: params.metadata ?? undefined,
    },
  });
}

export async function applyDecisionToCall(params: {
  workspaceId: string;
  callId: string;
  decision: AIDecision;
  handoffPhone?: string | null;
  outcomeOverride?: CallOutcome;
  leadStatusOverride?: LeadStatus;
  objectiveApplied?: CallObjective;
  leadCustomFields?: Record<string, unknown>;
}) {
  let includesLeadCustomFields = true;
  let call:
    | {
        id: string;
        leadId: string | null;
        lead: { id: string; customFields?: Prisma.JsonValue | null } | null;
      }
    | null = null;

  try {
    call = await db.call.findFirst({
      where: {
        id: params.callId,
        workspaceId: params.workspaceId,
      },
      select: {
        id: true,
        leadId: true,
        lead: {
          select: {
            id: true,
            customFields: true,
          },
        },
      },
    });
  } catch (error) {
    if (!hasMissingColumnError(error, "Lead.customFields")) {
      throw error;
    }

    includesLeadCustomFields = false;
    call = await db.call.findFirst({
      where: {
        id: params.callId,
        workspaceId: params.workspaceId,
      },
      select: {
        id: true,
        leadId: true,
        lead: {
          select: {
            id: true,
          },
        },
      },
    });
  }

  if (!call?.lead) {
    throw new Error("CALL_OR_LEAD_NOT_FOUND");
  }

  const leadStatusMap: Record<string, LeadStatus> = {
    qualified: LeadStatus.qualified,
    scheduled: LeadStatus.scheduled,
    handoff: LeadStatus.handed_off,
    not_qualified: LeadStatus.unqualified,
    follow_up: LeadStatus.new,
    unknown: LeadStatus.new,
    sold: LeadStatus.won,
    booked_meeting: LeadStatus.scheduled,
    booked_google_meet: LeadStatus.scheduled,
    followup_scheduled: LeadStatus.scheduled,
    info_collected: LeadStatus.qualified,
    transferred: LeadStatus.handed_off,
    not_interested: LeadStatus.lost,
    disqualified: LeadStatus.unqualified,
  };

  const callOutcomeMap: Record<string, CallOutcome> = {
    qualify: CallOutcome.qualified,
    schedule: CallOutcome.scheduled,
    handoff: CallOutcome.handoff,
    close: CallOutcome.follow_up,
    follow_up: CallOutcome.follow_up,
  };

  const nextOutcome = params.outcomeOverride ?? callOutcomeMap[params.decision.action] ?? CallOutcome.unknown;

  const nextLeadStatus =
    params.leadStatusOverride ??
    params.decision.leadUpdates.status ??
    leadStatusMap[nextOutcome] ??
    LeadStatus.new;

  const mergedCustomFields =
    params.leadCustomFields && Object.keys(params.leadCustomFields).length > 0
      ? {
          ...(includesLeadCustomFields &&
          typeof call.lead.customFields === "object" &&
          call.lead.customFields !== null
            ? (call.lead.customFields as Record<string, unknown>)
            : {}),
          ...params.leadCustomFields,
        }
      : undefined;

  await db.$transaction(async (tx) => {
    const leadUpdateData: Prisma.LeadUpdateInput = {
      fullName: params.decision.leadUpdates.fullName ?? undefined,
      email: params.decision.leadUpdates.email ?? undefined,
      company: params.decision.leadUpdates.company ?? undefined,
      notes: params.decision.leadUpdates.notes ?? undefined,
      score: {
        increment: params.decision.leadUpdates.scoreDelta,
      },
      status: nextLeadStatus,
    };

    if (includesLeadCustomFields && mergedCustomFields) {
      leadUpdateData.customFields = mergedCustomFields as Prisma.InputJsonValue;
    }

    try {
      await tx.lead.update({
        where: { id: call.leadId ?? "" },
        data: leadUpdateData,
      });
    } catch (error) {
      if (!hasMissingColumnError(error, "Lead.customFields")) {
        throw error;
      }

      await tx.lead.update({
        where: { id: call.leadId ?? "" },
        data: {
          fullName: params.decision.leadUpdates.fullName ?? undefined,
          email: params.decision.leadUpdates.email ?? undefined,
          company: params.decision.leadUpdates.company ?? undefined,
          notes: params.decision.leadUpdates.notes ?? undefined,
          score: {
            increment: params.decision.leadUpdates.scoreDelta,
          },
          status: nextLeadStatus,
        },
      });
    }

    try {
      await tx.call.update({
        where: { id: call.id },
        data: {
          outcome: nextOutcome,
          objectiveApplied: params.objectiveApplied,
        },
      });
    } catch (error) {
      if (!hasMissingColumnError(error, "Call.objectiveApplied")) {
        throw error;
      }

      await tx.call.update({
        where: { id: call.id },
        data: {
          outcome: nextOutcome,
        },
      });
    }

    if (params.decision.action === "handoff" && params.handoffPhone) {
      await tx.handoff.upsert({
        where: { callId: call.id },
        update: {
          reason: mapHandoffReason(params.decision.handoffReason),
          targetPhone: params.handoffPhone,
        },
        create: {
          workspaceId: params.workspaceId,
          leadId: call.leadId ?? "",
          callId: call.id,
          reason: mapHandoffReason(params.decision.handoffReason),
          targetPhone: params.handoffPhone,
        },
      });
    }
  });
}

function mapHandoffReason(reason?: string) {
  if (!reason) {
    return "uncertainty";
  }

  if (reason.includes("human")) {
    return "requested_human";
  }

  if (reason.includes("technical")) {
    return "technical";
  }

  return "uncertainty";
}

export async function getCallContext(params: { workspaceId: string; callId: string }) {
  return db.call.findFirst({
    where: {
      workspaceId: params.workspaceId,
      id: params.callId,
    },
    select: {
      id: true,
      leadId: true,
      twilioCallSid: true,
      lead: {
        select: {
          id: true,
          phone: true,
        },
      },
      transcripts: {
        orderBy: { spokenAt: "asc" },
        select: {
          id: true,
          speaker: true,
          text: true,
          metadata: true,
          spokenAt: true,
        },
      },
    },
  });
}

export async function getCallByProviderSid(callSid: string) {
  return db.call.findUnique({
    where: { twilioCallSid: callSid },
    select: {
      id: true,
      workspaceId: true,
      twilioCallSid: true,
      status: true,
      endedAt: true,
    },
  });
}

export async function completeCall(params: {
  workspaceId: string;
  callSid: string;
  status: CallStatus;
  durationSeconds?: number;
}) {
  const isTerminal =
    params.status === CallStatus.completed ||
    params.status === CallStatus.failed ||
    params.status === CallStatus.no_answer;

  const durationSeconds =
    typeof params.durationSeconds === "number" && Number.isFinite(params.durationSeconds)
      ? Math.max(0, Math.round(params.durationSeconds))
      : undefined;

  if (isTerminal) {
    return db.call.updateMany({
      where: {
        workspaceId: params.workspaceId,
        twilioCallSid: params.callSid,
        endedAt: null,
      },
      data: {
        status: params.status,
        durationSeconds,
        endedAt: new Date(),
      },
    });
  }

  return db.call.updateMany({
    where: {
      workspaceId: params.workspaceId,
      twilioCallSid: params.callSid,
      endedAt: null,
    },
    data: {
      status: params.status,
      durationSeconds,
    },
  });
}
