/** Register: WRITER (Lora) — reference prose, read at length. */
import { useState, useMemo } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { Search, Plus, FileText, Filter, X } from "lucide-react";
import * as LucideIcons from "lucide-react";
import { GlassPanel } from "@/components/ui/glass-panel";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader } from "@/components/ui/loader";
import { useCodexData } from "@/hooks/use-codex-data";
import {
  ENTITY_TYPE_LABELS,
  ENTITY_TYPE_ICONS,
  LAYER_LABELS,
  type CascadeLayer,
  type CodexElement,
} from "@/services/world-data";
import { createEntry } from "@/services/world-entries";
import { useAuth } from "@/contexts/AuthContext";
import { useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import TagBadge from "@/components/tags/TagBadge";
import { getTagColor } from "@/hooks/use-tags";

function getIconComponent(iconName: string) {
  const Icon = (LucideIcons as any)[iconName];
  return Icon || FileText;
}

export default function WikiBrowse() {
  const { worldId } = useParams<{ worldId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { data: codexData, isLoading } = useCodexData(worldId);

  const [search, setSearch] = useState("");
  const [activeLayer, setActiveLayer] = useState<string | null>(null);
  const [activeType, setActiveType] = useState<string | null>(null);
  const [activeTags, setActiveTags] = useState<string[]>([]);
  const [showFilters, setShowFilters] = useState(false);

  // Flatten all elements from codex data (entries only, not worksheets without entries)
  const allEntries = useMemo(() => {
    if (!codexData) return [];
    const entries: CodexElement[] = [];
    const collect = (elements: CodexElement[]) => {
      for (const el of elements) {
        if (el.kind === "entry" || el.entryId) {
          entries.push(el);
        }
        if (el.children.length > 0) collect(el.children);
      }
    };
    for (const section of codexData.cascadeSections) {
      collect(section.elements);
    }
    // Also include custom entries
    for (const el of codexData.customEntries) {
      entries.push(el);
      if (el.children.length > 0) collect(el.children);
    }
    // Dedupe by id
    const seen = new Set<string>();
    return entries.filter((e) => {
      const key = e.entryId || e.id;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }, [codexData]);

  // Unique types and layers for filter chips
  const availableTypes = useMemo(() => {
    const types = new Set<string>();
    allEntries.forEach((e) => types.add(e.type));
    return Array.from(types).sort();
  }, [allEntries]);

  const availableLayers = useMemo(() => {
    const layers = new Set<string>();
    allEntries.forEach((e) => {
      if (e.layer) layers.add(e.layer);
    });
    return Array.from(layers).sort();
  }, [allEntries]);

  // Filter entries
  const filtered = useMemo(() => {
    let result = allEntries;
    if (search) {
      const q = search.toLowerCase();
      result = result.filter((e) => e.title.toLowerCase().includes(q));
    }
    if (activeLayer) {
      result = result.filter((e) => e.layer === activeLayer);
    }
    if (activeType) {
      result = result.filter((e) => e.type === activeType);
    }
    if (activeTags.length > 0) {
      result = result.filter((e) =>
        activeTags.some((tag) => e.tags.includes(tag))
      );
    }
    // Sort by most recently updated
    return result.sort(
      (a, b) =>
        new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
    );
  }, [allEntries, search, activeLayer, activeType, activeTags]);

  const handleCreateEntry = async () => {
    if (!worldId || !user) return;
    try {
      const entry = await createEntry(
        { worldId, title: "Untitled Entry", entryType: "note" },
        user.id
      );
      queryClient.invalidateQueries({ queryKey: ["codex-data", worldId] });
      navigate(`/worlds/${worldId}/pages/${entry.id}`);
    } catch {
      // Entry creation failed silently, user will see no navigation
    }
  };

  const hasActiveFilters = activeLayer || activeType || activeTags.length > 0;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader size="sm" />
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 md:px-6 py-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-serif text-[24px] italic text-t1">
            Wiki
          </h1>
          <p className="text-[12px] text-t4 mt-1">
            {allEntries.length} {allEntries.length === 1 ? "entry" : "entries"}
            {filtered.length !== allEntries.length &&
              ` · ${filtered.length} shown`}
          </p>
        </div>
        <Button
          onClick={handleCreateEntry}
          className="font-sans text-xs uppercase tracking-wider"
          size="sm"
        >
          <Plus className="w-3.5 h-3.5 mr-1.5" />
          New Entry
        </Button>
      </div>

      {/* Search + Filter toggle */}
      <div className="flex items-center gap-2 mb-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-t4" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search entries..."
            className="pl-9 h-9 text-sm"
          />
        </div>
        <Button
          variant={showFilters || hasActiveFilters ? "secondary" : "ghost"}
          size="sm"
          onClick={() => setShowFilters(!showFilters)}
          className="font-sans text-xs uppercase tracking-wider h-9"
        >
          <Filter className="w-3.5 h-3.5 mr-1.5" />
          Filter
          {hasActiveFilters && (
            <span className="ml-1.5 w-4 h-4 rounded-full bg-teal/20 text-teal text-[11px] flex items-center justify-center font-mono">
              {(activeLayer ? 1 : 0) +
                (activeType ? 1 : 0) +
                activeTags.length}
            </span>
          )}
        </Button>
      </div>

      {/* Filter panel */}
      {showFilters && (
        <GlassPanel className="mb-4 p-4">
          <div className="flex items-center justify-between mb-3">
            <span className="font-serif text-[13px] italic text-t3">
              Filters
            </span>
            {hasActiveFilters && (
              <button
                onClick={() => {
                  setActiveLayer(null);
                  setActiveType(null);
                  setActiveTags([]);
                }}
                className="text-[11px] uppercase tracking-wider text-t4 hover:text-t2 transition-colors"
              >
                Clear all
              </button>
            )}
          </div>

          {/* Layer filter */}
          {availableLayers.length > 0 && (
            <div className="mb-3">
              <span className="text-[11px] uppercase tracking-[1.5px] text-t4 block mb-1.5">
                Cascade Layer
              </span>
              <div className="flex flex-wrap gap-1.5">
                {availableLayers.map((layer) => (
                  <button
                    key={layer}
                    onClick={() =>
                      setActiveLayer(activeLayer === layer ? null : layer)
                    }
                    className={`px-2.5 py-1 text-[12px] uppercase tracking-wider border transition-colors ${
                      activeLayer === layer
                        ? "bg-teal/10 border-teal/25 text-teal"
                        : "border-sf-border text-t3 hover:text-t2"
                    }`}
                  >
                    {LAYER_LABELS[layer as CascadeLayer] || layer}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Type filter */}
          {availableTypes.length > 0 && (
            <div className="mb-3">
              <span className="text-[11px] uppercase tracking-[1.5px] text-t4 block mb-1.5">
                Entity Type
              </span>
              <div className="flex flex-wrap gap-1.5">
                {availableTypes.map((type) => (
                  <button
                    key={type}
                    onClick={() =>
                      setActiveType(activeType === type ? null : type)
                    }
                    className={`px-2.5 py-1 text-[12px] uppercase tracking-wider border transition-colors ${
                      activeType === type
                        ? "bg-teal/10 border-teal/25 text-teal"
                        : "border-sf-border text-t3 hover:text-t2"
                    }`}
                  >
                    {ENTITY_TYPE_LABELS[type] || type}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Tag filter */}
          {codexData && codexData.worldTags.length > 0 && (
            <div>
              <span className="text-[11px] uppercase tracking-[1.5px] text-t4 block mb-1.5">
                Tags
              </span>
              <div className="flex flex-wrap gap-1.5">
                {codexData.worldTags.map((tag, i) => (
                  <button
                    key={tag}
                    onClick={() =>
                      setActiveTags((prev) =>
                        prev.includes(tag)
                          ? prev.filter((t) => t !== tag)
                          : [...prev, tag]
                      )
                    }
                    className={`px-2.5 py-1 text-[12px] tracking-wider border transition-colors ${
                      activeTags.includes(tag)
                        ? "bg-teal/10 border-teal/25 text-teal"
                        : "border-sf-border text-t3 hover:text-t2"
                    }`}
                  >
                    {tag}
                  </button>
                ))}
              </div>
            </div>
          )}
        </GlassPanel>
      )}

      {/* Entry grid */}
      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <FileText className="w-8 h-8 text-t4 mb-3" />
          <p className="text-t3 text-sm mb-1">
            {allEntries.length === 0
              ? "No wiki entries yet"
              : "No entries match your filters"}
          </p>
          <p className="text-t4 text-xs mb-4">
            {allEntries.length === 0
              ? "Entries are created automatically when you use tools, or you can create one manually."
              : "Try adjusting your search or filter criteria."}
          </p>
          {allEntries.length === 0 && (
            <Button
              onClick={handleCreateEntry}
              size="sm"
              className="font-sans text-xs uppercase tracking-wider"
            >
              <Plus className="w-3.5 h-3.5 mr-1.5" />
              Create First Entry
            </Button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {filtered.map((entry) => {
            const IconComponent = getIconComponent(
              ENTITY_TYPE_ICONS[entry.type] || "FileText"
            );
            const targetPath = entry.entryId
              ? `/worlds/${worldId}/pages/${entry.entryId}`
              : entry.toolSource && entry.toolDataId
              ? `/worlds/${worldId}/tools/${entry.toolSource}?worksheetId=${entry.toolDataId}`
              : `/worlds/${worldId}/pages/${entry.id}`;

            return (
              <Link key={entry.id} to={targetPath} className="group">
                <GlassPanel className="p-4 h-full relative overflow-hidden transition-transform duration-200 group-hover:-translate-y-0.5">
                  {/* Bottom edge fill bar */}
                  <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-[#3DFFCD]/60 scale-x-0 origin-left transition-transform duration-300 group-hover:scale-x-100" />

                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 shrink-0 flex items-center justify-center bg-teal/6 border border-teal/15 rounded-sm">
                      <IconComponent className="w-4 h-4 text-teal" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <h3 className="font-sans text-sm text-t1 truncate">
                        {entry.title}
                      </h3>
                      <div className="flex items-center gap-1.5 mt-1">
                        <span className="text-[11px] uppercase tracking-wider text-t4 font-mono">
                          {ENTITY_TYPE_LABELS[entry.type] || entry.type}
                        </span>
                        {entry.layer && (
                          <>
                            <span className="text-t5">&middot;</span>
                            <span className="text-[11px] uppercase tracking-wider text-t5 font-mono">
                              {LAYER_LABELS[entry.layer as CascadeLayer] ||
                                entry.layer}
                            </span>
                          </>
                        )}
                        {entry.isDraft && (
                          <span className="px-1 py-0.5 bg-amber-500/15 text-sf-amber text-[10px] uppercase tracking-widest">
                            Draft
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Tags */}
                  {entry.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2.5">
                      {entry.tags.slice(0, 3).map((tag, i) => (
                        <TagBadge
                          key={tag}
                          name={tag}
                          color={getTagColor(i)}
                          size="sm"
                        />
                      ))}
                      {entry.tags.length > 3 && (
                        <span className="text-[11px] text-t4">
                          +{entry.tags.length - 3}
                        </span>
                      )}
                    </div>
                  )}

                  {/* Timestamp */}
                  <p className="text-[11px] text-t5 mt-2 font-mono">
                    {format(new Date(entry.updatedAt), "MMM d, yyyy")}
                  </p>
                </GlassPanel>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
