// ---------------------------------------------------------------------------
// WorldCardArt (1.7): the world's cover image as a card's faded background.
//
// Drop it as the first child of a `relative overflow-hidden` card and put the
// card's content in a `relative` wrapper above it. Renders nothing when the
// world has no cover or the writer turned "World art on cards" off, so those
// cards look exactly as before. The layer is absolutely positioned (no layout
// shift), lazy and async-decoded, fades in on load, multiplies --sf-ambient,
// and disappears under prefers-reduced-transparency and high contrast
// (index.css, .sf-world-art). Contrast budget: src/lib/world-art.ts.
// ---------------------------------------------------------------------------

import { useState } from "react";
import { useStorageUrl } from "@/hooks/use-storage-url";
import { useDisplayPref } from "@/lib/display-prefs";
import { imageOpacityCss, veilBackground } from "@/lib/world-art";

interface WorldCardArtProps {
  /** The world's cover: header_image_url, else theme.cover_image_url. */
  url: string | null | undefined;
  /** Vertical focus, 0 to 100 (header_image_focus_y). */
  focusY?: number | null;
}

export default function WorldCardArt({ url, focusY }: WorldCardArtProps) {
  const enabled = useDisplayPref("worldArt") === "on";
  const display = useStorageUrl(enabled ? url : null);
  const [loaded, setLoaded] = useState(false);
  const [failed, setFailed] = useState(false);

  if (!enabled || !display.url || failed) return null;

  return (
    <div className="sf-world-art pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true" data-world-art="">
      <img
        src={display.url}
        alt=""
        loading="lazy"
        decoding="async"
        draggable={false}
        onLoad={() => setLoaded(true)}
        onError={() => setFailed(true)}
        className="absolute inset-0 h-full w-full object-cover transition-opacity duration-slow ease-sf-out"
        style={{
          objectPosition: `center ${focusY ?? 50}%`,
          opacity: loaded ? imageOpacityCss() : 0,
        }}
      />
      <div className="absolute inset-0" style={{ background: veilBackground() }} />
    </div>
  );
}
