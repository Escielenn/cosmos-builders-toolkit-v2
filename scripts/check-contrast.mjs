#!/usr/bin/env node
/**
 * /sf-contrast, the mechanical half (.claude/commands/sf-contrast.md,
 * docs/stellarforge/10-LEGIBILITY.md). Deterministic, no browser.
 *
 * Every rule is a regex or a tiny CSS-block parse over src/ (plus index.html
 * and tailwind.config.ts for fonts). Two modes:
 *
 *   zero     the rule has no violations today; any hit fails CI.
 *   ratchet  the rule has legacy violations. Per-file counts live in
 *            scripts/contrast-baseline.json. A file may never exceed its
 *            recorded count (a file not in the baseline has a count of 0).
 *            When a count drops, the run prints a notice: lower the
 *            baseline in the same PR (`--update-baseline`).
 *
 * Not covered here (need a renderer or judgement): measured pairs (#5),
 * hit targets (#7), unbounded measure (#9), ungated ambient (#10),
 * colour-only signalling (#11), role-token misuse (#12). Run the
 * /sf-contrast command for those.
 *
 * Run:  node scripts/check-contrast.mjs                 (exit 1 on violation)
 *       node scripts/check-contrast.mjs --update-baseline
 *       node scripts/check-contrast.mjs --list <rule>   (print every hit)
 *       node scripts/check-contrast.mjs --no-drift      (skip the python drift check)
 */
import { readFileSync, readdirSync, statSync, writeFileSync, mkdtempSync, copyFileSync, rmSync, existsSync } from "node:fs";
import { join, relative, extname, dirname } from "node:path";
import { tmpdir } from "node:os";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

// Under vitest (jsdom) import.meta.url is not a file: URL; tests only use the pure exports.
const SELF = import.meta.url.startsWith("file:") ? fileURLToPath(import.meta.url) : null;
const ROOT = SELF ? join(dirname(SELF), "..") : process.cwd();
const BASELINE_PATH = join(ROOT, "scripts/contrast-baseline.json");

// Generated token sources: they DEFINE every token, so they are never scanned.
export const GENERATED = new Set(["src/styles/tokens.css", "src/styles/themes.css", "src/styles/tokens.ts"]);

// shadcn primitives not yet migrated to zero radius. They may keep the
// preserved radius scale (rounded-xs/sm/md/lg, see tailwind.config.ts);
// anything else on them (rounded-full, rounded-xl, ...) still counts.
export const SHADCN_RADIUS_ALLOW = [
  "accordion", "alert-dialog", "alert", "avatar", "badge", "button", "calendar", "card",
  "checkbox", "command", "context-menu", "dialog", "dropdown-menu", "form", "input",
  "navigation-menu", "pagination", "popover", "progress", "radio-group", "scroll-area",
  "select", "separator", "sheet", "sidebar", "skeleton", "slider", "switch", "table",
  "tabs", "textarea", "toast", "toggle-group", "toggle", "tooltip",
].map((n) => `src/components/ui/${n}.tsx`);

// ---------------------------------------------------------------- helpers

const isComment = (line) => /^\s*(\/\/|\*|\/\*|\{\s*\/\*)/.test(line);
const isCss = (rel) => extname(rel) === ".css";
const isCode = (rel) => /\.(tsx?|jsx?)$/.test(rel);

/**
 * The file with everything except string-literal contents blanked out
 * (newlines kept, so line numbers hold). Tailwind classes only live in
 * strings, so class rules run over this and never over identifiers
 * (`const rounded = Math.round(...)`) or comments. Template literals may
 * span lines and nest `${ ... "string" ... }`; quoted strings end at a
 * newline, so an apostrophe in JSX text cannot swallow the file.
 */
export function stringMask(text) {
  const out = new Array(text.length);
  const stack = []; // "code" | "`" | "'" | '"'  (top = current mode)
  let mode = "code";
  let braceDepth = [];
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    const n = text[i + 1];
    if (mode === "code") {
      out[i] = c === "\n" ? "\n" : " ";
      if (c === "/" && n === "/") {
        while (i < text.length && text[i] !== "\n") out[i++] = " ";
        if (i < text.length) out[i] = "\n";
      } else if (c === "/" && n === "*") {
        out[i + 1] = " ";
        i += 2;
        while (i < text.length && !(text[i] === "*" && text[i + 1] === "/")) { out[i] = text[i] === "\n" ? "\n" : " "; i++; }
        if (i < text.length) { out[i] = " "; out[i + 1] = " "; i++; }
      } else if (c === "'" || c === '"' || c === "`") {
        stack.push(mode);
        mode = c;
      } else if (c === "{") {
        if (braceDepth.length) braceDepth[braceDepth.length - 1]++;
      } else if (c === "}") {
        if (braceDepth.length) {
          if (braceDepth[braceDepth.length - 1] === 0) { braceDepth.pop(); mode = stack.pop() ?? "code"; out[i] = " "; }
          else braceDepth[braceDepth.length - 1]--;
        }
      }
      continue;
    }
    // inside a string
    if (c === "\\") { out[i] = " "; if (i + 1 < text.length) out[++i] = text[i] === "\n" ? "\n" : " "; continue; }
    if (c === "\n") {
      out[i] = "\n";
      if (mode !== "`") mode = stack.pop() ?? "code";
      continue;
    }
    if (c === mode) { out[i] = " "; mode = stack.pop() ?? "code"; continue; }
    if (mode === "`" && c === "$" && n === "{") {
      out[i] = " "; out[i + 1] = " "; i++;
      stack.push(mode);
      braceDepth.push(0);
      mode = "code";
      continue;
    }
    out[i] = c;
  }
  return out.join("");
}

let maskCache = { text: null, lines: null };
function maskedLines(text) {
  if (maskCache.text !== text) maskCache = { text, lines: stringMask(text).split("\n") };
  return maskCache.lines;
}

/** Pixel size of a CSS length, or null when it cannot be resolved statically. */
export function toPx(num, unit) {
  const n = parseFloat(num);
  if (Number.isNaN(n)) return null;
  if (unit === "px") return n;
  if (unit === "rem" || unit === "em") return n * 16;
  return null;
}

/** True when a CSS colour value carries alpha. `transparent` is layout, not a line. */
export function hasAlpha(value) {
  return /\brgba\(|\bhsla\(|\/\s*(?:0?\.\d+|\d{1,2}%)\s*\)|\brgb\(\s*\d[^)]*,[^)]*,[^)]*,/.test(value)
    || /#[0-9a-f]{8}\b|#[0-9a-f]{4}\b/i.test(value);
}

/** Innermost CSS rule blocks: { selector, body, line }. Good enough for lint. */
export function cssBlocks(text) {
  const out = [];
  const stripped = text.replace(/\/\*[\s\S]*?\*\//g, (m) => m.replace(/[^\n]/g, " "));
  const re = /([^{}]+)\{([^{}]*)\}/g;
  let m;
  while ((m = re.exec(stripped))) {
    const lead = m[1].length - m[1].trimStart().length;
    const line = stripped.slice(0, m.index + lead).split("\n").length;
    out.push({ selector: m[1].trim(), body: m[2], line });
  }
  return out;
}

const TW_PREFIX = String.raw`(?<![\w\-/\[])(?:[\w\-\[\]&=:"'.]+:)*`;
const RE = {
  twAlphaBorder: new RegExp(TW_PREFIX + String.raw`(?:border|outline|divide)(?:-[trblxyse])?-(?!opacity\b)[a-z][\w-]*\/(?:\d+|\[[^\]]+\])`, "g"),
  twArbitraryAlphaBorder: new RegExp(TW_PREFIX + String.raw`(?:border|outline|divide)(?:-[trblxyse])?-\[(?:rgba|hsla|rgb|hsl)\([^\]]*\]`, "g"),
  cssBorderDecl: /(?:^|[;{\s])((?:border(?:-(?:top|right|bottom|left|block|inline)(?:-(?:start|end))?)?(?:-color)?|outline(?:-color)?)\s*:\s*([^;}]*))/g,
  jsBorderDecl: /\b((?:border|outline)\w*)\s*:\s*[`'"]([^`'"]*)[`'"]/g,
  twOpacityVariant: new RegExp(String.raw`(?<![\w\-/\[])(?:[\w-]+:)*(?:disabled|aria-disabled|group-disabled|peer-disabled|data-disabled|data-\[disabled(?:=[^\]]*)?\]|aria-\[disabled(?:=[^\]]*)?\]):(?:[\w-]+:)*opacity-[\w.\[\]]+`, "g"),
  conditionalOpacity: /\b(?:disabled|isDisabled|locked|isLocked)\b[^;\n]{0,80}?\?\s*[`'"][^`'"]*\bopacity-(?:\d{1,2}|\[0?\.\d+\])(?![\w.])/g,
  retiredT5: /(?<![\w-])(?:[\w-]+:)*(?:text|bg|border|ring|fill|stroke|from|to|via|divide|outline|decoration|placeholder)-t5(?![\w-])|var\(--t5\)|--t5\s*:/g,
  retiredBorderToken: /(?<![\w])(?:[\w-]+-)?sf-border(?:-strong)?(?![\w-])/g,
  twSmallText: /(?<![\w-])(?:[\w-]+:)*text-\[(\d*\.?\d+)(px|rem|em)\]/g,
  twTracking: /(?<![\w-])(?:[\w-]+:)*tracking-(?!normal\b)[\w.\[\]-]+/,
  legacyCyanHex: /#00D4FF\b|0x00D4FF\b|(?:^|[^\d.])0\s*,\s*212\s*,\s*255(?!\d)/gi,
  sfCyan: /\bsf-cyan\b/g,
  glowCyan: /\bglow-cyan\b/g,
  glowCyanDefinition: /["']glow-cyan["']\s*:|--sf-glow-cyan\s*:|^\s*["']?glow-cyan["']?\s*:/,
  // Ownership pattern from the /sf-contrast check 14 text.
  check14: /^--(?:sf-(?:void|surface|teal|amber|crimson|stellar|violet|cyan|emerald|azure|magenta|line|focus|primary)[a-z-]*|t[1-4])$/,
  twRounded: /(?<![\w-])(?:[\w\-\[\]&=:]+:)*rounded(?:-(?:t|r|b|l|tl|tr|bl|br|s|e|ss|se|es|ee))?(?:-(\[[^\]]+\]|[a-z0-9-]+))?(?![\w-])/g,
  cssRadius: /border(?:-(?:top|bottom|start|end)-(?:left|right|start|end))?-radius\s*:\s*([^;}]+)/g,
  jsRadius: /\bborder\w*Radius\s*:\s*([^,}\n]+)/g,
  bannedFont: /["'`]Inter["'`]|\bfont-inter\b|family=Inter\b|font-family\s*:[^;]*\bInter\b|Space[ +]Grotesk|space-grotesk/gi,
  twFocusNone: /(?<![\w-])focus:outline-none(?![\w-])/,
};

const zeroRadius = (v) => /^\s*(?:0(?:px|rem|em)?|none|var\(--radius\)|inherit|initial|unset)\s*(?:!important)?\s*$/.test(v);

// ---------------------------------------------------------------- rules

/**
 * Each rule: scan(rel, text) -> [{ line, match }]. `files(rel)` limits scope.
 */
export const RULES = [
  {
    id: "alpha-border",
    title: "ALPHA BORDERS",
    check: "#1",
    mode: "ratchet",
    files: (rel) => rel.startsWith("src/"),
    scan(rel, text) {
      const hits = [];
      const lines = text.split("\n");
      lines.forEach((line, i) => {
        if (isComment(line)) return;
        if (isCode(rel)) {
          const strs = maskedLines(text)[i];
          for (const re of [RE.twAlphaBorder, RE.twArbitraryAlphaBorder]) {
            for (const m of strs.matchAll(re)) hits.push({ line: i + 1, match: m[0] });
          }
          for (const m of line.matchAll(RE.jsBorderDecl)) {
            if (hasAlpha(m[2])) hits.push({ line: i + 1, match: m[0] });
          }
        }
        if (isCss(rel)) {
          for (const m of line.matchAll(RE.cssBorderDecl)) {
            if (hasAlpha(m[2])) hits.push({ line: i + 1, match: m[1].trim() });
          }
        }
      });
      return hits;
    },
  },
  {
    id: "opacity-state",
    title: "OPACITY STATES",
    check: "#2",
    mode: "zero",
    files: (rel) => rel.startsWith("src/"),
    scan(rel, text) {
      const hits = [];
      if (isCode(rel)) {
        text.split("\n").forEach((line, i) => {
          if (isComment(line)) return;
          for (const m of maskedLines(text)[i].matchAll(RE.twOpacityVariant)) hits.push({ line: i + 1, match: m[0] });
          for (const m of line.matchAll(RE.conditionalOpacity)) hits.push({ line: i + 1, match: m[0] });
        });
      }
      if (isCss(rel)) {
        for (const b of cssBlocks(text)) {
          if (!/disabled/.test(b.selector)) continue;
          const o = /(?:^|[;\s])opacity\s*:\s*([\d.]+)/.exec(b.body);
          if (o && parseFloat(o[1]) < 1) hits.push({ line: b.line, match: `${b.selector} { opacity: ${o[1]} }` });
        }
      }
      return hits;
    },
  },
  {
    id: "retired-token",
    title: "RETIRED TOKENS IN USE",
    check: "#3",
    mode: "zero",
    files: (rel) => rel.startsWith("src/"),
    scan(rel, text) {
      const hits = [];
      text.split("\n").forEach((line, i) => {
        if (isComment(line)) return;
        for (const m of line.matchAll(RE.retiredT5)) hits.push({ line: i + 1, match: m[0] });
        for (const m of line.matchAll(RE.retiredBorderToken)) hits.push({ line: i + 1, match: m[0] });
      });
      return hits;
    },
  },
  {
    id: "tracked-small-text",
    title: "TRACKED SMALL TEXT",
    check: "#8",
    mode: "ratchet",
    files: (rel) => rel.startsWith("src/"),
    scan(rel, text) {
      // text-xs is 13px in this config (tailwind.config.ts), so only
      // arbitrary sizes under 12px count.
      const hits = [];
      if (isCode(rel)) {
        text.split("\n").forEach((line, i) => {
          if (isComment(line)) return;
          const strs = maskedLines(text)[i];
          if (!RE.twTracking.test(strs)) return;
          for (const m of strs.matchAll(RE.twSmallText)) {
            const px = toPx(m[1], m[2]);
            if (px !== null && px < 12) hits.push({ line: i + 1, match: `${m[0]} + ${strs.match(RE.twTracking)[0]}` });
          }
        });
      }
      if (isCss(rel)) {
        for (const b of cssBlocks(text)) {
          const fs = /(?:^|[;\s])font-size\s*:\s*(\d*\.?\d+)(px|rem|em)\b/.exec(b.body);
          const ls = /(?:^|[;\s])letter-spacing\s*:\s*([^;]+)/.exec(b.body);
          if (!fs || !ls) continue;
          const px = toPx(fs[1], fs[2]);
          const spacing = ls[1].trim();
          if (px !== null && px < 12 && !/^(?:0(?:[a-z%]*)?|normal)$/.test(spacing)) {
            hits.push({ line: b.line, match: `${b.selector} { font-size: ${fs[1]}${fs[2]}; letter-spacing: ${spacing} }` });
          }
        }
      }
      return hits;
    },
  },
  {
    id: "legacy-cyan",
    title: "LEGACY CYAN",
    check: "SF-II #3",
    mode: "zero",
    files: (rel) => rel.startsWith("src/") || rel === "index.html",
    scan(rel, text) {
      const hits = [];
      text.split("\n").forEach((line, i) => {
        for (const m of line.matchAll(RE.legacyCyanHex)) hits.push({ line: i + 1, match: m[0].trim() });
        if (isComment(line)) return;
        for (const m of line.matchAll(RE.sfCyan)) hits.push({ line: i + 1, match: m[0] });
        if (!RE.glowCyanDefinition.test(line)) {
          for (const m of line.matchAll(RE.glowCyan)) hits.push({ line: i + 1, match: m[0] });
        }
      });
      return hits;
    },
  },
  {
    id: "parallel-truth",
    title: "PARALLEL TRUTH",
    check: "#14",
    mode: "zero",
    files: (rel) => rel.startsWith("src/") && isCss(rel),
    scan(rel, text, ctx) {
      const hits = [];
      const stripped = text.replace(/\/\*[\s\S]*?\*\//g, (m) => m.replace(/[^\n]/g, " "));
      stripped.split("\n").forEach((line, i) => {
        for (const def of line.matchAll(/(?:^|[;{\s])(--[\w-]+)\s*:/g)) {
          if (RE.check14.test(def[1]) || ctx.ownedTokens.has(def[1])) hits.push({ line: i + 1, match: def[1] });
        }
      });
      return hits;
    },
  },
  {
    id: "radius",
    title: "NON-ZERO RADIUS",
    check: "zero radius",
    mode: "ratchet",
    files: (rel) => rel.startsWith("src/"),
    scan(rel, text) {
      const hits = [];
      const shadcn = SHADCN_RADIUS_ALLOW.includes(rel);
      text.split("\n").forEach((line, i) => {
        if (isComment(line)) return;
        if (isCode(rel)) {
          for (const m of maskedLines(text)[i].matchAll(RE.twRounded)) {
            const size = m[1];
            if (size === "none" || size === "sf-tag") continue;
            if (shadcn && ["xs", "sm", "md", "lg"].includes(size)) continue;
            hits.push({ line: i + 1, match: m[0] });
          }
          for (const m of line.matchAll(RE.jsRadius)) {
            const v = m[1].trim().replace(/^[`'"]|[`'"]$/g, "");
            if (!/^0(?:px)?$/.test(v) && v !== "none") hits.push({ line: i + 1, match: m[0].trim() });
          }
        }
        if (isCss(rel)) {
          for (const m of line.matchAll(RE.cssRadius)) {
            if (!zeroRadius(m[1])) hits.push({ line: i + 1, match: m[0].trim() });
          }
        }
      });
      return hits;
    },
  },
  {
    id: "banned-font",
    title: "BANNED FONTS (INTER, SPACE GROTESK)",
    check: "type",
    mode: "zero",
    files: (rel) => rel.startsWith("src/") || rel === "index.html" || rel === "tailwind.config.ts",
    scan(rel, text) {
      const hits = [];
      text.split("\n").forEach((line, i) => {
        if (isComment(line)) return;
        for (const m of line.matchAll(RE.bannedFont)) hits.push({ line: i + 1, match: m[0] });
      });
      return hits;
    },
  },
  {
    id: "focus-suppressed",
    title: "MISSING FOCUS RINGS",
    check: "#6",
    mode: "ratchet",
    files: (rel) => rel.startsWith("src/"),
    scan(rel, text) {
      const hits = [];
      if (isCode(rel)) {
        text.split("\n").forEach((line, i) => {
          if (isComment(line)) return;
          const strs = maskedLines(text)[i];
          if (RE.twFocusNone.test(strs) && !/focus-visible:|focus:ring|focus:border|focus:shadow|focus-within:/.test(strs)) {
            hits.push({ line: i + 1, match: "focus:outline-none" });
          }
        });
      }
      if (isCss(rel)) {
        for (const b of cssBlocks(text)) {
          if (!/:focus-visible/.test(b.selector)) continue;
          if (/(?:^|[;\s])outline\s*:\s*(?:none|0)\b/.test(b.body) && !/box-shadow|border-color|outline-offset/.test(b.body)) {
            hits.push({ line: b.line, match: `${b.selector} { outline: none }` });
          }
        }
      }
      return hits;
    },
  },
];

// ---------------------------------------------------------------- scan

export function ownedTokensFrom(texts) {
  const owned = new Set();
  for (const t of texts) for (const m of t.matchAll(/(--[\w-]+)\s*:/g)) owned.add(m[1]);
  return owned;
}

/** Run every rule over one file. Returns { ruleId: hits[] } (empty rules omitted). */
export function scanFile(rel, text, ctx) {
  const out = {};
  if (GENERATED.has(rel)) return out;
  for (const rule of RULES) {
    if (!rule.files(rel)) continue;
    const hits = rule.scan(rel, text, ctx);
    if (hits.length) out[rule.id] = hits;
  }
  return out;
}

/**
 * Compare per-file counts against the baseline.
 * Returns { failures: [{rule, file, count, allowed}], drops: [...] }.
 */
export function compare(results, baseline) {
  const failures = [];
  const drops = [];
  for (const rule of RULES) {
    const counts = {};
    for (const [file, byRule] of Object.entries(results)) {
      if (byRule[rule.id]) counts[file] = byRule[rule.id].length;
    }
    const allowedMap = rule.mode === "zero" ? {} : (baseline?.rules?.[rule.id] ?? {});
    for (const [file, count] of Object.entries(counts)) {
      const allowed = allowedMap[file] ?? 0;
      if (count > allowed) failures.push({ rule: rule.id, file, count, allowed });
    }
    for (const [file, allowed] of Object.entries(allowedMap)) {
      const count = counts[file] ?? 0;
      if (count < allowed) drops.push({ rule: rule.id, file, count, allowed });
    }
  }
  return { failures, drops };
}

function walk(dir, out = []) {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    const st = statSync(p);
    if (st.isDirectory()) {
      if (name === "__tests__" || name === "node_modules" || name === "test") continue;
      walk(p, out);
    } else if (/\.(tsx?|jsx?|css)$/.test(name) && !/\.(test|spec)\.[jt]sx?$/.test(name)) out.push(p);
  }
  return out;
}

/** Generated-file drift (#13): re-run the generators in a temp dir and diff. */
function checkDrift() {
  const py = spawnSync("python3", ["--version"]);
  if (py.status !== 0) return { skipped: "python3 not found" };
  const dir = mkdtempSync(join(tmpdir(), "sf-contrast-"));
  try {
    for (const f of readdirSync(join(ROOT, "design"))) {
      if (/\.(py|json)$/.test(f)) copyFileSync(join(ROOT, "design", f), join(dir, f));
    }
    for (const script of ["derive.py", "emit.py", "themes.py"]) {
      const r = spawnSync("python3", [script], { cwd: dir, encoding: "utf8" });
      if (r.status !== 0) return { error: `${script} failed: ${r.stderr.slice(0, 400)}` };
    }
    const pairs = [
      ["tokens.css", "src/styles/tokens.css"],
      ["themes.css", "src/styles/themes.css"],
      ["themes.json", "src/styles/themes.json"],
      ["tailwind.config.ts", "tailwind.config.ts"],
    ];
    const drifted = pairs
      .filter(([gen, live]) => existsSync(join(ROOT, live)))
      .filter(([gen, live]) => readFileSync(join(dir, gen), "utf8") !== readFileSync(join(ROOT, live), "utf8"))
      .map(([, live]) => live);
    return { drifted };
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}

function main(argv) {
  const update = argv.includes("--update-baseline");
  const listIdx = argv.indexOf("--list");
  const listRule = listIdx >= 0 ? argv[listIdx + 1] : null;
  const files = [...walk(join(ROOT, "src")), join(ROOT, "index.html"), join(ROOT, "tailwind.config.ts")];
  const ctx = {
    ownedTokens: ownedTokensFrom(
      ["src/styles/tokens.css", "src/styles/themes.css"].map((f) => readFileSync(join(ROOT, f), "utf8")),
    ),
  };

  const results = {};
  for (const file of files) {
    const rel = relative(ROOT, file).split("\\").join("/");
    const byRule = scanFile(rel, readFileSync(file, "utf8"), ctx);
    if (Object.keys(byRule).length) results[rel] = byRule;
  }

  if (listRule) {
    for (const [file, byRule] of Object.entries(results)) {
      for (const h of byRule[listRule] ?? []) console.log(`${file}:${h.line}  ${h.match}`);
    }
    return 0;
  }

  if (update) {
    const rules = {};
    for (const rule of RULES) {
      if (rule.mode !== "ratchet") continue;
      rules[rule.id] = {};
      for (const [file, byRule] of Object.entries(results).sort(([a], [b]) => a.localeCompare(b))) {
        if (byRule[rule.id]) rules[rule.id][file] = byRule[rule.id].length;
      }
    }
    const zeroViolations = RULES.filter((r) => r.mode === "zero").flatMap((r) =>
      Object.entries(results).filter(([, b]) => b[r.id]).map(([f]) => `${r.id} ${f}`));
    if (zeroViolations.length) {
      console.log("ZERO-TOLERANCE RULES IN VIOLATION. BASELINE NOT WRITTEN.");
      zeroViolations.forEach((v) => console.log("  " + v));
      return 1;
    }
    const doc = {
      _comment: "Per-file legacy violation counts for scripts/check-contrast.mjs ratchet rules. Counts may only go down. Regenerate with `npm run check:contrast -- --update-baseline` in the PR that lowers them.",
      rules,
    };
    writeFileSync(BASELINE_PATH, JSON.stringify(doc, null, 2) + "\n");
    console.log("BASELINE WRITTEN. scripts/contrast-baseline.json");
    return 0;
  }

  const baseline = existsSync(BASELINE_PATH) ? JSON.parse(readFileSync(BASELINE_PATH, "utf8")) : { rules: {} };
  const { failures, drops } = compare(results, baseline);
  const drift = argv.includes("--no-drift") ? { skipped: "--no-drift" } : checkDrift();

  const date = new Date().toISOString().slice(0, 10);
  console.log(`// CONTRAST AUDIT · ${date}\n`);
  for (const rule of RULES) {
    const total = Object.values(results).reduce((n, b) => n + (b[rule.id]?.length ?? 0), 0);
    const allowed = rule.mode === "zero" ? 0 : Object.values(baseline.rules?.[rule.id] ?? {}).reduce((n, c) => n + c, 0);
    const tag = rule.mode === "zero" ? "ZERO" : `BASELINE ${allowed}`;
    console.log(`${rule.title.padEnd(38)}${String(total).padStart(5)}   ${tag.padEnd(14)} ${rule.check}`);
  }
  const driftLine = drift.skipped ? `SKIPPED (${drift.skipped})` : drift.error ? "ERROR" : String(drift.drifted.length);
  console.log(`${"GENERATED FILE DRIFT".padEnd(38)}${driftLine.padStart(5)}   ZERO           #13`);

  let failed = failures.length > 0;
  if (failures.length) {
    console.log("\n// FINDINGS");
    for (const f of failures) {
      console.log(`[blocking] ${f.file} · ${f.rule} · ${f.count} found, ${f.allowed} allowed`);
      for (const h of results[f.file][f.rule]) console.log(`    ${f.file}:${h.line}  ${h.match}`);
    }
  }
  if (drift.error) {
    failed = true;
    console.log(`\n[blocking] GENERATOR FAILURE. ${drift.error}`);
  } else if (drift.drifted?.length) {
    failed = true;
    console.log("\n[blocking] GENERATED FILE DRIFT. Hand-edited or stale. Re-run design/derive.py, emit.py, themes.py and copy the output:");
    drift.drifted.forEach((d) => console.log(`    ${d}`));
  }
  if (drops.length) {
    console.log("\n// RATCHET CAN TIGHTEN. Run `npm run check:contrast -- --update-baseline` and commit:");
    for (const d of drops) console.log(`    ${d.rule} ${d.file}: ${d.allowed} -> ${d.count}`);
  }
  console.log(failed ? "\nCONTRAST AUDIT FAILED." : "\nCONTRAST AUDIT CLEAR.");
  return failed ? 1 : 0;
}

if (SELF && process.argv[1] === SELF) {
  process.exit(main(process.argv.slice(2)));
}
