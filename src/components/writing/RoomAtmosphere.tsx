// ---------------------------------------------------------------------------
// RoomAtmosphere: the faded photograph behind the page (1.7), and its credit.
//
// Decoration only. The layer multiplies --sf-ambient and is removed under
// prefers-reduced-transparency (room.css). The photograph is loaded as an
// <img> first so a blocked or broken url never paints a broken backdrop.
// ---------------------------------------------------------------------------

import { useEffect, useState } from "react";
import {
  UNSPLASH_LINK,
  photoLink,
  photographerLink,
  type ResolvedScene,
} from "@/lib/writing/atmosphere";

/** True once the url has loaded; false while loading or if it fails. */
export function useImageReady(url: string): boolean {
  const [ready, setReady] = useState<string>("");
  useEffect(() => {
    if (!url || typeof Image === "undefined") return;
    let alive = true;
    const img = new Image();
    img.onload = () => alive && setReady(url);
    img.onerror = () => alive && setReady("");
    img.src = url;
    return () => {
      alive = false;
    };
  }, [url]);
  return !!url && ready === url;
}

export function RoomScenery({ scene }: { scene: ResolvedScene }): JSX.Element | null {
  const ready = useImageReady(scene.url);
  if (!scene.url || !ready) return null;
  return (
    <div
      aria-hidden="true"
      data-testid="room-scenery"
      className="sf-room-scenery"
      style={{ backgroundImage: `url(${JSON.stringify(scene.url)})` }}
    />
  );
}

/** Quiet attribution under the page. Unsplash asks for it; so does manners. */
export function RoomCredit({ scene }: { scene: ResolvedScene }): JSX.Element | null {
  if (!scene.url || scene.source !== "gallery") return null;
  const c = scene.credit;
  return (
    <p className="sf-room-credit">
      <span>
        {c ? (
          <>
            Photo by{" "}
            <a href={photographerLink(c)} target="_blank" rel="noopener noreferrer">
              {c.photographer}
            </a>{" "}
            on{" "}
            <a href={photoLink(c)} target="_blank" rel="noopener noreferrer">
              Unsplash
            </a>
          </>
        ) : (
          <a href={UNSPLASH_LINK} target="_blank" rel="noopener noreferrer">
            Photography via Unsplash
          </a>
        )}
      </span>
    </p>
  );
}
