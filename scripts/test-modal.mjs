import puppeteer from "puppeteer";

const browser = await puppeteer.launch({ headless: true, args: ["--no-sandbox"] });
const page = await browser.newPage();
await page.setViewport({ width: 1280, height: 800 });
const errors = [];
page.on("pageerror", (e) => errors.push(e.message));

async function switchRole(roleName) {
  // Role switcher is in RealitySyncPanel, uses aria-label pattern
  const btn = await page.$(`button[aria-label="Switch to ${roleName} role"]`);
  if (btn) {
    await btn.click();
    // Wait for React re-render to complete
    await new Promise((r) => setTimeout(r, 1500));
    return true;
  }
  console.log("  Could not find role button: " + roleName);
  return false;
}

async function findAndClickCreate(expectedLabel) {
  const buttons = await page.$$("button");
  // First pass: look for exact match with btn-primary class
  for (const btn of buttons) {
    const info = await btn.evaluate((el) => ({
      text: (el.textContent || "").trim(),
      isPrimary: el.className.includes("btn-primary"),
    }));
    if (info.isPrimary && (info.text.includes("New Risk Item") || info.text.includes("New Field Record"))) {
      console.log("Found button: " + info.text + (expectedLabel ? ` (expected: ${expectedLabel})` : ""));
      await btn.click();
      await new Promise((r) => setTimeout(r, 500));
      return true;
    }
  }
  console.log("  Create button not found");
  return false;
}

async function closeModal() {
  // Click at position 0,0 which is on the backdrop overlay, not the modal
  await page.mouse.click(5, 5);
  await new Promise((r) => setTimeout(r, 500));
  // Verify it closed
  const stillOpen = await page.evaluate(() => {
    return document.querySelectorAll(".fixed.inset-0.z-40").length > 0;
  });
  if (stillOpen) {
    // Force reload to clear state
    await page.reload({ waitUntil: "networkidle2" });
    await new Promise((r) => setTimeout(r, 1000));
  }
}

// Navigate to projects page and select first project
await page.goto("http://localhost:3000/projects", { waitUntil: "networkidle2", timeout: 15000 });

const cards = await page.$$('[role="button"]');
if (cards.length > 0) {
  await cards[0].click();
  await new Promise((r) => setTimeout(r, 500));
}

// Click Open Workspace
const links = await page.$$("a");
for (const link of links) {
  const text = await link.evaluate((el) => el.textContent);
  if (text && text.includes("Open Workspace")) {
    await link.click();
    break;
  }
}
await new Promise((r) => setTimeout(r, 2000));

// ===== TEST 1: PM Role =====
console.log("--- TEST 1: PM role modal ---");
await switchRole("PM");

if (await findAndClickCreate()) {
  const modalType = await page.evaluate(() => {
    const text = document.body.textContent || "";
    if (text.includes("Quick Entry") && text.includes("Import Document")) return "PM_MODAL";
    if (text.includes("Field Capture")) return "FIELD_MODAL";
    return "UNKNOWN";
  });
  console.log("PM role opened: " + modalType);

  const hasTabs = await page.evaluate(() => {
    const text = document.body.textContent || "";
    return text.includes("Quick Entry") && text.includes("Import Document");
  });
  console.log("Has Quick Entry + Import tabs: " + hasTabs);

  const hasFields = await page.evaluate(() => {
    const text = document.body.textContent || "";
    return text.includes("Est. Cost") && text.includes("Est. Days");
  });
  console.log("Has Est Cost / Est Days fields: " + hasFields);

  const hasNotice = await page.evaluate(() => {
    return (document.body.textContent || "").includes("Notice required");
  });
  console.log("Has Notice required checkbox: " + hasNotice);

  const hasAiStrip = await page.evaluate(() => {
    return (document.body.textContent || "").includes("Opus 4.6 will process");
  });
  console.log("Has AI processing strip: " + hasAiStrip);

  await closeModal();
}

// ===== TEST 2: PM Import tab =====
console.log("");
console.log("--- TEST 2: PM Import Document tab ---");

if (await findAndClickCreate()) {
  // Click Import Document tab
  const tabs = await page.$$("button");
  for (const tab of tabs) {
    const text = await tab.evaluate((el) => el.textContent);
    if (text && text.includes("Import Document")) {
      await tab.click();
      break;
    }
  }
  await new Promise((r) => setTimeout(r, 300));

  const hasDrop = await page.evaluate(() => {
    const text = document.body.textContent || "";
    return text.includes("Drop PDF") && text.includes("click to browse");
  });
  console.log("Has drag-drop zone: " + hasDrop);

  const hasExtract = await page.evaluate(() => {
    return (document.body.textContent || "").includes("Opus 4.6 will extract");
  });
  console.log("Has Opus extract strip: " + hasExtract);

  await closeModal();
}

// ===== TEST 3: Field Role =====
console.log("");
console.log("--- TEST 3: Field role modal ---");
await switchRole("Field");

// Debug: list all btn-primary buttons
const debugBtns = await page.evaluate(() => {
  const btns = document.querySelectorAll("button");
  const results = [];
  for (const btn of btns) {
    const text = (btn.textContent || "").trim();
    const cls = btn.className;
    if (cls.includes("btn-primary")) {
      results.push(text);
    }
  }
  return results;
});
console.log("btn-primary buttons after Field switch: " + JSON.stringify(debugBtns));

if (await findAndClickCreate("New Field Record")) {
  const modalType = await page.evaluate(() => {
    const text = document.body.textContent || "";
    if (text.includes("Field Capture") && text.includes("Describe what you see")) return "FIELD_MODAL";
    if (text.includes("Quick Entry")) return "PM_MODAL";
    return "UNKNOWN";
  });
  console.log("Field role opened: " + modalType);

  const hasMedia = await page.evaluate(() => {
    const text = document.body.textContent || "";
    return text.includes("Photo") && text.includes("Video") && text.includes("File");
  });
  console.log("Has Photo/Video/File buttons: " + hasMedia);

  const hasAi = await page.evaluate(() => {
    return (document.body.textContent || "").includes("Opus 4.6 will analyze");
  });
  console.log("Has AI analysis strip: " + hasAi);

  const hasVoice = await page.evaluate(() => {
    const text = document.body.textContent || "";
    const hasLabel = text.includes("Describe what you see");
    // Placeholder text is in attributes, not textContent
    const textareas = document.querySelectorAll("textarea");
    let hasPlaceholder = false;
    for (const ta of textareas) {
      if ((ta.placeholder || "").includes("Tap the mic")) hasPlaceholder = true;
    }
    return hasLabel || hasPlaceholder;
  });
  console.log("Has voice input area: " + hasVoice);

  const hasSubmit = await page.evaluate(() => {
    return (document.body.textContent || "").includes("Submit to AI Analysis");
  });
  console.log("Has Submit to AI Analysis button: " + hasSubmit);

  const hasSeverity = await page.evaluate(() => {
    const text = document.body.textContent || "";
    return text.includes("Low") && text.includes("Med") && text.includes("High") && text.includes("Crit");
  });
  console.log("Has severity toggle: " + hasSeverity);

  const hasLocation = await page.evaluate(() => {
    return (document.body.textContent || "").includes("Location");
  });
  console.log("Has location field: " + hasLocation);

  const hasEvidence = await page.evaluate(() => {
    return (document.body.textContent || "").includes("Attach Evidence");
  });
  console.log("Has 'Attach Evidence' label: " + hasEvidence);

  await closeModal();
}

// ===== TEST 4: Exec Role =====
console.log("");
console.log("--- TEST 4: Exec role (no create button) ---");
await switchRole("Exec");

const hasCreateBtn = await page.evaluate(() => {
  const buttons = document.querySelectorAll("button");
  for (const btn of buttons) {
    const text = btn.textContent || "";
    if (text.includes("New Risk Item") || text.includes("New Field Record")) return true;
  }
  return false;
});
console.log("Exec has create button: " + hasCreateBtn);

const hasExport = await page.evaluate(() => {
  const els = document.querySelectorAll("button, a");
  for (const el of els) {
    const text = el.textContent || "";
    if (text.includes("Board-Ready Export") || text.includes("Export")) return true;
  }
  return false;
});
console.log("Exec has export option: " + hasExport);

console.log("");
console.log("Console errors: " + errors.length);
errors.forEach((e) => console.log("  ERROR: " + e));

await browser.close();
console.log("");
console.log("All tests complete.");
