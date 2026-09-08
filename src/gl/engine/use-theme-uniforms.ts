// ---------------------------------------------------------------------------
// useThemeUniforms (Brief G1 §4).
//
// "Read the tokens from computed style; re-read on data-theme change; expose
// as a useThemeUniforms() hook."
//
// This is what keeps "no hardcoded colours anywhere in src/gl" true in a
// SCENE, not just in a material. A scene still needs chart furniture — an
// orbit ring, a selection glow — and those colours are the same solved tokens
// the DOM uses, so they follow all 70 themes instead of being a 71st palette
// nobody contrast-solved.
// ---------------------------------------------------------------------------

import { useEffect, useMemo, useState } from "react";
import { Color } from "three";
import {
  BOUND_TOKENS,
  domTokenReader,
  readThemeUniforms,
  type BoundToken,
  type ThemeUniforms,
} from "./theme-uniforms";

export function useThemeUniforms(): ThemeUniforms {
  const [uniforms, setUniforms] = useState<ThemeUniforms>(() =>
    typeof document === "undefined"
      ? readThemeUniforms(() => null)
      : readThemeUniforms(domTokenReader(document.documentElement)),
  );

  useEffect(() => {
    if (typeof document === "undefined") return;
    const root = document.documentElement;
    const reread = () =>
      setUniforms(readThemeUniforms(domTokenReader(root)));

    reread();
    // Themes switch by stamping data-theme on the root; the ambient dial and
    // the light/dark class land there too.
    const observer = new MutationObserver(reread);
    observer.observe(root, {
      attributes: true,
      attributeFilter: ["data-theme", "class", "style"],
    });
    return () => observer.disconnect();
  }, []);

  return uniforms;
}

/** The bound tokens as three.js Colors, ready for a material or a line. */
export function useThemeColors(): Record<BoundToken, Color> {
  const uniforms = useThemeUniforms();
  return useMemo(() => {
    const out = {} as Record<BoundToken, Color>;
    for (const token of BOUND_TOKENS) {
      const c = uniforms.colours[token];
      // Already linear — Color.setRGB takes linear values in three r152+.
      out[token] = new Color().setRGB(c.r, c.g, c.b);
    }
    return out;
  }, [uniforms]);
}
