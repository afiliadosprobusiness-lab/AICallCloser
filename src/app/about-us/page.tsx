import Link from "next/link";

import { translate } from "@/lib/i18n/config";
import { getRequestLocale } from "@/lib/i18n/server";

export default async function AboutUsPage() {
  const locale = await getRequestLocale();
  const t = (esText: string, enText: string) => translate(locale, esText, enText);

  return (
    <main className="mx-auto min-h-screen w-full max-w-4xl px-5 py-10 md:px-8">
      <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-6 md:p-8">
        <h1 className="font-serif text-3xl text-[#F5F3EE]">{t("Quienes Somos", "About Us")}</h1>
        <p className="mt-3 text-sm text-[#B9B4A9]">
          {t(
            "AI Call Closer es una plataforma de Afiliados Pro Business Lab enfocada en automatizar llamadas comerciales con IA para empresas B2B.",
            "AI Call Closer is a platform by Afiliados Pro Business Lab focused on automating sales calls with AI for B2B companies.",
          )}
        </p>

        <div className="mt-6 space-y-5 text-sm leading-relaxed text-[#D4CFC3]">
          <section>
            <h2 className="text-base font-semibold text-[#F5F3EE]">{t("Nuestra mision", "Our mission")}</h2>
            <p>
              {t(
                "Ayudar a inmobiliarias, clinicas y servicios profesionales a no perder oportunidades por llamadas no atendidas.",
                "Help real estate agencies, clinics, and professional services avoid losing opportunities due to missed calls.",
              )}
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-[#F5F3EE]">{t("Que hacemos", "What we do")}</h2>
            <p>
              {t(
                "Implementamos agentes de voz con IA que atienden, califican leads, agendan citas y transfieren a humanos cuando hay alta intencion de cierre.",
                "We implement AI voice agents that answer, qualify leads, schedule appointments, and hand off to humans when there is high closing intent.",
              )}
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-[#F5F3EE]">{t("Contacto comercial", "Business contact")}</h2>
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
