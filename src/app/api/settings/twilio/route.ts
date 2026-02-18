import { NextResponse } from "next/server";
import { z } from "zod";

import { db } from "@/lib/db";
import { getWorkspaceContextOrThrow } from "@/lib/session";

const emptyToUndefined = <T extends z.ZodTypeAny>(schema: T) =>
  z.preprocess((value) => (value === "" ? undefined : value), schema);

const payloadSchema = z.object({
  phoneNumber: z.string().trim().min(7),
  friendlyName: emptyToUndefined(z.string().trim().min(2).max(80).optional()),
  isActive: z.boolean().default(true),
});

export async function GET() {
  try {
    const { workspaceId } = await getWorkspaceContextOrThrow();
    const numbers = await db.twilioPhoneNumber.findMany({
      where: { workspaceId },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ ok: true, data: numbers });
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHORIZED") {
      return NextResponse.json({ ok: false, error: { message: "Unauthorized" } }, { status: 401 });
    }

    if (error instanceof Error && error.message === "ACCOUNT_DISABLED") {
      return NextResponse.json({ ok: false, error: { message: "Account disabled" } }, { status: 403 });
    }

    if (error instanceof Error && error.message === "WORKSPACE_NOT_SELECTED") {
      return NextResponse.json(
        { ok: false, error: { message: "Workspace not selected" } },
        { status: 400 },
      );
    }

    if (error instanceof Error && error.message === "WORKSPACE_FORBIDDEN") {
      return NextResponse.json({ ok: false, error: { message: "Forbidden workspace" } }, { status: 403 });
    }

    return NextResponse.json({ ok: false, error: { message: "Internal error" } }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const { workspaceId } = await getWorkspaceContextOrThrow();
    const body = await request.json();
    const parsed = payloadSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ ok: false, error: parsed.error.flatten() }, { status: 400 });
    }

    const item = await db.twilioPhoneNumber.upsert({
      where: {
        phoneNumber: parsed.data.phoneNumber,
      },
      update: {
        workspaceId,
        friendlyName: parsed.data.friendlyName,
        isActive: parsed.data.isActive,
      },
      create: {
        workspaceId,
        phoneNumber: parsed.data.phoneNumber,
        friendlyName: parsed.data.friendlyName,
        isActive: parsed.data.isActive,
      },
    });

    return NextResponse.json({ ok: true, data: item }, { status: 201 });
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHORIZED") {
      return NextResponse.json({ ok: false, error: { message: "Unauthorized" } }, { status: 401 });
    }

    if (error instanceof Error && error.message === "ACCOUNT_DISABLED") {
      return NextResponse.json({ ok: false, error: { message: "Account disabled" } }, { status: 403 });
    }

    if (error instanceof Error && error.message === "WORKSPACE_NOT_SELECTED") {
      return NextResponse.json(
        { ok: false, error: { message: "Workspace not selected" } },
        { status: 400 },
      );
    }

    if (error instanceof Error && error.message === "WORKSPACE_FORBIDDEN") {
      return NextResponse.json({ ok: false, error: { message: "Forbidden workspace" } }, { status: 403 });
    }

    return NextResponse.json({ ok: false, error: { message: "Internal error" } }, { status: 500 });
  }
}
