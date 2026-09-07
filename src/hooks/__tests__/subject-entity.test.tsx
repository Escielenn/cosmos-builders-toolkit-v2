import { describe, it, expect } from "vitest";
import { renderHook } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import type { ReactNode } from "react";
import { useSubjectEntityId, useSubjectEpoch } from "@/hooks/use-subject-entity";
import { buildFormPatch } from "@/hooks/use-entity-prepopulate";

const at = (url: string) => ({ children }: { children: ReactNode }) => (
  <MemoryRouter initialEntries={[url]}>{children}</MemoryRouter>
);

const id = (url: string) => renderHook(() => useSubjectEntityId(), { wrapper: at(url) }).result.current;
const epoch = (url: string) => renderHook(() => useSubjectEpoch(), { wrapper: at(url) }).result.current;

describe("useSubjectEntityId", () => {
  it("reads ?entityId= from the URL", () => {
    expect(id("/tools/planetary-profile?entityId=abc-123")).toBe("abc-123");
    expect(id("/tools/planetary-profile")).toBeNull();
    expect(id("/tools/planetary-profile?entityId=%20")).toBeNull();
  });

  it("accepts the simulators' legacy ?entity= so old links keep working", () => {
    // Brief S1 shipped ?entity= on the sims before F4 settled on ?entityId=.
    expect(id("/tools/tidelock?entity=abc-123")).toBe("abc-123");
    expect(id("/tools/tidelock?entity=%20")).toBeNull();
  });

  it("prefers entityId when a link somehow carries both", () => {
    expect(id("/tools/tidelock?entity=old&entityId=new")).toBe("new");
  });
});

describe("useSubjectEpoch", () => {
  it("parses ?epoch= as a number", () => {
    expect(epoch("/tools/tidelock?epoch=1540")).toBe(1540);
    expect(epoch("/tools/tidelock?epoch=-200")).toBe(-200);
    expect(epoch("/tools/tidelock?epoch=0")).toBe(0);
  });

  it("is null for absent or non-numeric epochs rather than NaN", () => {
    expect(epoch("/tools/tidelock")).toBeNull();
    expect(epoch("/tools/tidelock?epoch=")).toBeNull();
    expect(epoch("/tools/tidelock?epoch=the%20founding")).toBeNull();
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
