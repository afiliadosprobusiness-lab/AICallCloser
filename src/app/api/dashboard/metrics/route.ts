import { NextResponse } from "next/server";

import { getWorkspaceContextOrThrow } from "@/lib/session";
import { getDashboardMetrics } from "@/modules/metrics/service";

export async function GET() {
  try {
    const { workspaceId } = await getWorkspaceContextOrThrow();
    const data = await getDashboardMetrics(workspaceId);

    return NextResponse.json({ ok: true, data });
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHORIZED") {
      return NextResponse.json({ ok: false, error: { message: "Unauthorized" } }, { status: 401 });
    }

    return NextResponse.json({ ok: false, error: { message: "Internal error" } }, { status: 500 });
  }
}
