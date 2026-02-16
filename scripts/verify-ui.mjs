/**
 * Puppeteer UI verification script — Parts A-J.
 * Run: node scripts/verify-ui.mjs
 */

import puppeteer from "puppeteer";
import { mkdir } from "fs/promises";

const BASE = "http://localhost:3199";
const SHOT_DIR = "screenshots/verify";
const VP = { width: 1440, height: 900 };
const delay = (ms) => new Promise((r) => setTimeout(r, ms));

async function run() {
  await mkdir(SHOT_DIR, { recursive: true });

  const browser = await puppeteer.launch({ headless: true, defaultViewport: VP, args: ["--no-sandbox"], protocolTimeout: 120000 });
  const page = await browser.newPage();
  let shotIndex = 0;
  const issues = [];

  const shot = async (label) => {
    shotIndex++;
    const f = `${SHOT_DIR}/${String(shotIndex).padStart(2, "0")}-${label}.png`;
    await page.screenshot({ path: f, fullPage: false });
    console.log(`  [${shotIndex}] ${label}`);
  };

  const fullShot = async (label) => {
    shotIndex++;
    const f = `${SHOT_DIR}/${String(shotIndex).padStart(2, "0")}-${label}.png`;
    await page.screenshot({ path: f, fullPage: true });
    console.log(`  [${shotIndex}] ${label} (full-page)`);
  };

  // Switch role using the aria-label buttons in the header
  const switchRole = async (roleName) => {
    const labelMap = { field: "Field", pm: "PM", stakeholder: "Exec" };
    const ariaLabel = `Switch to ${labelMap[roleName]} role`;
    const clicked = await page.evaluate((label) => {
      const btn = document.querySelector(`button[aria-label="${label}"]`);
      if (btn) { btn.click(); return true; }
      return false;
    }, ariaLabel);
    if (clicked) await delay(1200);
    return clicked;
  };

  // Close any drawer by clicking backdrop
  const closeDrawer = async () => {
    await page.evaluate(() => {
      const bd = document.querySelector("div.fixed.inset-0.z-40");
      if (bd) bd.click();
    });
    await delay(500);
  };

  // =========================================================================
  console.log("\n=== 1. Landing Page ===");
  await page.goto(`${BASE}/`, { waitUntil: "networkidle2", timeout: 60000 });
  await delay(500);
  await shot("landing-page");

  // =========================================================================
  console.log("\n=== 2. Projects Page ===");
  await page.goto(`${BASE}/projects`, { waitUntil: "networkidle2", timeout: 60000 });
  await delay(500);
  await shot("projects-page");

  // =========================================================================
  console.log("\n=== 3. Risk Register — PM role ===");
  await page.goto(`${BASE}/workspace`, { waitUntil: "networkidle2", timeout: 60000 });
  await delay(800);
  await fullShot("workspace-pm-full");

  // =========================================================================
  console.log("\n=== 4. EventDrawer (Part C) ===");
  try {
    // Click first event row in the event list (.space-y-3 > button)
    const clicked = await page.evaluate(() => {
      const container = document.querySelector(".space-y-3");
      if (!container) return false;
      const row = container.querySelector("button.w-full");
      if (row) { row.click(); return true; }
      return false;
    });
    if (clicked) {
      await delay(600);
      await shot("event-drawer-open");

      // Verify drawer has action buttons (use data-testid to distinguish from CalculationDrawer)
      const drawerText = await page.evaluate(() => {
        const panel = document.querySelector('[data-testid="event-drawer-panel"]');
        return panel ? panel.textContent : "";
      });
      if (!drawerText.includes("Open Event")) issues.push("EventDrawer: missing 'Open Event' button");
      if (!drawerText.includes("Draft Stakeholder Update")) issues.push("EventDrawer: missing 'Draft Stakeholder Update' button");
      console.log(`  Drawer has 'Open Event': ${drawerText.includes("Open Event")}`);
      console.log(`  Drawer has 'Draft Update': ${drawerText.includes("Draft Stakeholder Update")}`);

      await closeDrawer();
    } else {
      issues.push("EventDrawer: couldn't click event row");
    }
  } catch (e) { console.log(`  Error: ${e.message}`); }

  // =========================================================================
  console.log("\n=== 5. CalculationDrawer (Part B) ===");
  try {
    // Click the HelpCircle button on the first KPI tile (has title attr containing "calculated")
    const clicked = await page.evaluate(() => {
      const btns = document.querySelectorAll('button[title*="calculated"]');
      if (btns.length > 0) { btns[0].click(); return true; }
      return false;
    });
    if (clicked) {
      await delay(600);
      await shot("calculation-drawer-open");

      const calcText = await page.evaluate(() => {
        const panel = document.querySelector("div.fixed.right-0.top-0.z-50");
        return panel ? panel.textContent : "";
      });
      console.log(`  Has 'How': ${calcText.includes("How")}`);
      console.log(`  Has 'Inputs': ${calcText.includes("Inputs")}`);
      console.log(`  Has 'Assumptions': ${calcText.includes("Assumptions")}`);
      console.log(`  Has 'Limitations': ${calcText.includes("Limitations")}`);
      if (!calcText.includes("How")) issues.push("CalculationDrawer: missing 'How it's calculated' section");
      if (!calcText.includes("Inputs")) issues.push("CalculationDrawer: missing 'Inputs' section");

      await closeDrawer();
    } else {
      issues.push("CalculationDrawer: no HelpCircle button found");
    }
  } catch (e) { console.log(`  Error: ${e.message}`); }

  // =========================================================================
  console.log("\n=== 6. NoticeClocksStrip (Part D) — PM ===");
  {
    const hasStrip = await page.evaluate(() => {
      const spans = document.querySelectorAll("span");
      return Array.from(spans).some((s) => s.textContent?.trim() === "Notices");
    });
    console.log(`  PM notice strip visible: ${hasStrip}`);
    if (!hasStrip) issues.push("NoticeClocksStrip: not visible for PM role");
  }

  // =========================================================================
  console.log("\n=== 7. Role → Stakeholder (Part E) ===");
  {
    const switched = await switchRole("stakeholder");
    console.log(`  Switched to stakeholder: ${switched}`);
    if (!switched) issues.push("Role switch: couldn't switch to stakeholder");

    await delay(500);
    await fullShot("workspace-stakeholder-full");

    // Check TopRisksSummary (exec-only)
    const hasTopRisks = await page.evaluate(() => {
      return document.body.textContent?.includes("Top Risks") ?? false;
    });
    console.log(`  Top Risks visible: ${hasTopRisks}`);

    // Check Board-Ready Export CTA
    const hasBoardReady = await page.evaluate(() => {
      return document.body.textContent?.includes("Board-Ready Export") ?? false;
    });
    console.log(`  Board-Ready Export CTA: ${hasBoardReady}`);

    // Check cost drilldown (stakeholder defaults to "cost")
    const hasCostDrill = await page.evaluate(() => {
      const bars = document.querySelectorAll("span, div");
      return Array.from(bars).some((el) => el.textContent?.includes("Cost Drivers"));
    });
    console.log(`  Cost Drivers drill default: ${hasCostDrill}`);

    // Check notice strip (should show for stakeholder)
    const hasNotice = await page.evaluate(() => {
      const spans = document.querySelectorAll("span");
      return Array.from(spans).some((s) => s.textContent?.trim() === "Notices");
    });
    console.log(`  Notice strip visible: ${hasNotice}`);
  }

  // =========================================================================
  console.log("\n=== 8. Role → Field (Part E) ===");
  {
    const switched = await switchRole("field");
    console.log(`  Switched to field: ${switched}`);

    await delay(500);
    await fullShot("workspace-field-full");

    // Notice strip should be HIDDEN for field (showKpis.notice = false)
    const hasNotice = await page.evaluate(() => {
      const spans = document.querySelectorAll("span");
      return Array.from(spans).some((s) => s.textContent?.trim() === "Notices");
    });
    console.log(`  Notice strip visible (should be false): ${hasNotice}`);
    if (hasNotice) issues.push("Field role: Notice strip should be hidden");

    // Should NOT have cost KPI
    const hasCostKpi = await page.evaluate(() => {
      return document.body.textContent?.includes("EXPOSURE AT RISK") ?? false;
    });
    console.log(`  Cost KPI visible (should be false): ${hasCostKpi}`);
    if (hasCostKpi) issues.push("Field role: Cost KPI should be hidden");

    // Should have "New Field Record" CTA
    const hasFieldCta = await page.evaluate(() => {
      return document.body.textContent?.includes("New Field Record") ?? false;
    });
    console.log(`  'New Field Record' CTA: ${hasFieldCta}`);
  }

  // =========================================================================
  console.log("\n=== 9. Back to PM + Cost Drill → Decision Outputs ===");
  {
    await switchRole("pm");
    await delay(500);

    // Click "View cost drivers" CTA
    const drilled = await page.evaluate(() => {
      const btns = document.querySelectorAll("button");
      for (const b of btns) {
        if (b.textContent?.includes("cost drivers")) { b.click(); return true; }
      }
      return false;
    });
    console.log(`  Cost drill clicked: ${drilled}`);
    if (drilled) {
      await delay(500);
      await shot("pm-cost-drill-active");
    }
  }

  // =========================================================================
  console.log("\n=== 10. Decision Outputs — PM (Part A/G) ===");
  // Navigate via sidebar click (client-side) so ExportContext state persists
  try {
    await Promise.all([
      page.waitForNavigation({ waitUntil: "networkidle2", timeout: 30000 }),
      page.evaluate(() => {
        const links = document.querySelectorAll("a");
        for (const a of links) {
          if (a.textContent?.trim() === "Decision Outputs") { a.click(); return true; }
        }
        return false;
      }),
    ]);
  } catch {
    await page.goto(`${BASE}/workspace/export`, { waitUntil: "networkidle2", timeout: 60000 });
  }
  await delay(800);
  await fullShot("decision-outputs-pm-full");

  // Title check
  const pageTitle = await page.$eval("h1", (el) => el.textContent);
  console.log(`  Title: "${pageTitle}"`);
  if (!pageTitle?.includes("Decision Outputs")) issues.push("Part A: Title not 'Decision Outputs'");

  // Sidebar label check
  const sidebarOK = await page.evaluate(() => {
    const links = document.querySelectorAll("a, button");
    return Array.from(links).some((el) => el.textContent?.includes("Decision Outputs"));
  });
  console.log(`  Sidebar 'Decision Outputs': ${sidebarOK}`);

  // Zone 1: Recommended (text-transform: uppercase makes it look uppercase but textContent is lowercase)
  const hasRecommended = await page.evaluate(() => {
    return document.body.textContent?.toLowerCase().includes("recommended for your role") ?? false;
  });
  console.log(`  Zone 1 'Recommended': ${hasRecommended}`);

  // PM should get PPTX + XLSX
  const pmRec = await page.evaluate(() => {
    const h3s = document.querySelectorAll("h3");
    return Array.from(h3s).map((h) => h.textContent?.trim());
  });
  console.log(`  PM recommended: ${JSON.stringify(pmRec)}`);

  // Zone 2: Assistant
  const hasAssistant = await page.evaluate(() => {
    return document.body.textContent?.includes("Decision Outputs Assistant") ?? false;
  });
  console.log(`  Zone 2 'Decision Outputs Assistant': ${hasAssistant}`);

  // Zone 3: All Outputs accordion
  const clickedAccordion = await page.evaluate(() => {
    const btns = document.querySelectorAll("button");
    for (const b of btns) {
      if (b.textContent?.includes("All Outputs")) { b.click(); return true; }
    }
    return false;
  });
  console.log(`  Zone 3 accordion clicked: ${clickedAccordion}`);
  if (clickedAccordion) {
    await delay(500);
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await delay(300);
    await shot("decision-outputs-zone3-expanded");
  }

  // Context strip (should show cost drill from Part 9)
  const contextStrip = await page.evaluate(() => {
    const ps = document.querySelectorAll("p");
    for (const p of ps) {
      if (p.textContent?.includes("reviewed cost") || p.textContent?.includes("cost drivers")) {
        return p.textContent;
      }
    }
    return null;
  });
  console.log(`  Context strip: "${contextStrip}"`);

  // =========================================================================
  console.log("\n=== 11. Decision Outputs — Stakeholder ===");
  {
    await switchRole("stakeholder");
    await delay(500);
    await page.evaluate(() => window.scrollTo(0, 0));
    await delay(200);
    await fullShot("decision-outputs-stakeholder-full");

    const rec = await page.evaluate(() => {
      const h3s = document.querySelectorAll("h3");
      return Array.from(h3s).map((h) => h.textContent?.trim());
    });
    console.log(`  Stakeholder recommended: ${JSON.stringify(rec)}`);
    const hasDeck = rec.includes("Stakeholder Deck");
    const hasReport = rec.includes("Alignment Report");
    console.log(`  Has Deck: ${hasDeck}, Has Report: ${hasReport}`);
    if (!hasDeck || !hasReport) {
      issues.push("Decision Outputs (stakeholder): should recommend Deck + Alignment Report");
    }
  }

  // =========================================================================
  console.log("\n=== 12. Decision Outputs — Field ===");
  {
    await switchRole("field");
    await delay(500);
    await page.evaluate(() => window.scrollTo(0, 0));
    await delay(200);
    await fullShot("decision-outputs-field-full");

    const rec = await page.evaluate(() => {
      const h3s = document.querySelectorAll("h3");
      return Array.from(h3s).map((h) => h.textContent?.trim());
    });
    console.log(`  Field recommended: ${JSON.stringify(rec)}`);
    const hasCsv = rec.includes("Event CSV");
    const hasReport = rec.includes("Alignment Report");
    console.log(`  Has CSV: ${hasCsv}, Has Report: ${hasReport}`);
    if (!hasCsv || !hasReport) {
      issues.push("Decision Outputs (field): should recommend CSV + Alignment Report");
    }
  }

  // =========================================================================
  // SUMMARY
  // =========================================================================
  console.log("\n" + "=".repeat(60));
  console.log(`Total screenshots: ${shotIndex}`);
  if (issues.length === 0) {
    console.log("ALL CHECKS PASSED — No issues found!");
  } else {
    console.log(`\nISSUES (${issues.length}):`);
    issues.forEach((iss, i) => console.log(`  ${i + 1}. ${iss}`));
  }
  console.log("=".repeat(60));

  await browser.close();
}

run().catch((err) => { console.error("Fatal:", err); process.exit(1); });
