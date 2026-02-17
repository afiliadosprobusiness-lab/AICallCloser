import twilio from "twilio";

import { env } from "@/lib/env";

function getRequestUrl(request: Request) {
  if (env.TWILIO_WEBHOOK_BASE_URL) {
    return `${env.TWILIO_WEBHOOK_BASE_URL}${new URL(request.url).pathname}${new URL(request.url).search}`;
  }

  const url = new URL(request.url);
  const host = request.headers.get("x-forwarded-host") ?? request.headers.get("host") ?? url.host;
  const proto = request.headers.get("x-forwarded-proto") ?? url.protocol.replace(":", "");

  return `${proto}://${host}${url.pathname}${url.search}`;
}

export function verifyTwilioSignature(request: Request, params: Record<string, string>) {
  if (!env.TWILIO_AUTH_TOKEN) {
    return false;
  }

  const signature = request.headers.get("x-twilio-signature");

  if (!signature) {
    return false;
  }

  const url = getRequestUrl(request);

  return twilio.validateRequest(env.TWILIO_AUTH_TOKEN, signature, url, params);
}

export function xmlResponse(xml: string) {
  return new Response(xml, {
    status: 200,
    headers: {
      "Content-Type": "text/xml",
      "Cache-Control": "no-store",
    },
  });
}
