import plivo from "plivo";

export function buildPromptAndRecordPlivoXml(params: {
  promptAudioUrl?: string;
  promptText: string;
  actionUrl: string;
  maxLengthSeconds?: number;
}) {
  const response = plivo.Response();

  if (params.promptAudioUrl) {
    response.addPlay(params.promptAudioUrl);
  } else {
    response.addSpeak(params.promptText, { language: "es-ES" });
  }

  response.addRecord({
    action: params.actionUrl,
    method: "POST",
    playBeep: true,
    maxLength: params.maxLengthSeconds ?? 20,
    timeout: 2,
    fileFormat: "wav",
  });

  response.addRedirect(`${params.actionUrl}&noinput=1`, { method: "POST" });

  return response.toXML();
}

export function buildGoodbyePlivoXml(params: {
  finalAudioUrl?: string;
  finalText: string;
}) {
  const response = plivo.Response();

  if (params.finalAudioUrl) {
    response.addPlay(params.finalAudioUrl);
  } else {
    response.addSpeak(params.finalText, { language: "es-ES" });
  }

  response.addHangup({});

  return response.toXML();
}

export function buildHandoffPlivoXml(params: {
  handoffAudioUrl?: string;
  handoffText: string;
  targetPhone: string;
}) {
  const response = plivo.Response();

  if (params.handoffAudioUrl) {
    response.addPlay(params.handoffAudioUrl);
  } else {
    response.addSpeak(params.handoffText, { language: "es-ES" });
  }

  const dial = response.addDial({});
  dial.addNumber(params.targetPhone);

  return response.toXML();
}
