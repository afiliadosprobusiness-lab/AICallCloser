import { CreateLeadInlineForm } from "@/components/app/create-lead-inline-form";
import { OutcomeBadge } from "@/components/premium/outcome-badge";
import { PremiumCard } from "@/components/premium/premium-card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { translate } from "@/lib/i18n/config";
import { getRequestLocale } from "@/lib/i18n/server";
import { getWorkspaceContextOrThrow } from "@/lib/session";
import { listLeadsByWorkspace } from "@/modules/leads/service";

export default async function LeadsPage() {
  const locale = await getRequestLocale();
  const t = (esText: string, enText: string) => translate(locale, esText, enText);
  const { workspaceId } = await getWorkspaceContextOrThrow();
  const leads = await listLeadsByWorkspace(workspaceId).catch((error) => {
    console.error("[leads] failed to load", error);
    return [];
  });

  return (
    <div className="space-y-4 md:space-y-6">
      <PremiumCard className="p-5 md:p-6">
        <p className="text-xs uppercase tracking-[0.2em] text-[#A7A296]">{t("Leads", "Leads")}</p>
        <h1 className="mt-2 font-serif text-3xl text-[#F5F3EE]">{t("Pipeline comercial", "Sales pipeline")}</h1>
        <p className="mt-2 text-sm text-[#B9B4A9]">{t("Gestiona leads entrantes y su estado de cierre en una sola vista.", "Manage inbound leads and their closing status in one view.")}</p>
        <div className="mt-4">
          <CreateLeadInlineForm />
        </div>
      </PremiumCard>

      <div className="grid grid-cols-1 gap-3 md:hidden">
        {leads.length === 0 ? (
          <PremiumCard>
            <p className="text-sm text-[#A7A296]">{t("No hay leads todavia.", "No leads yet.")}</p>
          </PremiumCard>
        ) : (
          leads.map((lead) => (
            <PremiumCard key={lead.id} className="space-y-3">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="text-base font-medium text-[#F5F3EE]">{lead.fullName ?? t("Lead inbound", "Inbound lead")}</p>
                  <p className="text-xs text-[#A7A296]">{lead.phone ?? t("Sin telefono", "No phone")}</p>
                </div>
                <OutcomeBadge outcome={lead.status} />
              </div>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div>
                  <p className="text-[#A7A296]">Score</p>
                  <p className="text-[#F5F3EE]">{lead.score}</p>
                </div>
                <div>
                  <p className="text-[#A7A296]">{t("Ultima llamada", "Last call")}</p>
                  <p className="text-[#F5F3EE]">
                    {lead.calls[0]
                      ? new Date(lead.calls[0].startedAt).toLocaleDateString(locale === "en" ? "en-US" : "es-ES")
                      : "-"}
                  </p>
                </div>
              </div>
            </PremiumCard>
          ))
        )}
      </div>

      <PremiumCard className="hidden md:block">
        <Table>
          <TableHeader>
            <TableRow className="border-white/10 hover:bg-transparent">
              <TableHead>{t("Lead", "Lead")}</TableHead>
              <TableHead>{t("Telefono", "Phone")}</TableHead>
              <TableHead>Score</TableHead>
              <TableHead>{t("Estado", "Status")}</TableHead>
              <TableHead>{t("Actualizado", "Updated")}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {leads.length === 0 ? (
              <TableRow className="border-white/10 hover:bg-transparent">
                <TableCell colSpan={5} className="text-[#A7A296]">
                  {t("No hay leads todavia.", "No leads yet.")}
                </TableCell>
              </TableRow>
            ) : (
              leads.map((lead) => (
                <TableRow key={lead.id} className="border-white/10 hover:bg-white/[0.03]">
                  <TableCell>{lead.fullName ?? t("Lead inbound", "Inbound lead")}</TableCell>
                  <TableCell>{lead.phone ?? "-"}</TableCell>
                  <TableCell>{lead.score}</TableCell>
                  <TableCell>
                    <OutcomeBadge outcome={lead.status} />
                  </TableCell>
                  <TableCell>{new Date(lead.updatedAt).toLocaleString(locale === "en" ? "en-US" : "es-ES")}</TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </PremiumCard>
    </div>
  );
}
