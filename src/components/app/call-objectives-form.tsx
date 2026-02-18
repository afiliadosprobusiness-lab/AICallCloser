"use client";

import { useMemo, useState, useTransition } from "react";
import { Plus, Trash2 } from "lucide-react";

import {
  buildPlaybookPreviewText,
  callObjectiveValues,
  defaultCallPreferences,
  leadFieldTypeValues,
  normalizeCallPreferences,
  type AgentCallPreferencesInput,
  type LeadFieldConfig,
} from "@/lib/call-objectives/config";
import { useLocale } from "@/components/providers/locale-provider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

const objectiveLabels: Record<(typeof callObjectiveValues)[number], { es: string; en: string }> = {
  sell_product: { es: "Vender producto", en: "Sell product" },
  book_in_person_meeting: { es: "Agendar reunión presencial", en: "Book in-person meeting" },
  book_google_meet: { es: "Agendar Google Meet", en: "Book Google Meet" },
  book_calcom_appointment: { es: "Agendar con Cal.com", en: "Book Cal.com appointment" },
  schedule_followup_call: { es: "Programar llamada de seguimiento", en: "Schedule follow-up call" },
  collect_lead_info: { es: "Recolectar datos del lead", en: "Collect lead info" },
  qualify_only: { es: "Solo calificar", en: "Qualify only" },
  transfer_to_human: { es: "Transferir a humano", en: "Transfer to human" },
  send_summary: { es: "Enviar resumen", en: "Send summary" },
};

const leadFieldTypeLabels: Record<(typeof leadFieldTypeValues)[number], { es: string; en: string }> = {
  text: { es: "Texto", en: "Text" },
  email: { es: "Email", en: "Email" },
  phone: { es: "Teléfono", en: "Phone" },
  number: { es: "Número", en: "Number" },
  textarea: { es: "Texto largo", en: "Textarea" },
  boolean: { es: "Sí/No", en: "Boolean" },
};

type Props = {
  initialPreferences: AgentCallPreferencesInput;
  initialValueProp: string;
  agentName: string;
};

export function CallObjectivesForm(props: Props) {
  const { t } = useLocale();
  const [isPending, startTransition] = useTransition();
  const [status, setStatus] = useState<string>("");

  const [primaryObjective, setPrimaryObjective] = useState(props.initialPreferences.primaryObjective);
  const [secondaryObjectives, setSecondaryObjectives] = useState<string[]>(
    props.initialPreferences.secondaryObjectives,
  );
  const [language, setLanguage] = useState<"en" | "es">(props.initialPreferences.language);
  const [meetingType, setMeetingType] = useState(props.initialPreferences.meetingConfig.meetingType);
  const [durationMinutes, setDurationMinutes] = useState(String(props.initialPreferences.meetingConfig.durationMinutes));
  const [locationText, setLocationText] = useState(props.initialPreferences.meetingConfig.locationText ?? "");
  const [calendarProvider, setCalendarProvider] = useState(props.initialPreferences.meetingConfig.calendarProvider);
  const [calendarUrl, setCalendarUrl] = useState(props.initialPreferences.meetingConfig.calendarUrl ?? "");
  const [allowedWindows, setAllowedWindows] = useState(
    props.initialPreferences.followupConfig.allowedWindows.join(", "),
  );
  const [maxFollowups, setMaxFollowups] = useState(String(props.initialPreferences.followupConfig.maxFollowups));
  const [leadFields, setLeadFields] = useState<LeadFieldConfig[]>(props.initialPreferences.leadFieldsRequired);
  const [disqualifyRulesRaw, setDisqualifyRulesRaw] = useState(
    JSON.stringify(props.initialPreferences.disqualifyRules, null, 2),
  );
  const [valueProp, setValueProp] = useState(props.initialValueProp);

  const [doNotInventPrices, setDoNotInventPrices] = useState(
    Boolean(props.initialPreferences.complianceRules.doNotInventPrices),
  );
  const [noGuarantees, setNoGuarantees] = useState(Boolean(props.initialPreferences.complianceRules.noGuarantees));
  const [discloseAI, setDiscloseAI] = useState(Boolean(props.initialPreferences.complianceRules.discloseAI));
  const [endCallFast, setEndCallFast] = useState(Boolean(props.initialPreferences.complianceRules.endCallIfNotInterested));
  const [maxReplyWords, setMaxReplyWords] = useState(String(props.initialPreferences.complianceRules.maxReplyWords));

  const parsedDisqualifyRules = useMemo(() => safeJson(disqualifyRulesRaw), [disqualifyRulesRaw]);

  const preferences = useMemo(() => {
    const parsed = normalizeCallPreferences({
      primaryObjective,
      secondaryObjectives,
      language,
      meetingConfig: {
        meetingType,
        durationMinutes: Number(durationMinutes) || 30,
        locationText: locationText.trim() || null,
        calendarProvider,
        calendarUrl: calendarUrl.trim() || null,
      },
      followupConfig: {
        allowedWindows: allowedWindows
          .split(",")
          .map((value) => value.trim())
          .filter(Boolean),
        maxFollowups: Number(maxFollowups) || 2,
      },
      leadFieldsRequired: leadFields.length > 0 ? leadFields : defaultCallPreferences.leadFieldsRequired,
      disqualifyRules: parsedDisqualifyRules ?? {},
      complianceRules: {
        doNotInventPrices,
        noGuarantees,
        discloseAI,
        maxReplyWords: Number(maxReplyWords) || 20,
        endCallIfNotInterested: endCallFast,
      },
    });

    return parsed;
  }, [
    primaryObjective,
    secondaryObjectives,
    language,
    meetingType,
    durationMinutes,
    locationText,
    calendarProvider,
    calendarUrl,
    allowedWindows,
    maxFollowups,
    leadFields,
    parsedDisqualifyRules,
    doNotInventPrices,
    noGuarantees,
    discloseAI,
    maxReplyWords,
    endCallFast,
  ]);

  const previewScript = useMemo(
    () =>
      buildPlaybookPreviewText({
        agentName: props.agentName,
        valueProp,
        preferences,
      }),
    [props.agentName, valueProp, preferences],
  );

  function toggleSecondary(value: string) {
    setSecondaryObjectives((previous) =>
      previous.includes(value) ? previous.filter((item) => item !== value) : [...previous, value],
    );
  }

  function updateLeadField(index: number, patch: Partial<LeadFieldConfig>) {
    setLeadFields((previous) => previous.map((field, idx) => (idx === index ? { ...field, ...patch } : field)));
  }

  function addLeadField() {
    setLeadFields((previous) => [
      ...previous,
      {
        key: `custom_${previous.length + 1}`,
        label: t("Campo nuevo", "New field"),
        type: "text",
        required: false,
        validation: "",
      },
    ]);
  }

  function removeLeadField(index: number) {
    setLeadFields((previous) => previous.filter((_, idx) => idx !== index));
  }

  function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus("");

    if (!parsedDisqualifyRules) {
      setStatus(t("JSON inválido en reglas de descalificación.", "Invalid JSON in disqualify rules."));
      return;
    }

    startTransition(async () => {
      const response = await fetch("/api/agent-call-preferences", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          preferences,
          valueProp,
        }),
      });

      if (!response.ok) {
        setStatus(t("No se pudo guardar Call Objectives.", "Could not save Call Objectives."));
        return;
      }

      setStatus(t("Call Objectives guardados y activos para la siguiente llamada.", "Call Objectives saved and active for the next call."));
    });
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <details open className="rounded-2xl border border-white/10 bg-white/5 p-4">
        <summary className="cursor-pointer text-sm font-semibold text-[#F5F3EE]">
          {t("Call Objectives", "Call Objectives")}
        </summary>
        <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2">
          <div className="space-y-2">
            <Label>{t("Objetivo principal", "Primary objective")}</Label>
            <select
              value={primaryObjective}
              onChange={(event) => setPrimaryObjective(event.target.value as AgentCallPreferencesInput["primaryObjective"])}
              className="h-11 w-full rounded-xl border border-white/15 bg-black/30 px-3 text-sm text-[#F5F3EE]"
            >
              {callObjectiveValues.map((objective) => (
                <option key={objective} value={objective}>
                  {t(objectiveLabels[objective].es, objectiveLabels[objective].en)}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-2">
            <Label>{t("Idioma", "Language")}</Label>
            <select
              value={language}
              onChange={(event) => setLanguage(event.target.value as "en" | "es")}
              className="h-11 w-full rounded-xl border border-white/15 bg-black/30 px-3 text-sm text-[#F5F3EE]"
            >
              <option value="en">English</option>
              <option value="es">Español</option>
            </select>
          </div>
        </div>

        <div className="mt-4 space-y-2">
          <Label>{t("Objetivos secundarios", "Secondary objectives")}</Label>
          <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
            {callObjectiveValues.map((objective) => (
              <label key={objective} className="flex items-center gap-2 rounded-xl border border-white/10 bg-black/20 px-3 py-2 text-sm text-[#D8D3C7]">
                <input
                  type="checkbox"
                  checked={secondaryObjectives.includes(objective)}
                  onChange={() => toggleSecondary(objective)}
                />
                {t(objectiveLabels[objective].es, objectiveLabels[objective].en)}
              </label>
            ))}
          </div>
        </div>
      </details>

      <details open className="rounded-2xl border border-white/10 bg-white/5 p-4">
        <summary className="cursor-pointer text-sm font-semibold text-[#F5F3EE]">
          {t("Meeting settings", "Meeting settings")}
        </summary>
        <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2">
          <FieldSelect
            label={t("Tipo de reunión", "Meeting type")}
            value={meetingType}
            onChange={(value) => setMeetingType(value as AgentCallPreferencesInput["meetingConfig"]["meetingType"])}
            options={[
              { value: "in_person", label: t("Presencial", "In person") },
              { value: "google_meet", label: "Google Meet" },
              { value: "phone_call", label: t("Llamada telefónica", "Phone call") },
            ]}
          />
          <FieldInput
            label={t("Duración (min)", "Duration (min)")}
            value={durationMinutes}
            onChange={setDurationMinutes}
            type="number"
          />
          <FieldInput
            label={t("Ubicación (si presencial)", "Location (if in person)")}
            value={locationText}
            onChange={setLocationText}
          />
          <FieldSelect
            label={t("Proveedor de calendario", "Calendar provider")}
            value={calendarProvider}
            onChange={(value) => setCalendarProvider(value as AgentCallPreferencesInput["meetingConfig"]["calendarProvider"])}
            options={[
              { value: "calcom", label: "Cal.com" },
              { value: "google", label: "Google Calendar" },
              { value: "manual", label: t("Manual", "Manual") },
            ]}
          />
          <div className="md:col-span-2">
            <FieldInput
              label={t("Calendar URL (Cal.com o manual)", "Calendar URL (Cal.com or manual)")}
              value={calendarUrl}
              onChange={setCalendarUrl}
            />
          </div>
        </div>
      </details>

      <details open className="rounded-2xl border border-white/10 bg-white/5 p-4">
        <summary className="cursor-pointer text-sm font-semibold text-[#F5F3EE]">
          {t("Follow-up settings", "Follow-up settings")}
        </summary>
        <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2">
          <FieldInput
            label={t("Ventanas permitidas (coma separada)", "Allowed windows (comma separated)")}
            value={allowedWindows}
            onChange={setAllowedWindows}
          />
          <FieldInput
            label={t("Máximo follow-ups", "Max follow-ups")}
            value={maxFollowups}
            onChange={setMaxFollowups}
            type="number"
          />
        </div>
      </details>

      <details open className="rounded-2xl border border-white/10 bg-white/5 p-4">
        <summary className="cursor-pointer text-sm font-semibold text-[#F5F3EE]">
          {t("Lead fields builder", "Lead fields builder")}
        </summary>
        <div className="mt-4 space-y-3">
          {leadFields.map((field, index) => (
            <div key={`${field.key}-${index}`} className="rounded-xl border border-white/10 bg-black/20 p-3">
              <div className="grid grid-cols-1 gap-2 md:grid-cols-5">
                <FieldInput
                  label="key"
                  value={field.key}
                  onChange={(value) => updateLeadField(index, { key: slugFieldKey(value) })}
                />
                <FieldInput
                  label={t("Etiqueta", "Label")}
                  value={field.label}
                  onChange={(value) => updateLeadField(index, { label: value })}
                />
                <FieldSelect
                  label={t("Tipo", "Type")}
                  value={field.type}
                  onChange={(value) => updateLeadField(index, { type: value as LeadFieldConfig["type"] })}
                  options={leadFieldTypeValues.map((type) => ({
                    value: type,
                    label: t(leadFieldTypeLabels[type].es, leadFieldTypeLabels[type].en),
                  }))}
                />
                <FieldInput
                  label={t("Validación regex", "Validation regex")}
                  value={field.validation ?? ""}
                  onChange={(value) => updateLeadField(index, { validation: value })}
                />
                <div className="space-y-2">
                  <Label>{t("Requerido", "Required")}</Label>
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={field.required}
                      onChange={(event) => updateLeadField(index, { required: event.target.checked })}
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => removeLeadField(index)}
                      className="border-white/20 bg-black/20 text-[#F5F3EE]"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          ))}

          <Button type="button" variant="outline" onClick={addLeadField} className="border-white/20 bg-black/20 text-[#F5F3EE]">
            <Plus className="h-4 w-4" />
            {t("Agregar campo", "Add field")}
          </Button>
        </div>
      </details>

      <details open className="rounded-2xl border border-white/10 bg-white/5 p-4">
        <summary className="cursor-pointer text-sm font-semibold text-[#F5F3EE]">
          {t("Reglas y compliance", "Rules and compliance")}
        </summary>
        <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2">
          <label className="flex items-center gap-2 rounded-xl border border-white/10 bg-black/20 p-3 text-sm text-[#D8D3C7]">
            <input type="checkbox" checked={doNotInventPrices} onChange={(event) => setDoNotInventPrices(event.target.checked)} />
            {t("No inventar precios", "Do not invent prices")}
          </label>
          <label className="flex items-center gap-2 rounded-xl border border-white/10 bg-black/20 p-3 text-sm text-[#D8D3C7]">
            <input type="checkbox" checked={noGuarantees} onChange={(event) => setNoGuarantees(event.target.checked)} />
            {t("No prometer garantías", "No guarantees")}
          </label>
          <label className="flex items-center gap-2 rounded-xl border border-white/10 bg-black/20 p-3 text-sm text-[#D8D3C7]">
            <input type="checkbox" checked={discloseAI} onChange={(event) => setDiscloseAI(event.target.checked)} />
            {t("Revelar que es IA si preguntan", "Disclose AI when asked")}
          </label>
          <label className="flex items-center gap-2 rounded-xl border border-white/10 bg-black/20 p-3 text-sm text-[#D8D3C7]">
            <input type="checkbox" checked={endCallFast} onChange={(event) => setEndCallFast(event.target.checked)} />
            {t("Cerrar rápido si no hay interés", "End quickly if not interested")}
          </label>
          <FieldInput
            label={t("Máximo palabras por respuesta", "Max words per response")}
            value={maxReplyWords}
            onChange={setMaxReplyWords}
            type="number"
          />
          <FieldInput
            label={t("Business value proposition", "Business value proposition")}
            value={valueProp}
            onChange={setValueProp}
          />
          <div className="md:col-span-2 space-y-2">
            <Label>{t("Disqualify rules (JSON)", "Disqualify rules (JSON)")}</Label>
            <Textarea
              rows={6}
              value={disqualifyRulesRaw}
              onChange={(event) => setDisqualifyRulesRaw(event.target.value)}
              className="border-white/15 bg-black/25"
            />
            {parsedDisqualifyRules ? null : (
              <p className="text-xs text-red-300">{t("JSON inválido.", "Invalid JSON.")}</p>
            )}
          </div>
        </div>
      </details>

      <details open className="rounded-2xl border border-white/10 bg-white/5 p-4">
        <summary className="cursor-pointer text-sm font-semibold text-[#F5F3EE]">
          {t("Preview generated script", "Preview generated script")}
        </summary>
        <div className="mt-4">
          <Textarea rows={14} value={previewScript} readOnly className="border-white/15 bg-black/30 font-mono text-xs" />
        </div>
      </details>

      <div className="flex items-center gap-3">
        <Button
          type="submit"
          disabled={isPending}
          className="h-11 rounded-xl bg-[#C9A227] px-5 text-[#18140D] hover:bg-[#E5C76B]"
        >
          {isPending ? t("Guardando...", "Saving...") : t("Guardar Call Objectives", "Save Call Objectives")}
        </Button>
        {status ? <p className="text-sm text-[#B9B4A9]">{status}</p> : null}
      </div>
    </form>
  );
}

function FieldInput(props: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: "text" | "number";
}) {
  return (
    <div className="space-y-2">
      <Label>{props.label}</Label>
      <Input
        type={props.type ?? "text"}
        value={props.value}
        onChange={(event) => props.onChange(event.target.value)}
        className="h-10 border-white/15 bg-black/25"
      />
    </div>
  );
}

function FieldSelect(props: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: Array<{ value: string; label: string }>;
}) {
  return (
    <div className="space-y-2">
      <Label>{props.label}</Label>
      <select
        value={props.value}
        onChange={(event) => props.onChange(event.target.value)}
        className="h-10 w-full rounded-xl border border-white/15 bg-black/30 px-3 text-sm text-[#F5F3EE]"
      >
        {props.options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  );
}

function safeJson(raw: string) {
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function slugFieldKey(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9_]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .slice(0, 60);
}

