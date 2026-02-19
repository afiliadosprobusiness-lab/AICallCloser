CREATE TYPE "LeadHandoffStatus" AS ENUM ('queued', 'calling', 'completed', 'failed');

CREATE TABLE "LeadHandoff" (
  "id" TEXT NOT NULL,
  "workspaceId" TEXT NOT NULL,
  "agentId" TEXT NOT NULL,
  "sourceProduct" TEXT NOT NULL,
  "widgetId" TEXT NOT NULL,
  "clientId" TEXT NOT NULL,
  "leadChatSlug" TEXT NOT NULL,
  "sentAt" TIMESTAMP(3) NOT NULL,
  "leadName" TEXT NOT NULL,
  "leadPhone" TEXT NOT NULL,
  "leadPhoneE164" TEXT NOT NULL,
  "leadCollectedInfo" TEXT NOT NULL,
  "consentAccepted" BOOLEAN NOT NULL DEFAULT true,
  "consentAcceptedAt" TIMESTAMP(3) NOT NULL,
  "consentTextVersion" TEXT NOT NULL,
  "consentText" TEXT NOT NULL,
  "consentIp" TEXT NOT NULL,
  "consentUserAgent" TEXT NOT NULL,
  "history" JSONB NOT NULL,
  "payload" JSONB NOT NULL,
  "receivedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "status" "LeadHandoffStatus" NOT NULL DEFAULT 'queued',
  "lastCallSid" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "LeadHandoff_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "LeadHandoff_workspaceId_status_idx" ON "LeadHandoff"("workspaceId", "status");
CREATE INDEX "LeadHandoff_workspaceId_receivedAt_idx" ON "LeadHandoff"("workspaceId", "receivedAt");
CREATE INDEX "LeadHandoff_lastCallSid_idx" ON "LeadHandoff"("lastCallSid");

ALTER TABLE "LeadHandoff"
  ADD CONSTRAINT "LeadHandoff_workspaceId_fkey"
  FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "LeadHandoff"
  ADD CONSTRAINT "LeadHandoff_agentId_fkey"
  FOREIGN KEY ("agentId") REFERENCES "AgentConfig"("id")
  ON DELETE RESTRICT ON UPDATE CASCADE;
