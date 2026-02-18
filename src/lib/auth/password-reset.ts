import { createHash, randomBytes } from "node:crypto";

import { env } from "@/lib/env";
import { logger } from "@/lib/logger";

export function createPasswordResetToken() {
  const rawToken = randomBytes(32).toString("hex");
  const tokenHash = hashResetToken(rawToken);

  return {
    rawToken,
    tokenHash,
    expiresAt: new Date(Date.now() + 1000 * 60 * 30),
  };
}

export function hashResetToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

export async function sendPasswordResetEmail(params: {
  to: string;
  resetUrl: string;
}) {
  if (!env.RESEND_API_KEY || !env.RESEND_FROM_EMAIL) {
    return { delivered: false as const, reason: "resend_not_configured" as const };
  }

  try {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${env.RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: env.RESEND_FROM_EMAIL,
        to: [params.to],
        subject: "Recuperar contraseña - AI Call Closer",
        html: `<div style=\"font-family:Arial,sans-serif;color:#111\">\n          <h2>Recuperación de contraseña</h2>\n          <p>Haz clic en el botón para definir una nueva contraseña.</p>\n          <p><a href=\"${params.resetUrl}\" style=\"display:inline-block;padding:10px 16px;border-radius:10px;background:#3d7bff;color:#fff;text-decoration:none\">Restablecer contraseña</a></p>\n          <p>Este enlace expira en 30 minutos.</p>\n        </div>`,
      }),
    });

    if (!response.ok) {
      logger.error({ status: response.status }, "Failed to send password reset email");
      return { delivered: false as const, reason: "delivery_failed" as const };
    }

    return { delivered: true as const };
  } catch (error) {
    logger.error({ error }, "Password reset email request failed");
    return { delivered: false as const, reason: "delivery_failed" as const };
  }
}
