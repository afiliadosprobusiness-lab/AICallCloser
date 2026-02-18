import { CallStatus } from "@prisma/client";

import { env } from "@/lib/env";

export type VoiceProvider = "plivo" | "twilio";

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
    ""
  );
}

export function getFromNumber(params: Record<string, string>) {
  return params.From ?? params.from ?? params.FromNumber ?? params.from_number ?? "";
}

export function getToNumber(params: Record<string, string>) {
  return params.To ?? params.to ?? params.ToNumber ?? params.to_number ?? "";
}

export function getRecordingUrl(params: Record<string, string>) {
  return (
    params.RecordingUrl ??
    params.RecordingURL ??
    params.RecordUrl ??
    params.recording_url ??
    params.recordingUrl ??
    ""
  );
}

export function getProviderCallStatus(params: Record<string, string>) {
  return params.CallStatus ?? params.call_status ?? params.Event ?? params.event ?? "";
}

export function getCallDurationSeconds(params: Record<string, string>) {
  const raw =
    params.CallDuration ??
    params.call_duration ??
    params.Duration ??
    params.duration ??
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

export function mapProviderStatusToCallStatus(provider: VoiceProvider, status: string) {
  const normalized = status.trim().toLowerCase();
  const map = provider === "plivo" ? plivoToCallStatus : twilioToCallStatus;
  return map[normalized] ?? CallStatus.failed;
}
