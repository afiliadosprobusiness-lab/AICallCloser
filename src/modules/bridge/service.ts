import type { BridgeLeadStatus, CallStatus, Prisma } from "@prisma/client";
import { z } from "zod";

import { type CallObjectiveValue } from "@/lib/call-objectives/config";
import { db } from "@/lib/db";
import { env } from "@/lib/env";
import { logger } from "@/lib/logger";
import { getTwilioClient } from "@/lib/twilio/client";
import { hasOutboundMarker } from "@/lib/voice/outbound-number";
import { formatBridgeObjectiveForPrompt, mapBridgeObjectiveToCallObjective } from "@/modules/bridge/objective";
import {
  BRIDGE_IMPORT_MAX_BYTES,
  bridgeCallPayloadSchema,
  bridgeImportSchema,
  bridgeOutcomePayloadSchema,
  type BridgeImportPayload,
  type BridgeOutcomeInput,
} from "@/modules/bridge/schema";

const ERROR_TRIAL_RESTRICTION =
  "Twilio Trial: verify the destination number in Verified Caller IDs.";

export type BridgeImportError = {
  code: string;
  message: string;
  path?: string;
};

export type BridgeImportResult = {
  customer: {
    id: string;
    customerName: string;
    customerId: string | null;
  };
  imported: number;
  updated: number;
  totalLeads: number;
  errors: BridgeImportError[];
};

export function resolveBaseUrl(request?: Request) {
  if (env.BASE_URL) {
    return env.BASE_URL;
  }

  if (request) {
    const url = new URL(request.url);
    const host = request.headers.get("x-forwarded-host") ?? request.headers.get("host") ?? url.host;
    const proto = request.headers.get("x-forwarded-proto") ?? url.protocol.replace(":", "");
    return `${proto}://${host}`;
  }

  return env.APP_URL;
}

function sanitizeText(value: string, max = 500) {
  return value.trim().slice(0, max);
}

function sanitizeJsonValue(value: unknown, depth = 0): Prisma.InputJsonValue {
  if (depth > 4) {
    return "";
  }

  if (typeof value === "string") {
    return sanitizeText(value, 1000);
  }

  if (typeof value === "number" || typeof value === "boolean") {
    return value;
  }

  if (value === null) {
    return "";
  }

  if (Array.isArray(value)) {
    return value.slice(0, 30).map((item) => sanitizeJsonValue(item, depth + 1));
  }

  if (typeof value === "object") {
    const source = value as Record<string, unknown>;
    const entries = Object.entries(source).slice(0, 80);
    const output: Record<string, Prisma.InputJsonValue> = {};

    for (const [key, item] of entries) {
      const safeKey = sanitizeText(key, 80);
      output[safeKey] = sanitizeJsonValue(item, depth + 1);
    }

    return output;
  }

  return "";
}

function normalizeZodErrors(error: z.ZodError): BridgeImportError[] {
  return error.issues.map((issue) => ({
    code: issue.code,
    message: issue.message,
    path: issue.path.join("."),
  }));
}

function mapTwilioCreateError(error: unknown) {
  const message = error instanceof Error ? error.message : "Twilio outbound call failed.";
  const normalized = message.toLowerCase();
  const code =
    typeof error === "object" && error !== null && "code" in error
      ? Number((error as { code?: unknown }).code)
      : undefined;

  if (
    normalized.includes("trial") ||
    normalized.includes("unverified") ||
    normalized.includes("verified caller id") ||
    code === 21210
  ) {
    return ERROR_TRIAL_RESTRICTION;
  }

  if (normalized.includes("phone number") && normalized.includes("valid")) {
    return "Destination number must use E.164 format. Example: +51924464410";
  }

  return message;
}

export async function parseBridgeImportFromRequest(request: Request) {
  const contentType = request.headers.get("content-type") ?? "";
  let parsedRaw: unknown;
  let payloadSize = 0;

  if (contentType.includes("multipart/form-data")) {
    const formData = await request.formData();
    const maybeFile = formData.get("file") ?? formData.get("jsonFile");
    const maybePayload = formData.get("payload");

    if (maybeFile instanceof File) {
      payloadSize = maybeFile.size;
      if (payloadSize > BRIDGE_IMPORT_MAX_BYTES) {
        return {
          ok: false as const,
          status: 413,
          errors: [
            {
              code: "file_too_large",
              message: `File too large. Max size is ${BRIDGE_IMPORT_MAX_BYTES} bytes.`,
            },
          ],
        };
      }

      const content = await maybeFile.text();
      parsedRaw = JSON.parse(content);
    } else if (typeof maybePayload === "string" && maybePayload.trim()) {
      payloadSize = Buffer.byteLength(maybePayload, "utf8");
      parsedRaw = JSON.parse(maybePayload);
    } else {
      return {
        ok: false as const,
        status: 400,
        errors: [{ code: "missing_file", message: "Missing JSON file field: file" }],
      };
    }
  } else {
    const body = await request.json().catch(() => null);
    parsedRaw = typeof body === "object" && body !== null && "payload" in body ? body.payload : body;
    payloadSize = Buffer.byteLength(JSON.stringify(parsedRaw ?? {}), "utf8");
  }

  if (payloadSize > BRIDGE_IMPORT_MAX_BYTES) {
    return {
      ok: false as const,
      status: 413,
      errors: [
        {
          code: "payload_too_large",
          message: `Payload too large. Max size is ${BRIDGE_IMPORT_MAX_BYTES} bytes.`,
        },
      ],
    };
  }

  const parsed = bridgeImportSchema.safeParse(parsedRaw);
  if (!parsed.success) {
    return {
      ok: false as const,
      status: 400,
      errors: normalizeZodErrors(parsed.error),
    };
  }

  return {
    ok: true as const,
    payload: parsed.data,
    payloadSize,
  };
}

async function resolveOrCreateCustomer(params: {
  workspaceId: string;
  payload: BridgeImportPayload;
}) {
  const { workspaceId, payload } = params;
  const { customerName, customerId } = payload.customer;

  if (customerId) {
    return db.customer.upsert({
      where: {
        workspaceId_customerId: {
          workspaceId,
          customerId,
        },
      },
      update: {
        customerName,
      },
      create: {
        workspaceId,
        customerName,
        customerId,
      },
      select: {
        id: true,
        customerName: true,
        customerId: true,
      },
    });
  }

  return db.customer.upsert({
    where: {
      workspaceId_customerName: {
        workspaceId,
        customerName,
      },
    },
    update: {},
    create: {
      workspaceId,
      customerName,
      customerId: null,
    },
    select: {
      id: true,
      customerName: true,
      customerId: true,
    },
  });
}

export async function importBridgePayload(params: {
  workspaceId: string;
  payload: BridgeImportPayload;
  userId: string;
}) {
  const { workspaceId, payload, userId } = params;

  const agent = await db.agentConfig.findFirst({
    where: {
      id: payload.customer.agentId,
      workspaceId,
    },
    select: {
      id: true,
      workspaceId: true,
    },
  });

  if (!agent) {
    return {
      ok: false as const,
      status: 400,
      errors: [
        {
          code: "invalid_agent",
          message: "customer.agentId is not linked to this workspace.",
          path: "customer.agentId",
        },
      ],
    };
  }

  const customer = await resolveOrCreateCustomer({ workspaceId, payload });
  const existingLeads = await db.bridgeLead.findMany({
    where: {
      customerId: customer.id,
      externalId: { in: payload.leads.map((item) => item.externalId) },
    },
    select: { externalId: true },
  });
  const existingIds = new Set(existingLeads.map((item) => item.externalId));

  let imported = 0;
  let updated = 0;
  const errors: BridgeImportError[] = [];

  for (const [index, lead] of payload.leads.entries()) {
    try {
      await db.bridgeLead.upsert({
        where: {
          customerId_externalId: {
            customerId: customer.id,
            externalId: lead.externalId,
          },
        },
        update: {
          agentId: payload.customer.agentId,
          clientName: lead.clientName ?? null,
          phoneE164: lead.phoneE164,
          objective: lead.objective,
          collectedInfo: sanitizeJsonValue(lead.collectedInfo),
          preferredTimes: sanitizeJsonValue(lead.preferredTimes),
        },
        create: {
          workspaceId,
          customerId: customer.id,
          agentId: payload.customer.agentId,
          externalId: lead.externalId,
          clientName: lead.clientName ?? null,
          phoneE164: lead.phoneE164,
          objective: lead.objective,
          collectedInfo: sanitizeJsonValue(lead.collectedInfo),
          preferredTimes: sanitizeJsonValue(lead.preferredTimes),
          status: "new",
        },
      });

      if (existingIds.has(lead.externalId)) {
        updated += 1;
      } else {
        imported += 1;
      }
    } catch (error) {
      errors.push({
        code: "upsert_failed",
        message: error instanceof Error ? error.message : "Could not upsert lead.",
        path: `leads.${index}`,
      });
    }
  }

  logger.info(
    {
      workspaceId,
      userId,
      customerId: customer.id,
      customerName: customer.customerName,
      imported,
      updated,
      totalLeads: payload.leads.length,
      errors: errors.length,
    },
    "Bridge import completed",
  );

  return {
    ok: true as const,
    data: {
      customer,
      imported,
      updated,
      totalLeads: payload.leads.length,
      errors,
    } satisfies BridgeImportResult,
  };
}

export async function listBridgeLeads(params: {
  workspaceId: string;
  customerId?: string | null;
  page?: number;
  pageSize?: number;
}) {
  const page = Math.max(1, params.page ?? 1);
  const pageSize = Math.min(100, Math.max(1, params.pageSize ?? 50));
  const skip = (page - 1) * pageSize;

  if (params.customerId) {
    const customer = await db.customer.findFirst({
      where: { id: params.customerId, workspaceId: params.workspaceId },
      select: { id: true },
    });

    if (!customer) {
      throw new Error("CUSTOMER_NOT_FOUND");
    }
  }

  const where: Prisma.BridgeLeadWhereInput = {
    workspaceId: params.workspaceId,
    ...(params.customerId ? { customerId: params.customerId } : {}),
  };

  const [items, total, customers] = await Promise.all([
    db.bridgeLead.findMany({
      where,
      orderBy: { updatedAt: "desc" },
      skip,
      take: pageSize,
      select: {
        id: true,
        customerId: true,
        externalId: true,
        clientName: true,
        phoneE164: true,
        objective: true,
        status: true,
        lastCallSid: true,
        collectedInfo: true,
        preferredTimes: true,
        createdAt: true,
        updatedAt: true,
        customer: {
          select: {
            customerName: true,
            customerId: true,
          },
        },
      },
    }),
    db.bridgeLead.count({ where }),
    db.customer.findMany({
      where: { workspaceId: params.workspaceId },
      orderBy: { createdAt: "desc" },
      select: { id: true, customerName: true, customerId: true },
      take: 100,
    }),
  ]);

  return {
    items,
    customers,
    page,
    pageSize,
    total,
    totalPages: Math.max(1, Math.ceil(total / pageSize)),
  };
}

async function resolveOutboundFromNumber(workspaceId: string) {
  const [outboundWorkspaceNumber, workspaceNumber] = await Promise.all([
    db.twilioPhoneNumber.findFirst({
      where: {
        workspaceId,
        isActive: true,
        friendlyName: { contains: "outbound", mode: "insensitive" },
      },
      orderBy: { createdAt: "desc" },
      select: { phoneNumber: true, friendlyName: true },
    }),
    db.twilioPhoneNumber.findFirst({
      where: { workspaceId, isActive: true },
      orderBy: { createdAt: "asc" },
      select: { phoneNumber: true, friendlyName: true },
    }),
  ]);

  const selected =
    outboundWorkspaceNumber?.phoneNumber &&
    hasOutboundMarker(outboundWorkspaceNumber.friendlyName)
      ? outboundWorkspaceNumber.phoneNumber
      : env.TWILIO_NUMBER ?? env.TWILIO_INBOUND_NUMBER ?? workspaceNumber?.phoneNumber;

  if (!selected || !/^\+[1-9]\d{7,14}$/.test(selected)) {
    return null;
  }

  return selected;
}

export async function triggerBridgeLeadCall(params: {
  workspaceId: string;
  leadId: string;
  request: Request;
  payload: unknown;
}) {
  const parsed = bridgeCallPayloadSchema.safeParse(params.payload);
  if (!parsed.success) {
    return {
      ok: false as const,
      status: 400,
      error: parsed.error.flatten(),
    };
  }

  const lead = await db.bridgeLead.findFirst({
    where: {
      id: params.leadId,
      workspaceId: params.workspaceId,
    },
    select: {
      id: true,
      phoneE164: true,
      agentId: true,
    },
  });

  if (!lead) {
    return {
      ok: false as const,
      status: 404,
      error: { message: "Bridge lead not found." },
    };
  }

  const toNumber = parsed.data?.to ?? lead.phoneE164;
  if (!/^\+[1-9]\d{7,14}$/.test(toNumber)) {
    return {
      ok: false as const,
      status: 400,
      error: { message: "Lead phone must use E.164 format." },
    };
  }

  const twilioClient = getTwilioClient();
  if (!twilioClient) {
    return {
      ok: false as const,
      status: 503,
      error: {
        message: "Twilio not configured. Define TWILIO_ACCOUNT_SID and TWILIO_AUTH_TOKEN.",
      },
    };
  }

  const fromNumber = await resolveOutboundFromNumber(params.workspaceId);
  if (!fromNumber) {
    return {
      ok: false as const,
      status: 400,
      error: {
        message: "Missing valid origin number. Configure TWILIO_NUMBER or outbound caller ID.",
      },
    };
  }

  const baseUrl = resolveBaseUrl(params.request);
  const outboundUrl = `${baseUrl}/api/twilio/voice/outbound?agentId=${encodeURIComponent(
    lead.agentId,
  )}&leadId=${encodeURIComponent(lead.id)}`;
  const statusCallbackUrl = `${baseUrl}/api/twilio/voice/status`;

  await db.bridgeLead.update({
    where: { id: lead.id },
    data: { status: "queued" },
  });

  try {
    const createdCall = await twilioClient.calls.create({
      to: toNumber,
      from: fromNumber,
      url: outboundUrl,
      method: "POST",
      statusCallback: statusCallbackUrl,
      statusCallbackMethod: "POST",
      statusCallbackEvent: ["initiated", "ringing", "answered", "completed"],
    });

    await db.$transaction([
      db.bridgeLead.update({
        where: { id: lead.id },
        data: {
          status: "calling",
          lastCallSid: createdCall.sid,
        },
      }),
      db.callLog.create({
        data: {
          workspaceId: params.workspaceId,
          leadId: lead.id,
          callSid: createdCall.sid,
          outcome: "unknown",
          summary: "Outbound bridge call started.",
        },
      }),
    ]);

    return {
      ok: true as const,
      status: 201,
      data: {
        callSid: createdCall.sid,
      },
    };
  } catch (error) {
    await db.bridgeLead.update({
      where: { id: lead.id },
      data: {
        status: "failed",
      },
    });

    return {
      ok: false as const,
      status: 400,
      error: { message: mapTwilioCreateError(error) },
    };
  }
}

const bridgeOutcomeToStatus: Record<BridgeOutcomeInput, BridgeLeadStatus> = {
  sold: "completed",
  booked: "completed",
  followup: "completed",
  not_interested: "completed",
  disqualified: "completed",
};

export async function saveBridgeOutcome(params: {
  workspaceId: string;
  leadId: string;
  payload: unknown;
}) {
  const parsed = bridgeOutcomePayloadSchema.safeParse(params.payload);
  if (!parsed.success) {
    return {
      ok: false as const,
      status: 400,
      error: parsed.error.flatten(),
    };
  }

  const lead = await db.bridgeLead.findFirst({
    where: {
      id: params.leadId,
      workspaceId: params.workspaceId,
    },
    select: {
      id: true,
      lastCallSid: true,
    },
  });

  if (!lead) {
    return {
      ok: false as const,
      status: 404,
      error: { message: "Bridge lead not found." },
    };
  }

  const callLog = await db.callLog.create({
    data: {
      workspaceId: params.workspaceId,
      leadId: lead.id,
      callSid: lead.lastCallSid,
      outcome: parsed.data.outcome,
      summary: parsed.data.summary || null,
      transcript: parsed.data.transcript || null,
    },
    select: {
      id: true,
      outcome: true,
      summary: true,
      createdAt: true,
    },
  });

  await db.bridgeLead.update({
    where: { id: lead.id },
    data: {
      status: bridgeOutcomeToStatus[parsed.data.outcome],
    },
  });

  return {
    ok: true as const,
    status: 200,
    data: callLog,
  };
}

export async function syncBridgeLeadStatusByCallSid(params: {
  callSid: string;
  status: CallStatus;
}) {
  const lead = await db.bridgeLead.findFirst({
    where: { lastCallSid: params.callSid },
    select: { id: true, workspaceId: true },
  });

  if (!lead) {
    return;
  }

  const nextStatus: BridgeLeadStatus =
    params.status === "completed"
      ? "completed"
      : params.status === "failed" || params.status === "no_answer"
        ? "failed"
        : "calling";

  await db.bridgeLead.update({
    where: { id: lead.id },
    data: { status: nextStatus },
  });
}

export async function loadBridgeLeadContext(params: {
  leadId: string | null;
  workspaceId: string;
}) {
  if (!params.leadId) {
    return null;
  }

  const lead = await db.bridgeLead.findFirst({
    where: {
      id: params.leadId,
      workspaceId: params.workspaceId,
    },
    select: {
      id: true,
      externalId: true,
      clientName: true,
      objective: true,
      phoneE164: true,
      collectedInfo: true,
      preferredTimes: true,
      customer: {
        select: {
          customerName: true,
          customerId: true,
        },
      },
    },
  });

  if (!lead) {
    return null;
  }

  const preferredTimes = Array.isArray(lead.preferredTimes)
    ? lead.preferredTimes
        .map((item) => {
          if (typeof item !== "object" || item === null) {
            return null;
          }

          const row = item as Record<string, unknown>;
          const date = typeof row.date === "string" ? row.date : null;
          const time = typeof row.time === "string" ? row.time : null;
          const timezone = typeof row.timezone === "string" ? row.timezone : null;

          if (!date || !time || !timezone) {
            return null;
          }

          return `${date} ${time} (${timezone})`;
        })
        .filter((item): item is string => Boolean(item))
    : [];

  const collectedInfo =
    typeof lead.collectedInfo === "object" && lead.collectedInfo !== null
      ? (lead.collectedInfo as Record<string, unknown>)
      : {};

  const collectedEntries = Object.entries(collectedInfo)
    .slice(0, 12)
    .map(([key, value]) => `${key}: ${typeof value === "string" ? value : JSON.stringify(value)}`);

  return {
    id: lead.id,
    externalId: lead.externalId,
    clientName: lead.clientName,
    objective: lead.objective,
    phoneE164: lead.phoneE164,
    customerName: lead.customer.customerName,
    customerExternalId: lead.customer.customerId,
    preferredTimes,
    collectedEntries,
    promptObjective: formatBridgeObjectiveForPrompt(lead.objective),
    mappedObjective: mapBridgeObjectiveToCallObjective(lead.objective) as CallObjectiveValue,
  };
}

export const BRIDGE_TRIAL_ERROR_MESSAGE = ERROR_TRIAL_RESTRICTION;
