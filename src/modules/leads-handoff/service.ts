import type { CallStatus, LeadHandoffStatus, Prisma } from "@prisma/client";

import { db } from "@/lib/db";
import { env } from "@/lib/env";
import { logger } from "@/lib/logger";
import { getTwilioClient } from "@/lib/twilio/client";
import { hasOutboundMarker } from "@/lib/voice/outbound-number";
import type { LeadsWidgetHandoffPayload } from "@/modules/leads-handoff/schema";

const E164_REGEX = /^\+[1-9]\d{7,14}$/;

export function normalizePhoneToE164(rawPhone: string) {
  const compact = rawPhone.replace(/[^\d+]/g, "");
  const normalized = compact.startsWith("+") ? compact : `+${compact}`;
  return normalized;
}

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

  return env.PUBLIC_APP_URL ?? env.APP_URL;
}

export function summarizeHistoryForLog(
  history: Array<{ role: "user" | "assistant"; content: string }>,
) {
  const preview = history.slice(0, 3).map((item) => ({
    role: item.role,
    content_preview: item.content.slice(0, 120),
  }));

  return {
    total_messages: history.length,
    preview,
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

  if (!selected || !E164_REGEX.test(selected)) {
    return null;
  }

  return selected;
}

export async function createLeadHandoffRecord(params: {
  payload: LeadsWidgetHandoffPayload;
  receivedAt: Date;
}) {
  const normalizedPhone = normalizePhoneToE164(params.payload.lead.phone);
  if (!E164_REGEX.test(normalizedPhone)) {
    throw new Error("INVALID_PHONE");
  }

  const workspace = await db.workspace.findUnique({
    where: { slug: params.payload.source.lead_chat_slug },
    select: {
      id: true,
      agentConfig: {
        select: { id: true },
      },
    },
  });

  if (!workspace?.agentConfig?.id) {
    throw new Error("WORKSPACE_NOT_FOUND");
  }

  const historyJson = params.payload.history as unknown as Prisma.InputJsonValue;
  const payloadJson = params.payload as unknown as Prisma.InputJsonValue;

  return db.leadHandoff.create({
    data: {
      workspaceId: workspace.id,
      agentId: workspace.agentConfig.id,
      sourceProduct: params.payload.source.product,
      widgetId: params.payload.source.widget_id,
      clientId: params.payload.source.client_id,
      leadChatSlug: params.payload.source.lead_chat_slug,
      sentAt: new Date(params.payload.source.sent_at),
      leadName: params.payload.lead.name,
      leadPhone: params.payload.lead.phone,
      leadPhoneE164: normalizedPhone,
      leadCollectedInfo: params.payload.lead.collected_info,
      consentAccepted: true,
      consentAcceptedAt: new Date(params.payload.consent.accepted_at),
      consentTextVersion: params.payload.consent.text_version,
      consentText: params.payload.consent.text,
      consentIp: params.payload.consent.ip,
      consentUserAgent: params.payload.consent.user_agent,
      history: historyJson,
      payload: payloadJson,
      receivedAt: params.receivedAt,
      status: "queued",
    },
    select: {
      id: true,
      workspaceId: true,
      agentId: true,
      leadPhoneE164: true,
      status: true,
    },
  });
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
    return "Twilio Trial: verify the destination number in Verified Caller IDs.";
  }

  if (normalized.includes("phone number") && normalized.includes("valid")) {
    return "Destination number must use E.164 format. Example: +51924464410";
  }

  return message;
}

export async function enqueueLeadHandoffCall(params: {
  handoffId: string;
  workspaceId: string;
  agentId: string;
  toNumber: string;
  request?: Request;
}) {
  const twilioClient = getTwilioClient();
  if (!twilioClient) {
    await db.leadHandoff.update({
      where: { id: params.handoffId },
      data: { status: "failed" },
    });
    return;
  }

  const fromNumber = await resolveOutboundFromNumber(params.workspaceId);
  if (!fromNumber) {
    await db.leadHandoff.update({
      where: { id: params.handoffId },
      data: { status: "failed" },
    });
    return;
  }

  const baseUrl = resolveBaseUrl(params.request);
  const outboundUrl = `${baseUrl}/api/twilio/voice/outbound?agentId=${encodeURIComponent(
    params.agentId,
  )}&handoffId=${encodeURIComponent(params.handoffId)}`;
  const statusCallbackUrl = `${baseUrl}/api/twilio/voice/status`;

  try {
    const createdCall = await twilioClient.calls.create({
      to: params.toNumber,
      from: fromNumber,
      url: outboundUrl,
      method: "POST",
      statusCallback: statusCallbackUrl,
      statusCallbackMethod: "POST",
      statusCallbackEvent: ["initiated", "ringing", "answered", "completed"],
    });

    await db.leadHandoff.update({
      where: { id: params.handoffId },
      data: {
        status: "calling",
        lastCallSid: createdCall.sid,
      },
    });
  } catch (error) {
    await db.leadHandoff.update({
      where: { id: params.handoffId },
      data: {
        status: "failed",
      },
    });

    logger.warn(
      {
        handoffId: params.handoffId,
        workspaceId: params.workspaceId,
        error: mapTwilioCreateError(error),
      },
      "lead handoff outbound call failed",
    );
  }
}

export async function syncLeadHandoffStatusByCallSid(params: {
  callSid: string;
  status: CallStatus;
}) {
  const handoff = await db.leadHandoff.findFirst({
    where: { lastCallSid: params.callSid },
    select: { id: true },
  });

  if (!handoff) {
    return;
  }

  const nextStatus: LeadHandoffStatus =
    params.status === "completed"
      ? "completed"
      : params.status === "failed" || params.status === "no_answer"
        ? "failed"
        : "calling";

  await db.leadHandoff.update({
    where: { id: handoff.id },
    data: { status: nextStatus },
  });
}

export async function loadLeadHandoffContext(params: {
  handoffId: string | null;
  workspaceId: string;
}) {
  if (!params.handoffId) {
    return null;
  }

  const handoff = await db.leadHandoff.findFirst({
    where: {
      id: params.handoffId,
      workspaceId: params.workspaceId,
    },
    select: {
      id: true,
      leadName: true,
      leadPhoneE164: true,
      leadCollectedInfo: true,
      sourceProduct: true,
      widgetId: true,
      clientId: true,
      history: true,
    },
  });

  if (!handoff) {
    return null;
  }

  const historyPreview = Array.isArray(handoff.history)
    ? handoff.history
        .slice(0, 4)
        .map((item) => {
          if (typeof item !== "object" || item === null) {
            return null;
          }

          const row = item as Record<string, unknown>;
          const role = typeof row.role === "string" ? row.role : "unknown";
          const content = typeof row.content === "string" ? row.content : "";
          return `${role}: ${content.slice(0, 160)}`;
        })
        .filter((item): item is string => Boolean(item))
    : [];

  return {
    id: handoff.id,
    clientName: handoff.leadName,
    objective: "WIDGET_HANDOFF",
    phoneE164: handoff.leadPhoneE164,
    collectedEntries: [
      `Source: ${handoff.sourceProduct}`,
      `Widget: ${handoff.widgetId}`,
      `Client: ${handoff.clientId}`,
      `Collected info: ${handoff.leadCollectedInfo.slice(0, 1000)}`,
      ...historyPreview,
    ],
    promptObjective:
      "Primary objective: continue sales closing workflow from widget handoff and push to booked call or close.",
    externalId: handoff.id,
    customerName: handoff.sourceProduct,
    preferredTimes: [],
  };
}
