import { describe, it, expect } from "vitest";
import { scanFile, compare, stringMask, hasAlpha, toPx, cssBlocks, ownedTokensFrom } from "../check-contrast.mjs";

const ctx = { ownedTokens: ownedTokensFrom([":root { --sf-void: #000; --t1: #fff; --background: 0 0% 0%; }"]) };
const rules = (rel, text) => Object.fromEntries(Object.entries(scanFile(rel, text, ctx)).map(([k, v]) => [k, v.length]));

describe("check-contrast helpers", () => {
  it("toPx resolves px and rem", () => {
    expect(toPx("11", "px")).toBe(11);
    expect(toPx("0.625", "rem")).toBe(10);
    expect(toPx("1", "vw")).toBeNull();
  });

  it("hasAlpha spots alpha colours but not rgb() with a var fallback", () => {
    expect(hasAlpha("1px solid rgba(255,255,255,0.1)")).toBe(true);
    expect(hasAlpha("hsl(var(--sf-primary-hsl) / 0.12)")).toBe(true);
    expect(hasAlpha("rgb(var(--x-rgb, 61, 255, 205))")).toBe(false);
    expect(hasAlpha("var(--sf-line)")).toBe(false);
  });

  it("stringMask keeps string contents only, line numbers intact", () => {
    const src = 'const rounded = 1; // rounded-full\nconst c = "rounded-full";\nconst t = `a ${x ? "rounded-lg" : ""}\n b`;';
    const lines = stringMask(src).split("\n");
    expect(lines).toHaveLength(4);
    expect(lines[0]).not.toMatch(/rounded/);
    expect(lines[1]).toMatch(/rounded-full/);
    expect(lines[2]).toMatch(/rounded-lg/);
    expect(lines[3]).toMatch(/b/);
  });

  it("stringMask: an apostrophe in JSX text ends at the newline", () => {
    const lines = stringMask("<p>It's here</p>\n<div className=\"rounded-full\" />").split("\n");
    expect(lines[1]).toMatch(/rounded-full/);
  });

  it("cssBlocks reports innermost blocks with their line", () => {
    const b = cssBlocks("@media (x) {\n  .a { color: red; }\n}\n.b { opacity: 1 }");
    expect(b.map((x) => [x.selector, x.line])).toEqual([[".a", 2], [".b", 4]]);
  });
});

describe("check-contrast rules", () => {
  it("alpha borders: tailwind slash, arbitrary rgba, css and inline styles", () => {
    expect(rules("src/a.tsx", '<div className="border border-sf-line/50" />')["alpha-border"]).toBe(1);
    expect(rules("src/a.tsx", '<div className="border-[rgba(255,255,255,0.1)]" />')["alpha-border"]).toBe(1);
    expect(rules("src/a.tsx", '<div style={{ borderColor: "rgba(0,0,0,0.2)" }} />')["alpha-border"]).toBe(1);
    expect(rules("src/a.css", ".x { border: 1px solid hsl(var(--a) / 0.1); }")["alpha-border"]).toBe(1);
    expect(rules("src/a.tsx", '<div className="border border-sf-line bg-sf-primary/[0.06]" />')["alpha-border"]).toBeUndefined();
  });

  it("opacity used for a disabled state", () => {
    expect(rules("src/a.tsx", '<button className="disabled:opacity-50" />')["opacity-state"]).toBe(1);
    expect(rules("src/a.tsx", 'cn(isDisabled ? "opacity-40" : "")')["opacity-state"]).toBe(1);
    expect(rules("src/a.css", "button:disabled { opacity: .5 }")["opacity-state"]).toBe(1);
    expect(rules("src/a.tsx", '<div className="opacity-0 group-hover:opacity-100" />')["opacity-state"]).toBeUndefined();
  });

  it("retired tokens", () => {
    expect(rules("src/a.tsx", '<p className="text-t5" />')["retired-token"]).toBe(1);
    expect(rules("src/a.tsx", '<p className="border-sf-border-strong" />')["retired-token"]).toBe(1);
    expect(rules("src/a.tsx", '<p className="text-t4 border-sf-line" />')["retired-token"]).toBeUndefined();
  });

  it("tracking on text under 12px; text-xs (13px here) and 12px are fine", () => {
    expect(rules("src/a.tsx", '<p className="text-[10px] tracking-wider" />')["tracked-small-text"]).toBe(1);
    expect(rules("src/a.tsx", '<p className="text-[12px] tracking-wide" />')["tracked-small-text"]).toBeUndefined();
    expect(rules("src/a.tsx", '<p className="text-xs tracking-wide" />')["tracked-small-text"]).toBeUndefined();
    expect(rules("src/a.css", ".x { font-size: 10px; letter-spacing: 0.2em; }")["tracked-small-text"]).toBe(1);
    expect(rules("src/a.css", ".x { font-size: 10px; letter-spacing: 0; }")["tracked-small-text"]).toBeUndefined();
  });

  it("legacy cyan and sf-cyan usage; alias definitions are allowed", () => {
    expect(rules("src/a.tsx", 'const c = "#00d4ff";')["legacy-cyan"]).toBe(1);
    expect(rules("src/a.tsx", '<b className="text-sf-cyan" />')["legacy-cyan"]).toBe(1);
    expect(rules("src/a.tsx", '<Badge variant="glow-cyan" />')["legacy-cyan"]).toBe(1);
    expect(rules("src/a.tsx", '  "glow-cyan": "bg-sf-primary/[0.06]",')["legacy-cyan"]).toBeUndefined();
  });

  it("parallel truth: token names owned by tokens.css/themes.css", () => {
    expect(rules("src/index.css", ".dark { --t1: 0 0% 100%; }")["parallel-truth"]).toBe(1);
    expect(rules("src/index.css", ".dark { --background: 0 0% 0%; }")["parallel-truth"]).toBe(1);
    expect(rules("src/index.css", ".dark { --sf-surface-glass: x; }")["parallel-truth"]).toBe(1);
    expect(rules("src/index.css", ".x { --my-local: 1px; color: var(--t1); }")["parallel-truth"]).toBeUndefined();
  });

  it("generated files are never scanned", () => {
    expect(rules("src/styles/tokens.css", ":root { --t1: #fff; --sf-cyan: #15C17B; }")).toEqual({});
  });

  it("radius: only none and sf-tag; shadcn keeps the preserved scale", () => {
    expect(rules("src/a.tsx", '<i className="rounded-full" />').radius).toBe(1);
    expect(rules("src/a.tsx", '<i className="rounded-none md:rounded-sf-tag" />').radius).toBeUndefined();
    expect(rules("src/a.tsx", "const rounded = Math.round(x);").radius).toBeUndefined();
    expect(rules("src/components/ui/button.tsx", '"rounded-md"').radius).toBeUndefined();
    expect(rules("src/components/ui/button.tsx", '"rounded-full"').radius).toBe(1);
    expect(rules("src/a.css", ".x { border-radius: 0; } .y { border-radius: 50%; }").radius).toBe(1);
  });

  it("banned fonts", () => {
    expect(rules("src/a.css", ".x { font-family: Inter, sans-serif; }")["banned-font"]).toBe(1);
    expect(rules("index.html", '<link href="https://fonts.googleapis.com/css2?family=Space+Grotesk">')["banned-font"]).toBe(1);
    expect(rules("src/a.ts", "const interval = 1; // Inter is banned")["banned-font"]).toBeUndefined();
  });

  it("focus suppression without a replacement", () => {
    expect(rules("src/a.tsx", '<input className="focus:outline-none" />')["focus-suppressed"]).toBe(1);
    expect(rules("src/a.tsx", '<input className="focus:outline-none focus-visible:ring-2" />')["focus-suppressed"]).toBeUndefined();
  });
});

describe("check-contrast ratchet", () => {
  const results = { "src/a.tsx": { radius: [{}, {}], "legacy-cyan": [{}] }, "src/b.tsx": { radius: [{}] } };

  it("zero rules fail on any hit; ratchet rules fail only above the per-file count", () => {
    const { failures } = compare(results, { rules: { radius: { "src/a.tsx": 2 } } });
    expect(failures.map((f) => `${f.rule} ${f.file}`).sort()).toEqual(["legacy-cyan src/a.tsx", "radius src/b.tsx"]);
  });

  it("reports drops so the baseline can be lowered", () => {
    const { drops } = compare(results, { rules: { radius: { "src/a.tsx": 3, "src/b.tsx": 1, "src/gone.tsx": 4 } } });
    expect(drops.map((d) => `${d.file} ${d.allowed}->${d.count}`)).toEqual(["src/a.tsx 3->2", "src/gone.tsx 4->0"]);
  });
});
