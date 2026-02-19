export const themeValues = ["dark", "light"] as const;

export type Theme = (typeof themeValues)[number];

export const defaultTheme: Theme = "dark";
export const themeCookieName = "aicallcloser_theme";
export const themeStorageKey = "aicallcloser_theme";

export function normalizeTheme(value: string | null | undefined): Theme {
  if (!value) {
    return defaultTheme;
  }

  const normalized = value.trim().toLowerCase();
  return normalized === "light" ? "light" : "dark";
}
