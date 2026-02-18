import {
  buildGoodbyePlivoXml,
  buildHandoffPlivoXml,
  buildPromptAndRecordPlivoXml,
} from "@/lib/plivo/xml";
import {
  buildGoodbyeTwiml,
  buildHandoffTwiml,
  buildPromptAndRecordTwiml,
} from "@/lib/twilio/twiml";
import { type VoiceProvider } from "@/lib/voice/provider";

export function buildPromptAndRecordVoiceXml(
  provider: VoiceProvider,
  params: {
    promptAudioUrl?: string;
    promptText: string;
    actionUrl: string;
    maxLengthSeconds?: number;
  },
) {
  if (provider === "plivo") {
    return buildPromptAndRecordPlivoXml(params);
  }

  if (provider === "telnyx") {
    return buildPromptAndRecordTwiml(params);
  }

  return buildPromptAndRecordTwiml(params);
}

export function buildGoodbyeVoiceXml(
  provider: VoiceProvider,
  params: {
    finalAudioUrl?: string;
    finalText: string;
  },
) {
  if (provider === "plivo") {
    return buildGoodbyePlivoXml(params);
  }

  if (provider === "telnyx") {
    return buildGoodbyeTwiml(params);
  }

  return buildGoodbyeTwiml(params);
}

export function buildHandoffVoiceXml(
  provider: VoiceProvider,
  params: {
    handoffAudioUrl?: string;
    handoffText: string;
    targetPhone: string;
  },
) {
  if (provider === "plivo") {
    return buildHandoffPlivoXml(params);
  }

  if (provider === "telnyx") {
    return buildHandoffTwiml(params);
  }

  return buildHandoffTwiml(params);
}
