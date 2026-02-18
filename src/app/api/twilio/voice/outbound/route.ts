import { NextResponse } from "next/server";
import { z } from "zod";

import { db } from "@/lib/db";
import { env } from "@/lib/env";
import { getWorkspaceContextOrThrow } from "@/lib/session";
import { getTwilioClient } from "@/lib/twilio/client";
import { appendTranscriptTurn, createInboundCall } from "@/modules/calls/service";

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

    const twilioClient = getTwilioClient();

    if (!twilioClient) {
      return NextResponse.json(
        {
          ok: false,
          error: {
            message: "Twilio no configurado. Define TWILIO_ACCOUNT_SID y TWILIO_AUTH_TOKEN.",
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

    const fromNumber = parsed.data.from ?? env.TWILIO_INBOUND_NUMBER ?? workspaceNumber?.phoneNumber;

    if (!fromNumber) {
      return NextResponse.json(
        { ok: false, error: { message: "No hay numero origen configurado para salida." } },
        { status: 400 },
      );
    }

    const message =
      parsed.data.answerText ??
      "Hello, this is AI Call Closer assistant confirming your interest and booking your call.";

    const answerUrl = `${env.APP_URL}/api/twilio/voice/outbound/answer?workspaceId=${workspaceId}&message=${encodeURIComponent(message)}`;
    const statusCallbackUrl = `${env.APP_URL}/api/twilio/voice/status`;

    const createdCall = await twilioClient.calls.create({
      to: parsed.data.to,
      from: fromNumber,
      url: answerUrl,
      method: "POST",
      statusCallback: statusCallbackUrl,
      statusCallbackMethod: "POST",
      statusCallbackEvent: ["initiated", "ringing", "answered", "completed"],
    });

    const persisted = await createInboundCall({
      workspaceId,
      twilioCallSid: createdCall.sid,
      fromNumber: parsed.data.to,
      toNumber: fromNumber,
    });

    if (persisted.isNew) {
      await appendTranscriptTurn({
        workspaceId,
        callId: persisted.call.id,
        speaker: "system",
        text: "Outbound call initiated",
        metadata: {
          provider: "twilio",
          direction: "outbound",
          callSid: createdCall.sid,
          from: fromNumber,
          to: parsed.data.to,
        },
      });
    }

    return NextResponse.json({ ok: true, data: createdCall }, { status: 201 });
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
      { ok: false, error: { message: "No se pudo iniciar la llamada saliente en Twilio." } },
      { status: 500 },
    );
  }
}
