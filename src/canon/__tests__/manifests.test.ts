import { describe, it, expect } from "vitest";
import { ENTITY_MASTER_FIELDS } from "@/lib/entity-config";
import { getToolRoute } from "@/lib/tools-config";
import { validateManifest, type ToolManifest } from "@/canon/manifest";
import { MANIFESTS, manifestForTool, producerOf } from "@/canon/manifests";
import { surfaceGravity, escapeVelocity, density } from "@/tools/atlas/manifest";

describe("manifest registry", () => {
  it.each(MANIFESTS.map((m) => [m.id, m] as const))("%s passes the /sf-audit manifest rules", (_id, m) => {
    expect(validateManifest(m)).toEqual([]);
  });

  it("each manifest's route and tool slug match tools-config", () => {
    for (const m of MANIFESTS) expect(getToolRoute(m.tool)).toBe(m.route);
  });

  it("resolves the gravity demo: Genesis owns mass, Atlas owns gravity", () => {
    expect(producerOf("planet.mass")?.id).toBe("genesis");
    expect(producerOf("planet.surface_gravity")?.id).toBe("atlas");
    expect(manifestForTool("planetary-profile")?.consumes.find((c) => c.predicate === "planet.surface_gravity")).toMatchObject({
      onMissing: "link",
      producer: "atlas",
    });
  });

  it("no predicate has two producers among wired tools", () => {
    const seen = new Map<string, string>();
    for (const m of MANIFESTS) {
      for (const p of m.produces) {
        expect(seen.get(p.predicate), p.predicate).toBeUndefined();
        seen.set(p.predicate, m.id);
      }
    }
  });

  it("field paths agree with entity-config's worksheetPaths (no drift from the projection)", () => {
    const paths = new Map<string, string>();
    for (const f of Object.values(ENTITY_MASTER_FIELDS).flat()) {
      for (const [tool, path] of Object.entries(f.worksheetPaths ?? {})) paths.set(`${tool}:${path}`, f.key);
    }
    for (const m of MANIFESTS) {
      for (const p of m.produces) {
        if (!p.from.startsWith("field:")) continue;
        expect(paths.has(`${m.tool}:${p.from.slice(6)}`), `${m.id} ${p.from}`).toBe(true);
      }
    }
  });
});

describe("validateManifest catches charter violations", () => {
  const base = MANIFESTS[0];
  it("flags orphan tools, unknown predicates, dead-end consumes and second producers", () => {
    const bad: ToolManifest = {
      ...base,
      id: "bad",
      produces: [{ predicate: "atlas.gravity", from: "field:x" }, { predicate: "planet.surface_gravity", from: "field:y" }],
      consumes: [{ predicate: "star.luminosity", required: false, onMissing: "prompt" }],
    };
    const rules = validateManifest(bad).map((i) => i.rule);
    expect(rules).toEqual(expect.arrayContaining(["unknown-predicate", "second-producer", "no-prompt"]));
    expect(validateManifest({ ...base, produces: [] }).map((i) => i.rule)).toContain("no-produces");
  });
});

describe("Atlas derivations", () => {
  const earth = { "planet.mass": 1, "planet.radius": 1 };
  it("reproduce Earth from Earth's mass and radius", () => {
    expect(surfaceGravity.fn(earth)).toBeCloseTo(1, 6);
    expect(escapeVelocity.fn(earth)).toBeCloseTo(11.186, 3);
    expect(density.fn(earth)).toBeCloseTo(5.514, 3);
  });
  it("scale as g = M/R²", () => {
    expect(surfaceGravity.fn({ "planet.mass": 5.6, "planet.radius": 2 })).toBeCloseTo(1.4, 6);
  });
  it("refuse impossible inputs rather than inventing a number", () => {
    expect(surfaceGravity.fn({ "planet.mass": 0, "planet.radius": 1 })).toBeNull();
    expect(surfaceGravity.fn({ "planet.mass": 1 })).toBeNull();
  });
  it("narrate consequence, not restatement", () => {
    expect(surfaceGravity.narrative(1.4, {})).toBe(
      "1.40 g. A fall carries 40% more than on Earth. Stairs are a hazard; architecture goes low and wide.",
    );
    expect(surfaceGravity.narrative(1, {})).toContain("the same as on Earth");
    expect(escapeVelocity.narrative(11.186, {})).toMatch(/^Escape velocity 11\.2 km\/s\./);
  });
});
