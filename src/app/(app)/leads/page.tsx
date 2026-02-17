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
import { getWorkspaceContextOrThrow } from "@/lib/session";
import { listLeadsByWorkspace } from "@/modules/leads/service";

export default async function LeadsPage() {
  const { workspaceId } = await getWorkspaceContextOrThrow();
  const leads = await listLeadsByWorkspace(workspaceId);

  return (
    <div className="space-y-4 md:space-y-6">
      <PremiumCard className="p-5 md:p-6">
        <p className="text-xs uppercase tracking-[0.2em] text-[#A7A296]">Leads</p>
        <h1 className="mt-2 font-serif text-3xl text-[#F5F3EE]">Pipeline comercial</h1>
        <p className="mt-2 text-sm text-[#B9B4A9]">
          Gestiona leads entrantes y su estado de cierre en una sola vista.
        </p>
        <div className="mt-4">
          <CreateLeadInlineForm />
        </div>
      </PremiumCard>

      <div className="grid grid-cols-1 gap-3 md:hidden">
        {leads.length === 0 ? (
          <PremiumCard>
            <p className="text-sm text-[#A7A296]">No hay leads todavia.</p>
          </PremiumCard>
        ) : (
          leads.map((lead) => (
            <PremiumCard key={lead.id} className="space-y-3">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="text-base font-medium text-[#F5F3EE]">{lead.fullName ?? "Lead inbound"}</p>
                  <p className="text-xs text-[#A7A296]">{lead.phone ?? "Sin telefono"}</p>
                </div>
                <OutcomeBadge outcome={lead.status} />
              </div>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div>
                  <p className="text-[#A7A296]">Score</p>
                  <p className="text-[#F5F3EE]">{lead.score}</p>
                </div>
                <div>
                  <p className="text-[#A7A296]">Ultima llamada</p>
                  <p className="text-[#F5F3EE]">
                    {lead.calls[0]
                      ? new Date(lead.calls[0].startedAt).toLocaleDateString("es-ES")
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
              <TableHead>Lead</TableHead>
              <TableHead>Telefono</TableHead>
              <TableHead>Score</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead>Actualizado</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {leads.length === 0 ? (
              <TableRow className="border-white/10 hover:bg-transparent">
                <TableCell colSpan={5} className="text-[#A7A296]">
                  No hay leads todavia.
                </TableCell>
              </TableRow>
            ) : (
              leads.map((lead) => (
                <TableRow key={lead.id} className="border-white/10 hover:bg-white/[0.03]">
                  <TableCell>{lead.fullName ?? "Lead inbound"}</TableCell>
                  <TableCell>{lead.phone ?? "-"}</TableCell>
                  <TableCell>{lead.score}</TableCell>
                  <TableCell>
                    <OutcomeBadge outcome={lead.status} />
                  </TableCell>
                  <TableCell>{new Date(lead.updatedAt).toLocaleString("es-ES")}</TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </PremiumCard>
    </div>
  );
}
