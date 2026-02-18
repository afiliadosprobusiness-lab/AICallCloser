import Link from "next/link";

import { translate } from "@/lib/i18n/config";
import { getRequestLocale } from "@/lib/i18n/server";

export default async function PrivacyPage() {
  const locale = await getRequestLocale();
  const t = (esText: string, enText: string) => translate(locale, esText, enText);

  return (
    <main className="mx-auto min-h-screen w-full max-w-4xl px-5 py-10 md:px-8">
      <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-6 md:p-8">
        <h1 className="font-serif text-3xl text-[#F5F3EE]">{t("Politica de Privacidad", "Privacy Policy")}</h1>
        <p className="mt-3 text-sm text-[#B9B4A9]">
          {t(
            "AI Call Closer es operado por Afiliados Pro Business Lab. Esta politica describe como recopilamos, usamos y protegemos datos.",
            "AI Call Closer is operated by Afiliados Pro Business Lab. This policy describes how we collect, use and protect data.",
          )}
        </p>

        <div className="mt-6 space-y-5 text-sm leading-relaxed text-[#D4CFC3]">
          <section>
            <h2 className="text-base font-semibold text-[#F5F3EE]">{t("Datos que recopilamos", "Data we collect")}</h2>
            <p>
              {t(
                "Recopilamos datos de cuenta (nombre, correo), datos operativos (leads, llamadas, transcripciones) y configuracion de workspace para prestar el servicio.",
                "We collect account data (name, email), operational data (leads, calls, transcripts), and workspace settings to provide the service.",
              )}
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-[#F5F3EE]">{t("Uso de la informacion", "Use of information")}</h2>
            <p>
              {t(
                "Usamos la informacion para autenticar usuarios, operar el agente de llamadas, mejorar rendimiento y brindar soporte.",
                "We use information to authenticate users, operate the call agent, improve performance, and provide support.",
              )}
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-[#F5F3EE]">{t("Seguridad", "Security")}</h2>
            <p>
              {t(
                "Aplicamos controles de acceso por workspace, cifrado en transito y almacenamiento en infraestructura cloud administrada.",
                "We apply workspace-level access controls, in-transit encryption, and storage on managed cloud infrastructure.",
              )}
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-[#F5F3EE]">{t("Contacto", "Contact")}</h2>
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
