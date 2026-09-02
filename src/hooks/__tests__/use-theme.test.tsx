import { describe, it, expect, beforeEach } from "vitest";
import { render, screen, fireEvent, cleanup } from "@testing-library/react";
import {
  readTheme,
  applyTheme,
  initTheme,
  DEFAULT_THEME,
  THEME_STORAGE_KEY,
  THEME_BASES,
  THEME_PRIMARIES,
  primaryHex,
} from "@/hooks/use-theme";
import AppearanceSettings from "@/components/settings/AppearanceSettings";

const html = () => document.documentElement;

beforeEach(() => {
  cleanup();
  localStorage.clear();
  html().removeAttribute("data-theme");
  html().className = "dark";
});

describe("theme catalogue", () => {
  it("ships 10 bases × 7 primaries, every pair solved", () => {
    const bases = Object.keys(THEME_BASES);
    expect(bases).toHaveLength(10);
    expect(THEME_PRIMARIES).toHaveLength(7);
    for (const b of bases) for (const p of THEME_PRIMARIES) expect(primaryHex(b, p)).toMatch(/^#[0-9A-F]{6}$/i);
  });

  it("the default pair is void-teal and its primary is the brand teal", () => {
    expect(primaryHex("void", "teal")).toBe("#15C17B");
  });
});

describe("readTheme", () => {
  it("falls back to the default on nothing / garbage / unknown ids", () => {
    expect(readTheme()).toEqual(DEFAULT_THEME);
    localStorage.setItem(THEME_STORAGE_KEY, "not a theme");
    expect(readTheme()).toEqual(DEFAULT_THEME);
    localStorage.setItem(THEME_STORAGE_KEY, "void-neon");
    expect(readTheme()).toEqual(DEFAULT_THEME);
    localStorage.setItem(THEME_STORAGE_KEY, "mars-teal");
    expect(readTheme()).toEqual(DEFAULT_THEME);
  });

  it("reads the same string id no-flash.js reads", () => {
    localStorage.setItem(THEME_STORAGE_KEY, "midnight-cyan");
    expect(readTheme()).toEqual({ base: "midnight", primary: "cyan" });
  });
});

describe("applyTheme", () => {
  it("expresses the default by REMOVING data-theme so :root wins", () => {
    applyTheme({ base: "midnight", primary: "cyan" });
    expect(html().getAttribute("data-theme")).toBe("midnight-cyan");
    applyTheme(DEFAULT_THEME);
    expect(html().hasAttribute("data-theme")).toBe(false);
  });

  it("keeps the .dark/.light class in step with the base's mode", () => {
    applyTheme({ base: "sky", primary: "azure" });
    expect(html().classList.contains("light")).toBe(true);
    expect(html().classList.contains("dark")).toBe(false);
    applyTheme({ base: "charcoal", primary: "amber" });
    expect(html().classList.contains("dark")).toBe(true);
    expect(html().classList.contains("light")).toBe(false);
  });

  it("initTheme applies whatever is persisted", () => {
    localStorage.setItem(THEME_STORAGE_KEY, "paper-violet");
    initTheme();
    expect(html().getAttribute("data-theme")).toBe("paper-violet");
    expect(html().classList.contains("light")).toBe(true);
  });
});

describe("AppearanceSettings", () => {
  it("switches base and primary, persists the id, and resets", () => {
    render(<AppearanceSettings />);
    fireEvent.click(screen.getByRole("button", { name: /^Midnight/ }));
    expect(html().getAttribute("data-theme")).toBe("midnight-teal");
    fireEvent.click(screen.getByRole("button", { name: "Cyan" }));
    expect(html().getAttribute("data-theme")).toBe("midnight-cyan");
    expect(localStorage.getItem(THEME_STORAGE_KEY)).toBe("midnight-cyan");
    expect(screen.getByRole("button", { name: "Cyan" })).toHaveAttribute("aria-pressed", "true");

    fireEvent.click(screen.getByRole("button", { name: /Reset to Void/ }));
    expect(html().hasAttribute("data-theme")).toBe(false);
    expect(localStorage.getItem(THEME_STORAGE_KEY)).toBeNull();
  });

  it("every swatch is a labelled, pressable, 44px-class control", () => {
    render(<AppearanceSettings />);
    const buttons = screen.getAllByRole("button");
    // 10 bases + 7 primaries + reset
    expect(buttons).toHaveLength(18);
    for (const b of buttons) {
      expect(b).toHaveAccessibleName();
      expect(b.className).toContain("min-h-hit");
    }
  });
});
