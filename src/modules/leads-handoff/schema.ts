import { z } from "zod";

const isoDateSchema = z
  .string()
  .datetime({ offset: true })
  .refine((value) => !Number.isNaN(Date.parse(value)), "Invalid ISO date");

export const handoffHistoryItemSchema = z
  .object({
    role: z.enum(["user", "assistant"]),
    content: z.string().trim().min(1).max(2000),
  })
  .strict();

export const leadsWidgetHandoffSchema = z
  .object({
    source: z
      .object({
        product: z.literal("leads.widget"),
        widget_id: z.string().trim().min(1).max(120),
        client_id: z.string().trim().min(1).max(120),
        lead_chat_slug: z.string().trim().min(1).max(120),
        sent_at: isoDateSchema,
      })
      .strict(),
    lead: z
      .object({
        name: z.string().trim().min(1).max(120),
        phone: z.string().trim().min(6).max(30),
        collected_info: z.string().trim().min(1).max(8000),
      })
      .strict(),
    consent: z
      .object({
        accepted: z.boolean(),
        accepted_at: isoDateSchema,
        text_version: z.string().trim().min(1).max(40),
        text: z.string().trim().min(1).max(4000),
        ip: z.string().trim().min(1).max(120),
        user_agent: z.string().trim().min(1).max(1000),
      })
      .strict(),
    history: z.array(handoffHistoryItemSchema).max(50).optional().default([]),
  })
  .strict();

export type LeadsWidgetHandoffPayload = z.infer<typeof leadsWidgetHandoffSchema>;
