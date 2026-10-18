import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, it, expect, beforeEach } from "vitest";
import {
  NOINDEX_ROBOTS,
  STATIC_LEARN_SLUGS,
  buildSitemapXml,
  canonicalUrl,
  parseSitemapPaths,
  robotsForPath,
  sitemapPaths,
} from "../routes";
import { PRO_TOOL_IDS, SIMULATOR_TOOL_IDS, TOOL_ROUTES } from "@/lib/tools-config";
import { applyRouteSeo } from "@/hooks/use-meta-tags";

describe("canonicalUrl", () => {
  it("is absolute https on the production host", () => {
    expect(canonicalUrl("/pricing")).toBe("https://stellarforge.tools/pricing");
    expect(canonicalUrl("/")).toBe("https://stellarforge.tools/");
  });

  it("strips query and hash", () => {
    expect(canonicalUrl("/pricing?success=true#faq")).toBe("https://stellarforge.tools/pricing");
    expect(canonicalUrl("/learn/drake-equation#top")).toBe("https://stellarforge.tools/learn/drake-equation");
    expect(canonicalUrl("/?ref=x")).toBe("https://stellarforge.tools/");
  });

  it("collapses trailing and duplicate slashes", () => {
    expect(canonicalUrl("/guide/tools/")).toBe("https://stellarforge.tools/guide/tools");
    expect(canonicalUrl("//guide//tools")).toBe("https://stellarforge.tools/guide/tools");
  });

  it("rewrites any origin (preview deploys, localhost) to production", () => {
    expect(canonicalUrl("http://localhost:5173/features?x=1")).toBe("https://stellarforge.tools/features");
    expect(canonicalUrl("https://sf-git-branch.vercel.app/about/")).toBe("https://stellarforge.tools/about");
  });

  it("accepts a path without a leading slash", () => {
    expect(canonicalUrl("about")).toBe("https://stellarforge.tools/about");
  });
});

describe("robotsForPath", () => {
  it.each([
    "/auth",
    "/auth/reset",
    "/profile",
    "/admin",
    "/share/worksheet/abc123",
    "/share/world/abc123",
    "/invite/tok",
    "/join/CODE",
    "/api/notion/callback",
    "/worlds",
    "/worlds/w1",
    "/worlds/w1/codex/e1",
    "/write/doc1",
    "/studio",
  ])("noindexes %s", (path) => {
    expect(robotsForPath(path)).toBe(NOINDEX_ROBOTS);
  });

  it.each(["/", "/pricing", "/learn/drake-equation", "/worlds/w1/showcase", "/tools/exosky/science", "/authors"])(
    "leaves %s indexable",
    (path) => {
      expect(robotsForPath(path)).toBeNull();
    },
  );

  it("ignores query strings when deciding", () => {
    expect(robotsForPath("/auth?redirect=/pricing")).toBe(NOINDEX_ROBOTS);
  });
});

describe("sitemapPaths", () => {
  const paths = sitemapPaths(["drake-equation", "first-contact"]);

  it("lists no Pro tool route (logged out they show only the lock screen)", () => {
    // writing-workshop maps to /prompts, the prompt browser, which is not
    // behind ProToolGuard: anyone can read it, so it stays listed.
    for (const id of PRO_TOOL_IDS) {
      const route = TOOL_ROUTES[id];
      if (route && route !== "/prompts") expect(paths).not.toContain(route);
    }
  });

  it("lists every simulator Science page", () => {
    for (const id of SIMULATOR_TOOL_IDS) {
      expect(paths).toContain(`${TOOL_ROUTES[id]}/science`);
    }
  });

  it("lists free tools, learn articles, and drops /early", () => {
    expect(paths).toContain("/tools/environmental-chain-reaction");
    expect(paths).toContain("/learn/drake-equation");
    expect(paths).toContain("/learn/first-contact");
    expect(paths).not.toContain("/early");
  });

  it("lists nothing the robots policy hides", () => {
    for (const p of paths) expect(robotsForPath(p)).toBeNull();
  });

  it("rejects malformed slugs and deduplicates", () => {
    const odd = sitemapPaths(["../etc", "a b", "drake-equation", "drake-equation"]);
    expect(odd.filter((p) => p.startsWith("/learn/"))).toEqual(["/learn/drake-equation"]);
  });
});

describe("buildSitemapXml", () => {
  it("emits absolute canonical locs and round-trips through parseSitemapPaths", () => {
    const xml = buildSitemapXml(["/", "/pricing"]);
    expect(xml).toContain("<loc>https://stellarforge.tools/</loc>");
    expect(xml).toContain("<loc>https://stellarforge.tools/pricing</loc>");
    expect(parseSitemapPaths(xml)).toEqual(["/", "/pricing"]);
  });
});

describe("public/sitemap.xml", () => {
  it("matches the route policy (run `npm run sitemap` after changing it)", () => {
    const xml = readFileSync(resolve(process.cwd(), "public/sitemap.xml"), "utf8");
    const listed = parseSitemapPaths(xml);
    const learn = listed.filter((p) => p.startsWith("/learn/")).map((p) => p.slice(7));
    for (const slug of STATIC_LEARN_SLUGS) expect(learn).toContain(slug);
    expect(xml).toBe(buildSitemapXml(sitemapPaths(learn)));
  });
});

describe("applyRouteSeo", () => {
  beforeEach(() => {
    document.head.innerHTML = "";
  });

  it("writes one canonical link and og:url per route", () => {
    applyRouteSeo("/pricing");
    applyRouteSeo("/features");
    const links = document.querySelectorAll('link[rel="canonical"]');
    expect(links).toHaveLength(1);
    expect(links[0].getAttribute("href")).toBe("https://stellarforge.tools/features");
    expect(document.querySelector('meta[property="og:url"]')?.getAttribute("content")).toBe(
      "https://stellarforge.tools/features",
    );
  });

  it("adds noindex on private routes and removes it on public ones", () => {
    applyRouteSeo("/auth/reset");
    expect(document.querySelector('meta[name="robots"]')?.getAttribute("content")).toBe(NOINDEX_ROBOTS);
    applyRouteSeo("/pricing");
    expect(document.querySelector('meta[name="robots"]')).toBeNull();
  });
});
