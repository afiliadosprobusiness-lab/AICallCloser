import { CallOutcome, CallStatus, LeadStatus, Prisma, TranscriptSpeaker } from "@prisma/client";

import { db } from "@/lib/db";
import { type AIDecision } from "@/lib/ai/types";

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
  });

  return db.call.upsert({
    where: { twilioCallSid: params.twilioCallSid },
    update: {
      status: CallStatus.in_progress,
      leadId: lead.id,
      fromNumber: params.fromNumber,
      toNumber: params.toNumber,
    },
    create: {
      workspaceId: params.workspaceId,
      twilioCallSid: params.twilioCallSid,
      fromNumber: params.fromNumber,
      toNumber: params.toNumber,
      status: CallStatus.in_progress,
      leadId: lead.id,
    },
    include: {
      lead: true,
    },
  });
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
}) {
  const call = await db.call.findFirst({
    where: {
      id: params.callId,
      workspaceId: params.workspaceId,
    },
    include: {
      lead: true,
    },
  });

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
  };

  const callOutcomeMap: Record<string, CallOutcome> = {
    qualify: CallOutcome.qualified,
    schedule: CallOutcome.scheduled,
    handoff: CallOutcome.handoff,
    close: CallOutcome.follow_up,
    follow_up: CallOutcome.follow_up,
  };

  const nextLeadStatus =
    params.decision.leadUpdates.status ?? leadStatusMap[callOutcomeMap[params.decision.action]];

  await db.$transaction(async (tx) => {
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

    await tx.call.update({
      where: { id: call.id },
      data: {
        outcome: callOutcomeMap[params.decision.action],
      },
    });

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
    include: {
      lead: true,
      transcripts: {
        orderBy: { spokenAt: "asc" },
      },
    },
  });
}

export async function completeCall(params: {
  workspaceId: string;
  callSid: string;
  status: CallStatus;
  durationSeconds?: number;
}) {
  return db.call.updateMany({
    where: {
      workspaceId: params.workspaceId,
      twilioCallSid: params.callSid,
    },
    data: {
      status: params.status,
      durationSeconds: params.durationSeconds,
      endedAt: new Date(),
    },
  });
}
