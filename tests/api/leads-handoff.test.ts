import assert from "node:assert/strict";
import test from "node:test";

import { handleLeadsWidgetHandoff, type LeadHandoffEndpointDeps } from "@/modules/leads-handoff/endpoint";

const basePayload = {
  source: {
    product: "leads.widget" as const,
    widget_id: "abc123",
    client_id: "uid_xxx",
    lead_chat_slug: "workspace-demo",
    sent_at: "2026-02-19T12:34:56.000Z",
  },
  lead: {
    name: "Juan Perez",
    phone: "14155552671",
    collected_info: "Resumen de calificacion",
  },
  consent: {
    accepted: true,
    accepted_at: "2026-02-19T12:34:56.000Z",
    text_version: "v1",
    text: "Acepto ser contactado",
    explicit_response: "SI",
    ip: "127.0.0.1",
    user_agent: "Mozilla/5.0",
  },
  history: [
    { role: "user" as const, content: "Hola" },
    { role: "assistant" as const, content: "Te ayudo" },
  ],
};

function createDeps(overrides: Partial<LeadHandoffEndpointDeps> = {}): LeadHandoffEndpointDeps {
  return {
    apiKey: "secret-token",
    publicAppUrl: "https://tuapp.com",
    generateRequestId: () => "req_test_1",
    persist: async () => ({
      id: "lead_handoff_1",
      workspaceId: "ws_1",
      agentId: "agent_1",
      leadPhoneE164: "+14155552671",
      status: "queued",
    }),
    enqueue: async () => undefined,
    logger: {
      info: () => undefined,
      warn: () => undefined,
      error: () => undefined,
    },
    ...overrides,
  };
}

function buildRequest(payload: unknown, token?: string) {
  return new Request("https://api.example.com/api/leads/handoff", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(payload),
  });
}

test("leads handoff returns 200 on success", async () => {
  let enqueueCalled = false;
  const deps = createDeps({
    enqueue: async () => {
      enqueueCalled = true;
    },
  });

  const response = await handleLeadsWidgetHandoff(buildRequest(basePayload, "secret-token"), deps);
  const json = (await response.json()) as Record<string, unknown>;

  assert.equal(response.status, 200);
  assert.equal(json.success, true);
  assert.equal(json.lead_id, "lead_handoff_1");
  assert.equal(json.leadId, "lead_handoff_1");
  assert.equal(json.id, "lead_handoff_1");
  assert.equal(json.redirect_url, "https://tuapp.com/session/lead_handoff_1");
  assert.equal(json.redirectUrl, "https://tuapp.com/session/lead_handoff_1");
  assert.equal(json.landing_url, "https://tuapp.com/session/lead_handoff_1");
  assert.equal(json.eta_seconds, 60);
  assert.equal(json.etaSeconds, 60);
  assert.equal(json.queuedCallInSeconds, 60);
  assert.equal(enqueueCalled, true);
});

test("leads handoff returns 401 without token", async () => {
  const response = await handleLeadsWidgetHandoff(buildRequest(basePayload), createDeps());
  const json = (await response.json()) as Record<string, unknown>;

  assert.equal(response.status, 401);
  assert.equal(json.error, "Unauthorized");
});

test("leads handoff returns 401 with invalid token", async () => {
  const response = await handleLeadsWidgetHandoff(
    buildRequest(basePayload, "invalid-token"),
    createDeps(),
  );
  const json = (await response.json()) as Record<string, unknown>;

  assert.equal(response.status, 401);
  assert.equal(json.error, "Unauthorized");
});

test("leads handoff accepts api key with trailing escaped CRLF", async () => {
  const response = await handleLeadsWidgetHandoff(
    buildRequest(basePayload, "secret-token"),
    createDeps({ apiKey: "secret-token\\r\\n" }),
  );
  const json = (await response.json()) as Record<string, unknown>;

  assert.equal(response.status, 200);
  assert.equal(json.success, true);
});

test("leads handoff returns 400 when consent is false", async () => {
  const payload = {
    ...basePayload,
    consent: {
      ...basePayload.consent,
      accepted: false,
    },
  };

  const response = await handleLeadsWidgetHandoff(buildRequest(payload, "secret-token"), createDeps());
  const json = (await response.json()) as Record<string, unknown>;

  assert.equal(response.status, 400);
  assert.equal(typeof json.error, "string");
});

test("leads handoff returns 400 on invalid payload", async () => {
  const payload = {
    ...basePayload,
    lead: {
      ...basePayload.lead,
      phone: "",
    },
  };

  const response = await handleLeadsWidgetHandoff(buildRequest(payload, "secret-token"), createDeps());
  const json = (await response.json()) as Record<string, unknown>;

  assert.equal(response.status, 400);
  assert.equal(typeof json.error, "string");
});

test("leads handoff accepts lowercase explicit_response aliases", async () => {
  const payload = {
    ...basePayload,
    consent: {
      ...basePayload.consent,
      explicit_response: "yes",
    },
  };

  const response = await handleLeadsWidgetHandoff(buildRequest(payload, "secret-token"), createDeps());
  const json = (await response.json()) as Record<string, unknown>;

  assert.equal(response.status, 200);
  assert.equal(json.success, true);
});
