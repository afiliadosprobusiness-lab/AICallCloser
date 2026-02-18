import { CallStatus } from "@prisma/client";

import { env } from "@/lib/env";
import { logger } from "@/lib/logger";
import { verifyPlivoSignature } from "@/lib/plivo/security";
import { generateAssistantDecision } from "@/lib/ai/orchestrator";
import { verifyTwilioSignature } from "@/lib/twilio/security";
import { signTtsPayload } from "@/lib/voice/token";
import { transcribeVoiceRecording } from "@/lib/voice/stt";
import { xmlResponse } from "@/lib/voice/webhook-response";
import {
  getCallDurationSeconds,
  getCallIdentifier,
  getFromNumber,
  getProviderCallStatus,
  getRecordingUrl,
  getToNumber,
  mapProviderStatusToCallStatus,
  type VoiceProvider,
} from "@/lib/voice/provider";
import { buildGoodbyeVoiceXml, buildHandoffVoiceXml, buildPromptAndRecordVoiceXml } from "@/lib/voice/xml";
import { getWorkspaceSummary, resolveWorkspaceByTwilioNumber } from "@/lib/workspace";
import {
  appendTranscriptTurn,
  applyDecisionToCall,
  completeCall,
  getCallByProviderSid,
  createInboundCall,
  getCallContext,
} from "@/modules/calls/service";

function shouldValidateSignature(provider: VoiceProvider) {
  if (provider === "plivo") {
    return Boolean(env.PLIVO_AUTH_TOKEN);
  }

  if (provider === "telnyx") {
    return false;
  }

  return Boolean(env.TWILIO_AUTH_TOKEN);
}

function validateSignature(provider: VoiceProvider, request: Request, params: Record<string, string>) {
  if (provider === "plivo") {
    return verifyPlivoSignature(request, params);
  }

  if (provider === "telnyx") {
    return true;
  }

  return verifyTwilioSignature(request, params);
}

function normalizeJsonValue(value: unknown): string {
  if (typeof value === "string") {
    return value;
  }

  if (typeof value === "number" || typeof value === "boolean") {
    return String(value);
  }

  return "";
}

function getWebhookParamsFromTelnyxPayload(payload: Record<string, unknown>) {
  const fromObject = (payload.from ?? payload.from_number) as Record<string, unknown> | undefined;
  const toObject = (payload.to ?? payload.to_number) as Record<string, unknown> | undefined;
  const recordingUrls = Array.isArray(payload.recording_urls)
    ? (payload.recording_urls as unknown[])
    : [];

  const params: Record<string, string> = {
    call_control_id: normalizeJsonValue(payload.call_control_id),
    call_session_id: normalizeJsonValue(payload.call_session_id),
    call_leg_id: normalizeJsonValue(payload.call_leg_id),
    call_status: normalizeJsonValue(payload.call_status),
    event_type: normalizeJsonValue(payload.event_type),
    from:
      normalizeJsonValue(fromObject?.phone_number) ||
      normalizeJsonValue(payload.from) ||
      normalizeJsonValue(payload.caller_id_number),
    to:
      normalizeJsonValue(toObject?.phone_number) ||
      normalizeJsonValue(payload.to) ||
      normalizeJsonValue(payload.destination) ||
      normalizeJsonValue(payload.to_number),
    recording_url:
      normalizeJsonValue(payload.recording_url) ||
      normalizeJsonValue(payload.recording_urls_0) ||
      normalizeJsonValue(recordingUrls[0]),
    duration_secs:
      normalizeJsonValue(payload.duration_secs) ||
      normalizeJsonValue(payload.duration) ||
      normalizeJsonValue(payload.bill_duration),
  };

  return Object.fromEntries(
    Object.entries(params).filter(([, value]) => Boolean(value)),
  );
}

async function getWebhookParams(request: Request) {
  const contentType = request.headers.get("content-type") ?? "";

  if (contentType.includes("application/json")) {
    const json = (await request.json().catch(() => ({}))) as Record<string, unknown>;
    const data = (json.data ?? {}) as Record<string, unknown>;
    const payload = (data.payload ?? json.payload ?? {}) as Record<string, unknown>;

    return {
      ...Object.fromEntries(
        Object.entries(json).map(([key, value]) => [key, normalizeJsonValue(value)]),
      ),
      ...Object.fromEntries(
        Object.entries(data).map(([key, value]) => [key, normalizeJsonValue(value)]),
      ),
      ...getWebhookParamsFromTelnyxPayload(payload),
    };
  }

  const formData = await request.formData();
  return Object.fromEntries(
    Array.from(formData.entries()).map(([key, value]) => [key, String(value)]),
  );
}

function buildAudioUrl(params: {
  text: string;
  workspaceId: string;
  voice: string;
  model: string;
}) {
  if (!env.OPENAI_API_KEY) {
    return undefined;
  }

  const token = signTtsPayload(params);
  return `${env.APP_URL}/api/voice/tts?token=${encodeURIComponent(token)}`;
}

function processPath(provider: VoiceProvider) {
  if (provider === "plivo") {
    return "/api/plivo/voice/process";
  }

  if (provider === "telnyx") {
    return "/api/telnyx/voice/process";
  }

  return "/api/twilio/voice/process";
}

export async function handleInboundVoiceWebhook(provider: VoiceProvider, request: Request) {
  try {
    const params = await getWebhookParams(request);

    if (shouldValidateSignature(provider) && !validateSignature(provider, request, params)) {
      return new Response("Invalid signature", { status: 403 });
    }

    const callSid = getCallIdentifier(params);
    const from = getFromNumber(params);
    const to = getToNumber(params);

    if (!callSid || !from || !to) {
      return new Response("Missing voice provider parameters", { status: 400 });
    }

    const workspacePhone = await resolveWorkspaceByTwilioNumber(to);

    if (!workspacePhone) {
      return xmlResponse(
        "<?xml version=\"1.0\" encoding=\"UTF-8\"?><Response><Speak>No hay agente configurado para este numero.</Speak><Hangup/></Response>",
      );
    }

    const inbound = await createInboundCall({
      workspaceId: workspacePhone.workspaceId,
      twilioCallSid: callSid,
      fromNumber: from,
      toNumber: to,
    });
    const call = inbound.call;

    const workspace = await getWorkspaceSummary(workspacePhone.workspaceId);

    const greeting =
      workspace?.agentConfig?.greetingMessage ??
      "Hola, soy el asistente virtual del equipo. Voy a ayudarte a calificar y agendar en menos de un minuto.";

    if (inbound.isNew) {
      await appendTranscriptTurn({
        workspaceId: workspacePhone.workspaceId,
        callId: call.id,
        speaker: "system",
        text: "Inbound call started",
        metadata: {
          provider,
          callSid,
          from,
          to,
        },
      });
    }

    let promptAudioUrl: string | undefined;

    if (env.OPENAI_API_KEY) {
      const token = signTtsPayload({
        text: greeting,
        workspaceId: workspacePhone.workspaceId,
        voice: workspace?.agentConfig?.ttsVoice ?? "alloy",
        model: workspace?.agentConfig?.voiceModel ?? env.OPENAI_TTS_MODEL,
      });

      promptAudioUrl = `${env.APP_URL}/api/voice/tts?token=${encodeURIComponent(token)}`;
    }

    const actionUrl = `${env.APP_URL}${processPath(provider)}?workspaceId=${workspacePhone.workspaceId}&callId=${call.id}`;

    const xml = buildPromptAndRecordVoiceXml(provider, {
      promptAudioUrl,
      promptText: greeting,
      actionUrl,
      maxLengthSeconds: 25,
    });

    return xmlResponse(xml);
  } catch (error) {
    logger.error({ error, provider }, "Voice inbound failed");

    return xmlResponse(
      "<?xml version=\"1.0\" encoding=\"UTF-8\"?><Response><Speak>Ocurrio un error al conectar el agente.</Speak><Hangup/></Response>",
    );
  }
}

export async function handleProcessVoiceWebhook(provider: VoiceProvider, request: Request) {
  try {
    const url = new URL(request.url);
    const workspaceId = url.searchParams.get("workspaceId");
    const callId = url.searchParams.get("callId");
    const noInput = url.searchParams.get("noinput") === "1";

    if (!workspaceId || !callId) {
      return new Response("Missing query params", { status: 400 });
    }

    const params = await getWebhookParams(request);

    if (shouldValidateSignature(provider) && !validateSignature(provider, request, params)) {
      return new Response("Invalid signature", { status: 403 });
    }

    const workspace = await getWorkspaceSummary(workspaceId);

    if (!workspace?.agentConfig) {
      return xmlResponse(
        "<?xml version=\"1.0\" encoding=\"UTF-8\"?><Response><Speak>No hay configuracion de agente disponible.</Speak><Hangup/></Response>",
      );
    }

    const call = await getCallContext({ workspaceId, callId });

    if (!call) {
      return xmlResponse(
        "<?xml version=\"1.0\" encoding=\"UTF-8\"?><Response><Speak>No se encontro la llamada activa.</Speak><Hangup/></Response>",
      );
    }

    const providerCallId = getCallIdentifier(params);
    let leadText = "";

    if (noInput) {
      leadText = "[NO_INPUT]";
    } else {
      const recordingUrl = getRecordingUrl(params);
      if (recordingUrl) {
        leadText = await transcribeVoiceRecording(recordingUrl, provider);
      }
    }

    if (!leadText) {
      leadText = "No escuche respuesta clara";
    }

    await appendTranscriptTurn({
      workspaceId,
      callId,
      speaker: "user",
      text: leadText,
      metadata: {
        provider,
        recordingUrl: getRecordingUrl(params),
        callSid: providerCallId,
      },
    });

    const decision = await generateAssistantDecision({
      userText: leadText,
      transcript: call.transcripts.map((turn) => ({
        speaker: turn.speaker,
        text: turn.text,
      })),
      config: {
        systemPrompt: workspace.agentConfig.systemPrompt,
        qualificationChecklist: workspace.agentConfig.qualificationChecklist,
        disallowedClaims: workspace.agentConfig.disallowedClaims,
        pricingRules: workspace.agentConfig.pricingRules,
        handoffEnabled: workspace.agentConfig.handoffEnabled,
        llmModel: workspace.agentConfig.llmModel,
      },
    });

    await appendTranscriptTurn({
      workspaceId,
      callId,
      speaker: "assistant",
      text: decision.assistantReply,
      metadata: {
        action: decision.action,
        confidence: decision.confidence,
      },
    });

    await applyDecisionToCall({
      workspaceId,
      callId,
      decision,
      handoffPhone: workspace.agentConfig.handoffPhone,
    });

    const voiceModel = workspace.agentConfig.voiceModel;
    const ttsVoice = workspace.agentConfig.ttsVoice;

    if (decision.action === "handoff" && workspace.agentConfig.handoffEnabled) {
      if (providerCallId) {
        await completeCall({
          workspaceId,
          callSid: providerCallId,
          status: CallStatus.completed,
        });
      }

      const handoffAudioUrl = buildAudioUrl({
        text: decision.assistantReply,
        workspaceId,
        voice: ttsVoice,
        model: voiceModel,
      });

      const xml = buildHandoffVoiceXml(provider, {
        handoffAudioUrl,
        handoffText: decision.assistantReply,
        targetPhone: workspace.agentConfig.handoffPhone ?? env.HUMAN_HANDOFF_PHONE ?? "",
      });

      return xmlResponse(xml);
    }

    const shouldClose = decision.action === "close" || decision.action === "schedule";

    if (shouldClose) {
      if (providerCallId) {
        await completeCall({
          workspaceId,
          callSid: providerCallId,
          status: CallStatus.completed,
        });
      }

      const finalAudioUrl = buildAudioUrl({
        text: decision.assistantReply,
        workspaceId,
        voice: ttsVoice,
        model: voiceModel,
      });

      const xml = buildGoodbyeVoiceXml(provider, {
        finalAudioUrl,
        finalText: decision.assistantReply,
      });

      return xmlResponse(xml);
    }

    const continueAudioUrl = buildAudioUrl({
      text: decision.assistantReply,
      workspaceId,
      voice: ttsVoice,
      model: voiceModel,
    });

    const actionUrl = `${env.APP_URL}${processPath(provider)}?workspaceId=${workspaceId}&callId=${callId}`;

    const xml = buildPromptAndRecordVoiceXml(provider, {
      promptAudioUrl: continueAudioUrl,
      promptText: decision.assistantReply,
      actionUrl,
      maxLengthSeconds: 25,
    });

    return xmlResponse(xml);
  } catch (error) {
    logger.error({ error, provider }, "Voice process failed");

    return xmlResponse(
      "<?xml version=\"1.0\" encoding=\"UTF-8\"?><Response><Speak>Ocurrio un error procesando la llamada.</Speak><Hangup/></Response>",
    );
  }
}

export async function handleStatusVoiceWebhook(provider: VoiceProvider, request: Request) {
  try {
    const params = await getWebhookParams(request);

    if (shouldValidateSignature(provider) && !validateSignature(provider, request, params)) {
      return new Response("Invalid signature", { status: 403 });
    }

    const callSid = getCallIdentifier(params);
    const callStatus = getProviderCallStatus(params);

    if (!callSid || !callStatus) {
      return new Response("Missing params", { status: 400 });
    }

    const toNumber = getToNumber(params);
    let workspaceId: string | null = null;

    if (toNumber) {
      const workspacePhone = await resolveWorkspaceByTwilioNumber(toNumber);
      workspaceId = workspacePhone?.workspaceId ?? null;
    }

    if (!workspaceId) {
      const call = await getCallByProviderSid(callSid);
      workspaceId = call?.workspaceId ?? null;
    }

    if (!workspaceId) {
      return new Response("ok", { status: 200 });
    }

    const status = mapProviderStatusToCallStatus(provider, callStatus);

    await completeCall({
      workspaceId,
      callSid,
      status,
      durationSeconds: getCallDurationSeconds(params),
    });

    return new Response("ok", { status: 200 });
  } catch (error) {
    logger.error({ error, provider }, "Voice status callback failed");
    return new Response("error", { status: 500 });
  }
}
