-- Add new CallOutcome values
ALTER TYPE "CallOutcome" ADD VALUE IF NOT EXISTS 'sold';
ALTER TYPE "CallOutcome" ADD VALUE IF NOT EXISTS 'booked_meeting';
ALTER TYPE "CallOutcome" ADD VALUE IF NOT EXISTS 'booked_google_meet';
ALTER TYPE "CallOutcome" ADD VALUE IF NOT EXISTS 'followup_scheduled';
ALTER TYPE "CallOutcome" ADD VALUE IF NOT EXISTS 'info_collected';
ALTER TYPE "CallOutcome" ADD VALUE IF NOT EXISTS 'transferred';
ALTER TYPE "CallOutcome" ADD VALUE IF NOT EXISTS 'not_interested';
ALTER TYPE "CallOutcome" ADD VALUE IF NOT EXISTS 'disqualified';

-- New enums for call objective engine
CREATE TYPE "CallObjective" AS ENUM (
  'sell_product',
  'book_in_person_meeting',
  'book_google_meet',
  'book_calcom_appointment',
  'schedule_followup_call',
  'collect_lead_info',
  'qualify_only',
  'transfer_to_human',
  'send_summary'
);

CREATE TYPE "AgentLanguage" AS ENUM ('en', 'es');
CREATE TYPE "MeetingType" AS ENUM ('in_person', 'google_meet', 'phone_call');
CREATE TYPE "CalendarProvider" AS ENUM ('calcom', 'google', 'manual');

-- Extend existing entities
ALTER TABLE "Lead" ADD COLUMN "customFields" JSONB;
ALTER TABLE "Call" ADD COLUMN "objectiveApplied" "CallObjective";

ALTER TABLE "Appointment"
  ADD COLUMN "meetingType" "MeetingType" NOT NULL DEFAULT 'phone_call',
  ADD COLUMN "calendarProvider" "CalendarProvider" NOT NULL DEFAULT 'manual',
  ADD COLUMN "meetingUrl" TEXT,
  ADD COLUMN "locationText" TEXT,
  ADD COLUMN "bookingIntent" JSONB;

-- Call preferences per workspace
CREATE TABLE "AgentCallPreferences" (
  "id" TEXT NOT NULL,
  "workspaceId" TEXT NOT NULL,
  "primaryObjective" "CallObjective" NOT NULL DEFAULT 'qualify_only',
  "secondaryObjectives" "CallObjective"[] NOT NULL DEFAULT ARRAY[]::"CallObjective"[],
  "language" "AgentLanguage" NOT NULL DEFAULT 'en',
  "meetingType" "MeetingType" NOT NULL DEFAULT 'phone_call',
  "durationMinutes" INTEGER NOT NULL DEFAULT 30,
  "locationText" TEXT,
  "calendarProvider" "CalendarProvider" NOT NULL DEFAULT 'manual',
  "calendarUrl" TEXT,
  "followupAllowedWindows" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  "maxFollowups" INTEGER NOT NULL DEFAULT 2,
  "leadFieldsRequired" JSONB NOT NULL,
  "disqualifyRules" JSONB NOT NULL,
  "complianceRules" JSONB NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "AgentCallPreferences_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "AgentCallPreferences_workspaceId_key" ON "AgentCallPreferences"("workspaceId");

ALTER TABLE "AgentCallPreferences"
  ADD CONSTRAINT "AgentCallPreferences_workspaceId_fkey"
  FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

-- Lightweight business profile for value proposition
CREATE TABLE "BusinessProfile" (
  "id" TEXT NOT NULL,
  "workspaceId" TEXT NOT NULL,
  "valueProp" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "BusinessProfile_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "BusinessProfile_workspaceId_key" ON "BusinessProfile"("workspaceId");

ALTER TABLE "BusinessProfile"
  ADD CONSTRAINT "BusinessProfile_workspaceId_fkey"
  FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;
