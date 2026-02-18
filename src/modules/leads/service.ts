import { db } from "@/lib/db";

export async function listLeadsByWorkspace(workspaceId: string) {
  return db.lead.findMany({
    where: { workspaceId },
    orderBy: { createdAt: "desc" },
    take: 100,
    select: {
      id: true,
      fullName: true,
      phone: true,
      score: true,
      status: true,
      updatedAt: true,
      calls: {
        orderBy: { startedAt: "desc" },
        take: 1,
        select: {
          id: true,
          startedAt: true,
        },
      },
    },
  });
}
