import { describe, it, expect } from "vitest";
import { createElement } from "react";
import { lazyPdfTemplate, resolvePdfTemplate } from "../lazy-template";

interface Props {
  worldName: string;
  formState: { n: number };
}

const Real = (_: Props) => null;

describe("lazyPdfTemplate / resolvePdfTemplate", () => {
  it("swaps a lazy element for the real template with identical props", async () => {
    let loads = 0;
    const Lazy = lazyPdfTemplate<Props>(async () => {
      loads++;
      return { default: Real };
    });
    const el = <Lazy worldName="Kellis" formState={{ n: 3 }} />;
    expect(loads).toBe(0); // building the element never loads the module

    const resolved = await resolvePdfTemplate(el);
    expect(loads).toBe(1);
    expect(resolved.type).toBe(Real);
    expect(resolved.props).toEqual({ worldName: "Kellis", formState: { n: 3 } });
  });

  it("passes non-lazy elements through untouched", async () => {
    const el = createElement(Real, { worldName: "x", formState: { n: 1 } });
    expect(await resolvePdfTemplate(el)).toBe(el);
  });

  it("the template barrel exposes lazy stand-ins, not react-pdf components", async () => {
    const barrel = await import("../templates");
    expect(typeof barrel.DrakeSummaryTemplate).toBe("function");
    expect("loadPdfTemplate" in barrel.DrakeSummaryTemplate).toBe(true);
  });
});
