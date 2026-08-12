/**
 * /studio — the writer's home (Cowork Implementation Guide §3).
 * Reference: design/Home (Writers).html
 * Register: WRITER — Lora italic voice, sentence case, no // prefixes,
 * no ALL-CAPS mono labels. Glowing status dots stay. One telemetry
 * strip, in the footer only.
 * Data maps onto the live schema (see useStudioData). Modules that
 * need the Phase-4 editor schema (world prompt, beats) arrive with it.
 */
import { useEffect } from "react";
import { Link, Navigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import Header from "@/components/layout/Header";
import {
  useStudioData,
  lastSentence,
  type StudioWorld,
} from "@/hooks/useStudioData";

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
  "linear-gradient(160deg, hsl(var(--sf-teal) / 0.35), hsl(var(--sf-void)))",
  "linear-gradient(160deg, hsl(var(--sf-stellar) / 0.35), hsl(var(--sf-void)))",
  "linear-gradient(160deg, hsl(var(--sf-violet) / 0.3), hsl(var(--sf-void)))",
  "linear-gradient(160deg, hsl(var(--sf-amber) / 0.25), hsl(var(--sf-void)))",
  "linear-gradient(160deg, hsl(var(--sf-azure) / 0.3), hsl(var(--sf-void)))",
];

// ── modules ─────────────────────────────────────────────────────────

function Rail({ worlds }: { worlds: StudioWorld[] }): JSX.Element {
  return (
    <aside className="sf-sb sf-sb--slim hidden w-[230px] shrink-0 overflow-y-auto border-r border-sf-border py-6 pl-6 pr-4 lg:block">
      <div className="mb-2 font-serif text-[13px] italic text-t4">Projects</div>
      <nav className="mb-7 space-y-0.5">
        {worlds.slice(0, 6).map((w) => (
          <Link
            key={w.id}
            to={`/worlds/${w.id}`}
            className="block border-l-2 border-transparent py-1.5 pl-3 text-[13px] text-t2 transition-colors hover:border-sf-teal/40 hover:text-t1"
          >
            {w.name}
          </Link>
        ))}
        {worlds.length === 0 && (
          <div className="py-1.5 pl-3 font-serif text-[13px] italic text-t4">
            No worlds yet. Start one below.
          </div>
        )}
      </nav>
      {worlds[0] && (
        <>
          <div className="mb-2 font-serif text-[13px] italic text-t4">Workbench · {worlds[0].name}</div>
          <nav className="mb-7 space-y-0.5">
            {[
              // World-scoped: bare /write opens the globally most-recent doc,
              // which under a "Workbench · <world>" heading could open a
              // different world's manuscript.
              { label: "Write", to: `/worlds/${worlds[0].id}/write` },
              { label: "Wiki", to: `/worlds/${worlds[0].id}/wiki` },
              { label: "Graph", to: `/worlds/${worlds[0].id}/graph` },
              { label: "Chronicle", to: `/worlds/${worlds[0].id}/chronicle` },
              { label: "Connections", to: `/worlds/${worlds[0].id}/connections` },
            ].map((i) => (
              <Link
                key={i.label}
                to={i.to}
                className="block border-l-2 border-transparent py-1.5 pl-3 text-[13px] text-t2 transition-colors hover:border-sf-teal/40 hover:text-t1"
              >
                {i.label}
              </Link>
            ))}
          </nav>
        </>
      )}
      <div className="mb-2 font-serif text-[13px] italic text-t4">Tools</div>
      <nav className="space-y-0.5">
        {[
          { label: "All tools", to: "/" },
          { label: "Chain reaction", to: "/tools/environmental-chain-reaction" },
          { label: "Prompts", to: "/prompts" },
        ].map((i) => (
          <Link
            key={i.label}
            to={i.to}
            className="block border-l-2 border-transparent py-1.5 pl-3 text-[13px] text-t2 transition-colors hover:border-sf-teal/40 hover:text-t1"
          >
            {i.label}
          </Link>
        ))}
      </nav>
    </aside>
  );
}

// ── page ────────────────────────────────────────────────────────────

export default function Studio(): JSX.Element {
  const { user, loading } = useAuth();
  const { data } = useStudioData();

  useEffect(() => {
    const prev = document.title;
    document.title = "Studio: StellarForge";
    return () => {
      document.title = prev;
    };
  }, []);

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
      <div className="mx-auto flex max-w-[1280px] pt-16">
        <Rail worlds={data?.worlds ?? []} />

        <main className="min-w-0 flex-1 px-6 py-10 md:px-10">
          {/* greeting */}
          <div className="flex flex-wrap items-baseline justify-between gap-x-8 gap-y-2">
            <div>
              <h1 className="font-serif text-[34px] italic leading-tight text-t1 md:text-[44px]">
                {greeting()}, {firstName}.
              </h1>
              <p className="mt-2 font-serif text-[15px] italic text-t3">
                {entry
                  ? `You last touched “${entry.title || "an untitled piece"}” ${timeAgo(entry.updated_at)}.`
                  : "A blank page is just a world that hasn't introduced itself yet."}
              </p>
            </div>
            {data && data.streakDays > 0 && (
              <div className="font-serif text-[14px] italic text-t3">
                Day {data.streakDays}
                {data.streakDays > 2 ? ` · ${data.streakDays} sessions in a row` : ""}
              </div>
            )}
          </div>

          {/* streak strip */}
          <div className="mt-8 flex flex-wrap items-end justify-between gap-6 border-y border-sf-border py-5">
            <div>
              <div className="mb-1.5 font-serif text-[13px] italic text-t4">The last fourteen days</div>
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
                            ? "hsl(var(--sf-teal))"
                            : "linear-gradient(to top, hsl(var(--sf-teal) / 0.5), hsl(var(--sf-teal) / 0.15))"
                          : "hsl(var(--sf-surface-elevated))",
                        boxShadow: lit && isToday ? "0 0 10px hsl(var(--sf-teal-bright) / 0.35)" : undefined,
                      }}
                    />
                  );
                })}
              </div>
            </div>
            <div className="flex gap-5 sm:gap-10">
              {[
                { n: data?.wordsToday ?? 0, label: "words touched today" },
                { n: data?.totalWords ?? 0, label: "words in the archive" },
                { n: data?.entriesThisMonth ?? 0, label: "pieces this month" },
              ].map((s) => (
                <div key={s.label}>
                  <div className="font-serif text-[22px] text-t1 sm:text-[26px]">{s.n.toLocaleString()}</div>
                  <div className="font-serif text-[13px] italic text-t4">{s.label}</div>
                </div>
              ))}
            </div>
          </div>

          {/* continue-writing card */}
          <section className="mt-10 border border-sf-border bg-sf-surface/90">
            <div className="p-7 md:p-8">
              {entry ? (
                <>
                  <div className="font-serif text-[13px] italic text-sf-teal">
                    {entryWorld ? entryWorld.name : "Free writing"}
                    <span className="mx-2 text-t5">·</span>
                    <span className="text-t4">{timeAgo(entry.updated_at)}</span>
                  </div>
                  <h3 className="mt-2 font-serif text-[24px] italic text-t1">
                    {entry.title || "Untitled"}
                  </h3>
                  {line && (
                    <blockquote className="mt-4 max-w-[640px] border-l-2 border-sf-teal pl-4 font-serif text-[16px] leading-[1.7] text-t2">
                      …{line}
                    </blockquote>
                  )}
                  <div className="mt-6 flex flex-wrap items-center gap-2.5">
                    <Link
                      to={`/write/${entry.id}`}
                      className="bg-sf-teal px-5 py-2.5 font-sans text-[13px] font-medium tracking-[0.04em] text-[hsl(var(--accent-on-accent))] transition-shadow hover:shadow-sf-glow-teal"
                    >
                      Continue writing
                    </Link>
                    {entry.world_id && (
                      <Link
                        to={`/worlds/${entry.world_id}`}
                        className="border border-sf-border-strong px-5 py-2.5 font-sans text-[13px] tracking-[0.04em] text-t2 transition-colors hover:border-sf-teal hover:text-t1"
                      >
                        Open the world
                      </Link>
                    )}
                    <span className="ml-1 font-serif text-[13px] italic text-t4">
                      {(entry.word_count ?? 0).toLocaleString()} words so far
                    </span>
                  </div>
                </>
              ) : (
                <>
                  <h3 className="font-serif text-[24px] italic text-t1">Begin the first page.</h3>
                  <p className="mt-2 max-w-[560px] font-serif text-[15px] italic leading-[1.7] text-t3">
                    Open a world and start writing. The studio remembers where you stopped,
                    keeps your streak going, and leaves your last sentence right here.
                  </p>
                  <div className="mt-6">
                    <Link
                      to="/worlds"
                      className="bg-sf-teal px-5 py-2.5 font-sans text-[13px] font-medium tracking-[0.04em] text-[hsl(var(--accent-on-accent))] transition-shadow hover:shadow-sf-glow-teal"
                    >
                      Choose a world
                    </Link>
                  </div>
                </>
              )}
            </div>
          </section>

          {/* bookshelf */}
          <section className="mt-12">
            <h2 className="mb-4 font-serif text-[20px] italic text-t1">Your shelf</h2>
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
              {(data?.worlds ?? []).slice(0, 4).map((w, i) => (
                <Link key={w.id} to={`/worlds/${w.id}`} className="group block">
                  <div
                    className="relative aspect-[3/4] overflow-hidden border border-sf-border transition-transform group-hover:-translate-y-0.5"
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
                    <div className="absolute inset-0 bg-gradient-to-t from-[hsl(var(--sf-void))]/85 via-[hsl(var(--sf-void))]/20 to-transparent" aria-hidden="true" />
                    <div className="absolute inset-2 border border-white/10" aria-hidden="true" />
                    <div className="relative flex h-full items-end p-3">
                      <span className="font-serif text-[15px] italic leading-snug text-t1 drop-shadow">{w.name}</span>
                    </div>
                  </div>
                  <div className="mt-2 font-serif text-[13px] italic text-t4">
                    touched {timeAgo(w.updated_at)}
                  </div>
                </Link>
              ))}
              <Link
                to="/worlds"
                className="flex aspect-[3/4] items-center justify-center border border-dashed border-sf-border-strong font-serif text-[14px] italic text-t3 transition-colors hover:border-sf-teal hover:text-t1"
              >
                + Begin a new project
              </Link>
            </div>
          </section>

          {/* cast + scratchpad */}
          <div className="mt-12 grid gap-10 lg:grid-cols-[1.2fr_1fr]">
            <section>
              <h2 className="mb-4 font-serif text-[20px] italic text-t1">The cast, lately</h2>
              {data && data.characters.length > 0 ? (
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                  {data.characters.map((c) => (
                    <Link
                      key={c.id}
                      to={`/worlds/${c.world_id}/graph`}
                      className="border border-sf-border bg-sf-surface/90 p-4 transition-colors hover:border-sf-teal/40"
                    >
                      <div
                        className="mb-3 flex h-10 w-10 items-center justify-center rounded-full font-serif text-[16px] italic text-t1"
                        style={{
                          background: `linear-gradient(140deg, ${c.color || "hsl(var(--sf-stellar))"}44, hsl(var(--sf-void)))`,
                          border: "1px solid hsl(var(--border-subtle))",
                        }}
                      >
                        {c.name.charAt(0)}
                      </div>
                      <div className="font-serif text-[15px] italic text-t1">{c.name}</div>
                      {c.summary && (
                        <div className="mt-1 line-clamp-2 text-[13px] leading-[1.5] text-t3">{c.summary}</div>
                      )}
                    </Link>
                  ))}
                </div>
              ) : (
                <p className="font-serif text-[14px] italic text-t4">
                  Characters you create in your worlds will gather here.
                </p>
              )}
            </section>

            <section>
              <h2 className="mb-4 font-serif text-[20px] italic text-t1">Scratchpad</h2>
              {data && data.notes.length > 0 ? (
                <div className="space-y-3">
                  {data.notes.map((n) => {
                    const w = data.worlds.find((x) => x.id === n.world_id);
                    return (
                      <Link
                        key={n.id}
                        to={`/worlds/${n.world_id}`}
                        className="block border border-sf-border bg-sf-surface/90 p-4 transition-colors hover:border-sf-teal/40"
                      >
                        <div className="flex items-center gap-2">
                          <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-sf-amber" aria-hidden="true" />
                          <span className="font-serif text-[14px] text-t1">{n.title}</span>
                        </div>
                        <p className="mt-1.5 line-clamp-2 font-serif text-[13px] leading-[1.6] text-t3">
                          {n.content}
                        </p>
                        {w && <div className="mt-2 font-serif text-[12px] italic text-t4">From {w.name}</div>}
                      </Link>
                    );
                  })}
                </div>
              ) : (
                <p className="font-serif text-[14px] italic text-t4">
                  Notes pinned in your worlds surface here.
                </p>
              )}
            </section>
          </div>

          {/* activity */}
          {data && data.recentEntries.length > 1 && (
            <section className="mt-12">
              <h2 className="mb-4 font-serif text-[20px] italic text-t1">The log</h2>
              <div className="divide-y divide-sf-border border-y border-sf-border">
                {data.recentEntries.map((e) => {
                  const w = data.worlds.find((x) => x.id === e.world_id);
                  return (
                    <div key={e.id} className="flex flex-wrap items-baseline gap-x-3 py-3">
                      <span className="w-24 shrink-0 font-serif text-[13px] italic text-t4">
                        {timeAgo(e.updated_at)}
                      </span>
                      <span className="text-[14px] text-t2">
                        touched <em className="font-serif italic text-t1">{e.title || "Untitled"}</em>
                        {w && <span className="text-t3"> in {w.name}</span>}
                      </span>
                      {(e.word_count ?? 0) > 0 && (
                        <span className="text-[13px] text-sf-teal">{(e.word_count ?? 0).toLocaleString()} words</span>
                      )}
                    </div>
                  );
                })}
              </div>
            </section>
          )}

          {/* footer — the ONLY ambient telemetry on the page */}
          <footer className="mt-16 flex flex-wrap items-center justify-between gap-3 border-t border-sf-border py-5">
            <div className="flex items-center gap-2.5">
              <span className="relative flex h-2 w-2">
                <span className="absolute h-full w-full animate-sf-pulse bg-sf-teal opacity-60" />
                <span className="relative h-2 w-2 bg-sf-teal" />
              </span>
              <span className="font-serif text-[13px] italic text-t3">Stellarforge Studio · online</span>
            </div>
            <div className="font-mono text-[12px] tracking-[1.5px] text-t5">
              JD {julianDay().toFixed(1)} · 39.87°N 104.97°W
            </div>
          </footer>
        </main>
      </div>
    </div>
  );
}
