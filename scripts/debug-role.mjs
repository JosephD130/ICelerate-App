import puppeteer from "puppeteer";

const browser = await puppeteer.launch({ headless: true, args: ["--no-sandbox"] });
const page = await browser.newPage();
await page.setViewport({ width: 1280, height: 800 });

await page.goto("http://localhost:3000/projects", { waitUntil: "networkidle2", timeout: 15000 });
const cards = await page.$$('[role="button"]');
if (cards.length > 0) { await cards[0].click(); await new Promise(r => setTimeout(r, 500)); }
const links = await page.$$("a");
for (const link of links) {
  const text = await link.evaluate(el => el.textContent);
  if (text && text.includes("Open Workspace")) { await link.click(); break; }
}
await new Promise(r => setTimeout(r, 2000));

// Switch to field role
const fieldBtn = await page.$('button[aria-label="Switch to Field role"]');
if (fieldBtn) { await fieldBtn.click(); await new Promise(r => setTimeout(r, 2000)); }

// List ALL btn-primary buttons
const allPrimary = await page.evaluate(() => {
  const btns = document.querySelectorAll("button");
  const results = [];
  for (const btn of btns) {
    const text = (btn.textContent || "").trim();
    const cls = btn.className;
    if (cls.includes("btn-primary")) {
      const isVisible = btn.offsetParent !== null;
      results.push({ text, visible: isVisible });
    }
  }
  return results;
});
console.log("All btn-primary buttons after field role switch:");
allPrimary.forEach(b => console.log("  " + JSON.stringify(b)));

// Also check if there's a "New Risk Item" anywhere
const allNewButtons = await page.evaluate(() => {
  const btns = document.querySelectorAll("button");
  const results = [];
  for (const btn of btns) {
    const text = (btn.textContent || "").trim();
    if (text.includes("New Risk") || text.includes("New Field") || text.includes("Create")) {
      const isVisible = btn.offsetParent !== null;
      const isPrimary = btn.className.includes("btn-primary");
      results.push({ text, visible: isVisible, isPrimary });
    }
  }
  return results;
});
console.log("\nAll create-related buttons:");
allNewButtons.forEach(b => console.log("  " + JSON.stringify(b)));

await browser.close();
