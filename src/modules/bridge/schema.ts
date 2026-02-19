import { z } from "zod";

export const BRIDGE_IMPORT_MAX_BYTES = 200 * 1024;
export const BRIDGE_IMPORT_MAX_LEADS = 5000;

export const e164Schema = z
  .string()
  .trim()
  .regex(/^\+[1-9]\d{7,14}$/, "phoneE164 must use E.164 format (example: +51924464410).");

export const bridgeLeadObjectiveSchema = z.enum([
  "CLOSE_SALE",
  "BOOK_MEET",
  "BOOK_IN_PERSON",
  "SCHEDULE_FOLLOWUP",
]);

const preferredTimeSchema = z
  .object({
    date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "date must be YYYY-MM-DD"),
    time: z.string().regex(/^\d{2}:\d{2}$/, "time must be HH:MM"),
    timezone: z.string().trim().min(3).max(80),
  })
  .strict();

const customerSchema = z
  .object({
    customerName: z.string().trim().min(2).max(120),
    customerId: z.string().trim().min(1).max(120).optional(),
    agentId: z.string().trim().min(1),
  })
  .strict();

const leadSchema = z
  .object({
    externalId: z.string().trim().min(1).max(120),
    clientName: z.string().trim().min(1).max(120).optional(),
    phoneE164: e164Schema,
    objective: bridgeLeadObjectiveSchema,
    collectedInfo: z.record(z.string(), z.unknown()).default({}),
    preferredTimes: z.array(preferredTimeSchema).max(20).default([]),
  })
  .strict();

export const bridgeImportSchema = z
  .object({
    version: z.literal(1),
    customer: customerSchema,
    leads: z.array(leadSchema).min(1).max(BRIDGE_IMPORT_MAX_LEADS),
  })
  .strict()
  .superRefine((value, ctx) => {
    const seen = new Set<string>();
    value.leads.forEach((lead, index) => {
      if (seen.has(lead.externalId)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["leads", index, "externalId"],
          message: "externalId must be unique inside this import file.",
        });
      } else {
        seen.add(lead.externalId);
      }
    });
  });

export const bridgeOutcomeSchema = z.enum([
  "sold",
  "booked",
  "followup",
  "not_interested",
  "disqualified",
]);

export const bridgeOutcomePayloadSchema = z
  .object({
    outcome: bridgeOutcomeSchema,
    summary: z.string().trim().max(2000).optional().default(""),
    transcript: z.string().trim().max(12000).optional().default(""),
  })
  .strict();

export const bridgeCallPayloadSchema = z
  .object({
    to: e164Schema.optional(),
  })
  .strict()
  .optional();

export type BridgeImportPayload = z.infer<typeof bridgeImportSchema>;
export type BridgeLeadObjectiveInput = z.infer<typeof bridgeLeadObjectiveSchema>;
export type BridgeOutcomeInput = z.infer<typeof bridgeOutcomeSchema>;
