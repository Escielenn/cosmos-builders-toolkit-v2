// ---------------------------------------------------------------------------
// useMetaTags, Dynamic Open Graph and Twitter meta tag management for SPA.
// Updates document.title and meta tags on mount, restores defaults on unmount.
//
// Canonical URL, og:url and robots are per ROUTE, not per page component:
// applyRouteSeo (run by <RouteSeo /> on every navigation) owns them, so a
// page that never calls useMetaTags still gets its own canonical. A page may
// override them with the `url` / `robots` options.
// ---------------------------------------------------------------------------

import { useEffect } from "react";
import { canonicalUrl, robotsForPath } from "@/lib/seo/routes";

interface MetaTagOptions {
  title?: string;
  description?: string;
  url?: string;
  image?: string;
  type?: string;
  /** e.g. "noindex, nofollow". Defaults to the route policy. */
  robots?: string;
}

const DEFAULTS = {
  title: "StellarForge - Science Fiction Worldbuilding and Writing Studio",
  description:
    "Decide what is true about your universe, then write it. StellarForge is the science fiction worldbuilding and writing studio where the world pushes back on the page.",
  image: "https://stellarforge.tools/og-image.png",
  type: "website",
};

function setMetaTag(property: string, content: string) {
  let el = document.querySelector(
    `meta[property="${property}"]`
  ) as HTMLMetaElement | null;
  if (!el) {
    el = document.createElement("meta");
    el.setAttribute("property", property);
    document.head.appendChild(el);
  }
  el.setAttribute("content", content);
}

function setNameTag(name: string, content: string) {
  let el = document.querySelector(
    `meta[name="${name}"]`
  ) as HTMLMetaElement | null;
  if (!el) {
    el = document.createElement("meta");
    el.setAttribute("name", name);
    document.head.appendChild(el);
  }
  el.setAttribute("content", content);
}

function setCanonicalLink(href: string) {
  let el = document.querySelector('link[rel="canonical"]') as HTMLLinkElement | null;
  if (!el) {
    el = document.createElement("link");
    el.setAttribute("rel", "canonical");
    document.head.appendChild(el);
  }
  el.setAttribute("href", href);
}

function setRobots(content: string | null) {
  const existing = document.querySelector('meta[name="robots"]');
  if (content === null) {
    existing?.remove();
    return;
  }
  setNameTag("robots", content);
}

/**
 * Canonical link, og:url and robots for a path (query and hash stripped,
 * absolute https://stellarforge.tools). Called on every route change.
 */
export function applyRouteSeo(pathname: string, overrides: { url?: string; robots?: string } = {}) {
  const canonical = canonicalUrl(overrides.url ?? pathname);
  setCanonicalLink(canonical);
  setMetaTag("og:url", canonical);
  setRobots(overrides.robots ?? robotsForPath(pathname));
}

export function useMetaTags(options: MetaTagOptions) {
  useEffect(() => {
    const title = options.title
      ? `${options.title} | StellarForge`
      : DEFAULTS.title;
    const description = options.description || DEFAULTS.description;
    const image = options.image || DEFAULTS.image;
    const type = options.type || DEFAULTS.type;

    // Title
    document.title = title;

    // OG tags
    setMetaTag("og:title", title);
    setMetaTag("og:description", description);
    if (options.url || options.robots) {
      applyRouteSeo(window.location.pathname, { url: options.url, robots: options.robots });
    }
    setMetaTag("og:image", image);
    setMetaTag("og:type", type);

    // Twitter tags
    setNameTag("twitter:title", title);
    setNameTag("twitter:description", description);
    setNameTag("twitter:image", image);

    // Description
    setNameTag("description", description);

    // Restore defaults on unmount
    return () => {
      document.title = DEFAULTS.title;
      setMetaTag("og:title", DEFAULTS.title);
      setMetaTag("og:description", DEFAULTS.description);
      // Canonical / og:url / robots belong to the route; <RouteSeo /> resets
      // them on navigation. Only an explicit override is undone here.
      if (options.url || options.robots) applyRouteSeo(window.location.pathname);
      setMetaTag("og:image", DEFAULTS.image);
      setMetaTag("og:type", DEFAULTS.type);
      setNameTag("twitter:title", DEFAULTS.title);
      setNameTag("twitter:description", DEFAULTS.description);
      setNameTag("twitter:image", DEFAULTS.image);
      setNameTag("description", DEFAULTS.description);
    };
  }, [options.title, options.description, options.url, options.image, options.type, options.robots]);
}
