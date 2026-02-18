import { handleStatusVoiceWebhook } from "@/modules/voice-webhooks/handlers";

export async function POST(request: Request) {
  return handleStatusVoiceWebhook("telnyx", request);
}
