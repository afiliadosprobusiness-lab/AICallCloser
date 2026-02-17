import { db } from "@/lib/db";

export async function resolveWorkspaceByTwilioNumber(phoneNumber: string) {
  return db.twilioPhoneNumber.findFirst({
    where: {
      phoneNumber,
      isActive: true,
    },
    select: {
      workspaceId: true,
    },
  });
}

export async function getWorkspaceSummary(workspaceId: string) {
  return db.workspace.findUnique({
    where: { id: workspaceId },
    select: {
      id: true,
      name: true,
      slug: true,
      agentConfig: {
        select: {
          agentName: true,
          greetingMessage: true,
          handoffEnabled: true,
          handoffPhone: true,
          calendarLink: true,
          llmModel: true,
          sttModel: true,
          voiceModel: true,
          ttsVoice: true,
          systemPrompt: true,
          qualificationChecklist: true,
          pricingRules: true,
          disallowedClaims: true,
        },
      },
    },
  });
}
