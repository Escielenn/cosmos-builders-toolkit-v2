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

import { emptySeedProgress, executeSeed, fileSurveyRun, newSurveyRun, seedDocumentMeta } from "@/services/world-seed";
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

  it("resumes from the failed step without rewriting what exists", async () => {
    const payload = buildSeedPayload(choices);
    const progress = emptySeedProgress();
    // Second connection fails on the first attempt.
    createEntityConnection.mockResolvedValueOnce({}).mockRejectedValueOnce(new Error("network"));
    await expect(executeSeed(payload, "w1", "u1", progress)).rejects.toThrow("network");
    expect(progress.entityIds).toEqual({ star: "e1", planet: "e2", species: "e3" });
    expect(progress.connectionsDone).toEqual(["planet>orbits>star"]);
    expect(progress.documentId).toBeNull();

    const result = await executeSeed(payload, "w1", "u1", progress);
    expect(createEntity).toHaveBeenCalledTimes(3); // not 6
    expect(createEntityConnection).toHaveBeenCalledTimes(3); // 2 + the retried one
    expect(createEntityConnection.mock.calls[2][0]).toMatchObject({ relationship_type: "inhabits" });
    expect(inserted).toHaveLength(1);
    expect(result).toEqual({ entityIds: { star: "e1", planet: "e2", species: "e3" }, documentId: "doc-1" });

    // A third call after success writes nothing at all.
    await executeSeed(payload, "w1", "u1", progress);
    expect(createEntity).toHaveBeenCalledTimes(3);
    expect(inserted).toHaveLength(1);
  });
});

describe("fileSurveyRun", () => {
  it("creates the world once; a retry after a seeding failure reuses it", async () => {
    const run = newSurveyRun(buildSeedPayload(choices));
    const insertWorld = vi.fn().mockResolvedValue("w-new");
    createEntity.mockReset();
    createEntity.mockResolvedValueOnce({ id: "e1" }).mockRejectedValueOnce(new Error("down"));

    await expect(fileSurveyRun(run, "u1", insertWorld)).rejects.toThrow("down");
    expect(run.worldId).toBe("w-new");

    createEntity.mockResolvedValueOnce({ id: "e2" }).mockResolvedValueOnce({ id: "e3" });
    const result = await fileSurveyRun(run, "u1", insertWorld);
    expect(insertWorld).toHaveBeenCalledTimes(1);
    expect(insertWorld).toHaveBeenCalledWith("Kellis");
    expect(result.worldId).toBe("w-new");
    expect(result.entityIds).toEqual({ star: "e1", planet: "e2", species: "e3" });
    expect(result.documentId).toBe("doc-1");
  });

  it("leaves worldId unset when the world insert itself fails", async () => {
    const run = newSurveyRun(buildSeedPayload(choices));
    await expect(fileSurveyRun(run, "u1", vi.fn().mockRejectedValue(new Error("rls")))).rejects.toThrow("rls");
    expect(run.worldId).toBeNull();
    expect(createEntity).not.toHaveBeenCalled();
  });
});
