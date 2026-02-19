"use client";

import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Bot, CheckCircle2, Clock3, PhoneCall, Sparkles } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

type DemoObjective = "book_google_meet" | "schedule_call" | "simulate_sale";

type ChatRole = "user" | "assistant";

type ChatMessage = {
  role: ChatRole;
  text: string;
};

type LiveDemoSubmitLeadPayload = {
  name: string;
  business: string;
  phone: string;
  objective: DemoObjective;
  consentCall: true;
  consentFollowUp: boolean;
};

type LiveDemoStartCallPayload = {
  name: string;
  business: string;
  phone: string;
  objective: DemoObjective;
};

type LiveChatToCallDemoSectionProps = {
  onSubmitLead?: (payload: LiveDemoSubmitLeadPayload) => void | Promise<void>;
  onStartDemoCall?: (payload: LiveDemoStartCallPayload) => void | Promise<void>;
};

const demoLead = {
  name: "Diego",
  business: "Roofing services in the US.",
  phone: "+1 305 555 0123",
  goal: "get more customers this month",
};

const leftChatSequence: ChatMessage[] = [
  { role: "user", text: "Hi, I want more customers this month." },
  {
    role: "assistant",
    text: "Awesome! 😄 I'm Aurea. To personalize your demo, what's your name?",
  },
  { role: "user", text: "Diego" },
  {
    role: "assistant",
    text: "Nice to meet you, Diego 🙌 What type of business do you run?",
  },
  { role: "user", text: "Roofing services in the US." },
  {
    role: "assistant",
    text: "Perfect 🏠 Could you share your phone number with country code? (Example: +1...)",
  },
  { role: "user", text: "+1 305 555 0123" },
  { role: "assistant", text: "Before I call you, I need your consent 👇" },
];

const objectiveOptions: { value: DemoObjective; label: string }[] = [
  { value: "book_google_meet", label: "Book Google Meet" },
  { value: "schedule_call", label: "Schedule a call" },
  { value: "simulate_sale", label: "Simulate a sale" },
];

const objectiveResultCopy: Record<DemoObjective, { status: string; message: string }> = {
  book_google_meet: {
    status: "✅ Meeting booked",
    message:
      "Perfect ✅ I've scheduled a quick Google Meet demo for you today. You'll receive confirmation shortly.",
  },
  schedule_call: {
    status: "✅ Demo scheduled",
    message:
      "Great ✅ I've booked a quick call with our team today. You'll receive confirmation in a moment.",
  },
  simulate_sale: {
    status: "✅ Sale simulated",
    message:
      "Perfect ✅ Let's simulate a real lead call where I qualify and either close or book the job for you.",
  },
};

export function LiveChatToCallDemoSection(props: LiveChatToCallDemoSectionProps) {
  const [objective, setObjective] = useState<DemoObjective>("book_google_meet");
  const [consentCall, setConsentCall] = useState(false);
  const [consentFollowUp, setConsentFollowUp] = useState(false);
  const [consentError, setConsentError] = useState<string | null>(null);
  const [leftVisibleCount, setLeftVisibleCount] = useState(0);
  const [rightVisibleCount, setRightVisibleCount] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);
  const [showFinalLeftMessage, setShowFinalLeftMessage] = useState(false);

  const rightMessageQueue = useMemo(() => {
    const result = objectiveResultCopy[objective];
    return [
      `✅ Context received from Live Chat:\n${demoLead.name} — Roofing business (US).\nGoal: ${demoLead.goal}.`,
      `📞 Calling ${demoLead.phone}...`,
      "Hi Diego, this is Aurea, the AI assistant from our team. This will take less than 30 seconds 😊",
      "I see you're in roofing. Are you looking to book more inspections or close jobs directly by phone?",
      result.message,
    ];
  }, [objective]);

  const statusSteps = useMemo(() => {
    return [
      "🟢 Live Chat active",
      "⏳ Calling in progress...",
      "📞 AI on the call",
      objectiveResultCopy[objective].status,
    ];
  }, [objective]);

  useEffect(() => {
    if (leftVisibleCount >= leftChatSequence.length) return;
    const timer = window.setTimeout(
      () => setLeftVisibleCount((current) => current + 1),
      leftVisibleCount === 0 ? 380 : 820,
    );
    return () => window.clearTimeout(timer);
  }, [leftVisibleCount]);

  useEffect(() => {
    if (!isRunning) return;
    if (rightVisibleCount >= rightMessageQueue.length) return;

    const timer = window.setTimeout(
      () =>
        setRightVisibleCount((current) => {
          const next = current + 1;
          if (next >= rightMessageQueue.length) {
            setIsRunning(false);
            setIsCompleted(true);
          }
          return next;
        }),
      rightVisibleCount === 0 ? 700 : 1100,
    );
    return () => window.clearTimeout(timer);
  }, [isRunning, rightMessageQueue.length, rightVisibleCount]);

  const canShowConsent = leftVisibleCount >= leftChatSequence.length;
  const isLeftTyping = leftVisibleCount < leftChatSequence.length;
  const isRightTyping = isRunning && rightVisibleCount < rightMessageQueue.length;

  const activeStatusIndex = useMemo(() => {
    if (!isRunning && !isCompleted) return 0;
    if (rightVisibleCount < 3) return 1;
    if (rightVisibleCount < rightMessageQueue.length) return 2;
    return 3;
  }, [isCompleted, isRunning, rightMessageQueue.length, rightVisibleCount]);

  function resetDemo() {
    setConsentError(null);
    setRightVisibleCount(0);
    setIsRunning(false);
    setIsCompleted(false);
    setShowFinalLeftMessage(false);
  }

  function startLiveDemo() {
    if (!consentCall) {
      setConsentError("Please accept the AI call consent checkbox to continue.");
      return;
    }

    setConsentError(null);
    setRightVisibleCount(0);
    setIsCompleted(false);
    setIsRunning(true);
    setShowFinalLeftMessage(true);

    const submitPayload: LiveDemoSubmitLeadPayload = {
      name: demoLead.name,
      business: demoLead.business,
      phone: demoLead.phone,
      objective,
      consentCall: true,
      consentFollowUp,
    };

    const startPayload: LiveDemoStartCallPayload = {
      name: demoLead.name,
      business: demoLead.business,
      phone: demoLead.phone,
      objective,
    };

    void props.onSubmitLead?.(submitPayload);
    void props.onStartDemoCall?.(startPayload);
  }

  return (
    <section className="scroll-mt-28 px-1 pb-16" aria-labelledby="live-chat-call-demo-title">
      <Card className="border-white/15 bg-gradient-to-b from-[#121A31] to-[#0E1427] shadow-[0_26px_90px_rgba(18,43,128,0.32)]">
        <CardContent className="space-y-7 p-5 sm:p-7 md:p-8">
          <div className="space-y-4 border-b border-white/10 pb-5">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/[0.03] px-3 py-1 text-xs text-white/75">
              <Sparkles className="h-3.5 w-3.5 text-[#9AB2FF]" />
              Live Chat → AI Call in under 2 minutes
            </div>
            <div className="grid gap-3 md:grid-cols-[1fr_auto] md:items-end">
              <div>
                <h2 id="live-chat-call-demo-title" className="text-2xl font-semibold text-white sm:text-3xl">
                  See the full conversion funnel in one flow
                </h2>
                <p className="mt-2 max-w-3xl text-sm leading-relaxed text-white/70 sm:text-base">
                  Visitor chats, shares details, gives explicit consent, and receives a fast AI call with objective-driven next steps.
                </p>
              </div>
              <label className="flex w-full min-w-[220px] flex-col gap-2 md:w-[280px]">
                <span className="text-xs uppercase tracking-[0.12em] text-white/55">Demo objective</span>
                <select
                  value={objective}
                  onChange={(event) => {
                    setObjective(event.target.value as DemoObjective);
                    if (isCompleted) resetDemo();
                  }}
                  className="h-11 rounded-xl border border-white/15 bg-white/[0.04] px-3 text-sm text-white outline-none transition focus-visible:border-[#6E89FF] focus-visible:ring-2 focus-visible:ring-[#6E89FF]/35"
                >
                  {objectiveOptions.map((option) => (
                    <option key={option.value} value={option.value} className="bg-[#0E1427]">
                      {option.label}
                    </option>
                  ))}
                </select>
              </label>
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
            <div className="rounded-2xl border border-white/12 bg-white/[0.02] p-4 sm:p-5">
              <div className="mb-4 flex items-center justify-between">
                <p className="text-xs uppercase tracking-[0.14em] text-white/55">Live Chat</p>
                <span className="rounded-full border border-white/15 bg-white/[0.03] px-2.5 py-1 text-[11px] text-white/65">
                  Friendly pre-qualification
                </span>
              </div>

              <div className="space-y-3">
                {leftChatSequence.slice(0, leftVisibleCount).map((message, index) => (
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
                        {message.role === "assistant" ? "Aurea" : "Visitor"}
                      </p>
                      <p>{message.text}</p>
                    </div>
                  </motion.div>
                ))}

                {isLeftTyping ? (
                  <div className="inline-flex w-fit items-center gap-1.5 rounded-full border border-white/15 bg-white/[0.03] px-3 py-2">
                    <span className="sr-only">Typing</span>
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

              {canShowConsent ? (
                <motion.div
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.25 }}
                  className="mt-5 rounded-xl border border-white/15 bg-white/[0.02] p-4"
                >
                  <p className="text-xs uppercase tracking-[0.13em] text-white/50">Consent required</p>
                  <div className="mt-3 space-y-2.5">
                    <label className="flex items-start gap-2.5 text-sm text-white/82">
                      <input
                        type="checkbox"
                        checked={consentCall}
                        onChange={(event) => setConsentCall(event.target.checked)}
                        className="mt-0.5 h-4 w-4 rounded border-white/25 bg-transparent accent-[#6E89FF]"
                      />
                      <span>I agree to receive an automated AI call for this demo.</span>
                    </label>
                    <label className="flex items-start gap-2.5 text-sm text-white/74">
                      <input
                        type="checkbox"
                        checked={consentFollowUp}
                        onChange={(event) => setConsentFollowUp(event.target.checked)}
                        className="mt-0.5 h-4 w-4 rounded border-white/25 bg-transparent accent-[#6E89FF]"
                      />
                      <span>I agree to receive follow-up automated messages.</span>
                    </label>
                    <p className="text-xs leading-relaxed text-white/55">
                      You can opt out anytime. We respect your privacy.
                    </p>
                  </div>

                  {showFinalLeftMessage ? (
                    <div className="mt-4 rounded-xl border border-[#6F8BFF]/40 bg-[#223468]/45 px-4 py-3 text-sm text-white/90">
                      All set! 🚀 We&apos;ll call you in less than 2 minutes so you can experience it live.
                    </div>
                  ) : null}

                  {consentError ? (
                    <p className="mt-3 text-xs text-rose-300">{consentError}</p>
                  ) : null}

                  <div className="mt-4 space-y-2">
                    <Button
                      type="button"
                      onClick={startLiveDemo}
                      className="h-11 w-full bg-gradient-to-r from-[#3D7BFF] to-[#8D4BFF] text-white shadow-[0_0_30px_rgba(98,104,255,0.35)]"
                    >
                      Try the Live Demo
                    </Button>
                    <p className="text-center text-xs leading-relaxed text-white/55">
                      No credit card required. Experience the AI call in under 2 minutes.
                    </p>
                  </div>
                </motion.div>
              ) : null}
            </div>

            <div className="rounded-2xl border border-white/12 bg-white/[0.02] p-4 sm:p-5">
              <div className="mb-4 flex items-center justify-between">
                <p className="text-xs uppercase tracking-[0.14em] text-white/55">AI Call Closer</p>
                <span className="rounded-full border border-white/15 bg-white/[0.03] px-2.5 py-1 text-[11px] text-white/65">
                  Context-aware call flow
                </span>
              </div>

              <div className="space-y-3">
                {rightMessageQueue.slice(0, rightVisibleCount).map((message, index) => (
                  <motion.div
                    key={`right-message-${index}`}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.24 }}
                    className="rounded-2xl border border-white/12 bg-[#141C33]/72 px-4 py-3"
                  >
                    <p className="whitespace-pre-line text-sm leading-relaxed text-white/90">{message}</p>
                  </motion.div>
                ))}

                {isRightTyping ? (
                  <div className="inline-flex w-fit items-center gap-2 rounded-full border border-[#6F8BFF]/35 bg-[#213468]/45 px-3 py-2 text-xs text-white/80">
                    <Clock3 className="h-3.5 w-3.5 text-[#9DB3FF]" />
                    Processing next call step...
                  </div>
                ) : null}
              </div>

              <div className="mt-5 grid gap-2 sm:grid-cols-2">
                <div className="rounded-xl border border-white/12 bg-white/[0.02] p-3">
                  <p className="text-[11px] uppercase tracking-[0.1em] text-white/48">Lead summary</p>
                  <p className="mt-1 text-sm text-white/85">{demoLead.name} · {demoLead.business}</p>
                </div>
                <div className="rounded-xl border border-white/12 bg-white/[0.02] p-3">
                  <p className="text-[11px] uppercase tracking-[0.1em] text-white/48">Dial target</p>
                  <p className="mt-1 text-sm text-white/85">{demoLead.phone}</p>
                </div>
              </div>

              <div className="mt-4 flex flex-wrap items-center gap-2 text-xs text-white/65">
                <span className="inline-flex items-center gap-1 rounded-full border border-white/12 bg-white/[0.03] px-2.5 py-1">
                  <Bot className="h-3.5 w-3.5 text-[#8EA8FF]" />
                  AI disclosure on
                </span>
                <span className="inline-flex items-center gap-1 rounded-full border border-white/12 bg-white/[0.03] px-2.5 py-1">
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-300" />
                  Consent captured
                </span>
                <span className="inline-flex items-center gap-1 rounded-full border border-white/12 bg-white/[0.03] px-2.5 py-1">
                  <PhoneCall className="h-3.5 w-3.5 text-[#E7D88B]" />
                  Objective-driven close
                </span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </section>
  );
}
