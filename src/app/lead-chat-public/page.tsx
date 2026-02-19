"use client";

import Link from "next/link";

import { BrandMark } from "@/components/brand/brand-mark";
import { LanguageToggle } from "@/components/language-toggle";
import { ThemeToggle } from "@/components/theme-toggle";
import { LeadChatPublicWidget } from "@/components/landing/lead-chat-public-widget";
import { useLocale } from "@/components/providers/locale-provider";

export default function LeadChatPublicPage() {
  const { t } = useLocale();

  return (
    <div className="relative min-h-screen overflow-x-clip bg-[#0B0F19] text-white">
      <div className="pointer-events-none absolute inset-0 [background:radial-gradient(38rem_38rem_at_14%_16%,rgba(72,94,255,0.18),transparent),radial-gradient(32rem_32rem_at_86%_12%,rgba(147,80,255,0.16),transparent),linear-gradient(to_bottom,#0B0F19,#0B0F19)]" />
      <div className="relative z-10 mx-auto w-full max-w-4xl px-5 pb-14 pt-5">
        <header className="mb-7 flex items-center justify-between rounded-2xl border border-white/12 bg-[#0F1527]/88 px-4 py-3 backdrop-blur-xl">
          <Link href="/" className="inline-flex items-center gap-3">
            <BrandMark className="h-8 w-8" />
            <span className="text-sm font-semibold text-white/95 md:text-base">AI Call Closer</span>
          </Link>
          <div className="flex items-center gap-2">
            <ThemeToggle compact />
            <LanguageToggle compact />
          </div>
        </header>

        <div className="mb-6 text-center">
          <p className="text-xs uppercase tracking-[0.16em] text-white/50">
            {t("Lead Chat en vivo", "Live Lead Chat")}
          </p>
          <h1 className="mt-3 text-3xl font-semibold text-white sm:text-4xl">
            {t("Precalifica y activa llamada IA en minutos", "Pre-qualify and trigger AI call in minutes")}
          </h1>
          <p className="mx-auto mt-3 max-w-2xl text-sm text-white/70 sm:text-base">
            {t(
              "Conversacion guiada para capturar objetivo, datos del lead y consentimiento en un solo flujo.",
              "Guided conversation to capture objective, lead details, and consent in one flow.",
            )}
          </p>
        </div>

        <LeadChatPublicWidget />
      </div>
    </div>
  );
}
