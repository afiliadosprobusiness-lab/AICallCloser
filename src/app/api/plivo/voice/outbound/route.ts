import { NextResponse } from "next/server";
import { z } from "zod";

import { env } from "@/lib/env";
import { getPlivoClient } from "@/lib/plivo/client";
import { db } from "@/lib/db";
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

    const plivoClient = getPlivoClient();

    if (!plivoClient) {
      return NextResponse.json(
        { ok: false, error: { message: "Plivo no configurado. Define PLIVO_AUTH_ID y PLIVO_AUTH_TOKEN." } },
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

    const fromNumber = parsed.data.from ?? env.PLIVO_INBOUND_NUMBER ?? workspaceNumber?.phoneNumber;

    if (!fromNumber) {
      return NextResponse.json(
        { ok: false, error: { message: "No hay numero origen configurado para salida." } },
        { status: 400 },
      );
    }

    const message =
      parsed.data.answerText ??
      "Hola, te llama el asistente de AI Call Closer para confirmar tu interes y agendar contigo.";

    const answerUrl = `${env.APP_URL}/api/plivo/voice/outbound/answer?workspaceId=${workspaceId}&message=${encodeURIComponent(message)}`;
    const hangupUrl = `${env.APP_URL}/api/plivo/voice/status`;

    const response = await plivoClient.calls.create(fromNumber, parsed.data.to, answerUrl, {
      answerMethod: "POST",
      hangupUrl,
      hangupMethod: "POST",
    });

    return NextResponse.json({ ok: true, data: response }, { status: 201 });
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
      { ok: false, error: { message: "No se pudo iniciar la llamada saliente en Plivo." } },
      { status: 500 },
    );
  }
}
