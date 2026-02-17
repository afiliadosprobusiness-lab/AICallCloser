import { CallStatus } from "@prisma/client";

import { env } from "@/lib/env";
import { logger } from "@/lib/logger";
import { generateAssistantDecision } from "@/lib/ai/orchestrator";
import { signTtsPayload } from "@/lib/voice/token";
import { transcribeTwilioRecording } from "@/lib/voice/stt";
import { verifyTwilioSignature, xmlResponse } from "@/lib/twilio/security";
import {
  buildGoodbyeTwiml,
  buildHandoffTwiml,
  buildPromptAndRecordTwiml,
} from "@/lib/twilio/twiml";
import { getWorkspaceSummary } from "@/lib/workspace";
import {
  appendTranscriptTurn,
  applyDecisionToCall,
  completeCall,
  getCallContext,
} from "@/modules/calls/service";

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

export async function POST(request: Request) {
  try {
    const url = new URL(request.url);
    const workspaceId = url.searchParams.get("workspaceId");
    const callId = url.searchParams.get("callId");
    const noInput = url.searchParams.get("noinput") === "1";

    if (!workspaceId || !callId) {
      return new Response("Missing query params", { status: 400 });
    }

    const formData = await request.formData();
    const params = Object.fromEntries(
      Array.from(formData.entries()).map(([key, value]) => [key, String(value)]),
    );

    if (env.TWILIO_AUTH_TOKEN && !verifyTwilioSignature(request, params)) {
      return new Response("Invalid signature", { status: 403 });
    }

    const workspace = await getWorkspaceSummary(workspaceId);

    if (!workspace?.agentConfig) {
      return xmlResponse(
        "<?xml version=\"1.0\" encoding=\"UTF-8\"?><Response><Say>No hay configuracion de agente disponible.</Say><Hangup/></Response>",
      );
    }

    const call = await getCallContext({ workspaceId, callId });

    if (!call) {
      return xmlResponse(
        "<?xml version=\"1.0\" encoding=\"UTF-8\"?><Response><Say>No se encontro la llamada activa.</Say><Hangup/></Response>",
      );
    }

    let leadText = "";

    if (noInput) {
      leadText = "[NO_INPUT]";
    } else {
      const recordingUrl = params.RecordingUrl;
      if (recordingUrl) {
        leadText = await transcribeTwilioRecording(recordingUrl);
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
        recordingUrl: params.RecordingUrl,
        callSid: params.CallSid,
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
      await completeCall({
        workspaceId,
        callSid: params.CallSid,
        status: CallStatus.completed,
      });

      const handoffAudioUrl = buildAudioUrl({
        text: decision.assistantReply,
        workspaceId,
        voice: ttsVoice,
        model: voiceModel,
      });

      const xml = buildHandoffTwiml({
        handoffAudioUrl,
        handoffText: decision.assistantReply,
        targetPhone: workspace.agentConfig.handoffPhone ?? env.HUMAN_HANDOFF_PHONE ?? "",
      });

      return xmlResponse(xml);
    }

    const shouldClose = decision.action === "close" || decision.action === "schedule";

    if (shouldClose) {
      await completeCall({
        workspaceId,
        callSid: params.CallSid,
        status: CallStatus.completed,
      });

      const finalAudioUrl = buildAudioUrl({
        text: decision.assistantReply,
        workspaceId,
        voice: ttsVoice,
        model: voiceModel,
      });

      const xml = buildGoodbyeTwiml({
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

    const actionUrl = `${env.APP_URL}/api/twilio/voice/process?workspaceId=${workspaceId}&callId=${callId}`;

    const xml = buildPromptAndRecordTwiml({
      promptAudioUrl: continueAudioUrl,
      promptText: decision.assistantReply,
      actionUrl,
      maxLengthSeconds: 25,
    });

    return xmlResponse(xml);
  } catch (error) {
    logger.error({ error }, "Twilio process failed");

    return xmlResponse(
      "<?xml version=\"1.0\" encoding=\"UTF-8\"?><Response><Say>Ocurrio un error procesando la llamada.</Say><Hangup/></Response>",
    );
  }
}
