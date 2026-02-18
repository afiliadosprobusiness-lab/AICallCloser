import { z } from "zod";

import { getFirebaseApiKeyForServer } from "@/lib/firebase/config";
import { logger } from "@/lib/logger";

const firebaseLookupSchema = z.object({
  users: z
    .array(
      z.object({
        localId: z.string().min(1),
        email: z.string().email().optional(),
        emailVerified: z.boolean().optional(),
        displayName: z.string().optional(),
        photoUrl: z.string().url().optional(),
      }),
    )
    .default([]),
});

export type FirebaseVerifiedUser = {
  uid: string;
  email: string;
  emailVerified: boolean;
  name: string | null;
  image: string | null;
};

const FIREBASE_VERIFY_TIMEOUT_MS = 8_000;

export async function verifyFirebaseIdToken(idToken: string): Promise<FirebaseVerifiedUser | null> {
  const apiKey = getFirebaseApiKeyForServer();
  if (!apiKey) {
    logger.warn("Firebase API key missing; cannot verify Firebase ID token.");
    return null;
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), FIREBASE_VERIFY_TIMEOUT_MS);

  try {
    const response = await fetch(
      `https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=${encodeURIComponent(apiKey)}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ idToken }),
        signal: controller.signal,
        cache: "no-store",
      },
    );

    if (!response.ok) {
      logger.warn({ status: response.status }, "Firebase token verification failed.");
      return null;
    }

    const raw = (await response.json()) as unknown;
    const parsed = firebaseLookupSchema.safeParse(raw);

    if (!parsed.success || parsed.data.users.length === 0) {
      return null;
    }

    const firebaseUser = parsed.data.users[0];

    if (!firebaseUser.email) {
      return null;
    }

    return {
      uid: firebaseUser.localId,
      email: firebaseUser.email.toLowerCase(),
      emailVerified: Boolean(firebaseUser.emailVerified),
      name: firebaseUser.displayName ?? null,
      image: firebaseUser.photoUrl ?? null,
    };
  } catch (error) {
    logger.error({ error }, "Failed to verify Firebase ID token.");
    return null;
  } finally {
    clearTimeout(timeout);
  }
}
