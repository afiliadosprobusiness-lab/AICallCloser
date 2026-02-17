import bcrypt from "bcryptjs";
import { NextResponse } from "next/server";
import { z } from "zod";

import { db } from "@/lib/db";
import { logger } from "@/lib/logger";
import { slugifyWorkspaceName } from "@/lib/slug";

const registerSchema = z.object({
  name: z.string().min(2).max(80),
  email: z.string().email(),
  password: z.string().min(8).max(64),
  workspaceName: z.string().min(2).max(80),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = registerSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        {
          ok: false,
          error: parsed.error.flatten(),
        },
        { status: 400 },
      );
    }

    const email = parsed.data.email.toLowerCase();

    const existingUser = await db.user.findUnique({ where: { email } });

    if (existingUser) {
      return NextResponse.json(
        {
          ok: false,
          error: { message: "El email ya existe" },
        },
        { status: 409 },
      );
    }

    const passwordHash = await bcrypt.hash(parsed.data.password, 12);

    const result = await db.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          name: parsed.data.name,
          email,
          passwordHash,
        },
      });

      const workspace = await tx.workspace.create({
        data: {
          name: parsed.data.workspaceName,
          slug: slugifyWorkspaceName(parsed.data.workspaceName),
          ownerId: user.id,
        },
      });

      await tx.workspaceMember.create({
        data: {
          workspaceId: workspace.id,
          userId: user.id,
          role: "owner",
        },
      });

      await tx.user.update({
        where: { id: user.id },
        data: {
          activeWorkspaceId: workspace.id,
        },
      });

      await tx.agentConfig.create({
        data: {
          workspaceId: workspace.id,
          agentName: "Aurea Assistant",
          greetingMessage:
            "Hola, soy Aurea, asistente virtual del equipo. Voy a hacerte unas preguntas cortas para ayudarte a agendar con un especialista.",
          systemPrompt:
            "Eres asistente de calificacion comercial. Habla corto y seguro. Prioridad: calificar, agendar o transferir a humano. Nunca inventes precios.",
          qualificationChecklist: [
            "Necesidad",
            "Presupuesto",
            "Urgencia",
            "Decisor",
          ],
          pricingRules: {},
          disallowedClaims: [
            "No inventar precios",
            "No prometer garantias",
            "No afirmar que eres humano",
          ],
        },
      });

      return { userId: user.id, workspaceId: workspace.id };
    });

    return NextResponse.json({ ok: true, data: result }, { status: 201 });
  } catch (error) {
    logger.error({ error }, "Failed to register user");
    return NextResponse.json(
      {
        ok: false,
        error: { message: "No se pudo crear la cuenta" },
      },
      { status: 500 },
    );
  }
}
