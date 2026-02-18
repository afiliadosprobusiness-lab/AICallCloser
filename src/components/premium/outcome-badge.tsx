"use client";

import { useLocale } from "@/components/providers/locale-provider";
import { Badge } from "@/components/ui/badge";

const styles: Record<string, string> = {
  qualified: "border-emerald-300/30 bg-emerald-300/10 text-emerald-100",
  scheduled: "border-[#E5C76B]/40 bg-[#E5C76B]/15 text-[#F7E6A7]",
  handoff: "border-[#6FA8FF]/35 bg-[#6FA8FF]/15 text-[#DDEBFF]",
  follow_up: "border-white/20 bg-white/10 text-[#D8D3C7]",
  not_qualified: "border-rose-300/30 bg-rose-300/10 text-rose-100",
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
    unknown: t("desconocido", "unknown"),
  };

  const label = labels[outcome] ?? outcome.replace(/_/g, " ");

  return (
    <Badge className={`rounded-full border px-2.5 py-1 text-[11px] uppercase ${styles[outcome] ?? styles.unknown}`}>
      {label}
    </Badge>
  );
}
