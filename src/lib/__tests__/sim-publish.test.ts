import { describe, it, expect } from "vitest";
import { createCanon } from "@/canon/core";
import { memoryStore } from "@/canon/__tests__/memory-store";
import { publishSimRun, simRunMetadata } from "@/lib/simulators/sim-publish";
import { exoforgeCanon, solarisCanon } from "@/lib/simulators/sim-canon";
import { EXOFORGE_DEFAULT } from "@/lib/__tests__/fixtures/sim-payloads";
import { isStaleFact, rowToCanonFact } from "@/canon/merge";

const src = { toolId: "exoforge", runId: "run-1", seed: null, publishedAt: "2026-11-26T00:00:00Z" };

describe("publishSimRun (X6)", () => {
  it("asserts typed sim facts with provenance and derives gravity through Atlas", async () => {
    const { store } = memoryStore() as unknown as { store: Parameters<typeof createCanon>[0] };
    const canon = createCanon(store);
    const out = await publishSimRun(canon, "w1", exoforgeCanon(EXOFORGE_DEFAULT), { root: "p1", children: {} }, src);
    expect(out.conflicts).toEqual([]);
    expect(out.written).toBeGreaterThan(5);
    const rows = await canon.rows("w1", { subjectId: "p1" });
    const mass = rows.find((r) => r.predicate === "planet.mass")!;
    expect(mass.source_kind).toBe("sim");
    expect(mass.source_ref).toMatchObject({ tool: "exoforge", run_id: "run-1" });
    const g = rows.find((r) => r.predicate === "planet.surface_gravity")!;
    expect(g.value).toMatchObject({ kind: "scalar", value: 1, unit: "g" });
    expect(g.source_ref).toMatchObject({ tool: "atlas", derivation: "atlas.surface_gravity_from_mass_radius", from_run: "run-1" });
  });

  it("never overwrites canon: a differing value is a conflict, and derived facts are marked stale + proposed", async () => {
    const { store } = memoryStore() as unknown as { store: Parameters<typeof createCanon>[0] };
    const canon = createCanon(store);
    await publishSimRun(canon, "w1", exoforgeCanon(EXOFORGE_DEFAULT), { root: "p1", children: {} }, src);
    // The writer's canon mass is 1; a second run says radius 1.5 and mass 1 (unchanged).
    const heavier = { ...EXOFORGE_DEFAULT, parameters: { ...EXOFORGE_DEFAULT.parameters, radius: 1.5, temp: 300 } };
    const out = await publishSimRun(canon, "w1", exoforgeCanon(heavier), { root: "p1", children: {} }, { ...src, runId: "run-2" });
    expect(out.conflicts.map((c) => c.fact.predicate).sort()).toEqual(["planet.radius", "planet.temp_mean"]);
    const radius = (await canon.rows("w1", { subjectId: "p1", predicate: "planet.radius" })).find((r) => r.confidence === "canon")!;
    expect(radius.value).toMatchObject({ value: 1 }); // untouched
    expect(out.stale).toBe(0); // the radius did not change in canon, so nothing downstream is stale
  });

  it("marks an adopted derived value stale and proposes the recomputation, never overwriting it", async () => {
    const { store } = memoryStore() as unknown as { store: Parameters<typeof createCanon>[0] };
    const canon = createCanon(store);
    // The writer adopted 1.4 g by hand before any mass or radius existed.
    await canon.assert({ worldId: "w1", subjectId: "p1", predicate: "planet.surface_gravity", value: { kind: "scalar", value: 1.4, unit: "g" }, sourceKind: "manual" });
    const out = await publishSimRun(canon, "w1", exoforgeCanon(EXOFORGE_DEFAULT), { root: "p1", children: {} }, src);
    expect(out.stale).toBe(1);
    expect(out.proposed).toBeGreaterThanOrEqual(1);
    const rows = await canon.rows("w1", { subjectId: "p1", predicate: "planet.surface_gravity" });
    const adopted = rows.find((x) => x.confidence === "canon")!;
    expect(adopted.value).toMatchObject({ value: 1.4 });
    expect(isStaleFact(rowToCanonFact(adopted))).toBe(true);
    expect(rows.find((x) => x.confidence === "proposed")?.value).toMatchObject({ value: 1 });
  });

  it("puts a Solaris planet's facts on its child entity", async () => {
    const { store } = memoryStore() as unknown as { store: Parameters<typeof createCanon>[0] };
    const canon = createCanon(store);
    const sim = solarisCanon({
      parameters: {
        sf2System: {
          name: "Sol",
          stars: [{ classification: "G", massSOL: 1, luminositySOL: 1, temperatureK: 5772 }],
          planets: [{ name: "Earth", semiMajorAxisAU: 1, orbitalPeriodYears: 1, massEarth: 1, radiusEarth: 1 }],
        },
      },
    });
    await publishSimRun(canon, "w1", sim, { root: "sys", children: { earth: "earth-id" } }, { ...src, toolId: "solaris" });
    const earth = await canon.rows("w1", { subjectId: "earth-id" });
    expect(earth.find((r) => r.predicate === "orbit.period")?.value).toMatchObject({ value: 365.25 });
    // Goldilocks' derivation runs on the planet's host-star facts: 0.95 to 1.68 AU.
    const inner = earth.find((r) => r.predicate === "system.hz_inner")!;
    expect((inner.value as { value: number }).value).toBeCloseTo(0.95, 2);
  });
});

describe("simRunMetadata (E12)", () => {
  it("keeps another tool's run and provenance when a second tool publishes onto the entity", () => {
    const first = simRunMetadata({}, { ...src, toolId: "solaris" }, [], { parameters: { a: 1 } });
    const second = simRunMetadata(first, { ...src, toolId: "exosky", runId: "run-9" }, [], { parameters: { b: 2 } });
    expect((second._source as { tool_id: string }).tool_id).toBe("solaris");
    expect(Object.keys(second._sim_runs as object).sort()).toEqual(["exosky", "solaris"]);
  });
});
