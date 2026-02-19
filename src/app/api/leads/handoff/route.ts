import { handleLeadsWidgetHandoff } from "@/modules/leads-handoff/endpoint";

export async function POST(request: Request) {
  return handleLeadsWidgetHandoff(request);
}
