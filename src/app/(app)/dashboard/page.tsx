import { CheckCircle2, CircleAlert, PhoneCall, ShieldCheck, Sparkles, Target, Users } from "lucide-react";

import { LocalDateTime } from "@/components/app/local-date-time";
import { OutboundCallLauncher } from "@/components/app/outbound-call-launcher";
import { AIThinkingIndicator } from "@/components/premium/ai-thinking-indicator";
import { CallsLineChart } from "@/components/premium/calls-line-chart";
import { KpiCard } from "@/components/premium/kpi-card";
import { OutcomeBadge } from "@/components/premium/outcome-badge";
import { PremiumCard } from "@/components/premium/premium-card";
import { translate } from "@/lib/i18n/config";
import { getRequestLocale } from "@/lib/i18n/server";
import { getWorkspaceContextOrThrow } from "@/lib/session";
import { getVoiceProvider } from "@/lib/voice/provider";
import { getDashboardMetrics } from "@/modules/metrics/service";

export default async function DashboardPage() {
  const locale = await getRequestLocale();
  const t = (esText: string, enText: string) => translate(locale, esText, enText);
  const { workspaceId } = await getWorkspaceContextOrThrow();
  const metrics = await getDashboardMetrics(workspaceId).catch((error) => {
    console.error("[dashboard] failed to load metrics", error);
    return getEmptyDashboardMetrics();
  });
  const voiceProvider = getVoiceProvider();
  const providerLabel = voiceProvider === "twilio" ? "Twilio" : voiceProvider === "plivo" ? "Plivo" : "Telnyx";
  const outboundEndpoint = `/api/${voiceProvider}/voice/outbound`;

  const readinessLabels = [
    t("Agente configurado", "Agent configured"),
    t("Numero activo", "Active number"),
    t("Handoff listo", "Handoff ready"),
    t("Guardrails completos", "Guardrails complete"),
    t("Actividad reciente", "Recent activity"),
  ];

  const hasReadinessRisk = metrics.readinessScore < 80;

  return (
    <div className="space-y-4 md:space-y-6">
      <PremiumCard className="p-5 md:p-6">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-[#A7A296]">{t("Control center", "Control center")}</p>
            <h1 className="mt-2 font-serif text-3xl text-[#F5F3EE] md:text-4xl">{t("Dashboard premium", "Premium dashboard")}</h1>
            <p className="mt-2 max-w-xl text-sm text-[#B9B4A9]">
              {t(
                "Monitorea rendimiento de llamadas IA, calificacion de leads y conversion de agenda en tiempo real.",
                "Monitor AI call performance, lead qualification and booking conversion in real time.",
              )}
            </p>
          </div>
          <AIThinkingIndicator />
        </div>
      </PremiumCard>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard
          label={t("Llamadas", "Calls")}
          value={String(metrics.callsTotal)}
          delta={t(`${metrics.callsCompleted} atendidas`, `${metrics.callsCompleted} answered`)}
          highlight
        />
        <KpiCard
          label={t("Leads calificados", "Qualified leads")}
          value={String(metrics.qualifiedLeads)}
          delta={t(`${metrics.newLeads} nuevos`, `${metrics.newLeads} new`)}
        />
        <KpiCard
          label={t("Agendados", "Scheduled")}
          value={String(metrics.scheduledLeads)}
          delta={t(`${metrics.wonLeads} cerrados`, `${metrics.wonLeads} won`)}
        />
        <KpiCard
          label={t("Close rate", "Close rate")}
          value={`${metrics.closeRate}%`}
          delta={t(`No answer ${metrics.noAnswerRate}%`, `No answer ${metrics.noAnswerRate}%`)}
        />
      </div>

      <div className="grid gap-4 xl:grid-cols-[1.4fr_1fr]">
        <PremiumCard className="p-4 md:p-5">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.14em] text-[#A7A296]">{t("Ultimos 7 dias", "Last 7 days")}</p>
              <h2 className="mt-1 text-lg font-semibold text-[#F5F3EE]">{t("Actividad inbound", "Inbound activity")}</h2>
            </div>
            <Sparkles className="h-4 w-4 text-[#E5C76B]" />
          </div>
          <CallsLineChart
            data={
              metrics.dailyMetrics.length > 0
                ? metrics.dailyMetrics.map((item) => ({
                    date: item.date.toISOString(),
                    inboundCalls: item.inboundCalls,
                  }))
                : [
                    { date: new Date().toISOString(), inboundCalls: 0 },
                    { date: new Date().toISOString(), inboundCalls: 0 },
                    { date: new Date().toISOString(), inboundCalls: 0 },
                  ]
            }
          />
        </PremiumCard>

        <PremiumCard className="p-4 md:p-5">
          <div className="mb-3 flex items-center justify-between gap-3">
            <p className="text-xs uppercase tracking-[0.14em] text-[#A7A296]">{t("Readiness operativa", "Operational readiness")}</p>
            <div className="flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-[#E5C76B]">
              <ShieldCheck className="h-3.5 w-3.5" />
              {metrics.readinessScore}%
            </div>
          </div>

          <div className="h-2 overflow-hidden rounded-full bg-white/10">
            <div
              className="h-full rounded-full bg-gradient-to-r from-[#6FA8FF] to-[#E5C76B] transition-all"
              style={{ width: `${metrics.readinessScore}%` }}
            />
          </div>

          <div className="mt-4 space-y-2">
            {readinessLabels.map((label, index) => {
              const ready = Boolean(metrics.readinessChecks[index]);
              return (
                <div key={label} className="flex items-center justify-between rounded-xl border border-white/10 bg-white/5 px-3 py-2">
                  <span className="text-sm text-[#F5F3EE]">{label}</span>
                  {ready ? (
                    <CheckCircle2 className="h-4 w-4 text-emerald-300" />
                  ) : (
                    <CircleAlert className="h-4 w-4 text-amber-300" />
                  )}
                </div>
              );
            })}
          </div>

          {hasReadinessRisk ? (
            <p className="mt-3 text-xs text-amber-200/90">
              {t(
                "Completa los items pendientes para mejorar conversion y estabilidad de llamadas.",
                "Complete pending items to improve conversion and call reliability.",
              )}
            </p>
          ) : null}
        </PremiumCard>
      </div>

      <div className="grid gap-4 xl:grid-cols-[1.2fr_1fr]">
        <PremiumCard className="p-4 md:p-5">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-[#F5F3EE]">{t("Funnel comercial", "Sales funnel")}</h2>
            <Target className="h-4 w-4 text-[#E5C76B]" />
          </div>

          <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
            <FunnelTile label={t("Nuevos", "New")} value={metrics.newLeads} />
            <FunnelTile label={t("Calificados", "Qualified")} value={metrics.qualifiedLeads} />
            <FunnelTile label={t("Agendados", "Scheduled")} value={metrics.scheduledLeads} />
            <FunnelTile label={t("Ganados", "Won")} value={metrics.wonLeads} />
            <FunnelTile label={t("Perdidos", "Lost")} value={metrics.lostLeads} />
          </div>
        </PremiumCard>

        <PremiumCard className="p-4 md:p-5">
          <p className="text-xs uppercase tracking-[0.14em] text-[#A7A296]">{t("Resumen rapido", "Quick summary")}</p>
          <div className="mt-4 grid grid-cols-1 gap-3">
            <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 p-3">
              <Users className="h-4 w-4 text-[#E5C76B]" />
              <div>
                <p className="text-sm text-[#F5F3EE]">{t("Leads activos", "Active leads")}</p>
                <p className="text-xs text-[#B9B4A9]">{metrics.newLeads + metrics.qualifiedLeads + metrics.scheduledLeads}</p>
              </div>
            </div>
            <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 p-3">
              <PhoneCall className="h-4 w-4 text-[#6FA8FF]" />
              <div>
                <p className="text-sm text-[#F5F3EE]">{t("Duracion promedio", "Average duration")}</p>
                <p className="text-xs text-[#B9B4A9]">{metrics.avgDurationSeconds}s</p>
              </div>
            </div>
            <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 p-3">
              <Target className="h-4 w-4 text-[#E5C76B]" />
              <div>
                <p className="text-sm text-[#F5F3EE]">{t("No-answer", "No-answer")}</p>
                <p className="text-xs text-[#B9B4A9]">{metrics.callsNoAnswer} ({metrics.noAnswerRate}%)</p>
              </div>
            </div>
            <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 p-3">
              <Sparkles className="h-4 w-4 text-[#6FA8FF]" />
              <div>
                <p className="text-sm text-[#F5F3EE]">{t("Numeros activos", "Active numbers")}</p>
                <p className="text-xs text-[#B9B4A9]">{metrics.activeNumbers}</p>
              </div>
            </div>
          </div>
          <OutboundCallLauncher endpoint={outboundEndpoint} providerLabel={providerLabel} />
        </PremiumCard>
      </div>

      <PremiumCard className="p-4 md:p-5">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-[#F5F3EE]">{t("Actividad reciente", "Recent activity")}</h2>
          <span className="text-xs text-[#A7A296]">{t("ultimas", "last")} {metrics.recentCalls.length} {t("llamadas", "calls")}</span>
        </div>
        <div className="space-y-3">
          {metrics.recentCalls.length === 0 ? (
            <p className="text-sm text-[#A7A296]">{t("Sin llamadas registradas todavia.", "No calls recorded yet.")}</p>
          ) : (
            metrics.recentCalls.map((call) => (
              <div
                key={call.id}
                className="flex items-center justify-between gap-3 rounded-2xl border border-white/10 bg-white/5 p-3"
              >
                <div>
                  <p className="text-sm text-[#F5F3EE]">{call.lead?.phone ?? call.fromNumber}</p>
                  <LocalDateTime value={new Date(call.startedAt).toISOString()} className="text-xs text-[#A7A296]" />
                </div>
                <OutcomeBadge outcome={call.outcome} />
              </div>
            ))
          )}
        </div>
      </PremiumCard>
    </div>
  );
}

function getEmptyDashboardMetrics() {
  return {
    callsTotal: 0,
    callsCompleted: 0,
    callsNoAnswer: 0,
    qualifiedLeads: 0,
    scheduledLeads: 0,
    newLeads: 0,
    unqualifiedLeads: 0,
    wonLeads: 0,
    lostLeads: 0,
    handoffs: 0,
    closeRate: 0,
    winRate: 0,
    noAnswerRate: 0,
    avgDurationSeconds: 0,
    activeNumbers: 0,
    readinessScore: 0,
    readinessChecks: [false, false, false, false, false],
    recentCalls: [] as Array<{
      id: string;
      fromNumber: string;
      startedAt: Date;
      outcome: "unknown";
      lead: { phone: string } | null;
    }>,
    dailyMetrics: [] as Array<{
      date: Date;
      inboundCalls: number;
    }>,
  };
}

function FunnelTile(props: { label: string; value: number }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-3">
      <p className="text-xs uppercase tracking-[0.1em] text-[#A7A296]">{props.label}</p>
      <p className="mt-2 text-2xl font-semibold text-[#F5F3EE]">{props.value}</p>
    </div>
  );
}
