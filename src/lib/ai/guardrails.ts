const currencyPattern = /(\$|usd|d[oó]lares|euros?|€|mxn|precio|coste|costo|tarifa)/i;

const safePricingMessage =
  "No tengo permisos para confirmar precios en esta llamada. Te transfiero con un especialista humano para darte la cifra exacta.";

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
