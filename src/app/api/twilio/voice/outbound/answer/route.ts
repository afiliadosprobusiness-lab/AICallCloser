import { handleTwilioOutboundTwiml } from "@/modules/twilio/outbound";

export async function POST(request: Request) {
  return handleTwilioOutboundTwiml(request);
}
