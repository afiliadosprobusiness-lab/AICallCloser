"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";
import { Bot, CheckCircle2, Clock3, PhoneCall, Sparkles } from "lucide-react";

import { useLocale } from "@/components/providers/locale-provider";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export type DemoObjective = "book_google_meet" | "schedule_call" | "simulate_sale";

export type DemoLeadPayload = {
  name: string;
  business: string;
  phone: string;
  objective: DemoObjective;
  consentCall: true;
  consentFollowUp: boolean;
};

export type LiveDemoPrefillContext = {
  seed: string;
  leadName: string;
  phone: string;
  demoObjective: DemoObjective;
  industryEn: string;
  industryEs: string;
  goalEn: string;
  goalEs: string;
  openingMessageEn: string;
  openingMessageEs: string;
};

export type LiveDemoRuntimeContext = {
  leadName?: string;
  business?: string;
  phone?: string;
  goal?: string;
  openingMessage?: string;
  demoObjective?: DemoObjective;
};

type DemoStage = "chatting" | "awaiting_consent" | "consent_received" | "calling" | "on_call" | "outcome";
type LocaleKey = "en" | "es";

type ChatMessage = {
  role: "user" | "assistant";
  text: string;
};

type LiveChatToCallDemoSectionProps = {
  onSubmitLead?: (payload: DemoLeadPayload) => void | Promise<void>;
  onStartDemoCall?: (payload: DemoLeadPayload) => void | Promise<void>;
  onOpenLeadChat?: () => void;
  prefillContext?: LiveDemoPrefillContext | null;
  runtimeContext?: LiveDemoRuntimeContext | null;
  hasCapturedLead?: boolean;
};

const DEMO_LEAD = {
  name: "Diego",
  businessEn: "Roofing services in the US.",
  businessEs: "Servicios de roofing (USA)",
  phone: "+1 305 555 0123",
};

const COPY: Record<
  LocaleKey,
  {
    eyebrow: string;
    title: string;
    description: string;
    objectiveLabel: string;
    objectives: Record<DemoObjective, string>;
    statuses: {
      live: string;
      consent: string;
      calling: string;
      onCall: string;
      outcome: Record<DemoObjective, string>;
    };
    leftHeader: string;
    leftSub: string;
    rightHeader: string;
    rightSub: string;
    chat: ChatMessage[];
    consentTitle: string;
    consentRequired: string;
    consentOptional: string;
    consentLegal: string;
    consentValidation: string;
    afterConsent: string;
    tryDemo: string;
    openChat: string;
    ctaSubtext: string;
    rightMessages: {
      context: string;
      calling: string;
      opening: string;
      qualify: string;
      outcome: Record<DemoObjective, string>;
    };
    typing: string;
    leadSummary: string;
    dialTarget: string;
    aiDisclosure: string;
    consentCaptured: string;
    objectiveDriven: string;
    assistantLabel: string;
    visitorLabel: string;
  }
> = {
  en: {
    eyebrow: "Live Chat -> AI Call in under 2 minutes",
    title: "See the full funnel in one live experience",
    description:
      "Visitor chats, shares details, gives explicit consent, and receives a fast AI call that qualifies and books.",
    objectiveLabel: "Demo objective",
    objectives: {
      book_google_meet: "Book Google Meet",
      schedule_call: "Schedule a call",
      simulate_sale: "Simulate a sale",
    },
    statuses: {
      live: "🟢 Live Chat active",
      consent: "✅ Consent received",
      calling: "⏳ Calling...",
      onCall: "📞 AI on the call",
      outcome: {
        book_google_meet: "✅ Meeting booked",
        schedule_call: "✅ Demo scheduled",
        simulate_sale: "✅ Sale simulated",
      },
    },
    leftHeader: "Live Chat",
    leftSub: "Friendly, fast, conversion-first",
    rightHeader: "AI Call Closer",
    rightSub: "Reacting to chat context in real-time",
    chat: [
      { role: "user", text: "Hi, I want more customers this month." },
      { role: "assistant", text: "Awesome! 😄 I'm Aurea. What's your name?" },
      { role: "user", text: "Diego" },
      { role: "assistant", text: "Nice to meet you, Diego 🙌 What type of business do you run?" },
      { role: "user", text: "Roofing services in the US." },
      {
        role: "assistant",
        text: "Perfect 🏠 Could you share your phone number with country code? (Example: +1...)",
      },
      { role: "user", text: "+1 305 555 0123" },
      { role: "assistant", text: "Before I call you, I need your consent 👇" },
    ],
    consentTitle: "Consent required",
    consentRequired: "I agree to receive an automated AI call for this demo.",
    consentOptional: "I agree to receive follow-up automated messages.",
    consentLegal: "You can opt out anytime. We respect your privacy.",
    consentValidation: "Please accept the required consent to continue.",
    afterConsent: "All set! 🚀 We'll call you in less than 2 minutes so you can experience it live.",
    tryDemo: "Try the Live Demo",
    openChat: "Open Lead Chat",
    ctaSubtext: "No credit card required. Experience the AI call in under 2 minutes.",
    rightMessages: {
      context:
        "✅ Context received: Diego — Roofing (US). Goal: more customers this month.",
      calling: "📞 Calling +1 305 555 0123…",
      opening:
        "Hi Diego, this is Aurea, the AI assistant from our team. This will take less than 30 seconds 😊",
      qualify:
        "Are you looking to book more inspections or close jobs directly by phone?",
      outcome: {
        book_google_meet:
          "Perfect ✅ I booked a Google Meet demo for you today. Confirmation is on its way.",
        schedule_call:
          "Perfect ✅ I scheduled a quick call for today. Confirmation is on its way.",
        simulate_sale:
          "Perfect ✅ Let's simulate a real lead call where I qualify and either close or book the job.",
      },
    },
    typing: "Processing next step...",
    leadSummary: "Lead summary",
    dialTarget: "Dial target",
    aiDisclosure: "AI disclosure on",
    consentCaptured: "Consent captured",
    objectiveDriven: "Objective-driven close",
    assistantLabel: "Aurea",
    visitorLabel: "Visitor",
  },
  es: {
    eyebrow: "Live Chat -> Llamada IA en menos de 2 minutos",
    title: "Mira el embudo completo en una experiencia en vivo",
    description:
      "El visitante conversa, comparte datos, da consentimiento y recibe una llamada IA que califica y agenda.",
    objectiveLabel: "Objetivo de la demo",
    objectives: {
      book_google_meet: "Agendar Google Meet",
      schedule_call: "Agendar llamada",
      simulate_sale: "Simular cierre de venta",
    },
    statuses: {
      live: "🟢 Live Chat activo",
      consent: "✅ Consentimiento recibido",
      calling: "⏳ Llamando...",
      onCall: "📞 IA en la llamada",
      outcome: {
        book_google_meet: "✅ Reunion agendada",
        schedule_call: "✅ Llamada agendada",
        simulate_sale: "✅ Cierre simulado",
      },
    },
    leftHeader: "Live Chat",
    leftSub: "Amigable, veloz y orientado a conversion",
    rightHeader: "AI Call Closer",
    rightSub: "Reaccionando al contexto del chat",
    chat: [
      { role: "user", text: "Hola, quiero mas clientes este mes." },
      { role: "assistant", text: "Genial! 😄 Soy Aurea. Como te llamas?" },
      { role: "user", text: "Diego" },
      { role: "assistant", text: "Encantada, Diego 🙌 A que se dedica tu negocio?" },
      { role: "user", text: "Servicios de roofing (USA)" },
      { role: "assistant", text: "Perfecto 🏠✅ Dejame tu numero con codigo de pais (+1...)" },
      { role: "user", text: "+1 305 555 0123" },
      { role: "assistant", text: "Antes de llamarte, necesito tu consentimiento 👇" },
    ],
    consentTitle: "Consentimiento requerido",
    consentRequired: "Acepto recibir una llamada automatica por IA para esta demo.",
    consentOptional: "Acepto recibir mensajes automaticos de seguimiento.",
    consentLegal: "Puedes pedir que pare en cualquier momento. Respetamos tu privacidad.",
    consentValidation: "Debes aceptar el consentimiento obligatorio para continuar.",
    afterConsent: "Listo! 🚀 Te llamamos en menos de 2 minutos para que pruebes la experiencia.",
    tryDemo: "Probar demo en vivo",
    openChat: "Abrir Lead Chat",
    ctaSubtext: "Sin tarjeta. Prueba la llamada IA en menos de 2 minutos.",
    rightMessages: {
      context: "✅ Contexto recibido: Diego — Roofing (USA). Objetivo: mas clientes este mes.",
      calling: "📞 Llamando a +1 305 555 0123...",
      opening:
        "Hola Diego, soy Aurea, la asistente IA del equipo. Esto tomara menos de 30 segundos 😊",
      qualify:
        "Veo que estas en roofing. Buscas agendar inspecciones o cerrar trabajos por telefono?",
      outcome: {
        book_google_meet:
          "Perfecto ✅ Agende un Google Meet para hoy. Te llega la confirmacion en breve.",
        schedule_call:
          "Perfecto ✅ Agende una llamada rapida para hoy. Te llega la confirmacion en breve.",
        simulate_sale:
          "Perfecto ✅ Vamos a simular una llamada real donde califico y cierro o agendo el trabajo.",
      },
    },
    typing: "Procesando siguiente paso...",
    leadSummary: "Resumen del lead",
    dialTarget: "Numero a marcar",
    aiDisclosure: "Divulgacion IA activa",
    consentCaptured: "Consentimiento capturado",
    objectiveDriven: "Cierre por objetivo",
    assistantLabel: "Aurea",
    visitorLabel: "Visitante",
  },
};

export function LiveChatToCallDemoSection(props: LiveChatToCallDemoSectionProps) {
  const { locale } = useLocale();
  const language: LocaleKey = locale === "en" ? "en" : "es";
  const copy = COPY[language];
  const activeLeadName = props.runtimeContext?.leadName?.trim() || props.prefillContext?.leadName || DEMO_LEAD.name;
  const activePhone = props.runtimeContext?.phone?.trim() || props.prefillContext?.phone || DEMO_LEAD.phone;
  const activeBusiness =
    props.runtimeContext?.business?.trim()
      ? props.runtimeContext.business.trim()
      : props.prefillContext == null
      ? language === "en"
        ? DEMO_LEAD.businessEn
        : DEMO_LEAD.businessEs
      : language === "en"
        ? props.prefillContext.industryEn
        : props.prefillContext.industryEs;
  const activeGoal =
    props.runtimeContext?.goal?.trim()
      ? props.runtimeContext.goal.trim()
      : props.prefillContext == null
      ? language === "en"
        ? "more customers this month"
        : "mas clientes este mes"
      : language === "en"
        ? props.prefillContext.goalEn
        : props.prefillContext.goalEs;
  const openingMessage =
    props.runtimeContext?.openingMessage?.trim()
      ? props.runtimeContext.openingMessage.trim()
      : props.prefillContext == null
      ? copy.chat[0]?.text ?? ""
      : language === "en"
        ? props.prefillContext.openingMessageEn
        : props.prefillContext.openingMessageEs;

  const objective: DemoObjective =
    props.runtimeContext?.demoObjective ?? props.prefillContext?.demoObjective ?? "book_google_meet";
  const [consentCall, setConsentCall] = useState(false);
  const [consentFollowUp, setConsentFollowUp] = useState(false);
  const [consentError, setConsentError] = useState<string | null>(null);
  const [leftVisibleCount, setLeftVisibleCount] = useState(0);
  const [rightVisibleCount, setRightVisibleCount] = useState(0);
  const [stage, setStage] = useState<DemoStage>("chatting");
  const [callUserReply, setCallUserReply] = useState("");
  const [callUserCloseReply, setCallUserCloseReply] = useState("");
  const timeoutsRef = useRef<number[]>([]);
  const callPanelRef = useRef<HTMLDivElement | null>(null);

  const leftChatMessages = useMemo(() => {
    const clone = copy.chat.map((message) => ({ ...message }));
    if (clone[0]) clone[0].text = openingMessage;
    if (clone[4]) clone[4].text = activeBusiness;
    if (clone[6]) clone[6].text = activePhone;
    return clone;
  }, [activeBusiness, activePhone, copy.chat, openingMessage]);

  const callReplyOptions = useMemo(() => {
    if (language === "en") {
      return {
        book_google_meet: [
          "I need more booked inspections this week.",
          "I want qualified appointments, not random leads.",
          "Book me high-intent prospects only.",
        ],
        schedule_call: [
          "I can do a quick call today.",
          "Tomorrow morning works for me.",
          "Schedule me with your team this afternoon.",
        ],
        simulate_sale: [
          "Yes, let's run a realistic sales scenario.",
          "I want to test how you handle objections.",
          "Simulate a real lead call for my business.",
        ],
        close: [
          "Sounds good, send me the confirmation.",
          "Great, I am ready to continue.",
          "Perfect, let's move forward.",
        ],
      };
    }

    return {
      book_google_meet: [
        "Necesito mas inspecciones agendadas esta semana.",
        "Quiero citas calificadas, no leads frios.",
        "Agendame solo prospectos con intencion real.",
      ],
      schedule_call: [
        "Puedo una llamada rapida hoy.",
        "Manana por la manana me queda bien.",
        "Agendame con tu equipo hoy por la tarde.",
      ],
      simulate_sale: [
        "Si, hagamos una simulacion real de cierre.",
        "Quiero probar como manejas objeciones.",
        "Simula una llamada real para mi negocio.",
      ],
      close: [
        "Perfecto, enviame la confirmacion.",
        "Excelente, listo para continuar.",
        "Genial, avancemos.",
      ],
    };
  }, [language]);

  const pickRandom = (items: string[]) => {
    if (items.length === 0) return "";
    return items[Math.floor(Math.random() * items.length)] ?? "";
  };

  const rightMessages = useMemo(() => {
    const contextText =
      language === "en"
        ? `✅ Context received: ${activeLeadName} - ${activeBusiness}. Goal: ${activeGoal}.`
        : `✅ Contexto recibido: ${activeLeadName} - ${activeBusiness}. Objetivo: ${activeGoal}.`;
    const callingText =
      language === "en" ? `📞 Calling ${activePhone}...` : `📞 Llamando a ${activePhone}...`;
    const openingText =
      language === "en"
        ? `Hi ${activeLeadName}, this is Aurea, the AI assistant from our team. This will take less than 30 seconds 😊`
        : `Hola ${activeLeadName}, soy Aurea, la asistente IA del equipo. Esto tomara menos de 30 segundos 😊`;
    const qualifyText =
      language === "en"
        ? `I see you're in ${activeBusiness}. Are you looking to book more inspections or close jobs directly by phone?`
        : `Veo que estas en ${activeBusiness}. Buscas agendar inspecciones o cerrar trabajos por telefono?`;

    return [
      { role: "assistant" as const, text: contextText },
      { role: "assistant" as const, text: callingText },
      { role: "assistant" as const, text: openingText },
      { role: "assistant" as const, text: qualifyText },
      {
        role: "user" as const,
        text:
          callUserReply ||
          (language === "en"
            ? "I want more qualified calls this month."
            : "Quiero mas llamadas calificadas este mes."),
      },
      { role: "assistant" as const, text: copy.rightMessages.outcome[objective] },
      {
        role: "user" as const,
        text:
          callUserCloseReply ||
          (language === "en" ? "Perfect, send me the details." : "Perfecto, enviame los detalles."),
      },
    ];
  }, [
    activeBusiness,
    activeGoal,
    activeLeadName,
    activePhone,
    callUserCloseReply,
    callUserReply,
    copy.rightMessages.outcome,
    language,
    objective,
  ]);

  const statusSteps = useMemo(() => {
    return [
      copy.statuses.live,
      copy.statuses.consent,
      copy.statuses.calling,
      copy.statuses.onCall,
      copy.statuses.outcome[objective],
    ];
  }, [copy.statuses, objective]);

  const effectiveStage: DemoStage =
    stage === "chatting" && leftVisibleCount >= leftChatMessages.length ? "awaiting_consent" : stage;

  const activeStatusIndex = useMemo(() => {
    if (effectiveStage === "chatting" || effectiveStage === "awaiting_consent") return 0;
    if (effectiveStage === "consent_received") return 1;
    if (effectiveStage === "calling") return 2;
    if (effectiveStage === "on_call") return 3;
    return 4;
  }, [effectiveStage]);

  const clearTimeline = () => {
    for (const timeout of timeoutsRef.current) {
      window.clearTimeout(timeout);
    }
    timeoutsRef.current = [];
  };

  const scrollToCallPanel = () => {
    if (typeof window === "undefined") return;
    if (!callPanelRef.current) return;

    const top = callPanelRef.current.getBoundingClientRect().top + window.scrollY - 84;

    window.scrollTo({
      top: Math.max(top, 0),
      behavior: "smooth",
    });
  };

  useEffect(() => {
    if (leftVisibleCount >= leftChatMessages.length) return;
    const timer = window.setTimeout(() => {
      setLeftVisibleCount((current) => current + 1);
    }, 1000);

    return () => window.clearTimeout(timer);
  }, [leftChatMessages.length, leftVisibleCount]);

  useEffect(() => {
    return () => {
      for (const timeout of timeoutsRef.current) {
        window.clearTimeout(timeout);
      }
      timeoutsRef.current = [];
    };
  }, []);

  function startSimulation() {
    if (!consentCall) {
      setConsentError(copy.consentValidation);
      return;
    }

    const payload: DemoLeadPayload = {
      name: activeLeadName,
      business: activeBusiness,
      phone: activePhone,
      objective,
      consentCall: true,
      consentFollowUp,
    };

    setConsentError(null);
    setRightVisibleCount(0);
    clearTimeline();
    setCallUserReply(pickRandom(callReplyOptions[objective]));
    setCallUserCloseReply(pickRandom(callReplyOptions.close));

    void props.onSubmitLead?.(payload);
    void props.onStartDemoCall?.(payload);

    const scrollTimeout = window.setTimeout(() => {
      scrollToCallPanel();
    }, 1000);
    timeoutsRef.current.push(scrollTimeout);

    const timeline: Array<{ delay: number; stage: DemoStage; count: number }> = [
      { delay: 1000, stage: "consent_received", count: 1 },
      { delay: 2000, stage: "calling", count: 2 },
      { delay: 3000, stage: "on_call", count: 3 },
      { delay: 4000, stage: "on_call", count: 4 },
      { delay: 5000, stage: "on_call", count: 5 },
      { delay: 6000, stage: "outcome", count: 6 },
      { delay: 7000, stage: "outcome", count: 7 },
    ];

    for (const step of timeline) {
      const timeout = window.setTimeout(() => {
        setStage(step.stage);
        setRightVisibleCount(step.count);
      }, step.delay);
      timeoutsRef.current.push(timeout);
    }
  }

  return (
    <section id="live-chat-demo" className="scroll-mt-28 px-1 pb-16" aria-labelledby="live-chat-demo-title">
      <Card className="border-white/15 bg-gradient-to-b from-[#121A31] to-[#0E1427] shadow-[0_26px_90px_rgba(18,43,128,0.32)]">
        <CardContent className="space-y-7 p-5 sm:p-7 md:p-8">
          <div className="space-y-4 border-b border-white/10 pb-5">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/[0.03] px-3 py-1 text-xs text-white/75">
              <Sparkles className="h-3.5 w-3.5 text-[#9AB2FF]" />
              {copy.eyebrow}
            </div>

            <div>
              <h2 id="live-chat-demo-title" className="text-2xl font-semibold text-white sm:text-3xl">
                {copy.title}
              </h2>
              <p className="mt-2 max-w-3xl text-sm leading-relaxed text-white/70 sm:text-base">
                {copy.description}
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              {statusSteps.map((status, index) => {
                const isActive = index <= activeStatusIndex;
                return (
                  <span
                    key={status}
                    className={cn(
                      "inline-flex items-center rounded-full border px-3 py-1 text-xs transition-colors",
                      isActive
                        ? "border-emerald-300/35 bg-emerald-300/10 text-emerald-200"
                        : "border-white/12 bg-white/[0.02] text-white/45",
                    )}
                  >
                    {status}
                  </span>
                );
              })}
            </div>
          </div>

          <div className="grid gap-5 lg:grid-cols-2">
            <div
              id="live-call-reaction"
              ref={callPanelRef}
              className="rounded-2xl border border-white/12 bg-white/[0.02] p-4 sm:p-5"
            >
              <div className="mb-4 flex items-center justify-between">
                <p className="text-xs uppercase tracking-[0.14em] text-white/55">{copy.leftHeader}</p>
                <span className="rounded-full border border-white/15 bg-white/[0.03] px-2.5 py-1 text-[11px] text-white/65">
                  {copy.leftSub}
                </span>
              </div>

              <div className="space-y-3">
                {leftChatMessages.slice(0, leftVisibleCount).map((message, index) => (
                  <motion.div
                    key={`left-message-${index}`}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.24 }}
                    className={cn("flex", message.role === "assistant" ? "justify-start" : "justify-end")}
                  >
                    <div
                      className={cn(
                        "max-w-[92%] rounded-2xl border px-4 py-3 text-sm leading-relaxed",
                        message.role === "assistant"
                          ? "border-[#6F8BFF]/45 bg-[#213467]/48 text-white/92"
                          : "border-white/15 bg-[#121724]/72 text-white/90",
                      )}
                    >
                      <p className="mb-1 text-[11px] uppercase tracking-[0.12em] text-white/52">
                        {message.role === "assistant" ? copy.assistantLabel : copy.visitorLabel}
                      </p>
                      <p>{message.text}</p>
                    </div>
                  </motion.div>
                ))}

                {leftVisibleCount < leftChatMessages.length ? (
                  <div className="inline-flex w-fit items-center gap-1.5 rounded-full border border-white/15 bg-white/[0.03] px-3 py-2">
                    {[0, 1, 2].map((dot) => (
                      <motion.span
                        key={dot}
                        animate={{ opacity: [0.35, 1, 0.35] }}
                        transition={{ duration: 0.9, repeat: Number.POSITIVE_INFINITY, delay: dot * 0.12 }}
                        className="h-1.5 w-1.5 rounded-full bg-[#93ABFF]"
                      />
                    ))}
                  </div>
                ) : null}
              </div>

              {effectiveStage !== "chatting" ? (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.25 }}
                  className="mt-5 rounded-xl border border-white/15 bg-white/[0.02] p-4"
                >
                  <p className="text-xs uppercase tracking-[0.13em] text-white/50">{copy.consentTitle}</p>
                  <div className="mt-3 space-y-2.5">
                    <label className="flex items-start gap-2.5 text-sm text-white/82">
                      <input
                        type="checkbox"
                        checked={consentCall}
                        onChange={(event) => setConsentCall(event.target.checked)}
                        className="mt-0.5 h-4 w-4 rounded border-white/25 bg-transparent accent-[#6E89FF]"
                      />
                      <span>{copy.consentRequired}</span>
                    </label>
                    <label className="flex items-start gap-2.5 text-sm text-white/74">
                      <input
                        type="checkbox"
                        checked={consentFollowUp}
                        onChange={(event) => setConsentFollowUp(event.target.checked)}
                        className="mt-0.5 h-4 w-4 rounded border-white/25 bg-transparent accent-[#6E89FF]"
                      />
                      <span>{copy.consentOptional}</span>
                    </label>
                    <p className="text-xs leading-relaxed text-white/55">{copy.consentLegal}</p>
                  </div>

                  {effectiveStage !== "awaiting_consent" ? (
                    <div className="mt-4 rounded-xl border border-[#6F8BFF]/40 bg-[#223468]/45 px-4 py-3 text-sm text-white/90">
                      {copy.afterConsent}
                    </div>
                  ) : null}

                  {consentError ? <p className="mt-3 text-xs text-rose-300">{consentError}</p> : null}

                  <div className="mt-4 grid gap-2 sm:grid-cols-2">
                    <Button
                      type="button"
                      onClick={startSimulation}
                      className="h-11 w-full bg-gradient-to-r from-[#3D7BFF] to-[#8D4BFF] text-white shadow-[0_0_30px_rgba(98,104,255,0.35)]"
                    >
                      {copy.tryDemo}
                    </Button>
                    {!props.hasCapturedLead ? (
                      <Button
                        type="button"
                        variant="ghost"
                        onClick={props.onOpenLeadChat}
                        className="h-11 w-full border border-white/15 bg-white/[0.03] text-white/85 hover:bg-white/[0.09]"
                      >
                        {copy.openChat}
                      </Button>
                    ) : null}
                  </div>
                  <p className="mt-2 text-center text-xs leading-relaxed text-white/55">{copy.ctaSubtext}</p>
                </motion.div>
              ) : null}
            </div>

            <div className="rounded-2xl border border-white/12 bg-white/[0.02] p-4 sm:p-5">
              <div className="mb-4 flex items-center justify-between">
                <p className="text-xs uppercase tracking-[0.14em] text-white/55">{copy.rightHeader}</p>
                <span className="rounded-full border border-white/15 bg-white/[0.03] px-2.5 py-1 text-[11px] text-white/65">
                  {copy.rightSub}
                </span>
              </div>

              <div className="space-y-3">
                {rightMessages.slice(0, rightVisibleCount).map((message, index) => (
                  <motion.div
                    key={`right-message-${index}`}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.24 }}
                    className={cn(
                      "rounded-2xl border px-4 py-3",
                      message.role === "assistant"
                        ? "border-white/12 bg-[#141C33]/72"
                        : "ml-auto max-w-[92%] border-white/15 bg-[#121724]/85",
                    )}
                  >
                    <p className="whitespace-pre-line text-sm leading-relaxed text-white/90">{message.text}</p>
                  </motion.div>
                ))}

                {effectiveStage !== "chatting" &&
                effectiveStage !== "awaiting_consent" &&
                effectiveStage !== "outcome" ? (
                  <div className="inline-flex w-fit items-center gap-2 rounded-full border border-[#6F8BFF]/35 bg-[#213468]/45 px-3 py-2 text-xs text-white/80">
                    <Clock3 className="h-3.5 w-3.5 text-[#9DB3FF]" />
                    {copy.typing}
                  </div>
                ) : null}
              </div>

              <div className="mt-5 grid gap-2 sm:grid-cols-2">
                <div className="rounded-xl border border-white/12 bg-white/[0.02] p-3">
                  <p className="text-[11px] uppercase tracking-[0.1em] text-white/48">{copy.leadSummary}</p>
                  <p className="mt-1 text-sm text-white/85">
                    {activeLeadName} · {activeBusiness}
                  </p>
                </div>
                <div className="rounded-xl border border-white/12 bg-white/[0.02] p-3">
                  <p className="text-[11px] uppercase tracking-[0.1em] text-white/48">{copy.dialTarget}</p>
                  <p className="mt-1 text-sm text-white/85">{activePhone}</p>
                </div>
              </div>

              <div className="mt-4 flex flex-wrap items-center gap-2 text-xs text-white/65">
                <span className="inline-flex items-center gap-1 rounded-full border border-white/12 bg-white/[0.03] px-2.5 py-1">
                  <Bot className="h-3.5 w-3.5 text-[#8EA8FF]" />
                  {copy.aiDisclosure}
                </span>
                <span className="inline-flex items-center gap-1 rounded-full border border-white/12 bg-white/[0.03] px-2.5 py-1">
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-300" />
                  {copy.consentCaptured}
                </span>
                <span className="inline-flex items-center gap-1 rounded-full border border-white/12 bg-white/[0.03] px-2.5 py-1">
                  <PhoneCall className="h-3.5 w-3.5 text-[#E7D88B]" />
                  {copy.objectiveDriven}
                </span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </section>
  );
}
