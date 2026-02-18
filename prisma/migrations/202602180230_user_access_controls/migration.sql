CREATE TYPE "UserAccessStatus" AS ENUM ('active', 'deactivated', 'temporarily_disabled', 'blocked');

ALTER TABLE "User"
ADD COLUMN "accessStatus" "UserAccessStatus" NOT NULL DEFAULT 'active',
ADD COLUMN "accessReason" TEXT,
ADD COLUMN "accessDisabledUntil" TIMESTAMP(3),
ADD COLUMN "accessUpdatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

CREATE INDEX "User_accessStatus_idx" ON "User"("accessStatus");
CREATE INDEX "User_accessDisabledUntil_idx" ON "User"("accessDisabledUntil");
