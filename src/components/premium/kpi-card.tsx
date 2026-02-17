import { ArrowUpRight } from "lucide-react";

import { PremiumCard } from "@/components/premium/premium-card";

export function KpiCard(props: {
  label: string;
  value: string;
  delta: string;
  highlight?: boolean;
}) {
  return (
    <PremiumCard className={props.highlight ? "ring-1 ring-[#E5C76B]/30" : undefined}>
      <p className="text-xs uppercase tracking-[0.14em] text-[#A7A296]">{props.label}</p>
      <p className="mt-2 text-3xl font-semibold tabular-nums text-[#F5F3EE]">{props.value}</p>
      <div className="mt-3 flex items-center gap-1 text-xs text-[#E5C76B]">
        <ArrowUpRight className="h-3.5 w-3.5" />
        {props.delta}
      </div>
    </PremiumCard>
  );
}
