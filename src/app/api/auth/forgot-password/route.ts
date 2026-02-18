import { NextResponse } from "next/server";
import { z } from "zod";

import { db } from "@/lib/db";
import { env } from "@/lib/env";
import {
  createPasswordResetToken,
  sendPasswordResetEmail,
} from "@/lib/auth/password-reset";
import { ensureFirebasePasswordUser, sendFirebasePasswordResetEmail } from "@/lib/firebase/password";

const payloadSchema = z.object({
  email: z.string().email(),
});

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const parsed = payloadSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ ok: false, error: parsed.error.flatten() }, { status: 400 });
  }

  const email = parsed.data.email.toLowerCase();
  const user = await db.user.findUnique({ where: { email } });

  if (!user?.passwordHash) {
    return NextResponse.json({ ok: true, data: { delivered: true } });
  }

  let delivery:
    | { delivered: true }
    | { delivered: false; reason?: string };

  if (env.RESEND_API_KEY && env.RESEND_FROM_EMAIL) {
    const token = createPasswordResetToken();

    await db.passwordResetToken.create({
      data: {
        userId: user.id,
        tokenHash: token.tokenHash,
        expiresAt: token.expiresAt,
      },
    });

    const resetUrl = `${env.APP_URL}/reset-password?token=${encodeURIComponent(token.rawToken)}`;
    delivery = await sendPasswordResetEmail({ to: user.email, resetUrl });
  } else {
    await ensureFirebasePasswordUser({
      email: user.email,
      displayName: user.name,
    });

    delivery = await sendFirebasePasswordResetEmail(user.email);
  }

  return NextResponse.json({
    ok: true,
    data: {
      delivered: delivery.delivered,
      message: delivery.delivered
        ? "Te enviamos un enlace para restablecer tu contraseña."
        : "No se pudo enviar email automático. Configura RESEND_API_KEY/RESEND_FROM_EMAIL o FIREBASE_WEB_API_KEY.",
    },
  });
}
