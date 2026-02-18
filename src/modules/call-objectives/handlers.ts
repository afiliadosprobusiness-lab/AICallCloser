import { CallOutcome, LeadStatus, Prisma, type CallObjective } from "@prisma/client";

import { db } from "@/lib/db";
import type { AIDecision } from "@/lib/ai/types";
import type { AgentCallPreferencesInput, CallObjectiveValue, LeadFieldConfig } from "@/lib/call-objectives/config";

type ObjectiveSuccessContext = {
  workspaceId: string;
  callId: string;
  leadId: string | null;
  leadText: string;
  decision: AIDecision;
  preferences: AgentCallPreferencesInput;
  handoffPhone?: string | null;
  calendarFallbackUrl?: string | null;
};

export type ObjectiveSuccessResult = {
  outcomeCode: CallOutcome;
  leadStatusOverride?: LeadStatus;
  shouldHandoff?: boolean;
  shouldClose?: boolean;
  metadata?: Record<string, unknown>;
};

type ObjectiveHandler = {
  id: CallObjectiveValue;
  outcomeCode: CallOutcome;
  requiredInputs: (preferences: AgentCallPreferencesInput) => string[];
  promptTemplate: (preferences: AgentCallPreferencesInput) => string;
  successAction: (ctx: ObjectiveSuccessContext) => Promise<ObjectiveSuccessResult>;
};

function parseStartsAt(raw?: string | null) {
  if (!raw) {
    return new Date(Date.now() + 24 * 60 * 60 * 1000);
  }

  const parsed = new Date(raw);
  if (Number.isNaN(parsed.getTime())) {
    return new Date(Date.now() + 24 * 60 * 60 * 1000);
  }

  return parsed;
}

async function upsertAppointment(params: {
  workspaceId: string;
  callId: string;
  leadId: string | null;
  startsAt: Date;
  timezone?: string;
  notes?: string;
  meetingType: "in_person" | "google_meet" | "phone_call";
  calendarProvider: "calcom" | "google" | "manual";
  meetingUrl?: string | null;
  locationText?: string | null;
  bookingIntent?: Record<string, unknown>;
}) {
  if (!params.leadId) {
    return;
  }

  await db.appointment.upsert({
    where: { callId: params.callId },
    update: {
      startsAt: params.startsAt,
      timezone: params.timezone ?? "America/New_York",
      notes: params.notes,
      meetingType: params.meetingType,
      calendarProvider: params.calendarProvider,
      meetingUrl: params.meetingUrl ?? null,
      locationText: params.locationText ?? null,
      bookingIntent: (params.bookingIntent as Prisma.InputJsonValue | undefined) ?? undefined,
    },
    create: {
      workspaceId: params.workspaceId,
      callId: params.callId,
      leadId: params.leadId,
      startsAt: params.startsAt,
      timezone: params.timezone ?? "America/New_York",
      notes: params.notes,
      meetingType: params.meetingType,
      calendarProvider: params.calendarProvider,
      meetingUrl: params.meetingUrl ?? null,
      locationText: params.locationText ?? null,
      bookingIntent: (params.bookingIntent as Prisma.InputJsonValue | undefined) ?? undefined,
    },
  });
}

async function upsertHandoff(params: {
  workspaceId: string;
  callId: string;
  leadId: string | null;
  targetPhone?: string | null;
  reason?: string;
}) {
  if (!params.leadId || !params.targetPhone) {
    return;
  }

  await db.handoff.upsert({
    where: { callId: params.callId },
    update: {
      targetPhone: params.targetPhone,
      reason: params.reason?.includes("human") ? "requested_human" : "high_intent",
    },
    create: {
      workspaceId: params.workspaceId,
      callId: params.callId,
      leadId: params.leadId,
      targetPhone: params.targetPhone,
      reason: params.reason?.includes("human") ? "requested_human" : "high_intent",
    },
  });
}

function extractFieldValue(field: LeadFieldConfig, text: string, decision: AIDecision) {
  const lower = text.toLowerCase();

  if (field.key === "name" || field.key === "full_name") {
    return decision.leadUpdates.fullName ?? undefined;
  }

  if (field.key === "email") {
    return decision.leadUpdates.email ?? lower.match(/[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}/i)?.[0];
  }

  if (field.key === "company") {
    return decision.leadUpdates.company ?? undefined;
  }

  if (field.key === "phone") {
    return decision.leadUpdates.phone ?? text.match(/\+?\d[\d\s-]{7,}/)?.[0]?.replace(/\s+/g, "");
  }

  if (field.key === "budget") {
    return lower.match(/(?:budget|presupuesto|around|about)\s*\$?\s*([0-9][0-9,\.]*)/i)?.[1] ?? undefined;
  }

  if (field.key === "service_needed") {
    return text;
  }

  return undefined;
}

async function updateLeadRequiredFields(ctx: ObjectiveSuccessContext) {
  if (!ctx.leadId) {
    return {};
  }

  const existing = await db.lead.findUnique({
    where: { id: ctx.leadId },
    select: { customFields: true },
  });

  const current =
    typeof existing?.customFields === "object" && existing.customFields !== null
      ? (existing.customFields as Record<string, unknown>)
      : {};

  const collected: Record<string, unknown> = {};

  for (const field of ctx.preferences.leadFieldsRequired) {
    const value = extractFieldValue(field, ctx.leadText, ctx.decision);
    if (value !== undefined && value !== null && String(value).trim() !== "") {
      collected[field.key] = value;
    }
  }

  const merged = { ...current, ...collected };

  await db.lead.update({
    where: { id: ctx.leadId },
    data: {
      customFields: merged as Prisma.InputJsonValue,
    },
  });

  return merged;
}

const handlers: Record<CallObjectiveValue, ObjectiveHandler> = {
  sell_product: {
    id: "sell_product",
    outcomeCode: CallOutcome.sold,
    requiredInputs: () => [],
    promptTemplate: () => "Close with confidence and ask for explicit purchase commitment.",
    successAction: async () => ({
      outcomeCode: CallOutcome.sold,
      leadStatusOverride: LeadStatus.won,
      shouldClose: true,
    }),
  },
  book_in_person_meeting: {
    id: "book_in_person_meeting",
    outcomeCode: CallOutcome.booked_meeting,
    requiredInputs: (preferences) =>
      preferences.meetingConfig.locationText ? [] : ["meetingConfig.locationText"],
    promptTemplate: (preferences) =>
      `Offer in-person meeting (${preferences.meetingConfig.durationMinutes} min) and confirm location.`,
    successAction: async (ctx) => {
      await upsertAppointment({
        workspaceId: ctx.workspaceId,
        callId: ctx.callId,
        leadId: ctx.leadId,
        startsAt: parseStartsAt(ctx.decision.appointment?.suggestedDate),
        timezone: ctx.decision.appointment?.timezone,
        notes: ctx.decision.appointment?.notes ?? "In-person booking captured via AI objective flow.",
        meetingType: "in_person",
        calendarProvider: ctx.preferences.meetingConfig.calendarProvider,
        locationText: ctx.preferences.meetingConfig.locationText ?? null,
      });

      return {
        outcomeCode: CallOutcome.booked_meeting,
        leadStatusOverride: LeadStatus.scheduled,
        shouldClose: true,
      };
    },
  },
  book_google_meet: {
    id: "book_google_meet",
    outcomeCode: CallOutcome.booked_google_meet,
    requiredInputs: () => [],
    promptTemplate: () => "Book a Google Meet and confirm attendee email plus preferred time.",
    successAction: async (ctx) => {
      await upsertAppointment({
        workspaceId: ctx.workspaceId,
        callId: ctx.callId,
        leadId: ctx.leadId,
        startsAt: parseStartsAt(ctx.decision.appointment?.suggestedDate),
        timezone: ctx.decision.appointment?.timezone,
        notes:
          ctx.decision.appointment?.notes ??
          "Google Meet requested. If Calendar API is not connected, this remains pending confirmation.",
        meetingType: "google_meet",
        calendarProvider: "google",
        bookingIntent: {
          status: "request_pending",
          reason: "google_calendar_not_connected_or_manual_mode",
        },
      });

      return {
        outcomeCode: CallOutcome.booked_google_meet,
        leadStatusOverride: LeadStatus.scheduled,
        shouldClose: true,
      };
    },
  },
  book_calcom_appointment: {
    id: "book_calcom_appointment",
    outcomeCode: CallOutcome.booked_meeting,
    requiredInputs: (preferences) => (preferences.meetingConfig.calendarUrl ? [] : ["meetingConfig.calendarUrl"]),
    promptTemplate: () => "Capture booking intent and confirm slot for Cal.com scheduling.",
    successAction: async (ctx) => {
      const meetingUrl = ctx.preferences.meetingConfig.calendarUrl ?? ctx.calendarFallbackUrl ?? null;

      await upsertAppointment({
        workspaceId: ctx.workspaceId,
        callId: ctx.callId,
        leadId: ctx.leadId,
        startsAt: parseStartsAt(ctx.decision.appointment?.suggestedDate),
        timezone: ctx.decision.appointment?.timezone,
        notes: ctx.decision.appointment?.notes ?? "Cal.com booking intent captured.",
        meetingType: "phone_call",
        calendarProvider: "calcom",
        meetingUrl,
        bookingIntent: {
          status: "intent_captured",
          meetingUrl,
        },
      });

      return {
        outcomeCode: CallOutcome.booked_meeting,
        leadStatusOverride: LeadStatus.scheduled,
        shouldClose: true,
      };
    },
  },
  schedule_followup_call: {
    id: "schedule_followup_call",
    outcomeCode: CallOutcome.followup_scheduled,
    requiredInputs: () => [],
    promptTemplate: () => "Schedule a follow-up call and reconfirm callback number/time window.",
    successAction: async (ctx) => {
      await upsertAppointment({
        workspaceId: ctx.workspaceId,
        callId: ctx.callId,
        leadId: ctx.leadId,
        startsAt: parseStartsAt(ctx.decision.appointment?.suggestedDate),
        timezone: ctx.decision.appointment?.timezone,
        notes: ctx.decision.appointment?.notes ?? "Follow-up call scheduled by AI objective module.",
        meetingType: "phone_call",
        calendarProvider: "manual",
      });

      return {
        outcomeCode: CallOutcome.followup_scheduled,
        leadStatusOverride: LeadStatus.scheduled,
        shouldClose: true,
      };
    },
  },
  collect_lead_info: {
    id: "collect_lead_info",
    outcomeCode: CallOutcome.info_collected,
    requiredInputs: (preferences) =>
      preferences.leadFieldsRequired.filter((field) => field.required).map((field) => field.key),
    promptTemplate: () => "Collect only required lead fields, confirm completion, and stop asking extra questions.",
    successAction: async (ctx) => {
      const mergedFields = await updateLeadRequiredFields(ctx);
      return {
        outcomeCode: CallOutcome.info_collected,
        leadStatusOverride: LeadStatus.qualified,
        shouldClose: false,
        metadata: {
          collectedFields: Object.keys(mergedFields),
        },
      };
    },
  },
  qualify_only: {
    id: "qualify_only",
    outcomeCode: CallOutcome.info_collected,
    requiredInputs: () => [],
    promptTemplate: () => "Run qualification checklist only and end with concise next step.",
    successAction: async (ctx) => {
      await updateLeadRequiredFields(ctx);
      return {
        outcomeCode: CallOutcome.info_collected,
        leadStatusOverride: LeadStatus.qualified,
        shouldClose: false,
      };
    },
  },
  transfer_to_human: {
    id: "transfer_to_human",
    outcomeCode: CallOutcome.transferred,
    requiredInputs: () => ["handoffPhone"],
    promptTemplate: () => "Transfer quickly to a human specialist when intent is high or user asks for human.",
    successAction: async (ctx) => {
      await upsertHandoff({
        workspaceId: ctx.workspaceId,
        callId: ctx.callId,
        leadId: ctx.leadId,
        targetPhone: ctx.handoffPhone,
        reason: ctx.decision.handoffReason ?? "requested_human",
      });

      return {
        outcomeCode: CallOutcome.transferred,
        leadStatusOverride: LeadStatus.handed_off,
        shouldHandoff: true,
        shouldClose: true,
      };
    },
  },
  send_summary: {
    id: "send_summary",
    outcomeCode: CallOutcome.info_collected,
    requiredInputs: () => [],
    promptTemplate: () => "Confirm summary delivery channel and close.",
    successAction: async (ctx) => {
      await updateLeadRequiredFields(ctx);
      return {
        outcomeCode: CallOutcome.info_collected,
        leadStatusOverride: LeadStatus.qualified,
        shouldClose: true,
      };
    },
  },
};

export function getObjectiveHandler(objective: CallObjective | CallObjectiveValue) {
  return handlers[objective];
}

export function getObjectiveHandlersCatalog() {
  return Object.values(handlers).map((handler) => ({
    id: handler.id,
    outcomeCode: handler.outcomeCode,
    requiredInputs: handler.requiredInputs,
    promptTemplate: handler.promptTemplate,
  }));
}

export async function runObjectiveSuccessAction(params: {
  objective: CallObjectiveValue;
  context: ObjectiveSuccessContext;
}) {
  const handler = handlers[params.objective];
  return handler.successAction(params.context);
}
