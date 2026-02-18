import { handleInboundVoiceWebhook } from "@/modules/voice-webhooks/handlers";

export async function POST(request: Request) {
  return handleInboundVoiceWebhook("plivo", request);
}
