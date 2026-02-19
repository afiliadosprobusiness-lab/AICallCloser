import { NextResponse } from "next/server";

import { getWorkspaceContextOrThrow } from "@/lib/session";
import { listBridgeLeads } from "@/modules/bridge/service";

export async function GET(request: Request) {
  try {
    const { workspaceId } = await getWorkspaceContextOrThrow();
    const url = new URL(request.url);

    const customerId = url.searchParams.get("customerId");
    const pageRaw = Number(url.searchParams.get("page") ?? "1");
    const pageSizeRaw = Number(url.searchParams.get("pageSize") ?? "50");

    const response = await listBridgeLeads({
      workspaceId,
      customerId,
      page: Number.isFinite(pageRaw) ? pageRaw : 1,
      pageSize: Number.isFinite(pageSizeRaw) ? pageSizeRaw : 50,
    });

    return NextResponse.json({
      ok: true,
      data: response,
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

    if (error instanceof Error && error.message === "CUSTOMER_NOT_FOUND") {
      return NextResponse.json({ ok: false, error: { message: "Customer not found." } }, { status: 404 });
    }

    return NextResponse.json({ ok: false, error: { message: "Could not load bridge leads." } }, { status: 500 });
  }
}
