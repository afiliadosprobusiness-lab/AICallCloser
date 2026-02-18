import { randomBytes } from "node:crypto";
import { z } from "zod";

import { getFirebaseApiKeyForServer } from "@/lib/firebase/config";
import { logger } from "@/lib/logger";

const FIREBASE_PASSWORD_TIMEOUT_MS = 10_000;

const firebaseErrorSchema = z.object({
  error: z
    .object({
      message: z.string().optional(),
    })
    .optional(),
});

function normalizeFirebaseErrorCode(errorCode: string | undefined) {
  return errorCode?.trim().toUpperCase() ?? "UNKNOWN";
}

async function postIdentityToolkit(path: string, payload: unknown) {
  const apiKey = getFirebaseApiKeyForServer();
  if (!apiKey) {
    return { ok: false as const, errorCode: "API_KEY_MISSING" };
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), FIREBASE_PASSWORD_TIMEOUT_MS);

  try {
    const response = await fetch(
      `https://identitytoolkit.googleapis.com/v1/${path}?key=${encodeURIComponent(apiKey)}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
        cache: "no-store",
        signal: controller.signal,
      },
    );

    const raw = (await response.json().catch(() => null)) as unknown;
    if (response.ok) {
      return { ok: true as const, data: raw };
    }

    const parsedError = firebaseErrorSchema.safeParse(raw);
    const errorCode = normalizeFirebaseErrorCode(parsedError.data?.error?.message);

    return {
      ok: false as const,
      errorCode,
      status: response.status,
    };
  } catch (error) {
    logger.error({ error, path }, "Firebase password request failed.");
    return {
      ok: false as const,
      errorCode: "NETWORK_ERROR",
    };
  } finally {
    clearTimeout(timeout);
  }
}

export async function verifyFirebasePasswordCredential(params: {
  email: string;
  password: string;
}) {
  const response = await postIdentityToolkit("accounts:signInWithPassword", {
    email: params.email.toLowerCase(),
    password: params.password,
    returnSecureToken: true,
  });

  if (response.ok) {
    return { valid: true as const };
  }

  if (
    response.errorCode === "INVALID_LOGIN_CREDENTIALS" ||
    response.errorCode === "INVALID_PASSWORD" ||
    response.errorCode === "EMAIL_NOT_FOUND" ||
    response.errorCode === "USER_DISABLED"
  ) {
    return { valid: false as const, reason: response.errorCode };
  }

  logger.warn({ reason: response.errorCode }, "Unexpected Firebase sign-in response.");
  return { valid: false as const, reason: "UNAVAILABLE" as const };
}

export async function ensureFirebasePasswordUser(params: {
  email: string;
  password?: string;
  displayName?: string | null;
}) {
  const response = await postIdentityToolkit("accounts:signUp", {
    email: params.email.toLowerCase(),
    password: params.password ?? randomBytes(24).toString("hex"),
    displayName: params.displayName ?? undefined,
    returnSecureToken: false,
  });

  if (response.ok || response.errorCode === "EMAIL_EXISTS") {
    return { ready: true as const };
  }

  logger.warn(
    { email: params.email, reason: response.errorCode },
    "Failed to ensure Firebase email/password user.",
  );
  return { ready: false as const, reason: response.errorCode };
}

export async function sendFirebasePasswordResetEmail(email: string) {
  const response = await postIdentityToolkit("accounts:sendOobCode", {
    requestType: "PASSWORD_RESET",
    email: email.toLowerCase(),
  });

  if (response.ok) {
    return { delivered: true as const };
  }

  if (response.errorCode === "EMAIL_NOT_FOUND") {
    return { delivered: false as const, reason: "EMAIL_NOT_FOUND" as const };
  }

  logger.warn({ email, reason: response.errorCode }, "Failed sending Firebase password reset email.");
  return { delivered: false as const, reason: response.errorCode };
}
