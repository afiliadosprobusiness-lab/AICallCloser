import { PhoneCall, Sparkles, Target, Users } from "lucide-react";

import { AIThinkingIndicator } from "@/components/premium/ai-thinking-indicator";
import { CallsLineChart } from "@/components/premium/calls-line-chart";
import { KpiCard } from "@/components/premium/kpi-card";
import { OutcomeBadge } from "@/components/premium/outcome-badge";
import { PremiumCard } from "@/components/premium/premium-card";
import { getWorkspaceContextOrThrow } from "@/lib/session";
import { getDashboardMetrics } from "@/modules/metrics/service";

export default async function DashboardPage() {
  const { workspaceId } = await getWorkspaceContextOrThrow();
  const metrics = await getDashboardMetrics(workspaceId);

  return (
    <div className="space-y-4 md:space-y-6">
      <PremiumCard className="p-5 md:p-6">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-[#A7A296]">Control center</p>
            <h1 className="mt-2 font-serif text-3xl text-[#F5F3EE] md:text-4xl">
              Dashboard premium
            </h1>
            <p className="mt-2 max-w-xl text-sm text-[#B9B4A9]">
              Monitorea el rendimiento de llamadas IA, calificacion de leads y conversion de
              agenda en tiempo real.
            </p>
          </div>
          <AIThinkingIndicator />
        </div>
      </PremiumCard>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard
          label="Llamadas"
          value={String(metrics.callsTotal)}
          delta="+12% semana"
          highlight
        />
        <KpiCard label="Leads calificados" value={String(metrics.qualifiedLeads)} delta="+8% semana" />
        <KpiCard label="Agendados" value={String(metrics.scheduledLeads)} delta="+5% semana" />
        <KpiCard label="Close rate" value={`${metrics.closeRate}%`} delta="+2.1 pts" />
      </div>

      <div className="grid gap-4 xl:grid-cols-[1.4fr_1fr]">
        <PremiumCard className="p-4 md:p-5">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.14em] text-[#A7A296]">Ultimos 7 dias</p>
              <h2 className="mt-1 text-lg font-semibold text-[#F5F3EE]">Actividad inbound</h2>
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
          <p className="text-xs uppercase tracking-[0.14em] text-[#A7A296]">Resumen rapido</p>
          <div className="mt-4 grid grid-cols-1 gap-3">
            <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 p-3">
              <Users className="h-4 w-4 text-[#E5C76B]" />
              <div>
                <p className="text-sm text-[#F5F3EE]">Leads activos</p>
                <p className="text-xs text-[#B9B4A9]">{metrics.qualifiedLeads + metrics.scheduledLeads}</p>
              </div>
            </div>
            <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 p-3">
              <PhoneCall className="h-4 w-4 text-[#6FA8FF]" />
              <div>
                <p className="text-sm text-[#F5F3EE]">Handoffs</p>
                <p className="text-xs text-[#B9B4A9]">{metrics.handoffs}</p>
              </div>
            </div>
            <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 p-3">
              <Target className="h-4 w-4 text-[#E5C76B]" />
              <div>
                <p className="text-sm text-[#F5F3EE]">Conversion</p>
                <p className="text-xs text-[#B9B4A9]">{metrics.closeRate}%</p>
              </div>
            </div>
          </div>
        </PremiumCard>
      </div>

      <PremiumCard className="p-4 md:p-5">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-[#F5F3EE]">Actividad reciente</h2>
          <span className="text-xs text-[#A7A296]">ultimas {metrics.recentCalls.length} llamadas</span>
        </div>
        <div className="space-y-3">
          {metrics.recentCalls.length === 0 ? (
            <p className="text-sm text-[#A7A296]">Sin llamadas registradas todavia.</p>
          ) : (
            metrics.recentCalls.map((call) => (
              <div
                key={call.id}
                className="flex items-center justify-between gap-3 rounded-2xl border border-white/10 bg-white/5 p-3"
              >
                <div>
                  <p className="text-sm text-[#F5F3EE]">{call.lead?.phone ?? call.fromNumber}</p>
                  <p className="text-xs text-[#A7A296]">
                    {new Date(call.startedAt).toLocaleString("es-ES")}
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
