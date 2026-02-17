import { NextResponse } from "next/server";
import { z } from "zod";

import { getSessionOrThrow } from "@/lib/session";
import { setActiveWorkspace } from "@/modules/workspaces/service";

const payloadSchema = z.object({
  workspaceId: z.string().min(8),
});

export async function POST(request: Request) {
  try {
    const session = await getSessionOrThrow();
    const body = await request.json();

    const parsed = payloadSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ ok: false, error: parsed.error.flatten() }, { status: 400 });
    }

    await setActiveWorkspace({
      userId: session.user.id,
      workspaceId: parsed.data.workspaceId,
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHORIZED") {
      return NextResponse.json({ ok: false, error: { message: "Unauthorized" } }, { status: 401 });
    }

    if (error instanceof Error && error.message === "WORKSPACE_FORBIDDEN") {
      return NextResponse.json({ ok: false, error: { message: "Forbidden" } }, { status: 403 });
    }

    return NextResponse.json({ ok: false, error: { message: "Internal error" } }, { status: 500 });
  }
}
