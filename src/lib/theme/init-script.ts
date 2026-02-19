import { defaultTheme, themeCookieName, themeStorageKey } from "@/lib/theme/config";

export function getThemeInitScript() {
  return `
  (function () {
    try {
      var storageKey = "${themeStorageKey}";
      var cookieName = "${themeCookieName}";
      var fromStorage = localStorage.getItem(storageKey);
      var fromCookie = document.cookie
        .split('; ')
        .find(function (part) { return part.indexOf(cookieName + '=') === 0; });
      var cookieTheme = fromCookie ? fromCookie.split('=').slice(1).join('=') : "";
      var nextTheme = fromStorage || cookieTheme || "${defaultTheme}";
      if (nextTheme !== "light" && nextTheme !== "dark") {
        nextTheme = "${defaultTheme}";
      }
      var root = document.documentElement;
      root.classList.remove("dark", "light");
      root.classList.add(nextTheme);
      root.setAttribute("data-theme", nextTheme);
      root.style.colorScheme = nextTheme;
    } catch (error) {
      var fallbackRoot = document.documentElement;
      fallbackRoot.classList.remove("dark", "light");
      fallbackRoot.classList.add("${defaultTheme}");
      fallbackRoot.setAttribute("data-theme", "${defaultTheme}");
      fallbackRoot.style.colorScheme = "${defaultTheme}";
    }
  })();
  `;
}
