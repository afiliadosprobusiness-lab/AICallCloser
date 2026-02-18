import { UserAccessStatus } from "@prisma/client";

import { db } from "@/lib/db";

type AccessUser = {
  id: string;
  accessStatus: UserAccessStatus;
  accessDisabledUntil: Date | null;
};

export function canUserAccess(status: UserAccessStatus, disabledUntil: Date | null, now = new Date()) {
  if (status === "active") {
    return true;
  }

  if (status === "temporarily_disabled" && disabledUntil && disabledUntil <= now) {
    return true;
  }

  return false;
}

export async function ensureUserAccess(user: AccessUser) {
  if (
    user.accessStatus === "temporarily_disabled" &&
    user.accessDisabledUntil &&
    user.accessDisabledUntil <= new Date()
  ) {
    await db.user.update({
      where: { id: user.id },
      data: {
        accessStatus: "active",
        accessDisabledUntil: null,
        accessReason: null,
        accessUpdatedAt: new Date(),
      },
    });

    return true;
  }

  return canUserAccess(user.accessStatus, user.accessDisabledUntil);
}
