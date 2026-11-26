import { describe, it, expect } from "vitest";
import { render } from "@testing-library/react";
import legacyPics from "./fixtures/legacy-world-pics.json";
import {
  DEFAULT_WORLD_ICON,
  ICON_CATEGORIES,
  WORLD_ICONS,
  getWorldIcon,
  legacyWorldPicGlyph,
  resolveWorldIconId,
} from "@/lib/world-icons";
import { WORLD_GLYPH_IDS, WorldGlyph, hasWorldGlyph } from "@/components/icons/world-glyphs";
import WorldIconRenderer from "@/components/world/WorldIconRenderer";

// The 34 ids the lucide set stored before 1.7. Worlds carry these today.
const OLD_LUCIDE_IDS = [
  "globe", "globe-2", "moon", "sun", "star", "sparkles", "rocket", "orbit", "satellite", "telescope",
  "flame", "droplets", "wind", "mountain", "waves", "snowflake", "cloud", "leaf", "trees", "flower", "bug",
  "building", "castle", "crown", "sword", "swords", "shield", "scroll", "book", "compass", "anchor",
  "infinity", "atom", "zap",
];

describe("world icon catalogue", () => {
  it("offers only ids that have a glyph, each once, in a known category", () => {
    const ids = WORLD_ICONS.map((i) => i.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const icon of WORLD_ICONS) {
      expect(hasWorldGlyph(icon.id), icon.id).toBe(true);
      expect(ICON_CATEGORIES).toContain(icon.category);
    }
    // Every glyph drawn is offered: no orphan artwork.
    expect([...ids].sort()).toEqual([...WORLD_GLYPH_IDS].sort());
  });

  it("keeps every id the old set stored", () => {
    for (const id of OLD_LUCIDE_IDS) expect(resolveWorldIconId(id), id).toBe(id);
  });
});

describe("resolveWorldIconId", () => {
  it("falls back to the globe for missing or unknown values", () => {
    expect(resolveWorldIconId(null)).toBe(DEFAULT_WORLD_ICON);
    expect(resolveWorldIconId(undefined)).toBe(DEFAULT_WORLD_ICON);
    expect(resolveWorldIconId("")).toBe(DEFAULT_WORLD_ICON);
    expect(resolveWorldIconId("no-such-icon")).toBe(DEFAULT_WORLD_ICON);
    expect(resolveWorldIconId("constructor")).toBe(DEFAULT_WORLD_ICON);
    expect(getWorldIcon("no-such-icon").id).toBe(DEFAULT_WORLD_ICON);
  });

  it("maps every retired illustration to a real glyph", () => {
    const pics = legacyPics as string[];
    expect(pics.length).toBe(464);
    for (const file of pics) {
      const glyph = resolveWorldIconId(`/world-pics/${file}`);
      expect(hasWorldGlyph(glyph), file).toBe(true);
    }
  });

  it("maps illustrations by what they showed", () => {
    const cases: Record<string, string> = {
      "007-astronaut.svg": "helmet",
      "005-planet.svg": "ringed",
      "003-earth.svg": "globe",
      "003-moon.svg": "moon",
      "048-dragon.svg": "mask",
      "013-robot.svg": "robot",
      "018-rocket.svg": "rocket",
      "035-black hole.svg": "black-hole",
      "001-orion.svg": "constellation",
      "002-fire.svg": "flame",
      "002-mountains.svg": "mountain",
      "003-map.svg": "map",
      "001-compass.svg": "compass",
    };
    for (const [file, glyph] of Object.entries(cases)) {
      expect(legacyWorldPicGlyph(`/world-pics/${file}`), file).toBe(glyph);
    }
  });

  it("matches whole words, so a zodiac name does not swallow longer words", () => {
    expect(legacyWorldPicGlyph("/world-pics/010-teleportation.svg")).not.toBe("constellation");
    expect(legacyWorldPicGlyph("/world-pics/010-leo.svg")).toBe("constellation");
    expect(legacyWorldPicGlyph("/world-pics/010-moon rover.svg")).toBe("rover");
    expect(legacyWorldPicGlyph("/world-pics/010-space%20station.svg")).toBe("station");
  });

  it("leaves few illustrations on the fallback globe", () => {
    const pics = legacyPics as string[];
    const earthy = /earth|global|mercury|venus|mars|pluto|ceres|atmosphere|ozone|ecosystem|environment/;
    const fallback = pics.filter(
      (f) => legacyWorldPicGlyph(`/world-pics/${f}`) === DEFAULT_WORLD_ICON && !earthy.test(f),
    );
    // Abstract leftovers (a heart, a key, a peace sign) may be globes; the
    // subjects a writer would recognise must not be.
    expect(fallback.length / pics.length).toBeLessThan(0.1);
  });
});

describe("world glyph rendering", () => {
  it("draws every glyph in the family grid: 24x24, 1.5 stroke, square caps, currentColor", () => {
    for (const id of WORLD_GLYPH_IDS) {
      const { container, unmount } = render(<WorldGlyph id={id} />);
      const svg = container.querySelector("svg")!;
      expect(svg.getAttribute("viewBox")).toBe("0 0 24 24");
      expect(svg.getAttribute("stroke-width")).toBe("1.5");
      expect(svg.getAttribute("stroke-linecap")).toBe("square");
      expect(svg.getAttribute("stroke")).toBe("currentColor");
      expect(svg.getAttribute("aria-hidden")).toBe("true");
      expect(svg.children.length, id).toBeGreaterThan(0);
      unmount();
    }
  });

  it("renders a retired illustration path as a glyph, never an <img>", () => {
    const { container } = render(<WorldIconRenderer iconId="/world-pics/005-planet.svg" />);
    expect(container.querySelector("img")).toBeNull();
    expect(container.querySelector("svg")?.getAttribute("data-world-glyph")).toBe("ringed");
  });

  it("renders the globe for a world with no icon", () => {
    const { container } = render(<WorldIconRenderer iconId={null} />);
    expect(container.querySelector("svg")?.getAttribute("data-world-glyph")).toBe("globe");
  });
});
