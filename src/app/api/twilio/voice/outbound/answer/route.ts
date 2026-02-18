import { buildGoodbyeVoiceXml } from "@/lib/voice/xml";
import { xmlResponse } from "@/lib/voice/webhook-response";

export async function POST(request: Request) {
  const url = new URL(request.url);
  const message =
    url.searchParams.get("message") ??
    "Hello, this is an automated AI Call Closer call to coordinate your appointment.";

  const xml = buildGoodbyeVoiceXml("twilio", {
    finalText: message,
  });

  return xmlResponse(xml);
}
