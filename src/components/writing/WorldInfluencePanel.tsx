/**
 * World Influence panel (Studio editor inspector) — the cascade
 * differentiator: shows which of the world's environmental parameters
 * (gravity, rotation, stellar, etc., chosen in the Chain Reaction tool)
 * the current scene actually engages, live from the prose.
 */
import { useMemo } from "react";
import { Link } from "react-router-dom";
import { useWorldParameters } from "@/hooks/use-world-parameters";
import { countParameterHits, toPlainText } from "@/lib/world-parameters";

const CATEGORY_TONE: Record<string, string> = {
  gravity: "hsl(var(--sf-amber))",
  rotation: "hsl(var(--sf-stellar))",
  stellar: "hsl(var(--sf-amber))",
  hydrosphere: "hsl(var(--sf-azure))",
  atmosphere: "hsl(var(--sf-azure))",
  tilt: "hsl(var(--sf-emerald))",
  geological: "hsl(var(--sf-crimson))",
  other: "hsl(var(--sf-teal))",
};

export function WorldInfluencePanel({
  worldId,
  content,
}: {
  worldId: string;
  content: string | null | undefined;
}): JSX.Element {
  const { data: params, isLoading } = useWorldParameters(worldId);
  const plain = useMemo(() => toPlainText(content), [content]);

  const rows = useMemo(
    () =>
      (params ?? []).map((p) => ({ param: p, hits: countParameterHits(plain, p) })),
    [params, plain],
  );
  const engaged = rows.filter((r) => r.hits > 0).length;
  const total = rows.length;

  return (
    <div className="p-4">
      <div className="mb-1 font-mono text-[12px] uppercase tracking-[2px] text-t4">// world influence</div>
      <p className="mb-4 font-serif text-[13px] italic leading-relaxed text-t4">
        The environmental parameters your world runs on — and which ones this scene touches.
      </p>

      {isLoading && <p className="font-serif text-[13px] italic text-t4">Reading the cascade…</p>}

      {!isLoading && total === 0 && (
        <div className="border border-dashed border-sf-line p-4">
          <p className="font-serif text-[13px] italic leading-relaxed text-t3">
            This world hasn't set its environmental parameters yet.
          </p>
          <Link
            to={`/tools/environmental-chain-reaction?worldId=${worldId}`}
            className="mt-3 inline-block border border-sf-line-interactive px-3 py-1.5 text-[13px] text-t2 transition-colors hover:border-sf-teal hover:text-t1"
          >
            Open the Cascade tool →
          </Link>
        </div>
      )}

      {!isLoading && total > 0 && (
        <>
          <div className="space-y-px">
            {rows.map(({ param, hits }) => (
              <div
                key={param.slug}
                className="flex items-center gap-2.5 border-b border-sf-line-hairline py-2"
              >
                <span
                  className="h-1.5 w-1.5 shrink-0 rounded-full"
                  style={{ background: CATEGORY_TONE[param.category], opacity: hits > 0 ? 1 : 0.3 }}
                  aria-hidden="true"
                />
                <span className={`flex-1 font-mono text-[13px] tracking-[0.5px] ${hits > 0 ? "text-t2" : "text-t4"}`}>
                  {param.label}
                </span>
                <span
                  className={`font-mono text-[12px] tracking-[1px] ${hits > 0 ? "text-sf-teal" : "text-t4"}`}
                  title={hits > 0 ? `${hits} reference${hits === 1 ? "" : "s"} in this scene` : "Not referenced yet"}
                >
                  {hits > 0 ? `×${hits}` : "—"}
                </span>
              </div>
            ))}
          </div>
          <div className="mt-3 font-mono text-[12px] tracking-[1px] text-t4">
            {engaged} of {total} parameter{total === 1 ? "" : "s"} engaged in this scene
            {engaged > 0 && <span className="text-sf-teal"> · consistent</span>}
          </div>
        </>
      )}
    </div>
  );
}
