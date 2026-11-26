#!/usr/bin/env node
/**
 * Copy guard (CLAUDE.md "Ship's Voice", decision 2026-11-26: Clarity first).
 *
 * Fails on a short list of phrases in user-facing strings: faux-system
 * jargon that names an action or a label ("begin survey", "initialize
 * empty", "personnel file", "designation" as a label) and AI-flavoured
 * filler ("genuinely", "seamlessly", "unlock", "dive into", "elevate",
 * "whether you're", "it's not just", ...).
 *
 * Only string literals and JSX text are checked, after comments are
 * stripped, so identifiers (onInitializeEmpty, the lucide Unlock icon,
 * bg-sf-surface-elevated) never trip it. Legitimate uses go in
 * scripts/copy-allowlist.json as { "file", "phrase", "reason" }.
 *
 * Run: node scripts/check-copy.mjs   (exit 1 on violations)
 */
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join, relative } from "node:path";

const ROOT = new URL("..", import.meta.url).pathname;
const SRC = join(ROOT, "src");

/** [id, regex]. The id is what an allow-list entry names as "phrase". */
export const BANNED = [
  ["begin survey", /\bbegin (?:a )?survey\b/i],
  ["initialize empty", /\binitiali[sz]e empty\b/i],
  ["initialize new world", /\binitiali[sz]e new world\b/i],
  ["personnel file", /\bpersonnel file\b/i],
  ["instrument manifest", /\binstrument manifest\b/i],
  ["no data on file", /\bno data on file\b/i],
  ["clearance", /\b(?:pro |standard |upgrade )clearance\b|\bclearance (?:expired|unlocks|required|insufficient)\b/i],
  ["designation", /^\s*designation\s*$/i],
  ["genuinely", /\bgenuinely\b/i],
  ["seamless", /\bseamless(?:ly)?\b/i],
  ["unlock", /\bunlock(?:s|ed|ing)?\b/i],
  ["dive into", /\bdive (?:into|in)\b/i],
  ["elevate", /\belevat(?:e|es|ing)\b/i],
  ["whether you're", /\bwhether you(?:'|’)re\b/i],
  ["it's not just", /\bit(?:'|’)s not just\b/i],
  ["supercharge", /\bsupercharg(?:e|es|ed|ing)\b/i],
  ["effortless", /\beffortless(?:ly)?\b/i],
  ["game-changer", /\bgame[- ]chang(?:er|ing)\b/i],
];

/** Strip block and line comments; keep line numbers (newlines survive). */
export function stripComments(src) {
  return src
    .replace(/\/\*[\s\S]*?\*\//g, (m) => m.replace(/[^\n]/g, " "))
    .replace(/(^|[^:"'`\\])\/\/[^\n]*/g, (m, pre) => pre + " ".repeat(m.length - pre.length))
    .replace(/\{\s*\/\*[\s\S]*?\*\/\s*\}/g, (m) => m.replace(/[^\n]/g, " "));
}

/** User-facing text candidates: string literals and JSX text, with line numbers. */
export function extractStrings(src) {
  const text = stripComments(src);
  const out = [];
  const lineAt = (i) => text.slice(0, i).split("\n").length;
  const patterns = [
    /"((?:[^"\\\n]|\\.)*)"/g,
    /'((?:[^'\\\n]|\\.)*)'/g,
    /`((?:[^`\\]|\\.)*)`/g,
    />([^<>{}]*[A-Za-z][^<>{}]*)</g,
  ];
  for (const re of patterns) {
    let m;
    while ((m = re.exec(text))) {
      const value = m[1];
      if (!/[A-Za-z]{3}/.test(value)) continue;
      // Import specifiers and paths are not copy.
      if (/^[@./]/.test(value) && !/\s/.test(value)) continue;
      out.push({ value, line: lineAt(m.index) });
    }
  }
  return out;
}

export function findViolations(src) {
  const hits = [];
  for (const { value, line } of extractStrings(src)) {
    // A designation is fine as a value ("G2V"); only a bare label is banned.
    for (const [id, re] of BANNED) {
      if (re.test(value)) hits.push({ id, line, value: value.trim().slice(0, 90) });
    }
  }
  return hits;
}

function walk(dir, out = []) {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    const st = statSync(p);
    if (st.isDirectory()) {
      if (name === "__tests__" || name === "node_modules" || name === "_reference") continue;
      walk(p, out);
    } else if (/\.(tsx?|mdx)$/.test(name) && !/\.(test|spec)\.tsx?$/.test(name) && !/\.d\.ts$/.test(name)) {
      out.push(p);
    }
  }
  return out;
}

function main() {
  const allow = JSON.parse(readFileSync(join(ROOT, "scripts/copy-allowlist.json"), "utf8"));
  const allowed = (rel, id) => allow.some((a) => (rel === a.file || rel.startsWith(a.file.replace(/\*\*$/, ""))) && a.phrase === id);
  const problems = [];
  for (const file of walk(SRC)) {
    const rel = relative(ROOT, file);
    for (const hit of findViolations(readFileSync(file, "utf8"))) {
      if (!allowed(rel, hit.id)) problems.push(`${rel}:${hit.line}  "${hit.id}" in: ${hit.value}`);
    }
  }
  if (problems.length) {
    console.log(`[copy] ${problems.length} violation(s). Say what the control does in plain words (CLAUDE.md, Ship's Voice).`);
    for (const p of problems) console.log("  " + p);
    console.log("[copy] A legitimate use? Add { file, phrase, reason } to scripts/copy-allowlist.json.");
    process.exit(1);
  }
  console.log("[copy] OK: no banned phrases in user-facing strings.");
}

if (import.meta.url === `file://${process.argv[1]}`) main();
