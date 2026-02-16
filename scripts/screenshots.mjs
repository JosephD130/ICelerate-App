import puppeteer from "puppeteer";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SCREENSHOTS_DIR = path.join(__dirname, "..", "screenshots");
const BASE_URL = process.argv[2] || "http://localhost:3002";

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function waitForStylesAndHydration(page) {
  // Wait for Next.js hydration + stylesheets to load
  await page.waitForFunction(
    () => document.querySelectorAll('link[rel="stylesheet"]').length > 0 || document.querySelectorAll("style").length > 0,
    { timeout: 10000 }
  ).catch(() => {});
  await sleep(2000);
}

async function takeScreenshot(page, name, options = {}) {
  const filePath = path.join(SCREENSHOTS_DIR, `${name}.png`);
  await page.screenshot({ path: filePath, fullPage: options.fullPage ?? true });
  console.log(`  [OK] ${name}.png`);
}

async function run() {
  console.log(`\nICelerate Screenshot Capture`);
  console.log(`Base URL: ${BASE_URL}\n`);

  const browser = await puppeteer.launch({
    headless: true,
    defaultViewport: { width: 1440, height: 900 },
  });

  const page = await browser.newPage();

  // Set role to "pm" and project to Mesa (so all tabs + de-001 events are available)
  await page.evaluateOnNewDocument(() => {
    localStorage.setItem("icelerate-role", "pm");
    localStorage.setItem("icelerate-active-project", "p-mesa-stormdrain-2026");
  });

  // Warm up the server — visit pages to trigger compilation/cache
  console.log("Warming up server...");
  await page.goto(`${BASE_URL}/`, { waitUntil: "networkidle2", timeout: 60000 });
  await sleep(3000);
  await page.goto(`${BASE_URL}/workspace`, { waitUntil: "networkidle2", timeout: 60000 });
  await sleep(3000);

  // 1. Landing page
  console.log("--- Landing Page ---");
  await page.goto(`${BASE_URL}/`, { waitUntil: "networkidle2", timeout: 30000 });
  await waitForStylesAndHydration(page);
  await takeScreenshot(page, "01-landing");

  // 2. Projects page
  console.log("--- Projects ---");
  await page.goto(`${BASE_URL}/projects`, { waitUntil: "networkidle2", timeout: 30000 });
  await waitForStylesAndHydration(page);
  await takeScreenshot(page, "02-projects");

  // 3. Workspace / Alignment Register
  console.log("--- Workspace ---");
  await page.goto(`${BASE_URL}/workspace`, { waitUntil: "networkidle2", timeout: 30000 });
  await waitForStylesAndHydration(page);
  await takeScreenshot(page, "03-workspace-register");

  // 4. Navigate to event detail via clicking an event card (uses router.push internally)
  console.log("--- Event Detail ---");
  // The workspace page has <button> event cards — click the first one (critical event)
  const eventClicked = await page.evaluate(() => {
    // Event cards are <button> elements with onClick={handleEventClick}
    // Look for the critical "Unmarked" event first, then fallback to first card
    const allButtons = Array.from(document.querySelectorAll("button"));
    // Event cards are in .space-y-2 list and have the event title text
    for (const btn of allButtons) {
      const text = btn.textContent || "";
      if (text.includes("Unmarked") && text.includes("Water Main")) {
        btn.click();
        return { clicked: true, text: text.slice(0, 60) };
      }
    }
    // Fallback: find buttons that look like event cards (have severity badge text)
    for (const btn of allButtons) {
      const text = btn.textContent || "";
      if ((text.includes("critical") || text.includes("high") || text.includes("medium")) && text.includes("Open")) {
        btn.click();
        return { clicked: true, text: text.slice(0, 60) };
      }
    }
    return { clicked: false, buttons: allButtons.length };
  });
  console.log(`  Event click result: ${JSON.stringify(eventClicked)}`);

  if (eventClicked.clicked) {
    // Wait for client-side navigation to complete
    await page.waitForFunction(
      () => window.location.pathname.includes("/events/"),
      { timeout: 15000 }
    ).catch((e) => console.log(`  (URL did not change: ${page.url()})`));

    // Wait for tab bar to render (indicates event loaded)
    await page.waitForSelector('button[role="tab"]', { timeout: 15000 }).catch(() => {
      console.log("  (tab bar did not appear)");
    });
    await sleep(2000);

    // Debug: log current URL and page state
    const currentUrl = page.url();
    const pageState = await page.evaluate(() => {
      const tabs = document.querySelectorAll('button[role="tab"]');
      const h1 = document.querySelector("h1");
      return {
        url: window.location.href,
        tabCount: tabs.length,
        tabs: Array.from(tabs).map((t) => t.textContent?.trim()),
        h1: h1?.textContent?.trim() || "(no h1)",
        bodyText: document.body.textContent?.slice(0, 200),
      };
    });
    console.log(`  Page state: ${JSON.stringify(pageState)}`);

    // Overview tab (default)
    await takeScreenshot(page, "04-event-overview");

    if (pageState.tabCount > 0) {
      // Click through each tab using role="tab" buttons (EventTabBar)
      const tabNames = [
        { key: "field", match: "field" },
        { key: "contract", match: "contract" },
        { key: "decision", match: "decision" },
        { key: "communication", match: "communication" },
        { key: "monitor", match: "monitor" },
        { key: "history", match: "history" },
      ];

      for (const { key, match } of tabNames) {
        console.log(`  Tab: ${key}`);
        const clicked = await page.evaluate((matchText) => {
          const tabs = Array.from(document.querySelectorAll('button[role="tab"]'));
          for (const tab of tabs) {
            const text = (tab.textContent || "").toLowerCase().trim();
            if (text.includes(matchText)) {
              tab.click();
              return true;
            }
          }
          return false;
        }, match);

        if (clicked) {
          await sleep(1500);
          await takeScreenshot(page, `05-event-tab-${key}`);
        } else {
          console.log(`    (tab button not found)`);
        }
      }
    }
  } else {
    console.log("  No event cards found, skipping event tabs");
  }

  // 5. Dashboard
  console.log("--- Dashboard ---");
  await page.goto(`${BASE_URL}/workspace/dashboard`, { waitUntil: "networkidle2", timeout: 30000 });
  await waitForStylesAndHydration(page);
  await takeScreenshot(page, "06-dashboard");

  // 6. Timeline
  console.log("--- Timeline ---");
  await page.goto(`${BASE_URL}/workspace/timeline`, { waitUntil: "networkidle2", timeout: 30000 });
  await waitForStylesAndHydration(page);
  await takeScreenshot(page, "07-timeline");

  // 7. Connect
  console.log("--- Connect ---");
  await page.goto(`${BASE_URL}/workspace/connect`, { waitUntil: "networkidle2", timeout: 30000 });
  await waitForStylesAndHydration(page);
  await takeScreenshot(page, "08-connect");

  // 8. Documents
  console.log("--- Documents ---");
  await page.goto(`${BASE_URL}/workspace/documents`, { waitUntil: "networkidle2", timeout: 30000 });
  await waitForStylesAndHydration(page);
  await takeScreenshot(page, "09-documents");

  // 9. Export
  console.log("--- Export ---");
  await page.goto(`${BASE_URL}/workspace/export`, { waitUntil: "networkidle2", timeout: 30000 });
  await waitForStylesAndHydration(page);
  await takeScreenshot(page, "10-export");

  await browser.close();
  console.log(`\nDone! Screenshots saved to: ${SCREENSHOTS_DIR}\n`);
}

run().catch((err) => {
  console.error("Screenshot capture failed:", err);
  process.exit(1);
});
