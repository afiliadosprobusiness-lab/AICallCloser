"use client";

import Link from "next/link";
import { Eye, EyeOff } from "lucide-react";
import { useState, useTransition } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";

import { GoogleAuthButton } from "@/components/auth/google-auth-button";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function SignInForm() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    const formData = new FormData(event.currentTarget);

    startTransition(async () => {
      const result = await signIn("credentials", {
        email: String(formData.get("email") ?? ""),
        password: String(formData.get("password") ?? ""),
        redirect: false,
      });

      if (result?.error) {
        setError("Credenciales invalidas.");
        return;
      }

      router.push("/dashboard");
      router.refresh();
    });
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <GoogleAuthButton callbackUrl="/dashboard" label="Continuar con Google" />

      <div className="relative py-1">
        <div className="h-px w-full bg-white/10" />
        <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-[#111111]/80 px-2 text-[11px] uppercase tracking-[0.14em] text-[#9D988D]">
          o con email
        </span>
      </div>

      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          required
          className="h-11 rounded-xl bg-white/5"
        />
      </div>
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label htmlFor="password">Password</Label>
          <Link href="/forgot-password" className="text-xs text-[#E5C76B] hover:text-[#F2D98E]">
            Recuperar contraseña
          </Link>
        </div>
        <div className="relative">
          <Input
            id="password"
            name="password"
            type={showPassword ? "text" : "password"}
            autoComplete="current-password"
            required
            minLength={8}
            className="h-11 rounded-xl bg-white/5 pr-11"
          />
          <button
            type="button"
            onClick={() => setShowPassword((value) => !value)}
            className="absolute right-2 top-1/2 inline-flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-lg border border-transparent text-[#B9B4A9] transition-all duration-200 hover:border-[#7595FF]/35 hover:bg-[#5E94FF]/10 hover:text-[#F5F3EE] active:scale-[0.97]"
            aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
          >
            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>
      </div>
      {error ? <p className="text-sm text-red-300">{error}</p> : null}
      <div className="iridescent-border rounded-xl">
        <Button
          type="submit"
          disabled={isPending}
          className="iridescent-surface h-11 w-full rounded-xl bg-gradient-to-r from-[#C9A227] via-[#E4C667] to-[#F0D98F] text-[#14110A] hover:brightness-105"
        >
          {isPending ? "Ingresando..." : "Entrar"}
        </Button>
      </div>
    </form>
  );
}
