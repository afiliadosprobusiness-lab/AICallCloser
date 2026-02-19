import { twiml } from "twilio";
import { z } from "zod";

import { buildCallObjectivePlaybook, deserializePreferences } from "@/modules/call-objectives/service";
import { loadBridgeLeadContext } from "@/modules/bridge/service";
import { appendTranscriptTurn, createInboundCall } from "@/modules/calls/service";
import { db } from "@/lib/db";
import { env } from "@/lib/env";
import { getTwilioClient } from "@/lib/twilio/client";
import { verifyTwilioSignature } from "@/lib/twilio/security";
import { signTtsPayload } from "@/lib/voice/token";
import { xmlResponse } from "@/lib/voice/webhook-response";
import { OUTBOUND_CALLER_ID_MARKER } from "@/lib/voice/outbound-number";

const E164_REGEX = /^\+[1-9]\d{7,14}$/;

const outboundPayloadSchema = z.object({
  to: z.string().trim().regex(E164_REGEX, "Use E.164 format. Example: +51924464410"),
  from: z.string().trim().regex(E164_REGEX, "Use E.164 format. Example: +15752550685").optional(),
});

function asStringArray(value: unknown) {
  return Array.isArray(value) ? value.map((item) => String(item)) : [];
}

function getBaseUrl() {
  return env.BASE_URL ?? env.APP_URL;
}

function buildDefaultOpening(params: {
  language: "en" | "es";
  agentName: string;
  businessName: string;
}) {
  if (params.language === "es") {
    return `Hola, soy ${params.agentName}, asistente de ${params.businessName}. Toma menos de 30 segundos. Es mal momento?`;
  }

  return `Hi, this is ${params.agentName}, the AI assistant from ${params.businessName}. This will take less than 30 seconds. Is this a bad time?`;
}

function buildColdCallSystemPrompt(params: {
  systemPrompt: string;
  playbook: ReturnType<typeof buildCallObjectivePlaybook>;
  checklist: string[];
  disallowedClaims: string[];
  leadContext?: {
    clientName?: string | null;
    externalId?: string;
    customerName?: string;
    objectivePrompt?: string;
    preferredTimes?: string[];
    collectedEntries?: string[];
  } | null;
}) {
  const leadContextLines = params.leadContext
    ? [
        `Lead externalId: ${params.leadContext.externalId ?? "n/a"}`,
        params.leadContext.clientName ? `Lead name: ${params.leadContext.clientName}` : "",
        params.leadContext.customerName ? `Customer: ${params.leadContext.customerName}` : "",
        params.leadContext.objectivePrompt ? params.leadContext.objectivePrompt : "",
        params.leadContext.preferredTimes?.length
          ? `Preferred times: ${params.leadContext.preferredTimes.join(" | ")}`
          : "",
        params.leadContext.collectedEntries?.length
          ? `Collected lead data: ${params.leadContext.collectedEntries.join(" | ")}`
          : "",
      ].filter(Boolean)
    : [];

  return [
    params.systemPrompt,
    "",
    "COLD CALL PLAYBOOK:",
    `Opening: ${params.playbook.opening}`,
    `Qualification questions (max 4): ${params.playbook.qualifyQuestions.join(" | ")}`,
    `Primary objective (${params.playbook.primaryObjective}): ${params.playbook.objectivePrompt}`,
    `Fallback objective (${params.playbook.fallbackObjective}): ${params.playbook.fallbackPrompt}`,
    "Rules: responses under 20 words; do not invent prices; no guarantees; never claim to be human.",
    "Handle objections briefly: send info, busy now, already have someone.",
    "If prospect says not interested, close politely and quickly.",
    `Qualification checklist: ${params.checklist.join(" | ") || "Use lead source, budget, urgency, decision maker."}`,
    `Disallowed claims: ${params.disallowedClaims.join(" | ") || "No unsupported claims."}`,
    `Compliance bullets: ${params.playbook.complianceBullets.join(" | ")}`,
    leadContextLines.length > 0 ? "LEAD CONTEXT:" : "",
    ...leadContextLines,
  ]
    .filter(Boolean)
    .join("\n");
}

function mapTwilioCreateError(error: unknown) {
  const message = error instanceof Error ? error.message : "Twilio outbound call failed.";
  const normalized = message.toLowerCase();
  const code =
    typeof error === "object" && error !== null && "code" in error
      ? Number((error as { code?: unknown }).code)
      : undefined;

  if (
    normalized.includes("trial") ||
    normalized.includes("unverified") ||
    normalized.includes("verified caller id") ||
    code === 21210
  ) {
    return "Twilio Trial: verify the destination number in Verified Caller IDs.";
  }

  if (normalized.includes("phone number") && normalized.includes("valid")) {
    return "Destination number must use E.164 format. Example: +51924464410";
  }

  return message;
}

type OutboundCreateInput = {
  workspaceId: string;
  payload: unknown;
  requestBaseUrl?: string;
};

export async function createTwilioOutboundCall(input: OutboundCreateInput) {
  const parsed = outboundPayloadSchema.safeParse(input.payload);
  if (!parsed.success) {
    return {
      ok: false as const,
      status: 400,
      error: parsed.error.flatten(),
    };
  }

  const twilioClient = getTwilioClient();
  if (!twilioClient) {
    return {
      ok: false as const,
      status: 503,
      error: {
        message: "Twilio not configured. Define TWILIO_ACCOUNT_SID and TWILIO_AUTH_TOKEN.",
      },
    };
  }

  const [outboundWorkspaceNumber, workspaceNumber, agentConfig] = await Promise.all([
    db.twilioPhoneNumber.findFirst({
      where: {
        workspaceId: input.workspaceId,
        isActive: true,
        friendlyName: {
          contains: OUTBOUND_CALLER_ID_MARKER,
          mode: "insensitive",
        },
      },
      orderBy: { createdAt: "desc" },
      select: { phoneNumber: true },
    }),
    db.twilioPhoneNumber.findFirst({
      where: { workspaceId: input.workspaceId, isActive: true },
      orderBy: { createdAt: "asc" },
      select: { phoneNumber: true },
    }),
    db.agentConfig.findUnique({
      where: { workspaceId: input.workspaceId },
      select: { id: true },
    }),
  ]);

  if (!agentConfig) {
    return {
      ok: false as const,
      status: 400,
      error: {
        message: "Agent configuration not found. Configure your AI agent first.",
      },
    };
  }

  const fromNumber =
    parsed.data.from ??
    outboundWorkspaceNumber?.phoneNumber ??
    env.TWILIO_NUMBER ??
    env.TWILIO_INBOUND_NUMBER ??
    workspaceNumber?.phoneNumber;

  if (!fromNumber || !E164_REGEX.test(fromNumber)) {
    return {
      ok: false as const,
      status: 400,
      error: {
        message: "Missing valid origin number. Configure TWILIO_NUMBER in environment variables.",
      },
    };
  }

  const baseUrl = input.requestBaseUrl ?? getBaseUrl();
  const statusCallbackUrl = `${baseUrl}/api/twilio/voice/status`;
  const runtime = await resolveRuntimeConfig({ agentId: agentConfig.id, workspaceId: null, leadId: null });

  if (!runtime) {
    return {
      ok: false as const,
      status: 400,
      error: {
        message: "Agent runtime configuration is not available.",
      },
    };
  }

  const resolvedOpening =
    runtime.agentConfig.greetingMessage?.trim() ||
    runtime.playbook.opening ||
    buildDefaultOpening({
      language: runtime.preferences.language,
      agentName: runtime.agentConfig.agentName,
      businessName: runtime.agentConfig.workspace.name ?? "your team",
    });

  const coldCallPrompt = buildColdCallSystemPrompt({
    systemPrompt: runtime.agentConfig.systemPrompt,
    playbook: runtime.playbook,
    checklist: asStringArray(runtime.agentConfig.qualificationChecklist),
    disallowedClaims: asStringArray(runtime.agentConfig.disallowedClaims),
    leadContext: runtime.bridgeLeadContext,
  });

  const processUrl = `${baseUrl}/api/twilio/voice/process?workspaceId=${runtime.agentConfig.workspaceId}`;
  const promptAudioUrl = env.OPENAI_API_KEY
    ? `${baseUrl}/api/voice/tts?token=${encodeURIComponent(
        signTtsPayload({
          text: resolvedOpening,
          workspaceId: runtime.agentConfig.workspaceId,
          voice: runtime.agentConfig.ttsVoice ?? "alloy",
          model: runtime.agentConfig.voiceModel ?? env.OPENAI_TTS_MODEL,
        }),
      )}`
    : undefined;

  const outboundTwiml = buildOutboundGatherTwiml({
    opening: resolvedOpening,
    actionUrl: processUrl,
    promptAudioUrl,
    language: runtime.preferences.language,
  });

  try {
    const createdCall = await twilioClient.calls.create({
      to: parsed.data.to,
      from: fromNumber,
      twiml: outboundTwiml,
      statusCallback: statusCallbackUrl,
      statusCallbackMethod: "POST",
      statusCallbackEvent: ["initiated", "ringing", "answered", "completed"],
    });

    const persisted = await createInboundCall({
      workspaceId: input.workspaceId,
      twilioCallSid: createdCall.sid,
      fromNumber: parsed.data.to,
      toNumber: fromNumber,
    });

    if (persisted.isNew) {
      await appendTranscriptTurn({
        workspaceId: input.workspaceId,
        callId: persisted.call.id,
        speaker: "system",
        text: "Outbound cold call initiated",
        metadata: {
          provider: "twilio",
          direction: "outbound",
          callSid: createdCall.sid,
          from: fromNumber,
          to: parsed.data.to,
          twimlSource: "inline",
          statusCallback: statusCallbackUrl,
          agentId: agentConfig.id,
          opening: resolvedOpening,
          compiledSystemPrompt: coldCallPrompt,
          objective: runtime.preferences.primaryObjective,
          secondaryObjectives: runtime.preferences.secondaryObjectives,
          leadFieldsRequired: runtime.preferences.leadFieldsRequired,
          qualificationChecklist: asStringArray(runtime.agentConfig.qualificationChecklist),
          disallowedClaims: asStringArray(runtime.agentConfig.disallowedClaims),
          callPlaybook: runtime.playbook,
        },
      });
    }

    return {
      ok: true as const,
      status: 201,
      data: createdCall,
    };
  } catch (error) {
    return {
      ok: false as const,
      status: 400,
      error: {
        message: mapTwilioCreateError(error),
      },
    };
  }
}

async function resolveRuntimeConfig(params: {
  agentId: string | null;
  workspaceId: string | null;
  leadId?: string | null;
}) {
  const agentConfig = params.agentId
    ? await db.agentConfig.findUnique({
        where: { id: params.agentId },
        select: {
          id: true,
          workspaceId: true,
          agentName: true,
          greetingMessage: true,
          systemPrompt: true,
          qualificationChecklist: true,
          disallowedClaims: true,
          ttsVoice: true,
          voiceModel: true,
          workspace: {
            select: {
              name: true,
            },
          },
        },
      })
    : params.workspaceId
      ? await db.agentConfig.findUnique({
          where: { workspaceId: params.workspaceId },
          select: {
            id: true,
            workspaceId: true,
            agentName: true,
            greetingMessage: true,
            systemPrompt: true,
            qualificationChecklist: true,
            disallowedClaims: true,
            ttsVoice: true,
            voiceModel: true,
            workspace: {
              select: {
                name: true,
              },
            },
          },
        })
      : null;

  if (!agentConfig) {
    return null;
  }

  const [rawPreferences, businessProfile, bridgeLeadContext] = await Promise.all([
    db.agentCallPreferences.findUnique({ where: { workspaceId: agentConfig.workspaceId } }).catch(() => null),
    db.businessProfile
      .findUnique({
        where: { workspaceId: agentConfig.workspaceId },
        select: { valueProp: true },
      })
      .catch(() => null),
    loadBridgeLeadContext({
      leadId: params.leadId ?? null,
      workspaceId: agentConfig.workspaceId,
    }),
  ]);

  const basePreferences = deserializePreferences(rawPreferences);
  const preferences =
    bridgeLeadContext?.mappedObjective
      ? {
          ...basePreferences,
          primaryObjective: bridgeLeadContext.mappedObjective,
        }
      : basePreferences;
  const playbook = buildCallObjectivePlaybook({
    agentName: agentConfig.agentName,
    valueProp: businessProfile?.valueProp ?? "",
    preferences,
  });

  return {
    agentConfig,
    preferences,
    playbook,
    valueProp: businessProfile?.valueProp ?? "",
    bridgeLeadContext,
  };
}

function buildOutboundGatherTwiml(params: {
  opening: string;
  actionUrl: string;
  promptAudioUrl?: string;
  language: "en" | "es";
}) {
  const voice = new twiml.VoiceResponse();
  const gather = voice.gather({
    input: ["speech"],
    action: params.actionUrl,
    method: "POST",
    language: params.language === "es" ? "es-ES" : "en-US",
    speechTimeout: "auto",
    timeout: 2,
  });

  if (params.promptAudioUrl) {
    gather.play(params.promptAudioUrl);
  } else {
    gather.say({ voice: params.language === "es" ? "Polly.Conchita" : "Polly.Joanna" }, params.opening);
  }

  voice.redirect({ method: "POST" }, `${params.actionUrl}&noinput=1`);
  return voice.toString();
}

export async function handleTwilioOutboundTwiml(request: Request) {
  const url = new URL(request.url);
  const params = await request
    .formData()
    .then((formData) =>
      Object.fromEntries(Array.from(formData.entries()).map(([key, value]) => [key, String(value)])),
    )
    .catch(() => ({} as Record<string, string>));

  if (env.TWILIO_AUTH_TOKEN && !verifyTwilioSignature(request, params)) {
    return new Response("Invalid signature", { status: 403 });
  }

  const agentId = url.searchParams.get("agentId") ?? params.agentId ?? null;
  const leadId = url.searchParams.get("leadId") ?? params.leadId ?? null;
  const workspaceId = url.searchParams.get("workspaceId") ?? params.workspaceId ?? null;
  const callSid = params.CallSid ?? "";
  const fromNumber = params.From ?? "";
  const toNumber = params.To ?? "";

  const runtime = await resolveRuntimeConfig({ agentId, workspaceId, leadId });
  if (!runtime) {
    return xmlResponse(
      "<?xml version=\"1.0\" encoding=\"UTF-8\"?><Response><Say>No AI agent is configured for this outbound call.</Say><Hangup/></Response>",
    );
  }

  const baseOpening =
    runtime.agentConfig.greetingMessage?.trim() ||
    runtime.playbook.opening ||
    buildDefaultOpening({
      language: runtime.preferences.language,
      agentName: runtime.agentConfig.agentName,
      businessName: runtime.agentConfig.workspace.name ?? "your team",
    });

  const resolvedOpening = runtime.bridgeLeadContext?.clientName
    ? `${baseOpening} ${
        runtime.preferences.language === "es"
          ? `Hablo con ${runtime.bridgeLeadContext.clientName}?`
          : `May I speak with ${runtime.bridgeLeadContext.clientName}?`
      }`
    : baseOpening;

  if (!callSid || !fromNumber || !toNumber) {
    return xmlResponse(
      "<?xml version=\"1.0\" encoding=\"UTF-8\"?><Response><Say>Connecting your AI caller now.</Say><Hangup/></Response>",
    );
  }

  const outboundCall = await createInboundCall({
    workspaceId: runtime.agentConfig.workspaceId,
    twilioCallSid: callSid,
    fromNumber: toNumber,
    toNumber: fromNumber,
  });

  const coldCallPrompt = buildColdCallSystemPrompt({
    systemPrompt: runtime.agentConfig.systemPrompt,
    playbook: runtime.playbook,
    checklist: asStringArray(runtime.agentConfig.qualificationChecklist),
    disallowedClaims: asStringArray(runtime.agentConfig.disallowedClaims),
    leadContext: runtime.bridgeLeadContext,
  });

  await appendTranscriptTurn({
    workspaceId: runtime.agentConfig.workspaceId,
    callId: outboundCall.call.id,
    speaker: "system",
    text: outboundCall.isNew ? "Outbound cold call playbook loaded" : "Outbound cold call resumed",
    metadata: {
      provider: "twilio",
      direction: "outbound",
      callSid,
      opening: resolvedOpening,
      leadId: runtime.bridgeLeadContext?.id,
      bridgeObjective: runtime.bridgeLeadContext?.objective,
      objective: runtime.preferences.primaryObjective,
      secondaryObjectives: runtime.preferences.secondaryObjectives,
      leadFieldsRequired: runtime.preferences.leadFieldsRequired,
      qualificationChecklist: asStringArray(runtime.agentConfig.qualificationChecklist),
      disallowedClaims: asStringArray(runtime.agentConfig.disallowedClaims),
      callPlaybook: runtime.playbook,
      compiledSystemPrompt: coldCallPrompt,
    },
  });

  const processUrl = `${getBaseUrl()}/api/twilio/voice/process?workspaceId=${runtime.agentConfig.workspaceId}&callId=${outboundCall.call.id}`;
  const promptAudioUrl = env.OPENAI_API_KEY
    ? `${getBaseUrl()}/api/voice/tts?token=${encodeURIComponent(
        signTtsPayload({
          text: resolvedOpening,
          workspaceId: runtime.agentConfig.workspaceId,
          voice: runtime.agentConfig.ttsVoice ?? "alloy",
          model: runtime.agentConfig.voiceModel ?? env.OPENAI_TTS_MODEL,
        }),
      )}`
    : undefined;

  const xml = buildOutboundGatherTwiml({
    opening: resolvedOpening,
    actionUrl: processUrl,
    promptAudioUrl,
    language: runtime.preferences.language,
  });

  return xmlResponse(xml);
}
