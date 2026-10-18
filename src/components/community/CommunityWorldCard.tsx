// ---------------------------------------------------------------------------
// CommunityWorldCard, Card for a community/public world in the browse grid
// ---------------------------------------------------------------------------

import { Link } from "react-router-dom";
import { Globe, Layers, Eye } from "lucide-react";
import { GlassPanel } from "@/components/ui/glass-panel";
import { Badge } from "@/components/ui/badge";
import LicenseBadge from "@/components/community/LicenseBadge";
import FavoriteButton from "@/components/community/FavoriteButton";
import ForkButton from "@/components/community/ForkButton";
import type { CommunityWorld } from "@/hooks/use-community-worlds";
import WorldIconRenderer from "@/components/world/WorldIconRenderer";

interface CommunityWorldCardProps {
  world: CommunityWorld;
}

export default function CommunityWorldCard({ world }: CommunityWorldCardProps) {
  return (
    <GlassPanel
      className="p-5 flex flex-col gap-3 group transition-all duration-base hover:-translate-y-0.5"
      hover
    >
      {/* Top row: icon + name + license */}
      <div className="flex items-start gap-3">
        <span className="flex-shrink-0" role="img" aria-label="World icon">
          <WorldIconRenderer iconId={world.icon || "globe"} className="w-6 h-6 text-sf-primary-text" />
        </span>
        <div className="flex-1 min-w-0">
          <h3 className="font-heading text-base font-light text-t1 truncate">
            {world.name}
          </h3>
          <span className="font-sans text-xs text-t3">
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
              className="font-mono text-xs px-2 py-0.5 rounded-none bg-sf-surface-elevated border border-sf-line text-t3"
            >
              {tag}
            </span>
          ))}
          {world.tags.length > 4 && (
            <span className="font-mono text-xs text-t4">
              +{world.tags.length - 4}
            </span>
          )}
        </div>
      )}

      {/* Stats row */}
      <div className="flex items-center gap-4 text-t4">
        <span className="inline-flex items-center gap-1 font-mono text-xs">
          <Layers className="w-3 h-3" />
          {world.entity_count} {world.entity_count === 1 ? "entity" : "entities"}
        </span>
        {world.is_example && (
          <Badge variant="glow-amber" className="font-mono text-xs px-1.5 py-0">
            Example
          </Badge>
        )}
      </div>

      {/* Divider */}
      <div className="h-px bg-sf-line-hairline" />

      {/* Actions row */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
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
          className="inline-flex items-center gap-1.5 font-sans text-xs font-medium uppercase tracking-[1px] px-3 py-1.5 bg-sf-primary/[0.06] border border-sf-primary text-sf-primary-text hover:bg-sf-primary/[0.12] transition-colors"
        >
          <Eye className="w-3.5 h-3.5" />
          View
        </Link>
      </div>

      {/* Bottom edge glow line */}
      <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-sf-primary/60 transition-transform duration-slow origin-left scale-x-0 group-hover:scale-x-100" />
    </GlassPanel>
  );
}
