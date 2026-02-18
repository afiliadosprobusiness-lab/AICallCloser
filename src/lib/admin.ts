import { env } from "@/lib/env";

const DEFAULT_SUPER_ADMIN_EMAIL = "afiliadosprobusiness@gmail.com";
const DEFAULT_ADMIN_EMAIL = DEFAULT_SUPER_ADMIN_EMAIL;

export function getSuperAdminEmail() {
  return DEFAULT_SUPER_ADMIN_EMAIL;
}

export function isSuperAdminEmail(email: string | null | undefined) {
  if (!email) {
    return false;
  }

  return email.trim().toLowerCase() === getSuperAdminEmail();
}

export function getAdminEmails() {
  const configuredEmails = env.ADMIN_EMAILS
    ? env.ADMIN_EMAILS.split(",")
        .map((value) => value.trim().toLowerCase())
        .filter(Boolean)
    : [];

  if (configuredEmails.length > 0) {
    return Array.from(new Set([getSuperAdminEmail(), ...configuredEmails]));
  }

  return [DEFAULT_ADMIN_EMAIL];
}
