"use client";

import { useRef, type ComponentType } from "react";
import { motion } from "framer-motion";
import { ArrowRight, Building2, Hammer, Home, Stethoscope } from "lucide-react";

import type { DemoObjective, LiveDemoPrefillContext } from "@/components/landing/live-chat-to-call-demo-section";
import type { LeadChatGoal, LeadChatPrefillContext } from "@/components/landing/lead-chat-public-widget";
import { useLocale } from "@/components/providers/locale-provider";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

type UseCaseCard = {
  id: string;
  titleEn: string;
  titleEs: string;
  descriptionEn: string;
  descriptionEs: string;
  ctaEn: string;
  ctaEs: string;
  industryEn: string;
  industryEs: string;
  goalEn: string;
  goalEs: string;
  openingMessageEn: string;
  openingMessageEs: string;
  objective: DemoObjective;
  leadGoal: LeadChatGoal;
  icon: ComponentType<{ className?: string }>;
};

export type UseCaseSelectionPayload = {
  liveDemoPrefill: LiveDemoPrefillContext;
  leadChatPrefill: LeadChatPrefillContext;
};

type UseCasesSectionProps = {
  onSelectUseCase: (payload: UseCaseSelectionPayload) => void;
};

const CARDS: UseCaseCard[] = [
  {
    id: "roofing",
    titleEn: "Roofing / Home Services",
    titleEs: "Roofing / Servicios del Hogar",
    descriptionEn: "Answer missed calls fast and turn estimate requests into booked inspections.",
    descriptionEs: "Responde llamadas perdidas y convierte solicitudes de cotizacion en inspecciones agendadas.",
    ctaEn: "Launch roofing demo",
    ctaEs: "Lanzar demo roofing",
    industryEn: "Roofing services in the US",
    industryEs: "Servicios de roofing en USA",
    goalEn: "book more inspections this week",
    goalEs: "agendar mas inspecciones esta semana",
    openingMessageEn: "Hi, I run a roofing business and want more booked inspections this week.",
    openingMessageEs: "Hola, tengo un negocio de roofing y quiero mas inspecciones agendadas esta semana.",
    objective: "schedule_call",
    leadGoal: "appointments",
    icon: Hammer,
  },
  {
    id: "dental",
    titleEn: "Dental Clinics",
    titleEs: "Clinicas Dentales",
    descriptionEn: "Qualify patient calls instantly and fill open chair slots every day.",
    descriptionEs: "Califica llamadas de pacientes al instante y llena espacios disponibles todos los dias.",
    ctaEn: "Launch dental demo",
    ctaEs: "Lanzar demo dental",
    industryEn: "Dental clinic operations",
    industryEs: "Operacion de clinica dental",
    goalEn: "book more consultations this month",
    goalEs: "agendar mas consultas este mes",
    openingMessageEn: "Hi, I own a dental clinic and I want to book more consultations this month.",
    openingMessageEs: "Hola, tengo una clinica dental y quiero agendar mas consultas este mes.",
    objective: "book_google_meet",
    leadGoal: "appointments",
    icon: Stethoscope,
  },
  {
    id: "legal",
    titleEn: "Legal Firms",
    titleEs: "Firmas Legales",
    descriptionEn: "Capture urgent inbound cases and route high-intent prospects to your team.",
    descriptionEs: "Captura casos urgentes y enruta prospectos de alta intencion al equipo legal.",
    ctaEn: "Launch legal demo",
    ctaEs: "Lanzar demo legal",
    industryEn: "Legal services firm",
    industryEs: "Firma de servicios legales",
    goalEn: "qualify urgent cases and book consultations",
    goalEs: "calificar casos urgentes y agendar consultas",
    openingMessageEn: "Hi, we are a legal firm and want to qualify urgent cases without losing calls.",
    openingMessageEs: "Hola, somos una firma legal y queremos calificar casos urgentes sin perder llamadas.",
    objective: "simulate_sale",
    leadGoal: "close_deals",
    icon: Building2,
  },
  {
    id: "real-estate",
    titleEn: "Real Estate",
    titleEs: "Bienes Raices",
    descriptionEn: "Convert listing inquiries into tours and move buyer intent faster to close.",
    descriptionEs: "Convierte consultas por propiedades en visitas y acelera la intencion de compra al cierre.",
    ctaEn: "Launch real estate demo",
    ctaEs: "Lanzar demo real estate",
    industryEn: "Real estate brokerage",
    industryEs: "Brokerage inmobiliario",
    goalEn: "book more property tours this month",
    goalEs: "agendar mas visitas a propiedades este mes",
    openingMessageEn: "Hi, we are a real estate team and want to book more qualified property tours.",
    openingMessageEs: "Hola, somos un equipo inmobiliario y queremos mas visitas calificadas a propiedades.",
    objective: "schedule_call",
    leadGoal: "appointments",
    icon: Home,
  },
];

const fadeUp = {
  hidden: { opacity: 0, y: 18 },
  show: { opacity: 1, y: 0 },
};

export function UseCasesSection(props: UseCasesSectionProps) {
  const { locale, t } = useLocale();
  const seedRef = useRef(0);

  function handleSelect(card: UseCaseCard) {
    seedRef.current += 1;
    const seed = `${card.id}-${seedRef.current}`;

    props.onSelectUseCase({
      liveDemoPrefill: {
        seed,
        leadName: "Diego",
        phone: "+1 305 555 0123",
        demoObjective: card.objective,
        industryEn: card.industryEn,
        industryEs: card.industryEs,
        goalEn: card.goalEn,
        goalEs: card.goalEs,
        openingMessageEn: card.openingMessageEn,
        openingMessageEs: card.openingMessageEs,
      },
      leadChatPrefill: {
        seed,
        goal: card.leadGoal,
        demoObjective: card.objective,
        name: "Diego",
        business: locale === "en" ? card.industryEn : card.industryEs,
        phoneE164: "+13055550123",
        openingMessageEn: card.openingMessageEn,
        openingMessageEs: card.openingMessageEs,
      },
    });
  }

  return (
    <section className="scroll-mt-28 px-1 pb-16" aria-labelledby="use-cases-title">
      <div className="mb-6 text-center">
        <p className="text-xs uppercase tracking-[0.16em] text-white/55">
          {t("Use Cases", "Use Cases")}
        </p>
        <h2 id="use-cases-title" className="mt-3 text-3xl font-semibold text-white sm:text-4xl">
          {t("Casos listos para tu industria", "Built for your industry")}
        </h2>
        <p className="mx-auto mt-3 max-w-3xl text-sm leading-relaxed text-white/70 sm:text-base">
          {t(
            "Selecciona tu vertical y lanza una demo personalizada del embudo Chat -> Llamada IA -> Cierre.",
            "Pick your vertical and launch a personalized Chat -> AI Call -> Close demo.",
          )}
        </p>
      </div>

      <div className="grid grid-cols-1 gap-3 min-[390px]:grid-cols-2 lg:grid-cols-4">
        {CARDS.map((card, index) => {
          const Icon = card.icon;
          return (
            <motion.div
              key={card.id}
              variants={fadeUp}
              initial="hidden"
              whileInView="show"
              viewport={{ once: true, amount: 0.25 }}
              transition={{ duration: 0.45, delay: index * 0.05 }}
            >
              <Card className="group h-full border-white/12 bg-white/[0.03] transition-all duration-250 hover:border-[#6F8BFF]/45 hover:shadow-[0_0_28px_rgba(84,111,255,0.25)]">
                <CardContent className="flex h-full flex-col p-4 sm:p-5">
                  <span className="mb-4 inline-flex h-10 w-10 items-center justify-center rounded-lg border border-white/15 bg-white/[0.03] text-[#96AEFF]">
                    <Icon className="h-5 w-5" />
                  </span>

                  <h3 className="text-base font-semibold text-white sm:text-lg">
                    {locale === "en" ? card.titleEn : card.titleEs}
                  </h3>
                  <p className="mt-2 flex-1 text-sm leading-relaxed text-white/70">
                    {locale === "en" ? card.descriptionEn : card.descriptionEs}
                  </p>

                  <Button
                    type="button"
                    variant="ghost"
                    className="mt-4 h-auto min-h-10 w-full border border-white/15 bg-white/[0.03] px-2.5 py-2 text-[11px] leading-tight whitespace-normal text-white/85 transition-all duration-250 group-hover:border-[#7A92FF]/55 group-hover:bg-[#233667]/38 group-hover:text-white sm:text-sm"
                    onClick={() => handleSelect(card)}
                  >
                    <span className="block text-center">{locale === "en" ? card.ctaEn : card.ctaEs}</span>
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </div>
    </section>
  );
}
