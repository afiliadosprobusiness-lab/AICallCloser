import { handleProcessVoiceWebhook } from "@/modules/voice-webhooks/handlers";

export async function POST(request: Request) {
  return handleProcessVoiceWebhook("plivo", request);
}
