import Link from "next/link";

import { RegisterForm } from "@/components/auth/register-form";

export default function RegisterPage() {
  return (
    <div className="space-y-5">
      <div>
        <h2 className="font-serif text-2xl text-[#F5F3EE]">Crear workspace</h2>
        <p className="text-sm text-[#B9B4A9]">Configura tu plataforma de cierre con IA.</p>
      </div>
      <RegisterForm />
      <p className="text-center text-sm text-[#B9B4A9]">
        ¿Ya tienes cuenta?{" "}
        <Link href="/sign-in" className="text-[#E5C76B] hover:text-[#F2D98E]">
          Iniciar sesión
        </Link>
      </p>
    </div>
  );
}
