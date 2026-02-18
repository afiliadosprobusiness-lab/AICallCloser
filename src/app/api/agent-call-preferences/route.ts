import { NextResponse } from "next/server";
import { z } from "zod";

import { callPreferencesInputSchema } from "@/lib/call-objectives/config";
import { db } from "@/lib/db";
import { getWorkspaceContextOrThrow } from "@/lib/session";
import {
  buildCallObjectivesPreview,
  getBusinessValueProp,
  getOrCreateCallPreferences,
  saveCallPreferences,
  setBusinessValueProp,
} from "@/modules/call-objectives/service";

const payloadSchema = z.object({
  preferences: callPreferencesInputSchema,
  valueProp: z.string().max(500).optional().default(""),
});

export async function GET() {
  try {
    const { workspaceId } = await getWorkspaceContextOrThrow();

    const [preferences, profileValue, agent] = await Promise.all([
      getOrCreateCallPreferences(workspaceId),
      getBusinessValueProp(workspaceId),
      db.agentConfig.findUnique({
        where: { workspaceId },
        select: { agentName: true },
      }),
    ]);

    const preview = buildCallObjectivesPreview({
      agentName: agent?.agentName ?? "Aurea Assistant",
      valueProp: profileValue,
      preferences,
    });

    return NextResponse.json({
      ok: true,
      data: {
        preferences,
        valueProp: profileValue,
        preview,
      },
    });
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHORIZED") {
      return NextResponse.json({ ok: false, error: { message: "Unauthorized" } }, { status: 401 });
    }

    if (error instanceof Error && error.message === "ACCOUNT_DISABLED") {
      return NextResponse.json({ ok: false, error: { message: "Account disabled" } }, { status: 403 });
    }

    return NextResponse.json({ ok: false, error: { message: "Internal error" } }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const { workspaceId } = await getWorkspaceContextOrThrow();
    const body = await request.json().catch(() => null);
    const parsed = payloadSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ ok: false, error: parsed.error.flatten() }, { status: 400 });
    }

    const [savedPreferences, agent] = await Promise.all([
      saveCallPreferences({
        workspaceId,
        payload: parsed.data.preferences,
      }),
      db.agentConfig.findUnique({
        where: { workspaceId },
        select: { agentName: true },
      }),
    ]);

    if (parsed.data.valueProp.trim()) {
      await setBusinessValueProp(workspaceId, parsed.data.valueProp);
    }

    const valueProp = parsed.data.valueProp.trim() || (await getBusinessValueProp(workspaceId));

    const preview = buildCallObjectivesPreview({
      agentName: agent?.agentName ?? "Aurea Assistant",
      valueProp,
      preferences: savedPreferences,
    });

    return NextResponse.json({
      ok: true,
      data: {
        preferences: savedPreferences,
        valueProp,
        preview,
      },
    });
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

    return NextResponse.json({ ok: false, error: { message: "Could not save call objectives." } }, { status: 500 });
  }
}
