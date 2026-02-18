import { env } from "@/lib/env";

const DEFAULT_ADMIN_EMAIL = "afiliadosprobusiness@gmail.com";

export function getAdminEmails() {
  const configuredEmails = env.ADMIN_EMAILS
    ? env.ADMIN_EMAILS.split(",")
        .map((value) => value.trim().toLowerCase())
        .filter(Boolean)
    : [];

  if (configuredEmails.length > 0) {
    return configuredEmails;
  }

  return [DEFAULT_ADMIN_EMAIL];
}
