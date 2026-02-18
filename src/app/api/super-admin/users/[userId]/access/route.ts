import { UserAccessStatus } from "@prisma/client";
import { NextResponse } from "next/server";
import { z } from "zod";

import { isSuperAdminEmail } from "@/lib/admin";
import { db } from "@/lib/db";
import { getSuperAdminSessionOrThrow } from "@/lib/session";
import { updateUserAccessStatus } from "@/modules/super-admin/service";

const payloadSchema = z.object({
  status: z.nativeEnum(UserAccessStatus),
  reason: z.string().max(250).optional(),
  disabledHours: z.number().int().min(1).max(24 * 30).optional(),
});

type RouteParams = {
  params: Promise<{
    userId: string;
  }>;
};

export async function PATCH(request: Request, { params }: RouteParams) {
  try {
    await getSuperAdminSessionOrThrow();
    const { userId } = await params;

    const body = await request.json().catch(() => null);
    const parsed = payloadSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ ok: false, error: parsed.error.flatten() }, { status: 400 });
    }

    const targetUser = await db.user.findUnique({
      where: { id: userId },
      select: { id: true, email: true },
    });

    if (!targetUser) {
      return NextResponse.json(
        { ok: false, error: { message: "Usuario no encontrado." } },
        { status: 404 },
      );
    }

    if (isSuperAdminEmail(targetUser.email)) {
      return NextResponse.json(
        {
          ok: false,
          error: { message: "No puedes cambiar el estado del super administrador." },
        },
        { status: 400 },
      );
    }

    const updatedUser = await updateUserAccessStatus({
      userId,
      status: parsed.data.status,
      reason: parsed.data.reason,
      disabledHours: parsed.data.disabledHours,
    });

    return NextResponse.json({ ok: true, data: updatedUser });
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHORIZED") {
      return NextResponse.json({ ok: false, error: { message: "Unauthorized" } }, { status: 401 });
    }

    if (error instanceof Error && error.message === "FORBIDDEN") {
      return NextResponse.json({ ok: false, error: { message: "Forbidden" } }, { status: 403 });
    }

    if (error instanceof Error && error.message === "ACCOUNT_DISABLED") {
      return NextResponse.json({ ok: false, error: { message: "Account disabled" } }, { status: 403 });
    }

    return NextResponse.json(
      { ok: false, error: { message: "No se pudo actualizar el estado del usuario." } },
      { status: 500 },
    );
  }
}
