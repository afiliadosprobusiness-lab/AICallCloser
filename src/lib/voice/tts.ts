import { env } from "@/lib/env";
import { getOpenAIClient } from "@/lib/ai/client";

export async function synthesizeSpeech(params: {
  text: string;
  model?: string;
  voice?: string;
}) {
  const openai = getOpenAIClient();

  if (!openai) {
    return null;
  }

  const response = await openai.audio.speech.create({
    model: params.model ?? env.OPENAI_TTS_MODEL,
    voice: (params.voice ?? "alloy") as "alloy",
    input: params.text,
    response_format: "mp3",
  });

  return Buffer.from(await response.arrayBuffer());
}
