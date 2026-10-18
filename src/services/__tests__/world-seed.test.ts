import { beforeEach, describe, expect, it, vi } from "vitest";

const inserted: Record<string, unknown>[] = [];

vi.mock("@/integrations/supabase/client", () => ({
  supabase: {
    from: () => ({
      insert: (row: Record<string, unknown>) => {
        inserted.push(row);
        return { select: () => ({ single: async () => ({ data: { id: "doc-1" }, error: null }) }) };
      },
    }),
  },
}));

const createEntity = vi.fn();
const createEntityConnection = vi.fn();
vi.mock("@/services/entity-graph-crud", () => ({
  createEntity: (...a: unknown[]) => createEntity(...a),
  createEntityConnection: (...a: unknown[]) => createEntityConnection(...a),
}));

import { executeSeed, seedDocumentMeta } from "@/services/world-seed";
import { buildSeedPayload } from "@/lib/onboarding/survey-seed";
import { readDocMeta } from "@/lib/document-meta";

const choices = {
  worldName: "Kellis",
  star: { classId: "K5", name: "Ashe" },
  planet: { presetId: "ocean", name: "" },
  species: { name: "Vethari", bodyPlanId: "spiral", line: "" },
};

beforeEach(() => {
  inserted.length = 0;
  createEntity.mockReset();
  createEntityConnection.mockReset();
  let n = 0;
  createEntity.mockImplementation(async () => ({ id: `e${++n}` }));
  createEntityConnection.mockResolvedValue({});
});

describe("seedDocumentMeta", () => {
  it("resolves set-in and subject to the planet id and leaves POV and synopsis empty", () => {
    const meta = readDocMeta(seedDocumentMeta(buildSeedPayload(choices), { star: "s", planet: "p", species: "x" }));
    expect(meta.setInPlaceId).toBe("p");
    expect(meta.subjectEntityId).toBe("p");
    expect(meta.pov).toBe("");
    expect(meta.povEntityId).toBeUndefined();
    expect(meta.synopsis).toBe("");
  });
});

describe("executeSeed", () => {
  it("writes entities upstream-first, connects them by id, and files an empty Chapter One", async () => {
    const result = await executeSeed(buildSeedPayload(choices), "w1", "u1");

    expect(createEntity).toHaveBeenCalledTimes(3);
    const types = createEntity.mock.calls.map((c) => (c[0] as { entity_type: string }).entity_type);
    expect(types).toEqual(["star", "planet", "species"]);
    const star = createEntity.mock.calls[0][0] as { world_id: string; name: string; metadata: Record<string, unknown> };
    expect(star.world_id).toBe("w1");
    expect(star.name).toBe("Ashe");
    expect(star.metadata.name).toBe("Ashe");
    expect(createEntity.mock.calls[0][1]).toBe("u1");

    expect(result.entityIds).toEqual({ star: "e1", planet: "e2", species: "e3" });
    expect(createEntityConnection.mock.calls.map((c) => c[0])).toEqual([
      expect.objectContaining({ source_entity_id: "e2", target_entity_id: "e1", relationship_type: "orbits" }),
      expect.objectContaining({ source_entity_id: "e3", target_entity_id: "e2", relationship_type: "inhabits" }),
    ]);

    expect(result.documentId).toBe("doc-1");
    expect(inserted).toHaveLength(1);
    const doc = inserted[0];
    expect(doc).toMatchObject({ world_id: "w1", title: "Chapter One", entry_type: "document", content: "", created_by: "u1" });
    expect(readDocMeta(doc.metadata).setInPlaceId).toBe("e2");
  });
});
