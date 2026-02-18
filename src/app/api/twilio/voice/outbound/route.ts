import { NextResponse } from "next/server";

import { getWorkspaceContextOrThrow } from "@/lib/session";
import { createTwilioOutboundCall, handleTwilioOutboundTwiml } from "@/modules/twilio/outbound";

function resolveRequestBaseUrl(request: Request) {
  const url = new URL(request.url);
  const host = request.headers.get("x-forwarded-host") ?? request.headers.get("host") ?? url.host;
  const proto = request.headers.get("x-forwarded-proto") ?? url.protocol.replace(":", "");
  return `${proto}://${host}`;
}

export async function POST(request: Request) {
  const contentType = request.headers.get("content-type") ?? "";
  const isWebhookRequest =
    contentType.includes("application/x-www-form-urlencoded") ||
    contentType.includes("multipart/form-data");

  if (isWebhookRequest) {
    return handleTwilioOutboundTwiml(request);
  }

  try {
    const { workspaceId } = await getWorkspaceContextOrThrow();
    const body = await request.json().catch(() => null);
    const result = await createTwilioOutboundCall({
      workspaceId,
      payload: body,
      requestBaseUrl: resolveRequestBaseUrl(request),
    });

    return NextResponse.json(
      result.ok ? { ok: true, data: result.data } : { ok: false, error: result.error },
      { status: result.status },
    );
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHORIZED") {
      return NextResponse.json({ ok: false, error: { message: "Unauthorized" } }, { status: 401 });
    }

    if (error instanceof Error && error.message === "ACCOUNT_DISABLED") {
      return NextResponse.json({ ok: false, error: { message: "Account disabled" } }, { status: 403 });
    }

    if (error instanceof Error && error.message === "WORKSPACE_NOT_SELECTED") {
      return NextResponse.json({ ok: false, error: { message: "Workspace not selected" } }, { status: 400 });
    }

    return NextResponse.json(
      { ok: false, error: { message: "Could not start Twilio outbound call." } },
      { status: 500 },
    );
  }
}
