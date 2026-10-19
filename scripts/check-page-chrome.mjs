#!/usr/bin/env node
/**
 * Page-chrome guard (docs/stellarforge/15-PAGE-CHROME.md).
 *
 * 1. No raw <h1 outside src/components/layout/page-chrome/ and the marketing
 *    allow-list. Pages render their title through <PageHeader>.
 * 2. No "RETURN HOME" / "Return to Bridge" back links: the logo goes home,
 *    world pages use breadcrumbs, child pages say "Back to <parent>".
 *
 * Run: node scripts/check-page-chrome.mjs   (exit 1 on violations)
 */
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join, relative } from "node:path";

const ROOT = new URL("..", import.meta.url).pathname;
const SRC = join(ROOT, "src");

// Marketing heroes and documents that legitimately own their <h1>.
const H1_ALLOW = [
  "src/components/layout/page-chrome/",
  "src/components/landing/",        // signed-out landing hero
  "src/pages/Pricing.tsx",
  "src/pages/Features.tsx",
  "src/pages/NotFound.tsx",
  "src/lib/pdf/",                   // print templates
  "src/pages/dev/",
  "src/components/editor/",         // prose headings inside documents
  "src/pages/WorldShowcase.tsx",    // public showcase hero
];

const BACK_BANNED = /label=["'{`]\s*(?:←\s*)?(?:return home|return to bridge|return to world|return to tools|return to known space)/i;

function walk(dir, out = []) {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    const st = statSync(p);
    if (st.isDirectory()) {
      if (name === "__tests__" || name === "node_modules") continue;
      walk(p, out);
    } else if (/\.tsx$/.test(name) && !/\.test\.tsx$/.test(name)) out.push(p);
  }
  return out;
}

const problems = [];
for (const file of walk(SRC)) {
  const rel = relative(ROOT, file);
  const text = readFileSync(file, "utf8");
  const lines = text.split("\n");
  const allowH1 = H1_ALLOW.some((a) => rel.startsWith(a));
  lines.forEach((line, i) => {
    if (!allowH1 && /<h1[\s>]/.test(line)) problems.push(`${rel}:${i + 1}  raw <h1>: use <PageHeader>`);
    if (BACK_BANNED.test(line)) problems.push(`${rel}:${i + 1}  banned back-link label: use breadcrumbs or "Back to <parent>"`);
  });
}

if (problems.length) {
  console.log(`[page-chrome] ${problems.length} violation(s):`);
  for (const p of problems) console.log("  " + p);
  process.exit(1);
}
console.log("[page-chrome] OK");
