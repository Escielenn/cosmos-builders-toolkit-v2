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
      <div aria-hidden className="sf-grain" />
      <BreathingStar />
    </>
  );
}
