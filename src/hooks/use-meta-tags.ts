// ---------------------------------------------------------------------------
// useMetaTags — Dynamic Open Graph and Twitter meta tag management for SPA.
// Updates document.title and meta tags on mount, restores defaults on unmount.
// ---------------------------------------------------------------------------

import { useEffect } from "react";

interface MetaTagOptions {
  title?: string;
  description?: string;
  url?: string;
  image?: string;
  type?: string;
}

const DEFAULTS = {
  title: "StellarForge - Science Fiction Worldbuilding Tools",
  description:
    "Science fiction worldbuilding tools for creating rich, lived-in worlds.",
  url: "https://stellarforge.tools",
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

export function useMetaTags(options: MetaTagOptions) {
  useEffect(() => {
    const title = options.title
      ? `${options.title} | StellarForge`
      : DEFAULTS.title;
    const description = options.description || DEFAULTS.description;
    const url = options.url || window.location.href;
    const image = options.image || DEFAULTS.image;
    const type = options.type || DEFAULTS.type;

    // Title
    document.title = title;

    // OG tags
    setMetaTag("og:title", title);
    setMetaTag("og:description", description);
    setMetaTag("og:url", url);
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
      setMetaTag("og:url", DEFAULTS.url);
      setMetaTag("og:image", DEFAULTS.image);
      setMetaTag("og:type", DEFAULTS.type);
      setNameTag("twitter:title", DEFAULTS.title);
      setNameTag("twitter:description", DEFAULTS.description);
      setNameTag("twitter:image", DEFAULTS.image);
      setNameTag("description", DEFAULTS.description);
    };
  }, [options.title, options.description, options.url, options.image, options.type]);
}
