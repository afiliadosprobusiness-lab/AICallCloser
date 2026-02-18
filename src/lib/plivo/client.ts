import plivo from "plivo";

import { env } from "@/lib/env";

const globalForPlivo = globalThis as unknown as {
  plivoClient?: plivo.Client;
};

export function getPlivoClient() {
  if (!env.PLIVO_AUTH_ID || !env.PLIVO_AUTH_TOKEN) {
    return null;
  }

  if (globalForPlivo.plivoClient) {
    return globalForPlivo.plivoClient;
  }

  globalForPlivo.plivoClient = new plivo.Client(env.PLIVO_AUTH_ID, env.PLIVO_AUTH_TOKEN);

  return globalForPlivo.plivoClient;
}
