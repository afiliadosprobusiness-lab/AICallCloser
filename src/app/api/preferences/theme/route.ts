import { NextResponse } from "next/server";
import { z } from "zod";

import { defaultTheme, normalizeTheme, themeCookieName, themeValues } from "@/lib/theme/config";

const payloadSchema = z.object({
  theme: z.enum(themeValues).optional(),
});

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  const parsed = payloadSchema.safeParse(body);

  const theme = normalizeTheme(parsed.success ? parsed.data.theme : defaultTheme);

  const response = NextResponse.json({ ok: true, data: { theme } });
  response.cookies.set(themeCookieName, theme, {
    path: "/",
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: 60 * 60 * 24 * 365,
  });

  return response;
}
