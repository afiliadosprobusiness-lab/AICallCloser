import { z } from "zod";

export const callObjectiveValues = [
  "sell_product",
  "book_in_person_meeting",
  "book_google_meet",
  "book_calcom_appointment",
  "schedule_followup_call",
  "collect_lead_info",
  "qualify_only",
  "transfer_to_human",
  "send_summary",
] as const;

export const leadFieldTypeValues = ["text", "email", "phone", "number", "textarea", "boolean"] as const;
export const languageValues = ["en", "es"] as const;
export const meetingTypeValues = ["in_person", "google_meet", "phone_call"] as const;
export const calendarProviderValues = ["calcom", "google", "manual"] as const;

export type CallObjectiveValue = (typeof callObjectiveValues)[number];
export type LeadFieldTypeValue = (typeof leadFieldTypeValues)[number];
export type AgentLanguageValue = (typeof languageValues)[number];
export type MeetingTypeValue = (typeof meetingTypeValues)[number];
export type CalendarProviderValue = (typeof calendarProviderValues)[number];

export const callObjectiveSchema = z.enum(callObjectiveValues);
export const leadFieldTypeSchema = z.enum(leadFieldTypeValues);
export const agentLanguageSchema = z.enum(languageValues);
export const meetingTypeSchema = z.enum(meetingTypeValues);
export const calendarProviderSchema = z.enum(calendarProviderValues);

export const leadFieldSchema = z.object({
  key: z.string().min(1).max(60).regex(/^[a-zA-Z0-9_]+$/),
  label: z.string().min(1).max(80),
  type: leadFieldTypeSchema,
  required: z.boolean().default(true),
  validation: z.string().optional().default(""),
});

export const meetingConfigSchema = z.object({
  meetingType: meetingTypeSchema.default("phone_call"),
  durationMinutes: z.number().int().min(10).max(240).default(30),
  locationText: z.string().max(200).optional().nullable(),
  calendarProvider: calendarProviderSchema.default("manual"),
  calendarUrl: z.string().url().optional().nullable(),
});

export const followupConfigSchema = z.object({
  allowedWindows: z.array(z.string().min(2).max(60)).default([]),
  maxFollowups: z.number().int().min(1).max(12).default(2),
});

export const complianceRulesSchema = z
  .object({
    doNotInventPrices: z.boolean().default(true),
    noGuarantees: z.boolean().default(true),
    discloseAI: z.boolean().default(true),
    maxReplyWords: z.number().int().min(8).max(40).default(20),
    endCallIfNotInterested: z.boolean().default(true),
  })
  .passthrough();

export const callPreferencesInputSchema = z.object({
  primaryObjective: callObjectiveSchema.default("qualify_only"),
  secondaryObjectives: z.array(callObjectiveSchema).default([]),
  language: agentLanguageSchema.default("en"),
  meetingConfig: meetingConfigSchema.default({
    meetingType: "phone_call",
    durationMinutes: 30,
    locationText: null,
    calendarProvider: "manual",
    calendarUrl: null,
  }),
  followupConfig: followupConfigSchema.default({
    allowedWindows: [],
    maxFollowups: 2,
  }),
  leadFieldsRequired: z.array(leadFieldSchema).min(1),
  disqualifyRules: z.record(z.string(), z.any()).default({}),
  complianceRules: complianceRulesSchema.default({
    doNotInventPrices: true,
    noGuarantees: true,
    discloseAI: true,
    maxReplyWords: 20,
    endCallIfNotInterested: true,
  }),
});

export type LeadFieldConfig = z.infer<typeof leadFieldSchema>;
export type AgentCallPreferencesInput = z.infer<typeof callPreferencesInputSchema>;
export type ComplianceRulesInput = z.infer<typeof complianceRulesSchema>;

export const defaultLeadFields: LeadFieldConfig[] = [
  { key: "name", label: "Full name", type: "text", required: true, validation: "" },
  { key: "email", label: "Email", type: "email", required: true, validation: "" },
  { key: "company", label: "Company", type: "text", required: false, validation: "" },
  { key: "budget", label: "Budget", type: "number", required: false, validation: "" },
  { key: "service_needed", label: "Service needed", type: "textarea", required: true, validation: "" },
];

export const defaultCallPreferences: AgentCallPreferencesInput = {
  primaryObjective: "qualify_only",
  secondaryObjectives: ["schedule_followup_call", "transfer_to_human"],
  language: "en",
  meetingConfig: {
    meetingType: "phone_call",
    durationMinutes: 30,
    locationText: null,
    calendarProvider: "manual",
    calendarUrl: null,
  },
  followupConfig: {
    allowedWindows: ["tomorrow AM", "tomorrow PM"],
    maxFollowups: 2,
  },
  leadFieldsRequired: defaultLeadFields,
  disqualifyRules: {
    minBudget: 0,
    serviceArea: [],
    mustBeDecisionMaker: false,
  },
  complianceRules: {
    doNotInventPrices: true,
    noGuarantees: true,
    discloseAI: true,
    maxReplyWords: 20,
    endCallIfNotInterested: true,
  },
};

const objectiveTitles: Record<CallObjectiveValue, string> = {
  sell_product: "Sell product",
  book_in_person_meeting: "Book in-person meeting",
  book_google_meet: "Book Google Meet",
  book_calcom_appointment: "Book Cal.com appointment",
  schedule_followup_call: "Schedule follow-up call",
  collect_lead_info: "Collect lead info",
  qualify_only: "Qualify only",
  transfer_to_human: "Transfer to human",
  send_summary: "Send summary",
};

const objectiveCloseTemplates: Record<CallObjectiveValue, string> = {
  sell_product: "Close with a direct CTA and confirm next paid step.",
  book_in_person_meeting: "Offer available in-person slots and confirm location.",
  book_google_meet: "Offer a Google Meet slot and confirm attendee email.",
  book_calcom_appointment: "Confirm time preference and route booking to Cal.com URL.",
  schedule_followup_call: "Lock date/time window for follow-up and confirm callback number.",
  collect_lead_info: "Collect all required fields only, then confirm completion.",
  qualify_only: "Run qualification and finish with concise next step recommendation.",
  transfer_to_human: "Acknowledge and transfer to human specialist quickly.",
  send_summary: "Confirm where to send summary (SMS/Email/WhatsApp) and close.",
};

export function getObjectiveTitle(objective: CallObjectiveValue) {
  return objectiveTitles[objective];
}

export function normalizeCallPreferences(
  raw: unknown,
  fallback: AgentCallPreferencesInput = defaultCallPreferences,
) {
  const parsed = callPreferencesInputSchema.safeParse(raw);
  if (parsed.success) {
    return parsed.data;
  }

  return fallback;
}

export function getFallbackObjective(preferences: AgentCallPreferencesInput): CallObjectiveValue {
  if (preferences.secondaryObjectives.includes("schedule_followup_call")) {
    return "schedule_followup_call";
  }

  if (preferences.secondaryObjectives.includes("transfer_to_human")) {
    return "transfer_to_human";
  }

  return "schedule_followup_call";
}

export function buildDynamicPlaybook(params: {
  agentName: string;
  valueProp: string;
  preferences: AgentCallPreferencesInput;
}) {
  const { preferences } = params;
  const fallbackObjective = getFallbackObjective(preferences);
  const requiredFields = preferences.leadFieldsRequired.filter((field) => field.required);

  const qualifyQuestions = requiredFields.slice(0, 4).map((field) => `Ask for ${field.label}.`);

  if (qualifyQuestions.length === 0) {
    qualifyQuestions.push("Ask goal, urgency, budget and decision ownership.");
  }

  const opening =
    preferences.language === "es"
      ? `Hola, soy ${params.agentName}, asistente virtual. ${params.valueProp || "Te ayudo a resolver esto rapido."}`
      : `Hi, this is ${params.agentName}, virtual assistant. ${params.valueProp || "I can help you quickly."}`;

  const objectivePrompt = objectiveCloseTemplates[preferences.primaryObjective];
  const fallbackPrompt = objectiveCloseTemplates[fallbackObjective];

  const complianceBullets = [
    "Never invent prices.",
    "No guarantees unless explicitly configured.",
    "Disclose virtual assistant identity if asked.",
    `Keep each reply under ${preferences.complianceRules.maxReplyWords} words.`,
    "If lead is not interested, close politely and fast.",
  ];

  return {
    opening,
    qualifyQuestions,
    primaryObjective: preferences.primaryObjective,
    fallbackObjective,
    objectivePrompt,
    fallbackPrompt,
    complianceBullets,
  };
}

export function buildPlaybookPreviewText(params: {
  agentName: string;
  valueProp: string;
  preferences: AgentCallPreferencesInput;
}) {
  const playbook = buildDynamicPlaybook(params);
  const requiredFields = params.preferences.leadFieldsRequired
    .map((field) => `${field.label}${field.required ? " *" : ""}`)
    .join(", ");

  return [
    "OPENING (<=30s):",
    playbook.opening,
    "",
    "QUALIFY (max 4):",
    ...playbook.qualifyQuestions.map((line, index) => `${index + 1}. ${line}`),
    "",
    `PRIMARY OBJECTIVE: ${getObjectiveTitle(playbook.primaryObjective)}`,
    playbook.objectivePrompt,
    "",
    `FALLBACK OBJECTIVE: ${getObjectiveTitle(playbook.fallbackObjective)}`,
    playbook.fallbackPrompt,
    "",
    "REQUIRED LEAD FIELDS:",
    requiredFields || "None",
    "",
    "COMPLIANCE:",
    ...playbook.complianceBullets.map((line) => `- ${line}`),
  ].join("\n");
}

