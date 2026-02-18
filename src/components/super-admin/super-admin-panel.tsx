"use client";

import { UserAccessStatus } from "@prisma/client";
import { CheckCircle2, Clock3, RefreshCcw, Users } from "lucide-react";
import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";

import { PremiumCard } from "@/components/premium/premium-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type AdminMetrics = {
  usersTotal: number;
  workspacesTotal: number;
  leadsTotal: number;
  callsTotal: number;
  scheduledLeads: number;
  qualifiedLeads: number;
  handoffsTotal: number;
  conversionRate: number;
};

type AdminUser = {
  id: string;
  name: string | null;
  email: string;
  createdAt: Date;
  accessStatus: UserAccessStatus;
  accessReason: string | null;
  accessDisabledUntil: Date | null;
  _count: {
    memberships: number;
  };
};

type WorkspaceSummary = {
  id: string;
  name: string;
  slug: string;
  createdAt: Date;
  owner: {
    id: string;
    name: string | null;
    email: string;
  };
  _count: {
    members: number;
    leads: number;
    calls: number;
  };
};

type LeadContact = {
  id: string;
  fullName: string | null;
  email: string | null;
  phone: string | null;
  company: string | null;
  status: string;
  score: number;
  createdAt: Date;
  workspace: {
    id: string;
    name: string;
    slug: string;
  };
};

const statusLabel: Record<UserAccessStatus, string> = {
  active: "Activo",
  deactivated: "Desactivado",
  temporarily_disabled: "Temporal",
  blocked: "Bloqueado",
};

const statusClass: Record<UserAccessStatus, string> = {
  active: "border-emerald-300/25 bg-emerald-300/10 text-emerald-200",
  deactivated: "border-amber-300/25 bg-amber-300/10 text-amber-200",
  temporarily_disabled: "border-sky-300/25 bg-sky-300/10 text-sky-200",
  blocked: "border-red-300/25 bg-red-300/10 text-red-200",
};

export function SuperAdminPanel(props: {
  metrics: AdminMetrics;
  users: AdminUser[];
  workspaces: WorkspaceSummary[];
  recentLeads: LeadContact[];
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [filter, setFilter] = useState("");

  const filteredUsers = useMemo(() => {
    const normalizedFilter = filter.trim().toLowerCase();
    if (!normalizedFilter) {
      return props.users;
    }

    return props.users.filter((user) => {
      return (
        user.email.toLowerCase().includes(normalizedFilter) ||
        (user.name ?? "").toLowerCase().includes(normalizedFilter)
      );
    });
  }, [filter, props.users]);

  async function updateStatus(
    userId: string,
    status: UserAccessStatus,
    options?: { reason?: string; disabledHours?: number },
  ) {
    startTransition(async () => {
      await fetch(`/api/super-admin/users/${userId}/access`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status,
          reason: options?.reason,
          disabledHours: options?.disabledHours,
        }),
      });

      router.refresh();
    });
  }

  return (
    <div className="space-y-4 md:space-y-6">
      <PremiumCard className="p-5 md:p-6">
        <p className="text-xs uppercase tracking-[0.2em] text-[#A7A296]">Super Administrador</p>
        <h1 className="mt-2 font-serif text-3xl text-[#F5F3EE]">Control global de cuentas</h1>
        <p className="mt-2 text-sm text-[#B9B4A9]">
          Gestiona usuarios, estados de acceso, workspaces y métricas reales de leads y llamadas.
        </p>
      </PremiumCard>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <MetricTile label="Usuarios" value={props.metrics.usersTotal} icon={Users} />
        <MetricTile label="Workspaces" value={props.metrics.workspacesTotal} icon={RefreshCcw} />
        <MetricTile label="Leads" value={props.metrics.leadsTotal} icon={CheckCircle2} />
        <MetricTile label="Conversión" value={`${props.metrics.conversionRate}%`} icon={Clock3} />
      </div>

      <PremiumCard className="space-y-4 p-4 md:p-5">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <h2 className="text-lg font-semibold text-[#F5F3EE]">Cuentas registradas</h2>
          <Input
            value={filter}
            onChange={(event) => setFilter(event.target.value)}
            placeholder="Filtrar por nombre o email"
            className="h-10 max-w-md rounded-xl bg-white/5"
          />
        </div>

        <div className="space-y-3">
          {filteredUsers.map((user) => (
            <div
              key={user.id}
              className="rounded-2xl border border-white/10 bg-white/5 p-3 md:p-4"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-[#F5F3EE]">
                    {user.name?.trim() || "Sin nombre"}
                  </p>
                  <p className="text-xs text-[#A7A296]">{user.email}</p>
                  <p className="mt-1 text-[11px] text-[#8D897F]">
                    Registrado: {new Date(user.createdAt).toLocaleString("es-PE")}
                  </p>
                </div>
                <Badge className={`border ${statusClass[user.accessStatus]}`}>
                  {statusLabel[user.accessStatus]}
                </Badge>
              </div>

              {user.accessReason ? (
                <p className="mt-2 text-xs text-[#C6C1B6]">Motivo: {user.accessReason}</p>
              ) : null}

              {user.accessDisabledUntil ? (
                <p className="mt-1 text-xs text-[#9FAED7]">
                  Hasta: {new Date(user.accessDisabledUntil).toLocaleString("es-PE")}
                </p>
              ) : null}

              <div className="mt-3 flex flex-wrap gap-2">
                <Button
                  type="button"
                  disabled={isPending}
                  onClick={() => updateStatus(user.id, "active")}
                  className="h-8 rounded-lg bg-emerald-400/20 px-3 text-xs text-emerald-100 hover:bg-emerald-400/30"
                >
                  Activar
                </Button>
                <Button
                  type="button"
                  disabled={isPending}
                  onClick={() => updateStatus(user.id, "deactivated", { reason: "Desactivado por administrador." })}
                  className="h-8 rounded-lg bg-amber-400/20 px-3 text-xs text-amber-100 hover:bg-amber-400/30"
                >
                  Desactivar
                </Button>
                <Button
                  type="button"
                  disabled={isPending}
                  onClick={() =>
                    updateStatus(user.id, "temporarily_disabled", {
                      reason: "Deshabilitado temporalmente por administrador.",
                      disabledHours: 24,
                    })
                  }
                  className="h-8 rounded-lg bg-sky-400/20 px-3 text-xs text-sky-100 hover:bg-sky-400/30"
                >
                  Temporal 24h
                </Button>
                <Button
                  type="button"
                  disabled={isPending}
                  onClick={() => updateStatus(user.id, "blocked", { reason: "Usuario bloqueado por administrador." })}
                  className="h-8 rounded-lg bg-red-400/20 px-3 text-xs text-red-100 hover:bg-red-400/30"
                >
                  Bloquear
                </Button>
              </div>
            </div>
          ))}
        </div>
      </PremiumCard>

      <PremiumCard className="space-y-4 p-4 md:p-5">
        <h2 className="text-lg font-semibold text-[#F5F3EE]">Workspaces creados</h2>
        <div className="space-y-3">
          {props.workspaces.map((workspace) => (
            <div key={workspace.id} className="rounded-2xl border border-white/10 bg-white/5 p-3">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <p className="text-sm font-semibold text-[#F5F3EE]">{workspace.name}</p>
                  <p className="text-xs text-[#A7A296]">Slug: {workspace.slug}</p>
                </div>
                <p className="text-xs text-[#A7A296]">
                  {new Date(workspace.createdAt).toLocaleDateString("es-PE")}
                </p>
              </div>
              <p className="mt-2 text-xs text-[#C6C1B6]">
                Owner: {workspace.owner.name ?? "Sin nombre"} ({workspace.owner.email})
              </p>
              <p className="mt-1 text-xs text-[#9FAED7]">
                Miembros: {workspace._count.members} | Leads: {workspace._count.leads} | Llamadas:{" "}
                {workspace._count.calls}
              </p>
            </div>
          ))}
        </div>
      </PremiumCard>

      <PremiumCard className="space-y-4 p-4 md:p-5">
        <h2 className="text-lg font-semibold text-[#F5F3EE]">Contactos reales (leads)</h2>
        <div className="space-y-3">
          {props.recentLeads.map((lead) => (
            <div key={lead.id} className="rounded-2xl border border-white/10 bg-white/5 p-3">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <p className="text-sm font-semibold text-[#F5F3EE]">
                    {lead.fullName?.trim() || "Sin nombre"}
                  </p>
                  <p className="text-xs text-[#A7A296]">
                    Workspace: {lead.workspace.name} ({lead.workspace.slug})
                  </p>
                </div>
                <Badge className="border border-white/15 bg-white/10 text-[#E4E0D6]">
                  {lead.status}
                </Badge>
              </div>
              <div className="mt-2 grid gap-2 text-xs text-[#C6C1B6] md:grid-cols-2">
                <p>Email: {lead.email ?? "-"}</p>
                <p>Celular: {lead.phone ?? "-"}</p>
                <p>Empresa: {lead.company ?? "-"}</p>
                <p>Score: {lead.score}</p>
              </div>
            </div>
          ))}
        </div>
      </PremiumCard>
    </div>
  );
}

function MetricTile(props: {
  label: string;
  value: string | number;
  icon: React.ComponentType<{ className?: string }>;
}) {
  const Icon = props.icon;

  return (
    <PremiumCard className="p-4">
      <div className="flex items-center justify-between">
        <p className="text-xs uppercase tracking-[0.14em] text-[#A7A296]">{props.label}</p>
        <Icon className="h-4 w-4 text-[#E5C76B]" />
      </div>
      <p className="mt-3 text-3xl font-semibold text-[#F5F3EE]">{props.value}</p>
    </PremiumCard>
  );
}
