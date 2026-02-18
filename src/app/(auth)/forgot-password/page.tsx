import Link from "next/link";

import { ForgotPasswordForm } from "@/components/auth/forgot-password-form";
import { Button } from "@/components/ui/button";

export default function ForgotPasswordPage() {
  return (
    <div className="space-y-5">
      <div className="flex justify-start">
        <Button
          asChild
          variant="ghost"
          className="h-9 rounded-lg border border-white/10 bg-white/[0.03] px-3 text-[#CFCBC1] hover:bg-white/[0.08] hover:text-[#F5F3EE]"
        >
          <Link href="/sign-in">Volver a iniciar sesión</Link>
        </Button>
      </div>

      <div>
        <h2 className="font-serif text-2xl text-[#F5F3EE]">Recuperar contraseña</h2>
        <p className="text-sm text-[#B9B4A9]">
          Ingresa tu email y te enviamos un enlace para restablecer acceso.
        </p>
      </div>

      <ForgotPasswordForm />
    </div>
  );
}
