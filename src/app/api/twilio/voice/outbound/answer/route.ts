import { env } from "@/lib/env";
import { signTtsPayload } from "@/lib/voice/token";
import { buildPromptAndRecordVoiceXml } from "@/lib/voice/xml";
import { xmlResponse } from "@/lib/voice/webhook-response";
import { getWorkspaceSummary } from "@/lib/workspace";
import { appendTranscriptTurn, createInboundCall } from "@/modules/calls/service";

export async function POST(request: Request) {
  const url = new URL(request.url);
  const workspaceId = url.searchParams.get("workspaceId");
  const fallbackPrompt =
    url.searchParams.get("message") ??
    "Hello, this is AI Call Closer virtual assistant. I will ask a few quick questions to qualify your interest and schedule your call.";
  const formData = await request.formData();
  const callSid = String(formData.get("CallSid") ?? "");
  const fromNumber = String(formData.get("From") ?? "");
  const toNumber = String(formData.get("To") ?? "");

  if (!workspaceId || !callSid || !fromNumber || !toNumber) {
    return xmlResponse(
      "<?xml version=\"1.0\" encoding=\"UTF-8\"?><Response><Say>Unable to start outbound AI flow.</Say><Hangup/></Response>",
    );
  }

  const workspace = await getWorkspaceSummary(workspaceId);
  const greeting = workspace?.agentConfig?.greetingMessage ?? fallbackPrompt;

  // Outbound: lead phone is Twilio "To", while Twilio "From" is our purchased number.
  const call = await createInboundCall({
    workspaceId,
    twilioCallSid: callSid,
    fromNumber: toNumber,
    toNumber: fromNumber,
  });

  if (call.isNew) {
    await appendTranscriptTurn({
      workspaceId,
      callId: call.call.id,
      speaker: "system",
      text: "Outbound call started",
      metadata: {
        provider: "twilio",
        direction: "outbound",
        callSid,
        from: fromNumber,
        to: toNumber,
      },
    });
  }

  const processUrl = `${env.APP_URL}/api/twilio/voice/process?workspaceId=${workspaceId}&callId=${call.call.id}`;

  let promptAudioUrl: string | undefined;

  if (env.OPENAI_API_KEY) {
    const token = signTtsPayload({
      text: greeting,
      workspaceId,
      voice: workspace?.agentConfig?.ttsVoice ?? "alloy",
      model: workspace?.agentConfig?.voiceModel ?? env.OPENAI_TTS_MODEL,
    });

    promptAudioUrl = `${env.APP_URL}/api/voice/tts?token=${encodeURIComponent(token)}`;
  }

  const xml = buildPromptAndRecordVoiceXml("twilio", {
    promptAudioUrl,
    promptText: greeting,
    actionUrl: processUrl,
    maxLengthSeconds: 25,
  });

  return xmlResponse(xml);
}
