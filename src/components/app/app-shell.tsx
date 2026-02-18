"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Activity,
  Bot,
  LayoutDashboard,
  Shield,
  PhoneCall,
  Settings,
  Users,
} from "lucide-react";

import { cn } from "@/lib/utils";
import { SignOutButton } from "@/components/app/sign-out-button";
import { WorkspaceSwitcher } from "@/components/app/workspace-switcher";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/leads", label: "Leads", icon: Users },
  { href: "/calls", label: "Calls", icon: PhoneCall },
  { href: "/agent", label: "Agente IA", icon: Bot },
  { href: "/settings", label: "Ajustes", icon: Settings },
];

const superAdminItem = { href: "/super-admin", label: "Super Admin", icon: Shield };

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
  const items = props.isSuperAdmin ? [superAdminItem] : navItems;

  return (
    <div className="mx-auto flex min-h-screen w-full max-w-[1440px] gap-4 p-3 pb-24 md:gap-6 md:p-6 md:pb-6">
      <aside className="premium-glass gold-sheen hidden w-[280px] shrink-0 rounded-3xl p-5 md:flex md:flex-col">
        <div className="mb-6">
          <p className="font-serif text-2xl text-[#F5F3EE]">AI Call Closer</p>
          <p className="text-sm text-[#B9B4A9]">Workspace premium de conversion</p>
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
            const active = pathname === item.href;

            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "premium-hover flex h-11 items-center gap-3 rounded-xl border px-3 text-sm",
                  active
                    ? "border-[#E5C76B]/50 bg-[#181818] text-[#F7F2E8]"
                    : "border-white/10 bg-[#141414]/70 text-[#C9C5BB] hover:text-[#F5F3EE]",
                )}
              >
                <Icon className="h-4 w-4" />
                {item.label}
              </Link>
            );
          })}
        </nav>
        <div className="space-y-3 border-t border-white/10 pt-4">
          <div className="flex items-center gap-2 rounded-xl border border-[#E5C76B]/20 bg-white/5 p-3">
            <Activity className="h-4 w-4 text-[#E5C76B]" />
            <div>
              <p className="text-xs text-[#B9B4A9]">Operador</p>
              <p className="text-sm text-[#F5F3EE]">{props.userName}</p>
            </div>
          </div>
          <SignOutButton />
        </div>
      </aside>

      <main className="w-full flex-1">
        <div className="premium-glass mb-4 flex items-center gap-3 rounded-2xl p-3 md:hidden">
          <div className="flex-1">
            {!props.isSuperAdmin ? (
              <WorkspaceSwitcher
                workspaces={props.workspaces}
                activeWorkspaceId={props.activeWorkspaceId}
              />
            ) : null}
          </div>
          <SignOutButton />
        </div>
        {props.children}
      </main>

      <nav className="premium-glass fixed inset-x-3 bottom-3 z-40 rounded-2xl p-2 md:hidden">
        <ul
          className={cn("grid gap-2", items.length === 1 ? "grid-cols-1" : "grid-cols-5")}
        >
          {items.map((item) => {
            const Icon = item.icon;
            const active = pathname === item.href;

            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={cn(
                    "flex min-h-11 flex-col items-center justify-center rounded-xl border text-[11px] leading-tight",
                    active
                      ? "border-[#E5C76B]/50 bg-[#171717] text-[#F5F3EE]"
                      : "border-transparent text-[#B9B4A9]",
                  )}
                >
                  <Icon className="mb-1 h-4 w-4" />
                  {item.label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </div>
  );
}
