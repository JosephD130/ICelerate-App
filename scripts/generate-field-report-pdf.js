const puppeteer = require("puppeteer");
const path = require("path");

const html = `<!DOCTYPE html>
<html>
<head>
<style>
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&display=swap');
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: 'Inter', Arial, sans-serif; color: #1a1a2e; padding: 48px 56px; font-size: 11px; line-height: 1.5; }

  .header { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 3px solid #FF6B35; padding-bottom: 16px; margin-bottom: 20px; }
  .header-left h1 { font-size: 18px; font-weight: 700; color: #0A1628; letter-spacing: -0.3px; }
  .header-left .subtitle { font-size: 11px; color: #556677; margin-top: 2px; }
  .header-right { text-align: right; font-size: 10px; color: #556677; }
  .header-right .report-num { font-size: 13px; font-weight: 700; color: #FF6B35; }

  .meta-grid { display: grid; grid-template-columns: 1fr 1fr 1fr 1fr; gap: 12px; margin-bottom: 20px; padding: 12px 16px; background: #f4f6f9; border-radius: 6px; border-left: 4px solid #FF6B35; }
  .meta-item label { display: block; font-size: 9px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.8px; color: #8899AA; margin-bottom: 2px; }
  .meta-item span { font-size: 11px; font-weight: 600; color: #1a1a2e; }

  .section { margin-bottom: 16px; }
  .section-title { font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; color: #FF6B35; border-bottom: 1px solid #e0e4ea; padding-bottom: 4px; margin-bottom: 8px; }
  .section p { margin-bottom: 8px; text-align: justify; }

  .severity-badge { display: inline-block; background: #EF4444; color: white; font-size: 9px; font-weight: 700; padding: 2px 8px; border-radius: 3px; text-transform: uppercase; letter-spacing: 0.5px; vertical-align: middle; margin-left: 6px; }

  .impact-grid { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 12px; margin-top: 8px; }
  .impact-card { padding: 10px 14px; border-radius: 6px; border: 1px solid #e0e4ea; }
  .impact-card.cost { border-left: 4px solid #EF4444; }
  .impact-card.schedule { border-left: 4px solid #F59E0B; }
  .impact-card.float { border-left: 4px solid #3B82F6; }
  .impact-card .impact-label { font-size: 9px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.8px; color: #8899AA; }
  .impact-card .impact-value { font-size: 16px; font-weight: 700; margin-top: 2px; }
  .impact-card .impact-note { font-size: 9px; color: #556677; margin-top: 2px; }

  .contract-refs { margin-top: 8px; }
  .contract-ref { display: flex; align-items: center; gap: 8px; padding: 6px 10px; background: #f9fafb; border-radius: 4px; margin-bottom: 4px; font-size: 10px; }
  .contract-ref .ref-id { font-weight: 700; color: #FF6B35; min-width: 50px; }

  .photos-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-top: 8px; }
  .photo-placeholder { height: 100px; background: #f0f2f5; border: 1px dashed #ccd; border-radius: 6px; display: flex; align-items: center; justify-content: center; font-size: 10px; color: #8899AA; }

  .status-bar { margin-top: 20px; padding: 12px 16px; background: #FEF2F2; border: 1px solid #FECACA; border-radius: 6px; }
  .status-bar .status-label { font-size: 9px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.8px; color: #EF4444; }
  .status-bar .status-text { font-size: 11px; color: #1a1a2e; margin-top: 4px; }

  .signature-block { margin-top: 24px; display: flex; justify-content: space-between; padding-top: 16px; border-top: 1px solid #e0e4ea; }
  .sig-line { width: 200px; }
  .sig-line .sig-mark { font-family: 'Brush Script MT', cursive; font-size: 18px; color: #333; }
  .sig-line .sig-label { font-size: 9px; color: #8899AA; border-top: 1px solid #333; padding-top: 4px; margin-top: 4px; }

  .footer { margin-top: 24px; text-align: center; font-size: 8px; color: #aab; border-top: 1px solid #e0e4ea; padding-top: 8px; }
</style>
</head>
<body>

<div class="header">
  <div class="header-left">
    <h1>Daily Field Report</h1>
    <div class="subtitle">Phase 2 Storm Drain &amp; Utility Relocation</div>
  </div>
  <div class="header-right">
    <div class="report-num">DFR-2026-0211</div>
    <div>City of Mesa &mdash; Public Works</div>
    <div>Contract No. RIV-2025-0847</div>
  </div>
</div>

<div class="meta-grid">
  <div class="meta-item">
    <label>Date</label>
    <span>February 11, 2026</span>
  </div>
  <div class="meta-item">
    <label>Observer</label>
    <span>R. Martinez, Superintendent</span>
  </div>
  <div class="meta-item">
    <label>Location</label>
    <span>STA 42+50, Phase 2 Area B</span>
  </div>
  <div class="meta-item">
    <label>Weather / Conditions</label>
    <span>Clear, 58&deg;F, dry ground</span>
  </div>
</div>

<div class="section">
  <div class="section-title">Discovery Details <span class="severity-badge">Critical</span></div>
  <p>
    Excavation crew encountered an unmarked 12-inch ductile iron pipe (DIP) water main at STA 42+50 during storm drain trench work at approximately 08:45. The main is approximately 4 feet below grade, running perpendicular to our proposed storm drain alignment. City water utility emergency locate was called immediately and confirmed the line is live and under pressure. A 20-foot exclusion zone has been established and all mechanical excavation in the area has been halted.
  </p>
  <p>
    Near-miss documented: vacuum truck contacted pipe crown during initial exposure. No damage to pipe, but incident logged per safety protocol. City water department representative (M. Castillo) arrived on site at 10:15 and confirmed no indication of this main in the utility atlas provided during bid phase.
  </p>
</div>

<div class="section">
  <div class="section-title">Prior Observations &mdash; February 9, 2026</div>
  <p>
    During potholing operations on February 9, crew flagged an alignment mismatch at STA 41+80 through STA 42+20. Contract plans indicated a 6-foot horizontal offset from existing utilities, but field measurements showed only 3.2 feet of clearance. This discrepancy was documented in DFR-2026-0209 but excavation continued eastward under the assumption it was a mapping error. In retrospect, this mismatch may have been an early indicator of the unmapped utility encountered today.
  </p>
</div>

<div class="section">
  <div class="section-title">Contractor Actions</div>
  <p>
    Contractor has submitted RFI-047 requesting a 15-foot horizontal offset for the storm drain alignment to maintain required clearances from the discovered water main. This offset will require a design revision to the CB-7 junction structure (per &sect;501.1) and relocation of the Type II energy dissipator at the revised outfall location (per &sect;601.2). Engineer Torres has been contacted by phone and is reviewing the proposed offset.
  </p>
  <p>
    Crew is planning to resume excavation in the offset alignment as soon as the RFI response is received from Engineer Torres, targeting end of this week. Material orders for revised CB-7 formwork have been placed on a hold-for-release basis with the supplier.
  </p>
</div>

<div class="section">
  <div class="section-title">Impact Assessment</div>
  <div class="impact-grid">
    <div class="impact-card cost">
      <div class="impact-label">Cost Exposure</div>
      <div class="impact-value" style="color:#EF4444;">$45,000</div>
      <div class="impact-note">Design revision + CB-7 junction redesign + diffuser relocation</div>
    </div>
    <div class="impact-card schedule">
      <div class="impact-label">Schedule Impact</div>
      <div class="impact-value" style="color:#F59E0B;">12 days</div>
      <div class="impact-note">Critical path &mdash; redesign + procurement + installation</div>
    </div>
    <div class="impact-card float">
      <div class="impact-label">Remaining Float</div>
      <div class="impact-value" style="color:#3B82F6;">8 days</div>
      <div class="impact-note">Phase 2 milestone: August 15, 2026</div>
    </div>
  </div>
  <p style="margin-top: 10px;">
    Crew of 8 on standby at $4,800/day until resolution. Phase 3 paving cannot begin until Phase 2 utility relocation is accepted. Contingency exposure: $45,000 of $312,000 remaining (14.4%).
  </p>
</div>

<div class="section">
  <div class="section-title">Contract References</div>
  <div class="contract-refs">
    <div class="contract-ref">
      <span class="ref-id">&sect;7.3.1</span>
      <span>Differing Site Conditions &mdash; 48-hour written notice required for subsurface conditions differing materially from contract documents</span>
    </div>
    <div class="contract-ref">
      <span class="ref-id">&sect;12.4</span>
      <span>Water Main Conflicts &mdash; Minimum 10-foot horizontal and 18-inch vertical clearance required from existing water mains</span>
    </div>
    <div class="contract-ref">
      <span class="ref-id">&sect;12.6</span>
      <span>Utility Owner Coordination &mdash; Encroachment permits required before work within 5 feet of utility (15&ndash;30 business days processing)</span>
    </div>
    <div class="contract-ref">
      <span class="ref-id">&sect;12.4.3</span>
      <span>Backfill in Utility Proximity Zones &mdash; Class II aggregate, 95% compaction in 4-inch lifts, hand compactors only within 24 inches</span>
    </div>
  </div>
</div>

<div class="section">
  <div class="section-title">Photo Documentation</div>
  <div class="photos-grid">
    <div class="photo-placeholder">IMG_4251.jpg &mdash; Exposed 12" DIP at STA 42+50, looking east</div>
    <div class="photo-placeholder">IMG_4253.jpg &mdash; Exclusion zone markers and barricade setup</div>
    <div class="photo-placeholder">IMG_4255.jpg &mdash; Vac truck contact point on pipe crown (no damage)</div>
    <div class="photo-placeholder">IMG_4258.jpg &mdash; Overview of conflict zone with storm drain alignment flags</div>
  </div>
</div>

<div class="status-bar">
  <div class="status-label">Current Status &mdash; Work Halted</div>
  <div class="status-text">
    All mechanical excavation suspended in STA 41+50 through STA 43+50. Crew redirected to advance bedding work at STA 39+00&ndash;41+00 (unaffected area). Formal written notice of differing site conditions to be submitted to City within 48 hours of discovery. Awaiting RFI-047 response from Engineer Torres.
  </div>
</div>

<div class="signature-block">
  <div class="sig-line">
    <div class="sig-mark">R. Martinez</div>
    <div class="sig-label">R. Martinez, Superintendent &mdash; Feb 11, 2026, 16:30</div>
  </div>
  <div class="sig-line">
    <div class="sig-mark">&nbsp;</div>
    <div class="sig-label">Project Manager Review &mdash; Date / Time</div>
  </div>
</div>

<div class="footer">
  Phase 2 Storm Drain &amp; Utility Relocation &bull; Contract RIV-2025-0847 &bull; City of Mesa Public Works Department &bull; Page 1 of 1
</div>

</body>
</html>`;

(async () => {
  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();
  await page.setContent(html, { waitUntil: "networkidle0" });
  const outPath = path.join(__dirname, "..", "public", "demo", "field-report-sta-42-50.pdf");
  await page.pdf({
    path: outPath,
    format: "Letter",
    printBackground: true,
    margin: { top: "0.3in", bottom: "0.3in", left: "0.3in", right: "0.3in" },
  });
  await browser.close();
  console.log("PDF generated:", outPath);
})();
