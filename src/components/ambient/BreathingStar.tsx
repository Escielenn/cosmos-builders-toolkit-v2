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
  // The pulse animates opacity, so the --sf-ambient dial lives on a static
  // wrapper; opacity multiplies down the tree.
  return (
    <div
      aria-hidden
      className="fixed pointer-events-none z-0"
      style={{ left: x, top: y, width: 3, height: 3, opacity: "var(--sf-ambient)" }}
    >
      <div
        className="w-full h-full animate-sf-pulse"
        style={{
          borderRadius: "9999px",
          background: "radial-gradient(circle, rgb(var(--t1-rgb)) 0%, rgb(var(--t1-rgb) / 0) 70%)",
          boxShadow: "0 0 6px rgb(var(--t1-rgb) / 0.6), 0 0 14px rgb(var(--sf-stellar-rgb) / 0.3)",
        }}
      />
    </div>
  );
}
