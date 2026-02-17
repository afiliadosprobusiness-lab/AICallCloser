import { AgentConfigForm } from "@/components/app/agent-config-form";
import { PremiumCard } from "@/components/premium/premium-card";
import { db } from "@/lib/db";
import { getWorkspaceContextOrThrow } from "@/lib/session";

export default async function AgentPage() {
  const { workspaceId } = await getWorkspaceContextOrThrow();

  const config = await db.agentConfig.findUnique({ where: { workspaceId } });

  if (!config) {
    return (
      <PremiumCard>
        <p className="text-sm text-[#A7A296]">No hay configuracion de agente para este workspace.</p>
      </PremiumCard>
    );
  }

  return (
    <div className="space-y-4 md:space-y-6">
      <PremiumCard className="p-5 md:p-6">
        <p className="text-xs uppercase tracking-[0.2em] text-[#A7A296]">Agente IA</p>
        <h1 className="mt-2 font-serif text-3xl text-[#F5F3EE]">Orquestador conversacional</h1>
        <p className="mt-2 text-sm text-[#B9B4A9]">
          Configura tono, guardrails, modelos y reglas de transferencia humana.
        </p>
      </PremiumCard>

      <PremiumCard className="p-4 md:p-5">
        <AgentConfigForm
          initial={{
            agentName: config.agentName,
            greetingMessage: config.greetingMessage,
            systemPrompt: config.systemPrompt,
            handoffEnabled: config.handoffEnabled,
            handoffPhone: config.handoffPhone,
            calendarLink: config.calendarLink,
            llmModel: config.llmModel,
            sttModel: config.sttModel,
            voiceModel: config.voiceModel,
            ttsVoice: config.ttsVoice,
            qualificationChecklist: asStringArray(config.qualificationChecklist),
            disallowedClaims: asStringArray(config.disallowedClaims),
            pricingRules: asObject(config.pricingRules),
          }}
        />
      </PremiumCard>
    </div>
  );
}

function asStringArray(value: unknown): string[] {
  return Array.isArray(value) ? value.map((item) => String(item)) : [];
}

function asObject(value: unknown): Record<string, unknown> {
  return typeof value === "object" && value !== null ? (value as Record<string, unknown>) : {};
}
