// scripts/ui-test.mjs
// Quick Puppeteer UI smoke test — takes screenshots of key pages
import puppeteer from 'puppeteer';
import { fileURLToPath } from 'url';
import path from 'path';

const BASE = 'http://localhost:3002';
const DIR = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', 'screenshots');

async function run() {
  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
    defaultViewport: { width: 1440, height: 900 },
  });
  const page = await browser.newPage();

  const errors = [];
  page.on('pageerror', err => errors.push(`PAGE: ${err.message}`));
  page.on('console', msg => {
    if (msg.type() === 'error') {
      const text = msg.text();
      if (!text.includes('RSC payload') && !text.includes('Failed to load resource')) {
        errors.push(`CONSOLE: ${text.slice(0, 200)}`);
      }
    }
  });

  // ── Static pages ──
  console.log('=== Static Pages ===');
  for (const p of [
    { url: '/', name: '01-landing' },
    { url: '/workspace', name: '02-workspace-home' },
    { url: '/workspace/export', name: '03-export-page' },
  ]) {
    console.log(`-> ${p.name}`);
    await page.goto(`${BASE}${p.url}`, { waitUntil: 'networkidle2', timeout: 30000 });
    await page.screenshot({ path: path.join(DIR, `${p.name}.png`), fullPage: true });
    console.log('  OK');
  }

  // ── Event page: direct navigation (compilation already cached) ──
  console.log('\n=== Event Page: de-001 ===');
  await page.goto(`${BASE}/workspace/events/de-001`, { waitUntil: 'networkidle2', timeout: 30000 });

  // Wait for tab bar to appear (confirms event loaded + React hydrated)
  try {
    await page.waitForSelector('[role="tablist"]', { timeout: 15000 });
    console.log('  OK Tab bar appeared');
  } catch {
    console.log('  WARN Tab bar not found after 15s');
  }

  await page.screenshot({ path: path.join(DIR, '04-event-overview.png'), fullPage: true });
  console.log('  OK Overview screenshot saved');

  // ── Click through tabs ──
  console.log('\n=== Event Tabs ===');
  const tabs = ['Monitor', 'Contract', 'Field', 'Decision', 'Communication', 'History'];
  for (let i = 0; i < tabs.length; i++) {
    const tabName = tabs[i];
    const num = String(i + 5).padStart(2, '0');
    const clicked = await page.evaluate((name) => {
      const btns = Array.from(document.querySelectorAll('[role="tab"]'));
      const btn = btns.find(b => b.textContent?.trim() === name);
      if (btn) { btn.click(); return true; }
      return false;
    }, tabName);

    if (clicked) {
      await new Promise(r => setTimeout(r, 1500));
      await page.screenshot({
        path: path.join(DIR, `${num}-tab-${tabName.toLowerCase()}.png`),
        fullPage: true,
      });
      console.log(`  OK ${tabName}`);
    } else {
      console.log(`  WARN ${tabName} not found`);
    }
  }

  // ── Summary ──
  if (errors.length > 0) {
    console.log('\nErrors:');
    errors.forEach(e => console.log(`  - ${e}`));
  } else {
    console.log('\nNo errors');
  }

  await browser.close();
  console.log('\nDone!');
}

run().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
