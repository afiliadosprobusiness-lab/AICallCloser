import { NextResponse } from "next/server";
import { z } from "zod";

import { db } from "@/lib/db";
import { getWorkspaceContextOrThrow } from "@/lib/session";

const updateSchema = z.object({
  agentName: z.string().min(2).max(80),
  greetingMessage: z.string().min(10).max(300),
  systemPrompt: z.string().min(30).max(3000),
  handoffEnabled: z.boolean(),
  handoffPhone: z.string().min(8).optional().nullable(),
  calendarLink: z.string().url().optional().nullable(),
  llmModel: z.string().min(2),
  sttModel: z.string().min(2),
  voiceModel: z.string().min(2),
  ttsVoice: z.string().min(2),
  qualificationChecklist: z.array(z.string().min(2)).min(1),
  disallowedClaims: z.array(z.string().min(2)).min(1),
  pricingRules: z.record(z.string(), z.any()),
});

export async function GET() {
  try {
    const { workspaceId } = await getWorkspaceContextOrThrow();

    const config = await db.agentConfig.findUnique({
      where: { workspaceId },
    });

    return NextResponse.json({ ok: true, data: config });
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
    const body = await request.json();
    const parsed = updateSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ ok: false, error: parsed.error.flatten() }, { status: 400 });
    }

    const config = await db.agentConfig.upsert({
      where: { workspaceId },
      update: parsed.data,
      create: {
        workspaceId,
        ...parsed.data,
      },
    });

    return NextResponse.json({ ok: true, data: config });
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
