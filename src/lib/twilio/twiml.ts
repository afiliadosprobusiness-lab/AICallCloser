import { twiml } from "twilio";

export function buildPromptAndRecordTwiml(params: {
  promptAudioUrl?: string;
  promptText: string;
  actionUrl: string;
  maxLengthSeconds?: number;
}) {
  const voice = new twiml.VoiceResponse();

  if (params.promptAudioUrl) {
    voice.play(params.promptAudioUrl);
  } else {
    voice.say({ voice: "Polly.Conchita" }, params.promptText);
  }

  voice.record({
    action: params.actionUrl,
    method: "POST",
    playBeep: true,
    maxLength: params.maxLengthSeconds ?? 20,
    trim: "trim-silence",
    timeout: 2,
  });

  voice.redirect({ method: "POST" }, `${params.actionUrl}&noinput=1`);

  return voice.toString();
}

export function buildGoodbyeTwiml(params: {
  finalAudioUrl?: string;
  finalText: string;
}) {
  const voice = new twiml.VoiceResponse();

  if (params.finalAudioUrl) {
    voice.play(params.finalAudioUrl);
  } else {
    voice.say({ voice: "Polly.Conchita" }, params.finalText);
  }

  voice.hangup();

  return voice.toString();
}

export function buildHandoffTwiml(params: {
  handoffAudioUrl?: string;
  handoffText: string;
  targetPhone: string;
}) {
  const voice = new twiml.VoiceResponse();

  if (params.handoffAudioUrl) {
    voice.play(params.handoffAudioUrl);
  } else {
    voice.say({ voice: "Polly.Conchita" }, params.handoffText);
  }

  voice.dial(params.targetPhone);

  return voice.toString();
}
