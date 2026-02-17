import { CallStatus } from "@prisma/client";

import { logger } from "@/lib/logger";
import { verifyTwilioSignature } from "@/lib/twilio/security";
import { resolveWorkspaceByTwilioNumber } from "@/lib/workspace";
import { completeCall } from "@/modules/calls/service";

const twilioToCallStatus: Record<string, CallStatus> = {
  queued: CallStatus.ringing,
  ringing: CallStatus.ringing,
  in_progress: CallStatus.in_progress,
  completed: CallStatus.completed,
  busy: CallStatus.failed,
  failed: CallStatus.failed,
  no_answer: CallStatus.no_answer,
  canceled: CallStatus.failed,
};

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const params = Object.fromEntries(
      Array.from(formData.entries()).map(([key, value]) => [key, String(value)]),
    );

    if (process.env.TWILIO_AUTH_TOKEN && !verifyTwilioSignature(request, params)) {
      return new Response("Invalid signature", { status: 403 });
    }

    const callSid = params.CallSid;
    const toNumber = params.To;
    const callStatus = params.CallStatus;

    if (!callSid || !toNumber || !callStatus) {
      return new Response("Missing params", { status: 400 });
    }

    const workspacePhone = await resolveWorkspaceByTwilioNumber(toNumber);

    if (!workspacePhone) {
      return new Response("ok", { status: 200 });
    }

    const status = twilioToCallStatus[callStatus] ?? CallStatus.failed;

    await completeCall({
      workspaceId: workspacePhone.workspaceId,
      callSid,
      status,
      durationSeconds: Number(params.CallDuration || "0") || undefined,
    });

    return new Response("ok", { status: 200 });
  } catch (error) {
    logger.error({ error }, "Twilio status callback failed");
    return new Response("error", { status: 500 });
  }
}
