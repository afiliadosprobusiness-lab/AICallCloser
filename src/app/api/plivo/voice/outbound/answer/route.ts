import { buildGoodbyeVoiceXml } from "@/lib/voice/xml";
import { xmlResponse } from "@/lib/voice/webhook-response";

export async function POST(request: Request) {
  const url = new URL(request.url);
  const message =
    url.searchParams.get("message") ??
    "Hola, este es un contacto automatico de AI Call Closer para coordinar tu llamada.";

  const xml = buildGoodbyeVoiceXml("plivo", {
    finalText: message,
  });

  return xmlResponse(xml);
}
