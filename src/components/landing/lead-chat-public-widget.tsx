"use client";

import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Send, ShieldCheck } from "lucide-react";

import type { DemoObjective } from "@/components/landing/live-chat-to-call-demo-section";
import { useLocale } from "@/components/providers/locale-provider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

type LocaleKey = "en" | "es";
export type LeadChatGoal = "appointments" | "close_deals" | "pricing";

export type LeadChatPayload = {
  goal: LeadChatGoal;
  name: string;
  business: string;
  phoneE164: string;
  consentCall: true;
  consentFollowUp: boolean;
  demoObjective?: DemoObjective;
};

export type LeadChatLiveDemoData = {
  goal: LeadChatGoal | null;
  goalLabel: string;
  name: string;
  business: string;
  phoneE164: string;
  demoObjective?: DemoObjective;
  consentCall: boolean;
  consentFollowUp: boolean;
  step: 1 | 2 | 3 | 4 | 5;
  completed: boolean;
};

export type LeadChatPrefillContext = {
  seed: string;
  goal: LeadChatGoal;
  demoObjective: DemoObjective;
  name?: string;
  business?: string;
  phoneE164?: string;
  openingMessageEn: string;
  openingMessageEs: string;
};

type LeadChatPublicWidgetProps = {
  onSubmitLead?: (payload: LeadChatPayload) => void | Promise<void>;
  onLiveDataChange?: (payload: LeadChatLiveDemoData) => void;
  onCompleted?: (payload: LeadChatPayload) => void | Promise<void>;
  compact?: boolean;
  prefillContext?: LeadChatPrefillContext | null;
};

const COPY: Record<
  LocaleKey,
  {
    header: string;
    prequalifying: string;
    start: string;
    goalButtons: Record<LeadChatGoal, string>;
    objectivePrompt: string;
    objectiveButtons: Record<DemoObjective, string>;
    askNameBiz: string;
    askPhoneConsent: string;
    nameLabel: string;
    bizLabel: string;
    phoneLabel: string;
    consentRequired: string;
    consentOptional: string;
    consentLegal: string;
    microcopy: string;
    urgency: string;
    submitStep1: string;
    submitStep2: string;
    submitStep3: string;
    submitStep4: string;
    finishMsg: string;
    invalidPhone: string;
    missingFields: string;
    missingConsent: string;
    userLabel: string;
    assistantLabel: string;
  }
> = {
  en: {
    header: "Lead Chat Public",
    prequalifying: "Pre-qualifying...",
    start: "Hi! I can launch a live AI call demo in under 2 minutes. What do you want to achieve?",
    goalButtons: {
      appointments: "Book appointments",
      close_deals: "Close deals",
      pricing: "Pricing",
    },
    objectivePrompt: "Great. What should the AI prioritize during this demo call?",
    objectiveButtons: {
      book_google_meet: "Book Google Meet",
      schedule_call: "Schedule a call",
      simulate_sale: "Simulate a sale",
    },
    askNameBiz: "Great choice. Please share your name and business type.",
    askPhoneConsent: "Perfect. Now share your phone with country code and accept consent to continue.",
    nameLabel: "Your name",
    bizLabel: "Business type",
    phoneLabel: "Phone in E.164 (+1...)",
    consentRequired: "I agree to receive an automated AI call for this demo.",
    consentOptional: "I agree to receive follow-up automated messages.",
    consentLegal: "You can opt out anytime. We respect your privacy.",
    microcopy: "⚡ Free live demo • ⏱ <2 min • 🔒 No card",
    urgency: "Live demos running now",
    submitStep1: "Continue",
    submitStep2: "Continue",
    submitStep3: "Continue",
    submitStep4: "Start live demo call",
    finishMsg: "All set! We will call you in under 2 minutes.",
    invalidPhone: "Please enter a valid E.164 number, for example +13055550123.",
    missingFields: "Please complete all required fields.",
    missingConsent: "Consent is required to continue.",
    userLabel: "You",
    assistantLabel: "Aurea",
  },
  es: {
    header: "Lead Chat Publico",
    prequalifying: "Precalificando...",
    start: "Hola. Te doy una demo real por llamada en menos de 2 minutos. Que quieres lograr?",
    goalButtons: {
      appointments: "Agendar citas",
      close_deals: "Cerrar ventas",
      pricing: "Ver precios",
    },
    objectivePrompt: "Perfecto. Que debe priorizar la IA en esta llamada demo?",
    objectiveButtons: {
      book_google_meet: "Agendar Google Meet",
      schedule_call: "Agendar llamada",
      simulate_sale: "Simular cierre de venta",
    },
    askNameBiz: "Excelente. Comparte tu nombre y rubro de negocio.",
    askPhoneConsent: "Perfecto. Ahora deja tu numero con codigo de pais y acepta consentimiento para continuar.",
    nameLabel: "Tu nombre",
    bizLabel: "Rubro del negocio",
    phoneLabel: "Telefono en E.164 (+1...)",
    consentRequired: "Acepto recibir una llamada automatica por IA para esta demo.",
    consentOptional: "Acepto recibir mensajes automaticos de seguimiento.",
    consentLegal: "Puedes pedir que pare en cualquier momento. Respetamos tu privacidad.",
    microcopy: "⚡ Demo gratis • ⏱ <2 min • 🔒 Sin tarjeta",
    urgency: "Demos en vivo ejecutandose ahora",
    submitStep1: "Continuar",
    submitStep2: "Continuar",
    submitStep3: "Continuar",
    submitStep4: "Iniciar llamada demo",
    finishMsg: "Listo! Te llamaremos en menos de 2 minutos.",
    invalidPhone: "Ingresa un numero E.164 valido, por ejemplo +13055550123.",
    missingFields: "Completa los campos requeridos.",
    missingConsent: "El consentimiento es obligatorio para continuar.",
    userLabel: "Tu",
    assistantLabel: "Aurea",
  },
};

function isPhoneE164(phone: string) {
  return /^\+[1-9]\d{7,14}$/.test(phone.trim());
}

export function LeadChatPublicWidget(props: LeadChatPublicWidgetProps) {
  const { locale } = useLocale();
  const language: LocaleKey = locale === "en" ? "en" : "es";
  const copy = COPY[language];
  const onLiveDataChange = props.onLiveDataChange;
  const prefillDemoObjective = props.prefillContext?.demoObjective;
  const [step, setStep] = useState<1 | 2 | 3 | 4 | 5>(props.prefillContext?.goal ? 2 : 1);
  const [goal, setGoal] = useState<LeadChatGoal | null>(props.prefillContext?.goal ?? null);
  const [demoObjective, setDemoObjective] = useState<DemoObjective | null>(prefillDemoObjective ?? null);
  const [name, setName] = useState(props.prefillContext?.name ?? "");
  const [business, setBusiness] = useState(props.prefillContext?.business ?? "");
  const [phone, setPhone] = useState(props.prefillContext?.phoneE164 ?? "");
  const [consentCall, setConsentCall] = useState(false);
  const [consentFollowUp, setConsentFollowUp] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const startMessage =
    props.prefillContext == null
      ? copy.start
      : language === "en"
        ? props.prefillContext.openingMessageEn
        : props.prefillContext.openingMessageEs;

  const bubbles = useMemo(() => {
    const list: Array<{ role: "assistant" | "user"; text: string }> = [{ role: "assistant", text: startMessage }];

    if (goal) {
      list.push({ role: "user", text: copy.goalButtons[goal] });
      list.push({ role: "assistant", text: copy.objectivePrompt });
    }

    if (step >= 3 && demoObjective) {
      list.push({ role: "user", text: copy.objectiveButtons[demoObjective] });
      list.push({ role: "assistant", text: copy.askNameBiz });
    }

    if (step >= 4 && name.trim() && business.trim()) {
      list.push({ role: "user", text: `${name.trim()} · ${business.trim()}` });
      list.push({ role: "assistant", text: copy.askPhoneConsent });
    }

    if (step === 5) {
      list.push({ role: "assistant", text: copy.finishMsg });
    }

    return list;
  }, [
    business,
    copy.askNameBiz,
    copy.askPhoneConsent,
    copy.finishMsg,
    copy.goalButtons,
    copy.objectiveButtons,
    copy.objectivePrompt,
    demoObjective,
    goal,
    name,
    startMessage,
    step,
  ]);

  const liveData = useMemo<LeadChatLiveDemoData>(() => {
    const normalizedName = name.trim();
    const normalizedBusiness = business.trim();
    const normalizedPhone = phone.trim();

    return {
      goal,
      goalLabel: goal ? copy.goalButtons[goal] : "",
      name: normalizedName,
      business: normalizedBusiness,
      phoneE164: normalizedPhone,
      demoObjective: demoObjective ?? prefillDemoObjective,
      consentCall,
      consentFollowUp,
      step,
      completed: step === 5,
    };
  }, [business, consentCall, consentFollowUp, copy.goalButtons, demoObjective, goal, name, phone, prefillDemoObjective, step]);

  useEffect(() => {
    onLiveDataChange?.(liveData);
  }, [liveData, onLiveDataChange]);

  function handleStep1() {
    if (!goal) {
      setError(copy.missingFields);
      return;
    }
    setError(null);
    setStep(2);
  }

  function handleStep2() {
    if (!demoObjective) {
      setError(copy.missingFields);
      return;
    }
    setError(null);
    setStep(3);
  }

  function handleStep3() {
    if (!name.trim() || !business.trim()) {
      setError(copy.missingFields);
      return;
    }
    setError(null);
    setStep(4);
  }

  function handleStep4() {
    if (!consentCall) {
      setError(copy.missingConsent);
      return;
    }
    if (!isPhoneE164(phone)) {
      setError(copy.invalidPhone);
      return;
    }
    if (!goal) return;

    setError(null);
    setStep(5);

    const payload: LeadChatPayload = {
      goal,
      name: name.trim(),
      business: business.trim(),
      phoneE164: phone.trim(),
      consentCall: true,
      consentFollowUp,
      demoObjective: demoObjective ?? props.prefillContext?.demoObjective,
    };

    void props.onSubmitLead?.(payload);
    void props.onCompleted?.(payload);
  }

  return (
    <div
      className={cn(
        "rounded-2xl border border-white/15 bg-[#0E1427]/92 p-4 shadow-[0_24px_90px_rgba(2,8,28,0.65)] backdrop-blur-xl sm:p-5",
        props.compact ? "w-full" : "mx-auto w-full max-w-xl",
      )}
    >
      <div className="mb-4 flex items-center justify-between border-b border-white/10 pb-3">
        <div>
          <p className="text-sm font-semibold text-white">{copy.header}</p>
          <p className="text-xs text-emerald-300">{copy.prequalifying}</p>
        </div>
        <span className="rounded-full border border-white/15 bg-white/[0.03] px-2.5 py-1 text-[11px] text-white/70">
          {step}/5
        </span>
      </div>

      <div className="space-y-2.5">
        {bubbles.map((bubble, index) => (
          <motion.div
            key={`${bubble.role}-${index}-${bubble.text.slice(0, 16)}`}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.22 }}
            className={cn("flex", bubble.role === "assistant" ? "justify-start" : "justify-end")}
          >
            <div
              className={cn(
                "max-w-[92%] rounded-2xl border px-4 py-3 text-sm leading-relaxed",
                bubble.role === "assistant"
                  ? "border-[#6F8BFF]/40 bg-[#213467]/44 text-white/90"
                  : "border-white/15 bg-[#121724]/75 text-white/90",
              )}
            >
              <p className="mb-1 text-[11px] uppercase tracking-[0.11em] text-white/50">
                {bubble.role === "assistant" ? copy.assistantLabel : copy.userLabel}
              </p>
              <p>{bubble.text}</p>
            </div>
          </motion.div>
        ))}
      </div>

      <div className="mt-4 space-y-3 rounded-xl border border-white/12 bg-white/[0.02] p-3.5">
        {step === 1 ? (
          <>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
              {(Object.keys(copy.goalButtons) as LeadChatGoal[]).map((value) => (
                <Button
                  key={value}
                  type="button"
                  variant="ghost"
                  onClick={() => setGoal(value)}
                  className={cn(
                    "h-10 border text-xs",
                    goal === value
                      ? "border-[#6F8BFF]/60 bg-[#253A71]/45 text-white"
                      : "border-white/12 bg-white/[0.02] text-white/80 hover:bg-white/[0.08]",
                  )}
                >
                  {copy.goalButtons[value]}
                </Button>
              ))}
            </div>
            <Button
              type="button"
              onClick={handleStep1}
              className="h-10 w-full bg-gradient-to-r from-[#3D7BFF] to-[#8D4BFF] text-white"
            >
              {copy.submitStep1}
            </Button>
          </>
        ) : null}

        {step === 2 ? (
          <>
            <p className="text-xs text-white/65">{copy.objectivePrompt}</p>
            <div className="grid grid-cols-1 gap-2">
              {(Object.keys(copy.objectiveButtons) as DemoObjective[]).map((value) => (
                <Button
                  key={value}
                  type="button"
                  variant="ghost"
                  onClick={() => setDemoObjective(value)}
                  className={cn(
                    "h-10 justify-start border text-xs",
                    demoObjective === value
                      ? "border-[#6F8BFF]/60 bg-[#253A71]/45 text-white"
                      : "border-white/12 bg-white/[0.02] text-white/80 hover:bg-white/[0.08]",
                  )}
                >
                  {copy.objectiveButtons[value]}
                </Button>
              ))}
            </div>
            <Button
              type="button"
              onClick={handleStep2}
              className="h-10 w-full bg-gradient-to-r from-[#3D7BFF] to-[#8D4BFF] text-white"
            >
              {copy.submitStep2}
            </Button>
          </>
        ) : null}

        {step === 3 ? (
          <>
            <label className="space-y-1.5">
              <span className="text-xs text-white/65">{copy.nameLabel}</span>
              <Input
                value={name}
                onChange={(event) => setName(event.target.value)}
                placeholder={copy.nameLabel}
                className="h-10 border-white/15 bg-white/[0.02] text-white placeholder:text-white/40"
              />
            </label>
            <label className="space-y-1.5">
              <span className="text-xs text-white/65">{copy.bizLabel}</span>
              <Input
                value={business}
                onChange={(event) => setBusiness(event.target.value)}
                placeholder={copy.bizLabel}
                className="h-10 border-white/15 bg-white/[0.02] text-white placeholder:text-white/40"
              />
            </label>
            <Button
              type="button"
              onClick={handleStep3}
              className="h-10 w-full bg-gradient-to-r from-[#3D7BFF] to-[#8D4BFF] text-white"
            >
              {copy.submitStep3}
            </Button>
          </>
        ) : null}

        {step === 4 ? (
          <>
            <label className="space-y-1.5">
              <span className="text-xs text-white/65">{copy.phoneLabel}</span>
              <Input
                value={phone}
                onChange={(event) => setPhone(event.target.value)}
                placeholder="+13055550123"
                className="h-10 border-white/15 bg-white/[0.02] text-white placeholder:text-white/40"
              />
            </label>

            <label className="flex items-start gap-2.5 text-sm text-white/82">
              <input
                type="checkbox"
                checked={consentCall}
                onChange={(event) => setConsentCall(event.target.checked)}
                className="mt-0.5 h-4 w-4 rounded border-white/25 bg-transparent accent-[#6E89FF]"
              />
              <span>{copy.consentRequired}</span>
            </label>
            <label className="flex items-start gap-2.5 text-sm text-white/75">
              <input
                type="checkbox"
                checked={consentFollowUp}
                onChange={(event) => setConsentFollowUp(event.target.checked)}
                className="mt-0.5 h-4 w-4 rounded border-white/25 bg-transparent accent-[#6E89FF]"
              />
              <span>{copy.consentOptional}</span>
            </label>
            <p className="text-xs leading-relaxed text-white/55">{copy.consentLegal}</p>

            <Button
              type="button"
              onClick={handleStep4}
              className="h-10 w-full bg-gradient-to-r from-[#3D7BFF] to-[#8D4BFF] text-white"
            >
              <Send className="mr-2 h-4 w-4" />
              {copy.submitStep4}
            </Button>
          </>
        ) : null}

        {step === 5 ? (
          <div className="rounded-xl border border-emerald-300/35 bg-emerald-400/10 px-3 py-2.5 text-sm text-emerald-200">
            {copy.finishMsg}
          </div>
        ) : null}

        {error ? <p className="text-xs text-rose-300">{error}</p> : null}

        <div className="flex items-center justify-between gap-2 text-[11px] text-white/55">
          <span>{copy.microcopy}</span>
          <span className="inline-flex items-center gap-1">
            <ShieldCheck className="h-3.5 w-3.5 text-emerald-300" />
            <span className="h-2 w-2 rounded-full bg-rose-400/85" aria-hidden />
            {copy.urgency}
          </span>
        </div>
      </div>
    </div>
  );
}
