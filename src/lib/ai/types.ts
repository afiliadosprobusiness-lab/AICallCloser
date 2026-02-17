import { z } from "zod";

export const decisionActionSchema = z.enum([
  "qualify",
  "schedule",
  "handoff",
  "close",
  "follow_up",
]);

export const leadStatusSchema = z.enum([
  "new",
  "qualified",
  "unqualified",
  "scheduled",
  "handed_off",
  "won",
  "lost",
]);

export const aiDecisionSchema = z.object({
  assistantReply: z.string().min(1),
  action: decisionActionSchema,
  leadUpdates: z
    .object({
      fullName: z.string().optional(),
      email: z.string().email().optional(),
      phone: z.string().optional(),
      company: z.string().optional(),
      scoreDelta: z.number().int().min(-20).max(20).default(0),
      status: leadStatusSchema.optional(),
      notes: z.string().optional(),
    })
    .default({ scoreDelta: 0 }),
  appointment: z
    .object({
      suggestedDate: z.string().optional(),
      timezone: z.string().optional(),
      notes: z.string().optional(),
    })
    .nullable()
    .default(null),
  handoffReason: z.string().optional(),
  confidence: z.number().min(0).max(1).default(0.6),
});

export type AIDecision = z.infer<typeof aiDecisionSchema>;
