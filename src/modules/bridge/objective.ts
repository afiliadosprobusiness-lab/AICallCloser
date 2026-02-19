import type { BridgeLeadObjective } from "@prisma/client";

import type { CallObjectiveValue } from "@/lib/call-objectives/config";

export function mapBridgeObjectiveToCallObjective(objective: BridgeLeadObjective): CallObjectiveValue {
  switch (objective) {
    case "CLOSE_SALE":
      return "sell_product";
    case "BOOK_MEET":
      return "book_google_meet";
    case "BOOK_IN_PERSON":
      return "book_in_person_meeting";
    case "SCHEDULE_FOLLOWUP":
      return "schedule_followup_call";
    default:
      return "qualify_only";
  }
}

export function formatBridgeObjectiveForPrompt(objective: BridgeLeadObjective) {
  switch (objective) {
    case "CLOSE_SALE":
      return "Primary objective: close the sale directly. If price is unknown, offer a short specialist call.";
    case "BOOK_MEET":
      return "Primary objective: book a Google Meet. Offer today/tomorrow options and confirm attendee email.";
    case "BOOK_IN_PERSON":
      return "Primary objective: book an in-person meeting. Confirm location, service area and time.";
    case "SCHEDULE_FOLLOWUP":
      return "Primary objective: schedule a follow-up call with exact date and time confirmation.";
    default:
      return "Primary objective: qualify quickly and propose the most relevant next step.";
  }
}

export function getBridgeObjectiveLabel(objective: BridgeLeadObjective) {
  switch (objective) {
    case "CLOSE_SALE":
      return "Close sale";
    case "BOOK_MEET":
      return "Book Meet";
    case "BOOK_IN_PERSON":
      return "Book in person";
    case "SCHEDULE_FOLLOWUP":
      return "Schedule follow-up";
    default:
      return objective;
  }
}
