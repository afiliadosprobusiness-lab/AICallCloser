import { TwilioNumberForm } from "@/components/app/twilio-number-form";
import { PremiumCard } from "@/components/premium/premium-card";
import { db } from "@/lib/db";
import { translate } from "@/lib/i18n/config";
import { getRequestLocale } from "@/lib/i18n/server";
import { getWorkspaceContextOrThrow } from "@/lib/session";

export default async function SettingsPage() {
  const locale = await getRequestLocale();
  const t = (esText: string, enText: string) => translate(locale, esText, enText);
  const { workspaceId, role } = await getWorkspaceContextOrThrow();

  const [workspace, numbers, config] = await Promise.all([
    db.workspace.findUnique({ where: { id: workspaceId } }),
    db.twilioPhoneNumber.findMany({ where: { workspaceId }, orderBy: { createdAt: "desc" } }),
    db.agentConfig.findUnique({ where: { workspaceId } }),
  ]);

  return (
    <div className="space-y-4 md:space-y-6">
      <PremiumCard className="p-5 md:p-6">
        <p className="text-xs uppercase tracking-[0.2em] text-[#A7A296]">{t("Ajustes", "Settings")}</p>
        <h1 className="mt-2 font-serif text-3xl text-[#F5F3EE]">{t("Workspace y telefonia", "Workspace and telephony")}</h1>
        <p className="mt-2 text-sm text-[#B9B4A9]">
          {t("Configura numero de Plivo inbound y reglas de handoff humano por workspace.", "Configure Plivo inbound number and human handoff rules by workspace.")}
        </p>
      </PremiumCard>

      <div className="grid gap-4 lg:grid-cols-2">
        <PremiumCard className="space-y-4 p-4 md:p-5">
          <div>
            <p className="text-xs uppercase tracking-[0.14em] text-[#A7A296]">Workspace</p>
            <h2 className="mt-1 text-lg font-semibold text-[#F5F3EE]">{workspace?.name}</h2>
            <p className="text-sm text-[#B9B4A9]">{t("Rol", "Role")}: {role}</p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/5 p-3 text-sm text-[#D8D3C7]">
            Slug: {workspace?.slug}
          </div>
        </PremiumCard>

        <PremiumCard className="space-y-4 p-4 md:p-5">
          <div>
            <p className="text-xs uppercase tracking-[0.14em] text-[#A7A296]">{t("Handoff humano", "Human handoff")}</p>
            <h2 className="mt-1 text-lg font-semibold text-[#F5F3EE]">
              {config?.handoffEnabled ? t("Habilitado", "Enabled") : t("Deshabilitado", "Disabled")}
            </h2>
            <p className="text-sm text-[#B9B4A9]">{t("Telefono destino", "Destination phone")}: {config?.handoffPhone ?? t("No definido", "Not defined")}</p>
          </div>
          <div className="rounded-2xl border border-[#6FA8FF]/20 bg-[#6FA8FF]/10 p-3 text-xs text-[#DDEBFF]">
            {t("Si la IA detecta duda, objecion compleja o solicitud explicita de humano, transfiere automaticamente.", "If AI detects hesitation, complex objection or explicit human request, it transfers automatically.")}
          </div>
        </PremiumCard>
      </div>

      <PremiumCard className="space-y-4 p-4 md:p-5">
        <div>
          <p className="text-xs uppercase tracking-[0.14em] text-[#A7A296]">{t("Numeros Plivo", "Plivo numbers")}</p>
          <h2 className="mt-1 text-lg font-semibold text-[#F5F3EE]">Inbound routing</h2>
        </div>
        <TwilioNumberForm />
        <div className="space-y-2">
          {numbers.length === 0 ? (
            <p className="text-sm text-[#A7A296]">{t("No hay numeros asociados.", "No associated numbers.")}</p>
          ) : (
            numbers.map((number) => (
              <div
                key={number.id}
                className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/5 p-3"
              >
                <div>
                  <p className="text-sm text-[#F5F3EE]">{number.phoneNumber}</p>
                  <p className="text-xs text-[#A7A296]">{number.friendlyName ?? t("Sin alias", "No alias")}</p>
                </div>
                <span className="text-xs text-[#E5C76B]">{number.isActive ? t("Activo", "Active") : t("Inactivo", "Inactive")}</span>
              </div>
            ))
          )}
        </div>
      </PremiumCard>

      <PremiumCard className="space-y-2 p-4 text-sm text-[#B9B4A9]">
        <p className="font-medium text-[#F5F3EE]">{t("Webhook Plivo recomendado", "Recommended Plivo webhook")}</p>
        <p>
          Voice URL: <code className="text-[#E5C76B]">POST /api/plivo/voice/inbound</code>
        </p>
        <p>
          Status callback: <code className="text-[#E5C76B]">POST /api/plivo/voice/status</code>
        </p>
        <p>
          Outbound API: <code className="text-[#E5C76B]">POST /api/plivo/voice/outbound</code>
        </p>
      </PremiumCard>
    </div>
  );
}
