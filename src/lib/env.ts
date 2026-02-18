import { z } from "zod";

const emptyToUndefined = <T extends z.ZodTypeAny>(schema: T) =>
  z.preprocess((value) => (value === "" ? undefined : value), schema);

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  DATABASE_URL: emptyToUndefined(z.string().min(1).optional()),
  VOICE_PROVIDER: z.enum(["plivo", "twilio"]).default("plivo"),
  NEXTAUTH_URL: emptyToUndefined(z.string().url().optional()),
  NEXTAUTH_SECRET: emptyToUndefined(z.string().min(16).optional()),
  AUTH_TRUST_HOST: emptyToUndefined(z.string().optional()),
  APP_URL: z.string().url().default("http://localhost:3000"),
  FIREBASE_WEB_API_KEY: emptyToUndefined(z.string().optional()),
  NEXT_PUBLIC_FIREBASE_API_KEY: emptyToUndefined(z.string().optional()),
  NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN: emptyToUndefined(z.string().optional()),
  NEXT_PUBLIC_FIREBASE_PROJECT_ID: emptyToUndefined(z.string().optional()),
  NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET: emptyToUndefined(z.string().optional()),
  NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID: emptyToUndefined(z.string().optional()),
  NEXT_PUBLIC_FIREBASE_APP_ID: emptyToUndefined(z.string().optional()),
  RESEND_API_KEY: emptyToUndefined(z.string().optional()),
  RESEND_FROM_EMAIL: emptyToUndefined(z.string().email().optional()),
  ADMIN_EMAILS: emptyToUndefined(z.string().optional()),
  OPENAI_API_KEY: emptyToUndefined(z.string().optional()),
  OPENAI_BASE_URL: emptyToUndefined(z.string().url().optional()),
  OPENAI_MODEL: z.string().default("gpt-4.1-mini"),
  OPENAI_STT_MODEL: z.string().default("gpt-4o-mini-transcribe"),
  OPENAI_TTS_MODEL: z.string().default("gpt-4o-mini-tts"),
  TWILIO_ACCOUNT_SID: emptyToUndefined(z.string().optional()),
  TWILIO_AUTH_TOKEN: emptyToUndefined(z.string().optional()),
  TWILIO_API_KEY: emptyToUndefined(z.string().optional()),
  TWILIO_API_SECRET: emptyToUndefined(z.string().optional()),
  TWILIO_INBOUND_NUMBER: emptyToUndefined(z.string().optional()),
  TWILIO_WEBHOOK_BASE_URL: emptyToUndefined(z.string().url().optional()),
  PLIVO_AUTH_ID: emptyToUndefined(z.string().optional()),
  PLIVO_AUTH_TOKEN: emptyToUndefined(z.string().optional()),
  PLIVO_INBOUND_NUMBER: emptyToUndefined(z.string().optional()),
  PLIVO_WEBHOOK_BASE_URL: emptyToUndefined(z.string().url().optional()),
  HUMAN_HANDOFF_PHONE: emptyToUndefined(z.string().optional()),
  LOG_LEVEL: emptyToUndefined(z.string().optional()),
});

export const env = envSchema.parse({
  ...process.env,
  APP_URL: process.env.APP_URL ?? process.env.NEXTAUTH_URL ?? "http://localhost:3000",
});

export function requireEnvVar<K extends keyof typeof env>(key: K) {
  const value = env[key];

  if (!value) {
    throw new Error(`Missing required environment variable: ${String(key)}`);
  }

  return value;
}
