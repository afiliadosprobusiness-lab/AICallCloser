"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Activity,
  Bot,
  LayoutDashboard,
  Shield,
  PhoneCall,
  Settings,
  Users,
} from "lucide-react";

import { LanguageToggle } from "@/components/language-toggle";
import { BrandMark } from "@/components/brand/brand-mark";
import { useLocale } from "@/components/providers/locale-provider";
import { SignOutButton } from "@/components/app/sign-out-button";
import { WorkspaceSwitcher } from "@/components/app/workspace-switcher";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/dashboard", labelEs: "Dashboard", labelEn: "Dashboard", icon: LayoutDashboard },
  { href: "/leads", labelEs: "Leads", labelEn: "Leads", icon: Users },
  { href: "/calls", labelEs: "Llamadas", labelEn: "Calls", icon: PhoneCall },
  { href: "/agent", labelEs: "Agente IA", labelEn: "AI Agent", icon: Bot },
  { href: "/settings", labelEs: "Ajustes", labelEn: "Settings", icon: Settings },
];

const superAdminItem = {
  href: "/super-admin",
  labelEs: "Super Admin",
  labelEn: "Super Admin",
  icon: Shield,
};

type WorkspaceOption = {
  id: string;
  name: string;
  role: string;
};

export function AppShell(props: {
  children: React.ReactNode;
  userName: string;
  workspaces: WorkspaceOption[];
  activeWorkspaceId: string | null;
  isSuperAdmin?: boolean;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const { t } = useLocale();
  const [pendingPath, setPendingPath] = useState<string | null>(null);
  const items = useMemo(
    () => (props.isSuperAdmin ? [superAdminItem] : navItems),
    [props.isSuperAdmin],
  );
  const optimisticPath = pendingPath && pendingPath !== pathname ? pendingPath : null;

  useEffect(() => {
    for (const item of items) {
      router.prefetch(item.href);
    }
  }, [items, router]);

  function markPending(href: string) {
    setPendingPath(href);
    router.prefetch(href);
  }

  function isActive(href: string) {
    return pathname === href || optimisticPath === href;
  }

  return (
    <div className="mx-auto flex min-h-screen w-full max-w-[1440px] gap-4 overflow-x-clip p-3 pb-24 md:gap-6 md:p-6 md:pb-6">
      <aside className="premium-glass gold-sheen hidden w-[280px] shrink-0 rounded-3xl p-5 md:flex md:flex-col">
        <div className="mb-6">
          <div className="mb-3 flex justify-end">
            <LanguageToggle compact />
          </div>
          <div className="mb-2 flex items-center gap-3">
            <BrandMark className="h-10 w-10" />
            <p className="font-serif text-2xl text-[#F5F3EE]">AI Call Closer</p>
          </div>
          <p className="text-sm text-[#B9B4A9]">
            {t("Workspace premium de conversion", "Premium conversion workspace")}
          </p>
        </div>
        {!props.isSuperAdmin ? (
          <WorkspaceSwitcher
            workspaces={props.workspaces}
            activeWorkspaceId={props.activeWorkspaceId}
          />
        ) : null}
        <nav className="mt-6 flex flex-1 flex-col gap-2">
          {items.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.href);

            return (
              <Link
                key={item.href}
                href={item.href}
                prefetch
                onClick={() => markPending(item.href)}
                onMouseEnter={() => router.prefetch(item.href)}
                onFocus={() => router.prefetch(item.href)}
                onTouchStart={() => router.prefetch(item.href)}
                className={cn(
                  "premium-hover flex h-11 items-center gap-3 rounded-xl border px-3 text-sm",
                  active
                    ? "border-[#E5C76B]/50 bg-[#181818] text-[#F7F2E8]"
                    : "border-white/10 bg-[#141414]/70 text-[#C9C5BB] hover:text-[#F5F3EE]",
                )}
              >
                <Icon className="h-4 w-4" />
                {t(item.labelEs, item.labelEn)}
              </Link>
            );
          })}
        </nav>
        <div className="space-y-3 border-t border-white/10 pt-4">
          <div className="flex items-center gap-2 rounded-xl border border-[#E5C76B]/20 bg-white/5 p-3">
            <Activity className="h-4 w-4 text-[#E5C76B]" />
            <div>
              <p className="text-xs text-[#B9B4A9]">{t("Operador", "Operator")}</p>
              <p className="text-sm text-[#F5F3EE]">{props.userName}</p>
            </div>
          </div>
          <SignOutButton />
        </div>
      </aside>

      <main className="w-full min-w-0 flex-1">
        <div className="premium-glass mb-4 space-y-2 rounded-2xl p-3 md:hidden">
          <div className="flex items-center justify-between gap-2">
            <LanguageToggle compact />
            <SignOutButton compact />
          </div>
          {!props.isSuperAdmin ? (
            <div className="min-w-0">
              <WorkspaceSwitcher
                workspaces={props.workspaces}
                activeWorkspaceId={props.activeWorkspaceId}
              />
            </div>
          ) : null}
        </div>
        {props.children}
      </main>

      <nav className="premium-glass fixed inset-x-2 bottom-2 z-40 rounded-2xl p-1.5 pb-[max(0.375rem,env(safe-area-inset-bottom))] md:hidden sm:inset-x-3 sm:bottom-3 sm:p-2">
        <ul className={cn("grid gap-1.5 sm:gap-2", items.length === 1 ? "grid-cols-1" : "grid-cols-5")}>
          {items.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.href);

            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  prefetch
                  onClick={() => markPending(item.href)}
                  onMouseEnter={() => router.prefetch(item.href)}
                  onFocus={() => router.prefetch(item.href)}
                  onTouchStart={() => router.prefetch(item.href)}
                  className={cn(
                    "flex min-h-11 min-w-0 flex-col items-center justify-center rounded-xl border px-1 text-[10px] leading-tight sm:text-[11px]",
                    active
                      ? "border-[#E5C76B]/50 bg-[#171717] text-[#F5F3EE]"
                      : "border-transparent text-[#B9B4A9]",
                  )}
                >
                  <Icon className="mb-1 h-4 w-4" />
                  <span className="truncate">{t(item.labelEs, item.labelEn)}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </div>
  );
}
