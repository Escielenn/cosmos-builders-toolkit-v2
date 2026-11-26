// ---------------------------------------------------------------------------
// Article photograph (Unsplash), toned to sit in the palette.
//
// The photo is hotlinked from images.unsplash.com (src/lib/learn/
// article-photos.ts holds the list, the credits and the guidelines). It is
// shown in greyscale under two token layers: the article's cascade accent
// blended as colour, then a void gradient rising from the bottom edge. So a
// blue jellyfish and a red desert both read as the same instrument, and the
// picture follows the user's theme. No raw colour is used here.
//
// The generated cover is drawn first and stays until the photo has loaded;
// if the photo fails, the cover simply remains. The frame's size comes from
// the parent (an aspect-ratio box) and the <img> carries width and height, so
// nothing shifts when the photo arrives.
//
// No text is laid over the photo. The credit is a caption beside it
// (<PhotoCredit>), so no scrim is needed and the credit stays legible on
// light themes.
// ---------------------------------------------------------------------------

import { useState, useSyncExternalStore } from "react";
import { CATEGORY_ACCENT, CoverArt } from "@/components/learn/CoverArt";
import {
  UNSPLASH_URL,
  photoForArticle,
  photoSrc,
  photoSrcSet,
  type ArticlePhoto as ArticlePhotoData,
} from "@/lib/learn/article-photos";
import { hueVar, type HueName } from "@/styles/hue";
import { cn } from "@/lib/utils";

// Photos that refused to load this session. A failed photo is not requested
// again, and its credit is withdrawn: the reader is looking at the generated
// cover, which nobody on Unsplash made.
const failedPhotos = new Set<string>();
const failureListeners = new Set<() => void>();
let failureVersion = 0;

function markPhotoFailed(id: string): void {
  if (failedPhotos.has(id)) return;
  failedPhotos.add(id);
  failureVersion += 1;
  failureListeners.forEach((notify) => notify());
}

function subscribeToFailures(notify: () => void): () => void {
  failureListeners.add(notify);
  return () => failureListeners.delete(notify);
}

/** Re-renders the caller whenever a photo is marked as failed. */
function useFailedPhotos(): ReadonlySet<string> {
  useSyncExternalStore(subscribeToFailures, () => failureVersion);
  return failedPhotos;
}

type Variant = "hero" | "featured" | "card";

/** Intrinsic box, srcset widths and `sizes` per placement. */
const VARIANTS: Record<Variant, { width: number; height: number; widths: number[]; sizes: string }> = {
  // Article page: the reading column is 896px wide at most.
  hero: {
    width: 1200,
    height: 500,
    widths: [480, 768, 1200, 1792],
    sizes: "(min-width: 960px) 896px, 100vw",
  },
  // Featured card on /learn: a little over half of the 1200px page.
  featured: {
    width: 1200,
    height: 675,
    widths: [480, 768, 1200],
    sizes: "(min-width: 768px) 660px, 100vw",
  },
  // Index cards: three across on desktop.
  card: {
    width: 640,
    height: 360,
    widths: [400, 640, 800],
    sizes: "(min-width: 1024px) 380px, (min-width: 640px) 50vw, 100vw",
  },
};

export interface ArticlePhotoProps {
  slug: string;
  category?: string;
  variant: Variant;
  className?: string;
  /** Load at once (above the fold). Default is lazy. */
  eager?: boolean;
}

export function ArticlePhoto({ slug, category, variant, className, eager = false }: ArticlePhotoProps): JSX.Element {
  const photo = photoForArticle(slug, category);
  const [state, setState] = useState<"loading" | "loaded" | "failed">(() =>
    failedPhotos.has(photo.id) ? "failed" : "loading",
  );
  const box = VARIANTS[variant];
  const accent: HueName = ((category && CATEGORY_ACCENT[category]) || "teal") as HueName;

  return (
    <div className={cn("relative h-full w-full overflow-hidden bg-sf-void", className)}>
      {state !== "loaded" && <CoverArt seed={slug} category={category} className="absolute inset-0" />}
      {state !== "failed" && (
        <>
          <img
            src={photoSrc(photo, { w: box.width, h: box.height })}
            srcSet={photoSrcSet(photo, box.widths, box.height / box.width)}
            sizes={box.sizes}
            width={box.width}
            height={box.height}
            alt={photo.alt}
            loading={eager ? "eager" : "lazy"}
            decoding="async"
            onLoad={() => setState("loaded")}
            onError={() => {
              markPhotoFailed(photo.id);
              setState("failed");
            }}
            className={cn(
              "absolute inset-0 h-full w-full object-cover grayscale transition-opacity duration-slow ease-sf-out",
              state === "loaded" ? "opacity-100" : "opacity-0",
            )}
          />
          {state === "loaded" && (
            <>
              <span
                aria-hidden
                className="absolute inset-0 opacity-60 mix-blend-color"
                style={{ backgroundColor: hueVar(accent) }}
              />
              <span
                aria-hidden
                className="absolute inset-0 bg-gradient-to-t from-sf-void/80 via-sf-void/25 to-sf-void/10"
              />
            </>
          )}
        </>
      )}
    </div>
  );
}

const creditLink =
  "inline-flex min-h-hit items-center text-t2 underline decoration-sf-line-interactive underline-offset-4 transition-colors duration-base hover:text-sf-primary-text";

function CreditName({ photo }: { photo: ArticlePhotoData }): JSX.Element {
  return (
    <a href={photo.photographerUrl} target="_blank" rel="noopener noreferrer" className={creditLink}>
      {photo.photographer}
    </a>
  );
}

function UnsplashLink({ href = UNSPLASH_URL }: { href?: string }): JSX.Element {
  return (
    <a href={href} target="_blank" rel="noopener noreferrer" className={creditLink}>
      Unsplash
    </a>
  );
}

/** "Photo: <name> / Unsplash" for one photograph. */
export function PhotoCredit({
  slug,
  category,
  className,
}: {
  slug: string;
  category?: string;
  className?: string;
}): JSX.Element {
  const photo = photoForArticle(slug, category);
  const failed = useFailedPhotos();
  if (failed.has(photo.id)) return null;
  return (
    <p className={cn("flex flex-wrap items-center gap-x-1.5 text-xs text-t3", className)}>
      <span>Photo:</span>
      <CreditName photo={photo} />
      <span aria-hidden>/</span>
      <UnsplashLink href={photo.photoUrl} />
    </p>
  );
}

/** One credit line for a grid of article cards. */
export function PhotoCredits({
  articles,
  className,
}: {
  articles: readonly { slug: string; category?: string }[];
  className?: string;
}): JSX.Element | null {
  const failed = useFailedPhotos();
  const seen = new Set<string>();
  const photos = articles
    .map((a) => photoForArticle(a.slug, a.category))
    .filter((p) => !failed.has(p.id))
    .filter((p) => (seen.has(p.id) ? false : (seen.add(p.id), true)));
  if (photos.length === 0) return null;
  return (
    <p className={cn("flex flex-wrap items-center gap-x-1.5 text-xs text-t3", className)}>
      <span>{photos.length === 1 ? "Photo:" : "Photos:"}</span>
      {photos.map((p, i) => (
        <span key={p.id} className="inline-flex items-center">
          <CreditName photo={p} />
          {i < photos.length - 1 && <span aria-hidden>,</span>}
        </span>
      ))}
      <span aria-hidden>/</span>
      <UnsplashLink />
    </p>
  );
}

export default ArticlePhoto;
