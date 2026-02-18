"use client";

import { UserAccessStatus } from "@prisma/client";
import { CheckCircle2, Clock3, RefreshCcw, Users } from "lucide-react";
import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";

import { useLocale } from "@/components/providers/locale-provider";
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
  const { locale, t } = useLocale();
  const [isPending, startTransition] = useTransition();
  const [filter, setFilter] = useState("");

  const statusLabel: Record<UserAccessStatus, string> = {
    active: t("Activo", "Active"),
    deactivated: t("Desactivado", "Deactivated"),
    temporarily_disabled: t("Temporal", "Temporary"),
    blocked: t("Bloqueado", "Blocked"),
  };

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
        <p className="text-xs uppercase tracking-[0.2em] text-[#A7A296]">{t("Super Administrador", "Super Admin")}</p>
        <h1 className="mt-2 font-serif text-3xl text-[#F5F3EE]">{t("Control global de cuentas", "Global account control")}</h1>
        <p className="mt-2 text-sm text-[#B9B4A9]">
          {t("Gestiona usuarios, estados de acceso, workspaces y metricas reales de leads y llamadas.", "Manage users, access status, workspaces and real lead/call metrics.")}
        </p>
      </PremiumCard>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <MetricTile label={t("Usuarios", "Users")} value={props.metrics.usersTotal} icon={Users} />
        <MetricTile label="Workspaces" value={props.metrics.workspacesTotal} icon={RefreshCcw} />
        <MetricTile label={t("Leads", "Leads")} value={props.metrics.leadsTotal} icon={CheckCircle2} />
        <MetricTile label={t("Conversion", "Conversion")} value={`${props.metrics.conversionRate}%`} icon={Clock3} />
      </div>

      <PremiumCard className="space-y-4 p-4 md:p-5">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <h2 className="text-lg font-semibold text-[#F5F3EE]">{t("Cuentas registradas", "Registered accounts")}</h2>
          <Input
            value={filter}
            onChange={(event) => setFilter(event.target.value)}
            placeholder={t("Filtrar por nombre o email", "Filter by name or email")}
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
                    {user.name?.trim() || t("Sin nombre", "No name")}
                  </p>
                  <p className="text-xs text-[#A7A296]">{user.email}</p>
                  <p className="mt-1 text-[11px] text-[#8D897F]">
                    {t("Registrado", "Registered")}: {new Date(user.createdAt).toLocaleString(locale === "en" ? "en-US" : "es-PE")}
                  </p>
                </div>
                <Badge className={`border ${statusClass[user.accessStatus]}`}>
                  {statusLabel[user.accessStatus]}
                </Badge>
              </div>

              {user.accessReason ? (
                <p className="mt-2 text-xs text-[#C6C1B6]">{t("Motivo", "Reason")}: {user.accessReason}</p>
              ) : null}

              {user.accessDisabledUntil ? (
                <p className="mt-1 text-xs text-[#9FAED7]">
                  {t("Hasta", "Until")}: {new Date(user.accessDisabledUntil).toLocaleString(locale === "en" ? "en-US" : "es-PE")}
                </p>
              ) : null}

              <div className="mt-3 flex flex-wrap gap-2">
                <Button
                  type="button"
                  disabled={isPending}
                  onClick={() => updateStatus(user.id, "active")}
                  className="h-8 rounded-lg bg-emerald-400/20 px-3 text-xs text-emerald-100 hover:bg-emerald-400/30"
                >
                  {t("Activar", "Activate")}
                </Button>
                <Button
                  type="button"
                  disabled={isPending}
                  onClick={() => updateStatus(user.id, "deactivated", { reason: t("Desactivado por administrador.", "Deactivated by admin.") })}
                  className="h-8 rounded-lg bg-amber-400/20 px-3 text-xs text-amber-100 hover:bg-amber-400/30"
                >
                  {t("Desactivar", "Deactivate")}
                </Button>
                <Button
                  type="button"
                  disabled={isPending}
                  onClick={() =>
                    updateStatus(user.id, "temporarily_disabled", {
                      reason: t("Deshabilitado temporalmente por administrador.", "Temporarily disabled by admin."),
                      disabledHours: 24,
                    })
                  }
                  className="h-8 rounded-lg bg-sky-400/20 px-3 text-xs text-sky-100 hover:bg-sky-400/30"
                >
                  {t("Temporal 24h", "Temporary 24h")}
                </Button>
                <Button
                  type="button"
                  disabled={isPending}
                  onClick={() => updateStatus(user.id, "blocked", { reason: t("Usuario bloqueado por administrador.", "User blocked by admin.") })}
                  className="h-8 rounded-lg bg-red-400/20 px-3 text-xs text-red-100 hover:bg-red-400/30"
                >
                  {t("Bloquear", "Block")}
                </Button>
              </div>
            </div>
          ))}
        </div>
      </PremiumCard>

      <PremiumCard className="space-y-4 p-4 md:p-5">
        <h2 className="text-lg font-semibold text-[#F5F3EE]">{t("Workspaces creados", "Created workspaces")}</h2>
        <div className="space-y-3">
          {props.workspaces.map((workspace) => (
            <div key={workspace.id} className="rounded-2xl border border-white/10 bg-white/5 p-3">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <p className="text-sm font-semibold text-[#F5F3EE]">{workspace.name}</p>
                  <p className="text-xs text-[#A7A296]">Slug: {workspace.slug}</p>
                </div>
                <p className="text-xs text-[#A7A296]">
                  {new Date(workspace.createdAt).toLocaleDateString(locale === "en" ? "en-US" : "es-PE")}
                </p>
              </div>
              <p className="mt-2 text-xs text-[#C6C1B6]">
                Owner: {workspace.owner.name ?? t("Sin nombre", "No name")} ({workspace.owner.email})
              </p>
              <p className="mt-1 text-xs text-[#9FAED7]">
                {t("Miembros", "Members")}: {workspace._count.members} | Leads: {workspace._count.leads} | {t("Llamadas", "Calls")}: {workspace._count.calls}
              </p>
            </div>
          ))}
        </div>
      </PremiumCard>

      <PremiumCard className="space-y-4 p-4 md:p-5">
        <h2 className="text-lg font-semibold text-[#F5F3EE]">{t("Contactos reales (leads)", "Real contacts (leads)")}</h2>
        <div className="space-y-3">
          {props.recentLeads.map((lead) => (
            <div key={lead.id} className="rounded-2xl border border-white/10 bg-white/5 p-3">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <p className="text-sm font-semibold text-[#F5F3EE]">
                    {lead.fullName?.trim() || t("Sin nombre", "No name")}
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
                <p>{t("Celular", "Phone")}: {lead.phone ?? "-"}</p>
                <p>{t("Empresa", "Company")}: {lead.company ?? "-"}</p>
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
