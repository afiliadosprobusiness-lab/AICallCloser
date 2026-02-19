import { NextResponse } from "next/server";

import { getWorkspaceContextOrThrow } from "@/lib/session";
import { triggerBridgeLeadCall } from "@/modules/bridge/service";

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const { workspaceId } = await getWorkspaceContextOrThrow();
    const { id } = await context.params;
    const payload = await request.json().catch(() => undefined);

    const result = await triggerBridgeLeadCall({
      workspaceId,
      leadId: id,
      request,
      payload,
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
      { ok: false, error: { message: "Could not start bridge outbound call." } },
      { status: 500 },
    );
  }
}
