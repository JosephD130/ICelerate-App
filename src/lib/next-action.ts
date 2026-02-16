// src/lib/next-action.ts
// Pure priority resolver — determines the next best action for an event.

import type { DecisionEvent } from "@/lib/models/decision-event";
import type { EventTab } from "@/lib/contexts/event-context";

export interface NextAction {
  label: string;
  tab: EventTab;
  urgency: "high" | "medium" | "low";
  reason: string;
}

export function resolveNextAction(event: DecisionEvent): NextAction | null {
  // 1. Notice required + deadline approaching
  const hasNoticeReq = event.contractReferences.some(
    (r) => r.noticeDays && r.noticeDays > 0,
  );
  if (hasNoticeReq && event.status === "open") {
    if (event.noticeDeadline) {
      const hoursLeft =
        (new Date(event.noticeDeadline).getTime() - Date.now()) / 3_600_000;
      if (hoursLeft > 0 && hoursLeft <= 48) {
        return {
          label: "File contractual notice",
          tab: "contract",
          urgency: "high",
          reason: `Notice deadline in ${Math.round(hoursLeft)}h`,
        };
      }
    } else {
      return {
        label: "File contractual notice",
        tab: "contract",
        urgency: "high",
        reason: "Notice required — no deadline recorded",
      };
    }
  }

  // 2. No field record
  if (!event.fieldRecord) {
    return {
      label: "Record field observation",
      tab: "field",
      urgency: "medium",
      reason: "No field data captured yet",
    };
  }

  // 3. No contract review + event has contract refs
  if (!event.rfiRecord && event.contractReferences.length > 0) {
    return {
      label: "Review contract position",
      tab: "contract",
      urgency: "medium",
      reason: `${event.contractReferences.length} contract reference${event.contractReferences.length !== 1 ? "s" : ""} to check`,
    };
  }

  // 4. No decision record + has impact data
  if (!event.decisionRecord && (event.costImpact || event.scheduleImpact)) {
    return {
      label: "Generate decision package",
      tab: "decision",
      urgency: "medium",
      reason: "Impact data available — stakeholders need alignment",
    };
  }

  // 5. No communications + has decision
  if (event.communications.length === 0 && event.decisionRecord) {
    return {
      label: "Communicate to stakeholders",
      tab: "communication",
      urgency: "low",
      reason: "Decision made — stakeholders need update",
    };
  }

  // All done
  return null;
}
