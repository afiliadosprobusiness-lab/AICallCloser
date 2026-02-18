"use client";

import { useState, useTransition } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type ForgotPasswordResponse = {
  ok: boolean;
  data?: {
    message?: string;
    delivered?: boolean;
  };
  error?: {
    message?: string;
  };
};

export function ForgotPasswordForm() {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setMessage(null);
    const formData = new FormData(event.currentTarget);

    startTransition(async () => {
      const response = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: String(formData.get("email") ?? "").trim(),
        }),
      });

      const result = (await response.json().catch(() => null)) as ForgotPasswordResponse | null;

      if (!response.ok || !result?.ok) {
        setError(result?.error?.message ?? "No se pudo procesar la solicitud.");
        return;
      }

      setMessage(
        result.data?.message ??
          "Si tu correo existe en el sistema, recibirás un enlace de recuperación.",
      );
    });
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          required
          className="h-11 rounded-xl bg-white/5"
          placeholder="tu@email.com"
        />
      </div>
      {error ? <p className="text-sm text-red-300">{error}</p> : null}
      {message ? <p className="text-sm text-emerald-300">{message}</p> : null}
      <div className="iridescent-border rounded-xl">
        <Button
          type="submit"
          disabled={isPending}
          className="iridescent-surface h-11 w-full rounded-xl bg-gradient-to-r from-[#C9A227] via-[#E4C667] to-[#F0D98F] text-[#14110A] hover:brightness-105"
        >
          {isPending ? "Enviando..." : "Enviar enlace de recuperación"}
        </Button>
      </div>
    </form>
  );
}
