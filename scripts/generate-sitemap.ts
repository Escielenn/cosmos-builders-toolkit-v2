// Regenerates public/sitemap.xml from the SEO route policy (src/lib/seo/routes.ts).
//
//   npm run sitemap
//
// Learn articles: the bundled MDX slugs are always listed. Sanity-hosted
// articles are fetched from the public CDN API; if that fetch fails (offline,
// proxy), the /learn/<slug> entries already in the committed sitemap are kept
// so a regeneration never silently drops published articles.

import { readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import {
  STATIC_LEARN_SLUGS,
  buildSitemapXml,
  parseSitemapPaths,
  sitemapPaths,
} from "../src/lib/seo/routes";

const SANITY_PROJECT_ID = "74gy5txg";
const SANITY_DATASET = "production";
const OUT = resolve(process.cwd(), "public/sitemap.xml");

async function fetchSanitySlugs(): Promise<string[] | null> {
  const query = `*[_type == "article" && defined(slug.current)].slug.current`;
  const url =
    `https://${SANITY_PROJECT_ID}.apicdn.sanity.io/v2024-01-01/data/query/${SANITY_DATASET}` +
    `?query=${encodeURIComponent(query)}`;
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(10_000) });
    if (!res.ok) return null;
    const body = (await res.json()) as { result?: unknown };
    return Array.isArray(body.result) ? body.result.filter((s): s is string => typeof s === "string") : null;
  } catch {
    return null;
  }
}

function existingLearnSlugs(): string[] {
  try {
    return parseSitemapPaths(readFileSync(OUT, "utf8"))
      .filter((p) => p.startsWith("/learn/"))
      .map((p) => p.slice("/learn/".length));
  } catch {
    return [];
  }
}

const fetched = await fetchSanitySlugs();
if (!fetched) console.warn("[sitemap] Sanity unreachable; keeping learn articles already listed.");
const slugs = [...STATIC_LEARN_SLUGS, ...(fetched ?? existingLearnSlugs())];
const paths = sitemapPaths(slugs);
writeFileSync(OUT, buildSitemapXml(paths));
console.log(`[sitemap] wrote ${paths.length} URLs to public/sitemap.xml`);
