// ---------------------------------------------------------------------------
// World art on cards (1.7): a world's cover image, faded, behind its card.
//
// The card text must keep WCAG AA over any image, including a pure white
// one. The art is drawn at IMAGE_OPACITY over the card and then covered by
// a veil of --sf-surface that runs from nearly solid on the left (where the
// title, labels and timestamps sit) to lighter on the right (where only the
// picture shows). The numbers live here, not in CSS, so the contrast test
// (src/lib/__tests__/world-art.test.ts) measures exactly what ships.
// ---------------------------------------------------------------------------

/** Peak opacity of the image itself, before the veil (scaled by --sf-ambient). */
export const IMAGE_OPACITY = 0.55;

/**
 * Floor of the image opacity when ambient effects are off: the art is the
 * writer's own content, so "ambient off" quiets it rather than removing it
 * (the "World art on cards" setting removes it).
 */
export const IMAGE_OPACITY_FLOOR = 0.25;

/** Veil stops, left to right: [position 0..1, alpha of --sf-surface]. */
export const VEIL_STOPS: readonly (readonly [number, number])[] = [
  [0, 0.95],
  [0.6, 0.9],
  [1, 0.6],
];

/** Small text (t3, t4) stays left of this fraction of the card's width. */
export const SMALL_TEXT_MAX_X = 0.6;

/** The veil's alpha at a horizontal position (linear between stops). */
export function veilAlphaAt(x: number): number {
  const p = Math.min(1, Math.max(0, x));
  for (let i = 1; i < VEIL_STOPS.length; i++) {
    const [x0, a0] = VEIL_STOPS[i - 1];
    const [x1, a1] = VEIL_STOPS[i];
    if (p <= x1) return a0 + ((p - x0) / (x1 - x0)) * (a1 - a0);
  }
  return VEIL_STOPS[VEIL_STOPS.length - 1][1];
}

/** CSS for the veil, reading the live surface token (follows the theme). */
export function veilBackground(): string {
  const stops = VEIL_STOPS.map(([x, a]) => `rgb(var(--sf-surface-rgb) / ${a}) ${Math.round(x * 100)}%`).join(", ");
  return `linear-gradient(90deg, ${stops})`;
}

/** CSS opacity for the image: IMAGE_OPACITY at full ambient, the floor at none. */
export function imageOpacityCss(): string {
  const span = +(IMAGE_OPACITY - IMAGE_OPACITY_FLOOR).toFixed(3);
  return `calc(${IMAGE_OPACITY_FLOOR} + ${span} * var(--sf-ambient, 1))`;
}

/** A world's cover, as the Bridge picks it: header image, else theme cover. */
export function worldCoverUrl(world: {
  header_image_url?: string | null;
  theme?: { cover_image_url?: string | null } | null;
}): string | null {
  return world.header_image_url || world.theme?.cover_image_url || null;
}
