import type { ChatCompletionMessageParam } from "openai/resources/chat/completions";

import { getOpenAIClient } from "@/lib/ai/client";
import { enforcePricingGuardrail, normalizeAssistantReply } from "@/lib/ai/guardrails";
import { aiDecisionSchema, type AIDecision } from "@/lib/ai/types";
import { env } from "@/lib/env";
import { logger } from "@/lib/logger";

type TranscriptInput = {
  speaker: "user" | "assistant" | "system";
  text: string;
};

type AgentConfigInput = {
  systemPrompt: string;
  qualificationChecklist: unknown;
  disallowedClaims: unknown;
  pricingRules: unknown;
  llmModel?: string;
  handoffEnabled: boolean;
};

export async function generateAssistantDecision(params: {
  userText: string;
  transcript: TranscriptInput[];
  config: AgentConfigInput;
}): Promise<AIDecision> {
  const openai = getOpenAIClient();

  if (!openai) {
    return fallbackDecision(params.userText);
  }

  const systemMessage = [
    params.config.systemPrompt,
    "Reglas duras:",
    "1) Nunca inventes precios ni condiciones no configuradas.",
    "2) Si te preguntan si eres humano, di que eres asistente virtual.",
    "3) Si tienes duda relevante, accion=handoff.",
    "4) Responde corto, natural, seguro y orientado a cierre.",
    `Checklist de calificacion: ${JSON.stringify(params.config.qualificationChecklist)}`,
    `Claims prohibidos: ${JSON.stringify(params.config.disallowedClaims)}`,
    `Pricing rules: ${JSON.stringify(params.config.pricingRules)}`,
    "Devuelve SOLO JSON valido con el esquema solicitado.",
  ].join("\n");

  const transcriptWindow: ChatCompletionMessageParam[] = params.transcript.slice(-12).map((turn) =>
    turn.speaker === "assistant"
      ? {
          role: "assistant",
          content: turn.text,
        }
      : {
          role: "user",
          content: turn.text,
        },
  );

  const messages: ChatCompletionMessageParam[] = [
    { role: "system", content: systemMessage },
    ...transcriptWindow,
    {
      role: "user",
      content: `Ultimo mensaje del lead: ${params.userText}`,
    },
    {
      role: "user",
      content:
        "Responde con JSON: {assistantReply, action, leadUpdates, appointment, handoffReason, confidence}",
    },
  ];

  const completion = await openai.chat.completions.create({
    model: params.config.llmModel ?? env.OPENAI_MODEL,
    temperature: 0.2,
    messages,
    response_format: { type: "json_object" },
  });

  const raw = completion.choices[0]?.message?.content;

  if (!raw) {
    return fallbackDecision(params.userText);
  }

  let parsed = aiDecisionSchema.safeParse(JSON.parse(raw));

  if (!parsed.success) {
    logger.warn({ error: parsed.error.flatten() }, "Invalid AI decision payload");
    return fallbackDecision(params.userText);
  }

  const guard = enforcePricingGuardrail(parsed.data.assistantReply, params.config.pricingRules);

  if (guard.blocked) {
    parsed = aiDecisionSchema.safeParse({
      ...parsed.data,
      assistantReply: guard.text,
      action: params.config.handoffEnabled ? "handoff" : "follow_up",
      handoffReason: "pricing_question_without_authorized_data",
    });

    if (!parsed.success) {
      return fallbackDecision(params.userText);
    }
  }

  return {
    ...parsed.data,
    assistantReply: normalizeAssistantReply(parsed.data.assistantReply),
  };
}

function fallbackDecision(userText: string): AIDecision {
  const lower = userText.toLowerCase();
  const askedForHuman = /(humano|persona|asesor|agent|representative)/i.test(lower);

  if (askedForHuman) {
    return {
      assistantReply:
        "Claro. Soy un asistente virtual y ahora te transfiero con un especialista humano.",
      action: "handoff",
      leadUpdates: { scoreDelta: 4, status: "handed_off" },
      appointment: null,
      handoffReason: "requested_human",
      confidence: 0.9,
    };
  }

  return {
    assistantReply:
      "Perfecto. Para ayudarte mejor, cuentame brevemente tu objetivo principal y en cuanto tiempo quieres implementarlo.",
    action: "qualify",
    leadUpdates: { scoreDelta: 1 },
    appointment: null,
    confidence: 0.55,
  };
}
