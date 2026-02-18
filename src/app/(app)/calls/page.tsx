import Link from "next/link";

import { CallSimulator } from "@/components/app/call-simulator";
import { OutcomeBadge } from "@/components/premium/outcome-badge";
import { PremiumCard } from "@/components/premium/premium-card";
import { db } from "@/lib/db";
import { cn } from "@/lib/utils";
import { translate } from "@/lib/i18n/config";
import { getRequestLocale } from "@/lib/i18n/server";
import { getWorkspaceContextOrThrow } from "@/lib/session";

export default async function CallsPage({
  searchParams,
}: {
  searchParams: Promise<{ callId?: string }>;
}) {
  const locale = await getRequestLocale();
  const t = (esText: string, enText: string) => translate(locale, esText, enText);
  const { workspaceId } = await getWorkspaceContextOrThrow();
  const params = await searchParams;

  const calls = await db.call.findMany({
    where: { workspaceId },
    include: {
      lead: true,
      transcripts: {
        orderBy: { spokenAt: "asc" },
      },
    },
    orderBy: { startedAt: "desc" },
    take: 30,
  });

  const selectedCall =
    calls.find((call) => call.id === params.callId) ?? calls[0] ?? null;

  return (
    <div className="space-y-4 md:space-y-6">
      <PremiumCard className="p-5 md:p-6">
        <p className="text-xs uppercase tracking-[0.2em] text-[#A7A296]">{t("Llamadas", "Calls")}</p>
        <h1 className="mt-2 font-serif text-3xl text-[#F5F3EE]">{t("Historial y transcript", "History and transcript")}</h1>
        <p className="mt-2 text-sm text-[#B9B4A9]">{t("Revisa outcomes, transcript completo y simulacion de turnos IA.", "Review outcomes, full transcript and AI turn simulation.")}</p>
      </PremiumCard>

      {selectedCall ? (
        <PremiumCard className="p-4">
          <p className="mb-2 text-xs uppercase tracking-[0.14em] text-[#A7A296]">{t("Simulador rapido", "Quick simulator")}</p>
          <CallSimulator callId={selectedCall.id} />
        </PremiumCard>
      ) : null}

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[0.95fr_1.05fr]">
        <PremiumCard className="space-y-3 p-4">
          <h2 className="text-lg font-semibold text-[#F5F3EE]">{t("Llamadas recientes", "Recent calls")}</h2>
          {calls.length === 0 ? (
            <p className="text-sm text-[#A7A296]">{t("No hay llamadas registradas.", "No calls recorded.")}</p>
          ) : (
            calls.map((call) => {
              const active = selectedCall?.id === call.id;

              return (
                <Link
                  key={call.id}
                  href={`/calls?callId=${encodeURIComponent(call.id)}`}
                  className={cn(
                    "block rounded-2xl border bg-white/5 p-3 transition-all",
                    active
                      ? "border-[#E5C76B]/45 ring-1 ring-[#E5C76B]/30"
                      : "border-white/10 hover:border-white/25",
                  )}
                >
                  <div className="mb-2 flex items-center justify-between gap-2">
                    <p className="text-sm font-medium text-[#F5F3EE]">{call.fromNumber}</p>
                    <OutcomeBadge outcome={call.outcome} />
                  </div>
                  <p className="text-xs text-[#A7A296]">{new Date(call.startedAt).toLocaleString(locale === "en" ? "en-US" : "es-ES")}</p>
                </Link>
              );
            })
          )}
        </PremiumCard>

        <PremiumCard className="p-4">
          <h2 className="mb-3 text-lg font-semibold text-[#F5F3EE]">Transcript</h2>
          {!selectedCall ? (
            <p className="text-sm text-[#A7A296]">{t("Selecciona una llamada.", "Select a call.")}</p>
          ) : selectedCall.transcripts.length === 0 ? (
            <p className="text-sm text-[#A7A296]">{t("Sin transcript todavia.", "No transcript yet.")}</p>
          ) : (
            <div className="space-y-3">
              {selectedCall.transcripts.map((turn) => (
                <div
                  key={turn.id}
                  className={`rounded-2xl border p-3 ${
                    turn.speaker === "assistant"
                      ? "border-[#E5C76B]/35 bg-[#E5C76B]/8"
                      : turn.speaker === "user"
                        ? "border-white/10 bg-white/5"
                        : "border-[#6FA8FF]/20 bg-[#6FA8FF]/8"
                  }`}
                >
                  <p className="mb-1 text-[11px] uppercase tracking-[0.12em] text-[#A7A296]">
                    {turn.speaker}
                  </p>
                  <p className="text-sm leading-relaxed text-[#F5F3EE]">{turn.text}</p>
                </div>
              ))}
            </div>
          )}
        </PremiumCard>
      </div>
    </div>
  );
}
