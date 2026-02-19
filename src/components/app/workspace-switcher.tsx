"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

import { useLocale } from "@/components/providers/locale-provider";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type WorkspaceOption = {
  id: string;
  name: string;
  role: string;
};

export function WorkspaceSwitcher(props: {
  workspaces: WorkspaceOption[];
  activeWorkspaceId: string | null;
}) {
  const router = useRouter();
  const { t } = useLocale();
  const [value, setValue] = useState(props.activeWorkspaceId ?? props.workspaces[0]?.id ?? "");
  const [isPending, startTransition] = useTransition();

  if (props.workspaces.length === 0) {
    return null;
  }

  function onChange(nextValue: string) {
    setValue(nextValue);

    startTransition(async () => {
      await fetch("/api/workspaces/active", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ workspaceId: nextValue }),
      });

      router.refresh();
    });
  }

  return (
    <Select value={value} onValueChange={onChange} disabled={isPending}>
      <SelectTrigger className="h-10 w-full min-w-0 rounded-xl border-[#E5C76B]/30 bg-[#121212]/80 text-[#F5F3EE]">
        <SelectValue placeholder={t("Selecciona workspace", "Select workspace")} />
      </SelectTrigger>
      <SelectContent className="border-[#E5C76B]/20 bg-[#141414] text-[#F5F3EE]">
        {props.workspaces.map((workspace) => (
          <SelectItem key={workspace.id} value={workspace.id}>
            {workspace.name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
