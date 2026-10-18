// ---------------------------------------------------------------------------
// WordHistoryChart, words written per day for the last 30 or 90 days, from
// the writing_sessions ledger. Lives in the Studio home's stats area.
//
// One series, so no legend: the title names it. Bars in sf-primary (the
// user's chosen role colour; magnitude in a single hue), recessive hairline
// grid, numbers in mono at t3/t4. Square bars: the zero-radius rule wins.
// Hover a day for its count; the table view carries every value
// for screen readers and anyone who prefers numbers.
// ---------------------------------------------------------------------------

import { useMemo, useState } from "react";
import { useWritingSessions } from "@/hooks/use-writing-activity";
import { niceCeiling, shapeWordHistory } from "@/lib/writing-activity";
import { localDay } from "@/lib/local-day";

const RANGES = [30, 90] as const;
type Range = (typeof RANGES)[number];

const LABEL = new Intl.DateTimeFormat(undefined, { month: "short", day: "numeric", timeZone: "UTC" });
const LONG = new Intl.DateTimeFormat(undefined, {
  weekday: "short",
  month: "short",
  day: "numeric",
  year: "numeric",
  timeZone: "UTC",
});

/** A YYYY-MM-DD key read as a calendar date (UTC midnight, so it never shifts). */
function dayDate(day: string): Date {
  const [y, m, d] = day.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d));
}

const SLOT = 10; // viewBox units per day
const BAR = 8; // leaves a 2-unit surface gap between bars
const H = 100;

export function WordHistoryChart(): JSX.Element {
  const { data: sessions, isLoading, isError } = useWritingSessions();
  const [range, setRange] = useState<Range>(30);
  const [view, setView] = useState<"chart" | "table">("chart");
  const [hover, setHover] = useState<number | null>(null);

  const today = localDay();
  const history = useMemo(
    () => shapeWordHistory(sessions ?? [], today, range),
    [sessions, today, range],
  );
  const ceiling = niceCeiling(history.max);
  const n = history.points.length;
  const hovered = hover !== null ? history.points[hover] : null;

  return (
    <figure className="mt-8" aria-labelledby="word-history-title">
      <div className="flex flex-wrap items-end justify-between gap-x-6 gap-y-3">
        <div>
          <h2 id="word-history-title" className="font-serif text-[20px] italic text-t1">
            Words written, by day
          </h2>
          <p className="mt-1 font-serif text-[14px] italic text-t3">
            {isLoading
              ? "Reading the ledger."
              : `${history.total.toLocaleString()} words across ${history.activeDays} ${
                  history.activeDays === 1 ? "day" : "days"
                } in the last ${range}.`}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <div role="group" aria-label="Range" className="flex">
            {RANGES.map((r) => (
              <button
                key={r}
                type="button"
                aria-pressed={range === r}
                onClick={() => {
                  setRange(r);
                  setHover(null);
                }}
                className={`min-h-hit border px-3 font-sans text-[13px] font-medium transition-colors duration-fast ${
                  range === r
                    ? "border-sf-primary bg-sf-primary/[0.06] text-sf-primary-text"
                    : "border-sf-line text-t2 hover:border-sf-line-emphasis hover:text-t1"
                }`}
              >
                {r} days
              </button>
            ))}
          </div>
          <button
            type="button"
            aria-pressed={view === "table"}
            onClick={() => setView((v) => (v === "chart" ? "table" : "chart"))}
            className="min-h-hit border border-sf-line px-3 font-sans text-[13px] font-medium text-t2 transition-colors duration-fast hover:border-sf-line-emphasis hover:text-t1"
          >
            {view === "chart" ? "Show table" : "Show chart"}
          </button>
        </div>
      </div>

      {isError ? (
        <p className="mt-4 font-sans text-[14px] text-sf-crimson-text">// LEDGER UNAVAILABLE. RETRY LATER.</p>
      ) : view === "table" ? (
        <div className="sf-sb mt-4 max-h-72 overflow-y-auto border border-sf-line">
          <table className="w-full text-left">
            <caption className="sr-only">Words written per day, last {range} days</caption>
            <thead className="sticky top-0 bg-sf-surface">
              <tr className="border-b border-sf-line-hairline">
                <th scope="col" className="px-3 py-2 font-sans text-[12px] font-medium text-t3">Day</th>
                <th scope="col" className="px-3 py-2 text-right font-sans text-[12px] font-medium text-t3">Words</th>
              </tr>
            </thead>
            <tbody>
              {[...history.points].reverse().map((p) => (
                <tr key={p.day} className="border-b border-sf-line-hairline last:border-b-0">
                  <td className="px-3 py-1.5 font-sans text-[14px] text-t2">{LONG.format(dayDate(p.day))}</td>
                  <td className="px-3 py-1.5 text-right font-mono text-[14px] text-t1">{p.words.toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="mt-4">
          <div className="flex gap-2">
            {/* y axis: ceiling, half, zero */}
            <div className="flex h-40 w-12 shrink-0 flex-col justify-between text-right font-mono text-[12px] text-t4" aria-hidden="true">
              <span className="-translate-y-1/2">{ceiling.toLocaleString()}</span>
              <span>{(ceiling / 2).toLocaleString()}</span>
              <span className="translate-y-1/2">0</span>
            </div>
            <div className="relative h-40 min-w-0 flex-1" onMouseLeave={() => setHover(null)}>
              <svg
                viewBox={`0 0 ${n * SLOT} ${H}`}
                preserveAspectRatio="none"
                className="absolute inset-0 h-full w-full"
                role="img"
                aria-label={`Bar chart of words written per day over the last ${range} days. ${history.total.toLocaleString()} words in total, most in one day ${history.max.toLocaleString()}. Use Show table for every value.`}
              >
                {[0, 0.5, 1].map((f) => (
                  <line
                    key={f}
                    x1={0}
                    x2={n * SLOT}
                    y1={H - f * H}
                    y2={H - f * H}
                    className={f === 0 ? "stroke-sf-line" : "stroke-sf-line-hairline"}
                    strokeWidth={1}
                    vectorEffect="non-scaling-stroke"
                  />
                ))}
                {history.points.map((p, i) => {
                  const h = (p.words / ceiling) * H;
                  return (
                    <g key={p.day}>
                      {/* hovered column: an elevated-plane band behind the bar */}
                      {hover === i && (
                        <rect x={i * SLOT} y={0} width={SLOT} height={H} className="fill-sf-surface-elevated" />
                      )}
                      {p.words > 0 && (
                        <rect
                          x={i * SLOT + (SLOT - BAR) / 2}
                          y={H - h}
                          width={BAR}
                          height={h}
                          className="fill-sf-primary"
                        />
                      )}
                      {/* hit target: the whole column, taller and wider than the bar */}
                      <rect
                        x={i * SLOT}
                        y={0}
                        width={SLOT}
                        height={H}
                        fill="transparent"
                        onMouseEnter={() => setHover(i)}
                      />
                    </g>
                  );
                })}
              </svg>
              {hovered && hover !== null && (
                <div
                  role="status"
                  className="pointer-events-none absolute top-0 z-10 -translate-x-1/2 whitespace-nowrap border border-sf-line bg-sf-surface-elevated px-2.5 py-1.5"
                  style={{ left: `${Math.min(92, Math.max(8, ((hover + 0.5) / n) * 100))}%` }}
                >
                  <div className="font-sans text-[12px] text-t3">{LONG.format(dayDate(hovered.day))}</div>
                  <div className="font-mono text-[14px] text-t1">
                    {hovered.words.toLocaleString()} <span className="text-[12px] text-t4">words</span>
                  </div>
                </div>
              )}
            </div>
          </div>
          <div className="ml-14 mt-1.5 flex justify-between font-mono text-[12px] text-t4" aria-hidden="true">
            <span>{n > 0 ? LABEL.format(dayDate(history.points[0].day)) : ""}</span>
            <span>Today</span>
          </div>
          {!isLoading && history.total === 0 && (
            <p className="mt-3 font-serif text-[14px] italic text-t3">
              No words recorded in the last {range} days. The ledger fills as you write in the Studio.
            </p>
          )}
        </div>
      )}
    </figure>
  );
}
