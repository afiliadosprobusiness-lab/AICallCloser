export const localeValues = ["es", "en"] as const;

export type Locale = (typeof localeValues)[number];

export const defaultLocale: Locale = "en";
export const localeCookieName = "aicallcloser_locale";

export function normalizeLocale(value: string | null | undefined): Locale {
  if (!value) {
    return defaultLocale;
  }

  const normalized = value.trim().toLowerCase();
  return normalized === "es" ? "es" : "en";
}

export function translate(locale: Locale, esText: string, enText: string) {
  return locale === "en" ? enText : esText;
}
