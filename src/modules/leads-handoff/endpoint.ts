import { randomUUID, timingSafeEqual } from "node:crypto";

import type { LeadsWidgetHandoffPayload } from "@/modules/leads-handoff/schema";
import { leadsWidgetHandoffSchema } from "@/modules/leads-handoff/schema";
import {
  createLeadHandoffRecord,
  enqueueLeadHandoffCall,
  summarizeHistoryForLog,
} from "@/modules/leads-handoff/service";
import { env } from "@/lib/env";
import { logger } from "@/lib/logger";

function normalizeBearerToken(value: string | null) {
  if (!value) {
    return null;
  }

  const [scheme, token] = value.split(" ");
  if (!scheme || !token || scheme.toLowerCase() !== "bearer") {
    return null;
  }

  return token.trim();
}

function normalizeTokenValue(value: string) {
  return value
    .trim()
    .replace(/(?:\\r\\n|\\n|\\r)+$/g, "")
    .replace(/[\r\n]+$/g, "");
}

function secureTokenCompare(expected: string, received: string) {
  const normalizedExpected = normalizeTokenValue(expected);
  const normalizedReceived = normalizeTokenValue(received);
  const expectedBuffer = Buffer.from(normalizedExpected, "utf8");
  const receivedBuffer = Buffer.from(normalizedReceived, "utf8");

  if (!expectedBuffer.length || expectedBuffer.length !== receivedBuffer.length) {
    return false;
  }

  return timingSafeEqual(expectedBuffer, receivedBuffer);
}

function toJson(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "Content-Type": "application/json",
    },
  });
}

function parseValidationError(error: string) {
  return toJson({ error }, 400);
}

export type LeadHandoffEndpointDeps = {
  apiKey?: string;
  publicAppUrl: string;
  generateRequestId: () => string;
  persist: (params: { payload: LeadsWidgetHandoffPayload; receivedAt: Date }) => Promise<{
    id: string;
    workspaceId: string;
    agentId: string;
    leadPhoneE164: string;
    status: "queued" | "calling" | "completed" | "failed";
  }>;
  enqueue: (params: {
    handoffId: string;
    workspaceId: string;
    agentId: string;
    toNumber: string;
    request: Request;
  }) => Promise<void>;
  logger: {
    info: (obj: Record<string, unknown>, msg?: string) => void;
    warn: (obj: Record<string, unknown>, msg?: string) => void;
    error: (obj: Record<string, unknown>, msg?: string) => void;
  };
};

export const defaultLeadHandoffDeps: LeadHandoffEndpointDeps = {
  apiKey: env.IACLOSER_API_KEY,
  publicAppUrl: env.PUBLIC_APP_URL ?? env.APP_URL,
  generateRequestId: () => randomUUID(),
  persist: (params) => createLeadHandoffRecord(params),
  enqueue: enqueueLeadHandoffCall,
  logger,
};

export async function handleLeadsWidgetHandoff(
  request: Request,
  deps: LeadHandoffEndpointDeps = defaultLeadHandoffDeps,
) {
  const requestId = deps.generateRequestId();

  try {
    const token = normalizeBearerToken(request.headers.get("authorization"));
    const apiKey = deps.apiKey ? normalizeTokenValue(deps.apiKey) : "";

    if (!apiKey) {
      deps.logger.warn(
        {
          request_id: requestId,
          reason: "api_key_not_configured",
        },
        "lead handoff unauthorized",
      );
      return toJson({ error: "Unauthorized" }, 401);
    }

    if (!token) {
      deps.logger.warn(
        {
          request_id: requestId,
          reason: "missing_or_malformed_bearer",
        },
        "lead handoff unauthorized",
      );
      return toJson({ error: "Unauthorized" }, 401);
    }

    if (!secureTokenCompare(apiKey, token)) {
      deps.logger.warn(
        {
          request_id: requestId,
          reason: "invalid_bearer",
        },
        "lead handoff unauthorized",
      );
      return toJson({ error: "Unauthorized" }, 401);
    }

    const body = await request.json().catch(() => null);
    const parsed = leadsWidgetHandoffSchema.safeParse(body);
    if (!parsed.success) {
      const firstError = parsed.error.issues[0]?.message ?? "Invalid payload";
      deps.logger.warn(
        {
          request_id: requestId,
          reason: "payload_validation_failed",
          issue_path: parsed.error.issues[0]?.path.join(".") ?? "unknown",
          issue_code: parsed.error.issues[0]?.code ?? "unknown",
        },
        "lead handoff validation failed",
      );
      return parseValidationError(firstError);
    }

    if (!parsed.data.consent.accepted) {
      deps.logger.warn(
        {
          request_id: requestId,
          reason: "consent_not_accepted",
        },
        "lead handoff validation failed",
      );
      return parseValidationError("Consent must be accepted.");
    }

    const receivedAt = new Date();
    const created = await deps.persist({ payload: parsed.data, receivedAt });

    void deps
      .enqueue({
        handoffId: created.id,
        workspaceId: created.workspaceId,
        agentId: created.agentId,
        toNumber: created.leadPhoneE164,
        request,
      })
      .catch((error) => {
        deps.logger.warn(
          {
            request_id: requestId,
            handoffId: created.id,
            error: error instanceof Error ? error.message : "enqueue_failed",
          },
          "failed to enqueue lead handoff call",
        );
      });

    deps.logger.info(
      {
        request_id: requestId,
        product: parsed.data.source.product,
        widget_id: parsed.data.source.widget_id,
        lead_chat_slug: parsed.data.source.lead_chat_slug,
        lead_name: parsed.data.lead.name,
        history_summary: summarizeHistoryForLog(parsed.data.history),
      },
      "lead handoff received",
    );

    const redirectUrl = `${deps.publicAppUrl.replace(/\/+$/, "")}/session/${created.id}`;
    return toJson(
      {
        success: true,
        lead_id: created.id,
        leadId: created.id,
        id: created.id,
        redirect_url: redirectUrl,
        redirectUrl,
        landing_url: redirectUrl,
        eta_seconds: 60,
        etaSeconds: 60,
        queuedCallInSeconds: 60,
      },
      200,
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "unknown";

    if (message === "INVALID_PHONE") {
      deps.logger.warn(
        {
          request_id: requestId,
          reason: "invalid_phone",
        },
        "lead handoff validation failed",
      );
      return parseValidationError("lead.phone is not a valid phone.");
    }

    if (message === "WORKSPACE_NOT_FOUND") {
      deps.logger.warn(
        {
          request_id: requestId,
          reason: "workspace_not_found",
        },
        "lead handoff validation failed",
      );
      return parseValidationError("Unknown lead_chat_slug.");
    }

    deps.logger.error(
      {
        request_id: requestId,
        error: message,
      },
      "lead handoff endpoint failed",
    );

    return toJson({ error: "Internal server error" }, 500);
  }
}
