// ---------------------------------------------------------------------------
// Community, Browse page for community/public worlds
// Route: /community
// ---------------------------------------------------------------------------

import { useState } from "react";
import { Search, Globe, Layers } from "lucide-react";
import { PageContainer, PageHeader } from "@/components/layout/page-chrome";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { GlassPanel } from "@/components/ui/glass-panel";
import { Input } from "@/components/ui/input";
import { Loader } from "@/components/ui/loader";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import CommunityWorldCard from "@/components/community/CommunityWorldCard";
import {
  useCommunityWorlds,
  type CommunitySort,
} from "@/hooks/use-community-worlds";
import { useMetaTags } from "@/hooks/use-meta-tags";

const SORT_OPTIONS: { value: CommunitySort; label: string }[] = [
  { value: "recent", label: "Recent" },
  { value: "most_forked", label: "Most Forked" },
  { value: "most_favorited", label: "Most Favorited" },
];

const Community = () => {
  useMetaTags({ title: "Community" });
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState<CommunitySort>("recent");

  const { data: worlds = [], isLoading } = useCommunityWorlds(
    search || undefined,
    sort
  );

  return (
    <div className="min-h-screen bg-sf-void sf-atmosphere">
      <Header />
      <main className="relative z-10">
        <PageContainer variant="wide">
        {/* Top-level page: no back link (the logo goes home). */}
        <PageHeader
          size="page"
          eyebrow="Shared index"
          icon={<Globe className="w-6 h-6 text-sf-primary-text" aria-hidden />}
          title="Community worlds"
          lede="Explore worlds built by the StellarForge community. Fork them to use as a starting point, or just browse for inspiration."
        />

        {/* Search + Sort Bar */}
        <div className="flex flex-col sm:flex-row gap-3 mb-8">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-t4" />
            <Input
              type="text"
              placeholder="Search worlds, tags, or creators..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 font-sans"
            />
          </div>
          <Select
            value={sort}
            onValueChange={(v) => setSort(v as CommunitySort)}
          >
            <SelectTrigger className="w-full sm:w-[180px]">
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              {SORT_OPTIONS.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Loading */}
        {isLoading && (
          <div className="flex items-center justify-center py-20">
            <Loader />
          </div>
        )}

        {/* Empty State */}
        {!isLoading && worlds.length === 0 && (
          <GlassPanel className="p-12 text-center max-w-lg mx-auto">
            <Layers className="w-10 h-10 text-t4 mx-auto mb-4" />
            <h2 className="font-display text-sf-h3 font-light text-t1 mb-2">
              No community worlds yet
            </h2>
            <p className="font-sans text-sf-small text-t2 max-w-sm mx-auto">
              {search
                ? "No worlds match your search. Try a different query."
                : "Be the first to share a world with the community. Set your world's visibility to Community or Public in its share settings."}
            </p>
          </GlassPanel>
        )}

        {/* Worlds Grid */}
        {!isLoading && worlds.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {worlds.map((world) => (
              <CommunityWorldCard key={world.id} world={world} />
            ))}
          </div>
        )}
        </PageContainer>
      </main>

      <Footer />
    </div>
  );
};

export default Community;
