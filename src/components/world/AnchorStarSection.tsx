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

import { Suspense, lazy, useMemo, useState } from "react";
import { Eye, Search, Stars, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Loader } from "@/components/ui/loader";
import { useStarCatalog } from "@/hooks/use-star-catalog";
import { usePrefersReducedMotion } from "@/hooks/use-prefers-reduced-motion";
import { useSubjectEpoch } from "@/hooks/use-subject-entity";
import {
  distanceFromSolLy,
  findCatalogStar,
  nearestNeighbours,
  type WorldSystem,
} from "@/gl/bind/starfield";
import { buildSky, epochYearToJ2000Years } from "@/gl/bind/sky";

// three.js is heavy and most Codex pages never need it. The NUMBERS below are
// free — they are pure geometry — so they always show; the render only loads
// when the writer asks to look.
const SkyScene = lazy(() => import("@/gl/scenes/SkyScene"));

interface AnchorStarSectionProps {
  /** The system this is the sky of. Ids are the only identity. */
  systemId: string;
  systemName: string;
  anchor: string | null;
  canEdit: boolean;
  onChange: (patch: { anchor_star: string | null }) => void;
}

export function AnchorStarSection({
  systemId,
  systemName,
  anchor,
  canEdit,
  onChange,
}: AnchorStarSectionProps) {
  const [query, setQuery] = useState("");
  const [showSky, setShowSky] = useState(false);
  const reducedMotion = usePrefersReducedMotion();
  const epoch = useSubjectEpoch();
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

  // The sky from here. This is what anchoring was for: a place with a night
  // sky, computed from the catalogue by translating every star by this
  // system's position. Constellations deform because the geometry changed.
  const sky = useMemo(() => {
    if (!catalog || !anchored) return null;
    const system: WorldSystem = {
      kind: "world",
      id: systemId,
      name: systemName,
      anchor: anchored,
      position: anchored.position,
      positionIsReal: true,
    };
    // `?epoch=` is a calendar year; the precession maths takes years from
    // J2000. Converting here rather than assuming is the difference between
    // precessing 340 years and 2340.
    return buildSky(catalog, system, epochYearToJ2000Years(epoch));
  }, [catalog, anchored, systemId, systemName, epoch]);

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

          {sky && (
            <div className="border-t border-sf-line-hairline pt-2">
              <span className="mb-1 block font-mono text-[12px] uppercase tracking-wider text-t4">
                The sky from here
              </span>
              <ul className="space-y-0.5">
                <li className="flex items-baseline justify-between gap-3 text-[13px]">
                  <span className="text-t2">Naked-eye stars</span>
                  <span className="font-mono text-[12px] text-t3">
                    {sky.visibleCount} of {sky.catalogueCount}
                  </span>
                </li>
                {sky.brightest && (
                  <li className="flex items-baseline justify-between gap-3 text-[13px]">
                    <span className="truncate text-t2">
                      Brightest — {sky.brightest.name}
                    </span>
                    <span className="shrink-0 font-mono text-[12px] text-t3">
                      mag {sky.brightest.appMag.toFixed(2)}
                    </span>
                  </li>
                )}
                {sky.poleStar && (
                  <li className="flex items-baseline justify-between gap-3 text-[13px]">
                    <span className="truncate text-t2">
                      Pole star — {sky.poleStar.star.name}
                    </span>
                    <span className="shrink-0 font-mono text-[12px] text-t3">
                      {sky.poleStar.degreesFromPole.toFixed(1)}° off
                    </span>
                  </li>
                )}
              </ul>

              {showSky ? (
                <div className="mt-2 aspect-video w-full overflow-hidden border border-sf-line bg-sf-void">
                  <Suspense
                    fallback={
                      <div className="flex h-full items-center justify-center">
                        <Loader size="sm" />
                      </div>
                    }
                  >
                    <SkyScene
                      sky={sky}
                      markedName={sky.poleStar?.star.name ?? null}
                      reducedMotion={reducedMotion}
                      className="h-full w-full"
                    />
                  </Suspense>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setShowSky(true)}
                  className="mt-2 flex min-h-hit items-center gap-1.5 border border-sf-line-interactive px-2 font-mono text-[12px] uppercase tracking-wider text-t3 transition-colors hover:border-sf-line-emphasis hover:text-t1"
                >
                  <Eye className="h-3 w-3" aria-hidden />
                  Look at it
                </button>
              )}

              <p className="mt-2 text-[12px] leading-relaxed text-t2">
                Every star above is a real one, at the brightness and direction
                it has from this system — not from Earth. The constellations do
                not match anyone's, and that is the point.
                {epoch !== null
                  ? " Precessed to the epoch on this page, at Earth's rate and tilt."
                  : ""}
              </p>
            </div>
          )}

          <p className="text-[12px] leading-relaxed text-t2">
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
