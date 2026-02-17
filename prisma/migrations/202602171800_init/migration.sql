-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "public"."WorkspaceMemberRole" AS ENUM ('owner', 'admin', 'member');

-- CreateEnum
CREATE TYPE "public"."LeadStatus" AS ENUM ('new', 'qualified', 'unqualified', 'scheduled', 'handed_off', 'won', 'lost');

-- CreateEnum
CREATE TYPE "public"."CallStatus" AS ENUM ('ringing', 'in_progress', 'completed', 'failed', 'no_answer');

-- CreateEnum
CREATE TYPE "public"."CallOutcome" AS ENUM ('unknown', 'qualified', 'scheduled', 'handoff', 'not_qualified', 'follow_up');

-- CreateEnum
CREATE TYPE "public"."TranscriptSpeaker" AS ENUM ('user', 'assistant', 'system');

-- CreateEnum
CREATE TYPE "public"."HandoffReason" AS ENUM ('uncertainty', 'objection', 'high_intent', 'requested_human', 'technical');

-- CreateEnum
CREATE TYPE "public"."HandoffStatus" AS ENUM ('requested', 'completed', 'failed');

-- CreateTable
CREATE TABLE "public"."User" (
    "id" TEXT NOT NULL,
    "name" TEXT,
    "email" TEXT NOT NULL,
    "emailVerified" TIMESTAMP(3),
    "image" TEXT,
    "passwordHash" TEXT,
    "activeWorkspaceId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Workspace" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "ownerId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Workspace_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."WorkspaceMember" (
    "id" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "role" "public"."WorkspaceMemberRole" NOT NULL DEFAULT 'member',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WorkspaceMember_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."TwilioPhoneNumber" (
    "id" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "phoneNumber" TEXT NOT NULL,
    "friendlyName" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TwilioPhoneNumber_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."AgentConfig" (
    "id" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "agentName" TEXT NOT NULL DEFAULT 'AI Call Closer',
    "systemPrompt" TEXT NOT NULL,
    "greetingMessage" TEXT NOT NULL,
    "qualificationChecklist" JSONB NOT NULL,
    "pricingRules" JSONB NOT NULL,
    "disallowedClaims" JSONB NOT NULL,
    "handoffEnabled" BOOLEAN NOT NULL DEFAULT true,
    "handoffPhone" TEXT,
    "calendarLink" TEXT,
    "voiceModel" TEXT NOT NULL DEFAULT 'gpt-4o-mini-tts',
    "ttsVoice" TEXT NOT NULL DEFAULT 'alloy',
    "sttModel" TEXT NOT NULL DEFAULT 'gpt-4o-mini-transcribe',
    "llmModel" TEXT NOT NULL DEFAULT 'gpt-4.1-mini',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AgentConfig_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Lead" (
    "id" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "fullName" TEXT,
    "email" TEXT,
    "phone" TEXT,
    "company" TEXT,
    "notes" TEXT,
    "score" INTEGER NOT NULL DEFAULT 0,
    "status" "public"."LeadStatus" NOT NULL DEFAULT 'new',
    "source" TEXT NOT NULL DEFAULT 'inbound_call',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Lead_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Call" (
    "id" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "leadId" TEXT,
    "twilioCallSid" TEXT NOT NULL,
    "fromNumber" TEXT NOT NULL,
    "toNumber" TEXT NOT NULL,
    "status" "public"."CallStatus" NOT NULL DEFAULT 'ringing',
    "outcome" "public"."CallOutcome" NOT NULL DEFAULT 'unknown',
    "durationSeconds" INTEGER,
    "summary" TEXT,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "endedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Call_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."TranscriptTurn" (
    "id" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "callId" TEXT NOT NULL,
    "speaker" "public"."TranscriptSpeaker" NOT NULL,
    "text" TEXT NOT NULL,
    "metadata" JSONB,
    "spokenAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TranscriptTurn_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Appointment" (
    "id" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "leadId" TEXT NOT NULL,
    "callId" TEXT,
    "startsAt" TIMESTAMP(3) NOT NULL,
    "timezone" TEXT NOT NULL DEFAULT 'America/New_York',
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Appointment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Handoff" (
    "id" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "leadId" TEXT NOT NULL,
    "callId" TEXT NOT NULL,
    "reason" "public"."HandoffReason" NOT NULL,
    "status" "public"."HandoffStatus" NOT NULL DEFAULT 'requested',
    "targetPhone" TEXT NOT NULL,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Handoff_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."MetricDaily" (
    "id" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "inboundCalls" INTEGER NOT NULL DEFAULT 0,
    "qualifiedLeads" INTEGER NOT NULL DEFAULT 0,
    "scheduledCalls" INTEGER NOT NULL DEFAULT 0,
    "handoffs" INTEGER NOT NULL DEFAULT 0,
    "closeRatePercent" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MetricDaily_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Account" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "providerAccountId" TEXT NOT NULL,
    "refresh_token" TEXT,
    "access_token" TEXT,
    "expires_at" INTEGER,
    "token_type" TEXT,
    "scope" TEXT,
    "id_token" TEXT,
    "session_state" TEXT,

    CONSTRAINT "Account_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Session" (
    "id" TEXT NOT NULL,
    "sessionToken" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Session_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."VerificationToken" (
    "identifier" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "public"."User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Workspace_slug_key" ON "public"."Workspace"("slug");

-- CreateIndex
CREATE INDEX "Workspace_ownerId_idx" ON "public"."Workspace"("ownerId");

-- CreateIndex
CREATE INDEX "WorkspaceMember_userId_idx" ON "public"."WorkspaceMember"("userId");

-- CreateIndex
CREATE INDEX "WorkspaceMember_workspaceId_role_idx" ON "public"."WorkspaceMember"("workspaceId", "role");

-- CreateIndex
CREATE UNIQUE INDEX "WorkspaceMember_workspaceId_userId_key" ON "public"."WorkspaceMember"("workspaceId", "userId");

-- CreateIndex
CREATE UNIQUE INDEX "TwilioPhoneNumber_phoneNumber_key" ON "public"."TwilioPhoneNumber"("phoneNumber");

-- CreateIndex
CREATE INDEX "TwilioPhoneNumber_workspaceId_isActive_idx" ON "public"."TwilioPhoneNumber"("workspaceId", "isActive");

-- CreateIndex
CREATE UNIQUE INDEX "AgentConfig_workspaceId_key" ON "public"."AgentConfig"("workspaceId");

-- CreateIndex
CREATE INDEX "Lead_workspaceId_createdAt_idx" ON "public"."Lead"("workspaceId", "createdAt");

-- CreateIndex
CREATE INDEX "Lead_workspaceId_status_idx" ON "public"."Lead"("workspaceId", "status");

-- CreateIndex
CREATE INDEX "Lead_workspaceId_phone_idx" ON "public"."Lead"("workspaceId", "phone");

-- CreateIndex
CREATE UNIQUE INDEX "Lead_workspaceId_phone_key" ON "public"."Lead"("workspaceId", "phone");

-- CreateIndex
CREATE UNIQUE INDEX "Call_twilioCallSid_key" ON "public"."Call"("twilioCallSid");

-- CreateIndex
CREATE INDEX "Call_workspaceId_startedAt_idx" ON "public"."Call"("workspaceId", "startedAt");

-- CreateIndex
CREATE INDEX "Call_workspaceId_status_idx" ON "public"."Call"("workspaceId", "status");

-- CreateIndex
CREATE INDEX "Call_workspaceId_outcome_idx" ON "public"."Call"("workspaceId", "outcome");

-- CreateIndex
CREATE INDEX "TranscriptTurn_workspaceId_spokenAt_idx" ON "public"."TranscriptTurn"("workspaceId", "spokenAt");

-- CreateIndex
CREATE INDEX "TranscriptTurn_callId_spokenAt_idx" ON "public"."TranscriptTurn"("callId", "spokenAt");

-- CreateIndex
CREATE UNIQUE INDEX "Appointment_callId_key" ON "public"."Appointment"("callId");

-- CreateIndex
CREATE INDEX "Appointment_workspaceId_startsAt_idx" ON "public"."Appointment"("workspaceId", "startsAt");

-- CreateIndex
CREATE INDEX "Appointment_leadId_startsAt_idx" ON "public"."Appointment"("leadId", "startsAt");

-- CreateIndex
CREATE UNIQUE INDEX "Handoff_callId_key" ON "public"."Handoff"("callId");

-- CreateIndex
CREATE INDEX "Handoff_workspaceId_createdAt_idx" ON "public"."Handoff"("workspaceId", "createdAt");

-- CreateIndex
CREATE INDEX "Handoff_workspaceId_status_idx" ON "public"."Handoff"("workspaceId", "status");

-- CreateIndex
CREATE INDEX "MetricDaily_workspaceId_date_idx" ON "public"."MetricDaily"("workspaceId", "date");

-- CreateIndex
CREATE UNIQUE INDEX "MetricDaily_workspaceId_date_key" ON "public"."MetricDaily"("workspaceId", "date");

-- CreateIndex
CREATE INDEX "Account_userId_idx" ON "public"."Account"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "Account_provider_providerAccountId_key" ON "public"."Account"("provider", "providerAccountId");

-- CreateIndex
CREATE UNIQUE INDEX "Session_sessionToken_key" ON "public"."Session"("sessionToken");

-- CreateIndex
CREATE INDEX "Session_userId_idx" ON "public"."Session"("userId");

-- CreateIndex
CREATE INDEX "VerificationToken_expires_idx" ON "public"."VerificationToken"("expires");

-- CreateIndex
CREATE UNIQUE INDEX "VerificationToken_identifier_token_key" ON "public"."VerificationToken"("identifier", "token");

-- AddForeignKey
ALTER TABLE "public"."User" ADD CONSTRAINT "User_activeWorkspaceId_fkey" FOREIGN KEY ("activeWorkspaceId") REFERENCES "public"."Workspace"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Workspace" ADD CONSTRAINT "Workspace_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "public"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."WorkspaceMember" ADD CONSTRAINT "WorkspaceMember_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "public"."Workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."WorkspaceMember" ADD CONSTRAINT "WorkspaceMember_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."TwilioPhoneNumber" ADD CONSTRAINT "TwilioPhoneNumber_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "public"."Workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."AgentConfig" ADD CONSTRAINT "AgentConfig_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "public"."Workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Lead" ADD CONSTRAINT "Lead_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "public"."Workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Call" ADD CONSTRAINT "Call_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "public"."Workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Call" ADD CONSTRAINT "Call_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES "public"."Lead"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."TranscriptTurn" ADD CONSTRAINT "TranscriptTurn_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "public"."Workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."TranscriptTurn" ADD CONSTRAINT "TranscriptTurn_callId_fkey" FOREIGN KEY ("callId") REFERENCES "public"."Call"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Appointment" ADD CONSTRAINT "Appointment_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "public"."Workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Appointment" ADD CONSTRAINT "Appointment_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES "public"."Lead"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Appointment" ADD CONSTRAINT "Appointment_callId_fkey" FOREIGN KEY ("callId") REFERENCES "public"."Call"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Handoff" ADD CONSTRAINT "Handoff_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "public"."Workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Handoff" ADD CONSTRAINT "Handoff_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES "public"."Lead"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Handoff" ADD CONSTRAINT "Handoff_callId_fkey" FOREIGN KEY ("callId") REFERENCES "public"."Call"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."MetricDaily" ADD CONSTRAINT "MetricDaily_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "public"."Workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Account" ADD CONSTRAINT "Account_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Session" ADD CONSTRAINT "Session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

