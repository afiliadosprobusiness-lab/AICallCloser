import { env } from "@/lib/env";
import { logger } from "@/lib/logger";
import { getOpenAIClient } from "@/lib/ai/client";

export async function transcribeTwilioRecording(recordingUrl: string) {
  const openai = getOpenAIClient();

  if (!openai || !env.TWILIO_ACCOUNT_SID || !env.TWILIO_AUTH_TOKEN) {
    return "";
  }

  const audioUrl = recordingUrl.endsWith(".wav") ? recordingUrl : `${recordingUrl}.wav`;

  const auth = Buffer.from(`${env.TWILIO_ACCOUNT_SID}:${env.TWILIO_AUTH_TOKEN}`).toString("base64");

  const response = await fetch(audioUrl, {
    headers: {
      Authorization: `Basic ${auth}`,
    },
  });

  if (!response.ok) {
    logger.error({ status: response.status }, "Unable to download Twilio recording");
    return "";
  }

  const buffer = Buffer.from(await response.arrayBuffer());
  const file = new File([buffer], "call.wav", { type: "audio/wav" });

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
