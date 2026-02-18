"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  ArrowRight,
  CalendarClock,
  CheckCircle2,
  ChevronRight,
  Lock,
  PhoneCall,
  ShieldCheck,
  Sparkles,
  UserRoundCheck,
} from "lucide-react";

import { LanguageToggle } from "@/components/language-toggle";
import { useLocale } from "@/components/providers/locale-provider";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

type SimpleSession = {
  user?: {
    id?: string;
    email?: string | null;
    name?: string | null;
  };
};

const fadeUp = {
  hidden: { opacity: 0, y: 22 },
  show: { opacity: 1, y: 0 },
};

export default function HomePage() {
  const { t } = useLocale();
  const [session, setSession] = useState<SimpleSession | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function loadSession() {
      try {
        const response = await fetch("/api/auth/session", { credentials: "include" });
        if (!response.ok) return;
        const data = (await response.json()) as SimpleSession;
        if (!cancelled) setSession(data);
      } catch {
        if (!cancelled) setSession(null);
      }
    }

    void loadSession();

    return () => {
      cancelled = true;
    };
  }, []);

  const navItems = useMemo(
    () => [
      { href: "#producto", label: t("Producto", "Product") },
      { href: "#precios", label: t("Precios", "Pricing") },
      { href: "#seguridad", label: t("Seguridad", "Security") },
    ],
    [t],
  );

  const conversation = useMemo(
    () => [
      {
        speaker: t("Cliente", "Customer"),
        text: t(
          "Hola, quiero info para vender 2 propiedades este mes.",
          "Hi, I want details to sell 2 properties this month.",
        ),
        side: "left" as const,
      },
      {
        speaker: "AI Call Closer",
        text: t(
          "Perfecto. Ya trabajas con un sistema de captacion de leads?",
          "Perfect. Are you already using a lead capture system?",
        ),
        side: "right" as const,
      },
      {
        speaker: t("Cliente", "Customer"),
        text: t(
          "Si, recibimos muchas llamadas y no alcanzamos a responder todo.",
          "Yes, we receive many calls and cannot answer all of them.",
        ),
        side: "left" as const,
      },
      {
        speaker: "AI Call Closer",
        text: t(
          "Te agendo una demo hoy 5:30 PM y te conecto con un closer senior.",
          "I will schedule a demo today at 5:30 PM and connect you with a senior closer.",
        ),
        side: "right" as const,
      },
    ],
    [t],
  );

  const stats = useMemo(
    () => [
      { value: "37%", label: t("de llamadas se pierden fuera de horario", "of calls are missed after hours") },
      { value: "42%", label: t("menos conversion por llamadas no atendidas", "less conversion from missed calls") },
      { value: "3.1x", label: t("mas citas cuando la respuesta es inmediata", "more appointments with immediate response") },
    ],
    [t],
  );

  const steps = useMemo(
    () => [
      {
        title: t("Conecta tu numero", "Connect your number"),
        description: t(
          "Integra tu linea con Plivo en minutos, sin cambiar tu operacion actual.",
          "Integrate your line with Plivo in minutes, without changing your current operation.",
        ),
        icon: PhoneCall,
      },
      {
        title: t("Configura tu agente", "Configure your agent"),
        description: t(
          "Define guion, filtros de lead, reglas de agenda y criterios de handoff.",
          "Define script, lead filters, scheduling rules and handoff criteria.",
        ),
        icon: Sparkles,
      },
      {
        title: t("La IA atiende y agenda", "AI answers and books"),
        description: t(
          "Responde en tiempo real, califica intencion y transfiere cuando detecta cierre.",
          "Responds in real time, qualifies intent, and transfers when it detects high closing intent.",
        ),
        icon: CalendarClock,
      },
    ],
    [t],
  );

  const securityPoints = useMemo(
    () => [
      t("Grabacion opcional por workspace", "Optional recording by workspace"),
      t("Validacion de webhooks", "Webhook validation"),
      t("Datos cifrados en transito y en reposo", "Data encrypted in transit and at rest"),
      t("Arquitectura multi-tenant con aislamiento por workspace", "Multi-tenant architecture with workspace isolation"),
    ],
    [t],
  );

  const plans = useMemo(
    () => [
      {
        name: "Starter",
        price: "$149",
        subtitle: t("Ideal para equipos pequenos", "Ideal for small teams"),
        features: [
          t("1 numero", "1 number"),
          t("Hasta 1,000 min/mes", "Up to 1,000 min/month"),
          t("Calificacion automatica", "Automatic qualification"),
        ],
      },
      {
        name: "Pro",
        price: "$399",
        subtitle: t("Para operacion comercial activa", "For active sales operations"),
        features: [
          t("3 numeros", "3 numbers"),
          t("Hasta 5,000 min/mes", "Up to 5,000 min/month"),
          t("Agenda + handoff inteligente", "Scheduling + smart handoff"),
        ],
        featured: true,
      },
      {
        name: "Scale",
        price: "Custom",
        subtitle: t("Volumen enterprise", "Enterprise volume"),
        features: [
          t("Numeros ilimitados", "Unlimited numbers"),
          "SLA",
          t("Seguridad y soporte avanzado", "Advanced security and support"),
        ],
      },
    ],
    [t],
  );

  const isAuthenticated = Boolean(session?.user?.id);

  const primaryHref = useMemo(
    () => (isAuthenticated ? "/dashboard" : "/register"),
    [isAuthenticated],
  );

  const primaryLabel = isAuthenticated ? t("Ir al Dashboard", "Go to Dashboard") : t("Crear Cuenta", "Create Account");

  return (
    <div className="relative min-h-screen overflow-x-clip bg-[#0B0F19] text-white">
      <div className="pointer-events-none absolute inset-0 [background:radial-gradient(40rem_40rem_at_15%_15%,rgba(69,94,255,0.18),transparent),radial-gradient(36rem_36rem_at_85%_10%,rgba(144,76,255,0.18),transparent),linear-gradient(to_bottom,#0B0F19,#0B0F19)]" />
      <div className="pointer-events-none absolute inset-0 opacity-35 [background-image:linear-gradient(rgba(255,255,255,0.045)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.045)_1px,transparent_1px)] [background-size:44px_44px]" />

      <div className="relative z-10 mx-auto w-full max-w-7xl px-5 pb-20 pt-6 md:px-8">
        <header className="sticky top-4 z-40">
          <nav className="mx-auto flex w-full items-center justify-between rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3 backdrop-blur-xl md:px-6">
            <Link href="/" className="inline-flex items-center gap-3">
              <span className="inline-flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br from-[#3D7BFF] to-[#8D4BFF] text-sm font-semibold">
                AI
              </span>
              <span className="text-sm font-semibold tracking-wide text-white/95 md:text-base">
                AI Call Closer
              </span>
            </Link>

            <div className="hidden items-center gap-8 md:flex">
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="text-sm text-white/70 transition-colors hover:text-white"
                >
                  {item.label}
                </Link>
              ))}
            </div>

            <div className="flex items-center gap-2">
              <LanguageToggle compact />
              <Button
                asChild
                variant="ghost"
                className="hidden border border-white/10 bg-white/[0.02] text-white/80 hover:bg-white/[0.07] hover:text-white sm:inline-flex"
              >
                <Link href="/sign-in">{t("Iniciar sesion", "Sign in")}</Link>
              </Button>
              <Button
                asChild
                className="bg-gradient-to-r from-[#3D7BFF] to-[#8D4BFF] text-white shadow-[0_0_32px_rgba(86,92,255,0.45)] transition-transform hover:scale-[1.02]"
              >
                <Link href={primaryHref}>{primaryLabel}</Link>
              </Button>
            </div>
          </nav>
        </header>

        <section id="producto" className="scroll-mt-28 px-1 pb-18 pt-16 md:pb-24 md:pt-24">
          <motion.div
            initial="hidden"
            animate="show"
            variants={fadeUp}
            transition={{ duration: 0.7, ease: "easeOut" }}
            className="mx-auto max-w-4xl text-center"
          >
            <Badge className="border border-white/20 bg-white/10 px-3 py-1 text-[11px] uppercase tracking-[0.18em] text-white/85">
              Silicon Valley 2026 Sales Infra
            </Badge>

            <motion.h1
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.12, duration: 0.8 }}
              className="mt-7 text-balance text-4xl font-semibold leading-tight sm:text-5xl md:text-6xl"
            >
              <span className="bg-gradient-to-r from-white via-white to-white/70 bg-clip-text text-transparent">
                {t("Tu equipo nunca vuelve a perder una llamada.", "Your team never misses a call again.")}
              </span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.24, duration: 0.8 }}
              className="mx-auto mt-6 max-w-3xl text-pretty text-base leading-relaxed text-white/70 sm:text-lg"
            >
              {t(
                "Automatiza llamadas entrantes con un agente de IA que califica, agenda y transfiere en tiempo real.",
                "Automate inbound calls with an AI agent that qualifies, schedules and transfers in real time.",
              )}
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.35, duration: 0.7 }}
              className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row"
            >
              <Button
                asChild
                size="lg"
                className="h-12 w-full bg-gradient-to-r from-[#3D7BFF] to-[#8D4BFF] text-white shadow-[0_0_32px_rgba(86,92,255,0.4)] hover:opacity-95 sm:w-auto"
              >
                <Link href={primaryHref}>
                  {t("Empieza Gratis", "Start Free")}
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <Button
                asChild
                size="lg"
                variant="ghost"
                className="h-12 w-full border border-white/15 bg-white/[0.03] text-white/85 hover:bg-white/[0.08] sm:w-auto"
              >
                <Link href="/sign-in">{t("Ver Demo", "Watch Demo")}</Link>
              </Button>
            </motion.div>
          </motion.div>
        </section>

        <section className="scroll-mt-28 px-1 pb-16">
          <motion.div
            variants={fadeUp}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, amount: 0.25 }}
            transition={{ duration: 0.65 }}
          >
            <Card className="border-white/15 bg-gradient-to-b from-[#121A31] to-[#0E1427] shadow-[0_20px_80px_rgba(18,43,128,0.35)]">
              <CardContent className="p-5 sm:p-7 md:p-8">
                <div className="flex items-center justify-between gap-3 border-b border-white/10 pb-4">
                  <div>
                    <p className="text-xs uppercase tracking-[0.16em] text-white/50">{t("Llamada en vivo", "Live call")}</p>
                    <p className="text-sm text-white/80">{t("Pipeline de ventas activo", "Active sales pipeline")}</p>
                  </div>
                  <div className="inline-flex items-center gap-2 rounded-full border border-emerald-300/25 bg-emerald-300/10 px-3 py-1 text-xs text-emerald-200">
                    <motion.span
                      animate={{ opacity: [0.5, 1, 0.5] }}
                      transition={{ repeat: Infinity, duration: 1.5 }}
                      className="h-2 w-2 rounded-full bg-emerald-300"
                    />
                    {t("Llamada en progreso", "Call in progress")}
                  </div>
                </div>

                <div className="mt-5 space-y-3">
                  {conversation.map((item, index) => (
                    <motion.div
                      key={`${item.speaker}-${index}`}
                      initial={{ opacity: 0, y: 12 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true }}
                      transition={{ delay: index * 0.08, duration: 0.45 }}
                      className={cn("flex", item.side === "right" ? "justify-end" : "justify-start")}
                    >
                      <div
                        className={cn(
                          "max-w-[92%] rounded-2xl border px-4 py-3 text-sm leading-relaxed sm:max-w-[78%]",
                          item.side === "right"
                            ? "border-[#597DFF]/50 bg-[#223368]/55"
                            : "border-white/15 bg-[#121724]/70",
                        )}
                      >
                        <p className="mb-1 text-[11px] uppercase tracking-[0.12em] text-white/50">
                          {item.speaker}
                        </p>
                        <p className="text-white/88">{item.text}</p>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </section>

        <section className="scroll-mt-28 px-1 pb-16">
          <motion.div
            variants={fadeUp}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, amount: 0.2 }}
            transition={{ duration: 0.65 }}
            className="grid gap-4 md:grid-cols-3"
          >
            {stats.map((stat) => (
              <Card key={stat.value} className="border-white/10 bg-white/[0.03]">
                <CardContent className="p-6">
                  <p className="text-4xl font-semibold text-white">{stat.value}</p>
                  <p className="mt-3 text-sm leading-relaxed text-white/65">{stat.label}</p>
                </CardContent>
              </Card>
            ))}
          </motion.div>
        </section>

        <section className="scroll-mt-28 px-1 pb-16">
          <SectionTitle
            eyebrow={t("Como funciona", "How it works")}
            title={t("Implementacion en 3 pasos", "3-step implementation")}
            description={t("No cambias tu stack comercial. Solo activas un sistema que responde, filtra y agenda por ti.", "You keep your current sales stack. You just activate a system that answers, filters and schedules for you.")}
          />

          <div className="mt-8 grid gap-4 md:grid-cols-3">
            {steps.map((step, index) => {
              const Icon = step.icon;

              return (
                <motion.div
                  key={step.title}
                  variants={fadeUp}
                  initial="hidden"
                  whileInView="show"
                  viewport={{ once: true }}
                  transition={{ duration: 0.55, delay: index * 0.08 }}
                >
                  <Card className="h-full border-white/10 bg-white/[0.03]">
                    <CardContent className="p-6">
                      <div className="mb-4 flex items-center justify-between">
                        <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-white/20 bg-white/[0.04] text-xs text-white/75">
                          0{index + 1}
                        </span>
                        <Icon className="h-4 w-4 text-[#8BA3FF]" />
                      </div>
                      <h3 className="text-lg font-medium text-white">{step.title}</h3>
                      <p className="mt-3 text-sm leading-relaxed text-white/65">{step.description}</p>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </div>
        </section>

        <section id="seguridad" className="scroll-mt-28 px-1 pb-16">
          <SectionTitle
            eyebrow="Security & Compliance"
            title={t("Disenado para operaciones B2B serias", "Built for serious B2B operations")}
            description={t("Arquitectura pensada para equipos que operan volumen y necesitan trazabilidad completa.", "Architecture designed for teams running volume and needing full traceability.")}
          />

          <motion.div
            variants={fadeUp}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="mt-8 grid gap-4 md:grid-cols-[1.2fr_1fr]"
          >
            <Card className="border-white/10 bg-white/[0.03]">
              <CardContent className="space-y-4 p-6">
                {securityPoints.map((item) => (
                  <div key={item} className="flex items-start gap-3">
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-[#8FB2FF]" />
                    <p className="text-sm text-white/75">{item}</p>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card className="border-white/10 bg-gradient-to-b from-[#182348] to-[#111A35]">
              <CardContent className="flex h-full flex-col justify-between p-6">
                <div className="space-y-4">
                  <div className="inline-flex w-fit items-center gap-2 rounded-full border border-white/15 px-3 py-1 text-xs text-white/75">
                    <ShieldCheck className="h-3.5 w-3.5" />
                    Security First
                  </div>
                  <p className="text-sm leading-relaxed text-white/72">
                    {t(
                      "Logs estructurados por llamada, verificacion de firma en webhooks y control por workspace desde una arquitectura multi-tenant.",
                      "Structured call logs, webhook signature verification and workspace control over a multi-tenant architecture.",
                    )}
                  </p>
                </div>
                <div className="mt-6 grid grid-cols-2 gap-3 text-xs text-white/65">
                  <MiniStat icon={Lock} label={t("Encriptacion", "Encryption")} value="TLS + at-rest" />
                  <MiniStat icon={UserRoundCheck} label={t("Validacion", "Validation")} value="Signed" />
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </section>

        <section id="precios" className="scroll-mt-28 px-1 pb-16">
          <SectionTitle
            eyebrow="Pricing"
            title={t("Planes para cada etapa de crecimiento", "Plans for every growth stage")}
            description={t("Empieza pequeno y escala a operacion enterprise sin rehacer tu proceso.", "Start small and scale to enterprise operations without rebuilding your process.")}
          />

          <div className="mt-8 grid gap-4 md:grid-cols-3">
            {plans.map((plan, index) => (
              <motion.div
                key={plan.name}
                variants={fadeUp}
                initial="hidden"
                whileInView="show"
                viewport={{ once: true }}
                transition={{ duration: 0.55, delay: index * 0.08 }}
              >
                <Card
                  className={cn(
                    "h-full border-white/10 bg-white/[0.03]",
                    plan.featured &&
                      "border-[#6D8CFF]/50 bg-gradient-to-b from-[#1B2B58] to-[#121B36] shadow-[0_0_32px_rgba(86,106,255,0.28)]",
                  )}
                >
                  <CardContent className="flex h-full flex-col p-6">
                    <div>
                      <p className="text-sm text-white/65">{plan.name}</p>
                      <p className="mt-2 text-3xl font-semibold text-white">{plan.price}</p>
                      <p className="mt-2 text-sm text-white/65">{plan.subtitle}</p>
                    </div>

                    <ul className="mt-6 space-y-3">
                      {plan.features.map((feature) => (
                        <li key={feature} className="flex items-start gap-2 text-sm text-white/78">
                          <ChevronRight className="mt-0.5 h-4 w-4 text-[#8EA8FF]" />
                          <span>{feature}</span>
                        </li>
                      ))}
                    </ul>

                    <Button
                      asChild
                      className={cn(
                        "mt-8 h-11 w-full",
                        plan.featured
                          ? "bg-gradient-to-r from-[#3D7BFF] to-[#8D4BFF] text-white"
                          : "bg-white/10 text-white hover:bg-white/15",
                      )}
                    >
                      <Link href={`/register?plan=${plan.name.toLowerCase()}`}>{t("Crear Cuenta", "Create Account")}</Link>
                    </Button>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </section>

        <section className="px-1 pb-8">
          <motion.div
            variants={fadeUp}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true }}
            transition={{ duration: 0.65 }}
            className="rounded-3xl border border-white/15 bg-gradient-to-r from-[#1A2F73] via-[#273A8A] to-[#5A2CA8] p-7 shadow-[0_30px_80px_rgba(67,85,201,0.45)] sm:p-10"
          >
            <p className="text-xs uppercase tracking-[0.16em] text-white/75">Ready to launch</p>
            <h2 className="mt-3 max-w-2xl text-balance text-3xl font-semibold leading-tight sm:text-4xl">
              {t("Activa tu agente en 5 minutos.", "Activate your agent in 5 minutes.")}
            </h2>
            <p className="mt-4 max-w-2xl text-sm leading-relaxed text-white/80 sm:text-base">
              {t(
                "Convierte mas llamadas en reuniones de venta sin aumentar headcount. Tu equipo se enfoca en cerrar, la IA se encarga del primer contacto.",
                "Turn more calls into sales meetings without increasing headcount. Your team focuses on closing while AI handles first contact.",
              )}
            </p>

            <div className="mt-7 flex flex-col gap-3 sm:flex-row">
              <Button asChild size="lg" className="h-12 bg-white text-[#1A2456] hover:bg-white/90">
                <Link href={primaryHref}>
                  {isAuthenticated ? t("Abrir Dashboard", "Open Dashboard") : t("Empieza Gratis", "Start Free")}
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <Button
                asChild
                size="lg"
                variant="ghost"
                className="h-12 border border-white/30 bg-white/10 text-white hover:bg-white/20"
              >
                <Link href="/sign-in">{t("Ver Demo", "Watch Demo")}</Link>
              </Button>
            </div>
          </motion.div>
        </section>

        <footer className="border-t border-white/10 px-1 pt-6">
          <div className="flex flex-col gap-4 pb-6 text-sm text-white/65 md:flex-row md:items-start md:justify-between">
            <div className="space-y-1">
              <p className="font-medium text-white/85">
                {t("AI Call Closer - Afiliados Pro Business Lab", "AI Call Closer - Afiliados Pro Business Lab")}
              </p>
              <p>
                {t(
                  "Disenado y creado por Afiliados Pro Business Lab. Todos los derechos reservados.",
                  "Designed and created by Afiliados Pro Business Lab. All rights reserved.",
                )}
              </p>
              <p>{t("Contacto: afiliadosprobusiness@gmail.com", "Contact: afiliadosprobusiness@gmail.com")}</p>
              <p>
                {t(
                  "Servicio SaaS B2B para automatizacion de llamadas, calificacion de leads y agenda comercial.",
                  "B2B SaaS for call automation, lead qualification, and sales scheduling.",
                )}
              </p>
            </div>

            <nav className="flex flex-wrap gap-4 text-sm">
              <Link href="/privacy" className="transition-colors hover:text-white">
                {t("Privacidad", "Privacy")}
              </Link>
              <Link href="/terms" className="transition-colors hover:text-white">
                {t("Terminos", "Terms")}
              </Link>
              <Link href="/about-us" className="transition-colors hover:text-white">
                {t("Quienes somos", "About us")}
              </Link>
            </nav>
          </div>
        </footer>
      </div>
    </div>
  );
}

function SectionTitle(props: { eyebrow: string; title: string; description: string }) {
  return (
    <div className="mx-auto max-w-3xl text-center">
      <p className="text-xs uppercase tracking-[0.16em] text-white/50">{props.eyebrow}</p>
      <h2 className="mt-3 text-balance text-3xl font-semibold text-white sm:text-4xl">{props.title}</h2>
      <p className="mt-4 text-pretty text-sm leading-relaxed text-white/68 sm:text-base">
        {props.description}
      </p>
    </div>
  );
}

function MiniStat(props: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
}) {
  const Icon = props.icon;

  return (
    <div className="rounded-xl border border-white/12 bg-white/[0.03] p-3">
      <Icon className="mb-2 h-4 w-4 text-[#9AB4FF]" />
      <p className="text-[11px] uppercase tracking-[0.1em] text-white/50">{props.label}</p>
      <p className="mt-1 text-sm text-white/80">{props.value}</p>
    </div>
  );
}
