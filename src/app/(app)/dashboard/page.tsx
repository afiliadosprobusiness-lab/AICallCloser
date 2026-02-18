import { PhoneCall, Sparkles, Target, Users } from "lucide-react";

import { AIThinkingIndicator } from "@/components/premium/ai-thinking-indicator";
import { CallsLineChart } from "@/components/premium/calls-line-chart";
import { KpiCard } from "@/components/premium/kpi-card";
import { OutcomeBadge } from "@/components/premium/outcome-badge";
import { PremiumCard } from "@/components/premium/premium-card";
import { translate } from "@/lib/i18n/config";
import { getRequestLocale } from "@/lib/i18n/server";
import { getWorkspaceContextOrThrow } from "@/lib/session";
import { getDashboardMetrics } from "@/modules/metrics/service";

export default async function DashboardPage() {
  const locale = await getRequestLocale();
  const t = (esText: string, enText: string) => translate(locale, esText, enText);
  const { workspaceId } = await getWorkspaceContextOrThrow();
  const metrics = await getDashboardMetrics(workspaceId);

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
        <KpiCard label={t("Llamadas", "Calls")} value={String(metrics.callsTotal)} delta={t("+12% semana", "+12% week") } highlight />
        <KpiCard label={t("Leads calificados", "Qualified leads")} value={String(metrics.qualifiedLeads)} delta={t("+8% semana", "+8% week")} />
        <KpiCard label={t("Agendados", "Scheduled")} value={String(metrics.scheduledLeads)} delta={t("+5% semana", "+5% week")} />
        <KpiCard label={t("Close rate", "Close rate")} value={`${metrics.closeRate}%`} delta={t("+2.1 pts", "+2.1 pts")} />
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
          <p className="text-xs uppercase tracking-[0.14em] text-[#A7A296]">{t("Resumen rapido", "Quick summary")}</p>
          <div className="mt-4 grid grid-cols-1 gap-3">
            <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 p-3">
              <Users className="h-4 w-4 text-[#E5C76B]" />
              <div>
                <p className="text-sm text-[#F5F3EE]">{t("Leads activos", "Active leads")}</p>
                <p className="text-xs text-[#B9B4A9]">{metrics.qualifiedLeads + metrics.scheduledLeads}</p>
              </div>
            </div>
            <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 p-3">
              <PhoneCall className="h-4 w-4 text-[#6FA8FF]" />
              <div>
                <p className="text-sm text-[#F5F3EE]">{t("Handoffs", "Handoffs")}</p>
                <p className="text-xs text-[#B9B4A9]">{metrics.handoffs}</p>
              </div>
            </div>
            <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 p-3">
              <Target className="h-4 w-4 text-[#E5C76B]" />
              <div>
                <p className="text-sm text-[#F5F3EE]">{t("Conversion", "Conversion")}</p>
                <p className="text-xs text-[#B9B4A9]">{metrics.closeRate}%</p>
              </div>
            </div>
          </div>
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
                  <p className="text-xs text-[#A7A296]">
                    {new Date(call.startedAt).toLocaleString(locale === "en" ? "en-US" : "es-ES")}
                  </p>
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
