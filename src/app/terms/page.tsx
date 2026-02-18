import Link from "next/link";

import { translate } from "@/lib/i18n/config";
import { getRequestLocale } from "@/lib/i18n/server";

export default async function TermsPage() {
  const locale = await getRequestLocale();
  const t = (esText: string, enText: string) => translate(locale, esText, enText);

  return (
    <main className="mx-auto min-h-screen w-full max-w-4xl px-5 py-10 md:px-8">
      <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-6 md:p-8">
        <h1 className="font-serif text-3xl text-[#F5F3EE]">{t("Terminos del Servicio", "Terms of Service")}</h1>
        <p className="mt-3 text-sm text-[#B9B4A9]">
          {t(
            "Estos terminos regulan el uso de AI Call Closer por parte de clientes B2B.",
            "These terms govern the use of AI Call Closer by B2B customers.",
          )}
        </p>

        <div className="mt-6 space-y-5 text-sm leading-relaxed text-[#D4CFC3]">
          <section>
            <h2 className="text-base font-semibold text-[#F5F3EE]">{t("Uso permitido", "Permitted use")}</h2>
            <p>
              {t(
                "El servicio debe usarse para operaciones comerciales legales y cumpliendo regulaciones locales de llamadas y privacidad.",
                "The service must be used for lawful commercial operations and in compliance with local calling and privacy regulations.",
              )}
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-[#F5F3EE]">{t("Cuenta y acceso", "Account and access")}</h2>
            <p>
              {t(
                "Cada cliente es responsable de sus credenciales, configuracion y actividad dentro de su workspace.",
                "Each customer is responsible for credentials, configuration, and activity within their workspace.",
              )}
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-[#F5F3EE]">{t("Disponibilidad", "Availability")}</h2>
            <p>
              {t(
                "Buscamos alta disponibilidad, pero pueden existir mantenimientos programados o interrupciones por terceros proveedores.",
                "We aim for high availability, but scheduled maintenance or third-party provider interruptions may occur.",
              )}
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-[#F5F3EE]">{t("Contacto legal", "Legal contact")}</h2>
            <p>afiliadosprobusiness@gmail.com</p>
          </section>
        </div>

        <div className="mt-8">
          <Link href="/" className="text-sm text-[#E5C76B] hover:text-[#F2D98E]">
            {t("Volver al inicio", "Back to home")}
          </Link>
        </div>
      </div>
    </main>
  );
}
