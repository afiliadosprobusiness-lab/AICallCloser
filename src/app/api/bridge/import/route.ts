import { NextResponse } from "next/server";

import { getWorkspaceContextOrThrow } from "@/lib/session";
import { importBridgePayload, parseBridgeImportFromRequest } from "@/modules/bridge/service";

export async function POST(request: Request) {
  try {
    const { workspaceId, userId } = await getWorkspaceContextOrThrow();
    const parsed = await parseBridgeImportFromRequest(request);

    if (!parsed.ok) {
      return NextResponse.json(
        {
          ok: false,
          error: {
            message: "Invalid bridge import payload.",
            errors: parsed.errors,
          },
        },
        { status: parsed.status },
      );
    }

    const imported = await importBridgePayload({
      workspaceId,
      payload: parsed.payload,
      userId,
    });

    if (!imported.ok) {
      return NextResponse.json(
        {
          ok: false,
          error: {
            message: "Bridge import validation failed.",
            errors: imported.errors,
          },
        },
        { status: imported.status },
      );
    }

    return NextResponse.json({ ok: true, data: imported.data }, { status: 201 });
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
      {
        ok: false,
        error: { message: "Could not import bridge leads." },
      },
      { status: 500 },
    );
  }
}
