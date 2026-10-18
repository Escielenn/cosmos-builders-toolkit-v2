// In-memory CanonStore for tests. Enforces the same partial unique index the
// migration does (one live canon fact per world/subject/predicate), so the
// conflict rule is tested against the backstop, not just the happy path.

import type { CanonStore, NewFactRow } from "@/canon/core";
import type { CanonFactRow } from "@/canon/types";

export function memoryStore(seed: CanonFactRow[] = []) {
  const rows = new Map<string, CanonFactRow>(seed.map((r) => [r.id, { ...r }]));
  let n = 0;
  let clock = Date.parse("2026-10-19T00:00:00Z");
  const tick = () => new Date((clock += 1000)).toISOString();
  const failNext: { insert?: unknown } = {};

  const liveCanonClash = (r: CanonFactRow) =>
    [...rows.values()].some(
      (o) =>
        o.id !== r.id &&
        o.world_id === r.world_id &&
        (o.subject_id ?? "") === (r.subject_id ?? "") &&
        o.predicate === r.predicate &&
        o.confidence === "canon" &&
        !o.superseded_at &&
        r.confidence === "canon" &&
        !r.superseded_at,
    );

  const store: CanonStore = {
    async listLive(worldId, filter = {}) {
      return [...rows.values()].filter(
        (r) =>
          r.world_id === worldId &&
          !r.superseded_at &&
          (filter.subjectId === undefined || r.subject_id === filter.subjectId) &&
          (!filter.predicates || filter.predicates.includes(r.predicate)),
      );
    },
    async get(id) {
      return rows.get(id) ?? null;
    },
    async findLiveCanon(worldId, subjectId, predicates) {
      return (
        [...rows.values()].find(
          (r) =>
            r.world_id === worldId &&
            r.subject_id === subjectId &&
            predicates.includes(r.predicate) &&
            r.confidence === "canon" &&
            !r.superseded_at,
        ) ?? null
      );
    },
    async insert(row: NewFactRow) {
      if (failNext.insert) {
        const e = failNext.insert;
        failNext.insert = undefined;
        throw e;
      }
      const t = tick();
      const r: CanonFactRow = {
        ...row,
        id: `f${++n}`,
        asserted_by: "u",
        created_at: t,
        updated_at: t,
        superseded_at: null,
      };
      if (liveCanonClash(r)) throw { code: "23505", message: "duplicate key value violates unique constraint" };
      rows.set(r.id, r);
      return r;
    },
    async update(id, patch) {
      const r = rows.get(id);
      if (!r) throw { code: "PGRST116", message: "no rows" };
      const next = { ...r, ...patch, updated_at: tick() };
      if (liveCanonClash(next)) throw { code: "23505", message: "duplicate key value violates unique constraint" };
      rows.set(id, next);
      return next;
    },
  };

  return { store, rows, failNext };
}

export function row(p: Partial<CanonFactRow> & Pick<CanonFactRow, "id" | "predicate">): CanonFactRow {
  return {
    world_id: "w",
    subject_id: null,
    value: { kind: "text", value: "" },
    value_text: null,
    unit: null,
    confidence: "canon",
    source_kind: "manual",
    source_ref: {},
    asserted_by: "u",
    created_at: "2026-10-01T00:00:00Z",
    updated_at: "2026-10-01T00:00:00Z",
    superseded_at: null,
    ...p,
  };
}
