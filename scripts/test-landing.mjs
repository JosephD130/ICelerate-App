import puppeteer from "puppeteer";

const browser = await puppeteer.launch({ headless: true, args: ["--no-sandbox"] });
const page = await browser.newPage();
await page.setViewport({ width: 1280, height: 900 });

await page.goto("http://localhost:3000", { waitUntil: "networkidle2", timeout: 15000 });

// Check Try Demo link goes to /projects
const tryDemoHref = await page.evaluate(() => {
  const links = document.querySelectorAll("a");
  for (const l of links) {
    if ((l.textContent || "").includes("Try Demo") && l.closest("nav")) return l.getAttribute("href");
  }
  return null;
});
console.log("Try Demo href: " + tryDemoHref + (tryDemoHref === "/projects" ? " (correct)" : " (WRONG)"));

// Check CTA button
const ctaHref = await page.evaluate(() => {
  const links = document.querySelectorAll("a");
  for (const l of links) {
    if ((l.textContent || "").includes("Try Demo Project")) return l.getAttribute("href");
  }
  return null;
});
console.log("CTA href: " + ctaHref + (ctaHref === "/projects" ? " (correct)" : " (WRONG)"));

// Check About and Tools are anchor links
const aboutHref = await page.evaluate(() => {
  const links = document.querySelectorAll("a");
  for (const l of links) {
    if ((l.textContent || "").trim() === "About") return l.getAttribute("href");
  }
  return null;
});
console.log("About href: " + aboutHref + (aboutHref === "#about" ? " (correct)" : " (WRONG)"));

const toolsHref = await page.evaluate(() => {
  const links = document.querySelectorAll("a");
  for (const l of links) {
    if ((l.textContent || "").trim() === "Tools") return l.getAttribute("href");
  }
  return null;
});
console.log("Tools href: " + toolsHref + (toolsHref === "#tools" ? " (correct)" : " (WRONG)"));

// Check light-content section exists
const hasLightSection = await page.evaluate(() => {
  return document.querySelector(".light-content") !== null;
});
console.log("Light-content section exists: " + hasLightSection);

// Check scroll-margin on target sections
const aboutSection = await page.evaluate(() => {
  const el = document.getElementById("about");
  return el ? "exists" : "missing";
});
console.log("About section (#about): " + aboutSection);

const toolsSection = await page.evaluate(() => {
  const el = document.getElementById("tools");
  return el ? "exists" : "missing";
});
console.log("Tools section (#tools): " + toolsSection);

await browser.close();
console.log("\nDone.");
