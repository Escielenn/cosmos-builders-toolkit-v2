/** Register: WRITER (Lora) — a library a writer browses, not an instrument readout. */
// ---------------------------------------------------------------------------
// CollectionPanel — every worksheet across the writer's worlds. Was the
// /collection page (reachable only from the account menu); now the
// COLLECTION tab of the profile (/profile?tab=collection), and /collection
// redirects there. Worksheets open in their world's instrument route.
// ---------------------------------------------------------------------------
import { useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { FileText, Search } from "lucide-react";
import { format } from "date-fns";
import { Loader } from "@/components/ui/loader";
import { GlassPanel } from "@/components/ui/glass-panel";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { EmptyState } from "@/components/ui/empty-state";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import TagBadge from "@/components/tags/TagBadge";
import WorldIconRenderer from "@/components/world/WorldIconRenderer";
import { getToolIcon } from "@/components/icons/tool-icons";
import { useAllWorksheets } from "@/hooks/use-all-worksheets";
import { getTagColor } from "@/hooks/use-tags";
import { getToolDisplayName } from "@/lib/tools-config";
import { worksheetHref } from "@/lib/world-tool-routes";

type SortBy = "recent" | "alphabetical" | "tool-type";

const filterChip =
  "inline-flex min-h-hit items-center px-3 text-xs font-medium uppercase tracking-wide rounded-none border transition-colors duration-base";

export default function CollectionPanel() {
  const { worksheets, isLoading } = useAllWorksheets();

  const [selectedToolType, setSelectedToolType] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<SortBy>("recent");
  const [searchQuery, setSearchQuery] = useState("");

  // Tool types that have worksheets
  const availableToolTypes = useMemo(() => {
    const types = new Set(worksheets.map((w) => w.tool_type));
    return Array.from(types).sort();
  }, [worksheets]);

  const filteredWorksheets = useMemo(() => {
    let result = worksheets;
    if (selectedToolType) {
      result = result.filter((w) => w.tool_type === selectedToolType);
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (w) =>
          (w.title || "").toLowerCase().includes(q) ||
          (w.worlds?.name ?? "").toLowerCase().includes(q) ||
          getToolDisplayName(w.tool_type).toLowerCase().includes(q)
      );
    }
    switch (sortBy) {
      case "alphabetical":
        return [...result].sort((a, b) => (a.title || "Untitled").localeCompare(b.title || "Untitled"));
      case "tool-type":
        return [...result].sort((a, b) => a.tool_type.localeCompare(b.tool_type));
      case "recent":
      default:
        // Already sorted by updated_at desc from the query
        return result;
    }
  }, [worksheets, selectedToolType, sortBy, searchQuery]);

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-3">
          <h2 className="font-serif text-[20px] italic text-t1">Worksheets</h2>
          <Badge variant="secondary" className="text-xs">
            {filteredWorksheets.length}
          </Badge>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-t3" aria-hidden="true" />
            <Input
              placeholder="Search worksheets..."
              aria-label="Search worksheets"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 w-48"
            />
          </div>
          <Select value={sortBy} onValueChange={(v) => setSortBy(v as SortBy)}>
            <SelectTrigger className="w-36" aria-label="Sort worksheets">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="recent">Recent</SelectItem>
              <SelectItem value="alphabetical">A-Z</SelectItem>
              <SelectItem value="tool-type">Tool Type</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Tool Type Filter */}
      {availableToolTypes.length > 1 && (
        <div className="flex flex-wrap gap-2 mb-6" role="group" aria-label="Filter by tool">
          {[null, ...availableToolTypes].map((type) => {
            const active = selectedToolType === type;
            return (
              <button
                type="button"
                key={type ?? "all"}
                aria-pressed={active}
                onClick={() => setSelectedToolType(type === null || active ? null : type)}
                className={`${filterChip} ${
                  active
                    ? "bg-sf-primary/[0.06] border-sf-primary text-sf-primary-text"
                    : "border-sf-line text-t3 hover:text-t1 hover:border-sf-line-emphasis"
                }`}
              >
                {type === null ? "All" : getToolDisplayName(type)}
              </button>
            );
          })}
        </div>
      )}

      {isLoading ? (
        <div className="flex justify-center py-16">
          <Loader />
        </div>
      ) : filteredWorksheets.length === 0 ? (
        <EmptyState
          warm
          eyebrow="Worksheet index"
          title={searchQuery || selectedToolType ? "No matching records" : "No worksheets yet"}
          description={
            searchQuery || selectedToolType
              ? "ADJUST FILTERS OR SEARCH PARAMETERS."
              : "BEGIN A SURVEY IN ANY WORLD TO POPULATE THIS INDEX."
          }
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {filteredWorksheets.map((worksheet) => {
            const CustomIcon = getToolIcon(worksheet.tool_type);
            const href = worksheetHref(worksheet);
            const card = (
              <GlassPanel hover={!!href} className="p-5 h-full">
                <div className="flex items-start gap-3">
                  {CustomIcon ? (
                    <CustomIcon className="w-10 h-10 rounded-none shrink-0" />
                  ) : (
                    <div className="w-10 h-10 rounded-none bg-sf-primary/[0.06] border border-sf-primary flex items-center justify-center shrink-0">
                      <FileText className="w-5 h-5 text-sf-primary-text" aria-hidden="true" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <h3 className="font-medium truncate">{worksheet.title || "Untitled"}</h3>
                    <p className="text-xs text-t3 mt-0.5">{getToolDisplayName(worksheet.tool_type)}</p>
                    {worksheet.worlds && (
                      <div className="flex items-center gap-1.5 mt-2 text-xs text-t3">
                        <WorldIconRenderer iconId={worksheet.worlds.icon} className="w-3.5 h-3.5" />
                        <span className="truncate">{worksheet.worlds.name}</span>
                      </div>
                    )}
                    <p className="text-xs text-t3 mt-1">
                      Updated {format(new Date(worksheet.updated_at), "MMM d, yyyy")}
                    </p>
                    {worksheet.tags && worksheet.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {worksheet.tags.slice(0, 3).map((tag) => {
                          const hash = tag
                            .split("")
                            .reduce((acc: number, char: string) => acc + char.charCodeAt(0), 0);
                          return <TagBadge key={tag} name={tag} color={getTagColor(hash)} size="sm" />;
                        })}
                        {worksheet.tags.length > 3 && (
                          <span className="text-xs text-t3">+{worksheet.tags.length - 3}</span>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </GlassPanel>
            );
            return href ? (
              <Link key={worksheet.id} to={href}>
                {card}
              </Link>
            ) : (
              <div key={worksheet.id}>{card}</div>
            );
          })}
        </div>
      )}
    </div>
  );
}
