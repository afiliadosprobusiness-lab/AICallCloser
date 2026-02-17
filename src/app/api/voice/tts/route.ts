import { logger } from "@/lib/logger";
import { verifyTtsPayload } from "@/lib/voice/token";
import { synthesizeSpeech } from "@/lib/voice/tts";

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const token = url.searchParams.get("token");

    if (!token) {
      return new Response("Missing token", { status: 400 });
    }

    const payload = verifyTtsPayload(token);

    if (!payload) {
      return new Response("Invalid token", { status: 401 });
    }

    const audio = await synthesizeSpeech({
      text: payload.text,
      model: payload.model,
      voice: payload.voice,
    });

    if (!audio) {
      return new Response("TTS not configured", { status: 503 });
    }

    return new Response(audio, {
      status: 200,
      headers: {
        "Content-Type": "audio/mpeg",
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    logger.error({ error }, "TTS generation failed");
    return new Response("TTS generation failed", { status: 500 });
  }
}
