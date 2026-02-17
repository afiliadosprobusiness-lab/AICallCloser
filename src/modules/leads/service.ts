import { db } from "@/lib/db";

export async function listLeadsByWorkspace(workspaceId: string) {
  return db.lead.findMany({
    where: { workspaceId },
    orderBy: { createdAt: "desc" },
    take: 100,
    include: {
      calls: {
        orderBy: { startedAt: "desc" },
        take: 1,
      },
    },
  });
}
