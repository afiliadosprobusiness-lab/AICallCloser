import { NextResponse } from "next/server";

import { getSessionOrThrow } from "@/lib/session";
import { getUserWorkspaces } from "@/modules/workspaces/service";

export async function GET() {
  try {
    const session = await getSessionOrThrow();
    const workspaces = await getUserWorkspaces(session.user.id);

    return NextResponse.json({ ok: true, data: workspaces });
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
