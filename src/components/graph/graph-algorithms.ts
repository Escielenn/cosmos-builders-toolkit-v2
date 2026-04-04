// ---------------------------------------------------------------------------
// Graph algorithms for the World Graph.
// All run client-side on in-memory node/edge arrays.
// ---------------------------------------------------------------------------

import {
  CASCADE_STAGES,
  CASCADE_STAGE_LABELS,
  type Entity,
  type EntityConnection,
  type CascadeStage,
  formatRelationshipType,
} from "@/services/entity-graph-types";

// ---------------------------------------------------------------------------
// Cascade stage ordering (for directional BFS)
// ---------------------------------------------------------------------------

const STAGE_ORDER: Record<CascadeStage, number> = {
  physics: 0,
  environment: 1,
  biology: 2,
  psychology: 3,
  mythology: 4,
  culture: 5,
};

// ---------------------------------------------------------------------------
// Cascade Flow Layout (section 6.2)
// Arranges nodes into vertical columns by cascade stage.
// ---------------------------------------------------------------------------

export function cascadeFlowLayout(
  entities: Entity[],
  canvasWidth: number,
  canvasHeight: number
): Map<string, { x: number; y: number }> {
  const positions = new Map<string, { x: number; y: number }>();

  // Group entities by cascade stage
  const groups: Record<CascadeStage, Entity[]> = {
    physics: [],
    environment: [],
    biology: [],
    psychology: [],
    mythology: [],
    culture: [],
  };

  for (const e of entities) {
    const stage = e.cascade_stage;
    if (groups[stage]) {
      groups[stage].push(e);
    } else {
      groups.culture.push(e);
    }
  }

  // Column positions
  const columnCount = CASCADE_STAGES.length;
  const columnWidth = canvasWidth / columnCount;
  const padding = 40;

  for (let i = 0; i < CASCADE_STAGES.length; i++) {
    const stage = CASCADE_STAGES[i];
    const group = groups[stage];
    const x = i * columnWidth + columnWidth / 2;

    // Vertically space entities in each column
    const totalHeight = group.length * 120;
    const startY = Math.max(
      padding,
      (canvasHeight - totalHeight) / 2
    );

    for (let j = 0; j < group.length; j++) {
      positions.set(group[j].id, {
        x: x - 80, // offset for node width
        y: startY + j * 120,
      });
    }
  }

  return positions;
}

// ---------------------------------------------------------------------------
// Cascade Path Highlighting (section 6.3)
// BFS upstream and downstream from a selected entity through the cascade.
// ---------------------------------------------------------------------------

export interface CascadePath {
  /** All entity IDs in the cascade chain */
  entityIds: Set<string>;
  /** All connection IDs in the cascade chain */
  connectionIds: Set<string>;
  /** Upstream entity IDs (toward physics) */
  upstreamIds: Set<string>;
  /** Downstream entity IDs (toward culture) */
  downstreamIds: Set<string>;
}

export function traceCascadePath(
  entities: Entity[],
  connections: EntityConnection[],
  startEntityId: string
): CascadePath {
  const entityMap = new Map(entities.map((e) => [e.id, e]));
  const startEntity = entityMap.get(startEntityId);
  if (!startEntity) {
    return {
      entityIds: new Set(),
      connectionIds: new Set(),
      upstreamIds: new Set(),
      downstreamIds: new Set(),
    };
  }

  const startStageOrder = STAGE_ORDER[startEntity.cascade_stage];

  // Build adjacency lists
  const outgoing = new Map<string, Array<{ conn: EntityConnection; targetId: string }>>();
  const incoming = new Map<string, Array<{ conn: EntityConnection; sourceId: string }>>();

  for (const c of connections) {
    const outList = outgoing.get(c.source_entity_id) ?? [];
    outList.push({ conn: c, targetId: c.target_entity_id });
    outgoing.set(c.source_entity_id, outList);

    const inList = incoming.get(c.target_entity_id) ?? [];
    inList.push({ conn: c, sourceId: c.source_entity_id });
    incoming.set(c.target_entity_id, inList);

    // For bidirectional connections, add reverse direction
    if (c.bidirectional) {
      const revOut = outgoing.get(c.target_entity_id) ?? [];
      revOut.push({ conn: c, targetId: c.source_entity_id });
      outgoing.set(c.target_entity_id, revOut);

      const revIn = incoming.get(c.source_entity_id) ?? [];
      revIn.push({ conn: c, sourceId: c.target_entity_id });
      incoming.set(c.source_entity_id, revIn);
    }
  }

  const result: CascadePath = {
    entityIds: new Set([startEntityId]),
    connectionIds: new Set(),
    upstreamIds: new Set(),
    downstreamIds: new Set(),
  };

  // BFS downstream (same or later cascade stage)
  const downQueue = [startEntityId];
  const downVisited = new Set([startEntityId]);

  while (downQueue.length > 0) {
    const current = downQueue.shift()!;
    const currentEntity = entityMap.get(current);
    if (!currentEntity) continue;

    const edges = outgoing.get(current) ?? [];
    for (const { conn, targetId } of edges) {
      if (downVisited.has(targetId)) continue;
      const targetEntity = entityMap.get(targetId);
      if (!targetEntity) continue;

      const targetOrder = STAGE_ORDER[targetEntity.cascade_stage];
      const currentOrder = STAGE_ORDER[currentEntity.cascade_stage];

      // Follow edges where target is same or later stage
      if (targetOrder >= currentOrder) {
        downVisited.add(targetId);
        downQueue.push(targetId);
        result.entityIds.add(targetId);
        result.connectionIds.add(conn.id);
        result.downstreamIds.add(targetId);
      }
    }
  }

  // BFS upstream (same or earlier cascade stage)
  const upQueue = [startEntityId];
  const upVisited = new Set([startEntityId]);

  while (upQueue.length > 0) {
    const current = upQueue.shift()!;
    const currentEntity = entityMap.get(current);
    if (!currentEntity) continue;

    const edges = incoming.get(current) ?? [];
    for (const { conn, sourceId } of edges) {
      if (upVisited.has(sourceId)) continue;
      const sourceEntity = entityMap.get(sourceId);
      if (!sourceEntity) continue;

      const sourceOrder = STAGE_ORDER[sourceEntity.cascade_stage];
      const currentOrder = STAGE_ORDER[currentEntity.cascade_stage];

      // Follow edges where source is same or earlier stage
      if (sourceOrder <= currentOrder) {
        upVisited.add(sourceId);
        upQueue.push(sourceId);
        result.entityIds.add(sourceId);
        result.connectionIds.add(conn.id);
        result.upstreamIds.add(sourceId);
      }
    }
  }

  return result;
}

// ===========================================================================
// PHASE 3: Analytical Tools
// ===========================================================================

// ---------------------------------------------------------------------------
// 7.3 Gravity Analysis — weighted degree centrality
// ---------------------------------------------------------------------------

export interface GravityResult {
  entityId: string;
  name: string;
  entityType: string;
  weightedConnections: number;
  centrality: number; // 0–1 normalized
  isOrphan: boolean;
}

export function computeGravity(
  entities: Entity[],
  connections: EntityConnection[]
): GravityResult[] {
  // Sum connection strengths per entity
  const weights = new Map<string, number>();
  for (const c of connections) {
    weights.set(c.source_entity_id, (weights.get(c.source_entity_id) ?? 0) + c.strength);
    weights.set(c.target_entity_id, (weights.get(c.target_entity_id) ?? 0) + c.strength);
  }

  const maxWeight = Math.max(1, ...weights.values());

  return entities
    .map((e) => {
      const w = weights.get(e.id) ?? 0;
      return {
        entityId: e.id,
        name: e.name,
        entityType: e.entity_type,
        weightedConnections: w,
        centrality: w / maxWeight,
        isOrphan: w === 0,
      };
    })
    .sort((a, b) => b.weightedConnections - a.weightedConnections);
}

// ---------------------------------------------------------------------------
// 7.1 Narrative Distance — BFS pathfinding between two entities
// ---------------------------------------------------------------------------

export interface PathStep {
  entityId: string;
  entityName: string;
  connectionId: string | null;
  relationshipLabel: string;
  cascadeStage: string;
}

export interface NarrativePath {
  steps: PathStep[];
  hopCount: number;
  cascadeStagesCrossed: string[];
  /** Template-based story seed (section 8.2) */
  storySeed: string;
}

export function findAllPaths(
  entities: Entity[],
  connections: EntityConnection[],
  sourceId: string,
  targetId: string,
  maxDepth: number = 8
): NarrativePath[] {
  const entityMap = new Map(entities.map((e) => [e.id, e]));

  // Build bidirectional adjacency
  const adjacency = new Map<string, Array<{ connId: string; neighborId: string; relType: string; relLabel: string | null; stage: string }>>();

  for (const c of connections) {
    // Forward
    const fwd = adjacency.get(c.source_entity_id) ?? [];
    fwd.push({
      connId: c.id,
      neighborId: c.target_entity_id,
      relType: c.relationship_type,
      relLabel: c.relationship_label,
      stage: c.cascade_stage,
    });
    adjacency.set(c.source_entity_id, fwd);

    // Reverse (always traversable for pathfinding)
    const rev = adjacency.get(c.target_entity_id) ?? [];
    rev.push({
      connId: c.id,
      neighborId: c.source_entity_id,
      relType: c.relationship_type,
      relLabel: c.relationship_label,
      stage: c.cascade_stage,
    });
    adjacency.set(c.target_entity_id, rev);
  }

  const results: NarrativePath[] = [];

  // BFS to find up to 5 shortest paths
  type QueueItem = { path: Array<{ entityId: string; connId: string | null; relLabel: string; stage: string }> };
  const queue: QueueItem[] = [{ path: [{ entityId: sourceId, connId: null, relLabel: "", stage: "" }] }];

  let shortestFound = maxDepth;

  while (queue.length > 0 && results.length < 5) {
    const { path } = queue.shift()!;
    const current = path[path.length - 1].entityId;

    if (path.length - 1 > shortestFound + 1) continue;

    if (current === targetId && path.length > 1) {
      if (results.length === 0) shortestFound = path.length - 1;

      const stages = new Set<string>();
      const steps: PathStep[] = path.map((p) => {
        const entity = entityMap.get(p.entityId);
        if (p.stage) stages.add(p.stage);
        return {
          entityId: p.entityId,
          entityName: entity?.name ?? "Unknown",
          connectionId: p.connId,
          relationshipLabel: p.relLabel,
          cascadeStage: p.stage,
        };
      });

      const stagesCrossed = Array.from(stages);
      results.push({
        steps,
        hopCount: path.length - 1,
        cascadeStagesCrossed: stagesCrossed,
        storySeed: generateStorySeed(stagesCrossed),
      });
      continue;
    }

    if (path.length - 1 >= maxDepth) continue;

    const visited = new Set(path.map((p) => p.entityId));
    const neighbors = adjacency.get(current) ?? [];

    for (const { connId, neighborId, relType, relLabel, stage } of neighbors) {
      if (visited.has(neighborId)) continue;
      queue.push({
        path: [
          ...path,
          {
            entityId: neighborId,
            connId,
            relLabel: relLabel ?? formatRelationshipType(relType),
            stage,
          },
        ],
      });
    }
  }

  return results;
}

// Section 8.2: Template-based story seeds
const STAGE_NARRATIVE_LABELS: Record<string, string> = {
  physics: "the fundamental forces",
  environment: "the physical landscape",
  biology: "the living world",
  psychology: "the inner life",
  mythology: "the sacred narrative",
  culture: "the social fabric",
  cross_cascade: "the threads between layers",
};

function generateStorySeed(stagesCrossed: string[]): string {
  if (stagesCrossed.length === 0) return "";
  if (stagesCrossed.length === 1) {
    const label = STAGE_NARRATIVE_LABELS[stagesCrossed[0]] ?? stagesCrossed[0];
    return `A thread through ${label}.`;
  }
  const first = STAGE_NARRATIVE_LABELS[stagesCrossed[0]] ?? stagesCrossed[0];
  const last = STAGE_NARRATIVE_LABELS[stagesCrossed[stagesCrossed.length - 1]] ?? stagesCrossed[stagesCrossed.length - 1];
  if (stagesCrossed.length === 2) {
    return `A thread from ${first} to ${last}.`;
  }
  const middle = stagesCrossed
    .slice(1, -1)
    .map((s) => STAGE_NARRATIVE_LABELS[s] ?? s)
    .join(", ");
  return `A thread from ${first} through ${middle} to ${last}.`;
}

// ---------------------------------------------------------------------------
// 7.2 Tension Detection — structural contradictions
// ---------------------------------------------------------------------------

export interface Tension {
  type: "triangle_conflict" | "cascade_contradiction" | "orphaned_downstream" | "power_paradox" | "severed_legacy";
  title: string;
  description: string;
  entityIds: string[];
  connectionIds: string[];
}

export function detectTensions(
  entities: Entity[],
  connections: EntityConnection[]
): Tension[] {
  const tensions: Tension[] = [];
  const entityMap = new Map(entities.map((e) => [e.id, e]));

  // Build adjacency with relationship types
  const connsByEntity = new Map<string, EntityConnection[]>();
  for (const c of connections) {
    const src = connsByEntity.get(c.source_entity_id) ?? [];
    src.push(c);
    connsByEntity.set(c.source_entity_id, src);
    const tgt = connsByEntity.get(c.target_entity_id) ?? [];
    tgt.push(c);
    connsByEntity.set(c.target_entity_id, tgt);
  }

  // Pattern 1: Triangle Conflict
  // A allied_with B, B enemy_of C, A trades_with C (or similar opposing relationships)
  const hostile = new Set(["enemy_of", "competes_with", "fears", "exiled_from"]);
  const cooperative = new Set(["allied_with", "trades_with", "member_of", "serves", "mentors"]);

  for (const c1 of connections) {
    if (!cooperative.has(c1.relationship_type)) continue;
    const aId = c1.source_entity_id;
    const bId = c1.target_entity_id;

    // Find B's hostile connections
    const bConns = connsByEntity.get(bId) ?? [];
    for (const c2 of bConns) {
      if (!hostile.has(c2.relationship_type)) continue;
      const cId = c2.source_entity_id === bId ? c2.target_entity_id : c2.source_entity_id;
      if (cId === aId) continue;

      // Check if A has cooperative connection to C
      const aConns = connsByEntity.get(aId) ?? [];
      const aToC = aConns.find(
        (c) =>
          cooperative.has(c.relationship_type) &&
          (c.target_entity_id === cId || c.source_entity_id === cId)
      );

      if (aToC) {
        const aName = entityMap.get(aId)?.name ?? "?";
        const bName = entityMap.get(bId)?.name ?? "?";
        const cName = entityMap.get(cId)?.name ?? "?";
        tensions.push({
          type: "triangle_conflict",
          title: `${aName} caught between ${bName} and ${cName}`,
          description: `${aName} has cooperative ties to both ${bName} and ${cName}, but ${bName} is hostile toward ${cName}. This tension could drive betrayal, diplomacy, or schism.`,
          entityIds: [aId, bId, cId],
          connectionIds: [c1.id, c2.id, aToC.id],
        });
      }
    }
  }

  // Pattern 3: Orphaned Downstream
  // Biology entities with psychology connections but no environment/physics grounding
  for (const e of entities) {
    if (e.cascade_stage !== "biology") continue;
    const eConns = connsByEntity.get(e.id) ?? [];

    const hasDownstream = eConns.some((c) => {
      const otherId = c.source_entity_id === e.id ? c.target_entity_id : c.source_entity_id;
      const other = entityMap.get(otherId);
      return other && STAGE_ORDER[other.cascade_stage] > STAGE_ORDER.biology;
    });

    const hasUpstream = eConns.some((c) => {
      const otherId = c.source_entity_id === e.id ? c.target_entity_id : c.source_entity_id;
      const other = entityMap.get(otherId);
      return other && STAGE_ORDER[other.cascade_stage] < STAGE_ORDER.biology;
    });

    if (hasDownstream && !hasUpstream) {
      tensions.push({
        type: "orphaned_downstream",
        title: `${e.name} has no environmental grounding`,
        description: `This species has psychological or cultural connections downstream but no connection to physics or environment upstream. What physical conditions produced this biology?`,
        entityIds: [e.id],
        connectionIds: [],
      });
    }
  }

  // Pattern 4: Power Paradox
  // Two "rules" connections to the same target
  const rulesConns = connections.filter((c) => c.relationship_type === "rules");
  const ruledBy = new Map<string, EntityConnection[]>();
  for (const c of rulesConns) {
    const list = ruledBy.get(c.target_entity_id) ?? [];
    list.push(c);
    ruledBy.set(c.target_entity_id, list);
  }
  for (const [targetId, rulers] of ruledBy) {
    if (rulers.length >= 2) {
      const targetName = entityMap.get(targetId)?.name ?? "?";
      const rulerNames = rulers.map((r) => entityMap.get(r.source_entity_id)?.name ?? "?");
      tensions.push({
        type: "power_paradox",
        title: `Contested territory: ${targetName}`,
        description: `${rulerNames.join(" and ")} both claim to rule ${targetName}. Who actually controls it? This contest could drive conflict, negotiation, or partition.`,
        entityIds: [targetId, ...rulers.map((r) => r.source_entity_id)],
        connectionIds: rulers.map((r) => r.id),
      });
    }
  }

  // Pattern 5: Severed Legacy
  // Connections with status 'severed' where downstream connections still assume active
  for (const c of connections) {
    if (c.status !== "severed") continue;
    const targetEntity = entityMap.get(c.target_entity_id);
    if (!targetEntity) continue;

    // Check if target has active downstream connections
    const targetConns = connsByEntity.get(c.target_entity_id) ?? [];
    const activeDownstream = targetConns.filter((tc) => {
      if (tc.status !== "active") return false;
      const otherId = tc.source_entity_id === c.target_entity_id ? tc.target_entity_id : tc.source_entity_id;
      const other = entityMap.get(otherId);
      return other && STAGE_ORDER[other.cascade_stage] >= STAGE_ORDER[targetEntity.cascade_stage];
    });

    if (activeDownstream.length > 0) {
      const sourceName = entityMap.get(c.source_entity_id)?.name ?? "?";
      tensions.push({
        type: "severed_legacy",
        title: `Severed connection still has downstream effects`,
        description: `The connection from ${sourceName} to ${targetEntity.name} was severed, but ${targetEntity.name} still has ${activeDownstream.length} active downstream relationship(s). These may need revision.`,
        entityIds: [c.source_entity_id, c.target_entity_id],
        connectionIds: [c.id, ...activeDownstream.map((d) => d.id)],
      });
    }
  }

  // Deduplicate by sorting entity ID sets
  const seen = new Set<string>();
  return tensions.filter((t) => {
    const key = `${t.type}:${t.entityIds.sort().join(",")}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

// ---------------------------------------------------------------------------
// 7.4 Cluster Discovery — simple modularity-based community detection
// Uses a greedy algorithm: start with each node in its own cluster,
// then merge the pair with the most connections until no improvement.
// ---------------------------------------------------------------------------

export interface Cluster {
  id: number;
  label: string;
  entityIds: string[];
  internalDensity: number;
  externalConnections: number;
}

export interface ClusterResult {
  clusters: Cluster[];
  bridgeEntities: Array<{ entityId: string; name: string; clusterIds: number[] }>;
}

export function detectClusters(
  entities: Entity[],
  connections: EntityConnection[]
): ClusterResult {
  if (entities.length === 0) return { clusters: [], bridgeEntities: [] };

  const entityMap = new Map(entities.map((e) => [e.id, e]));
  const entityIds = entities.map((e) => e.id);

  // Adjacency counts between entities
  const pairCounts = new Map<string, number>();
  for (const c of connections) {
    const key = [c.source_entity_id, c.target_entity_id].sort().join(":");
    pairCounts.set(key, (pairCounts.get(key) ?? 0) + 1);
  }

  // Start: each entity in its own cluster
  const clusterOf = new Map<string, number>();
  let nextClusterId = 0;
  for (const id of entityIds) {
    clusterOf.set(id, nextClusterId++);
  }

  // Greedy merging: merge clusters with most inter-connections
  let improved = true;
  while (improved) {
    improved = false;
    const clusterPairStrength = new Map<string, number>();

    for (const c of connections) {
      const c1 = clusterOf.get(c.source_entity_id)!;
      const c2 = clusterOf.get(c.target_entity_id)!;
      if (c1 === c2) continue;
      const key = [Math.min(c1, c2), Math.max(c1, c2)].join(":");
      clusterPairStrength.set(key, (clusterPairStrength.get(key) ?? 0) + c.strength);
    }

    // Find strongest pair
    let bestKey = "";
    let bestStrength = 0;
    for (const [key, strength] of clusterPairStrength) {
      if (strength > bestStrength) {
        bestStrength = strength;
        bestKey = key;
      }
    }

    // Only merge if strength > threshold (at least 2 connections or 1 strong one)
    if (bestStrength >= 5 && bestKey) {
      const [c1, c2] = bestKey.split(":").map(Number);
      // Merge c2 into c1
      for (const [id, cluster] of clusterOf) {
        if (cluster === c2) clusterOf.set(id, c1);
      }
      improved = true;
    }
  }

  // Build cluster groups
  const clusterGroups = new Map<number, string[]>();
  for (const [id, cluster] of clusterOf) {
    const group = clusterGroups.get(cluster) ?? [];
    group.push(id);
    clusterGroups.set(cluster, group);
  }

  // Remove singleton clusters
  const multiClusters = Array.from(clusterGroups.entries())
    .filter(([, ids]) => ids.length > 1);

  const clusters: Cluster[] = multiClusters.map(([clusterId, ids], i) => {
    // Count internal connections
    const idSet = new Set(ids);
    let internalConns = 0;
    let externalConns = 0;

    for (const c of connections) {
      const srcIn = idSet.has(c.source_entity_id);
      const tgtIn = idSet.has(c.target_entity_id);
      if (srcIn && tgtIn) internalConns++;
      else if (srcIn || tgtIn) externalConns++;
    }

    const maxPossible = (ids.length * (ids.length - 1)) / 2;
    const density = maxPossible > 0 ? internalConns / maxPossible : 0;

    // Generate label from most common entity types
    const typeCounts = new Map<string, number>();
    for (const id of ids) {
      const e = entityMap.get(id);
      if (e) typeCounts.set(e.entity_type, (typeCounts.get(e.entity_type) ?? 0) + 1);
    }
    const topTypes = Array.from(typeCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 2)
      .map(([t]) => t.charAt(0).toUpperCase() + t.slice(1));

    return {
      id: i,
      label: topTypes.length > 0 ? `${topTypes.join("-")} Cluster` : `Cluster ${i + 1}`,
      entityIds: ids,
      internalDensity: Math.round(density * 100) / 100,
      externalConnections: externalConns,
    };
  });

  // Bridge entities: appear in connections to multiple clusters
  const entityClusterConnections = new Map<string, Set<number>>();
  for (const c of connections) {
    const srcCluster = multiClusters.findIndex(([, ids]) => ids.includes(c.source_entity_id));
    const tgtCluster = multiClusters.findIndex(([, ids]) => ids.includes(c.target_entity_id));
    if (srcCluster >= 0) {
      const set = entityClusterConnections.get(c.source_entity_id) ?? new Set();
      set.add(srcCluster);
      if (tgtCluster >= 0 && tgtCluster !== srcCluster) set.add(tgtCluster);
      entityClusterConnections.set(c.source_entity_id, set);
    }
    if (tgtCluster >= 0) {
      const set = entityClusterConnections.get(c.target_entity_id) ?? new Set();
      set.add(tgtCluster);
      if (srcCluster >= 0 && srcCluster !== tgtCluster) set.add(srcCluster);
      entityClusterConnections.set(c.target_entity_id, set);
    }
  }

  const bridgeEntities = Array.from(entityClusterConnections.entries())
    .filter(([, clusters]) => clusters.size > 1)
    .map(([entityId, clusterIds]) => ({
      entityId,
      name: entityMap.get(entityId)?.name ?? "?",
      clusterIds: Array.from(clusterIds),
    }));

  return { clusters, bridgeEntities };
}

// ---------------------------------------------------------------------------
// 8.1 What-If Removal — hypothetical entity removal impact analysis
// ---------------------------------------------------------------------------

export interface WhatIfResult {
  removedEntityId: string;
  removedEntityName: string;
  severedConnections: Array<{
    connectionId: string;
    otherEntityId: string;
    otherEntityName: string;
    relationshipType: string;
  }>;
  newlyOrphanedEntities: Array<{
    entityId: string;
    entityName: string;
  }>;
  cascadeBreaks: Array<{
    description: string;
    entityIds: string[];
  }>;
  structuralImpact: "low" | "medium" | "high";
}

export function analyzeRemoval(
  entities: Entity[],
  connections: EntityConnection[],
  entityId: string
): WhatIfResult {
  const entityMap = new Map(entities.map((e) => [e.id, e]));
  const entity = entityMap.get(entityId);
  if (!entity) {
    return {
      removedEntityId: entityId,
      removedEntityName: "Unknown",
      severedConnections: [],
      newlyOrphanedEntities: [],
      cascadeBreaks: [],
      structuralImpact: "low",
    };
  }

  // Find all connections involving this entity
  const severedConnections = connections
    .filter((c) => c.source_entity_id === entityId || c.target_entity_id === entityId)
    .map((c) => {
      const otherId = c.source_entity_id === entityId ? c.target_entity_id : c.source_entity_id;
      return {
        connectionId: c.id,
        otherEntityId: otherId,
        otherEntityName: entityMap.get(otherId)?.name ?? "?",
        relationshipType: c.relationship_type,
      };
    });

  // Find entities that would become orphaned (only connected through removed entity)
  const remainingConnections = connections.filter(
    (c) => c.source_entity_id !== entityId && c.target_entity_id !== entityId
  );
  const connectedInRemaining = new Set<string>();
  for (const c of remainingConnections) {
    connectedInRemaining.add(c.source_entity_id);
    connectedInRemaining.add(c.target_entity_id);
  }

  const affectedEntityIds = new Set(severedConnections.map((s) => s.otherEntityId));
  const newlyOrphanedEntities = Array.from(affectedEntityIds)
    .filter((id) => !connectedInRemaining.has(id))
    .map((id) => ({
      entityId: id,
      entityName: entityMap.get(id)?.name ?? "?",
    }));

  // Cascade breaks: check if removing this entity breaks cascade chains
  const cascadeBreaks: Array<{ description: string; entityIds: string[] }> = [];

  // For each downstream entity that was connected through the removed entity,
  // check if it loses its upstream cascade grounding
  const removedStage = STAGE_ORDER[entity.cascade_stage];
  for (const sc of severedConnections) {
    const other = entityMap.get(sc.otherEntityId);
    if (!other) continue;
    const otherStage = STAGE_ORDER[other.cascade_stage];

    if (otherStage > removedStage) {
      // Check if this entity has any other upstream connections remaining
      const otherRemainingConns = remainingConnections.filter(
        (c) => c.source_entity_id === sc.otherEntityId || c.target_entity_id === sc.otherEntityId
      );
      const hasUpstreamRemaining = otherRemainingConns.some((c) => {
        const neighborId = c.source_entity_id === sc.otherEntityId ? c.target_entity_id : c.source_entity_id;
        const neighbor = entityMap.get(neighborId);
        return neighbor && STAGE_ORDER[neighbor.cascade_stage] <= removedStage;
      });

      if (!hasUpstreamRemaining) {
        cascadeBreaks.push({
          description: `${other.name} loses ${CASCADE_STAGE_LABELS[entity.cascade_stage]} grounding`,
          entityIds: [sc.otherEntityId],
        });
      }
    }
  }

  // Structural impact
  const totalConns = connections.length;
  const severedRatio = severedConnections.length / Math.max(1, totalConns);
  const structuralImpact: "low" | "medium" | "high" =
    severedRatio > 0.3 || cascadeBreaks.length >= 3
      ? "high"
      : severedRatio > 0.1 || cascadeBreaks.length >= 1
        ? "medium"
        : "low";

  return {
    removedEntityId: entityId,
    removedEntityName: entity.name,
    severedConnections,
    newlyOrphanedEntities,
    cascadeBreaks,
    structuralImpact,
  };
}

// ===========================================================================
// PHASE 4: Cascade Audit + Timeline
// ===========================================================================

// ---------------------------------------------------------------------------
// 9. Cascade Audit — full upstream/downstream tree tracing
// ---------------------------------------------------------------------------

export interface CascadeAuditNode {
  entityId: string;
  entityName: string;
  entityType: string;
  cascadeStage: CascadeStage;
  connectionLabel: string; // relationship label from parent → this node
  connectionId: string | null;
  children: CascadeAuditNode[];
}

export interface CascadeAuditResult {
  rootEntityId: string;
  rootEntityName: string;
  rootCascadeStage: CascadeStage;
  upstream: CascadeAuditNode[];
  downstream: CascadeAuditNode[];
  /** All entity IDs in the audit tree */
  allEntityIds: Set<string>;
  /** All connection IDs in the audit tree */
  allConnectionIds: Set<string>;
  /** Cascade depth: how many stages are covered */
  cascadeDepth: number;
  /** Total entities affected */
  totalAffected: number;
  /** Widest branch: stage with most downstream entities */
  widestBranch: { stage: CascadeStage; count: number } | null;
  /** What-if prompt */
  whatIfPrompt: string;
}

export function cascadeAudit(
  entities: Entity[],
  connections: EntityConnection[],
  entityId: string
): CascadeAuditResult {
  const entityMap = new Map(entities.map((e) => [e.id, e]));
  const entity = entityMap.get(entityId);

  if (!entity) {
    return {
      rootEntityId: entityId,
      rootEntityName: "Unknown",
      rootCascadeStage: "culture",
      upstream: [],
      downstream: [],
      allEntityIds: new Set(),
      allConnectionIds: new Set(),
      cascadeDepth: 0,
      totalAffected: 0,
      widestBranch: null,
      whatIfPrompt: "",
    };
  }

  // Build adjacency
  const outgoing = new Map<string, Array<{ conn: EntityConnection; targetId: string }>>();
  const incoming = new Map<string, Array<{ conn: EntityConnection; sourceId: string }>>();

  for (const c of connections) {
    const outList = outgoing.get(c.source_entity_id) ?? [];
    outList.push({ conn: c, targetId: c.target_entity_id });
    outgoing.set(c.source_entity_id, outList);

    const inList = incoming.get(c.target_entity_id) ?? [];
    inList.push({ conn: c, sourceId: c.source_entity_id });
    incoming.set(c.target_entity_id, inList);

    if (c.bidirectional) {
      const revOut = outgoing.get(c.target_entity_id) ?? [];
      revOut.push({ conn: c, targetId: c.source_entity_id });
      outgoing.set(c.target_entity_id, revOut);

      const revIn = incoming.get(c.source_entity_id) ?? [];
      revIn.push({ conn: c, sourceId: c.target_entity_id });
      incoming.set(c.source_entity_id, revIn);
    }
  }

  const allEntityIds = new Set<string>([entityId]);
  const allConnectionIds = new Set<string>();
  const stagesPresent = new Set<CascadeStage>([entity.cascade_stage]);

  // Trace downstream (same or later cascade stage) — recursive tree
  function traceDown(currentId: string, visited: Set<string>): CascadeAuditNode[] {
    const currentEntity = entityMap.get(currentId);
    if (!currentEntity) return [];

    const edges = outgoing.get(currentId) ?? [];
    const children: CascadeAuditNode[] = [];

    for (const { conn, targetId } of edges) {
      if (visited.has(targetId)) continue;
      const targetEntity = entityMap.get(targetId);
      if (!targetEntity) continue;

      if (STAGE_ORDER[targetEntity.cascade_stage] >= STAGE_ORDER[currentEntity.cascade_stage]) {
        visited.add(targetId);
        allEntityIds.add(targetId);
        allConnectionIds.add(conn.id);
        stagesPresent.add(targetEntity.cascade_stage);

        const label = conn.relationship_label ?? formatRelationshipType(conn.relationship_type);

        children.push({
          entityId: targetId,
          entityName: targetEntity.name,
          entityType: targetEntity.entity_type,
          cascadeStage: targetEntity.cascade_stage,
          connectionLabel: label,
          connectionId: conn.id,
          children: traceDown(targetId, visited),
        });
      }
    }

    return children;
  }

  // Trace upstream (same or earlier cascade stage)
  function traceUp(currentId: string, visited: Set<string>): CascadeAuditNode[] {
    const currentEntity = entityMap.get(currentId);
    if (!currentEntity) return [];

    const edges = incoming.get(currentId) ?? [];
    const children: CascadeAuditNode[] = [];

    for (const { conn, sourceId } of edges) {
      if (visited.has(sourceId)) continue;
      const sourceEntity = entityMap.get(sourceId);
      if (!sourceEntity) continue;

      if (STAGE_ORDER[sourceEntity.cascade_stage] <= STAGE_ORDER[currentEntity.cascade_stage]) {
        visited.add(sourceId);
        allEntityIds.add(sourceId);
        allConnectionIds.add(conn.id);
        stagesPresent.add(sourceEntity.cascade_stage);

        const label = conn.relationship_label ?? formatRelationshipType(conn.relationship_type);

        children.push({
          entityId: sourceId,
          entityName: sourceEntity.name,
          entityType: sourceEntity.entity_type,
          cascadeStage: sourceEntity.cascade_stage,
          connectionLabel: label,
          connectionId: conn.id,
          children: traceUp(sourceId, visited),
        });
      }
    }

    return children;
  }

  const downVisited = new Set<string>([entityId]);
  const downstream = traceDown(entityId, downVisited);

  const upVisited = new Set<string>([entityId]);
  const upstream = traceUp(entityId, upVisited);

  // Stats
  const cascadeDepth = stagesPresent.size;
  const totalAffected = allEntityIds.size - 1; // exclude root

  // Widest branch: cascade stage with most downstream entities
  const stageCounts = new Map<CascadeStage, number>();
  function countByStage(nodes: CascadeAuditNode[]) {
    for (const n of nodes) {
      stageCounts.set(n.cascadeStage, (stageCounts.get(n.cascadeStage) ?? 0) + 1);
      countByStage(n.children);
    }
  }
  countByStage(downstream);

  let widestBranch: { stage: CascadeStage; count: number } | null = null;
  for (const [stage, count] of stageCounts) {
    if (!widestBranch || count > widestBranch.count) {
      widestBranch = { stage, count };
    }
  }

  // What-if prompt
  const stageLabel = CASCADE_STAGE_LABELS[entity.cascade_stage].toLowerCase();
  const whatIfPrompt = totalAffected > 0
    ? `If ${entity.name}'s ${stageLabel} properties changed, which of these ${totalAffected} entities would need to be revised?`
    : `${entity.name} has no downstream cascade effects yet. Consider connecting it to entities at later cascade stages.`;

  return {
    rootEntityId: entityId,
    rootEntityName: entity.name,
    rootCascadeStage: entity.cascade_stage,
    upstream,
    downstream,
    allEntityIds,
    allConnectionIds,
    cascadeDepth,
    totalAffected,
    widestBranch,
    whatIfPrompt,
  };
}

// ---------------------------------------------------------------------------
// 8.3 Timeline — extract temporal bounds for the scrubber
// ---------------------------------------------------------------------------

export interface TimelineEvent {
  entityId: string;
  entityName: string;
  timeLabel: string;
}

export interface TimelineBounds {
  /** All unique time labels from connections, sorted */
  timePoints: string[];
  /** Events (entities of type 'event') with their temporal markers */
  events: TimelineEvent[];
}

export function extractTimelineBounds(
  entities: Entity[],
  connections: EntityConnection[]
): TimelineBounds {
  const timeSet = new Set<string>();

  for (const c of connections) {
    if (c.time_start) timeSet.add(c.time_start);
    if (c.time_end) timeSet.add(c.time_end);
  }

  // Sort time points — attempt numeric sort, fall back to alphabetical
  const timePoints = Array.from(timeSet).sort((a, b) => {
    const numA = parseFloat(a.replace(/[^\d.-]/g, ""));
    const numB = parseFloat(b.replace(/[^\d.-]/g, ""));
    if (!isNaN(numA) && !isNaN(numB)) return numA - numB;
    return a.localeCompare(b);
  });

  // Extract event entities
  const events: TimelineEvent[] = [];
  for (const e of entities) {
    if (e.entity_type === "event") {
      const meta = e.metadata as Record<string, unknown>;
      const dateStart = (meta?.date_start as string) ?? "";
      if (dateStart) {
        events.push({
          entityId: e.id,
          entityName: e.name,
          timeLabel: dateStart,
        });
      }
    }
  }

  return { timePoints, events };
}

/**
 * Filter connections by timeline position.
 * Returns which connections should be visible at a given time point index.
 */
export function filterConnectionsByTime(
  connections: EntityConnection[],
  timePoints: string[],
  currentIndex: number
): { visible: Set<string>; historical: Set<string> } {
  const currentTime = timePoints[currentIndex];
  if (!currentTime) {
    return {
      visible: new Set(connections.map((c) => c.id)),
      historical: new Set(),
    };
  }

  const visible = new Set<string>();
  const historical = new Set<string>();

  for (const c of connections) {
    // Connections without time bounds are always visible
    if (!c.time_start && !c.time_end) {
      visible.add(c.id);
      continue;
    }

    const startIdx = c.time_start ? timePoints.indexOf(c.time_start) : -1;
    const endIdx = c.time_end ? timePoints.indexOf(c.time_end) : timePoints.length;

    if (startIdx > currentIndex) {
      // Connection hasn't started yet — hidden (not in either set)
      continue;
    }

    if (endIdx !== -1 && endIdx < currentIndex) {
      // Connection ended before current time — show as historical
      historical.add(c.id);
    } else {
      // Connection is active at current time
      visible.add(c.id);
    }
  }

  return { visible, historical };
}
