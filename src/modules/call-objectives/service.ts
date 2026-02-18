import { CallOutcome, LeadStatus, Prisma, type CallObjective } from "@prisma/client";

import {
  buildDynamicPlaybook,
  buildPlaybookPreviewText,
  defaultCallPreferences,
  getFallbackObjective,
  normalizeCallPreferences,
  type AgentCallPreferencesInput,
  type CallObjectiveValue,
} from "@/lib/call-objectives/config";
import { limitReplyWords, normalizeAssistantReply } from "@/lib/ai/guardrails";
import { db } from "@/lib/db";
import type { AIDecision } from "@/lib/ai/types";
import { getObjectiveHandler, runObjectiveSuccessAction } from "@/modules/call-objectives/handlers";

const notInterestedRegex =
  /(no(?!\s+problem)|not interested|no me interesa|stop calling|no thanks|sin interes|dont call)/i;

const notDecisionMakerRegex =
  /(not (the )?decision maker|no soy (el )?decisor|no decido|need approval|requiere aprobacion)/i;

type PersistedPreferences = {
  primaryObjective: CallObjective;
  secondaryObjectives: CallObjective[];
  language: "en" | "es";
  meetingType: "in_person" | "google_meet" | "phone_call";
  durationMinutes: number;
  locationText: string | null;
  calendarProvider: "calcom" | "google" | "manual";
  calendarUrl: string | null;
  followupAllowedWindows: string[];
  maxFollowups: number;
  leadFieldsRequired: Prisma.InputJsonValue;
  disqualifyRules: Prisma.InputJsonValue;
  complianceRules: Prisma.InputJsonValue;
};

export function serializePreferences(input: AgentCallPreferencesInput): PersistedPreferences {
  return {
    primaryObjective: input.primaryObjective,
    secondaryObjectives: input.secondaryObjectives,
    language: input.language,
    meetingType: input.meetingConfig.meetingType,
    durationMinutes: input.meetingConfig.durationMinutes,
    locationText: input.meetingConfig.locationText ?? null,
    calendarProvider: input.meetingConfig.calendarProvider,
    calendarUrl: input.meetingConfig.calendarUrl ?? null,
    followupAllowedWindows: input.followupConfig.allowedWindows,
    maxFollowups: input.followupConfig.maxFollowups,
    leadFieldsRequired: input.leadFieldsRequired as Prisma.InputJsonValue,
    disqualifyRules: input.disqualifyRules as Prisma.InputJsonValue,
    complianceRules: input.complianceRules as Prisma.InputJsonValue,
  };
}

export function deserializePreferences(raw: unknown) {
  if (!raw || typeof raw !== "object") {
    return defaultCallPreferences;
  }

  const row = raw as Partial<PersistedPreferences>;
  return normalizeCallPreferences({
    primaryObjective: row.primaryObjective ?? defaultCallPreferences.primaryObjective,
    secondaryObjectives: row.secondaryObjectives ?? defaultCallPreferences.secondaryObjectives,
    language: row.language ?? defaultCallPreferences.language,
    meetingConfig: {
      meetingType: row.meetingType ?? defaultCallPreferences.meetingConfig.meetingType,
      durationMinutes: row.durationMinutes ?? defaultCallPreferences.meetingConfig.durationMinutes,
      locationText: row.locationText ?? defaultCallPreferences.meetingConfig.locationText,
      calendarProvider: row.calendarProvider ?? defaultCallPreferences.meetingConfig.calendarProvider,
      calendarUrl: row.calendarUrl ?? defaultCallPreferences.meetingConfig.calendarUrl,
    },
    followupConfig: {
      allowedWindows: row.followupAllowedWindows ?? defaultCallPreferences.followupConfig.allowedWindows,
      maxFollowups: row.maxFollowups ?? defaultCallPreferences.followupConfig.maxFollowups,
    },
    leadFieldsRequired: row.leadFieldsRequired ?? defaultCallPreferences.leadFieldsRequired,
    disqualifyRules: row.disqualifyRules ?? defaultCallPreferences.disqualifyRules,
    complianceRules: row.complianceRules ?? defaultCallPreferences.complianceRules,
  });
}

export async function getOrCreateCallPreferences(workspaceId: string) {
  const created = await db.agentCallPreferences.upsert({
    where: { workspaceId },
    update: {},
    create: {
      workspaceId,
      ...serializePreferences(defaultCallPreferences),
    },
  });

  return deserializePreferences(created);
}

export async function saveCallPreferences(params: {
  workspaceId: string;
  payload: AgentCallPreferencesInput;
}) {
  const normalized = normalizeCallPreferences(params.payload);
  const saved = await db.agentCallPreferences.upsert({
    where: { workspaceId: params.workspaceId },
    update: serializePreferences(normalized),
    create: {
      workspaceId: params.workspaceId,
      ...serializePreferences(normalized),
    },
  });

  return deserializePreferences(saved);
}

export async function getBusinessValueProp(workspaceId: string) {
  const profile = await db.businessProfile.findUnique({
    where: { workspaceId },
    select: { valueProp: true },
  });

  return profile?.valueProp ?? "";
}

export async function setBusinessValueProp(workspaceId: string, valueProp: string) {
  const safeValueProp = valueProp.trim();
  return db.businessProfile.upsert({
    where: { workspaceId },
    update: { valueProp: safeValueProp },
    create: {
      workspaceId,
      valueProp: safeValueProp,
    },
  });
}

export function buildCallObjectivesPreview(params: {
  agentName: string;
  valueProp: string;
  preferences: AgentCallPreferencesInput;
}) {
  return buildPlaybookPreviewText(params);
}

export function buildCallObjectivePlaybook(params: {
  agentName: string;
  valueProp: string;
  preferences: AgentCallPreferencesInput;
}) {
  return buildDynamicPlaybook(params);
}

function parseBudget(text: string) {
  const match = text.match(/(?:budget|presupuesto|around|about)\s*\$?\s*([0-9][0-9,\.]*)/i);
  if (!match?.[1]) {
    return undefined;
  }

  const parsed = Number(match[1].replace(/,/g, ""));
  if (!Number.isFinite(parsed)) {
    return undefined;
  }

  return parsed;
}

function extractLocation(text: string) {
  const match = text.match(/(?:in|from|en)\s+([a-zA-Z\s]{2,40})/i);
  return match?.[1]?.trim().toLowerCase();
}

function shouldDisqualify(text: string, preferences: AgentCallPreferencesInput) {
  const rules = preferences.disqualifyRules as Record<string, unknown>;
  const minBudget = typeof rules.minBudget === "number" ? rules.minBudget : undefined;
  const mustBeDecisionMaker = rules.mustBeDecisionMaker === true;
  const serviceArea = Array.isArray(rules.serviceArea)
    ? rules.serviceArea.map((item) => String(item).toLowerCase())
    : [];

  const budget = parseBudget(text);
  if (typeof minBudget === "number" && typeof budget === "number" && budget < minBudget) {
    return true;
  }

  if (mustBeDecisionMaker && notDecisionMakerRegex.test(text)) {
    return true;
  }

  const location = extractLocation(text);
  if (location && serviceArea.length > 0 && !serviceArea.some((allowed) => location.includes(allowed))) {
    return true;
  }

  return false;
}

function mapOutcomeFromObjective(params: {
  objective: CallObjectiveValue;
  action: AIDecision["action"];
}): CallOutcome | null {
  const { objective, action } = params;

  if (objective === "sell_product" && action === "close") {
    return CallOutcome.sold;
  }

  if (objective === "book_google_meet" && (action === "schedule" || action === "close")) {
    return CallOutcome.booked_google_meet;
  }

  if (
    (objective === "book_in_person_meeting" || objective === "book_calcom_appointment") &&
    (action === "schedule" || action === "close")
  ) {
    return CallOutcome.booked_meeting;
  }

  if (objective === "schedule_followup_call" && (action === "follow_up" || action === "schedule" || action === "close")) {
    return CallOutcome.followup_scheduled;
  }

  if (objective === "transfer_to_human" && (action === "handoff" || action === "follow_up")) {
    return CallOutcome.transferred;
  }

  if (
    (objective === "collect_lead_info" || objective === "qualify_only" || objective === "send_summary") &&
    ["qualify", "follow_up", "schedule", "close"].includes(action)
  ) {
    return CallOutcome.info_collected;
  }

  return null;
}

export type ObjectiveResolution = {
  objective: CallObjectiveValue;
  usedFallback: boolean;
  outcome: CallOutcome;
  leadStatusOverride?: LeadStatus;
  shouldClose: boolean;
  shouldHandoff: boolean;
  replyOverride?: string;
  runSuccessAction: boolean;
};

export function resolveObjectiveDecision(params: {
  userText: string;
  decision: AIDecision;
  preferences: AgentCallPreferencesInput;
}) {
  const normalizedText = params.userText.toLowerCase();

  if (params.preferences.complianceRules.endCallIfNotInterested && notInterestedRegex.test(normalizedText)) {
    return {
      adjustedDecision: {
        ...params.decision,
        action: "close" as const,
        assistantReply: "Understood. Thanks for your time. We can close this call now.",
        leadUpdates: {
          ...params.decision.leadUpdates,
          status: "lost" as const,
          scoreDelta: -2,
        },
      },
      resolution: {
        objective: params.preferences.primaryObjective,
        usedFallback: false,
        outcome: CallOutcome.not_interested,
        leadStatusOverride: LeadStatus.lost,
        shouldClose: true,
        shouldHandoff: false,
        runSuccessAction: false,
      } satisfies ObjectiveResolution,
    };
  }

  if (shouldDisqualify(normalizedText, params.preferences)) {
    return {
      adjustedDecision: {
        ...params.decision,
        action: "close" as const,
        assistantReply: "Thanks. Based on your criteria, a specialist will review and follow up if there is a fit.",
        leadUpdates: {
          ...params.decision.leadUpdates,
          status: "unqualified" as const,
          scoreDelta: -1,
        },
      },
      resolution: {
        objective: params.preferences.primaryObjective,
        usedFallback: false,
        outcome: CallOutcome.disqualified,
        leadStatusOverride: LeadStatus.unqualified,
        shouldClose: true,
        shouldHandoff: false,
        runSuccessAction: false,
      } satisfies ObjectiveResolution,
    };
  }

  const primaryOutcome = mapOutcomeFromObjective({
    objective: params.preferences.primaryObjective,
    action: params.decision.action,
  });

  if (primaryOutcome) {
    return {
      adjustedDecision: params.decision,
      resolution: {
        objective: params.preferences.primaryObjective,
        usedFallback: false,
        outcome: primaryOutcome,
        shouldClose:
          primaryOutcome !== CallOutcome.info_collected || params.decision.action !== "qualify",
        shouldHandoff: primaryOutcome === CallOutcome.transferred,
        runSuccessAction: true,
      } satisfies ObjectiveResolution,
    };
  }

  if (["schedule", "handoff", "close", "follow_up"].includes(params.decision.action)) {
    const fallbackObjective = getFallbackObjective(params.preferences);
    const fallbackOutcome =
      mapOutcomeFromObjective({
        objective: fallbackObjective,
        action: fallbackObjective === "transfer_to_human" ? "handoff" : "follow_up",
      }) ?? CallOutcome.followup_scheduled;

    const fallbackReply =
      fallbackObjective === "transfer_to_human"
        ? "I will transfer you to a human specialist now."
        : "I will schedule a quick follow-up call to continue this conversation.";

    return {
      adjustedDecision: {
        ...params.decision,
        action: fallbackObjective === "transfer_to_human" ? ("handoff" as const) : ("follow_up" as const),
        assistantReply: fallbackReply,
      },
      resolution: {
        objective: fallbackObjective,
        usedFallback: true,
        outcome: fallbackOutcome,
        shouldClose: true,
        shouldHandoff: fallbackObjective === "transfer_to_human",
        runSuccessAction: true,
      } satisfies ObjectiveResolution,
    };
  }

  return {
    adjustedDecision: params.decision,
    resolution: {
      objective: params.preferences.primaryObjective,
      usedFallback: false,
        outcome: CallOutcome.qualified,
        shouldClose: false,
        shouldHandoff: false,
        runSuccessAction: false,
      } satisfies ObjectiveResolution,
  };
}

export function applyReplyCompliance(params: {
  decision: AIDecision;
  preferences: AgentCallPreferencesInput;
}) {
  const maxReplyWords = Number(params.preferences.complianceRules.maxReplyWords) || 20;
  return {
    ...params.decision,
    assistantReply: limitReplyWords(normalizeAssistantReply(params.decision.assistantReply), maxReplyWords),
  };
}

export async function executeObjectiveSuccess(params: {
  objective: CallObjectiveValue;
  workspaceId: string;
  callId: string;
  leadId: string | null;
  leadText: string;
  decision: AIDecision;
  preferences: AgentCallPreferencesInput;
  handoffPhone?: string | null;
  calendarFallbackUrl?: string | null;
}) {
  const handler = getObjectiveHandler(params.objective);

  const result = await runObjectiveSuccessAction({
    objective: params.objective,
    context: {
      workspaceId: params.workspaceId,
      callId: params.callId,
      leadId: params.leadId,
      leadText: params.leadText,
      decision: params.decision,
      preferences: params.preferences,
      handoffPhone: params.handoffPhone,
      calendarFallbackUrl: params.calendarFallbackUrl,
    },
  });

  return {
    ...result,
    requiredInputs: handler.requiredInputs(params.preferences),
    promptTemplate: handler.promptTemplate(params.preferences),
  };
}
