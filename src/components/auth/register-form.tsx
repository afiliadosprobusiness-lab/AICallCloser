"use client";

import { useState, useTransition } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function RegisterForm() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    const formData = new FormData(event.currentTarget);

    startTransition(async () => {
      const payload = {
        name: String(formData.get("name") ?? ""),
        email: String(formData.get("email") ?? ""),
        password: String(formData.get("password") ?? ""),
        workspaceName: String(formData.get("workspaceName") ?? ""),
      };

      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const result = (await response.json()) as {
        ok: boolean;
        error?: { message?: string };
      };

      if (!response.ok || !result.ok) {
        setError(result.error?.message ?? "No se pudo crear la cuenta.");
        return;
      }

      await signIn("credentials", {
        email: payload.email,
        password: payload.password,
        redirect: false,
      });

      router.push("/dashboard");
      router.refresh();
    });
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="name">Nombre</Label>
        <Input id="name" name="name" required className="h-11 rounded-xl bg-white/5" />
      </div>
      <div className="space-y-2">
        <Label htmlFor="workspaceName">Workspace</Label>
        <Input
          id="workspaceName"
          name="workspaceName"
          required
          className="h-11 rounded-xl bg-white/5"
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          name="email"
          type="email"
          required
          className="h-11 rounded-xl bg-white/5"
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="password">Password</Label>
        <Input
          id="password"
          name="password"
          type="password"
          required
          minLength={8}
          className="h-11 rounded-xl bg-white/5"
        />
      </div>
      {error ? <p className="text-sm text-red-300">{error}</p> : null}
      <Button
        type="submit"
        disabled={isPending}
        className="h-11 w-full rounded-xl bg-[#C9A227] text-[#14110A] hover:bg-[#E5C76B]"
      >
        {isPending ? "Creando cuenta..." : "Crear cuenta"}
      </Button>
    </form>
  );
}
