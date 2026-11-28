#!/usr/bin/env node
/**
 * Raw-hex guard (SF-II guardrails; CLAUDE.md "Tokens, never hardcoded hex").
 *
 * A colour literal may live in exactly these places:
 *
 *   src/styles/tokens.css, themes.css   GENERATED (design/*.py)
 *   src/styles/tokens.ts                hand-kept mirror of the default theme
 *   src/lib/palettes/**                 data palettes (spectral classes, tag
 *                                       swatches, brand marks, ...)
 *   src/lib/pdf/palette.ts              the print palette
 *   test files                          fixtures assert on literal values
 *
 * Everywhere else in src/ it is a violation. Two rules:
 *
 *  1. PER-FILE RATCHET. Files that still carry hex are listed with their
 *     count in scripts/raw-hex-baseline.json. A listed file may not gain
 *     hex; an unlisted file may not have any. So a new .tsx (or .ts, .css)
 *     with a hex literal fails at once, wherever it is.
 *  2. TOTAL RATCHET. The sum is also written to .github/sf2-hex-baseline.txt
 *     (the number the old CI grep used); it may only go down.
 *
 * 3. PUBLIC SIMS (1.9, X13). The static simulators in public/tools/** and
 *    public/rogue/** (.html, .js, .css) get the same per-file ratchet against
 *    scripts/raw-hex-public-baseline.json, with its own total. Their one
 *    colour home is public/tools/_shared/sim-tokens.css (the mirror of the
 *    default theme the iframes read); everything else should take a var().
 *
 * Run:  node scripts/check-raw-hex.mjs                  (exit 1 on violations)
 *       node scripts/check-raw-hex.mjs --update-baseline  (after removing hex)
 *       node scripts/check-raw-hex.mjs --list             (print every literal)
 */
import { readFileSync, readdirSync, statSync, writeFileSync } from "node:fs";
import { dirname, join, relative, sep } from "node:path";
import { fileURLToPath } from "node:url";

// Under vitest (jsdom) import.meta.url is not a file: URL; there the repo
// root is the working directory.
const SELF = import.meta.url.startsWith("file:") ? fileURLToPath(import.meta.url) : null;
const ROOT = SELF ? join(dirname(SELF), "..") : process.cwd();
const SRC = join(ROOT, "src");
const BASELINE_JSON = join(ROOT, "scripts", "raw-hex-baseline.json");
const BASELINE_TXT = join(ROOT, ".github", "sf2-hex-baseline.txt");
const PUBLIC_BASELINE_JSON = join(ROOT, "scripts", "raw-hex-public-baseline.json");
/** Static simulator trees scanned by rule 3. */
export const PUBLIC_SIM_DIRS = ["public/tools", "public/rogue"];
/** The colour homes inside the public sim trees. */
export const PUBLIC_ALLOWED_FILES = new Set(["public/tools/_shared/sim-tokens.css"]);
const PUBLIC_EXTENSIONS = /\.(html|js|css)$/;

const EXTENSIONS = /\.(ts|tsx|css|js|jsx)$/;

/** The only homes a colour literal may have. Paths are repo-relative, POSIX. */
export const ALLOWED_FILES = new Set([
  "src/styles/tokens.css",
  "src/styles/themes.css",
  "src/styles/tokens.ts",
  "src/lib/pdf/palette.ts",
]);
export const ALLOWED_DIRS = ["src/lib/palettes/"];

export function isAllowedHome(rel) {
  if (ALLOWED_FILES.has(rel)) return true;
  if (ALLOWED_DIRS.some((d) => rel.startsWith(d))) return true;
  if (/\.test\.(ts|tsx)$/.test(rel) || rel.includes("/__tests__/")) return true;
  return false;
}

/**
 * A colour literal: # then 3, 4, 6 or 8 hex digits, not part of a longer
 * word. `&#8734;` (an HTML entity), `#section-id` anchors and `url(#veloArc)`
 * do not match: the first is preceded by `&`, the others contain non-hex
 * letters.
 */
const HEX = /(?<![&\w])#(?:[0-9a-fA-F]{8}|[0-9a-fA-F]{6}|[0-9a-fA-F]{3,4})(?![0-9a-zA-Z_-])/g;

export function countHex(text) {
  const m = text.match(HEX);
  return m ? m.length : 0;
}

function walk(dir, out = [], ext = EXTENSIONS) {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    const st = statSync(p);
    if (st.isDirectory()) {
      if (name === "node_modules") continue;
      walk(p, out, ext);
    } else if (ext.test(name)) out.push(p);
  }
  return out;
}

/** Rule 3: per-file hex counts in the static simulator trees. */
export function scanPublic(root = ROOT) {
  const counts = {};
  for (const dir of PUBLIC_SIM_DIRS) {
    let files = [];
    try {
      files = walk(join(root, dir), [], PUBLIC_EXTENSIONS);
    } catch {
      continue;
    }
    for (const file of files) {
      const rel = relative(root, file).split(sep).join("/");
      if (PUBLIC_ALLOWED_FILES.has(rel)) continue;
      const n = countHex(readFileSync(file, "utf8"));
      if (n > 0) counts[rel] = n;
    }
  }
  return counts;
}

export function scan(srcDir = SRC, root = ROOT) {
  const counts = {};
  for (const file of walk(srcDir)) {
    const rel = relative(root, file).split(sep).join("/");
    if (isAllowedHome(rel)) continue;
    const n = countHex(readFileSync(file, "utf8"));
    if (n > 0) counts[rel] = n;
  }
  return counts;
}

function sorted(obj) {
  return Object.fromEntries(Object.entries(obj).sort(([a], [b]) => a.localeCompare(b)));
}

function main() {
  const args = new Set(process.argv.slice(2));
  const counts = scan();
  const total = Object.values(counts).reduce((a, b) => a + b, 0);
  const tsx = Object.entries(counts).filter(([f]) => f.endsWith(".tsx"));
  const tsxTotal = tsx.reduce((a, [, n]) => a + n, 0);

  if (args.has("--list")) {
    for (const [file] of Object.entries(sorted(counts))) {
      readFileSync(join(ROOT, file), "utf8")
        .split("\n")
        .forEach((line, i) => {
          if (countHex(line)) console.log(`${file}:${i + 1}  ${line.trim().slice(0, 140)}`);
        });
    }
  }

  if (args.has("--update-baseline")) {
    writeFileSync(
      BASELINE_JSON,
      JSON.stringify(
        {
          _comment:
            "Per-file raw hex counts for scripts/check-raw-hex.mjs. A listed file may not gain hex; an unlisted file may have none. Counts may only go down. Regenerate with `npm run check:hex -- --update-baseline` in the PR that lowers them.",
          total,
          files: sorted(counts),
        },
        null,
        2,
      ) + "\n",
    );
    writeFileSync(BASELINE_TXT, `${total}\n`);
    const pub = scanPublic();
    const pubTotal = Object.values(pub).reduce((a, b) => a + b, 0);
    writeFileSync(
      PUBLIC_BASELINE_JSON,
      JSON.stringify(
        {
          _comment:
            "Per-file raw hex counts for the static simulators (public/tools/**, public/rogue/**), rule 3 of scripts/check-raw-hex.mjs. Counts and the total may only go down. Colours belong in public/tools/_shared/sim-tokens.css.",
          total: pubTotal,
          files: sorted(pub),
        },
        null,
        2,
      ) + "\n",
    );
    console.log(`[raw-hex] public sims baseline updated: ${pubTotal} literal(s) in ${Object.keys(pub).length} file(s).`);
    console.log(`[raw-hex] baseline updated: ${total} literal(s) in ${Object.keys(counts).length} file(s); ${tsxTotal} in .tsx.`);
    return;
  }

  const baseline = JSON.parse(readFileSync(BASELINE_JSON, "utf8"));
  const allowed = baseline.files ?? {};
  const problems = [];
  for (const [file, n] of Object.entries(counts)) {
    const cap = allowed[file] ?? 0;
    if (n > cap) {
      problems.push(
        cap === 0
          ? `${file}: ${n} raw hex literal(s). Use a token (Tailwind class, var(--sf-*), src/styles/hue.ts) or a data palette in src/lib/palettes/.`
          : `${file}: ${n} raw hex literal(s), baseline ${cap}. This file may not gain hex.`,
      );
    }
  }
  const txt = Number(readFileSync(BASELINE_TXT, "utf8").trim());
  if (total > txt) problems.push(`total ${total} exceeds .github/sf2-hex-baseline.txt (${txt}).`);

  const pub = scanPublic();
  const pubTotal = Object.values(pub).reduce((a, b) => a + b, 0);
  const pubBaseline = JSON.parse(readFileSync(PUBLIC_BASELINE_JSON, "utf8"));
  for (const [file, n] of Object.entries(pub)) {
    const cap = pubBaseline.files?.[file] ?? 0;
    if (n > cap) {
      problems.push(
        cap === 0
          ? `${file}: ${n} raw hex literal(s). Static sims take colours from public/tools/_shared/sim-tokens.css (var(--sf-*), var(--t1..t4)).`
          : `${file}: ${n} raw hex literal(s), baseline ${cap}. This file may not gain hex.`,
      );
    }
  }
  if (pubTotal > pubBaseline.total) problems.push(`public sims total ${pubTotal} exceeds scripts/raw-hex-public-baseline.json (${pubBaseline.total}).`);
  console.log(`[raw-hex] public sims: ${pubTotal} literal(s) (baseline ${pubBaseline.total}).`);

  console.log(
    `[raw-hex] ${total} literal(s) outside the allowed homes (baseline ${baseline.total}); ${tsxTotal} in .tsx across ${tsx.length} file(s).`,
  );
  if (problems.length) {
    console.log(`[raw-hex] ${problems.length} violation(s):`);
    for (const p of problems) console.log("  " + p);
    process.exit(1);
  }
  const lowered = Object.entries(allowed).filter(([f, cap]) => (counts[f] ?? 0) < cap);
  if (lowered.length || total < baseline.total || pubTotal < pubBaseline.total) {
    console.log(
      `[raw-hex] count dropped (${lowered.length} file(s)). Lock it in: npm run check:hex -- --update-baseline`,
    );
  }
}

if (SELF && process.argv[1] === SELF) main();
