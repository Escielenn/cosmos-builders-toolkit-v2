// ---------------------------------------------------------------------------
// WorldShowcase, Public-facing showcase page for a world.
//
// Route: /worlds/:worldId/showcase
// Read-only display: hero header, entity gallery grouped by cascade stage,
// world stats, cascade coverage bar, and inline entity detail expansion.
// ---------------------------------------------------------------------------

import { useParams, Link } from "react-router-dom";
import { useState, useMemo } from "react";
import { useMetaTags } from "@/hooks/use-meta-tags";
import { useAuth } from "@/contexts/AuthContext";
import { SocialShareButtons } from "@/components/sharing/SocialShareButtons";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, ChevronDown, ChevronUp, Globe, Link2, Lock, Users } from "lucide-react";
import Header from "@/components/layout/Header";
import { GlassPanel } from "@/components/ui/glass-panel";
import { Badge } from "@/components/ui/badge";
import { Loader } from "@/components/ui/loader";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import ForkButton from "@/components/community/ForkButton";
import FavoriteButton from "@/components/community/FavoriteButton";
import CommentSection from "@/components/community/CommentSection";
import {
  CASCADE_STAGES,
  CASCADE_STAGE_COLORS,
  CASCADE_STAGE_LABELS,
  ENTITY_TYPE_LABELS,
  ENTITY_TYPE_COLORS,
  formatRelationshipType,
} from "@/services/entity-graph-types";
import type {
  Entity,
  EntityConnection,
  CascadeStage,
} from "@/services/entity-graph-types";
import type { WorldTheme } from "@/hooks/use-world";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface ShowcaseWorld {
  id: string;
  user_id: string;
  name: string;
  description: string | null;
  header_image_url: string | null;
  header_image_focus_y: number;
  icon: string;
  tags: string[];
  theme: WorldTheme;
  created_at: string;
  visibility: string;
  fork_count: number;
  license: string;
  is_example: boolean;
}

// ---------------------------------------------------------------------------
// Data hooks (public, no auth requirement)
// ---------------------------------------------------------------------------

function useShowcaseWorld(worldId: string | undefined) {
  return useQuery<ShowcaseWorld | null>({
    queryKey: ["showcase-world", worldId],
    queryFn: async () => {
      if (!worldId) return null;
      const { data, error } = await supabase
        .from("worlds")
        .select("id, user_id, name, description, header_image_url, header_image_focus_y, icon, tags, theme, created_at, visibility, fork_count, license, is_example")
        .eq("id", worldId)
        .maybeSingle();
      if (error) throw error;
      if (!data) return null;
      return {
        ...data,
        theme: (data.theme ?? {}) as WorldTheme,
        visibility: (data as any).visibility ?? "private",
        fork_count: (data as any).fork_count ?? 0,
        license: (data as any).license ?? "cc_by",
        is_example: (data as any).is_example ?? false,
      } as ShowcaseWorld;
    },
    enabled: !!worldId,
    staleTime: 60_000,
  });
}

function useShowcaseEntities(worldId: string | undefined) {
  return useQuery<Entity[]>({
    queryKey: ["showcase-entities", worldId],
    queryFn: async () => {
      if (!worldId) return [];
      const { data, error } = await supabase
        .from("entities")
        .select("*")
        .eq("world_id", worldId)
        .order("sort_order", { ascending: true });
      if (error) throw error;
      return (data ?? []) as unknown as Entity[];
    },
    enabled: !!worldId,
    staleTime: 60_000,
  });
}

function useShowcaseConnections(worldId: string | undefined) {
  return useQuery<EntityConnection[]>({
    queryKey: ["showcase-connections", worldId],
    queryFn: async () => {
      if (!worldId) return [];
      const { data, error } = await supabase
        .from("entity_connections")
        .select("*")
        .eq("world_id", worldId)
        .order("sort_order", { ascending: true });
      if (error) throw error;
      return (data ?? []) as unknown as EntityConnection[];
    },
    enabled: !!worldId,
    staleTime: 60_000,
  });
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

/** Cascade coverage bar, horizontal segments for populated stages */
function CascadeCoverageBar({ entities }: { entities: Entity[] }) {
  const populated = useMemo(() => {
    const stages = new Set(entities.map((e) => e.cascade_stage));
    return CASCADE_STAGES.map((s) => stages.has(s));
  }, [entities]);

  return (
    <div className="flex items-center gap-1 w-full">
      {CASCADE_STAGES.map((stage, i) => (
        <div key={stage} className="flex-1 flex flex-col items-center gap-1.5">
          <div
            className="w-full h-2 transition-all duration-300"
            style={{
              backgroundColor: populated[i]
                ? CASCADE_STAGE_COLORS[stage]
                : "rgba(255,255,255,0.06)",
              opacity: populated[i] ? 1 : 0.5,
              boxShadow: populated[i]
                ? `0 0 8px ${CASCADE_STAGE_COLORS[stage]}40`
                : "none",
            }}
          />
          <span
            className="font-heading text-[9px] uppercase tracking-[1.5px] transition-colors"
            style={{
              color: populated[i]
                ? CASCADE_STAGE_COLORS[stage]
                : "rgba(255,255,255,0.2)",
            }}
          >
            {CASCADE_STAGE_LABELS[stage]}
          </span>
        </div>
      ))}
    </div>
  );
}

/** Single entity card */
function EntityCard({
  entity,
  isExpanded,
  onToggle,
  connections,
  allEntities,
}: {
  entity: Entity;
  isExpanded: boolean;
  onToggle: () => void;
  connections: EntityConnection[];
  allEntities: Entity[];
}) {
  const color = entity.color || ENTITY_TYPE_COLORS[entity.entity_type];
  const stageColor = CASCADE_STAGE_COLORS[entity.cascade_stage];

  // Find connections involving this entity
  const relatedConnections = useMemo(
    () =>
      connections.filter(
        (c) =>
          c.source_entity_id === entity.id ||
          c.target_entity_id === entity.id
      ),
    [connections, entity.id]
  );

  const entityMap = useMemo(() => {
    const map = new Map<string, Entity>();
    allEntities.forEach((e) => map.set(e.id, e));
    return map;
  }, [allEntities]);

  return (
    <GlassPanel
      className="p-4 cursor-pointer group transition-all duration-200 hover:-translate-y-0.5"
      hover
      onClick={onToggle}
    >
      {/* Top row */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2.5 min-w-0">
          {/* Color dot */}
          <div
            className="w-2.5 h-2.5 flex-shrink-0 rounded-sm"
            style={{ backgroundColor: color }}
          />
          <div className="min-w-0">
            <h3 className="font-heading text-sm font-light text-t1 truncate">
              {entity.name}
            </h3>
            <span className="font-sans text-[11px] font-medium uppercase tracking-[1.5px] text-t3">
              {entity.custom_type_label || ENTITY_TYPE_LABELS[entity.entity_type]}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <span
            className="font-mono text-[10px] px-1.5 py-0.5 rounded-sm"
            style={{
              backgroundColor: `${stageColor}0F`,
              border: `1px solid ${stageColor}26`,
              color: stageColor,
            }}
          >
            {CASCADE_STAGE_LABELS[entity.cascade_stage]}
          </span>
          {isExpanded ? (
            <ChevronUp className="w-3.5 h-3.5 text-t4" />
          ) : (
            <ChevronDown className="w-3.5 h-3.5 text-t4" />
          )}
        </div>
      </div>

      {/* Summary */}
      {entity.summary && !isExpanded && (
        <p className="font-sans text-xs text-t2 mt-2 line-clamp-2 leading-relaxed">
          {entity.summary}
        </p>
      )}

      {/* Expanded detail */}
      {isExpanded && (
        <div className="mt-4 space-y-4 border-t border-white/[0.06] pt-4">
          {/* Summary */}
          {entity.summary && (
            <p className="font-sans text-sm text-t2 leading-relaxed">
              {entity.summary}
            </p>
          )}

          {/* Description */}
          {entity.description && (
            <div className="space-y-1">
              <span className="font-sans text-[11px] font-medium uppercase tracking-[1.5px] text-t3">
                Description
              </span>
              <p className="font-sans text-sm text-t2 leading-relaxed whitespace-pre-wrap">
                {entity.description}
              </p>
            </div>
          )}

          {/* Tags */}
          {entity.tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {entity.tags.map((tag) => (
                <span
                  key={tag}
                  className="font-mono text-[10px] px-2 py-0.5 rounded-sm bg-white/[0.04] border border-white/[0.08] text-t3"
                >
                  {tag}
                </span>
              ))}
            </div>
          )}

          {/* Connections */}
          {relatedConnections.length > 0 && (
            <div className="space-y-2">
              <span className="font-sans text-[11px] font-medium uppercase tracking-[1.5px] text-t3 flex items-center gap-1.5">
                <Link2 className="w-3 h-3" />
                Connections
              </span>
              <div className="space-y-1">
                {relatedConnections.map((conn) => {
                  const isSource = conn.source_entity_id === entity.id;
                  const otherId = isSource
                    ? conn.target_entity_id
                    : conn.source_entity_id;
                  const other = entityMap.get(otherId);
                  if (!other) return null;
                  const otherColor =
                    other.color || ENTITY_TYPE_COLORS[other.entity_type];

                  return (
                    <div
                      key={conn.id}
                      className="flex items-center gap-2 py-1 px-2 rounded-xs bg-white/[0.02]"
                    >
                      <div
                        className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                        style={{ backgroundColor: otherColor }}
                      />
                      <span className="font-mono text-[11px] text-t4">
                        {formatRelationshipType(conn.relationship_type)}
                      </span>
                      <span className="font-sans text-xs text-t2">
                        {other.name}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Bottom edge glow line */}
      <div
        className="absolute bottom-0 left-0 right-0 h-[2px] transition-transform duration-300 origin-left scale-x-0 group-hover:scale-x-100"
        style={{ backgroundColor: `${color}99` }}
      />
    </GlassPanel>
  );
}

/** Visibility selector, owner-only three-option control */
type WorldVisibility = "private" | "community" | "public";

const VISIBILITY_CONFIG: {
  value: WorldVisibility;
  label: string;
  icon: typeof Globe;
  color: string;
}[] = [
  { value: "private", label: "Private", icon: Lock, color: "#FFB800" },
  { value: "community", label: "Community", icon: Users, color: "#15C17B" },
  { value: "public", label: "Public", icon: Globe, color: "#4D9FFF" },
];

function VisibilitySelector({
  current,
  onSelect,
  disabled,
}: {
  current: WorldVisibility;
  onSelect: (v: WorldVisibility) => void;
  disabled?: boolean;
}) {
  return (
    <div className="flex items-center gap-1">
      {VISIBILITY_CONFIG.map((opt) => {
        const Icon = opt.icon;
        const isActive = current === opt.value;
        return (
          <button
            key={opt.value}
            onClick={() => onSelect(opt.value)}
            disabled={disabled}
            className="flex items-center gap-1.5 px-3 py-1.5 font-sans text-[11px] font-medium uppercase tracking-[1px] transition-all duration-200 disabled:opacity-50"
            style={{
              backgroundColor: isActive ? `${opt.color}0F` : "transparent",
              border: `1px solid ${isActive ? `${opt.color}26` : "rgba(255,255,255,0.06)"}`,
              color: isActive ? opt.color : "rgba(255,255,255,0.28)",
            }}
          >
            <Icon className="w-3 h-3" />
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}

/** Stats card */
function StatCard({
  label,
  value,
  color,
}: {
  label: string;
  value: string | number;
  color?: string;
}) {
  return (
    <GlassPanel className="p-4 text-center">
      <div
        className="font-mono text-2xl text-t1 mb-1"
        style={color ? { color } : undefined}
      >
        {value}
      </div>
      <div className="font-sans text-[11px] font-medium uppercase tracking-[1.5px] text-t3">
        {label}
      </div>
    </GlassPanel>
  );
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export default function WorldShowcase() {
  const { worldId } = useParams<{ worldId: string }>();
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { user } = useAuth();
  const { data: world, isLoading: worldLoading } = useShowcaseWorld(worldId);
  const { data: entities = [], isLoading: entitiesLoading } =
    useShowcaseEntities(worldId);
  const { data: connections = [] } = useShowcaseConnections(worldId);

  // --- Feature 1: Dynamic OG meta tags ---
  useMetaTags({
    title: world?.name,
    description: world?.description || (world ? `Explore ${world.name} - a world built with StellarForge` : undefined),
    url: window.location.href,
    image: world?.header_image_url || undefined,
  });

  // --- Visibility (database-backed) ---
  const isOwner = !!(user && world && user.id === world.user_id);
  const visibility = (world?.visibility ?? "private") as WorldVisibility;
  const isCommunityWorld = visibility === "community" || visibility === "public";

  const updateVisibility = useMutation({
    mutationFn: async (newVisibility: WorldVisibility) => {
      const { error } = await supabase
        .from("worlds")
        .update({ visibility: newVisibility })
        .eq("id", worldId!);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["showcase-world", worldId] });
      queryClient.invalidateQueries({ queryKey: ["worlds"] });
      queryClient.invalidateQueries({ queryKey: ["community-worlds"] });
      toast({ title: "Visibility updated." });
    },
    onError: (err) => {
      toast({ title: "Failed to update visibility", description: (err as Error).message, variant: "destructive" });
    },
  });

  // Group entities by cascade stage
  const groupedEntities = useMemo(() => {
    const groups: Record<CascadeStage, Entity[]> = {
      physics: [],
      environment: [],
      biology: [],
      psychology: [],
      mythology: [],
      culture: [],
    };
    entities.forEach((e) => {
      groups[e.cascade_stage]?.push(e);
    });
    return groups;
  }, [entities]);

  // Cascade coverage count
  const cascadeCoverage = useMemo(() => {
    const populated = new Set(entities.map((e) => e.cascade_stage));
    return populated.size;
  }, [entities]);

  const isLoading = worldLoading || entitiesLoading;

  // ---------------------------------------------------------------------------
  // Loading state
  // ---------------------------------------------------------------------------

  if (isLoading) {
    return (
      <div className="min-h-screen bg-sf-void">
        <Header />
        <div className="flex items-center justify-center min-h-[60vh]">
          <Loader className="w-8 h-8" />
        </div>
      </div>
    );
  }

  // ---------------------------------------------------------------------------
  // Not found
  // ---------------------------------------------------------------------------

  if (!world) {
    return (
      <div className="min-h-screen bg-sf-void">
        <Header />
        <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
          <Globe className="w-12 h-12 text-t4" />
          <h1 className="font-heading text-xl font-light uppercase tracking-[2px] text-t2">
            World Not Found
          </h1>
          <p className="font-sans text-sm text-t3 max-w-md text-center">
            This world may be private, or the link may be incorrect.
          </p>
          <Link
            to="/"
            className="font-sans text-sm text-primary hover:text-primary/80 transition-colors"
          >
            Return Home
          </Link>
        </div>
      </div>
    );
  }

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------

  const hasHeaderImage = !!world.header_image_url;

  return (
    <div className="min-h-screen bg-sf-void">
      <Header />

      {/* ----------------------------------------------------------------- */}
      {/* Sample World Banner                                               */}
      {/* ----------------------------------------------------------------- */}
      {world.is_example && (
        <div
          className="border-b px-6 py-4"
          style={{
            background: "linear-gradient(135deg, rgba(91,141,239,0.08) 0%, rgba(21,193,123,0.06) 100%)",
            borderColor: "rgba(91,141,239,0.15)",
          }}
        >
          <div className="max-w-5xl mx-auto">
            <div className="flex items-start gap-3">
              <span className="text-2xl mt-0.5">🌗</span>
              <div>
                <p className="font-heading text-sm font-light uppercase tracking-[2px] text-stellar mb-1">
                  Sample World - The Tidelock Archives
                </p>
                <p className="text-[12px] text-t2 leading-relaxed max-w-2xl">
                  This is StellarForge's example world, demonstrating the full Environmental Cascade
                  from physics through culture. Explore the entities, connections, and lore to see
                  how a world comes together.
                </p>
                <p className="text-[11px] text-t3 leading-relaxed mt-1.5">
                  <strong className="text-t2">Want to edit or build on this world?</strong> Fork
                  it to create your own copy under your account. The original community world stays
                  unchanged. Your fork is yours to modify freely.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ----------------------------------------------------------------- */}
      {/* Visibility Banner (owner only)                                    */}
      {/* ----------------------------------------------------------------- */}
      {isOwner && (
        <div
          className="border-b px-6 py-3"
          style={{
            backgroundColor: visibility === "private" ? "rgba(255,184,0,0.06)" : visibility === "community" ? "rgba(21,193,123,0.06)" : "rgba(77,159,255,0.06)",
            borderColor: visibility === "private" ? "rgba(255,184,0,0.15)" : visibility === "community" ? "rgba(21,193,123,0.15)" : "rgba(77,159,255,0.15)",
          }}
        >
          <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <span className="font-sans text-sm" style={{
              color: visibility === "private" ? "#FFB800" : visibility === "community" ? "#15C17B" : "#4D9FFF",
            }}>
              {visibility === "private"
                ? "This showcase is private. Only you can see it."
                : visibility === "community"
                ? "Visible to signed-in StellarForge users."
                : "Visible to anyone with the link."}
            </span>
            <VisibilitySelector
              current={visibility}
              onSelect={(v) => updateVisibility.mutate(v)}
              disabled={updateVisibility.isPending}
            />
          </div>
        </div>
      )}

      {/* ----------------------------------------------------------------- */}
      {/* Hero Header                                                       */}
      {/* ----------------------------------------------------------------- */}
      <section className="relative overflow-hidden">
        {/* Background image */}
        {hasHeaderImage && (
          <div className="absolute inset-0">
            <img
              src={world.header_image_url!}
              alt=""
              className="w-full h-full object-cover"
              style={{
                objectPosition: `center ${world.header_image_focus_y ?? 50}%`,
              }}
            />
            {/* Gradient overlays */}
            <div className="absolute inset-0 bg-gradient-to-b from-sf-void/70 via-sf-void/50 to-sf-void" />
            <div className="absolute inset-0 bg-sf-void/30" />
          </div>
        )}

        {/* Atmosphere gradient (no image fallback) */}
        {!hasHeaderImage && (
          <div className="absolute inset-0">
            <div
              className="absolute inset-0"
              style={{
                background:
                  "radial-gradient(ellipse at 70% 20%, hsl(157 100% 62% / 0.08) 0%, transparent 50%), linear-gradient(180deg, hsl(222 30% 5%) 0%, hsl(222 35% 3%) 100%)",
              }}
            />
          </div>
        )}

        <div className="relative max-w-5xl mx-auto px-6 py-20 md:py-28">
          {/* Back link */}
          <Link
            to={`/worlds/${world.id}`}
            className="inline-flex items-center gap-2 font-sans text-xs text-t4 hover:text-t2 transition-colors mb-8"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            ← RETURN TO BRIDGE
          </Link>

          {/* World icon + name */}
          <div className="flex items-center gap-4 mb-4">
            <span className="text-4xl" role="img" aria-label="World icon">
              {world.icon || "🌍"}
            </span>
            <h1 className="font-display text-3xl md:text-5xl tracking-sf-title text-t1 uppercase">
              {world.name}
            </h1>
          </div>

          {/* Description */}
          {world.description && (
            <p className="font-sans text-base md:text-lg text-t2 max-w-2xl leading-relaxed mb-6">
              {world.description}
            </p>
          )}

          {/* Meta row */}
          <div className="flex flex-wrap items-center gap-3">
            <Badge variant="glow" className="font-mono text-xs">
              {entities.length} {entities.length === 1 ? "Entity" : "Entities"}
            </Badge>
            <Badge variant="glow" className="font-mono text-xs">
              {connections.length}{" "}
              {connections.length === 1 ? "Connection" : "Connections"}
            </Badge>
            <Badge variant="glow-amber" className="font-mono text-xs">
              {cascadeCoverage} / {CASCADE_STAGES.length} Cascade Stages
            </Badge>
          </div>

          {/* Tags */}
          {world.tags.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-4">
              {world.tags.map((tag) => (
                <span
                  key={tag}
                  className="font-mono text-[11px] px-2.5 py-1 rounded-sm bg-white/[0.04] border border-white/[0.08] text-t3"
                >
                  {tag}
                </span>
              ))}
            </div>
          )}

          {/* Visibility badge (non-owner visitors see status; owner sees it in top banner) */}
          {!isOwner && isCommunityWorld && (
            <div className="flex items-center gap-2 mt-4">
              <span className="inline-flex items-center gap-1.5 font-mono text-[11px] px-2.5 py-1 rounded-sm bg-[#15C17B]/[0.06] border border-[#15C17B]/[0.15] text-[#15C17B]">
                <Globe className="w-3 h-3" />
                {visibility === "public" ? "Public" : "Community"}
              </span>
            </div>
          )}

          {/* Social sharing */}
          <div className="mt-6">
            <SocialShareButtons
              url={window.location.href}
              title={`${world.name} - Built with StellarForge`}
              description={world.description || "A science fiction world built with StellarForge.tools"}
            />
          </div>

          {/* Community actions (fork + favorite) for community/public worlds */}
          {isCommunityWorld && (
            <div className="flex items-center gap-2 mt-4">
              <FavoriteButton worldId={world.id} />
              <ForkButton
                worldId={world.id}
                worldName={world.name}
                forkCount={world.fork_count}
                license={world.license}
              />
            </div>
          )}
        </div>

        {/* Light arc at bottom */}
        <div
          className="absolute bottom-0 left-[10%] right-[10%] h-px pointer-events-none"
          style={{
            background:
              "linear-gradient(90deg, transparent, hsl(157 100% 62% / 0.25), transparent)",
          }}
        />
      </section>

      {/* ----------------------------------------------------------------- */}
      {/* World Stats                                                       */}
      {/* ----------------------------------------------------------------- */}
      <section className="max-w-5xl mx-auto px-6 py-10">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard label="Entities" value={entities.length} />
          <StatCard label="Connections" value={connections.length} />
          <StatCard
            label="Cascade Coverage"
            value={`${cascadeCoverage}/${CASCADE_STAGES.length}`}
            color="#FFB800"
          />
          <StatCard
            label="Entity Types"
            value={new Set(entities.map((e) => e.entity_type)).size}
          />
        </div>
      </section>

      {/* ----------------------------------------------------------------- */}
      {/* Cascade Coverage Bar                                              */}
      {/* ----------------------------------------------------------------- */}
      <section className="max-w-5xl mx-auto px-6 pb-10">
        <GlassPanel className="p-6">
          <h2 className="font-heading text-sm font-light uppercase tracking-[3px] text-emerald mb-5">
            Environmental Cascade Coverage
          </h2>
          <CascadeCoverageBar entities={entities} />
        </GlassPanel>
      </section>

      {/* ----------------------------------------------------------------- */}
      {/* Entity Gallery, grouped by cascade stage                         */}
      {/* ----------------------------------------------------------------- */}
      <section className="max-w-5xl mx-auto px-6 pb-20">
        {entities.length === 0 ? (
          <GlassPanel className="p-12 text-center">
            <Globe className="w-10 h-10 text-t4 mx-auto mb-4" />
            <p className="font-sans text-sm text-t3">
              This world has no entities yet.
            </p>
          </GlassPanel>
        ) : (
          <div className="space-y-12">
            {CASCADE_STAGES.map((stage) => {
              const stageEntities = groupedEntities[stage];
              if (stageEntities.length === 0) return null;

              return (
                <div key={stage}>
                  {/* Stage header */}
                  <div className="flex items-center gap-3 mb-5">
                    <div
                      className="w-3 h-3 rounded-sm"
                      style={{ backgroundColor: CASCADE_STAGE_COLORS[stage] }}
                    />
                    <h2
                      className="font-heading text-xl font-light uppercase tracking-[2px]"
                      style={{ color: CASCADE_STAGE_COLORS[stage] }}
                    >
                      {CASCADE_STAGE_LABELS[stage]}
                    </h2>
                    <span className="font-mono text-[11px] text-t4">
                      {stageEntities.length}
                    </span>
                    <div
                      className="flex-1 h-px"
                      style={{
                        background: `linear-gradient(90deg, ${CASCADE_STAGE_COLORS[stage]}15, transparent)`,
                      }}
                    />
                  </div>

                  {/* Entity grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {stageEntities.map((entity) => (
                      <EntityCard
                        key={entity.id}
                        entity={entity}
                        isExpanded={expandedId === entity.id}
                        onToggle={() =>
                          setExpandedId(
                            expandedId === entity.id ? null : entity.id
                          )
                        }
                        connections={connections}
                        allEntities={entities}
                      />
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* ----------------------------------------------------------------- */}
      {/* Comments (community/public worlds only)                          */}
      {/* ----------------------------------------------------------------- */}
      {isCommunityWorld && (
        <section className="max-w-5xl mx-auto px-6 pb-12">
          <CommentSection worldId={world.id} />
        </section>
      )}

      {/* Footer light arc */}
      <div
        className="h-px mx-auto max-w-3xl mb-8"
        style={{
          background:
            "linear-gradient(90deg, transparent, hsl(157 100% 62% / 0.15), transparent)",
        }}
      />
      <div className="text-center pb-12">
        <span className="font-mono text-[9px] uppercase tracking-[2px] text-t5">
          Built with StellarForge
        </span>
      </div>
    </div>
  );
}
