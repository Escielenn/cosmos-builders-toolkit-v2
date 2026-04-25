import { useState, useMemo, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft, FileText, Search, ChevronRight } from "lucide-react";
import { Loader } from "@/components/ui/loader";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { GlassPanel } from "@/components/ui/glass-panel";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/contexts/AuthContext";
import { useAllWorksheets } from "@/hooks/use-all-worksheets";
import { useWorlds } from "@/hooks/use-worlds";
import { TOOL_DISPLAY_NAMES, getToolDisplayName } from "@/lib/tools-config";
import { getToolIcon } from "@/components/icons/tool-icons";
import WorldIconRenderer from "@/components/world/WorldIconRenderer";
import { format } from "date-fns";
import TagBadge from "@/components/tags/TagBadge";
import { getTagColor } from "@/hooks/use-tags";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { PageBursts } from "@/components/ui/data-burst";
import { COLLECTION_BURSTS } from "@/lib/data-bursts";
import { EmptyState } from "@/components/ui/empty-state";

type SortBy = "recent" | "alphabetical" | "tool-type";

const Collection = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const { worksheets, isLoading } = useAllWorksheets();
  const { worlds, isLoading: worldsLoading } = useWorlds();

  const [selectedToolType, setSelectedToolType] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<SortBy>("recent");
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    if (!loading && !user) {
      navigate("/auth");
    }
  }, [user, loading, navigate]);

  // Get unique tool types that have worksheets
  const availableToolTypes = useMemo(() => {
    const types = new Set(worksheets.map((w) => w.tool_type));
    return Array.from(types).sort();
  }, [worksheets]);

  // Filter and sort worksheets
  const filteredWorksheets = useMemo(() => {
    let result = worksheets;

    // Filter by tool type
    if (selectedToolType) {
      result = result.filter((w) => w.tool_type === selectedToolType);
    }

    // Filter by search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (w) =>
          (w.title || "").toLowerCase().includes(q) ||
          w.worlds.name.toLowerCase().includes(q) ||
          getToolDisplayName(w.tool_type).toLowerCase().includes(q)
      );
    }

    // Sort
    switch (sortBy) {
      case "alphabetical":
        result = [...result].sort((a, b) =>
          (a.title || "Untitled").localeCompare(b.title || "Untitled")
        );
        break;
      case "tool-type":
        result = [...result].sort((a, b) =>
          a.tool_type.localeCompare(b.tool_type)
        );
        break;
      case "recent":
      default:
        // Already sorted by updated_at desc from the query
        break;
    }

    return result;
  }, [worksheets, selectedToolType, sortBy, searchQuery]);

  if (loading) {
    return (
      <div className="relative min-h-screen bg-background sf-atmosphere">
        <Header />
        <main className="container mx-auto px-4 pt-24 pb-16 flex items-center justify-center">
          <Loader />
        </main>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen bg-background sf-atmosphere">
      <Header />
      <PageBursts bursts={COLLECTION_BURSTS} />
      <main className="container mx-auto px-4 pt-24 pb-16 relative z-10">
        {/* Back Navigation */}
        <Link
          to="/"
          className="inline-flex items-center gap-2 font-heading text-[11px] uppercase tracking-[0.2em] font-medium text-t3 hover:text-sf-teal-bright transition-colors duration-base mb-6"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          ← RETURN TO BRIDGE
        </Link>

        {/* My Worlds Quick Access */}
        <section className="mb-12">
          <Link
            to="/worlds"
            className="flex items-center justify-between group mb-4"
          >
            <h2 className="font-heading font-light text-xl uppercase tracking-sf-wide">
              My Worlds
            </h2>
            <span className="text-xs text-t3 group-hover:text-t1 transition-colors flex items-center gap-1">
              View all
              <ChevronRight className="w-3.5 h-3.5" />
            </span>
          </Link>
          {worldsLoading ? (
            <div className="flex justify-center py-8">
              <Loader size="sm" />
            </div>
          ) : worlds.length === 0 ? (
            <EmptyState
              hideDial
              title="WORLD INDEX: EMPTY"
              description="INITIALIZE A WORLD TO POPULATE THIS ARCHIVE."
              actionLabel="CREATE WORLD"
              actionTo="/worlds"
              className="py-10"
            />
          ) : (
            <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-thin">
              {worlds.slice(0, 6).map((world) => {
                return (
                  <Link
                    key={world.id}
                    to={`/worlds/${world.id}`}
                    className="shrink-0"
                  >
                    <GlassPanel hover className="p-4 w-44">
                      <div className="flex items-center gap-2.5 mb-1.5">
                        <WorldIconRenderer iconId={world.icon} className="w-6 h-6 text-primary shrink-0" />
                        <h3 className="font-semibold text-sm truncate">
                          {world.name}
                        </h3>
                      </div>
                      <p className="text-xs text-t3 truncate">
                        {world.description || "No description"}
                      </p>
                    </GlassPanel>
                  </Link>
                );
              })}
              {worlds.length > 6 && (
                <Link to="/worlds" className="shrink-0">
                  <GlassPanel hover className="p-4 w-44 h-full flex items-center justify-center">
                    <span className="text-sm text-t3">
                      +{worlds.length - 6} more
                    </span>
                  </GlassPanel>
                </Link>
              )}
            </div>
          )}
        </section>

        {/* Worksheets Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div className="flex items-center gap-3">
            <h2 className="font-heading font-light text-xl uppercase tracking-sf-wide">
              Worksheets
            </h2>
            <Badge variant="secondary" className="text-xs">
              {filteredWorksheets.length}
            </Badge>
          </div>
          <div className="flex items-center gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-t3" />
              <Input
                placeholder="Search worksheets..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 w-48"
              />
            </div>
            <Select value={sortBy} onValueChange={(v) => setSortBy(v as SortBy)}>
              <SelectTrigger className="w-36">
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
          <div className="flex flex-wrap gap-2 mb-8">
            <Badge
              variant={selectedToolType === null ? "default" : "secondary"}
              className="cursor-pointer"
              onClick={() => setSelectedToolType(null)}
            >
              All
            </Badge>
            {availableToolTypes.map((type) => (
              <Badge
                key={type}
                variant={selectedToolType === type ? "default" : "secondary"}
                className="cursor-pointer"
                onClick={() =>
                  setSelectedToolType(selectedToolType === type ? null : type)
                }
              >
                {getToolDisplayName(type)}
              </Badge>
            ))}
          </div>
        )}

        {/* Worksheets Grid */}
        {isLoading ? (
          <div className="flex justify-center py-16">
            <Loader />
          </div>
        ) : filteredWorksheets.length === 0 ? (
          <EmptyState
            eyebrow="// WORKSHEET INDEX"
            title={searchQuery || selectedToolType ? "NO MATCHING RECORDS" : "WORKSHEET INDEX: EMPTY"}
            description={
              searchQuery || selectedToolType
                ? "ADJUST FILTERS OR SEARCH PARAMETERS."
                : "BEGIN A SURVEY IN ANY WORLD TO POPULATE THIS INDEX."
            }
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredWorksheets.map((worksheet) => {
              const CustomIcon = getToolIcon(worksheet.tool_type);

              return (
                <Link
                  key={worksheet.id}
                  to={`/tools/${worksheet.tool_type}?worldId=${worksheet.world_id}&worksheetId=${worksheet.id}`}
                >
                  <GlassPanel hover className="p-5 h-full">
                    <div className="flex items-start gap-3">
                      {CustomIcon ? (
                        <CustomIcon className="w-10 h-10 rounded-sm shrink-0" />
                      ) : (
                        <div className="w-10 h-10 rounded-sm bg-primary/20 flex items-center justify-center shrink-0">
                          <FileText className="w-5 h-5 text-primary" />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold truncate">
                          {worksheet.title || "Untitled"}
                        </h3>
                        <p className="text-xs text-t3 mt-0.5">
                          {getToolDisplayName(worksheet.tool_type)}
                        </p>
                        <div className="flex items-center gap-1.5 mt-2 text-xs text-t3">
                          <WorldIconRenderer iconId={worksheet.worlds.icon} className="w-3.5 h-3.5" />
                          <span className="truncate">{worksheet.worlds.name}</span>
                        </div>
                        <p className="text-xs text-t3 mt-1">
                          Updated{" "}
                          {format(
                            new Date(worksheet.updated_at),
                            "MMM d, yyyy"
                          )}
                        </p>
                        {worksheet.tags && worksheet.tags.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-2">
                            {worksheet.tags.slice(0, 3).map((tag) => {
                              const hash = tag
                                .split("")
                                .reduce(
                                  (acc: number, char: string) =>
                                    acc + char.charCodeAt(0),
                                  0
                                );
                              return (
                                <TagBadge
                                  key={tag}
                                  name={tag}
                                  color={getTagColor(hash)}
                                  size="sm"
                                />
                              );
                            })}
                            {worksheet.tags.length > 3 && (
                              <span className="text-xs text-t3">
                                +{worksheet.tags.length - 3}
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </GlassPanel>
                </Link>
              );
            })}
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
};

export default Collection;
