/**
 * Typography drift guard — scans src/ for banned text-[Npx] sizes.
 * Run: node scripts/check-typography.js
 * Exit 0 = clean, Exit 1 = violations found.
 */

const fs = require("fs");
const path = require("path");

const BANNED = ["text-[8px]", "text-[9px]", "text-[11px]", "text-[12px]", "text-[13px]"];
const SRC_DIR = path.join(__dirname, "..", "src");
const EXTENSIONS = new Set([".ts", ".tsx", ".js", ".jsx"]);

let violations = 0;

function scan(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      scan(full);
    } else if (EXTENSIONS.has(path.extname(entry.name))) {
      const content = fs.readFileSync(full, "utf8");
      const lines = content.split("\n");
      for (let i = 0; i < lines.length; i++) {
        for (const banned of BANNED) {
          if (lines[i].includes(banned)) {
            const rel = path.relative(path.join(__dirname, ".."), full);
            console.error(`  ${rel}:${i + 1}  found ${banned}`);
            violations++;
          }
        }
      }
    }
  }
}

console.log("Checking for banned typography sizes...\n");
scan(SRC_DIR);

if (violations > 0) {
  console.error(`\n${violations} violation(s) found. Use TYPO.* from src/lib/ui/typography.ts instead.`);
  process.exit(1);
} else {
  console.log("No banned sizes found. Typography contract is clean.");
}
