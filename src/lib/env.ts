import { z } from "zod";

const emptyToUndefined = <T extends z.ZodTypeAny>(schema: T) =>
  z.preprocess((value) => (value === "" ? undefined : value), schema);

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  DATABASE_URL: z.string().min(1),
  NEXTAUTH_URL: emptyToUndefined(z.string().url().optional()),
  NEXTAUTH_SECRET: z.string().min(16),
  AUTH_TRUST_HOST: emptyToUndefined(z.string().optional()),
  APP_URL: z.string().url().default("http://localhost:3000"),
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
  HUMAN_HANDOFF_PHONE: emptyToUndefined(z.string().optional()),
  LOG_LEVEL: emptyToUndefined(z.string().optional()),
});

export const env = envSchema.parse({
  ...process.env,
  APP_URL: process.env.APP_URL ?? process.env.NEXTAUTH_URL ?? "http://localhost:3000",
});
