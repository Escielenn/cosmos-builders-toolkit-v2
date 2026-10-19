#!/usr/bin/env node
// Initial-load bundle budget.
//
// Reads dist/.vite/manifest.json (build.manifest is on in vite.config.ts),
// finds the index.html entry chunk, walks its STATIC imports (the chunks the
// browser must fetch before the app can render; dynamic imports are excluded)
// and gzips each JS file. Fails when either number exceeds
// scripts/bundle-budget.json:
//
//   entryGzipKB         the entry chunk alone
//   totalInitialGzipKB  entry + every statically imported chunk
//
// Usage: npm run build && npm run check:bundle
//        node scripts/check-bundle-budget.mjs --json   (machine-readable)

import fs from "node:fs";
import path from "node:path";
import zlib from "node:zlib";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const DIST = path.join(ROOT, "dist");
const MANIFEST = path.join(DIST, ".vite", "manifest.json");
const BUDGET = path.join(ROOT, "scripts", "bundle-budget.json");

function fail(msg) {
  console.error(`BUNDLE BUDGET: ${msg}`);
  process.exit(1);
}

if (!fs.existsSync(MANIFEST)) fail(`no manifest at ${path.relative(ROOT, MANIFEST)}. Run the build first.`);
const manifest = JSON.parse(fs.readFileSync(MANIFEST, "utf8"));

const entryKey =
  Object.keys(manifest).find((k) => manifest[k].isEntry && k.endsWith("index.html")) ??
  Object.keys(manifest).find((k) => manifest[k].isEntry);
if (!entryKey) fail("manifest has no entry chunk.");

// Walk static imports only.
const seen = new Set();
const order = [];
(function walk(key) {
  if (seen.has(key)) return;
  seen.add(key);
  const chunk = manifest[key];
  if (!chunk) return;
  order.push(key);
  for (const dep of chunk.imports ?? []) walk(dep);
})(entryKey);

const gzipKB = (file) => zlib.gzipSync(fs.readFileSync(path.join(DIST, file)), { level: 9 }).length / 1024;

const rows = order
  .map((key) => manifest[key].file)
  .filter((f) => f.endsWith(".js"))
  .map((file) => ({ file, gzipKB: gzipKB(file) }));

const entryGzipKB = rows[0]?.gzipKB ?? 0;
const totalInitialGzipKB = rows.reduce((s, r) => s + r.gzipKB, 0);

if (process.argv.includes("--json")) {
  console.log(JSON.stringify({ entryGzipKB, totalInitialGzipKB, rows }, null, 2));
  process.exit(0);
}

const budget = fs.existsSync(BUDGET) ? JSON.parse(fs.readFileSync(BUDGET, "utf8")) : null;

console.log("INITIAL LOAD (gzip, static imports of the entry)");
for (const r of [...rows].sort((a, b) => b.gzipKB - a.gzipKB)) {
  console.log(`  ${r.gzipKB.toFixed(1).padStart(8)} KB  ${r.file}`);
}
console.log(`  entry   ${entryGzipKB.toFixed(1)} KB${budget ? ` / budget ${budget.entryGzipKB} KB` : ""}`);
console.log(`  total   ${totalInitialGzipKB.toFixed(1)} KB${budget ? ` / budget ${budget.totalInitialGzipKB} KB` : ""}`);

if (!budget) fail("scripts/bundle-budget.json missing.");
const over = [];
if (entryGzipKB > budget.entryGzipKB) over.push(`entry ${entryGzipKB.toFixed(1)} KB > ${budget.entryGzipKB} KB`);
if (totalInitialGzipKB > budget.totalInitialGzipKB)
  over.push(`initial ${totalInitialGzipKB.toFixed(1)} KB > ${budget.totalInitialGzipKB} KB`);
if (over.length) fail(`OVER BUDGET. ${over.join("; ")}.`);
console.log("BUNDLE WITHIN BUDGET.");
