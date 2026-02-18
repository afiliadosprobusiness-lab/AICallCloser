import { NextResponse } from "next/server";
import { z } from "zod";

import { db } from "@/lib/db";
import { slugifyWorkspaceName } from "@/lib/slug";
import { getSessionOrThrow } from "@/lib/session";
import { getAdminEmails } from "@/lib/admin";

const payloadSchema = z.object({
  name: z.string().min(2).max(80),
  workspaceName: z.string().min(2).max(80),
});

export async function POST(request: Request) {
  try {
    const session = await getSessionOrThrow();
    const body = await request.json();
    const parsed = payloadSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ ok: false, error: parsed.error.flatten() }, { status: 400 });
    }

    const userId = session.user.id;

    const existingMembership = await db.workspaceMember.findFirst({
      where: { userId },
      select: { workspaceId: true },
    });

    if (existingMembership) {
      await db.user.update({
        where: { id: userId },
        data: { activeWorkspaceId: existingMembership.workspaceId },
      });

      return NextResponse.json({ ok: true, data: { workspaceId: existingMembership.workspaceId } });
    }

    const workspace = await db.$transaction(async (tx) => {
      const createdWorkspace = await tx.workspace.create({
        data: {
          name: parsed.data.workspaceName,
          slug: slugifyWorkspaceName(parsed.data.workspaceName),
          ownerId: userId,
        },
      });

      await tx.workspaceMember.create({
        data: {
          userId,
          workspaceId: createdWorkspace.id,
          role: "owner",
        },
      });

      const adminEmails = getAdminEmails();
      const adminUsers = await tx.user.findMany({
        where: { email: { in: adminEmails } },
        select: { id: true },
      });

      const adminMemberships = adminUsers
        .filter((admin) => admin.id !== userId)
        .map((admin) => ({
          userId: admin.id,
          workspaceId: createdWorkspace.id,
          role: "admin" as const,
        }));

      if (adminMemberships.length > 0) {
        await tx.workspaceMember.createMany({
          data: adminMemberships,
          skipDuplicates: true,
        });
      }

      await tx.user.update({
        where: { id: userId },
        data: {
          name: parsed.data.name,
          activeWorkspaceId: createdWorkspace.id,
        },
      });

      await tx.agentConfig.create({
        data: {
          workspaceId: createdWorkspace.id,
          agentName: "Aurea Assistant",
          greetingMessage:
            "Hola, soy Aurea, asistente virtual del equipo. Voy a hacerte unas preguntas cortas para ayudarte a agendar con un especialista.",
          systemPrompt:
            "Eres asistente de calificacion comercial. Habla corto y seguro. Prioridad: calificar, agendar o transferir a humano. Nunca inventes precios.",
          qualificationChecklist: ["Necesidad", "Presupuesto", "Urgencia", "Decisor"],
          pricingRules: {},
          disallowedClaims: [
            "No inventar precios",
            "No prometer garantias",
            "No afirmar que eres humano",
          ],
        },
      });

      return createdWorkspace;
    });

    return NextResponse.json({ ok: true, data: { workspaceId: workspace.id } }, { status: 201 });
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHORIZED") {
      return NextResponse.json({ ok: false, error: { message: "Unauthorized" } }, { status: 401 });
    }

    if (error instanceof Error && error.message === "ACCOUNT_DISABLED") {
      return NextResponse.json({ ok: false, error: { message: "Account disabled" } }, { status: 403 });
    }

    return NextResponse.json(
      { ok: false, error: { message: "No se pudo preparar el workspace." } },
      { status: 500 },
    );
  }
}
