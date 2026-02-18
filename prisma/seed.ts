import bcrypt from "bcryptjs";
import { PrismaClient, WorkspaceMemberRole } from "@prisma/client";
import { defaultCallPreferences } from "@/lib/call-objectives/config";
import { serializePreferences } from "@/modules/call-objectives/service";

const prisma = new PrismaClient();

const DEFAULT_EMAIL = "demo@aicallcloser.com";
const DEFAULT_PASSWORD = "Demo1234!";

async function main() {
  const passwordHash = await bcrypt.hash(DEFAULT_PASSWORD, 12);

  const user = await prisma.user.upsert({
    where: { email: DEFAULT_EMAIL },
    update: {
      passwordHash,
      name: "Demo Closer",
    },
    create: {
      email: DEFAULT_EMAIL,
      name: "Demo Closer",
      passwordHash,
    },
  });

  const workspace = await prisma.workspace.upsert({
    where: { slug: "demo-premium-closer" },
    update: {
      name: "Demo Premium Closer",
    },
    create: {
      name: "Demo Premium Closer",
      slug: "demo-premium-closer",
      ownerId: user.id,
    },
  });

  await prisma.workspaceMember.upsert({
    where: {
      workspaceId_userId: {
        workspaceId: workspace.id,
        userId: user.id,
      },
    },
    update: {
      role: WorkspaceMemberRole.owner,
    },
    create: {
      workspaceId: workspace.id,
      userId: user.id,
      role: WorkspaceMemberRole.owner,
    },
  });

  await prisma.user.update({
    where: { id: user.id },
    data: {
      activeWorkspaceId: workspace.id,
    },
  });

  await prisma.agentConfig.upsert({
    where: { workspaceId: workspace.id },
    update: {
      agentName: "Aurea Assistant",
    },
    create: {
      workspaceId: workspace.id,
      agentName: "Aurea Assistant",
      greetingMessage:
        "Hola, soy Aurea, asistente virtual del equipo. Voy a hacerte unas preguntas breves para ayudarte a agendar con un especialista.",
      systemPrompt:
        "Eres un closer assistant B2B. Habla corto y con seguridad. Objetivo: calificar lead, proponer agenda y escalar a humano si hay duda. Nunca inventes precios, descuentos ni condiciones no configuradas.",
      qualificationChecklist: [
        "Necesidad principal",
        "Presupuesto aproximado",
        "Urgencia",
        "Poder de decisión",
      ],
      pricingRules: {
        hardConstraint: "No inventar precios. Si no hay precio configurado, admitirlo y transferir.",
      },
      disallowedClaims: [
        "No afirmar garantía de resultados",
        "No prometer descuentos no autorizados",
        "No decir que eres humano",
      ],
      handoffEnabled: true,
      handoffPhone: "+15550001111",
      calendarLink: "https://cal.com/demo-premium-closer",
      voiceModel: "gpt-4o-mini-tts",
      ttsVoice: "alloy",
      sttModel: "gpt-4o-mini-transcribe",
      llmModel: "gpt-4.1-mini",
    },
  });

  await prisma.twilioPhoneNumber.upsert({
    where: { phoneNumber: "+15559990000" },
    update: {
      workspaceId: workspace.id,
      isActive: true,
      friendlyName: "Demo Inbound",
    },
    create: {
      workspaceId: workspace.id,
      phoneNumber: "+15559990000",
      friendlyName: "Demo Inbound",
      isActive: true,
    },
  });

  await prisma.agentCallPreferences.upsert({
    where: { workspaceId: workspace.id },
    update: serializePreferences(defaultCallPreferences),
    create: {
      workspaceId: workspace.id,
      ...serializePreferences(defaultCallPreferences),
    },
  });

  await prisma.businessProfile.upsert({
    where: { workspaceId: workspace.id },
    update: {
      valueProp: "Convert inbound calls into qualified opportunities in under 60 seconds.",
    },
    create: {
      workspaceId: workspace.id,
      valueProp: "Convert inbound calls into qualified opportunities in under 60 seconds.",
    },
  });

  console.log("Seed completed");
  console.log(`Demo user: ${DEFAULT_EMAIL}`);
  console.log(`Demo password: ${DEFAULT_PASSWORD}`);
  console.log(`Workspace: ${workspace.name}`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
