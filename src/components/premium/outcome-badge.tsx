"use client";

import { useLocale } from "@/components/providers/locale-provider";
import { Badge } from "@/components/ui/badge";

const styles: Record<string, string> = {
  qualified: "border-emerald-300/30 bg-emerald-300/10 text-emerald-100",
  scheduled: "border-[#E5C76B]/40 bg-[#E5C76B]/15 text-[#F7E6A7]",
  handoff: "border-[#6FA8FF]/35 bg-[#6FA8FF]/15 text-[#DDEBFF]",
  follow_up: "border-white/20 bg-white/10 text-[#D8D3C7]",
  not_qualified: "border-rose-300/30 bg-rose-300/10 text-rose-100",
  sold: "border-emerald-300/40 bg-emerald-300/20 text-emerald-100",
  booked_meeting: "border-[#E5C76B]/45 bg-[#E5C76B]/20 text-[#F7E6A7]",
  booked_google_meet: "border-[#6FA8FF]/45 bg-[#6FA8FF]/20 text-[#DDEBFF]",
  followup_scheduled: "border-cyan-300/35 bg-cyan-300/15 text-cyan-100",
  info_collected: "border-white/20 bg-white/10 text-[#D8D3C7]",
  transferred: "border-[#6FA8FF]/35 bg-[#6FA8FF]/15 text-[#DDEBFF]",
  not_interested: "border-rose-300/30 bg-rose-300/10 text-rose-100",
  disqualified: "border-rose-300/30 bg-rose-300/10 text-rose-100",
  unknown: "border-white/20 bg-white/10 text-[#D8D3C7]",
};

export function OutcomeBadge({ outcome }: { outcome: string }) {
  const { t } = useLocale();
  const labels: Record<string, string> = {
    qualified: t("calificado", "qualified"),
    scheduled: t("agendado", "scheduled"),
    handoff: "handoff",
    follow_up: t("seguimiento", "follow up"),
    not_qualified: t("no calificado", "not qualified"),
    sold: t("vendido", "sold"),
    booked_meeting: t("reunion agendada", "booked meeting"),
    booked_google_meet: "booked google meet",
    followup_scheduled: t("seguimiento agendado", "follow-up scheduled"),
    info_collected: t("info recolectada", "info collected"),
    transferred: t("transferido", "transferred"),
    not_interested: t("sin interes", "not interested"),
    disqualified: t("descalificado", "disqualified"),
    unknown: t("desconocido", "unknown"),
  };

  const label = labels[outcome] ?? outcome.replace(/_/g, " ");

  return (
    <Badge className={`rounded-full border px-2.5 py-1 text-[11px] uppercase ${styles[outcome] ?? styles.unknown}`}>
      {label}
    </Badge>
  );
}
