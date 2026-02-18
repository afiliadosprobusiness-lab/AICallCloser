import { NextResponse } from "next/server";

import { db } from "@/lib/db";
import { getWorkspaceContextOrThrow } from "@/lib/session";

export async function GET() {
  try {
    const { workspaceId } = await getWorkspaceContextOrThrow();

    const calls = await db.call.findMany({
      where: { workspaceId },
      select: {
        id: true,
        workspaceId: true,
        fromNumber: true,
        toNumber: true,
        startedAt: true,
        status: true,
        outcome: true,
        lead: {
          select: {
            id: true,
            fullName: true,
            phone: true,
          },
        },
        transcripts: {
          orderBy: { spokenAt: "asc" },
          select: {
            id: true,
            speaker: true,
            text: true,
            spokenAt: true,
          },
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

    if (error instanceof Error && error.message === "ACCOUNT_DISABLED") {
      return NextResponse.json({ ok: false, error: { message: "Account disabled" } }, { status: 403 });
    }

    return NextResponse.json({ ok: false, error: { message: "Internal error" } }, { status: 500 });
  }
}
