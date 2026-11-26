import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { ToolGlyph, TOOL_GLYPH_IDS, getToolIcon } from "@/components/icons/tool-icons";
import { FREE_TOOL_IDS, PRO_TOOL_IDS, TOOL_ROUTES } from "@/lib/tools-config";

describe("tool glyphs", () => {
  const catalog = [...new Set([...FREE_TOOL_IDS, ...PRO_TOOL_IDS, ...Object.keys(TOOL_ROUTES)])];

  it("every catalog tool has a glyph", () => {
    expect(catalog.filter((id) => !TOOL_GLYPH_IDS.includes(id))).toEqual([]);
    for (const id of catalog) expect(getToolIcon(id)).not.toBeNull();
  });

  it("every glyph is distinct", () => {
    const bodies = TOOL_GLYPH_IDS.map((id) =>
      renderToStaticMarkup(<ToolGlyph toolId={id} />).replace(/data-tool-glyph="[^"]*"/, ""),
    );
    expect(new Set(bodies).size).toBe(bodies.length);
  });

  it("renders a currentColor line glyph with no raster images", () => {
    const html = renderToStaticMarkup(<ToolGlyph toolId="planetary-profile" />);
    expect(html).toContain('viewBox="0 0 24 24"');
    expect(html).toContain('stroke="currentColor"');
    expect(html).toContain('stroke-linecap="square"');
    expect(html).not.toContain("<img");
  });

  it("takes the cascade accent at the canonical stop only when asked", () => {
    expect(renderToStaticMarkup(<ToolGlyph toolId="planetary-profile" accent />)).toContain("text-sf-azure");
    expect(renderToStaticMarkup(<ToolGlyph toolId="planetary-profile" accent />)).not.toContain("-text");
    expect(renderToStaticMarkup(<ToolGlyph toolId="planetary-profile" />)).not.toContain("text-sf-azure");
  });

  it("returns null for unknown tools", () => {
    expect(renderToStaticMarkup(<ToolGlyph toolId="nope" />)).toBe("");
    expect(getToolIcon("nope")).toBeNull();
  });
});
