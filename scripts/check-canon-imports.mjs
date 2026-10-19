#!/usr/bin/env node
/**
 * Constitution guard (CLAUDE.md "Non-negotiables", 00-CONSTITUTION.md):
 * all world data reads and writes go through src/canon/ (or the hooks and
 * services that predate it). A component or page that imports the Supabase
 * client directly is a violation.
 *
 * Scope: src/components/** and src/pages/** (tests excluded; they mock
 * the client). Everything else (src/canon, src/services, src/hooks,
 * src/lib, src/contexts, src/integrations) is the data layer and is not
 * checked.
 *
 * ALLOW: areas whose Supabase use is not world data (auth, admin, billing,
 * contact, the account/profile/avatar surfaces). Listed below with reasons.
 *
 * Ratchet: scripts/canon-imports-baseline.json lists the components and
 * pages that imported the client when the guard landed. They pass; any
 * other file fails. When a listed file is migrated onto a hook/service the
 * run prints a notice: delete its line in the same PR.
 *
 * Run:  node scripts/check-canon-imports.mjs                  (exit 1 on violation)
 *       node scripts/check-canon-imports.mjs --update-baseline
 */
import { readFileSync, readdirSync, statSync, writeFileSync, existsSync } from "node:fs";
import { join, relative, dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

// Under vitest (jsdom) import.meta.url is not a file: URL; tests only use the pure exports.
const SELF = import.meta.url.startsWith("file:") ? fileURLToPath(import.meta.url) : null;
const ROOT = SELF ? join(dirname(SELF), "..") : process.cwd();
const BASELINE_PATH = join(ROOT, "scripts/canon-imports-baseline.json");
export const SCOPES = ["src/components/", "src/pages/"];

/** Non-world-data surfaces that may talk to Supabase directly. */
export const ALLOW = [
  { path: "src/components/auth/", why: "sign-in, sign-up, session (supabase.auth)" },
  { path: "src/pages/Auth.tsx", why: "sign-in page (supabase.auth)" },
  { path: "src/pages/ResetPassword.tsx", why: "password reset (supabase.auth)" },
  { path: "src/pages/NotionCallback.tsx", why: "OAuth callback, integration tokens" },
  { path: "src/components/admin/", why: "operator console, not a writer's world" },
  { path: "src/pages/Admin.tsx", why: "operator console" },
  { path: "src/pages/dev/", why: "dev-only diagnostics, not routed in production" },
  { path: "src/components/subscription/", why: "Stripe billing and plan state" },
  { path: "src/pages/Pricing.tsx", why: "Stripe checkout" },
  { path: "src/components/contact/", why: "contact form submissions" },
  { path: "src/pages/Contact.tsx", why: "contact form" },
  { path: "src/components/account/", why: "account-level data (export, deletion)" },
  { path: "src/components/settings/AccountDataSettings.tsx", why: "account export / delete-account function" },
  { path: "src/components/settings/SettingsDialog.tsx", why: "profile avatar storage" },
  { path: "src/pages/Profile.tsx", why: "profile and avatar storage" },
];

const CLIENT_SPEC = /(?:^|\/)integrations\/supabase\/client(?:\.ts)?$/;

/** Module specifiers imported by a file (static, re-export, dynamic). */
export function importSpecifiers(text) {
  const specs = [];
  const re = /\b(?:import|export)\s+(?:type\s+)?(?:[\w*{}\s,]+\s+from\s+)?["']([^"']+)["']|\bimport\(\s*["']([^"']+)["']\s*\)/g;
  for (const m of text.matchAll(re)) {
    // `import type { X } from` carries no runtime client.
    if (/^\s*import\s+type\b/.test(m[0])) continue;
    specs.push(m[1] ?? m[2]);
  }
  return specs;
}

/** True when the file (at repo-relative path rel) imports the Supabase client. */
export function importsClient(rel, text) {
  return importSpecifiers(text).some((spec) => {
    if (spec.startsWith("@/")) return CLIENT_SPEC.test("src/" + spec.slice(2));
    if (spec.startsWith(".")) return CLIENT_SPEC.test(join(dirname(rel), spec).split("\\").join("/"));
    return false;
  });
}

export const inScope = (rel) =>
  SCOPES.some((s) => rel.startsWith(s)) && !/\/__tests__\/|\.(test|spec)\.[jt]sx?$/.test(rel);
export const allowed = (rel) => ALLOW.some((a) => (a.path.endsWith("/") ? rel.startsWith(a.path) : rel === a.path));

/** { violations, stale } given the offending files and the baseline list. */
export function evaluate(offenders, baseline) {
  const base = new Set(baseline);
  const violations = offenders.filter((f) => !allowed(f) && !base.has(f));
  const now = new Set(offenders);
  const stale = baseline.filter((f) => !now.has(f));
  return { violations, stale };
}

function walk(dir, out = []) {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) walk(p, out);
    else if (/\.(tsx?|jsx?)$/.test(name)) out.push(p);
  }
  return out;
}

function main(argv) {
  const offenders = [];
  for (const scope of SCOPES) {
    const dir = resolve(ROOT, scope);
    if (!existsSync(dir)) continue;
    for (const file of walk(dir)) {
      const rel = relative(ROOT, file).split("\\").join("/");
      if (!inScope(rel)) continue;
      if (importsClient(rel, readFileSync(file, "utf8"))) offenders.push(rel);
    }
  }
  offenders.sort();

  if (argv.includes("--update-baseline")) {
    const doc = {
      _comment: "Components/pages that imported @/integrations/supabase/client when scripts/check-canon-imports.mjs landed. Shrink only: move the query into src/canon, a hook, or a service and delete the line.",
      files: offenders.filter((f) => !allowed(f)),
    };
    writeFileSync(BASELINE_PATH, JSON.stringify(doc, null, 2) + "\n");
    console.log(`BASELINE WRITTEN. ${doc.files.length} FILES ON FILE.`);
    return 0;
  }

  const baseline = existsSync(BASELINE_PATH) ? JSON.parse(readFileSync(BASELINE_PATH, "utf8")).files : [];
  const { violations, stale } = evaluate(offenders, baseline);
  const allowedHits = offenders.filter(allowed);

  console.log("// CANON IMPORT GUARD\n");
  console.log(`${"DIRECT CLIENT IMPORTS".padEnd(30)}${String(offenders.length).padStart(4)}`);
  console.log(`${"ALLOW-LISTED (NOT WORLD DATA)".padEnd(30)}${String(allowedHits.length).padStart(4)}`);
  console.log(`${"LEGACY (BASELINE)".padEnd(30)}${String(baseline.length - stale.length).padStart(4)}`);
  console.log(`${"NEW VIOLATIONS".padEnd(30)}${String(violations.length).padStart(4)}`);

  if (violations.length) {
    console.log("\n// FINDINGS");
    for (const v of violations) {
      console.log(`[blocking] ${v} · imports @/integrations/supabase/client · route world data through src/canon (canon.facts/assert) or a hook/service`);
    }
  }
  if (stale.length) {
    console.log("\n// RATCHET CAN TIGHTEN. Remove from scripts/canon-imports-baseline.json:");
    stale.forEach((s) => console.log(`    ${s}`));
  }
  console.log(violations.length ? "\nCANON GUARD FAILED." : "\nCANON GUARD CLEAR.");
  return violations.length ? 1 : 0;
}

if (SELF && process.argv[1] === SELF) {
  process.exit(main(process.argv.slice(2)));
}
