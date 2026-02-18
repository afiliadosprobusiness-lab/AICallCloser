import { createHmac, timingSafeEqual } from "node:crypto";

import { requireEnvVar } from "@/lib/env";

function base64url(input: Buffer | string) {
  return Buffer.from(input)
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

function unbase64url(input: string) {
  const normalized = input.replace(/-/g, "+").replace(/_/g, "/");
  const padding = normalized.length % 4 === 0 ? "" : "=".repeat(4 - (normalized.length % 4));
  return Buffer.from(normalized + padding, "base64").toString("utf8");
}

export function signTtsPayload(payload: { text: string; workspaceId: string; voice: string; model: string }) {
  const nextAuthSecret = requireEnvVar("NEXTAUTH_SECRET");
  const raw = JSON.stringify(payload);
  const encoded = base64url(raw);
  const signature = createHmac("sha256", nextAuthSecret).update(encoded).digest("hex");
  return `${encoded}.${signature}`;
}

export function verifyTtsPayload(token: string) {
  const nextAuthSecret = requireEnvVar("NEXTAUTH_SECRET");
  const [encoded, signature] = token.split(".");

  if (!encoded || !signature) {
    return null;
  }

  const expected = createHmac("sha256", nextAuthSecret).update(encoded).digest("hex");

  const signatureBuffer = Buffer.from(signature);
  const expectedBuffer = Buffer.from(expected);

  if (signatureBuffer.length !== expectedBuffer.length) {
    return null;
  }

  if (!timingSafeEqual(signatureBuffer, expectedBuffer)) {
    return null;
  }

  try {
    const decoded = JSON.parse(unbase64url(encoded)) as {
      text: string;
      workspaceId: string;
      voice: string;
      model: string;
    };

    return decoded;
  } catch {
    return null;
  }
}
