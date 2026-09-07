// ---------------------------------------------------------------------------
// F3 · one graph — the fold, tested where it is a pure function.
//
// These assertions are the contract every surface downstream depends on: the
// sidebar, the Studio panel, the Showcase and the Web view all read
// world_entries / world_connections through these two mappers.
// ---------------------------------------------------------------------------

import { describe, expect, it } from "vitest";
import {
  ENTITY_ENTRY_TYPES,
  connectionCreateToRow,
  connectionUpdateToRow,
  entityCreateToRow,
  entityUpdateToRow,
  rowToConnection,
  rowToEntity,
  type WorldConnectionRow,
  type WorldEntryRow,
} from "../entity-graph-mapping";
import {
  ENTITY_TYPES,
  LEGACY_CONNECTION_TYPE_MAP,
  RELATIONSHIP_STAGE_OF,
} from "../entity-graph-types";

function entryRow(overrides: Partial<WorldEntryRow> = {}): WorldEntryRow {
  return {
    id: "entry-1",
    world_id: "world-1",
    entry_type: "planet",
    title: "Kellis Prime",
    content: "<p>A tidally locked world.</p>",
    metadata: {},
    tags: ["survey"],
    icon: null,
    color: null,
    parent_id: null,
    sort_order: 3,
    created_by: "user-1",
    created_at: "2026-01-01T00:00:00Z",
    updated_at: "2026-02-01T00:00:00Z",
    ...overrides,
  };
}

function connectionRow(
  overrides: Partial<WorldConnectionRow> = {}
): WorldConnectionRow {
  return {
    id: "conn-1",
    world_id: "world-1",
    source_entry_id: "entry-1",
    target_entry_id: "entry-2",
    connection_type: "orbits",
    description: null,
    created_by: "user-1",
    created_at: "2026-01-01T00:00:00Z",
    updated_at: "2026-01-01T00:00:00Z",
    ...overrides,
  };
}

describe("the node vocabulary", () => {
  it("is exactly ENTITY_TYPES, so nothing else can become a node", () => {
    expect([...ENTITY_ENTRY_TYPES]).toEqual([...ENTITY_TYPES]);
  });

  it("keeps every kind both tables carried before the fold", () => {
    // The five that only `entities` had, and the two that only
    // `world_entries` had. Losing any of these loses rows in the fold.
    for (const t of [
      "star",
      "moon",
      "event",
      "concept",
      "religion",
      "star_system",
      "mythology",
    ]) {
      expect(ENTITY_ENTRY_TYPES).toContain(t);
    }
  });

  it("excludes worksheets, documents and notes — a worksheet is a property, not a node", () => {
    for (const t of [
      "document",
      "folder",
      "note",
      "lore",
      "milestone",
      "habitable_zone",
      "gravity_profile",
      "signal_profile",
    ]) {
      expect(ENTITY_ENTRY_TYPES).not.toContain(t);
    }
  });
});

describe("rowToEntity", () => {
  it("carries the columns straight across", () => {
    const e = rowToEntity(entryRow());
    expect(e.id).toBe("entry-1");
    expect(e.name).toBe("Kellis Prime");
    expect(e.entity_type).toBe("planet");
    expect(e.description).toBe("<p>A tidally locked world.</p>");
    expect(e.user_id).toBe("user-1");
    expect(e.sort_order).toBe(3);
    expect(e.tags).toEqual(["survey"]);
  });

  it("reads the metadata-only fields the entities table had as columns", () => {
    const e = rowToEntity(
      entryRow({
        metadata: {
          summary: "Terminator band, habitable.",
          notes: "Author only.",
          image_url: "https://example.test/a.png",
          cascade_stage: "environment",
          graph_x: 120,
          graph_y: -40,
          pinned: true,
        },
      })
    );
    expect(e.summary).toBe("Terminator band, habitable.");
    expect(e.notes).toBe("Author only.");
    expect(e.image_url).toBe("https://example.test/a.png");
    expect(e.cascade_stage).toBe("environment");
    expect(e.graph_x).toBe(120);
    expect(e.graph_y).toBe(-40);
    expect(e.pinned).toBe(true);
  });

  it("falls back to the type's default stage when metadata carries none", () => {
    expect(rowToEntity(entryRow({ entry_type: "planet" })).cascade_stage).toBe(
      "physics"
    );
    expect(rowToEntity(entryRow({ entry_type: "species" })).cascade_stage).toBe(
      "biology"
    );
    expect(rowToEntity(entryRow({ entry_type: "religion" })).cascade_stage).toBe(
      "mythology"
    );
  });

  it("ignores a cascade_stage that is not one of the six", () => {
    const e = rowToEntity(
      entryRow({ entry_type: "species", metadata: { cascade_stage: "vibes" } })
    );
    expect(e.cascade_stage).toBe("biology");
  });

  it("maps an unknown type to custom and keeps the original as the label", () => {
    const e = rowToEntity(entryRow({ entry_type: "signal_profile" }));
    expect(e.entity_type).toBe("custom");
    expect(e.custom_type_label).toBe("signal_profile");
  });

  it("survives a null metadata blob and a missing sort order", () => {
    const e = rowToEntity(entryRow({ metadata: null, sort_order: null }));
    expect(e.summary).toBeNull();
    expect(e.pinned).toBe(false);
    expect(e.sort_order).toBe(0);
  });

  it("treats parent_id as the hierarchy — the tree survives the fold", () => {
    expect(rowToEntity(entryRow({ parent_id: "entry-9" })).parent_entity_id).toBe(
      "entry-9"
    );
  });
});

describe("entityCreateToRow", () => {
  it("writes the name to title and the description to content", () => {
    const row = entityCreateToRow(
      {
        world_id: "world-1",
        name: "The Spires",
        entity_type: "location",
        description: "<p>A mile and a half.</p>",
      },
      "user-7"
    );
    expect(row.title).toBe("The Spires");
    expect(row.entry_type).toBe("location");
    expect(row.content).toBe("<p>A mile and a half.</p>");
    expect(row.created_by).toBe("user-7");
  });

  it("always stamps a cascade stage, defaulting from the type", () => {
    const row = entityCreateToRow(
      { world_id: "w", name: "Ur", entity_type: "religion" },
      "u"
    );
    expect(row.metadata.cascade_stage).toBe("mythology");
  });

  it("keeps an explicit stage over the type default", () => {
    const row = entityCreateToRow(
      {
        world_id: "w",
        name: "Ur",
        entity_type: "religion",
        cascade_stage: "culture",
      },
      "u"
    );
    expect(row.metadata.cascade_stage).toBe("culture");
  });
});

describe("entityUpdateToRow", () => {
  it("returns no metadata when only columns are touched, so no read is needed", () => {
    const { columns, metadata } = entityUpdateToRow(
      { id: "e", name: "Renamed" },
      { summary: "keep me" }
    );
    expect(columns).toEqual({ title: "Renamed" });
    expect(metadata).toBeNull();
  });

  it("MERGES metadata — setting a position must not erase the summary", () => {
    const { metadata } = entityUpdateToRow(
      { id: "e", graph_x: 10, graph_y: 20, pinned: true },
      { summary: "keep me", notes: "and me" }
    );
    expect(metadata).toMatchObject({
      summary: "keep me",
      notes: "and me",
      graph_x: 10,
      graph_y: 20,
      pinned: true,
    });
  });

  it("drops a metadata key that is set to null rather than storing a null", () => {
    const { metadata } = entityUpdateToRow(
      { id: "e", summary: null },
      { summary: "old", notes: "keep" }
    );
    expect(metadata).not.toHaveProperty("summary");
    expect(metadata).toMatchObject({ notes: "keep" });
  });

  it("moves the default stage when the type changes and no stage was given", () => {
    const { columns, metadata } = entityUpdateToRow(
      { id: "e", entity_type: "species" },
      { cascade_stage: "physics" }
    );
    expect(columns.entry_type).toBe("species");
    expect(metadata?.cascade_stage).toBe("biology");
  });

  it("does not move the stage when the caller set one explicitly", () => {
    const { metadata } = entityUpdateToRow(
      { id: "e", entity_type: "species", cascade_stage: "mythology" },
      {}
    );
    expect(metadata?.cascade_stage).toBe("mythology");
  });

  it("maps parent_entity_id onto parent_id, including a clear to null", () => {
    expect(
      entityUpdateToRow({ id: "e", parent_entity_id: null }, {}).columns
    ).toEqual({ parent_id: null });
  });
});

describe("rowToConnection", () => {
  it("is null for a worksheet-to-worksheet row — not an edge on the Web", () => {
    expect(
      rowToConnection(
        connectionRow({ source_entry_id: null, target_entry_id: null })
      )
    ).toBeNull();
    expect(
      rowToConnection(connectionRow({ target_entry_id: null }))
    ).toBeNull();
  });

  it("carries the typed columns across", () => {
    const c = rowToConnection(
      connectionRow({
        connection_type: "worships",
        relationship_label: "venerates",
        cascade_stage: "mythology",
        bidirectional: true,
        strength: 8,
        status: "historical",
        time_start: "1540",
        time_end: "1602",
      })
    );
    expect(c).not.toBeNull();
    expect(c!.relationship_type).toBe("worships");
    expect(c!.relationship_label).toBe("venerates");
    expect(c!.cascade_stage).toBe("mythology");
    expect(c!.bidirectional).toBe(true);
    expect(c!.strength).toBe(8);
    expect(c!.status).toBe("historical");
    expect(c!.time_start).toBe("1540");
    expect(c!.time_end).toBe("1602");
  });

  it("infers the stage from the verb on a row written before F3", () => {
    // A pre-migration row has no cascade_stage column at all.
    const c = rowToConnection(connectionRow({ connection_type: "preys_on" }));
    expect(c!.cascade_stage).toBe("biology");
    expect(RELATIONSHIP_STAGE_OF.preys_on).toBe("biology");
  });

  it("falls back to cross_cascade for a verb nobody wrote down", () => {
    const c = rowToConnection(connectionRow({ connection_type: "smells_like" }));
    expect(c!.cascade_stage).toBe("cross_cascade");
  });

  it("renames the legacy verbs onto the one vocabulary", () => {
    expect(
      rowToConnection(connectionRow({ connection_type: "lives_on" }))!
        .relationship_type
    ).toBe("inhabits");
    expect(
      rowToConnection(connectionRow({ connection_type: "fights" }))!
        .relationship_type
    ).toBe("enemy_of");
  });

  it("maps every legacy verb to a verb the vocabulary actually has", () => {
    for (const target of Object.values(LEGACY_CONNECTION_TYPE_MAP)) {
      expect(RELATIONSHIP_STAGE_OF[target]).toBeDefined();
    }
  });

  it("defaults an unrecognised status to active rather than dropping the edge", () => {
    expect(rowToConnection(connectionRow({ status: "wobbly" }))!.status).toBe(
      "active"
    );
    expect(rowToConnection(connectionRow({ status: null }))!.status).toBe(
      "active"
    );
  });

  it("uses description as the note when the F3 notes column is absent", () => {
    const c = rowToConnection(
      connectionRow({ description: "from the survey", notes: undefined })
    );
    expect(c!.notes).toBe("from the survey");
  });
});

describe("connection writes", () => {
  it("splits the row so the F3 half can be dropped on an un-migrated database", () => {
    const { base, f3 } = connectionCreateToRow(
      {
        world_id: "w",
        source_entity_id: "a",
        target_entity_id: "b",
        relationship_type: "orbits",
        cascade_stage: "physics",
      },
      "user-1"
    );
    expect(base).toEqual({
      world_id: "w",
      source_entry_id: "a",
      target_entry_id: "b",
      connection_type: "orbits",
      description: null,
      created_by: "user-1",
    });
    expect(f3.cascade_stage).toBe("physics");
    expect(f3.status).toBe("active");
  });

  it("stamps a stage from the verb when the caller gave none", () => {
    const { f3 } = connectionCreateToRow(
      {
        world_id: "w",
        source_entity_id: "a",
        target_entity_id: "b",
        relationship_type: "worships",
        cascade_stage: undefined as never,
      },
      "u"
    );
    expect(f3.cascade_stage).toBe("mythology");
  });

  it("only writes the fields an update actually names", () => {
    const { base, f3 } = connectionUpdateToRow({ id: "c", strength: 9 });
    expect(base).toEqual({});
    expect(f3).toEqual({ strength: 9 });
  });
});
