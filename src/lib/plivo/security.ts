import plivo from "plivo";

import { env } from "@/lib/env";

function getRequestUrl(request: Request) {
  const current = new URL(request.url);

  if (env.PLIVO_WEBHOOK_BASE_URL) {
    return `${env.PLIVO_WEBHOOK_BASE_URL}${current.pathname}${current.search}`;
  }

  const host = request.headers.get("x-forwarded-host") ?? request.headers.get("host") ?? current.host;
  const proto = request.headers.get("x-forwarded-proto") ?? current.protocol.replace(":", "");

  return `${proto}://${host}${current.pathname}${current.search}`;
}

export function verifyPlivoSignature(request: Request, params: Record<string, string>) {
  if (!env.PLIVO_AUTH_TOKEN) {
    return false;
  }

  const uri = getRequestUrl(request);
  const method = request.method.toUpperCase();

  const v3Signature = request.headers.get("x-plivo-signature-v3");
  const v3Nonce =
    request.headers.get("x-plivo-signature-v3-nonce") ??
    request.headers.get("x-plivo-signature-v2-nonce") ??
    "";

  if (v3Signature && v3Nonce) {
    return Boolean(
      plivo.validateV3Signature(method, uri, v3Nonce, env.PLIVO_AUTH_TOKEN, v3Signature, params),
    );
  }

  const v2Signature =
    request.headers.get("x-plivo-signature-v2") ??
    request.headers.get("x-plivo-signature") ??
    "";
  const v2Nonce =
    request.headers.get("x-plivo-signature-v2-nonce") ??
    request.headers.get("x-plivo-signature-nonce") ??
    "";

  if (v2Signature && v2Nonce) {
    return Boolean(plivo.validateSignature(uri, v2Nonce, v2Signature, env.PLIVO_AUTH_TOKEN));
  }

  return false;
}
