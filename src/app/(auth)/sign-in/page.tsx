import Link from "next/link";

import { SignInForm } from "@/components/auth/sign-in-form";

export default function SignInPage() {
  return (
    <div className="space-y-5">
      <div>
        <h2 className="font-serif text-2xl text-[#F5F3EE]">Acceder</h2>
        <p className="text-sm text-[#B9B4A9]">Ingresa a tu workspace premium.</p>
      </div>
      <SignInForm />
      <p className="text-center text-sm text-[#B9B4A9]">
        ¿No tienes cuenta?{" "}
        <Link href="/register" className="text-[#E5C76B] hover:text-[#F2D98E]">
          Crear cuenta
        </Link>
      </p>
    </div>
  );
}
