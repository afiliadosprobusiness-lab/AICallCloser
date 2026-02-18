"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

import { useLocale } from "@/components/providers/locale-provider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function OnboardingWorkspaceForm({
  defaultName,
  defaultWorkspace,
}: {
  defaultName: string;
  defaultWorkspace: string;
}) {
  const router = useRouter();
  const { t } = useLocale();
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    const formData = new FormData(event.currentTarget);

    startTransition(async () => {
      const response = await fetch("/api/workspaces/bootstrap", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: String(formData.get("name") ?? ""),
          workspaceName: String(formData.get("workspaceName") ?? ""),
        }),
      });

      const result = (await response.json()) as {
        ok: boolean;
        error?: { message?: string };
      };

      if (!response.ok || !result.ok) {
        setError(result.error?.message ?? t("No se pudo crear tu workspace.", "Could not create your workspace."));
        return;
      }

      router.push("/dashboard");
      router.refresh();
    });
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="name">{t("Nombre", "Name")}</Label>
        <Input id="name" name="name" defaultValue={defaultName} required className="h-11 rounded-xl bg-white/5" />
      </div>

      <div className="space-y-2">
        <Label htmlFor="workspaceName">Workspace</Label>
        <Input
          id="workspaceName"
          name="workspaceName"
          defaultValue={defaultWorkspace}
          required
          className="h-11 rounded-xl bg-white/5"
        />
      </div>

      {error ? <p className="text-sm text-red-300">{error}</p> : null}

      <Button
        type="submit"
        disabled={isPending}
        className="h-11 w-full rounded-xl bg-[#C9A227] text-[#14110A] hover:bg-[#E5C76B]"
      >
        {isPending ? t("Preparando workspace...", "Preparing workspace...") : t("Continuar", "Continue")}
      </Button>
    </form>
  );
}
