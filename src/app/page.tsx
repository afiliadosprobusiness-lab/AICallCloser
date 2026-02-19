"use client";

import Link from "next/link";
import Script from "next/script";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";
import {
  ArrowRight,
  CalendarClock,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Lock,
  MessageSquareQuote,
  PhoneCall,
  ShieldCheck,
  Sparkles,
  Star,
  UserRoundCheck,
} from "lucide-react";

import { LanguageToggle } from "@/components/language-toggle";
import { BrandMark } from "@/components/brand/brand-mark";
import {
  LeadChatLiveDemoData,
  LeadChatPayload,
  LeadChatPublicWidget,
  type LeadChatPrefillContext,
} from "@/components/landing/lead-chat-public-widget";
import {
  DemoLeadPayload,
  LiveChatToCallDemoSection,
  type LiveDemoPrefillContext,
  type LiveDemoRuntimeContext,
} from "@/components/landing/live-chat-to-call-demo-section";
import { UseCasesSection, type UseCaseSelectionPayload } from "@/components/landing/use-cases-section";
import { useLocale } from "@/components/providers/locale-provider";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";

type SimpleSession = {
  user?: {
    id?: string;
    email?: string | null;
    name?: string | null;
  };
};

type Testimonial = {
  name: string;
  role: string;
  company: string;
  rating: 4 | 5;
  quote: string;
  avatar: string;
};

type FaqItem = {
  question: string;
  answer: string;
};

const fadeUp = {
  hidden: { opacity: 0, y: 22 },
  show: { opacity: 1, y: 0 },
};

export default function HomePage() {
  const { t, locale } = useLocale();
  const [session, setSession] = useState<SimpleSession | null>(null);
  const [isLeadChatModalOpen, setIsLeadChatModalOpen] = useState(false);
  const [liveDemoPrefill, setLiveDemoPrefill] = useState<LiveDemoPrefillContext | null>(null);
  const [leadChatPrefill, setLeadChatPrefill] = useState<LeadChatPrefillContext | null>(null);
  const [liveDemoRuntime, setLiveDemoRuntime] = useState<LiveDemoRuntimeContext | null>(null);
  const [hasCapturedLeadForDemo, setHasCapturedLeadForDemo] = useState(false);
  const [isDesktopNavScrolled, setIsDesktopNavScrolled] = useState(false);
  const [isPricingInView, setIsPricingInView] = useState(false);
  const [hasPassedPricing, setHasPassedPricing] = useState(false);
  const [activeFaqIndex, setActiveFaqIndex] = useState<number>(0);
  const [testimonialPage, setTestimonialPage] = useState(0);
  const [testimonialPageCount, setTestimonialPageCount] = useState(1);
  const [renderedTestimonialsCount, setRenderedTestimonialsCount] = useState(9);
  const [isTestimonialAutoplayPaused, setIsTestimonialAutoplayPaused] = useState(false);
  const [isTestimonialsDragging, setIsTestimonialsDragging] = useState(false);
  const testimonialTrackRef = useRef<HTMLDivElement>(null);
  const testimonialDragRef = useRef({
    isDragging: false,
    startX: 0,
    scrollLeft: 0,
  });
  const leadChatAutoCloseTimerRef = useRef<number | null>(null);

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

  useEffect(() => {
    return () => {
      if (leadChatAutoCloseTimerRef.current != null) {
        window.clearTimeout(leadChatAutoCloseTimerRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const desktopQuery = window.matchMedia("(min-width: 768px)");
    let ticking = false;

    const updateDesktopNav = () => {
      ticking = false;

      if (!desktopQuery.matches) {
        setIsDesktopNavScrolled(false);
        return;
      }

      const nextScrolled = window.scrollY > 80;
      setIsDesktopNavScrolled((current) => (current === nextScrolled ? current : nextScrolled));
    };

    const onScroll = () => {
      if (!desktopQuery.matches || ticking) return;
      ticking = true;
      window.requestAnimationFrame(updateDesktopNav);
    };

    const onViewportChange = () => updateDesktopNav();

    updateDesktopNav();
    window.addEventListener("scroll", onScroll, { passive: true });

    if (typeof desktopQuery.addEventListener === "function") {
      desktopQuery.addEventListener("change", onViewportChange);
    } else {
      desktopQuery.addListener(onViewportChange);
    }

    return () => {
      window.removeEventListener("scroll", onScroll);
      if (typeof desktopQuery.removeEventListener === "function") {
        desktopQuery.removeEventListener("change", onViewportChange);
      } else {
        desktopQuery.removeListener(onViewportChange);
      }
    };
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const pricingSection = document.getElementById("precios");
    if (!pricingSection) return;

    let rafId = 0;

    const updatePricingProgress = () => {
      rafId = 0;
      const rect = pricingSection.getBoundingClientRect();
      const nextPassed = rect.bottom < 120;
      setHasPassedPricing((current) => (current === nextPassed ? current : nextPassed));
    };

    const onScrollOrResize = () => {
      if (rafId) return;
      rafId = window.requestAnimationFrame(updatePricingProgress);
    };

    const observer = new IntersectionObserver(
      ([entry]) => {
        const nextInView = entry.isIntersecting;
        setIsPricingInView((current) => (current === nextInView ? current : nextInView));
      },
      {
        threshold: 0.2,
        rootMargin: "-15% 0px -45% 0px",
      },
    );

    observer.observe(pricingSection);
    updatePricingProgress();
    window.addEventListener("scroll", onScrollOrResize, { passive: true });
    window.addEventListener("resize", onScrollOrResize);

    return () => {
      if (rafId) window.cancelAnimationFrame(rafId);
      observer.disconnect();
      window.removeEventListener("scroll", onScrollOrResize);
      window.removeEventListener("resize", onScrollOrResize);
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

  const benefits = useMemo(
    () => [
      {
        title: t("Responde en menos de 2 minutos", "Respond in under 2 minutes"),
        description: t(
          "Convierte intencion en conversaciones reales antes de que el lead se enfrie.",
          "Turn intent into real conversations before the lead goes cold.",
        ),
      },
      {
        title: t("Califica y agenda automaticamente", "Qualify and schedule automatically"),
        description: t(
          "El embudo combina chat + llamada IA para mover al lead al siguiente paso sin friccion.",
          "The funnel combines chat + AI call to move the lead to the next step without friction.",
        ),
      },
      {
        title: t("ROI claro desde la primera cita", "Clear ROI from the first appointment"),
        description: t(
          "Muchos equipos recuperan la inversion con una cita extra agendada.",
          "Most teams recover the cost with one extra booked appointment.",
        ),
      },
    ],
    [t],
  );

  const steps = useMemo(
    () => [
      {
        title: t("Conecta tu numero", "Connect your number"),
        description: t(
          "Integra tu linea con Telnyx en minutos, sin cambiar tu operacion actual.",
          "Integrate your line with Telnyx in minutes, without changing your current operation.",
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

  const testimonials = useMemo<Testimonial[]>(
    () => [
      {
        name: "Olivia Carter",
        role: t("Directora Comercial", "Commercial Director"),
        company: "Nova Realty Group",
        rating: 5,
        quote: t(
          "En 30 dias subimos 41% la toma de llamadas y llenamos agenda sin contratar mas recepcion.",
          "In 30 days we increased answered calls by 41% and filled our calendar without hiring more reception staff.",
        ),
        avatar: "https://randomuser.me/api/portraits/women/44.jpg",
      },
      {
        name: "Marcus Reed",
        role: t("Fundador", "Founder"),
        company: "Peak Dental Care",
        rating: 4,
        quote: t(
          "Lo implementamos en una tarde y la IA ya filtra mejor que nuestro flujo manual anterior.",
          "We deployed it in one afternoon and the AI already qualifies better than our previous manual flow.",
        ),
        avatar: "https://randomuser.me/api/portraits/men/46.jpg",
      },
      {
        name: "Sophia Nguyen",
        role: t("Head of Growth", "Head of Growth"),
        company: "Aurora Legal Partners",
        rating: 5,
        quote: t(
          "El handoff inteligente nos da solo contactos con intencion alta. El equipo ahora cierra mas rapido.",
          "Smart handoff gives us only high-intent contacts. The team now closes faster.",
        ),
        avatar: "https://randomuser.me/api/portraits/women/68.jpg",
      },
      {
        name: "Daniel Brooks",
        role: t("Operations Manager", "Operations Manager"),
        company: "Apex Home Services",
        rating: 5,
        quote: t(
          "Pasamos de perder llamadas fuera de horario a tener pipeline constante todos los dias.",
          "We went from missing after-hours calls to maintaining a constant daily pipeline.",
        ),
        avatar: "https://randomuser.me/api/portraits/men/64.jpg",
      },
      {
        name: "Emma Rossi",
        role: t("Sales Leader", "Sales Leader"),
        company: "Velocity Clinics",
        rating: 4,
        quote: t(
          "La calidad de datos en leads mejoro mucho y el equipo comercial dedica menos tiempo al triage.",
          "Lead data quality improved a lot and the sales team spends less time on triage.",
        ),
        avatar: "https://randomuser.me/api/portraits/women/39.jpg",
      },
      {
        name: "Lucas Bennett",
        role: t("Gerente de Ventas", "Sales Manager"),
        company: "Prime Mortgage Hub",
        rating: 5,
        quote: t(
          "Cada llamada entrante ahora tiene trazabilidad completa y score comercial claro.",
          "Every incoming call now has full traceability and a clear commercial score.",
        ),
        avatar: "https://randomuser.me/api/portraits/men/52.jpg",
      },
      {
        name: "Isabella Moretti",
        role: t("COO", "COO"),
        company: "Alta Med Clinics",
        rating: 4,
        quote: t(
          "La agenda se mantiene llena incluso en horarios pico. El impacto fue inmediato.",
          "The calendar stays full even during peak hours. The impact was immediate.",
        ),
        avatar: "https://randomuser.me/api/portraits/women/24.jpg",
      },
      {
        name: "Noah Williams",
        role: t("Director de Operaciones", "Operations Director"),
        company: "Summit Legal Group",
        rating: 5,
        quote: t(
          "El equipo humano solo toma llamadas de alto valor. Mejoró todo el enfoque comercial.",
          "The human team only takes high-value calls. It improved our entire sales focus.",
        ),
        avatar: "https://randomuser.me/api/portraits/men/21.jpg",
      },
      {
        name: "Mia Johnson",
        role: t("Head de Revenue", "Head of Revenue"),
        company: "Urban Realty Partners",
        rating: 5,
        quote: t(
          "Nuestra tasa de respuesta subio y también la calidad de cada oportunidad registrada.",
          "Our answer rate improved, and so did the quality of each recorded opportunity.",
        ),
        avatar: "https://randomuser.me/api/portraits/women/31.jpg",
      },
      {
        name: "Ethan Clark",
        role: t("Fundador", "Founder"),
        company: "Core Tax Advisory",
        rating: 4,
        quote: t(
          "Integración limpia con nuestro flujo actual, sin frenar operaciones.",
          "Clean integration with our current workflow without slowing operations.",
        ),
        avatar: "https://randomuser.me/api/portraits/men/29.jpg",
      },
      {
        name: "Amelia King",
        role: t("Lider de Cierre", "Closing Team Lead"),
        company: "BlueLine Properties",
        rating: 5,
        quote: t(
          "El filtro por intención nos ahorra horas semanales y mejora conversiones.",
          "Intent filtering saves us hours weekly and improves conversions.",
        ),
        avatar: "https://randomuser.me/api/portraits/women/56.jpg",
      },
      {
        name: "Aiden Perez",
        role: t("Gerente General", "General Manager"),
        company: "Vertex Health Care",
        rating: 4,
        quote: t(
          "Implementamos sin fricción y desde el día uno vimos más citas calificadas.",
          "We implemented with no friction and saw more qualified appointments from day one.",
        ),
        avatar: "https://randomuser.me/api/portraits/men/11.jpg",
      },
      {
        name: "Harper Davis",
        role: t("Directora de Marketing", "Marketing Director"),
        company: "NorthPath Finance",
        rating: 5,
        quote: t(
          "El transcript automático nos dio visibilidad real del dolor del cliente.",
          "Automatic transcripts gave us real visibility into customer pain points.",
        ),
        avatar: "https://randomuser.me/api/portraits/women/62.jpg",
      },
      {
        name: "Logan Ward",
        role: t("Head de Ventas", "Head of Sales"),
        company: "Precision Solar Co.",
        rating: 5,
        quote: t(
          "Nunca habíamos tenido un sistema tan consistente para no perder llamadas.",
          "We had never had such a consistent system to avoid missed calls.",
        ),
        avatar: "https://randomuser.me/api/portraits/men/75.jpg",
      },
      {
        name: "Ava Foster",
        role: t("Directora Comercial", "Commercial Director"),
        company: "Helix Dental Network",
        rating: 4,
        quote: t(
          "La transferencia a humano funciona justo cuando el lead está listo para avanzar.",
          "Human transfer kicks in exactly when the lead is ready to move forward.",
        ),
        avatar: "https://randomuser.me/api/portraits/women/15.jpg",
      },
      {
        name: "Mason Brooks",
        role: t("COO", "COO"),
        company: "Gateway Home Services",
        rating: 5,
        quote: t(
          "Subimos productividad comercial sin aumentar equipo de atención.",
          "We increased sales productivity without growing the support team.",
        ),
        avatar: "https://randomuser.me/api/portraits/men/36.jpg",
      },
      {
        name: "Charlotte Evans",
        role: t("Gerente de Operaciones", "Operations Manager"),
        company: "Silverline Realty",
        rating: 4,
        quote: t(
          "Ahora sabemos exactamente qué llamadas generan ingresos y cuáles no.",
          "Now we know exactly which calls generate revenue and which do not.",
        ),
        avatar: "https://randomuser.me/api/portraits/women/73.jpg",
      },
      {
        name: "Elijah Cooper",
        role: t("Director Comercial", "Commercial Director"),
        company: "Axis Consulting",
        rating: 5,
        quote: t(
          "La velocidad de respuesta mejoró la experiencia del prospecto desde el primer minuto.",
          "Response speed improved prospect experience from the very first minute.",
        ),
        avatar: "https://randomuser.me/api/portraits/men/58.jpg",
      },
      {
        name: "Luna Mitchell",
        role: t("Head de Growth", "Head of Growth"),
        company: "PrimeCare Clinics",
        rating: 5,
        quote: t(
          "Tener IA 24/7 nos permitió capturar demanda fuera de horario laboral.",
          "Having 24/7 AI allowed us to capture demand outside business hours.",
        ),
        avatar: "https://randomuser.me/api/portraits/women/42.jpg",
      },
      {
        name: "James Rivera",
        role: t("Founder", "Founder"),
        company: "BridgePoint Insurance",
        rating: 4,
        quote: t(
          "El onboarding fue rápido y el equipo adoptó la plataforma sin resistencia.",
          "Onboarding was fast and the team adopted the platform without resistance.",
        ),
        avatar: "https://randomuser.me/api/portraits/men/40.jpg",
      },
    ],
    [t],
  );

  const visibleTestimonials = useMemo(
    () => testimonials.slice(0, renderedTestimonialsCount),
    [testimonials, renderedTestimonialsCount],
  );

  const faqItems = useMemo<FaqItem[]>(
    () => [
      {
        question: t(
          "Cuanto tarda en activarse AI Call Closer?",
          "How long does it take to activate AI Call Closer?",
        ),
        answer: t(
          "Normalmente entre 5 y 15 minutos: conectas numero, ajustas guion y defines reglas de agenda/handoff.",
          "Usually between 5 and 15 minutes: connect your number, adjust the script, and define scheduling/handoff rules.",
        ),
      },
      {
        question: t(
          "Puedo usar mi numero actual sin cambiar de operador?",
          "Can I keep my current number without changing carriers?",
        ),
        answer: t(
          "Si. Puedes conectar un numero existente o comprar uno nuevo en Telnyx y enrutar llamadas de inmediato.",
          "Yes. You can connect your existing number or buy a new one in Telnyx and route calls immediately.",
        ),
      },
      {
        question: t(
          "Como evita la IA inventar precios o promesas?",
          "How does the AI avoid inventing prices or promises?",
        ),
        answer: t(
          "Usamos guardrails por workspace: reglas duras, respuestas permitidas y handoff automatico cuando falta contexto.",
          "We use workspace guardrails: strict rules, allowed responses, and automatic handoff whenever context is missing.",
        ),
      },
      {
        question: t(
          "Que pasa si el lead pide hablar con una persona?",
          "What happens if a lead asks to talk to a person?",
        ),
        answer: t(
          "La llamada se transfiere al contacto humano definido en Ajustes segun prioridad y horario.",
          "The call is transferred to the human contact configured in Settings based on priority and schedule.",
        ),
      },
      {
        question: t(
          "Donde veo transcripts, leads y conversiones?",
          "Where can I see transcripts, leads and conversions?",
        ),
        answer: t(
          "Todo queda en tu dashboard: historial de llamadas, estado de lead, transcript y metricas de conversion en tiempo real.",
          "Everything is in your dashboard: call history, lead status, transcript and real-time conversion metrics.",
        ),
      },
    ],
    [t],
  );

  const isAuthenticated = Boolean(session?.user?.id);
  const menuCtaMode = isAuthenticated
    ? "dashboard"
    : hasPassedPricing
      ? "live_demo"
      : isPricingInView
        ? "free_trial"
        : "create_account";
  const primaryHref = menuCtaMode === "dashboard" ? "/dashboard" : "/register";
  const primaryLabel =
    menuCtaMode === "dashboard"
      ? t("Ir al Dashboard", "Go to Dashboard")
      : menuCtaMode === "free_trial"
        ? t("Iniciar prueba gratuita", "Start free trial")
        : menuCtaMode === "live_demo"
          ? t("Prueba la demostracion en vivo", "Try the live demo")
          : t("Crear Cuenta", "Create Account");
  const primaryLabelCompact =
    menuCtaMode === "dashboard"
      ? t("Dashboard", "Dashboard")
      : menuCtaMode === "free_trial"
        ? t("Prueba gratis", "Free trial")
        : menuCtaMode === "live_demo"
          ? t("Demo en vivo", "Live demo")
          : t("Crear", "Create");
  const isLiveDemoPrimaryCta = menuCtaMode === "live_demo";

  useEffect(() => {
    if (renderedTestimonialsCount >= testimonials.length) return;
    const timer = window.setTimeout(() => {
      setRenderedTestimonialsCount((current) => Math.min(testimonials.length, current + 3));
    }, 1400);

    return () => window.clearTimeout(timer);
  }, [renderedTestimonialsCount, testimonials.length]);

  function updateTestimonialPaging(track: HTMLDivElement) {
    const pageWidth = Math.max(track.clientWidth, 1);
    const maxPage = Math.max(0, Math.ceil(track.scrollWidth / pageWidth) - 1);
    const currentPage = Math.min(maxPage, Math.max(0, Math.round(track.scrollLeft / pageWidth)));
    setTestimonialPageCount(maxPage + 1);
    setTestimonialPage(currentPage);
  }

  useEffect(() => {
    const track = testimonialTrackRef.current;
    if (!track) return;

    updateTestimonialPaging(track);

    const onResize = () => updateTestimonialPaging(track);
    window.addEventListener("resize", onResize);

    if (typeof ResizeObserver !== "undefined") {
      const observer = new ResizeObserver(() => updateTestimonialPaging(track));
      observer.observe(track);
      return () => {
        observer.disconnect();
        window.removeEventListener("resize", onResize);
      };
    }

    return () => window.removeEventListener("resize", onResize);
  }, [visibleTestimonials.length]);

  function scrollTrack(track: HTMLDivElement | null, direction: "left" | "right") {
    if (!track) return;
    setIsTestimonialAutoplayPaused(true);

    const offset = Math.max(track.clientWidth * 0.84, 280);
    track.scrollBy({
      left: direction === "left" ? -offset : offset,
      behavior: "smooth",
    });

    if (direction === "right" && renderedTestimonialsCount < testimonials.length) {
      setRenderedTestimonialsCount((current) => Math.min(testimonials.length, current + 4));
    }
  }

  function scrollTestimonialsToPage(pageIndex: number) {
    const track = testimonialTrackRef.current;
    if (!track) return;
    setIsTestimonialAutoplayPaused(true);

    const safePage = Math.max(0, Math.min(pageIndex, testimonialPageCount - 1));
    track.scrollTo({
      left: safePage * track.clientWidth,
      behavior: "smooth",
    });
  }

  function onTestimonialsScroll(event: React.UIEvent<HTMLDivElement>) {
    const track = event.currentTarget;
    updateTestimonialPaging(track);

    if (
      track.scrollLeft + track.clientWidth >= track.scrollWidth - 220 &&
      renderedTestimonialsCount < testimonials.length
    ) {
      setRenderedTestimonialsCount((current) => Math.min(testimonials.length, current + 4));
    }
  }

  function onTestimonialsPointerDown(event: React.PointerEvent<HTMLDivElement>) {
    const track = testimonialTrackRef.current;
    if (!track) return;
    if (event.pointerType === "mouse" && event.button !== 0) return;

    setIsTestimonialAutoplayPaused(true);
    const drag = testimonialDragRef.current;
    drag.isDragging = true;
    drag.startX = event.clientX;
    drag.scrollLeft = track.scrollLeft;
    setIsTestimonialsDragging(true);
    track.setPointerCapture(event.pointerId);
  }

  function onTestimonialsPointerMove(event: React.PointerEvent<HTMLDivElement>) {
    const track = testimonialTrackRef.current;
    if (!track || !testimonialDragRef.current.isDragging) return;

    const deltaX = event.clientX - testimonialDragRef.current.startX;
    track.scrollLeft = testimonialDragRef.current.scrollLeft - deltaX;
  }

  function onTestimonialsPointerEnd(event: React.PointerEvent<HTMLDivElement>) {
    const track = testimonialTrackRef.current;
    if (!track) return;

    testimonialDragRef.current.isDragging = false;
    setIsTestimonialsDragging(false);

    if (track.hasPointerCapture(event.pointerId)) {
      track.releasePointerCapture(event.pointerId);
    }
  }

  function onTestimonialsWheel(event: React.WheelEvent<HTMLDivElement>) {
    const track = event.currentTarget;
    if (Math.abs(event.deltaY) <= Math.abs(event.deltaX)) return;

    track.scrollLeft += event.deltaY;
    setIsTestimonialAutoplayPaused(true);
    event.preventDefault();
  }

  useEffect(() => {
    if (isTestimonialAutoplayPaused || testimonialPageCount <= 1) {
      return;
    }

    if (typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      return;
    }

    const timer = window.setInterval(() => {
      const track = testimonialTrackRef.current;
      if (!track) return;

      const nextPage = testimonialPage + 1 >= testimonialPageCount ? 0 : testimonialPage + 1;
      track.scrollTo({
        left: nextPage * track.clientWidth,
        behavior: "smooth",
      });
    }, 4200);

    return () => window.clearInterval(timer);
  }, [isTestimonialAutoplayPaused, testimonialPage, testimonialPageCount]);

  useEffect(() => {
    if (!isTestimonialAutoplayPaused) return;

    const resumeTimer = window.setTimeout(() => {
      setIsTestimonialAutoplayPaused(false);
    }, 7000);

    return () => window.clearTimeout(resumeTimer);
  }, [isTestimonialAutoplayPaused]);

  function scrollToLiveDemo(openModal = false) {
    const section = document.getElementById("live-chat-demo");
    section?.scrollIntoView({ behavior: "smooth", block: "start" });
    if (openModal) {
      clearLeadChatAutoCloseTimer();
      setIsLeadChatModalOpen(true);
    }
  }

  function clearLeadChatAutoCloseTimer() {
    if (leadChatAutoCloseTimerRef.current == null) return;
    window.clearTimeout(leadChatAutoCloseTimerRef.current);
    leadChatAutoCloseTimerRef.current = null;
  }

  function scheduleLeadChatAutoClose() {
    clearLeadChatAutoCloseTimer();
    leadChatAutoCloseTimerRef.current = window.setTimeout(() => {
      setIsLeadChatModalOpen(false);
      scrollToLiveDemo(false);
      leadChatAutoCloseTimerRef.current = null;
    }, 5000);
  }

  function onUseCaseSelect(payload: UseCaseSelectionPayload) {
    setLiveDemoPrefill(payload.liveDemoPrefill);
    setLeadChatPrefill(payload.leadChatPrefill);
    setLiveDemoRuntime({
      leadName: payload.leadChatPrefill.name,
      business: payload.leadChatPrefill.business,
      phone: payload.leadChatPrefill.phoneE164,
      goal:
        payload.leadChatPrefill.goal === "appointments"
          ? t("agendar citas", "book appointments")
          : payload.leadChatPrefill.goal === "close_deals"
            ? t("cerrar ventas", "close deals")
            : t("ver precios", "check pricing"),
      openingMessage:
        locale === "en"
          ? payload.leadChatPrefill.openingMessageEn
          : payload.leadChatPrefill.openingMessageEs,
    });
    scrollToLiveDemo(true);
  }

  async function onSubmitDemoLead(payload: DemoLeadPayload) {
    void payload;
    // TODO: connect to backend lead capture endpoint.
  }

  async function onStartDemoCall(payload: DemoLeadPayload) {
    void payload;
    // TODO: connect to Twilio demo call trigger.
  }

  async function onSubmitLeadChatWidget(payload: LeadChatPayload) {
    void payload;
    // TODO: connect Lead Chat widget with public handoff endpoint.
  }

  const onLeadChatLiveDataChange = useCallback((payload: LeadChatLiveDemoData) => {
    setLiveDemoRuntime((prev) => {
      const leadName = payload.name || prev?.leadName || liveDemoPrefill?.leadName || "";
      const business = payload.business || prev?.business || "";
      const phone = payload.phoneE164 || prev?.phone || "";
      const goal = payload.goalLabel || prev?.goal || "";
      const openingMessage =
        locale === "en"
          ? `Hi, I am ${leadName || "there"}. I run ${business || "a business"} and want ${goal || "more customers"}.`
          : `Hola, soy ${leadName || "cliente"}. Tengo ${business || "un negocio"} y quiero ${goal || "mas clientes"}.`;

      const nextValue = {
        leadName,
        business,
        phone,
        goal,
        openingMessage,
      };
      if (
        prev?.leadName === nextValue.leadName &&
        prev?.business === nextValue.business &&
        prev?.phone === nextValue.phone &&
        prev?.goal === nextValue.goal &&
        prev?.openingMessage === nextValue.openingMessage
      ) {
        return prev;
      }
      return nextValue;
    });
  }, [liveDemoPrefill?.leadName, locale]);

  function onLeadChatCompleted() {
    setHasCapturedLeadForDemo(true);
    scheduleLeadChatAutoClose();
  }

  return (
    <div className="landing-root relative min-h-screen overflow-x-clip bg-[#0B0F19] text-white">
      <div className="pointer-events-none absolute inset-0 [background:radial-gradient(40rem_40rem_at_15%_15%,rgba(69,94,255,0.18),transparent),radial-gradient(36rem_36rem_at_85%_10%,rgba(144,76,255,0.18),transparent),linear-gradient(to_bottom,#0B0F19,#0B0F19)]" />
      <div className="pointer-events-none absolute inset-0 opacity-35 [background-image:linear-gradient(rgba(255,255,255,0.045)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.045)_1px,transparent_1px)] [background-size:44px_44px]" />

      <div className="relative z-10 mx-auto w-full max-w-7xl px-5 pb-20 pt-24 md:px-8 md:pt-6">
        <header className="fixed inset-x-0 top-0 z-50 px-3 pt-3 sm:px-5 md:px-0 md:pt-0">
          <nav
            className={cn(
              "mx-auto flex w-full max-w-7xl flex-wrap items-center gap-2 rounded-2xl border border-white/10 bg-[#0F1527]/85 px-3 py-2.5 shadow-[0_10px_35px_rgba(7,10,22,0.55)] backdrop-blur-xl md:flex-nowrap md:justify-between md:px-6 md:transition-[height,background-color,border-color,box-shadow,backdrop-filter] md:duration-200 md:ease-out",
              isDesktopNavScrolled
                ? "md:h-[60px] md:border-white/10 md:bg-[#0E1425]/82 md:shadow-[0_14px_40px_rgba(4,8,24,0.45)] md:backdrop-blur-xl"
                : "md:h-[72px] md:border-white/12 md:bg-[#0B1020]/35 md:shadow-[0_6px_20px_rgba(4,8,24,0.25)] md:backdrop-blur-md",
            )}
          >
            <Link href="/" className="inline-flex min-w-0 items-center gap-2.5">
              <BrandMark className="h-8 w-8" />
              <span className="text-sm font-semibold tracking-wide text-white/95 md:text-base">
                AI Call Closer
              </span>
            </Link>
            <div className="ml-auto md:hidden">
              <LanguageToggle compact />
            </div>

            <div className="hidden items-center gap-8 md:flex">
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="text-sm text-white/85 transition-colors hover:text-white"
                >
                  {item.label}
                </Link>
              ))}
            </div>

            <div className="flex w-full items-center gap-2 md:w-auto md:justify-end">
              <div className="hidden md:block">
                <LanguageToggle compact />
              </div>
              <Button
                asChild
                variant="ghost"
                className="h-9 w-full min-w-0 flex-1 border border-white/10 bg-white/[0.02] px-3 text-xs text-white/80 hover:bg-white/[0.07] hover:text-white sm:w-auto sm:flex-none sm:text-sm"
              >
                <Link href="/sign-in" className="truncate text-center">
                  <span className="sm:hidden">{t("Entrar", "Sign in")}</span>
                  <span className="hidden sm:inline">{t("Iniciar sesion", "Sign in")}</span>
                </Link>
              </Button>
              <Button
                asChild={!isLiveDemoPrimaryCta}
                className={cn(
                  "h-9 w-full min-w-0 flex-1 bg-gradient-to-r from-[#3D7BFF] to-[#8D4BFF] px-3 text-xs text-white transition-transform hover:scale-[1.02] sm:w-auto sm:flex-none sm:text-sm md:duration-200 md:ease-out",
                  isDesktopNavScrolled
                    ? "md:from-[#3D7BFF] md:to-[#8D4BFF] md:shadow-[0_0_34px_rgba(86,92,255,0.42)]"
                    : "md:from-[#4E63A8] md:to-[#6F5AA8] md:shadow-[0_0_18px_rgba(88,98,176,0.32)]",
                )}
                onClick={isLiveDemoPrimaryCta ? () => scrollToLiveDemo(true) : undefined}
              >
                {isLiveDemoPrimaryCta ? (
                  <span className="truncate text-center">
                    <span className="sm:hidden">{primaryLabelCompact}</span>
                    <span className="hidden sm:inline">{primaryLabel}</span>
                  </span>
                ) : (
                  <Link href={primaryHref} className="truncate text-center">
                    <span className="sm:hidden">{primaryLabelCompact}</span>
                    <span className="hidden sm:inline">{primaryLabel}</span>
                  </Link>
                )}
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

            <p className="mx-auto mt-4 inline-flex rounded-full border border-[#7F9BFF]/35 bg-[#273866]/35 px-4 py-1.5 text-xs font-medium text-[#C4D2FF]">
              {t("Llamamos a tu primer lead gratis.", "We call your first lead for free.")}
            </p>

            <motion.h1
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.12, duration: 0.8 }}
              className="mt-7 text-balance text-4xl font-semibold leading-tight sm:text-5xl md:text-6xl"
            >
              <span className="bg-gradient-to-r from-white via-white to-white/70 bg-clip-text text-transparent">
                {t("IA que llama a tus leads en menos de 2 minutos.", "AI That Calls Your Leads in Under 2 Minutes.")}
              </span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.24, duration: 0.8 }}
              className="mx-auto mt-6 max-w-3xl text-pretty text-base leading-relaxed text-white/70 sm:text-lg"
            >
              {t(
                "Del chat a reuniones agendadas: califica, agenda y cierra en automatico.",
                "From live chat to booked meetings—qualify, schedule, and close automatically.",
              )}
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.35, duration: 0.7 }}
              className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row"
            >
              <Button
                type="button"
                size="lg"
                className="h-12 w-full bg-gradient-to-r from-[#3D7BFF] to-[#8D4BFF] text-white shadow-[0_0_32px_rgba(86,92,255,0.4)] hover:opacity-95 sm:w-auto"
                onClick={() => scrollToLiveDemo(true)}
              >
                {t("Probar demo en vivo", "Try the Live Demo")}
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
              <Button
                type="button"
                size="lg"
                variant="ghost"
                className="h-12 w-full border border-white/15 bg-white/[0.03] text-white/85 hover:bg-white/[0.08] sm:w-auto"
                onClick={() => scrollToLiveDemo(true)}
              >
                {t("Ver como agenda una reunion", "Watch it book a meeting")}
              </Button>
            </motion.div>

            <p className="mt-4 text-sm text-white/65">{t("Sin tarjeta. Prueba la demo en vivo.", "No credit card. Try the live demo now.")}</p>
          </motion.div>
        </section>

        <UseCasesSection onSelectUseCase={onUseCaseSelect} />

        <LiveChatToCallDemoSection
          key={liveDemoPrefill?.seed ?? "live-demo-default"}
          onSubmitLead={onSubmitDemoLead}
          onStartDemoCall={onStartDemoCall}
          onOpenLeadChat={() => {
            clearLeadChatAutoCloseTimer();
            setIsLeadChatModalOpen(true);
          }}
          prefillContext={liveDemoPrefill}
          runtimeContext={liveDemoRuntime}
          hasCapturedLead={hasCapturedLeadForDemo}
        />

        <section className="scroll-mt-28 px-1 pb-16">
          <motion.div
            variants={fadeUp}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, amount: 0.2 }}
            transition={{ duration: 0.65 }}
            className="grid gap-4 md:grid-cols-3"
          >
            {benefits.map((benefit) => (
              <Card key={benefit.title} className="border-white/10 bg-white/[0.03]">
                <CardContent className="p-6">
                  <p className="text-lg font-semibold text-white">{benefit.title}</p>
                  <p className="mt-3 text-sm leading-relaxed text-white/65">{benefit.description}</p>
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

          <div className="mt-6 rounded-2xl border border-[#7F9BFF]/30 bg-[#243665]/32 px-4 py-3 text-center text-sm text-[#C4D2FF]">
            {t("Llamamos a tu primer lead gratis.", "We call your first lead for free.")}
          </div>

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
                    <p className="mt-3 text-xs text-white/60">
                      {t(
                        "Muchos recuperan el costo con 1 cita extra agendada.",
                        "Most teams recover the cost with 1 extra booked job.",
                      )}
                    </p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </section>

        <section className="scroll-mt-28 px-1 pb-16">
          <SectionTitle
            eyebrow={t("Testimonios", "Testimonials")}
            title={t("Resultados reales de equipos comerciales", "Real outcomes from sales teams")}
            description={t(
              "Historias de operadores que ya usan AI Call Closer en operaciones de alto volumen.",
              "Stories from operators already using AI Call Closer in high-volume workflows.",
            )}
          />

          <div className="mt-8 flex items-center justify-end gap-2">
            <Button
              type="button"
              variant="ghost"
              size="icon"
              aria-label={t("Desplazar testimonios a la izquierda", "Scroll testimonials left")}
              className="h-10 w-10 border border-white/15 bg-white/[0.04] text-white/85 hover:bg-white/[0.12]"
              onClick={() => scrollTrack(testimonialTrackRef.current, "left")}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              aria-label={t("Desplazar testimonios a la derecha", "Scroll testimonials right")}
              className="h-10 w-10 border border-white/15 bg-white/[0.04] text-white/85 hover:bg-white/[0.12]"
              onClick={() => scrollTrack(testimonialTrackRef.current, "right")}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>

          <div
            ref={testimonialTrackRef}
            className={cn(
              "mt-4 flex snap-x snap-mandatory gap-4 overflow-x-auto overscroll-y-contain pb-3 pt-2 select-none [scrollbar-width:none] [touch-action:pan-x] [&::-webkit-scrollbar]:hidden",
              isTestimonialsDragging ? "cursor-grabbing" : "cursor-grab",
            )}
            onScroll={onTestimonialsScroll}
            onPointerDown={onTestimonialsPointerDown}
            onPointerMove={onTestimonialsPointerMove}
            onPointerUp={onTestimonialsPointerEnd}
            onPointerCancel={onTestimonialsPointerEnd}
            onPointerLeave={onTestimonialsPointerEnd}
            onWheel={onTestimonialsWheel}
            onMouseEnter={() => setIsTestimonialAutoplayPaused(true)}
            onMouseLeave={() => setIsTestimonialAutoplayPaused(false)}
            onTouchStart={() => setIsTestimonialAutoplayPaused(true)}
            onTouchEnd={() => setIsTestimonialAutoplayPaused(false)}
          >
            {visibleTestimonials.map((item, index) => (
              <motion.div
                key={`${item.name}-${item.company}`}
                variants={fadeUp}
                initial="hidden"
                whileInView="show"
                viewport={{ once: true, amount: 0.2 }}
                transition={{ duration: 0.45, delay: index * 0.05 }}
                className="w-[86%] shrink-0 snap-start sm:w-[420px] md:w-[460px]"
              >
                <Card className="testimonial-card iridescent-border iridescent-surface h-full border-white/12 bg-white/[0.03]">
                  <CardContent className="p-5 sm:p-6">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <Avatar className="h-12 w-12 border border-white/15">
                          <AvatarImage
                            src={item.avatar}
                            alt={`${item.name} profile`}
                            loading={index < 3 ? "eager" : "lazy"}
                            decoding="async"
                            referrerPolicy="no-referrer"
                          />
                          <AvatarFallback className="bg-[#1A2446] text-white">
                            {item.name.charAt(0)}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="text-sm font-semibold text-white">{item.name}</p>
                          <p className="text-xs text-white/60">{item.role}</p>
                          <p className="text-xs text-[#9AB2FF]">{item.company}</p>
                        </div>
                      </div>
                      <MessageSquareQuote className="h-5 w-5 text-[#95A9FF]" />
                    </div>

                    <div className="mt-5 flex items-center gap-1.5">
                      {Array.from({ length: 5 }).map((_, starIndex) => (
                        <Star
                          key={`${item.name}-star-${starIndex}`}
                          className={cn(
                            "h-4 w-4",
                            starIndex < item.rating ? "fill-[#F4D77A] text-[#F4D77A]" : "text-white/20",
                          )}
                        />
                      ))}
                      <span className="ml-1 text-xs text-white/60">{item.rating}.0/5</span>
                    </div>

                    <p className="mt-4 text-sm leading-relaxed text-white/78">{item.quote}</p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}

            {renderedTestimonialsCount < testimonials.length ? (
              <div className="w-[86%] shrink-0 snap-start sm:w-[420px] md:w-[460px]">
                <Card className="h-full border-white/10 bg-white/[0.02]">
                  <CardContent className="flex h-full min-h-[260px] flex-col items-center justify-center gap-3 p-6 text-center">
                    <motion.div
                      animate={{ opacity: [0.4, 1, 0.4] }}
                      transition={{ duration: 1.3, repeat: Number.POSITIVE_INFINITY }}
                      className="h-2.5 w-2.5 rounded-full bg-[#8EA8FF]"
                    />
                    <p className="text-sm text-white/70">
                      {t("Cargando mas testimonios...", "Loading more testimonials...")}
                    </p>
                  </CardContent>
                </Card>
              </div>
            ) : null}
          </div>

          <div className="mt-4 flex items-center justify-center gap-2">
            {Array.from({ length: testimonialPageCount }).map((_, index) => {
              const isActive = index === testimonialPage;
              return (
                <button
                  key={`testimonial-page-${index}`}
                  type="button"
                  aria-label={t(
                    `Ir a testimonios pagina ${index + 1}`,
                    `Go to testimonials page ${index + 1}`,
                  )}
                  className={cn(
                    "h-2.5 rounded-full border border-white/25 bg-white/20 transition-all duration-200",
                    isActive ? "w-7 bg-[#8EA8FF] shadow-[0_0_14px_rgba(142,168,255,0.65)]" : "w-2.5 hover:bg-white/35",
                  )}
                  onClick={() => scrollTestimonialsToPage(index)}
                />
              );
            })}
          </div>
        </section>

        <section className="scroll-mt-28 px-1 pb-16">
          <SectionTitle
            eyebrow="FAQ"
            title={t("Preguntas frecuentes", "Frequently asked questions")}
            description={t(
              "Respuestas claras para activar tu operacion de llamadas con IA sin friccion.",
              "Clear answers to launch your AI call operation without friction.",
            )}
          />

          <div className="mt-8 space-y-4">
            {faqItems.map((faq, index) => {
              const isOpen = activeFaqIndex === index;

              return (
                <motion.div
                  key={faq.question}
                  variants={fadeUp}
                  initial="hidden"
                  whileInView="show"
                  viewport={{ once: true, amount: 0.15 }}
                  transition={{ duration: 0.45, delay: index * 0.04 }}
                  className="w-full"
                >
                  <Card className="iridescent-border iridescent-surface border-white/12 bg-white/[0.03]">
                    <CardContent className="p-5 sm:p-6">
                      <Button
                        type="button"
                        variant="ghost"
                        className="h-auto w-full items-start justify-between gap-3 whitespace-normal rounded-xl border border-white/12 bg-white/[0.02] px-4 py-4 text-left hover:bg-white/[0.08]"
                        onClick={() => setActiveFaqIndex((previous) => (previous === index ? -1 : index))}
                      >
                        <span className="block flex-1 text-sm font-semibold leading-snug break-words text-white sm:text-base">
                          {faq.question}
                        </span>
                        <ChevronRight
                          className={cn(
                            "mt-0.5 h-5 w-5 shrink-0 text-[#9AB0FF] transition-transform duration-200",
                            isOpen && "rotate-90",
                          )}
                        />
                      </Button>

                      <motion.div
                        initial={false}
                        animate={{
                          height: isOpen ? "auto" : 0,
                          opacity: isOpen ? 1 : 0,
                        }}
                        transition={{ duration: 0.22, ease: "easeOut" }}
                        className="overflow-hidden"
                      >
                        <p className="px-1 pt-4 text-sm leading-relaxed text-white/75">{faq.answer}</p>
                      </motion.div>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
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
            <p className="text-xs uppercase tracking-[0.16em] text-white/75">Final CTA</p>
            <h2 className="mt-3 max-w-2xl text-balance text-3xl font-semibold leading-tight sm:text-4xl">
              {t("Mira a la IA agendar una cita real.", "See the AI book a real appointment.")}
            </h2>
            <p className="mt-4 max-w-2xl text-sm leading-relaxed text-white/80 sm:text-base">
              {t(
                "Activa la demo guiada y observa el flujo completo de chat, consentimiento, llamada y cierre.",
                "Launch the guided demo and watch the complete flow: chat, consent, call, and close.",
              )}
            </p>

            <div className="mt-7 flex flex-col gap-3 sm:flex-row">
              <Button
                type="button"
                size="lg"
                className="h-12 bg-white text-[#1A2456] hover:bg-white/90"
                onClick={() => scrollToLiveDemo(true)}
              >
                {t("Probar demo en vivo", "Try the Live Demo")}
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
              <Button
                type="button"
                size="lg"
                variant="ghost"
                className="h-12 border border-white/30 bg-white/10 text-white hover:bg-white/20"
                onClick={() => scrollToLiveDemo(false)}
              >
                {t("Ver como agenda una reunion", "Watch it book a meeting")}
              </Button>
            </div>
          </motion.div>
        </section>

        <Sheet
          open={isLeadChatModalOpen}
          onOpenChange={(open) => {
            if (!open) clearLeadChatAutoCloseTimer();
            setIsLeadChatModalOpen(open);
          }}
        >
          <SheetContent
            side="right"
            className="w-full border-l-white/15 bg-[#0D1325]/98 p-0 text-white sm:max-w-2xl"
          >
            <SheetHeader className="border-b border-white/10 px-5 py-4">
              <SheetTitle className="text-lg text-white">
                {t("Lead Chat en vivo", "Live Lead Chat")}
              </SheetTitle>
              <SheetDescription className="text-white/65">
                {t(
                  "Embudo de conversion: objetivo, datos y consentimiento en segundos.",
                  "Conversion funnel: objective, details, and consent in seconds.",
                )}
              </SheetDescription>
            </SheetHeader>
            <div className="h-full overflow-y-auto px-4 py-4 sm:px-5">
              <LeadChatPublicWidget
                key={leadChatPrefill?.seed ?? "lead-chat-default"}
                compact
                onSubmitLead={onSubmitLeadChatWidget}
                onLiveDataChange={onLeadChatLiveDataChange}
                onCompleted={onLeadChatCompleted}
                prefillContext={leadChatPrefill}
              />
            </div>
          </SheetContent>
        </Sheet>

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
      <Script
        id="leads-widget-script"
        src="https://leads-widget.vercel.app/api/w/0oflzwpj2s.js"
        strategy="afterInteractive"
      />
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
