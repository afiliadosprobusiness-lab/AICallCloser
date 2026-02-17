import OpenAI from "openai";

import { env } from "@/lib/env";

const globalForOpenAI = globalThis as unknown as {
  openai?: OpenAI;
};

export function getOpenAIClient() {
  if (!env.OPENAI_API_KEY) {
    return null;
  }

  if (globalForOpenAI.openai) {
    return globalForOpenAI.openai;
  }

  globalForOpenAI.openai = new OpenAI({
    apiKey: env.OPENAI_API_KEY,
    baseURL: env.OPENAI_BASE_URL,
  });

  return globalForOpenAI.openai;
}
