// ---------------------------------------------------------------------------
// AnchorStarSection — put this system somewhere real (G4).
//
// The galaxy view can draw a system anchored to a catalogue star, but until
// now nothing could SET the anchor: a ring you can see and cannot choose is a
// dead-end readout, which Law III forbids. This is the other half.
//
// It is also where anchoring pays off. Choosing "Tau Ceti" does not just move
// a dot — it answers how far from Sol, and what is next door, in light years.
// Those are the numbers Impulse turns into travel time and Paradox into
// dilation: a fact the writer decided, producing sentences they can write.
//
// Anchoring is OPTIONAL and reversible. A world that belongs nowhere real is
// a legitimate world, and the copy says so rather than implying an omission.
// ---------------------------------------------------------------------------

import { useMemo, useState } from "react";
import { Search, Stars, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Loader } from "@/components/ui/loader";
import { useStarCatalog } from "@/hooks/use-star-catalog";
import {
  distanceFromSolLy,
  findCatalogStar,
  nearestNeighbours,
} from "@/gl/bind/starfield";

interface AnchorStarSectionProps {
  anchor: string | null;
  canEdit: boolean;
  onChange: (patch: { anchor_star: string | null }) => void;
}

export function AnchorStarSection({
  anchor,
  canEdit,
  onChange,
}: AnchorStarSectionProps) {
  const [query, setQuery] = useState("");
  const { data: catalog, isLoading, error } = useStarCatalog(true);

  const anchored = useMemo(
    () => (catalog ? findCatalogStar(catalog, anchor) : null),
    [catalog, anchor],
  );

  const results = useMemo(() => {
    if (!catalog || !query.trim()) return [];
    const q = query.trim().toLowerCase();
    return catalog
      .filter((s) => s.name.toLowerCase().includes(q))
      .sort((a, b) => a.distancePc - b.distancePc)
      .slice(0, 8);
  }, [catalog, query]);

  const neighbours = useMemo(
    () => (catalog && anchored ? nearestNeighbours(catalog, anchored, 4) : []),
    [catalog, anchored],
  );

  if (!anchor && !canEdit) return null;

  return (
    <>
      <div className="sf-wiki-section-header">Real Sky</div>

      {error ? (
        <p className="font-mono text-[12px] uppercase tracking-wider text-sf-crimson-text">
          // STAR CATALOGUE UNAVAILABLE.
        </p>
      ) : isLoading ? (
        <Loader size="sm" />
      ) : anchored ? (
        <div className="space-y-2">
          <div className="flex flex-wrap items-baseline gap-2">
            <Stars className="h-3.5 w-3.5 shrink-0 text-sf-primary-text" aria-hidden />
            <span className="text-[15px] text-t1">{anchored.name}</span>
            <span className="font-mono text-[12px] uppercase tracking-wider text-t3">
              {distanceFromSolLy(anchored).toFixed(2)} ly from Sol
            </span>
            {canEdit && (
              <button
                type="button"
                onClick={() => onChange({ anchor_star: null })}
                className="ml-auto flex min-h-hit items-center gap-1 border border-sf-line-interactive px-2 font-mono text-[12px] uppercase tracking-wider text-t3 transition-colors hover:border-sf-crimson hover:text-sf-crimson-text"
              >
                <X className="h-3 w-3" aria-hidden />
                Unanchor
              </button>
            )}
          </div>

          {neighbours.length > 0 && (
            <div>
              <span className="mb-1 block font-mono text-[12px] uppercase tracking-wider text-t4">
                Nearest neighbours
              </span>
              <ul className="space-y-0.5">
                {neighbours.map(({ star, separationLy }) => (
                  <li
                    key={star.name}
                    className="flex items-baseline justify-between gap-3 text-[13px]"
                  >
                    <span className="text-t2">{star.name}</span>
                    <span className="font-mono text-[12px] text-t3">
                      {separationLy.toFixed(2)} ly
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          <p className="text-[12px] leading-relaxed text-t3">
            Drawn at this star's real position in the Codex Atlas's Real sky
            view. The distances above are measured, not chosen — they are what
            travel time and time dilation are calculated from.
          </p>
        </div>
      ) : canEdit ? (
        <div className="space-y-2">
          <div className="relative">
            <Search
              className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-t4"
              aria-hidden
            />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Anchor to a real star — Tau Ceti, Sirius…"
              aria-label="Find a real star"
              className="h-10 pl-9 text-sm"
            />
          </div>

          {results.length > 0 && (
            <ul className="border border-sf-line-interactive">
              {results.map((star) => (
                <li key={star.name}>
                  <button
                    type="button"
                    onClick={() => {
                      onChange({ anchor_star: star.name });
                      setQuery("");
                    }}
                    className="flex min-h-hit w-full items-baseline justify-between gap-3 px-3 text-left transition-colors hover:bg-sf-surface-elevated"
                  >
                    <span className="text-[14px] text-t2">{star.name}</span>
                    <span className="shrink-0 font-mono text-[12px] text-t4">
                      {distanceFromSolLy(star).toFixed(1)} ly
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}

          {query.trim() && results.length === 0 && (
            <p className="font-mono text-[12px] uppercase tracking-wider text-t3">
              // NO SUCH STAR IN THE CATALOGUE.
            </p>
          )}

          <p className="text-[12px] leading-relaxed text-t3">
            Optional. Anchoring puts this system at a real star's position and
            gives you real distances to work from. A world that belongs
            nowhere real is a world too — leave this empty and it stays on
            your own chart.
          </p>
        </div>
      ) : null}
    </>
  );
}

export default AnchorStarSection;
