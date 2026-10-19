// ---------------------------------------------------------------------------
// SEO route policy: one place that decides what a crawler may index, what the
// canonical URL of a route is, and which routes the sitemap lists.
//
// Pure functions only. `RouteSeo` (components/common) applies canonicalUrl and
// robotsForPath on every navigation; scripts/generate-sitemap.ts writes
// public/sitemap.xml from sitemapPaths + buildSitemapXml, and a test keeps the
// committed file in step with this module.
// ---------------------------------------------------------------------------

import {
  FREE_TOOL_IDS,
  SIMULATOR_TOOL_IDS,
  TOOL_ROUTES,
  getToolAccess,
} from "@/lib/tools-config";

export const SITE_ORIGIN = "https://stellarforge.tools";

/**
 * Absolute canonical URL for a path. Query and hash are dropped, duplicate
 * and trailing slashes collapse, and the origin is always the production
 * https host so preview deployments never claim to be canonical.
 */
export function canonicalUrl(pathOrUrl: string): string {
  let path = pathOrUrl.trim();
  // Accept a full URL as well as a path.
  const schemeMatch = /^[a-z][a-z0-9+.-]*:\/\/[^/?#]*/i.exec(path);
  if (schemeMatch) path = path.slice(schemeMatch[0].length);
  path = path.split("#")[0].split("?")[0];
  if (!path.startsWith("/")) path = `/${path}`;
  path = path.replace(/\/{2,}/g, "/");
  if (path.length > 1) path = path.replace(/\/+$/, "");
  return `${SITE_ORIGIN}${path}`;
}

/**
 * Private surfaces: account, auth, admin, token links and the writer's own
 * worlds and manuscripts. Matched as a path prefix on a segment boundary.
 */
const NOINDEX_PREFIXES = [
  "/auth", // includes /auth/reset
  "/profile",
  "/admin",
  "/share",
  "/invite",
  "/join",
  "/api",
  "/dev",
  "/studio",
  "/write",
  "/collection",
  "/archive",
  "/commendations",
] as const;

export const NOINDEX_ROBOTS = "noindex, nofollow";

function matchesPrefix(path: string, prefix: string): boolean {
  return path === prefix || path.startsWith(`${prefix}/`);
}

/**
 * The robots directive for a path, or null when the default (index) applies.
 * /worlds and everything under it is private except a world's public
 * showcase page.
 */
export function robotsForPath(pathOrUrl: string): string | null {
  const path = new URL(canonicalUrl(pathOrUrl)).pathname;
  if (NOINDEX_PREFIXES.some((p) => matchesPrefix(path, p))) return NOINDEX_ROBOTS;
  if (matchesPrefix(path, "/worlds")) {
    return /^\/worlds\/[^/]+\/showcase$/.test(path) ? null : NOINDEX_ROBOTS;
  }
  return null;
}

/**
 * Public pages with content a logged-out visitor (and a crawler) can read.
 * Pro tool routes are deliberately absent: logged out they render only the
 * RESTRICTED INSTRUMENT lock screen. Their Science pages are public and are
 * added below.
 */
export const STATIC_PUBLIC_PATHS = [
  "/",
  "/about",
  "/bookshelf",
  "/changelog",
  "/community",
  "/contact",
  "/credits",
  "/features",
  "/getting-started",
  "/guide",
  "/guide/field-manual",
  "/guide/tools",
  "/learn",
  "/pricing",
  "/privacy",
  "/prompts",
  "/roadmap",
  "/terms",
] as const;

/** Every path the sitemap lists, sorted, without duplicates. */
export function sitemapPaths(learnSlugs: readonly string[] = []): string[] {
  const paths = new Set<string>(STATIC_PUBLIC_PATHS);

  // Free tools render their full worksheet logged out.
  for (const id of FREE_TOOL_IDS) {
    const route = TOOL_ROUTES[id];
    if (route && getToolAccess(id) === "free") paths.add(route);
  }

  // Every simulator has a public Science page beside its gated route.
  for (const id of SIMULATOR_TOOL_IDS) {
    const route = TOOL_ROUTES[id];
    if (route) paths.add(`${route}/science`);
  }

  for (const slug of learnSlugs) {
    const clean = slug.trim();
    if (/^[a-z0-9][a-z0-9-]*$/i.test(clean)) paths.add(`/learn/${clean}`);
  }

  return [...paths].map((p) => new URL(canonicalUrl(p)).pathname).sort();
}

function xmlEscape(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

/** The sitemap document for a list of paths. Deterministic: no dates. */
export function buildSitemapXml(paths: readonly string[]): string {
  const urls = paths
    .map((p) => `  <url>\n    <loc>${xmlEscape(canonicalUrl(p))}</loc>\n  </url>`)
    .join("\n");
  return (
    `<?xml version="1.0" encoding="UTF-8"?>\n` +
    `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n` +
    `${urls}\n` +
    `</urlset>\n`
  );
}

/**
 * Learn articles that ship in the bundle (MDX fallbacks in LearnArticle).
 * Always listed; Sanity-hosted articles are added by the generator.
 */
export const STATIC_LEARN_SLUGS = ["drake-equation"] as const;

/** Paths listed in an existing sitemap document. */
export function parseSitemapPaths(xml: string): string[] {
  return [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map(
    (m) => new URL(canonicalUrl(m[1])).pathname,
  );
}
