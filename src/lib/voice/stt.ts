import { env } from "@/lib/env";
import { logger } from "@/lib/logger";
import { getOpenAIClient } from "@/lib/ai/client";
import { type VoiceProvider, getVoiceProvider } from "@/lib/voice/provider";

function getRecordingRequestHeaders(provider: VoiceProvider) {

  if (provider === "plivo" && env.PLIVO_AUTH_ID && env.PLIVO_AUTH_TOKEN) {
    const auth = Buffer.from(`${env.PLIVO_AUTH_ID}:${env.PLIVO_AUTH_TOKEN}`).toString("base64");
    return { Authorization: `Basic ${auth}` } satisfies Record<string, string>;
  }

  if (provider === "twilio" && env.TWILIO_ACCOUNT_SID && env.TWILIO_AUTH_TOKEN) {
    const auth = Buffer.from(`${env.TWILIO_ACCOUNT_SID}:${env.TWILIO_AUTH_TOKEN}`).toString("base64");
    return { Authorization: `Basic ${auth}` } satisfies Record<string, string>;
  }

  if (provider === "telnyx" && env.TELNYX_API_KEY) {
    return { Authorization: `Bearer ${env.TELNYX_API_KEY}` } satisfies Record<string, string>;
  }

  return {} as Record<string, string>;
}

function normalizeRecordingUrl(recordingUrl: string, provider: VoiceProvider) {

  if (provider === "twilio") {
    return recordingUrl.endsWith(".wav") ? recordingUrl : `${recordingUrl}.wav`;
  }

  return recordingUrl;
}

export async function transcribeVoiceRecording(
  recordingUrl: string,
  provider: VoiceProvider = getVoiceProvider(),
) {
  const openai = getOpenAIClient();

  if (!openai) {
    return "";
  }

  const audioUrl = normalizeRecordingUrl(recordingUrl, provider);

  const response = await fetch(audioUrl, {
    headers: getRecordingRequestHeaders(provider),
  });

  if (!response.ok) {
    logger.error({ status: response.status, audioUrl }, "Unable to download provider recording");
    return "";
  }

  const contentType = response.headers.get("content-type") ?? "audio/wav";
  const extension = contentType.includes("mpeg") ? "mp3" : "wav";
  const buffer = Buffer.from(await response.arrayBuffer());
  const file = new File([buffer], `call.${extension}`, { type: contentType });

  const result = await openai.audio.transcriptions.create({
    file,
    model: env.OPENAI_STT_MODEL,
    response_format: "json",
  });

  if (typeof result === "string") {
    return result;
  }

  return result.text ?? "";
}

export async function transcribeTwilioRecording(recordingUrl: string) {
  return transcribeVoiceRecording(recordingUrl, "twilio");
}
