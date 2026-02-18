import { NextResponse } from "next/server";
import { z } from "zod";

import { defaultLocale, localeCookieName, localeValues, normalizeLocale } from "@/lib/i18n/config";

const payloadSchema = z.object({
  locale: z.enum(localeValues).optional(),
});

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  const parsed = payloadSchema.safeParse(body);

  const locale = normalizeLocale(parsed.success ? parsed.data.locale : defaultLocale);

  const response = NextResponse.json({ ok: true, data: { locale } });
  response.cookies.set(localeCookieName, locale, {
    path: "/",
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: 60 * 60 * 24 * 365,
  });

  return response;
}
