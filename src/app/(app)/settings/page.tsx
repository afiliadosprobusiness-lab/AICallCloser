import { TwilioNumberForm } from "@/components/app/twilio-number-form";
import { PremiumCard } from "@/components/premium/premium-card";
import { db } from "@/lib/db";
import { getWorkspaceContextOrThrow } from "@/lib/session";

export default async function SettingsPage() {
  const { workspaceId, role } = await getWorkspaceContextOrThrow();

  const [workspace, numbers, config] = await Promise.all([
    db.workspace.findUnique({ where: { id: workspaceId } }),
    db.twilioPhoneNumber.findMany({ where: { workspaceId }, orderBy: { createdAt: "desc" } }),
    db.agentConfig.findUnique({ where: { workspaceId } }),
  ]);

  return (
    <div className="space-y-4 md:space-y-6">
      <PremiumCard className="p-5 md:p-6">
        <p className="text-xs uppercase tracking-[0.2em] text-[#A7A296]">Ajustes</p>
        <h1 className="mt-2 font-serif text-3xl text-[#F5F3EE]">Workspace y telefonia</h1>
        <p className="mt-2 text-sm text-[#B9B4A9]">
          Configura numero Twilio inbound y reglas de handoff humano por workspace.
        </p>
      </PremiumCard>

      <div className="grid gap-4 lg:grid-cols-2">
        <PremiumCard className="space-y-4 p-4 md:p-5">
          <div>
            <p className="text-xs uppercase tracking-[0.14em] text-[#A7A296]">Workspace</p>
            <h2 className="mt-1 text-lg font-semibold text-[#F5F3EE]">{workspace?.name}</h2>
            <p className="text-sm text-[#B9B4A9]">Rol: {role}</p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/5 p-3 text-sm text-[#D8D3C7]">
            Slug: {workspace?.slug}
          </div>
        </PremiumCard>

        <PremiumCard className="space-y-4 p-4 md:p-5">
          <div>
            <p className="text-xs uppercase tracking-[0.14em] text-[#A7A296]">Handoff humano</p>
            <h2 className="mt-1 text-lg font-semibold text-[#F5F3EE]">
              {config?.handoffEnabled ? "Habilitado" : "Deshabilitado"}
            </h2>
            <p className="text-sm text-[#B9B4A9]">Telefono destino: {config?.handoffPhone ?? "No definido"}</p>
          </div>
          <div className="rounded-2xl border border-[#6FA8FF]/20 bg-[#6FA8FF]/10 p-3 text-xs text-[#DDEBFF]">
            Si la IA detecta duda, objecion compleja o solicitud explicita de humano, transfiere
            automaticamente.
          </div>
        </PremiumCard>
      </div>

      <PremiumCard className="space-y-4 p-4 md:p-5">
        <div>
          <p className="text-xs uppercase tracking-[0.14em] text-[#A7A296]">Numeros Twilio</p>
          <h2 className="mt-1 text-lg font-semibold text-[#F5F3EE]">Inbound routing</h2>
        </div>
        <TwilioNumberForm />
        <div className="space-y-2">
          {numbers.length === 0 ? (
            <p className="text-sm text-[#A7A296]">No hay numeros asociados.</p>
          ) : (
            numbers.map((number) => (
              <div
                key={number.id}
                className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/5 p-3"
              >
                <div>
                  <p className="text-sm text-[#F5F3EE]">{number.phoneNumber}</p>
                  <p className="text-xs text-[#A7A296]">{number.friendlyName ?? "Sin alias"}</p>
                </div>
                <span className="text-xs text-[#E5C76B]">{number.isActive ? "Activo" : "Inactivo"}</span>
              </div>
            ))
          )}
        </div>
      </PremiumCard>

      <PremiumCard className="space-y-2 p-4 text-sm text-[#B9B4A9]">
        <p className="font-medium text-[#F5F3EE]">Webhook Twilio recomendado</p>
        <p>
          Voice URL: <code className="text-[#E5C76B]">POST /api/twilio/voice/inbound</code>
        </p>
        <p>
          Status callback: <code className="text-[#E5C76B]">POST /api/twilio/voice/status</code>
        </p>
      </PremiumCard>
    </div>
  );
}
