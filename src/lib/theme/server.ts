import { cookies } from "next/headers";

import { normalizeTheme, themeCookieName } from "@/lib/theme/config";

export async function getRequestTheme() {
  const cookieStore = await cookies();
  return normalizeTheme(cookieStore.get(themeCookieName)?.value);
}
