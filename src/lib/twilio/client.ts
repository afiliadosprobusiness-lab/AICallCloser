import Twilio from "twilio";

import { env } from "@/lib/env";

const globalForTwilio = globalThis as unknown as {
  twilioClient?: Twilio.Twilio;
};

export function getTwilioClient() {
  if (!env.TWILIO_ACCOUNT_SID || !env.TWILIO_AUTH_TOKEN) {
    return null;
  }

  if (globalForTwilio.twilioClient) {
    return globalForTwilio.twilioClient;
  }

  globalForTwilio.twilioClient = Twilio(env.TWILIO_ACCOUNT_SID, env.TWILIO_AUTH_TOKEN);

  return globalForTwilio.twilioClient;
}
