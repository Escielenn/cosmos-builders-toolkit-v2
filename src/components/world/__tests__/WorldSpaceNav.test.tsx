import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { WorldSpaceNav } from "../WorldSpaceNav";

function mountAt(path: string) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <WorldSpaceNav worldId="w1" />
    </MemoryRouter>,
  );
}

describe("WorldSpaceNav", () => {
  it("names every space even when only the icon shows (below sm)", () => {
    mountAt("/worlds/w1");
    for (const name of ["Bridge", "Codex", "Instruments", "Manuscript"]) {
      expect(screen.getByRole("link", { name })).toBeTruthy();
    }
  });

  it("marks the Manuscript current on a nested document (1.5 #26)", () => {
    mountAt("/worlds/w1/write/doc-1");
    expect(screen.getByRole("link", { name: "Manuscript" }).getAttribute("aria-current")).toBe("page");
    expect(screen.getByRole("link", { name: "Bridge" }).getAttribute("aria-current")).toBeNull();
  });

  it("points the Manuscript at the world's own editor", () => {
    mountAt("/worlds/w1/codex");
    expect(screen.getByRole("link", { name: "Manuscript" }).getAttribute("href")).toBe("/worlds/w1/write");
    expect(screen.getByRole("link", { name: "Codex" }).getAttribute("aria-current")).toBe("page");
  });
});
