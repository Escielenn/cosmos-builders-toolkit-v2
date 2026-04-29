#!/usr/bin/env node
// Build gate: catches the specific class of TS error that lets undefined
// JSX components reach production (TS2304 "Cannot find name", TS2552
// "Cannot find name X. Did you mean Y?"). Both bit us as runtime
// ReferenceErrors when a Lucide icon was used in JSX without an import.
//
// We intentionally do NOT fail on every tsc error. The codebase has
// pre-existing type-mismatch errors that don't crash production; making
// the build fail on those would be too disruptive to add at once. This
// gate enforces only the exact class of bug we have evidence for.
//
// Run via: npm run build (chained before vite build)
// Or directly: node scripts/typecheck-strict.mjs

import { spawnSync } from "node:child_process";

const result = spawnSync(
  "npx",
  ["tsc", "-p", "tsconfig.app.json", "--noEmit"],
  { encoding: "utf8", shell: process.platform === "win32" },
);

const output = (result.stdout || "") + (result.stderr || "");
const blocking = output
  .split("\n")
  .filter((line) => /\bTS(2304|2552)\b/.test(line));

if (blocking.length > 0) {
  console.error("\n[typecheck-strict] BLOCKING errors — undefined identifiers in JSX/TS:\n");
  for (const line of blocking) console.error("  " + line);
  console.error(
    `\n[typecheck-strict] ${blocking.length} blocking error(s). ` +
      "These would crash at runtime. Fix imports before building.\n",
  );
  process.exit(1);
}

console.log("[typecheck-strict] OK — no missing-identifier errors.");
process.exit(0);
