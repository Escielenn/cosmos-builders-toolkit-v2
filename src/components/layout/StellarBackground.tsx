import { BreathingStar } from "@/components/ambient/BreathingStar";

/**
 * StellarBackground, starfield + grain layer (April 2026 handoff).
 *
 * Mounts once at the app root and renders a fixed, pointer-events: none
 * layer beneath all page content. The starfield (`.sf-starfield`) sits at
 * z-index 0; the grain overlay (`.sf-grain`) at z-1. Existing TextureOverlay
 * (z-9999) stays above; page content lives at z-2+.
 *
 * A single BreathingStar (Polaris) pulses at ~0.1 Hz for the user who
 * notices. Nothing is blocking; all pointer-events: none.
 */
export function StellarBackground() {
  return (
    <>
      <div aria-hidden className="sf-starfield" />
      {/* Paints via a fixed ::before. Must NOT reuse `.sf-grain`, which
          texture-overlay.css sizes at 200% for the clipped overlay wrapper —
          outside that wrapper it resolves against the document and adds
          ~1200px of dead scroll below the footer. */}
      <div aria-hidden className="sf-grain-fixed" />
      <BreathingStar />
    </>
  );
}
