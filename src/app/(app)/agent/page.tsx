import { AgentConfigForm } from "@/components/app/agent-config-form";
import { CallObjectivesForm } from "@/components/app/call-objectives-form";
import { PremiumCard } from "@/components/premium/premium-card";
import { db } from "@/lib/db";
import { defaultCallPreferences } from "@/lib/call-objectives/config";
import { translate } from "@/lib/i18n/config";
import { getRequestLocale } from "@/lib/i18n/server";
import { getWorkspaceContextOrThrow } from "@/lib/session";
import { deserializePreferences, getBusinessValueProp } from "@/modules/call-objectives/service";

export default async function AgentPage() {
  const locale = await getRequestLocale();
  const t = (esText: string, enText: string) => translate(locale, esText, enText);
  const { workspaceId } = await getWorkspaceContextOrThrow();

  const [config, rawPreferences, businessValueProp] = await Promise.all([
    db.agentConfig.findUnique({ where: { workspaceId } }),
    db.agentCallPreferences.findUnique({ where: { workspaceId } }),
    getBusinessValueProp(workspaceId),
  ]);

  if (!config) {
    return (
      <PremiumCard>
        <p className="text-sm text-[#A7A296]">{t("No hay configuracion de agente para este workspace.", "No agent configuration exists for this workspace.")}</p>
      </PremiumCard>
    );
  }

  return (
    <div className="space-y-4 md:space-y-6">
      <PremiumCard className="p-5 md:p-6">
        <p className="text-xs uppercase tracking-[0.2em] text-[#A7A296]">{t("Agente IA", "AI Agent")}</p>
        <h1 className="mt-2 font-serif text-3xl text-[#F5F3EE]">{t("Orquestador conversacional", "Conversational orchestrator")}</h1>
        <p className="mt-2 text-sm text-[#B9B4A9]">{t("Configura tono, guardrails, modelos y reglas de transferencia humana.", "Configure tone, guardrails, models and human transfer rules.")}</p>
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

      <PremiumCard className="p-4 md:p-5">
        <CallObjectivesForm
          initialPreferences={rawPreferences ? deserializePreferences(rawPreferences) : defaultCallPreferences}
          initialValueProp={businessValueProp}
          agentName={config.agentName}
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
