/**
 * Self-check spec for risk-register-role policy.
 * Run: npx tsx src/lib/ui/risk-register-role.test.ts
 */

import {
  getRoleUiPolicy,
  shouldClearDrillDown,
  drillDownUnavailableMessage,
} from "./risk-register-role";

function assert(condition: boolean, label: string) {
  if (!condition) {
    console.error(`FAIL: ${label}`);
    process.exitCode = 1;
  } else {
    console.log(`PASS: ${label}`);
  }
}

// ---------------------------------------------------------------------------
// Field policy
// ---------------------------------------------------------------------------
{
  const p = getRoleUiPolicy("field");
  assert(p.showKpis.cost === false, "field — cost KPI hidden");
  assert(p.showKpis.schedule === true, "field — schedule KPI visible");
  assert(p.showKpis.notice === false, "field — notice KPI hidden");
  assert(p.primaryCta === "new_field_record", "field — CTA is new_field_record");
  assert(p.ctaLabel === "New Field Record", "field — CTA label");
  assert(p.morningReview.title === "Morning Review", "field — morning review title");
  assert(p.morningReview.allowAccept === false, "field — no accept");
  assert(p.morningReview.allowEdit === true, "field — allow edit");
  assert(p.morningReview.allowReject === false, "field — no reject");
  assert(p.morningReview.visibleTypes.includes("alignment_change"), "field — sees alignment_change");
  assert(p.morningReview.visibleTypes.includes("schedule_revision"), "field — sees schedule_revision");
  assert(!p.morningReview.visibleTypes.includes("notice_risk"), "field — no notice_risk");
  assert(!p.morningReview.visibleTypes.includes("cost_revision"), "field — no cost_revision");
  assert(p.list.showCostMeta === false, "field — hide cost meta");
  assert(p.list.showScheduleMeta === true, "field — show schedule meta");
  assert(p.list.showNoticeMeta === false, "field — hide notice meta");
  assert(p.defaults.sort === "schedule", "field — default sort schedule");
}

// ---------------------------------------------------------------------------
// PM policy
// ---------------------------------------------------------------------------
{
  const p = getRoleUiPolicy("pm");
  assert(p.showKpis.cost === true, "pm — cost KPI visible");
  assert(p.showKpis.schedule === true, "pm — schedule KPI visible");
  assert(p.showKpis.notice === true, "pm — notice KPI visible");
  assert(p.primaryCta === "new_event", "pm — CTA is new_event");
  assert(p.morningReview.allowAccept === true, "pm — allow accept");
  assert(p.morningReview.allowEdit === true, "pm — allow edit");
  assert(p.morningReview.allowReject === true, "pm — allow reject");
  assert(p.morningReview.visibleTypes.length >= 6, "pm — sees all suggestion types");
  assert(p.defaults.sort === "severity", "pm — default sort severity");
}

// ---------------------------------------------------------------------------
// Exec (stakeholder) policy
// ---------------------------------------------------------------------------
{
  const p = getRoleUiPolicy("stakeholder");
  assert(p.showKpis.cost === true, "exec — cost KPI visible");
  assert(p.primaryCta === "export_board_ready", "exec — CTA is export_board_ready");
  assert(p.ctaLabel === "Board-Ready Export", "exec — CTA label");
  assert(p.morningReview.title === "Decisions Needed", "exec — morning review title");
  assert(p.morningReview.allowAccept === false, "exec — no accept");
  assert(p.morningReview.allowEdit === false, "exec — no edit");
  assert(p.morningReview.allowReject === false, "exec — no reject");
  assert(p.morningReview.visibleTypes.includes("notice_risk"), "exec — sees notice_risk");
  assert(p.morningReview.visibleTypes.includes("cost_revision"), "exec — sees cost_revision");
  assert(!p.morningReview.visibleTypes.includes("new_event"), "exec — no new_event");
  assert(!p.morningReview.visibleTypes.includes("field_observation"), "exec — no field_observation");
  assert(p.defaults.sort === "severity", "exec — default sort severity");
}

// ---------------------------------------------------------------------------
// shouldClearDrillDown
// ---------------------------------------------------------------------------
{
  const field = getRoleUiPolicy("field");
  assert(shouldClearDrillDown("cost", field) === true, "clear cost drill on field");
  assert(shouldClearDrillDown("notice", field) === true, "clear notice drill on field");
  assert(shouldClearDrillDown("schedule", field) === false, "keep schedule drill on field");
  assert(shouldClearDrillDown(null, field) === false, "null drill never clears");

  const pm = getRoleUiPolicy("pm");
  assert(shouldClearDrillDown("cost", pm) === false, "keep cost drill on pm");
  assert(shouldClearDrillDown("notice", pm) === false, "keep notice drill on pm");
}

// ---------------------------------------------------------------------------
// drillDownUnavailableMessage
// ---------------------------------------------------------------------------
{
  const msg = drillDownUnavailableMessage("cost");
  assert(msg.includes("PM") && msg.includes("Exec"), "cost message mentions PM and Exec");
  assert(drillDownUnavailableMessage(null) === "", "null drill returns empty message");
}

// ---------------------------------------------------------------------------
// New fields: helperSubtitle, morningReview.sublabel, morningReview.collapsed,
// showTopRisksSummary, eventListMode, showFieldBadges, statusFilterDefaults
// ---------------------------------------------------------------------------
{
  const field = getRoleUiPolicy("field");
  assert(field.helperSubtitle.includes("field"), "field — subtitle mentions field");
  assert(field.morningReview.sublabel.includes("2 minutes"), "field — sublabel mentions 2 minutes");
  assert(field.morningReview.collapsed === false, "field — morning review not collapsed");
  assert(field.showTopRisksSummary === false, "field — no top risks summary");
  assert(field.eventListMode === "full", "field — full event list mode");
  assert(field.showFieldBadges === true, "field — shows field badges");
  assert(field.statusFilterDefaults.includes("open"), "field — default filter includes open");
  assert(field.statusFilterDefaults.includes("in-progress"), "field — default filter includes in-progress");
  assert(!field.statusFilterDefaults.includes("resolved"), "field — default filter excludes resolved");
}
{
  const pm = getRoleUiPolicy("pm");
  assert(pm.helperSubtitle.includes("daily view"), "pm — subtitle mentions daily view");
  assert(pm.morningReview.sublabel.includes("2 minutes"), "pm — sublabel mentions 2 minutes");
  assert(pm.morningReview.collapsed === false, "pm — morning review not collapsed");
  assert(pm.showTopRisksSummary === false, "pm — no top risks summary");
  assert(pm.eventListMode === "full", "pm — full event list mode");
  assert(pm.showFieldBadges === false, "pm — no field badges");
  assert(pm.statusFilterDefaults.includes("resolved"), "pm — default filter includes resolved");
}
{
  const exec = getRoleUiPolicy("stakeholder");
  assert(exec.helperSubtitle.includes("Executive"), "exec — subtitle mentions Executive");
  assert(exec.morningReview.sublabel.includes("executive"), "exec — sublabel mentions executive");
  assert(exec.morningReview.collapsed === true, "exec — morning review starts collapsed");
  assert(exec.showTopRisksSummary === true, "exec — shows top risks summary");
  assert(exec.eventListMode === "readonly", "exec — readonly event list mode");
  assert(exec.showFieldBadges === false, "exec — no field badges");
  assert(!exec.statusFilterDefaults.includes("resolved"), "exec — default filter excludes resolved");
}

// ---------------------------------------------------------------------------
// Each role produces different helperSubtitle and primaryCta
// ---------------------------------------------------------------------------
{
  const field = getRoleUiPolicy("field");
  const pm = getRoleUiPolicy("pm");
  const exec = getRoleUiPolicy("stakeholder");
  assert(field.helperSubtitle !== pm.helperSubtitle, "field and pm have different subtitles");
  assert(pm.helperSubtitle !== exec.helperSubtitle, "pm and exec have different subtitles");
  assert(field.primaryCta !== pm.primaryCta, "field and pm have different CTAs");
  assert(pm.primaryCta !== exec.primaryCta, "pm and exec have different CTAs");
}

// ---------------------------------------------------------------------------
// Role defaults (role-defaults.ts)
// ---------------------------------------------------------------------------
import { getRoleDefaults } from "./role-defaults";

{
  const fd = getRoleDefaults("field");
  assert(fd.defaultDriverMode === null, "field defaults — null driver mode");
  assert(fd.defaultMorningReviewCollapsed === false, "field defaults — morning review not collapsed");
  assert(fd.showNoticeStrip === false, "field defaults — no notice strip");
  assert(fd.defaultListSort === "schedule", "field defaults — sort by schedule");
}
{
  const pd = getRoleDefaults("pm");
  assert(pd.defaultDriverMode === null, "pm defaults — null driver mode");
  assert(pd.defaultMorningReviewCollapsed === false, "pm defaults — morning review not collapsed");
  assert(pd.showNoticeStrip === true, "pm defaults — shows notice strip");
  assert(pd.defaultListSort === "severity", "pm defaults — sort by severity");
}
{
  const sd = getRoleDefaults("stakeholder");
  assert(sd.defaultDriverMode === "cost", "stakeholder defaults — cost driver mode");
  assert(sd.defaultMorningReviewCollapsed === true, "stakeholder defaults — morning review collapsed");
  assert(sd.showNoticeStrip === true, "stakeholder defaults — shows notice strip");
  assert(sd.defaultListSort === "severity", "stakeholder defaults — sort by severity");
}
{
  const unknown = getRoleDefaults("unknown");
  assert(unknown.defaultListSort === "severity", "unknown role — falls back to PM defaults");
}

console.log("\nDone.");
