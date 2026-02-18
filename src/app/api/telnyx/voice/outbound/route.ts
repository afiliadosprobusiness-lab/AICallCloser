import { NextResponse } from "next/server";
import { z } from "zod";

import { db } from "@/lib/db";
import { env } from "@/lib/env";
import { getWorkspaceContextOrThrow } from "@/lib/session";

const payloadSchema = z.object({
  to: z.string().min(7),
  from: z.string().min(7).optional(),
  answerText: z.string().min(3).max(300).optional(),
});

export async function POST(request: Request) {
  try {
    const { workspaceId } = await getWorkspaceContextOrThrow();
    const body = await request.json().catch(() => null);
    const parsed = payloadSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ ok: false, error: parsed.error.flatten() }, { status: 400 });
    }

    if (!env.TELNYX_API_KEY || !env.TELNYX_CONNECTION_ID) {
      return NextResponse.json(
        {
          ok: false,
          error: {
            message: "Telnyx no configurado. Define TELNYX_API_KEY y TELNYX_CONNECTION_ID.",
          },
        },
        { status: 503 },
      );
    }

    const workspaceNumber = await db.twilioPhoneNumber.findFirst({
      where: {
        workspaceId,
        isActive: true,
      },
      orderBy: { createdAt: "asc" },
      select: { phoneNumber: true },
    });

    const fromNumber = parsed.data.from ?? env.TELNYX_INBOUND_NUMBER ?? workspaceNumber?.phoneNumber;

    if (!fromNumber) {
      return NextResponse.json(
        { ok: false, error: { message: "No hay numero origen configurado para salida." } },
        { status: 400 },
      );
    }

    const message =
      parsed.data.answerText ??
      "Hello, this is AI Call Closer assistant confirming your interest and booking your call.";

    const answerUrl = `${env.APP_URL}/api/telnyx/voice/outbound/answer?workspaceId=${workspaceId}&message=${encodeURIComponent(message)}`;

    const telnyxResponse = await fetch("https://api.telnyx.com/v2/calls", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${env.TELNYX_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        connection_id: env.TELNYX_CONNECTION_ID,
        to: parsed.data.to,
        from: fromNumber,
        webhook_url: answerUrl,
        webhook_url_method: "POST",
      }),
    });

    const data = (await telnyxResponse.json().catch(() => ({}))) as Record<string, unknown>;

    if (!telnyxResponse.ok) {
      return NextResponse.json(
        { ok: false, error: { message: "Telnyx rechazo la llamada saliente.", data } },
        { status: telnyxResponse.status },
      );
    }

    return NextResponse.json({ ok: true, data }, { status: 201 });
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

    return NextResponse.json(
      { ok: false, error: { message: "No se pudo iniciar la llamada saliente en Telnyx." } },
      { status: 500 },
    );
  }
}
