/**
 * /studio — the writer's home (Cowork Implementation Guide §3).
 * Reference: design/Home (Writers).html
 * Register: 1.6 Quiet Instrument. DM Sans / Jura / mono chrome; Lora only
 * in the prose excerpt (last sentence, scratchpad note text).
 * Page chrome (H1 "Studio", greeting as the DM Sans lede, display h3
 * section headings) follows docs/stellarforge/15-PAGE-CHROME.md.
 * Glowing status dots stay. One telemetry strip, in the footer only.
 * Data maps onto the live schema (see useStudioData). Modules that
 * need the Phase-4 editor schema (world prompt, beats) arrive with it.
 */
import { Link, Navigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import Header from "@/components/layout/Header";
import {
  useStudioData,
  lastSentence,
  type StudioWorld,
} from "@/hooks/useStudioData";
import { useMetaTags } from "@/hooks/use-meta-tags";
import { manuscriptPath } from "@/lib/manuscript-path";
import { WordHistoryChart } from "@/components/writing/WordHistoryChart";
import { PageContainer, PageHeader } from "@/components/layout/page-chrome";

// Section headings (15-PAGE-CHROME §4): the section-header pattern, Jura
// eyebrow over a hairline. 1.6 "Quiet Instrument": Lora lives only in the
// prose excerpt; chrome, stats and titles are DM Sans / Jura / mono.
const sectionHeading =
  "mb-4 border-b border-sf-line-hairline pb-2 font-heading text-sf-eyebrow uppercase text-t4";
const railLabel = "mb-1 font-heading text-sf-eyebrow uppercase text-t4";
const railLink =
  "flex min-h-hit items-center border-l-2 border-transparent pl-3 font-sans text-[14px] text-t2 transition-colors duration-base hover:border-sf-primary hover:text-t1";
const primaryLink =
  "inline-flex min-h-hit items-center bg-sf-primary px-5 font-sans text-[14px] font-medium text-sf-on-primary transition-shadow duration-base hover:shadow-sf-glow-teal";
const ghostLink =
  "inline-flex min-h-hit items-center border border-sf-line px-5 font-sans text-[14px] text-t2 transition-colors duration-base hover:border-sf-line-emphasis hover:text-t1";

// ── small helpers ───────────────────────────────────────────────────

function greeting(): string {
  const h = new Date().getHours();
  if (h < 5) return "Working late";
  if (h < 12) return "Good morning";
  if (h < 18) return "Good afternoon";
  return "Good evening";
}

function timeAgo(iso: string): string {
  const mins = Math.max(1, Math.round((Date.now() - new Date(iso).getTime()) / 60000));
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.round(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.round(hrs / 24);
  return days === 1 ? "yesterday" : `${days} days ago`;
}

function julianDay(): number {
  return Math.round((Date.now() / 86_400_000 + 2440587.5) * 10) / 10;
}

const COVER_GRADIENTS = [
  "linear-gradient(160deg, hsl(var(--sf-primary-hsl) / 0.35), hsl(var(--sf-void-hsl)))",
  "linear-gradient(160deg, hsl(var(--sf-stellar-hsl) / 0.35), hsl(var(--sf-void-hsl)))",
  "linear-gradient(160deg, hsl(var(--sf-violet-hsl) / 0.3), hsl(var(--sf-void-hsl)))",
  "linear-gradient(160deg, hsl(var(--sf-amber-hsl) / 0.25), hsl(var(--sf-void-hsl)))",
  "linear-gradient(160deg, hsl(var(--sf-azure-hsl) / 0.3), hsl(var(--sf-void-hsl)))",
];

// ── modules ─────────────────────────────────────────────────────────

function Rail({ worlds }: { worlds: StudioWorld[] }): JSX.Element {
  return (
    <aside className="sf-sb sf-sb--slim hidden w-[200px] shrink-0 overflow-y-auto border-r border-sf-line-hairline pr-4 lg:block">
      <div className={railLabel}>Worlds</div>
      <nav className="mb-6">
        {worlds.slice(0, 6).map((w) => (
          <Link
            key={w.id}
            to={`/worlds/${w.id}`}
            className={railLink}
          >
            {w.name}
          </Link>
        ))}
        {worlds.length === 0 && (
          <div className="py-2 pl-3 font-sans text-[14px] text-t3">
            No worlds yet. Start one below.
          </div>
        )}
      </nav>
      {worlds[0] && (
        <>
          <div className={railLabel}>Workbench · {worlds[0].name}</div>
          <nav className="mb-6">
            {[
              // World-scoped: bare /write opens the globally most-recent doc,
              // which under a "Workbench · <world>" heading could open a
              // different world's manuscript.
              { label: "Manuscript", to: manuscriptPath(worlds[0].id) },
              { label: "Codex", to: `/worlds/${worlds[0].id}/codex` },
              { label: "Chronicle", to: `/worlds/${worlds[0].id}/chronicle` },
              { label: "Web", to: `/worlds/${worlds[0].id}/codex?view=web` },
            ].map((i) => (
              <Link
                key={i.label}
                to={i.to}
                className={railLink}
              >
                {i.label}
              </Link>
            ))}
          </nav>
        </>
      )}
      <div className={railLabel}>Tools</div>
      <nav>
        {[
          { label: "All tools", to: "/tools" },
          { label: "Chain reaction", to: "/tools/environmental-chain-reaction" },
          { label: "Writing prompts", to: "/prompts" },
        ].map((i) => (
          <Link
            key={i.label}
            to={i.to}
            className={railLink}
          >
            {i.label}
          </Link>
        ))}
      </nav>
    </aside>
  );
}

// ── page ────────────────────────────────────────────────────────────

/**
 * Varied past-tense verb for the activity log, so a column of entries doesn't
 * read "touched ... touched ... touched". Keyed off the entry id so it stays
 * put across re-renders instead of shuffling.
 *
 * Every verb here means what the data actually supports: updated_at moved, so
 * the writer edited it. Deliberately avoids "opened" or "viewed", which a
 * timestamp cannot tell us.
 */
const EDIT_VERBS = ["worked on", "wrote in", "revised", "added to", "edited"] as const;

function editVerb(id: string): string {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) | 0;
  return EDIT_VERBS[Math.abs(h) % EDIT_VERBS.length];
}

export default function Studio(): JSX.Element {
  const { user, loading } = useAuth();
  const { data } = useStudioData();

  useMetaTags({ title: "Studio" });

  if (!loading && !user) return <Navigate to="/auth" replace />;

  const firstName =
    (user?.user_metadata?.display_name as string | undefined)?.split(" ")[0] ??
    user?.email?.split("@")[0] ??
    "navigator";

  const entry = data?.latestEntry ?? null;
  const entryWorld = entry?.world_id ? data?.worlds.find((w) => w.id === entry.world_id) : undefined;
  const line = lastSentence(entry?.content);

  return (
    <div className="relative z-10 min-h-screen">
      <Header />
      <main id="main" tabIndex={-1}>
        <PageContainer variant="standalone">
          {/* Header spans rail + content so the H1 sits on the shared left edge.
              The greeting is the lede (DM Sans), not the title. */}
          <PageHeader
            size="page"
            title="Studio"
            lede={
              <>
                {greeting()}, {firstName}.{" "}
                {entry
                  ? `You were last writing in “${entry.title || "an untitled piece"}” ${timeAgo(entry.updated_at)}.`
                  : "A blank page is just a world that hasn't introduced itself yet."}
              </>
            }
            actions={
              data && data.streakDays > 0 ? (
                <span className="font-mono text-sf-mono uppercase text-t3">
                  Day {data.streakDays}
                  {data.streakDays > 2 ? ` · ${data.streakDays} sessions in a row` : ""}
                </span>
              ) : undefined
            }
          />

          <div className="flex gap-10">
        <Rail worlds={data?.worlds ?? []} />

        <div className="min-w-0 flex-1">
          {/* streak strip */}
          <div className="flex flex-wrap items-end justify-between gap-6 border-y border-sf-line-hairline py-5">
            <div>
              <div className="mb-1.5 font-heading text-sf-eyebrow uppercase text-t4">Last 14 days</div>
              <div className="flex h-8 items-end gap-1">
                {(data?.activityCells ?? Array(14).fill(false)).map((lit, i) => {
                  const isToday = i === 13;
                  return (
                    <span
                      key={i}
                      className="w-2.5"
                      style={{
                        height: lit ? (isToday ? "100%" : "70%") : "22%",
                        background: lit
                          ? isToday
                            ? "hsl(var(--sf-primary-hsl))"
                            : "linear-gradient(to top, hsl(var(--sf-primary-hsl) / 0.5), hsl(var(--sf-primary-hsl) / 0.15))"
                          : "hsl(var(--sf-surface-elevated-hsl))",
                        boxShadow: lit && isToday ? "0 0 10px hsl(var(--sf-primary-bright-hsl) / 0.35)" : undefined,
                      }}
                    />
                  );
                })}
              </div>
            </div>
            <div className="flex gap-5 sm:gap-10">
              {[
                { n: data?.wordsToday ?? 0, label: "Words today" },
                { n: data?.totalWords ?? 0, label: "Words written" },
                { n: data?.entriesThisMonth ?? 0, label: "Pieces this month" },
              ].map((s) => (
                <div key={s.label}>
                  <div className="font-mono text-[22px] text-t1 sm:text-[26px]">{s.n.toLocaleString()}</div>
                  <div className="font-heading text-sf-eyebrow uppercase text-t4">{s.label}</div>
                </div>
              ))}
            </div>
          </div>

          {/* word-count history (writing_sessions ledger) */}
          <WordHistoryChart />

          {/* continue-writing card */}
          <section className="mt-10 border border-sf-line bg-sf-surface/90">
            <div className="p-7 md:p-8">
              {entry ? (
                <>
                  <div className="font-heading text-sf-eyebrow uppercase text-sf-primary-text">
                    {entryWorld ? entryWorld.name : "Free writing"}
                    <span className="mx-2 text-t4">·</span>
                    <span className="font-mono normal-case tracking-normal text-t4">{timeAgo(entry.updated_at)}</span>
                  </div>
                  <h3 className="mt-2 font-sans text-[22px] font-medium text-t1">
                    {entry.title || "Untitled"}
                  </h3>
                  {line && (
                    // The one Lora on the page: the writer's own prose.
                    <blockquote className="mt-4 max-w-[640px] border-l-2 border-sf-primary pl-4 font-serif text-[16px] italic leading-[1.7] text-t2">
                      …{line}
                    </blockquote>
                  )}
                  <div className="mt-6 flex flex-wrap items-center gap-2.5">
                    <Link
                      to={entry.world_id ? manuscriptPath(entry.world_id, entry.id) : `/write/${entry.id}`}
                      className={primaryLink}
                    >
                      Continue writing
                    </Link>
                    {entry.world_id && (
                      <Link
                        to={`/worlds/${entry.world_id}`}
                        className={ghostLink}
                      >
                        Open the world
                      </Link>
                    )}
                    <span className="ml-1 font-mono text-sf-mono uppercase text-t4">
                      {(entry.word_count ?? 0).toLocaleString()} words
                    </span>
                  </div>
                </>
              ) : (
                <>
                  <h3 className="font-sans text-[22px] font-medium text-t1">Begin the first page.</h3>
                  <p className="mt-2 max-w-[560px] font-sans text-[16px] leading-[1.6] text-t2">
                    Open a world and start writing. The studio remembers where you stopped,
                    keeps your streak going, and leaves your last sentence right here.
                  </p>
                  <div className="mt-6 flex flex-wrap items-center gap-2.5">
                    <Link
                      to="/worlds"
                      className={primaryLink}
                    >
                      Choose a world
                    </Link>
                    {data?.worlds[0] && (
                      <Link
                        to={`/worlds/${data.worlds[0].id}/write?import=1`}
                        className={ghostLink}
                      >
                        Bring a manuscript into {data.worlds[0].name}
                      </Link>
                    )}
                  </div>
                </>
              )}
            </div>
          </section>

          {/* bookshelf */}
          <section className="mt-12">
            <h2 className={sectionHeading}>Your shelf</h2>
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
              {(data?.worlds ?? []).slice(0, 4).map((w, i) => (
                <Link key={w.id} to={`/worlds/${w.id}`} className="group block">
                  <div
                    className="relative aspect-[3/4] overflow-hidden border border-sf-line transition-transform group-hover:-translate-y-0.5"
                    style={w.header_image_url ? undefined : { background: COVER_GRADIENTS[i % COVER_GRADIENTS.length] }}
                  >
                    {/* the world's chosen header image as the cover, if set */}
                    {w.header_image_url && (
                      <img
                        src={w.header_image_url}
                        alt=""
                        loading="lazy"
                        className="absolute inset-0 h-full w-full object-cover"
                        style={{ objectPosition: `50% ${w.header_image_focus_y ?? 50}%` }}
                      />
                    )}
                    {/* readability gradient so the title reads over any image */}
                    <div className="absolute inset-0 bg-gradient-to-t from-[hsl(var(--sf-void-hsl))]/85 via-[hsl(var(--sf-void-hsl))]/20 to-transparent" aria-hidden="true" />
                    <div className="absolute inset-2 border border-sf-line-hairline" aria-hidden="true" />
                    <div className="relative flex h-full items-end p-3">
                      <span className="font-sans text-[15px] font-medium leading-snug text-t1 drop-shadow">{w.name}</span>
                    </div>
                  </div>
                  <div className="mt-2 font-mono text-[12px] text-t4">
                    {timeAgo(w.updated_at)}
                  </div>
                </Link>
              ))}
              <Link
                to="/worlds"
                className="flex aspect-[3/4] items-center justify-center border border-dashed border-sf-line-emphasis font-sans text-[14px] text-t3 transition-colors duration-base hover:border-sf-primary hover:text-t1"
              >
                + New world
              </Link>
            </div>
          </section>

          {/* cast + scratchpad */}
          <div className="mt-12 grid gap-10 lg:grid-cols-[1.2fr_1fr]">
            <section>
              <h2 className={sectionHeading}>The cast, lately</h2>
              {data && data.characters.length > 0 ? (
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                  {data.characters.map((c) => (
                    <Link
                      key={c.id}
                      to={`/worlds/${c.world_id}/codex/${c.id}`}
                      className="border border-sf-line bg-sf-surface/90 p-4 transition-colors hover:border-sf-primary"
                    >
                      <div
                        className="mb-3 flex h-10 w-10 items-center justify-center border border-sf-line font-sans text-[16px] font-medium text-t1"
                        style={{
                          background: `linear-gradient(140deg, ${c.color || "hsl(var(--sf-stellar-hsl))"}44, hsl(var(--sf-void-hsl)))`,
                        }}
                      >
                        {c.name.charAt(0)}
                      </div>
                      <div className="font-sans text-[15px] font-medium text-t1">{c.name}</div>
                      {c.summary && (
                        <div className="mt-1 line-clamp-2 text-[14px] leading-[1.5] text-t2">{c.summary}</div>
                      )}
                    </Link>
                  ))}
                </div>
              ) : (
                <p className="font-sans text-[14px] text-t3">
                  Characters you create in your worlds will gather here.
                </p>
              )}
            </section>

            <section>
              <h2 className={sectionHeading}>Scratchpad</h2>
              {data && data.notes.length > 0 ? (
                <div className="space-y-3">
                  {data.notes.map((n) => {
                    const w = data.worlds.find((x) => x.id === n.world_id);
                    return (
                      <Link
                        key={n.id}
                        to={`/worlds/${n.world_id}`}
                        className="block border border-sf-line bg-sf-surface/90 p-4 transition-colors hover:border-sf-primary"
                      >
                        <div className="flex items-center gap-2">
                          <span className="h-1.5 w-1.5 shrink-0 bg-sf-amber" aria-hidden="true" />
                          <span className="font-sans text-[14px] font-medium text-t1">{n.title}</span>
                        </div>
                        <p className="mt-1.5 line-clamp-2 font-serif text-[14px] italic leading-[1.6] text-t2">
                          {n.content}
                        </p>
                        {w && <div className="mt-2 font-sans text-[12px] text-t4">From {w.name}</div>}
                      </Link>
                    );
                  })}
                </div>
              ) : (
                <p className="font-sans text-[14px] text-t3">
                  Notes pinned in your worlds surface here.
                </p>
              )}
            </section>
          </div>

          {/* activity */}
          {data && data.recentEntries.length > 1 && (
            <section className="mt-12">
              <h2 className={sectionHeading}>The log</h2>
              <div className="divide-y divide-sf-line-hairline border-y border-sf-line-hairline">
                {data.recentEntries.map((e) => {
                  const w = data.worlds.find((x) => x.id === e.world_id);
                  return (
                    <div key={e.id} className="flex flex-wrap items-baseline gap-x-3 py-3">
                      <span className="w-24 shrink-0 font-mono text-[12px] text-t4">
                        {timeAgo(e.updated_at)}
                      </span>
                      <span className="text-[14px] text-t2">
                        {editVerb(e.id)} <span className="font-medium text-t1">{e.title || "Untitled"}</span>
                        {w && <span className="text-t3"> in {w.name}</span>}
                      </span>
                      {(e.word_count ?? 0) > 0 && (
                        <span className="font-mono text-[12px] text-sf-primary-text">{(e.word_count ?? 0).toLocaleString()} words</span>
                      )}
                    </div>
                  );
                })}
              </div>
            </section>
          )}

          {/* footer — the ONLY ambient telemetry on the page */}
          <footer className="mt-16 flex flex-wrap items-center justify-between gap-3 border-t border-sf-line-hairline py-5">
            <div className="flex items-center gap-2.5">
              <span className="relative flex h-2 w-2">
                <span className="absolute h-full w-full animate-sf-pulse bg-sf-primary opacity-60" />
                <span className="relative h-2 w-2 bg-sf-primary" />
              </span>
              <span className="font-sans text-[13px] text-t3">Stellarforge Studio · online</span>
            </div>
            <div className="font-mono text-[12px] tracking-wide text-t4">
              JD {julianDay().toFixed(1)} · 39.87°N 104.97°W
            </div>
          </footer>
        </div>
          </div>
        </PageContainer>
      </main>
    </div>
  );
}
