import { describe, expect, it, vi } from "vitest";

vi.mock("@/integrations/supabase/client", () => ({ supabase: {} }));

import { applyPendingChanges, type PendingChange } from "@/services/entity-sync";

function change(field: string, newValue: unknown, oldValue: unknown = undefined): PendingChange {
  return {
    field,
    label: field,
    oldValue,
    newValue,
    sourceWorksheetId: "ws-1",
    sourceToolType: "planetary-profile",
  };
}

describe("applyPendingChanges", () => {
  const base = {
    gravity: 1,
    climate: "temperate",
    unrelated: "keep me",
    _pending_changes: [change("gravity", 1.4, 1), change("climate", "arid", "temperate")],
  };

  it("accepts only the named fields and leaves the rest pending", () => {
    const { metadata, applied } = applyPendingChanges(base, ["gravity"]);
    expect(applied).toEqual(["gravity"]);
    expect(metadata.gravity).toBe(1.4);
    expect(metadata.climate).toBe("temperate");
    expect(metadata.unrelated).toBe("keep me");
    expect(metadata._pending_changes).toEqual([change("climate", "arid", "temperate")]);
  });

  it("accepts everything and clears the marker when no fields are named", () => {
    const { metadata, applied } = applyPendingChanges(base);
    expect(applied).toEqual(["gravity", "climate"]);
    expect(metadata.gravity).toBe(1.4);
    expect(metadata.climate).toBe("arid");
    expect(metadata).not.toHaveProperty("_pending_changes");
  });

  it("clears the marker once the last pending field is accepted", () => {
    const first = applyPendingChanges(base, ["gravity"]).metadata;
    const { metadata } = applyPendingChanges(first, ["climate"]);
    expect(metadata).not.toHaveProperty("_pending_changes");
    expect(metadata.climate).toBe("arid");
  });

  it("is a no-op for unknown fields", () => {
    const { metadata, applied } = applyPendingChanges(base, ["nope"]);
    expect(applied).toEqual([]);
    expect(metadata.gravity).toBe(1);
    expect(metadata._pending_changes).toHaveLength(2);
  });

  it("does not mutate its input", () => {
    const input = structuredClone(base);
    applyPendingChanges(input, ["gravity"]);
    expect(input).toEqual(base);
  });
});
