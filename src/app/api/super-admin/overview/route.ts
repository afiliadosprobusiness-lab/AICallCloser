import { NextResponse } from "next/server";

import { getSuperAdminSessionOrThrow } from "@/lib/session";
import { getSuperAdminOverview } from "@/modules/super-admin/service";

export async function GET() {
  try {
    await getSuperAdminSessionOrThrow();
    const overview = await getSuperAdminOverview();

    return NextResponse.json({ ok: true, data: overview });
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHORIZED") {
      return NextResponse.json({ ok: false, error: { message: "Unauthorized" } }, { status: 401 });
    }

    if (error instanceof Error && error.message === "FORBIDDEN") {
      return NextResponse.json({ ok: false, error: { message: "Forbidden" } }, { status: 403 });
    }

    if (error instanceof Error && error.message === "ACCOUNT_DISABLED") {
      return NextResponse.json({ ok: false, error: { message: "Account disabled" } }, { status: 403 });
    }

    return NextResponse.json(
      { ok: false, error: { message: "No se pudo cargar el panel super admin." } },
      { status: 500 },
    );
  }
}
