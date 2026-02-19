-- Bridge enums
CREATE TYPE "BridgeLeadObjective" AS ENUM (
  'CLOSE_SALE',
  'BOOK_MEET',
  'BOOK_IN_PERSON',
  'SCHEDULE_FOLLOWUP'
);

CREATE TYPE "BridgeLeadStatus" AS ENUM (
  'new',
  'queued',
  'calling',
  'completed',
  'failed'
);

CREATE TYPE "BridgeLeadOutcome" AS ENUM (
  'unknown',
  'sold',
  'booked',
  'followup',
  'not_interested',
  'disqualified'
);

-- Customers uploaded from Puente
CREATE TABLE "Customer" (
  "id" TEXT NOT NULL,
  "workspaceId" TEXT NOT NULL,
  "customerName" TEXT NOT NULL,
  "customerId" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "Customer_pkey" PRIMARY KEY ("id")
);

-- Bridge leads
CREATE TABLE "BridgeLead" (
  "id" TEXT NOT NULL,
  "workspaceId" TEXT NOT NULL,
  "customerId" TEXT NOT NULL,
  "agentId" TEXT NOT NULL,
  "externalId" TEXT NOT NULL,
  "clientName" TEXT,
  "phoneE164" TEXT NOT NULL,
  "objective" "BridgeLeadObjective" NOT NULL,
  "collectedInfo" JSONB NOT NULL,
  "preferredTimes" JSONB NOT NULL,
  "status" "BridgeLeadStatus" NOT NULL DEFAULT 'new',
  "lastCallSid" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "BridgeLead_pkey" PRIMARY KEY ("id")
);

-- Call logs for bridge leads
CREATE TABLE "CallLog" (
  "id" TEXT NOT NULL,
  "workspaceId" TEXT NOT NULL,
  "leadId" TEXT NOT NULL,
  "callSid" TEXT,
  "outcome" "BridgeLeadOutcome" NOT NULL DEFAULT 'unknown',
  "transcript" TEXT,
  "summary" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "CallLog_pkey" PRIMARY KEY ("id")
);

-- Indexes
CREATE UNIQUE INDEX "Customer_workspaceId_customerName_key" ON "Customer"("workspaceId", "customerName");
CREATE UNIQUE INDEX "Customer_workspaceId_customerId_key" ON "Customer"("workspaceId", "customerId");
CREATE INDEX "Customer_workspaceId_createdAt_idx" ON "Customer"("workspaceId", "createdAt");

CREATE UNIQUE INDEX "BridgeLead_customerId_externalId_key" ON "BridgeLead"("customerId", "externalId");
CREATE INDEX "BridgeLead_workspaceId_status_idx" ON "BridgeLead"("workspaceId", "status");
CREATE INDEX "BridgeLead_workspaceId_phoneE164_idx" ON "BridgeLead"("workspaceId", "phoneE164");

CREATE INDEX "CallLog_workspaceId_createdAt_idx" ON "CallLog"("workspaceId", "createdAt");
CREATE INDEX "CallLog_leadId_createdAt_idx" ON "CallLog"("leadId", "createdAt");
CREATE INDEX "CallLog_callSid_idx" ON "CallLog"("callSid");

-- Foreign keys
ALTER TABLE "Customer"
  ADD CONSTRAINT "Customer_workspaceId_fkey"
  FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "BridgeLead"
  ADD CONSTRAINT "BridgeLead_workspaceId_fkey"
  FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "BridgeLead"
  ADD CONSTRAINT "BridgeLead_customerId_fkey"
  FOREIGN KEY ("customerId") REFERENCES "Customer"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "BridgeLead"
  ADD CONSTRAINT "BridgeLead_agentId_fkey"
  FOREIGN KEY ("agentId") REFERENCES "AgentConfig"("id")
  ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "CallLog"
  ADD CONSTRAINT "CallLog_workspaceId_fkey"
  FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "CallLog"
  ADD CONSTRAINT "CallLog_leadId_fkey"
  FOREIGN KEY ("leadId") REFERENCES "BridgeLead"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;
