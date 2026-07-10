// Section — Content Calendar: day-by-day launch-week grid + evergreen rhythm

function CalendarSection() {
  const days = [
    { d: 'TUE · AUG 04', phase: 'IGNITE', tag: 'T-7', color: '#FFB800',
      items: [
        { ch: 'EMAIL', c: '#FFB800', t: 'Waitlist #4 — "Seven days out. Here\'s what we built."' },
        { ch: 'X/BLSKY', c: '#4D9FFF', t: 'Countdown frame #1 · Instrument reveal: CASCADE' },
        { ch: 'IG', c: '#FF00AA', t: '6-up carousel: "A tour of the instrument panel"' },
        { ch: 'PRESS', c: '#9B5DE5', t: 'Embargoed briefs out: The Verge · Ars · Tor.com · Locus' },
      ]
    },
    { d: 'WED · AUG 05', phase: 'IGNITE', tag: 'T-6', color: '#FFB800',
      items: [
        { ch: 'TIKTOK', c: '#FF3366', t: '45s: "One slider, four civilizations" (Cascade demo)' },
        { ch: 'REDDIT', c: '#FFB347', t: 'r/worldbuilding — Jason answers "How to ground alien biology" (no product pitch)' },
        { ch: 'YOUTUBE', c: '#FF3366', t: 'Shorts #1 — ExoSky: "What the sky looks like from TRAPPIST-1e"' },
        { ch: 'SUBSTACK', c: '#00FF88', t: '"Cascade Friday" #1 — Why worldbuilding compounds (evergreen)' },
      ]
    },
    { d: 'THU · AUG 06', phase: 'IGNITE', tag: 'T-5', color: '#FFB800',
      items: [
        { ch: 'DISCORD', c: '#9B5DE5', t: 'Seed: Drop in 8 SF/worldbuilding servers with instrument-reveal GIF' },
        { ch: 'IG STORY', c: '#FF00AA', t: 'Behind-the-scenes: Jason at the launch desk' },
        { ch: 'CREATORS', c: '#9B5DE5', t: '25 early-access codes out to seeded SF authors + BookTok' },
      ]
    },
    { d: 'FRI · AUG 07', phase: 'IGNITE', tag: 'T-4', color: '#FFB800',
      items: [
        { ch: 'REST', c: '#C8C8C8', t: 'Light posting day. Schedule queue. Monitor press reaches.' },
        { ch: 'X/BLSKY', c: '#4D9FFF', t: 'Quote post from Blindsight + "/why we built PHYLO"' },
      ]
    },
    { d: 'SAT · AUG 08', phase: 'IGNITE', tag: 'T-3', color: '#FFB800',
      items: [
        { ch: 'EMAIL', c: '#FFB800', t: 'Waitlist #5 — "Three days. Here\'s your early-access code."' },
        { ch: 'LINKEDIN', c: '#4D9FFF', t: 'Jason long-form: "What building 25 tools taught me about blank-page syndrome"' },
        { ch: 'ADS', c: '#FF3366', t: 'Paid flight goes live: Meta + Reddit + Google. $150/day hold pattern.' },
        { ch: 'YT', c: '#FF3366', t: 'Long-form teaser drops — 4 min — "The Ship, the Tools, the Launch"' },
      ]
    },
    { d: 'SUN · AUG 09', phase: 'IGNITE', tag: 'T-2', color: '#FFB800',
      items: [
        { ch: 'PH', c: '#15C17B', t: 'Product Hunt listing goes live for upvote-pre-scheduling' },
        { ch: 'IG REEL', c: '#FF00AA', t: '"25 instruments in 60 seconds" — pacey mega-montage' },
        { ch: 'TIKTOK', c: '#FF3366', t: 'Jason POV: "What it feels like to finish a world at 2am"' },
      ]
    },
    { d: 'MON · AUG 10', phase: 'IGNITE', tag: 'T-1', color: '#FFB800',
      items: [
        { ch: 'EMAIL', c: '#FFB800', t: 'Waitlist #6 — "24 hours. You\'re cleared to board."' },
        { ch: 'X', c: '#4D9FFF', t: 'Thread: "Tomorrow we go live on Product Hunt at 12:01 PT. Here\'s how to help."' },
        { ch: 'DISCORD', c: '#9B5DE5', t: 'Launch war-room opens. Mod shift assignments.' },
      ]
    },
    { d: 'TUE · AUG 11', phase: 'IGNITION', tag: 'LAUNCH', color: '#15C17B',
      items: [
        { ch: 'PH', c: '#15C17B', t: '12:01 PT — Product Hunt launch · Maker comment live · Upvote push' },
        { ch: 'HN', c: '#FF3366', t: '6:00 PT — Hacker News "Show HN: StellarForge — instrument panel for SF writers"' },
        { ch: 'EMAIL', c: '#FFB800', t: 'Launch day blast · full list · 12:01 PT' },
        { ch: 'ALL SOCIAL', c: '#3DFFCD', t: 'Synchronous post across X/Bluesky/IG/LI/TikTok at 12:01 · 9am · 1pm · 6pm' },
        { ch: 'YT', c: '#FF3366', t: '20-min full walkthrough goes public · pinned' },
        { ch: 'REDDIT AMA', c: '#FFB347', t: 'r/worldbuilding AMA 1–4pm PT (mod pre-approved)' },
        { ch: 'ADS', c: '#FF3366', t: 'Spend scaled 3x · launch creative rotates in' },
      ]
    },
    { d: 'WED · AUG 12', phase: 'IGNITION', tag: 'D+1', color: '#15C17B',
      items: [
        { ch: 'EMAIL', c: '#FFB800', t: 'Thank-you + "here\'s how to build your first world in 20 min"' },
        { ch: 'PRESS', c: '#9B5DE5', t: 'Round 2 press follow-up · morning embargo broadcasters' },
        { ch: 'SUBSTACK', c: '#00FF88', t: '"Cascade Friday" #2 — launch recap + first 24h numbers shared publicly' },
        { ch: 'TIKTOK', c: '#FF3366', t: 'Stitch + duet prompt: "Show me the first world you built"' },
      ]
    },
    { d: 'THU/FRI · AUG 13–14', phase: 'IGNITION', tag: 'D+2/3', color: '#15C17B',
      items: [
        { ch: 'UGC', c: '#00FF88', t: 'Repost best first-world showcases across IG/X · tag creators' },
        { ch: 'DISCORD', c: '#9B5DE5', t: 'Live "build a world with me" session · Jason · 2 hours' },
        { ch: 'IG GRID', c: '#FF00AA', t: 'Featured World #1 — community member showcase carousel' },
      ]
    },
    { d: 'MON · AUG 17 →', phase: 'ORBIT', tag: 'EVERGREEN', color: '#9B5DE5',
      items: [
        { ch: 'CASCADE FRI', c: '#00FF88', t: 'Weekly Substack + X thread — one tool, one writer story, one craft takeaway' },
        { ch: 'WORLD MON', c: '#4D9FFF', t: '"World Monday" — featured community world, cross-posted IG + Reddit' },
        { ch: 'DEEP-DIVE', c: '#FFB800', t: 'Monthly: YouTube long-form tool deep-dive · 20 min each' },
        { ch: 'AMA QTR', c: '#FF3366', t: 'Quarterly: Jason AMA + new tool reveal' },
      ]
    },
  ];

  return (
    <section>
      <SectionHeader
        code="// SECTOR 03 · CONTENT CALENDAR"
        title="Launch week, minute by minute"
        subtitle="Eleven days from the first public teaser through the evergreen engine. Channels stack so the loudest day (August 11) coincides with Product Hunt, Hacker News, the AMA, and paid acceleration all inside a 12-hour window."
        accent="#FFB800"
      />

      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {days.map((day, i) => (
          <div key={i} className="sf-panel" style={{
            padding: 18,
            borderLeft: `3px solid ${day.color}`,
            position: 'relative'
          }}>
            <div style={{ display: 'grid', gridTemplateColumns: '220px 1fr', gap: 24, alignItems: 'start' }}>
              <div>
                <div className="sf-mono" style={{ fontSize: 13, color: 'var(--t1)', letterSpacing: '2px', marginBottom: 6 }}>{day.d}</div>
                <StatusPill label={day.phase} color={day.color} dot={false} />
                <div className="sf-mono" style={{ fontSize: 22, color: day.color, letterSpacing: '0.06em', marginTop: 10 }}>{day.tag}</div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {day.items.map((it, j) => (
                  <div key={j} style={{
                    display: 'grid',
                    gridTemplateColumns: '110px 1fr',
                    gap: 14,
                    padding: '8px 0',
                    borderTop: j ? '1px dashed rgba(255,255,255,0.06)' : 'none'
                  }}>
                    <span className="sf-mono" style={{ fontSize: 10, color: it.c, letterSpacing: '1.5px' }}>{it.ch}</span>
                    <span style={{ fontSize: 12.5, color: 'var(--t2)', lineHeight: 1.5 }}>{it.t}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

Object.assign(window, { CalendarSection });
