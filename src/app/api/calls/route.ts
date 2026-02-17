import { NextResponse } from "next/server";

import { db } from "@/lib/db";
import { getWorkspaceContextOrThrow } from "@/lib/session";

export async function GET() {
  try {
    const { workspaceId } = await getWorkspaceContextOrThrow();

    const calls = await db.call.findMany({
      where: { workspaceId },
      include: {
        lead: true,
        transcripts: {
          orderBy: { spokenAt: "asc" },
        },
      },
      orderBy: { startedAt: "desc" },
      take: 50,
    });

    return NextResponse.json({ ok: true, data: calls });
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHORIZED") {
      return NextResponse.json({ ok: false, error: { message: "Unauthorized" } }, { status: 401 });
    }

    return NextResponse.json({ ok: false, error: { message: "Internal error" } }, { status: 500 });
  }
}
