"use client";

import { useMemo, useState, useTransition } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

type AgentConfigInput = {
  agentName: string;
  greetingMessage: string;
  systemPrompt: string;
  handoffEnabled: boolean;
  handoffPhone: string | null;
  calendarLink: string | null;
  llmModel: string;
  sttModel: string;
  voiceModel: string;
  ttsVoice: string;
  qualificationChecklist: string[];
  disallowedClaims: string[];
  pricingRules: Record<string, unknown>;
};

export function AgentConfigForm({ initial }: { initial: AgentConfigInput }) {
  const [isPending, startTransition] = useTransition();
  const [status, setStatus] = useState<string>("");

  const [agentName, setAgentName] = useState(initial.agentName);
  const [greetingMessage, setGreetingMessage] = useState(initial.greetingMessage);
  const [systemPrompt, setSystemPrompt] = useState(initial.systemPrompt);
  const [handoffEnabled, setHandoffEnabled] = useState(initial.handoffEnabled);
  const [handoffPhone, setHandoffPhone] = useState(initial.handoffPhone ?? "");
  const [calendarLink, setCalendarLink] = useState(initial.calendarLink ?? "");
  const [llmModel, setLlmModel] = useState(initial.llmModel);
  const [sttModel, setSttModel] = useState(initial.sttModel);
  const [voiceModel, setVoiceModel] = useState(initial.voiceModel);
  const [ttsVoice, setTtsVoice] = useState(initial.ttsVoice);
  const [qualificationChecklist, setQualificationChecklist] = useState(
    initial.qualificationChecklist.join("\n"),
  );
  const [disallowedClaims, setDisallowedClaims] = useState(initial.disallowedClaims.join("\n"));
  const [pricingRules, setPricingRules] = useState(JSON.stringify(initial.pricingRules, null, 2));

  const payload = useMemo(
    () => ({
      agentName,
      greetingMessage,
      systemPrompt,
      handoffEnabled,
      handoffPhone: handoffPhone || null,
      calendarLink: calendarLink || null,
      llmModel,
      sttModel,
      voiceModel,
      ttsVoice,
      qualificationChecklist: qualificationChecklist
        .split("\n")
        .map((item) => item.trim())
        .filter(Boolean),
      disallowedClaims: disallowedClaims
        .split("\n")
        .map((item) => item.trim())
        .filter(Boolean),
      pricingRules: safeJson(pricingRules),
    }),
    [
      agentName,
      greetingMessage,
      systemPrompt,
      handoffEnabled,
      handoffPhone,
      calendarLink,
      llmModel,
      sttModel,
      voiceModel,
      ttsVoice,
      qualificationChecklist,
      disallowedClaims,
      pricingRules,
    ],
  );

  function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    startTransition(async () => {
      const response = await fetch("/api/agent-config", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        setStatus("Configuracion guardada.");
      } else {
        setStatus("No se pudo guardar.");
      }
    });
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <details open className="rounded-2xl border border-white/10 bg-white/5 p-4">
        <summary className="cursor-pointer text-sm font-semibold text-[#F5F3EE]">Perfil del agente</summary>
        <div className="mt-3 space-y-3">
          <div className="space-y-2">
            <Label>Nombre del agente</Label>
            <Input value={agentName} onChange={(e) => setAgentName(e.target.value)} className="h-11" />
          </div>
          <div className="space-y-2">
            <Label>Mensaje de bienvenida</Label>
            <Textarea
              value={greetingMessage}
              onChange={(e) => setGreetingMessage(e.target.value)}
              rows={3}
            />
          </div>
        </div>
      </details>

      <details open className="rounded-2xl border border-white/10 bg-white/5 p-4">
        <summary className="cursor-pointer text-sm font-semibold text-[#F5F3EE]">Prompt y guardrails</summary>
        <div className="mt-3 space-y-3">
          <div className="space-y-2">
            <Label>System prompt</Label>
            <Textarea value={systemPrompt} onChange={(e) => setSystemPrompt(e.target.value)} rows={6} />
          </div>
          <div className="space-y-2">
            <Label>Checklist calificacion (1 por linea)</Label>
            <Textarea
              value={qualificationChecklist}
              onChange={(e) => setQualificationChecklist(e.target.value)}
              rows={4}
            />
          </div>
          <div className="space-y-2">
            <Label>Claims prohibidos (1 por linea)</Label>
            <Textarea
              value={disallowedClaims}
              onChange={(e) => setDisallowedClaims(e.target.value)}
              rows={4}
            />
          </div>
          <div className="space-y-2">
            <Label>Pricing rules (JSON)</Label>
            <Textarea value={pricingRules} onChange={(e) => setPricingRules(e.target.value)} rows={6} />
          </div>
        </div>
      </details>

      <details open className="rounded-2xl border border-white/10 bg-white/5 p-4">
        <summary className="cursor-pointer text-sm font-semibold text-[#F5F3EE]">
          Modelos y handoff
        </summary>
        <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-2">
          <Field label="LLM model" value={llmModel} onChange={setLlmModel} />
          <Field label="STT model" value={sttModel} onChange={setSttModel} />
          <Field label="TTS model" value={voiceModel} onChange={setVoiceModel} />
          <Field label="TTS voice" value={ttsVoice} onChange={setTtsVoice} />
          <Field label="Telefono handoff" value={handoffPhone} onChange={setHandoffPhone} />
          <Field label="Link agenda" value={calendarLink} onChange={setCalendarLink} />
          <label className="flex items-center gap-2 rounded-xl border border-white/10 bg-black/20 p-3 text-sm text-[#D8D3C7]">
            <input
              type="checkbox"
              checked={handoffEnabled}
              onChange={(e) => setHandoffEnabled(e.target.checked)}
            />
            Handoff humano habilitado
          </label>
        </div>
      </details>

      <div className="flex items-center gap-3">
        <Button
          type="submit"
          disabled={isPending}
          className="h-11 rounded-xl bg-[#C9A227] px-5 text-[#18140D] hover:bg-[#E5C76B]"
        >
          {isPending ? "Guardando..." : "Guardar configuracion"}
        </Button>
        {status ? <p className="text-sm text-[#B9B4A9]">{status}</p> : null}
      </div>
    </form>
  );
}

function Field(props: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <div className="space-y-2">
      <Label>{props.label}</Label>
      <Input value={props.value} onChange={(event) => props.onChange(event.target.value)} className="h-11" />
    </div>
  );
}

function safeJson(raw: string) {
  try {
    return JSON.parse(raw);
  } catch {
    return {};
  }
}
