import bcrypt from "bcryptjs";
import { NextResponse } from "next/server";
import { z } from "zod";

import { hashResetToken } from "@/lib/auth/password-reset";
import { db } from "@/lib/db";

const payloadSchema = z
  .object({
    token: z.string().min(12),
    password: z.string().min(8).max(64),
    confirmPassword: z.string().min(8).max(64),
  })
  .refine((value) => value.password === value.confirmPassword, {
    message: "Las contraseñas no coinciden",
    path: ["confirmPassword"],
  });

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const parsed = payloadSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ ok: false, error: parsed.error.flatten() }, { status: 400 });
  }

  const tokenHash = hashResetToken(parsed.data.token);

  const resetToken = await db.passwordResetToken.findUnique({
    where: { tokenHash },
    include: { user: true },
  });

  if (!resetToken || resetToken.usedAt || resetToken.expiresAt < new Date()) {
    return NextResponse.json(
      { ok: false, error: { message: "El enlace es inválido o expiró." } },
      { status: 400 },
    );
  }

  const passwordHash = await bcrypt.hash(parsed.data.password, 12);

  await db.$transaction(async (tx) => {
    await tx.user.update({
      where: { id: resetToken.userId },
      data: { passwordHash },
    });

    await tx.passwordResetToken.update({
      where: { id: resetToken.id },
      data: { usedAt: new Date() },
    });

    await tx.session.deleteMany({
      where: { userId: resetToken.userId },
    });
  });

  return NextResponse.json({ ok: true, data: { message: "Contraseña actualizada." } });
}
