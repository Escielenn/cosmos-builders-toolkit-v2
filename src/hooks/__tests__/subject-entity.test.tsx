import { describe, it, expect } from "vitest";
import { renderHook } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import type { ReactNode } from "react";
import { useSubjectEntityId } from "@/hooks/use-subject-entity";
import { buildFormPatch } from "@/hooks/use-entity-prepopulate";

const at = (url: string) => ({ children }: { children: ReactNode }) => (
  <MemoryRouter initialEntries={[url]}>{children}</MemoryRouter>
);

describe("useSubjectEntityId", () => {
  it("reads ?entityId= from the URL and nothing else", () => {
    expect(renderHook(() => useSubjectEntityId(), { wrapper: at("/tools/planetary-profile?entityId=abc-123") }).result.current).toBe("abc-123");
    expect(renderHook(() => useSubjectEntityId(), { wrapper: at("/tools/planetary-profile") }).result.current).toBeNull();
    expect(renderHook(() => useSubjectEntityId(), { wrapper: at("/tools/planetary-profile?entityId=%20") }).result.current).toBeNull();
  });
});

describe("buildFormPatch (world_entries → tool form)", () => {
  it("maps the entity's master fields onto the tool's dot paths", () => {
    const patch = buildFormPatch(
      { entry_type: "planet", metadata: { surfaceGravity: "1.47", radius: "1.02" } },
      "planetary-profile",
    );
    expect(patch).toEqual({ physicalCharacteristics: { surfaceGravity: "1.47", planetaryRadius: "1.02" } });
  });

  it("skips empty values and unmapped tools", () => {
    expect(buildFormPatch({ entry_type: "planet", metadata: { surfaceGravity: "" } }, "planetary-profile")).toEqual({});
    expect(buildFormPatch({ entry_type: "planet", metadata: { surfaceGravity: "1.47" } }, "not-a-tool")).toEqual({});
    expect(buildFormPatch({ entry_type: "species", metadata: { surfaceGravity: "1.47" } }, "planetary-profile")).toEqual({});
  });
});
