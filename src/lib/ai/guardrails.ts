const currencyPattern = /(\$|usd|d[oó]lares|euros?|€|mxn|precio|coste|costo|tarifa|pricing|price)/i;

const safePricingMessage = "A specialist will confirm exact pricing. Want to book a quick call?";

export function enforcePricingGuardrail(text: string, pricingRules: unknown) {
  const hasPricingMention = currencyPattern.test(text);
  const pricingDefined =
    typeof pricingRules === "object" && pricingRules !== null && Object.keys(pricingRules).length > 0;

  if (hasPricingMention && !pricingDefined) {
    return {
      blocked: true,
      text: safePricingMessage,
    };
  }

  return {
    blocked: false,
    text,
  };
}

export function normalizeAssistantReply(text: string) {
  return text.replace(/\s+/g, " ").trim();
}

export function limitReplyWords(text: string, maxWords = 20) {
  const normalized = normalizeAssistantReply(text);
  const words = normalized.split(" ").filter(Boolean);

  if (words.length <= maxWords) {
    return normalized;
  }

  return `${words.slice(0, maxWords).join(" ")}...`;
}

