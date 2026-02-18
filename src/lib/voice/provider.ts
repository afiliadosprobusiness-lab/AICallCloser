import { CallStatus } from "@prisma/client";

import { env } from "@/lib/env";

export type VoiceProvider = "telnyx" | "plivo" | "twilio";

export function getVoiceProvider(): VoiceProvider {
  return env.VOICE_PROVIDER;
}

export function getCallIdentifier(params: Record<string, string>) {
  return (
    params.CallUUID ??
    params.CallSid ??
    params.call_uuid ??
    params.callUuid ??
    params.RequestUUID ??
    params.call_control_id ??
    params.call_session_id ??
    params.call_leg_id ??
    ""
  );
}

export function getFromNumber(params: Record<string, string>) {
  return (
    params.From ??
    params.from ??
    params.FromNumber ??
    params.from_number ??
    params.caller_id_number ??
    params.from_phone_number ??
    ""
  );
}

export function getToNumber(params: Record<string, string>) {
  return (
    params.To ??
    params.to ??
    params.ToNumber ??
    params.to_number ??
    params.to_phone_number ??
    params.destination ??
    ""
  );
}

export function getRecordingUrl(params: Record<string, string>) {
  return (
    params.RecordingUrl ??
    params.RecordingURL ??
    params.RecordUrl ??
    params.recording_url ??
    params.recordingUrl ??
    params.recording_urls_0 ??
    ""
  );
}

export function getProviderCallStatus(params: Record<string, string>) {
  return (
    params.CallStatus ??
    params.call_status ??
    params.Event ??
    params.event ??
    params.event_type ??
    params.call_control_event ??
    ""
  );
}

export function getCallDurationSeconds(params: Record<string, string>) {
  const raw =
    params.CallDuration ??
    params.call_duration ??
    params.Duration ??
    params.duration ??
    params.duration_secs ??
    params.BillDuration ??
    params.bill_duration;

  const parsed = Number(raw);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    return undefined;
  }

  return Math.floor(parsed);
}

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

const plivoToCallStatus: Record<string, CallStatus> = {
  ringing: CallStatus.ringing,
  in_progress: CallStatus.in_progress,
  "in-progress": CallStatus.in_progress,
  answer: CallStatus.in_progress,
  answered: CallStatus.in_progress,
  completed: CallStatus.completed,
  hangup: CallStatus.completed,
  busy: CallStatus.failed,
  failed: CallStatus.failed,
  no_answer: CallStatus.no_answer,
  "no-answer": CallStatus.no_answer,
  cancelled: CallStatus.failed,
  canceled: CallStatus.failed,
};

const telnyxToCallStatus: Record<string, CallStatus> = {
  initiated: CallStatus.ringing,
  answered: CallStatus.in_progress,
  bridged: CallStatus.in_progress,
  in_progress: CallStatus.in_progress,
  "call.initiated": CallStatus.ringing,
  "call.answered": CallStatus.in_progress,
  "call.bridged": CallStatus.in_progress,
  "call.hangup": CallStatus.completed,
  "call.ended": CallStatus.completed,
  "call.recording.saved": CallStatus.in_progress,
  completed: CallStatus.completed,
  hangup: CallStatus.completed,
  busy: CallStatus.failed,
  failed: CallStatus.failed,
  no_answer: CallStatus.no_answer,
};

export function mapProviderStatusToCallStatus(provider: VoiceProvider, status: string) {
  const normalized = status.trim().toLowerCase();

  if (provider === "plivo") {
    return plivoToCallStatus[normalized] ?? CallStatus.failed;
  }

  if (provider === "telnyx") {
    return telnyxToCallStatus[normalized] ?? CallStatus.failed;
  }

  return twilioToCallStatus[normalized] ?? CallStatus.failed;
}
