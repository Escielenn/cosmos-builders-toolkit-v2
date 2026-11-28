/**
 * SkyFromCanon, the world's own sky beside Mythos' "Sky appearance" (1.9,
 * audit E13 / N4, lane C).
 *
 * A mythology's first material is the sky its people grew up under. ExoSky
 * computes that sky and names its constellations; until now Mythos asked the
 * writer to describe the sky in free text and never showed what ExoSky had
 * already decided. This reads the world's sky facts through canon: stored
 * planet.sky.* facts (lane E's predicates) and, until those exist, the sky.*
 * facts projected from ExoSky saves. Read-only here; ExoSky is where the sky
 * is edited, one click away (Law III). The writer's text is never touched.
 */
import { useMemo } from "react";
import { Link } from "react-router-dom";
import { useCanonFacts } from "@/canon/hooks";
import type { CanonFact } from "@/canon/types";

function isSkyFact(f: CanonFact): boolean {
  return f.predicate.startsWith("planet.sky.") || f.predicate.startsWith("legacy.sky.");
}

function isConstellation(f: CanonFact): boolean {
  return f.predicate === "planet.sky.constellations[]" || f.predicate.startsWith("legacy.sky.constellation.");
}

export function SkyFromCanon({ worldId }: { worldId: string | null | undefined }): JSX.Element | null {
  const { data: facts } = useCanonFacts(worldId ?? undefined);
  const { sky, constellations } = useMemo(() => {
    const all = (facts ?? []).filter(isSkyFact);
    return { sky: all.filter((f) => !isConstellation(f)), constellations: all.filter(isConstellation) };
  }, [facts]);
  if (!worldId) return null;

  if (sky.length === 0 && constellations.length === 0) {
    return (
      <p className="sf-measure mt-2 text-[13px] text-t3">
        No sky computed for this world yet.{" "}
        <Link to={`/tools/exosky?worldId=${worldId}`} className="text-sf-primary-text underline-offset-2 hover:underline">
          Open ExoSky
        </Link>{" "}
        to see the stars and constellations from its surface; they will show here.
      </p>
    );
  }

  return (
    <div className="mt-3 border border-sf-line p-3" aria-label="The sky from ExoSky">
      <div className="flex items-baseline justify-between gap-3">
        <p className="font-heading text-sf-eyebrow uppercase text-t4">The sky from this world</p>
        <Link to={`/tools/exosky?worldId=${worldId}`} className="inline-flex min-h-hit items-center text-[13px] text-sf-primary-text hover:text-t1">
          Edit in ExoSky
        </Link>
      </div>
      {sky.length > 0 && (
        <dl className="mt-1">
          {sky.map((f) => (
            <div key={f.id} className="flex items-baseline justify-between gap-3 border-b border-sf-line-hairline py-1 last:border-b-0">
              <dt className="text-[13px] text-t3">{f.label}</dt>
              <dd className="text-right font-mono text-[13px] text-t1">{f.valueText}</dd>
            </div>
          ))}
        </dl>
      )}
      {constellations.length > 0 && (
        <>
          <p className="mt-2 font-mono text-[12px] uppercase text-t4">Constellations ({constellations.length})</p>
          <ul className="mt-1">
            {constellations.map((f) => (
              <li key={f.id} className="py-0.5 text-[13px] text-t2">
                {f.predicate.startsWith("legacy.") ? `${f.label.replace(/^Constellation\s*"?/i, "").replace(/"$/, "")}: ${f.valueText}` : f.valueText}
              </li>
            ))}
          </ul>
        </>
      )}
      <p className="mt-2 text-[12px] text-t3">These are subjects for myth: what each people calls them is yours to decide above.</p>
    </div>
  );
}
