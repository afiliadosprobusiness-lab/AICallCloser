import { env } from "@/lib/env";
import { logger } from "@/lib/logger";
import { signTtsPayload } from "@/lib/voice/token";
import { verifyTwilioSignature, xmlResponse } from "@/lib/twilio/security";
import { buildPromptAndRecordTwiml } from "@/lib/twilio/twiml";
import { getWorkspaceSummary, resolveWorkspaceByTwilioNumber } from "@/lib/workspace";
import { appendTranscriptTurn, createInboundCall } from "@/modules/calls/service";

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const params = Object.fromEntries(
      Array.from(formData.entries()).map(([key, value]) => [key, String(value)]),
    );

    if (env.TWILIO_AUTH_TOKEN && !verifyTwilioSignature(request, params)) {
      return new Response("Invalid signature", { status: 403 });
    }

    const callSid = params.CallSid;
    const from = params.From;
    const to = params.To;

    if (!callSid || !from || !to) {
      return new Response("Missing Twilio parameters", { status: 400 });
    }

    const workspacePhone = await resolveWorkspaceByTwilioNumber(to);

    if (!workspacePhone) {
      return xmlResponse(
        "<?xml version=\"1.0\" encoding=\"UTF-8\"?><Response><Say>No hay agente configurado para este numero.</Say><Hangup/></Response>",
      );
    }

    const call = await createInboundCall({
      workspaceId: workspacePhone.workspaceId,
      twilioCallSid: callSid,
      fromNumber: from,
      toNumber: to,
    });

    const workspace = await getWorkspaceSummary(workspacePhone.workspaceId);

    const greeting =
      workspace?.agentConfig?.greetingMessage ??
      "Hola, soy el asistente virtual del equipo. Voy a ayudarte a calificar y agendar en menos de un minuto.";

    await appendTranscriptTurn({
      workspaceId: workspacePhone.workspaceId,
      callId: call.id,
      speaker: "system",
      text: "Inbound call started",
      metadata: {
        callSid,
        from,
        to,
      },
    });

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

    const actionUrl = `${env.APP_URL}/api/twilio/voice/process?workspaceId=${workspacePhone.workspaceId}&callId=${call.id}`;

    const xml = buildPromptAndRecordTwiml({
      promptAudioUrl,
      promptText: greeting,
      actionUrl,
      maxLengthSeconds: 25,
    });

    return xmlResponse(xml);
  } catch (error) {
    logger.error({ error }, "Twilio inbound failed");

    return xmlResponse(
      "<?xml version=\"1.0\" encoding=\"UTF-8\"?><Response><Say>Ocurrio un error al conectar el agente.</Say><Hangup/></Response>",
    );
  }
}
