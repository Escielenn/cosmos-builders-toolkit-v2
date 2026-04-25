// ---------------------------------------------------------------------------
// CommunityWorldCard — Card for a community/public world in the browse grid
// ---------------------------------------------------------------------------

import { Link } from "react-router-dom";
import { Globe, Layers, Eye } from "lucide-react";
import { GlassPanel } from "@/components/ui/glass-panel";
import { Badge } from "@/components/ui/badge";
import LicenseBadge from "@/components/community/LicenseBadge";
import FavoriteButton from "@/components/community/FavoriteButton";
import ForkButton from "@/components/community/ForkButton";
import type { CommunityWorld } from "@/hooks/use-community-worlds";

interface CommunityWorldCardProps {
  world: CommunityWorld;
}

export default function CommunityWorldCard({ world }: CommunityWorldCardProps) {
  return (
    <GlassPanel
      className="p-5 flex flex-col gap-3 group transition-all duration-200 hover:-translate-y-0.5"
      hover
    >
      {/* Top row: icon + name + license */}
      <div className="flex items-start gap-3">
        <span className="text-2xl flex-shrink-0" role="img" aria-label="World icon">
          {world.icon || "🌍"}
        </span>
        <div className="flex-1 min-w-0">
          <h3 className="font-heading text-base font-light text-t1 truncate">
            {world.name}
          </h3>
          <span className="font-sans text-[11px] text-t3">
            by {world.is_example ? "StellarForge" : world.owner_display_name}
          </span>
        </div>
        <LicenseBadge license={world.license} />
      </div>

      {/* Description */}
      {world.description && (
        <p className="font-sans text-xs text-t2 line-clamp-2 leading-relaxed">
          {world.description}
        </p>
      )}

      {/* Tags */}
      {world.tags.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {world.tags.slice(0, 4).map((tag) => (
            <span
              key={tag}
              className="font-mono text-[10px] px-2 py-0.5 rounded-sm bg-white/[0.04] border border-white/[0.08] text-t3"
            >
              {tag}
            </span>
          ))}
          {world.tags.length > 4 && (
            <span className="font-mono text-[10px] text-t4">
              +{world.tags.length - 4}
            </span>
          )}
        </div>
      )}

      {/* Stats row */}
      <div className="flex items-center gap-4 text-t4">
        <span className="inline-flex items-center gap-1 font-mono text-[11px]">
          <Layers className="w-3 h-3" />
          {world.entity_count} {world.entity_count === 1 ? "entity" : "entities"}
        </span>
        {world.is_example && (
          <Badge variant="glow-amber" className="font-mono text-[10px] px-1.5 py-0">
            Example
          </Badge>
        )}
      </div>

      {/* Divider */}
      <div className="h-px bg-white/[0.06]" />

      {/* Actions row */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1">
          <FavoriteButton worldId={world.id} />
          <ForkButton
            worldId={world.id}
            worldName={world.name}
            forkCount={world.fork_count}
            license={world.license}
          />
        </div>

        <Link
          to={`/worlds/${world.id}/showcase`}
          className="inline-flex items-center gap-1.5 font-sans text-xs font-medium uppercase tracking-[1px] px-3 py-1.5 bg-primary/[0.06] border border-primary/[0.15] text-primary hover:bg-primary/[0.12] transition-colors"
        >
          <Eye className="w-3.5 h-3.5" />
          View
        </Link>
      </div>

      {/* Bottom edge glow line */}
      <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-primary/60 transition-transform duration-300 origin-left scale-x-0 group-hover:scale-x-100" />
    </GlassPanel>
  );
}
