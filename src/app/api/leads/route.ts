import { NextResponse } from "next/server";
import { z } from "zod";

import { db } from "@/lib/db";
import { getWorkspaceContextOrThrow } from "@/lib/session";
import { listLeadsByWorkspace } from "@/modules/leads/service";

const createLeadSchema = z.object({
  fullName: z.string().min(2).optional(),
  email: z.string().email().optional(),
  phone: z.string().min(6),
  company: z.string().min(2).optional(),
  notes: z.string().max(400).optional(),
});

export async function GET() {
  try {
    const { workspaceId } = await getWorkspaceContextOrThrow();
    const leads = await listLeadsByWorkspace(workspaceId);

    return NextResponse.json({ ok: true, data: leads });
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHORIZED") {
      return NextResponse.json({ ok: false, error: { message: "Unauthorized" } }, { status: 401 });
    }

    return NextResponse.json({ ok: false, error: { message: "Internal error" } }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const { workspaceId } = await getWorkspaceContextOrThrow();
    const body = await request.json();
    const parsed = createLeadSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ ok: false, error: parsed.error.flatten() }, { status: 400 });
    }

    const lead = await db.lead.create({
      data: {
        workspaceId,
        fullName: parsed.data.fullName,
        email: parsed.data.email,
        phone: parsed.data.phone,
        company: parsed.data.company,
        notes: parsed.data.notes,
      },
    });

    return NextResponse.json({ ok: true, data: lead }, { status: 201 });
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHORIZED") {
      return NextResponse.json({ ok: false, error: { message: "Unauthorized" } }, { status: 401 });
    }

    return NextResponse.json({ ok: false, error: { message: "Internal error" } }, { status: 500 });
  }
}
