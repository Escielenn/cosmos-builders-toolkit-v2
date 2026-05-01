/**
 * BreathingStar, single pulsing dot in the starfield.
 *
 * One "Polaris" anchor point in the background that breathes at 0.08–0.12 Hz
 * (a ~10s cycle). Mounted inside StellarBackground; pointer-events none, fixed
 * position.
 *
 * Per handoff §15, this is a hidden ambient detail, most users will never
 * notice consciously. That's the point.
 */
export function BreathingStar({
  x = "82%",
  y = "18%",
}: {
  /** horizontal position (CSS length) */
  x?: string;
  /** vertical position (CSS length) */
  y?: string;
}) {
  return (
    <div
      aria-hidden
      className="fixed pointer-events-none z-0 animate-sf-pulse"
      style={{
        left: x,
        top: y,
        width: 3,
        height: 3,
        borderRadius: "9999px",
        background: "radial-gradient(circle, #E0E4E8 0%, rgba(224,228,232,0) 70%)",
        boxShadow: "0 0 6px rgba(224,228,232,0.6), 0 0 14px rgba(91,141,239,0.3)",
      }}
    />
  );
}
