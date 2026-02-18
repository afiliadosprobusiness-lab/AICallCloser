"use client";

import Link from "next/link";
import { Eye, EyeOff } from "lucide-react";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

import { useLocale } from "@/components/providers/locale-provider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type ResetPasswordResponse = {
  ok: boolean;
  data?: {
    message?: string;
  };
  error?: {
    message?: string;
  };
};

export function ResetPasswordForm({ token }: { token: string | null }) {
  const router = useRouter();
  const { t } = useLocale();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setMessage(null);

    if (!token) {
      setError(t("Token invalido. Solicita un nuevo enlace.", "Invalid token. Request a new link."));
      return;
    }

    const formData = new FormData(event.currentTarget);
    const password = String(formData.get("password") ?? "");
    const confirmPassword = String(formData.get("confirmPassword") ?? "");

    if (password !== confirmPassword) {
      setError(t("Las contrasenas no coinciden.", "Passwords do not match."));
      return;
    }

    startTransition(async () => {
      const response = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password, confirmPassword }),
      });

      const result = (await response.json().catch(() => null)) as ResetPasswordResponse | null;

      if (!response.ok || !result?.ok) {
        setError(result?.error?.message ?? t("No se pudo restablecer la contrasena.", "Could not reset password."));
        return;
      }

      setMessage(result.data?.message ?? t("Contrasena actualizada.", "Password updated."));
      setTimeout(() => {
        router.push("/sign-in");
        router.refresh();
      }, 900);
    });
  }

  if (!token) {
    return (
      <div className="space-y-4">
        <p className="text-sm text-red-300">
          {t("El enlace no es valido. Solicita una nueva recuperacion de contrasena.", "The link is invalid. Request a new password recovery link.")}
        </p>
        <Button
          asChild
          variant="ghost"
          className="h-10 w-full rounded-xl border border-white/15 bg-white/[0.04] text-[#ECE8DE] hover:bg-white/[0.08]"
        >
          <Link href="/forgot-password">{t("Solicitar nuevo enlace", "Request a new link")}</Link>
        </Button>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="password">{t("Nueva contrasena", "New password")}</Label>
        <div className="relative">
          <Input
            id="password"
            name="password"
            type={showPassword ? "text" : "password"}
            autoComplete="new-password"
            required
            minLength={8}
            className="h-11 rounded-xl bg-white/5 pr-11"
          />
          <button
            type="button"
            onClick={() => setShowPassword((value) => !value)}
            className="absolute right-2 top-1/2 inline-flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-lg border border-transparent text-[#B9B4A9] transition-all duration-200 hover:border-[#7595FF]/35 hover:bg-[#5E94FF]/10 hover:text-[#F5F3EE] active:scale-[0.97]"
            aria-label={showPassword ? t("Ocultar contrasena", "Hide password") : t("Mostrar contrasena", "Show password")}
          >
            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="confirmPassword">{t("Confirmar contrasena", "Confirm password")}</Label>
        <div className="relative">
          <Input
            id="confirmPassword"
            name="confirmPassword"
            type={showConfirmPassword ? "text" : "password"}
            autoComplete="new-password"
            required
            minLength={8}
            className="h-11 rounded-xl bg-white/5 pr-11"
          />
          <button
            type="button"
            onClick={() => setShowConfirmPassword((value) => !value)}
            className="absolute right-2 top-1/2 inline-flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-lg border border-transparent text-[#B9B4A9] transition-all duration-200 hover:border-[#7595FF]/35 hover:bg-[#5E94FF]/10 hover:text-[#F5F3EE] active:scale-[0.97]"
            aria-label={showConfirmPassword ? t("Ocultar contrasena", "Hide password") : t("Mostrar contrasena", "Show password")}
          >
            {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>
      </div>

      {error ? <p className="text-sm text-red-300">{error}</p> : null}
      {message ? <p className="text-sm text-emerald-300">{message}</p> : null}

      <div className="iridescent-border rounded-xl">
        <Button
          type="submit"
          disabled={isPending}
          className="iridescent-surface h-11 w-full rounded-xl bg-gradient-to-r from-[#C9A227] via-[#E4C667] to-[#F0D98F] text-[#14110A] hover:brightness-105"
        >
          {isPending ? t("Guardando...", "Saving...") : t("Actualizar contrasena", "Update password")}
        </Button>
      </div>
    </form>
  );
}
