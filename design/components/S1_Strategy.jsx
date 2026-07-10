// Section 01 — Strategy overview + three creative directions
const { useState: useStateS1 } = React;

function StrategySection() {
  return (
    <section>
      <SectionHeader
        code="// SECTOR 01 · CAMPAIGN BRIEF"
        title="All systems online, August 11"
        subtitle="StellarForge exits beta into public Early Access on August 11, 2026. This document is the full campaign manifest — narrative, phases, tactics, assets, and the instrument panel for the month-long launch and the evergreen engine that follows."
        accent="#15C17B"
      />

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14, marginBottom: 32 }}>
        <StatCard label="LAUNCH WINDOW" value="AUG 11" sub="T-MINUS 33 DAYS" accent="#15C17B" />
        <StatCard label="RUNWAY" value="8 WEEKS" sub="JUL 13 → SEP 06" accent="#4D9FFF" />
        <StatCard label="CHANNELS" value="13" sub="SOCIAL · OWNED · PAID" accent="#FFB800" />
        <StatCard label="ARTIFACTS" value="80+" sub="POSTS · ADS · EMAILS · PRESS" accent="#9B5DE5" />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: 24 }}>
        <div className="sf-panel sf-panel--glow" style={{ padding: 28 }}>
          <div className="sf-label" style={{ marginBottom: 12 }}>// MISSION</div>
          <p style={{ fontFamily: 'var(--font-display)', fontWeight: 300, fontSize: 26, lineHeight: 1.25, color: 'var(--t1)', margin: 0, letterSpacing: '0.03em' }}>
            Give science fiction writers an instrument panel for the universes in their heads — and make <span style={{ color: '#3DFFCD' }}>opening StellarForge</span> feel like boarding a ship.
          </p>
          <div style={{ marginTop: 22, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <Readout label="PRIMARY KPI" value="15,000 SIGNUPS BY SEP 30" accent="#3DFFCD" />
            <Readout label="SECONDARY" value="1,500 PRO CONVERSIONS" accent="#FFB800" />
            <Readout label="REACH TARGET" value="8M IMPRESSIONS" accent="#4D9FFF" />
            <Readout label="PRESS" value="12 PLACEMENTS" accent="#9B5DE5" />
          </div>
        </div>

        <div className="sf-panel" style={{ padding: 28 }}>
          <div className="sf-label" style={{ marginBottom: 14 }}>// AUDIENCE PRIORITY</div>
          {[
            ['A', 'Beginner SF writers (blank-page)', '#15C17B', '45%'],
            ['B', 'Worldbuilding hobbyists · TTRPG GMs', '#4D9FFF', '20%'],
            ['C', 'Indie SF authors · MFA community', '#9B5DE5', '15%'],
            ['D', 'Hard SF + astronomy enthusiasts', '#FFB800', '12%'],
            ['E', 'Press · writing coaches', '#FF3366', '8%'],
          ].map(([k, label, col, w], i) => (
            <div key={i} style={{ display: 'grid', gridTemplateColumns: '24px 1fr auto', alignItems: 'center', gap: 12, padding: '10px 0', borderBottom: i < 4 ? '1px solid var(--sf-border)' : 'none' }}>
              <span className="sf-mono" style={{ color: col, fontSize: 11 }}>{k}</span>
              <span style={{ fontSize: 13, color: 'var(--t2)' }}>{label}</span>
              <span className="sf-mono" style={{ color: col, fontSize: 11 }}>{w}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Campaign phases */}
      <div style={{ marginTop: 40 }}>
        <div className="sf-label" style={{ marginBottom: 14 }}>// CAMPAIGN PHASES</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14 }}>
          {[
            { n: '01', name: 'SIGNAL', dates: 'JUL 13 → AUG 03', color: '#5B8DEF',
              desc: 'Warm the signal. Teaser posts, countdown frames, "instrument reveal" micro-videos. Cultivate waitlist via landing page.',
              tactics: ['Instrument-reveal carousel (1/week)', 'Countdown IG stories', 'Reddit worldbuilding answers in public', 'Author voice on Bluesky + X']},
            { n: '02', name: 'IGNITE', dates: 'AUG 04 → AUG 10', color: '#FFB800',
              desc: 'Approach. Daily posts, creator seeding, press embargo, Product Hunt scheduled. Email list warms up.',
              tactics: ['Press embargo out T-7', 'Creator seeding: 25 SF authors', 'Waitlist hits 5K goal', 'Ad flight launches (lookalike)']},
            { n: '03', name: 'IGNITION', dates: 'AUG 11 → AUG 18', color: '#15C17B',
              desc: 'Launch week. Product Hunt + Hacker News + full ad load. Author AMA. Live cascade demo. Newsletter swap partners fire.',
              tactics: ['PH launch 12:01 PT', 'r/worldbuilding AMA w/ Jason', 'Launch-day YT walkthrough (20min)', 'Paid flight scales 3x']},
            { n: '04', name: 'ORBIT', dates: 'AUG 19 → ONGOING', color: '#9B5DE5',
              desc: 'Evergreen engine. Cascade Fridays, community worlds, tool deep-dives, UGC amplification. This is the long game.',
              tactics: ['"Cascade Friday" weekly series', 'Featured Worlds showcase', 'Monthly craft livestream', 'Affiliate + referral loop']},
          ].map(p => (
            <div key={p.n} className="sf-panel" style={{ padding: 20, position: 'relative', overflow: 'hidden' }}>
              <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: p.color, opacity: 0.6 }} />
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, marginBottom: 8 }}>
                <span className="sf-mono" style={{ color: p.color, fontSize: 24, letterSpacing: '0.04em' }}>{p.n}</span>
                <span className="sf-mono" style={{ color: 'var(--t1)', fontSize: 14, letterSpacing: '2px' }}>{p.name}</span>
              </div>
              <div className="sf-mono" style={{ fontSize: 10, color: 'var(--t4)', letterSpacing: '1.5px', marginBottom: 10 }}>{p.dates}</div>
              <p style={{ fontSize: 12.5, color: 'var(--t2)', margin: '0 0 12px', lineHeight: 1.5 }}>{p.desc}</p>
              <ul style={{ margin: 0, padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 6 }}>
                {p.tactics.map((t, i) => (
                  <li key={i} style={{ fontSize: 11.5, color: 'var(--t3)', display: 'flex', gap: 8 }}>
                    <span style={{ color: p.color, fontFamily: 'var(--font-mono)' }}>›</span>{t}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ---------- THREE CREATIVE DIRECTIONS ----------

function DirectionsSection() {
  const [pick, setPick] = useStateS1(0);
  const directions = [
    {
      name: 'ALL SYSTEMS ONLINE',
      sub: 'Mission-briefing maximalism',
      color: '#15C17B',
      accent2: '#3DFFCD',
      hook: 'The ship is online. Boarding commences August 11.',
      desc: 'Lean hard into Ship\'s Voice. Every post is a transmission. Every carousel is a mission briefing. ALL CAPS headlines, telemetry readouts, cinematic black.',
      forChannels: 'IG · X · LinkedIn · Product Hunt',
      strengths: ['Distinctive — no one in writing-software looks like this', 'Merch-ready (mission patches, sticker packs)', 'Strong for reels/TikTok w/ voiceover'],
      risks: ['Can feel cold to warm audiences', 'Reddit readers may push back on marketing-speak'],
      sample: (
        <div style={{ background: '#000', border: '1px solid #15C17B40', padding: 20, fontFamily: 'var(--font-mono)', fontSize: 11, letterSpacing: '1.5px', color: '#C8C8C8', lineHeight: 1.8 }}>
          <div style={{ color: '#15C17B' }}>// TRANSMISSION 001</div>
          <div style={{ margin: '10px 0', color: '#FAFAFA', fontSize: 18, letterSpacing: '3px' }}>SYSTEMS: BOARDING</div>
          <div>STATUS ........ ONLINE</div>
          <div>VESSEL ........ STELLARFORGE</div>
          <div>INSTRUMENTS ... 25 / 25</div>
          <div>DEPARTURE ..... 2026.08.11 · 12:01 PT</div>
          <div style={{ marginTop: 14, color: '#3DFFCD' }}>[ REQUEST CLEARANCE → ]</div>
        </div>
      ),
    },
    {
      name: 'THESE WORLDS EXIST IN YOU',
      sub: 'Poetic · literary · emotional',
      color: '#5B8DEF',
      accent2: '#9B5DE5',
      hook: 'These worlds exist in you. Waiting to be found.',
      desc: 'Lean into the one poetic line. Imagery of negative space, single-line film-credits typography, writer testimonials. Ship\'s Voice appears as an accent, not the spine.',
      forChannels: 'Substack · IG · LinkedIn · Email · Press',
      strengths: ['Opens door to established SF authors & MFA communities', 'Press-friendly (quotable)', 'Elegant email + landing page'],
      risks: ['Less distinctive in feed', 'Can feel self-serious if over-played'],
      sample: (
        <div style={{ background: '#0A0E17', border: '1px solid #5B8DEF40', padding: '32px 24px', textAlign: 'center' }}>
          <div style={{ fontFamily: 'var(--font-display)', fontWeight: 300, fontSize: 22, lineHeight: 1.3, color: '#FAFAFA', letterSpacing: '0.06em' }}>
            These worlds<br /><span style={{ color: '#5B8DEF' }}>exist in you.</span>
          </div>
          <div style={{ marginTop: 12, fontFamily: 'var(--font-mono)', fontSize: 10, color: 'rgba(255,255,255,0.35)', letterSpacing: '2px' }}>WAITING TO BE FOUND · STELLARFORGE · 05.28</div>
        </div>
      ),
    },
    {
      name: 'CASCADE',
      sub: 'Science → story, in motion',
      color: '#FFB800',
      accent2: '#00FF88',
      hook: 'Change one number. Watch a civilization fall.',
      desc: 'Built around the Environmental Cascade mechanic. Videos + carousels that show a single slider nudge rippling through physics → biology → culture. Proof-as-marketing.',
      forChannels: 'TikTok · Reels · YouTube · Reddit · Twitter/X',
      strengths: ['Inherently viral (tool demo is the ad)', 'Perfect for short-form video', 'Converts lurkers — they see the product work'],
      risks: ['Heavier production lift', 'Needs tight demo choreography'],
      sample: (
        <div style={{ background: '#0A0E17', border: '1px solid #FFB80040', padding: 20 }}>
          <div className="sf-mono" style={{ fontSize: 10, color: '#FFB800', letterSpacing: '1.5px', marginBottom: 10 }}>// CASCADE · 4 STEPS</div>
          {[
            ['GRAVITY', '1.4g', '#FFB800'],
            ['ATMOSPHERE', 'thick, 2.1 atm', '#4D9FFF'],
            ['BIOLOGY', 'low-slung, 6 limbs', '#00FF88'],
            ['MYTHOLOGY', 'no word for "fall"', '#9B5DE5'],
          ].map(([k, v, c], i) => (
            <div key={i} style={{ display: 'grid', gridTemplateColumns: '100px 1fr', gap: 12, padding: '5px 0', borderTop: i ? '1px dashed rgba(255,255,255,0.1)' : 'none' }}>
              <span className="sf-mono" style={{ fontSize: 10, color: c, letterSpacing: '1.5px' }}>{k}</span>
              <span style={{ fontSize: 12, color: '#FAFAFA', fontFamily: 'var(--font-mono)' }}>{v}</span>
            </div>
          ))}
        </div>
      ),
    },
  ];

  return (
    <section>
      <SectionHeader
        code="// SECTOR 02 · CREATIVE DIRECTIONS"
        title="Three hooks to pressure-test"
        subtitle="Every other artifact downstream — social, ads, emails, landing page — flexes to whichever direction we choose. I recommend running all three as A/B/C variants in the first two weeks, then concentrating spend behind the winner."
        accent="#4D9FFF"
      />

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 18 }}>
        {directions.map((d, i) => (
          <div key={i} onClick={() => setPick(i)}
            className="sf-panel"
            style={{
              padding: 0, cursor: 'pointer', overflow: 'hidden',
              border: pick === i ? `1px solid ${d.color}` : '1px solid var(--sf-border)',
              boxShadow: pick === i ? `0 0 24px ${d.color}33` : 'none',
              transition: 'all 200ms ease'
            }}>
            <div style={{ padding: 18, borderBottom: '1px solid var(--sf-border)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                <span className="sf-mono" style={{ color: d.color, fontSize: 11, letterSpacing: '1.5px' }}>DIRECTION {String(i + 1).padStart(2, '0')}</span>
                <StatusPill label={pick === i ? 'ACTIVE' : 'STANDBY'} color={pick === i ? d.color : '#ffffff40'} dot={pick === i} />
              </div>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: 20, color: 'var(--t1)', letterSpacing: '0.04em', fontWeight: 300 }}>{d.name}</div>
              <div className="sf-mono" style={{ fontSize: 10, color: 'var(--t4)', letterSpacing: '1.5px', marginTop: 4 }}>{d.sub}</div>
            </div>
            <div style={{ padding: 18, paddingBottom: 0 }}>{d.sample}</div>
            <div style={{ padding: 18 }}>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: 14, color: d.accent2, lineHeight: 1.3, marginBottom: 10, letterSpacing: '0.03em' }}>"{d.hook}"</div>
              <p style={{ fontSize: 12, color: 'var(--t2)', margin: '0 0 12px', lineHeight: 1.5 }}>{d.desc}</p>
              <div className="sf-label" style={{ marginBottom: 6 }}>BEST FOR</div>
              <div className="sf-mono" style={{ fontSize: 10, color: d.color, letterSpacing: '1px', marginBottom: 14 }}>{d.forChannels}</div>
              <div className="sf-label" style={{ marginBottom: 6 }}>STRENGTHS</div>
              <ul style={{ margin: '0 0 12px', padding: 0, listStyle: 'none' }}>
                {d.strengths.map((s, j) => (
                  <li key={j} style={{ fontSize: 11, color: 'var(--t2)', padding: '3px 0', display: 'flex', gap: 6 }}>
                    <span style={{ color: d.color }}>✓</span>{s}
                  </li>
                ))}
              </ul>
              <div className="sf-label" style={{ marginBottom: 6 }}>WATCH-OUTS</div>
              <ul style={{ margin: 0, padding: 0, listStyle: 'none' }}>
                {d.risks.map((s, j) => (
                  <li key={j} style={{ fontSize: 11, color: 'var(--t3)', padding: '3px 0', display: 'flex', gap: 6 }}>
                    <span style={{ color: '#FF3366' }}>!</span>{s}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

// ---------- PROMOTIONAL DROPS (under Direction 01) ----------

function BoardingPass() {
  return (
    <div style={{
      background: 'linear-gradient(135deg, #0A0E17 0%, #111827 100%)',
      border: '1px solid #15C17B',
      boxShadow: '0 0 40px rgba(21,193,123,0.15), inset 0 0 60px rgba(21,193,123,0.04)',
      display: 'grid', gridTemplateColumns: '1fr 110px',
      fontFamily: 'var(--font-mono)', color: '#FAFAFA',
      position: 'relative', overflow: 'hidden',
      width: '100%',
    }}>
      {/* perforated divider */}
      <div style={{ position: 'absolute', top: 0, bottom: 0, right: 110, borderLeft: '1px dashed rgba(21,193,123,0.35)' }} />
      <div style={{ position: 'absolute', top: -8, right: 102, width: 16, height: 16, borderRadius: '50%', background: '#060912' }} />
      <div style={{ position: 'absolute', bottom: -8, right: 102, width: 16, height: 16, borderRadius: '50%', background: '#060912' }} />

      {/* left — main */}
      <div style={{ padding: '20px 22px', display: 'flex', flexDirection: 'column', gap: 14, minWidth: 0 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 10 }}>
          <div style={{ minWidth: 0 }}>
            <div style={{ fontSize: 9, letterSpacing: '2.5px', color: '#15C17B' }}>// BOARDING PASS</div>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: 24, fontWeight: 300, letterSpacing: '0.04em', color: '#FAFAFA', marginTop: 4 }}>STELLARFORGE</div>
          </div>
          <div style={{ textAlign: 'right', flexShrink: 0 }}>
            <div style={{ fontSize: 9, letterSpacing: '2px', color: 'rgba(255,255,255,0.4)' }}>VESSEL</div>
            <div style={{ fontSize: 11, color: '#3DFFCD', letterSpacing: '1.5px', marginTop: 3 }}>SF-001 · GENESIS</div>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12, paddingTop: 10, borderTop: '1px solid rgba(21,193,123,0.2)' }}>
          <div style={{ minWidth: 0 }}>
            <div style={{ fontSize: 9, letterSpacing: '2px', color: 'rgba(255,255,255,0.4)' }}>PASSENGER</div>
            <div style={{ fontSize: 11, color: '#FAFAFA', letterSpacing: '1px', marginTop: 4 }}>[ YOUR NAME ]</div>
          </div>
          <div style={{ minWidth: 0 }}>
            <div style={{ fontSize: 9, letterSpacing: '2px', color: 'rgba(255,255,255,0.4)' }}>DEPARTURE</div>
            <div style={{ fontSize: 11, color: '#FAFAFA', letterSpacing: '1px', marginTop: 4 }}>2026.08.11</div>
          </div>
          <div style={{ minWidth: 0 }}>
            <div style={{ fontSize: 9, letterSpacing: '2px', color: 'rgba(255,255,255,0.4)' }}>TIME</div>
            <div style={{ fontSize: 11, color: '#FAFAFA', letterSpacing: '1px', marginTop: 4 }}>12:01 PT</div>
          </div>
          <div style={{ minWidth: 0 }}>
            <div style={{ fontSize: 9, letterSpacing: '2px', color: 'rgba(255,255,255,0.4)' }}>GATE</div>
            <div style={{ fontSize: 11, color: '#15C17B', letterSpacing: '1px', marginTop: 4 }}>stellarforge.tools</div>
          </div>
          <div style={{ minWidth: 0 }}>
            <div style={{ fontSize: 9, letterSpacing: '2px', color: 'rgba(255,255,255,0.4)' }}>SEAT</div>
            <div style={{ fontSize: 11, color: '#FAFAFA', letterSpacing: '1px', marginTop: 4 }}>04A · BRIDGE</div>
          </div>
          <div style={{ minWidth: 0 }}>
            <div style={{ fontSize: 9, letterSpacing: '2px', color: 'rgba(255,255,255,0.4)' }}>CLASS</div>
            <div style={{ fontSize: 11, color: '#3DFFCD', letterSpacing: '1px', marginTop: 4 }}>EARLY ACCESS</div>
          </div>
        </div>

        <div style={{ marginTop: 'auto', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', paddingTop: 10, gap: 10 }}>
          <div style={{ minWidth: 0 }}>
            <div style={{ fontSize: 9, letterSpacing: '2px', color: 'rgba(255,255,255,0.4)' }}>CLEARANCE CODE</div>
            <div style={{ fontSize: 13, color: '#3DFFCD', letterSpacing: '2px', marginTop: 3 }}>BOARDING-0811</div>
          </div>
          {/* fake barcode */}
          <div style={{ display: 'flex', gap: 2, alignItems: 'flex-end', height: 28, flexShrink: 0 }}>
            {[3,6,2,5,3,7,2,4,6,3,5,2,7,3,4,6].map((h,i) => (
              <div key={i} style={{ width: 2, height: h * 3.5, background: '#FAFAFA', opacity: 0.8 }} />
            ))}
          </div>
        </div>
      </div>

      {/* right — stub */}
      <div style={{ padding: '18px 12px', textAlign: 'center', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
        <div>
          <div style={{ fontSize: 8, letterSpacing: '2px', color: 'rgba(255,255,255,0.4)' }}>STUB · KEEP</div>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: 15, color: '#15C17B', letterSpacing: '0.04em', marginTop: 8, lineHeight: 1.1 }}>SF<br/>001</div>
        </div>
        <div style={{ fontSize: 9, color: '#3DFFCD', letterSpacing: '2px', lineHeight: 1.4 }}>08<br/>11<br/>26</div>
        <div style={{ fontSize: 8, letterSpacing: '1.5px', color: 'rgba(255,255,255,0.4)', lineHeight: 1.4 }}>stellarforge<br/>.tools</div>
      </div>
    </div>
  );
}

function MissionPatch() {
  return (
    <div style={{ background: '#0A0E17', border: '1px solid rgba(21,193,123,0.2)', padding: 24, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
      <svg viewBox="0 0 200 200" width="160" height="160" style={{ filter: 'drop-shadow(0 0 20px rgba(21,193,123,0.25))' }}>
        <defs>
          <radialGradient id="patch-bg" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#111827" />
            <stop offset="100%" stopColor="#0A0E17" />
          </radialGradient>
        </defs>
        {/* outer hex */}
        <polygon points="100,12 170,52 170,148 100,188 30,148 30,52" fill="url(#patch-bg)" stroke="#15C17B" strokeWidth="2.5" />
        <polygon points="100,22 161,57 161,143 100,178 39,143 39,57" fill="none" stroke="#15C17B" strokeWidth="0.5" opacity="0.5" />
        {/* stars */}
        <g fill="#FAFAFA" opacity="0.5">
          <circle cx="60" cy="55" r="1"/><circle cx="140" cy="60" r="1.2"/><circle cx="55" cy="130" r="1"/><circle cx="150" cy="140" r="1.3"/><circle cx="100" cy="40" r="0.9"/><circle cx="75" cy="155" r="1"/>
        </g>
        {/* inner cube icon */}
        <g transform="translate(100 100)" stroke="#3DFFCD" strokeWidth="1.8" fill="none">
          <polygon points="0,-32 28,-16 28,16 0,32 -28,16 -28,-16" />
          <line x1="0" y1="-32" x2="0" y2="0" />
          <line x1="28" y1="-16" x2="0" y2="0" />
          <line x1="-28" y1="-16" x2="0" y2="0" />
        </g>
        {/* top arc text */}
        <path id="arc-top" d="M 40 100 A 60 60 0 0 1 160 100" fill="none" />
        <text fontSize="11" fill="#FAFAFA" letterSpacing="4" fontFamily="monospace">
          <textPath href="#arc-top" startOffset="50%" textAnchor="middle">STELLARFORGE · SF-001</textPath>
        </text>
        {/* bottom arc text */}
        <path id="arc-bot" d="M 40 115 A 60 60 0 0 0 160 115" fill="none" />
        <text fontSize="9" fill="#15C17B" letterSpacing="3" fontFamily="monospace">
          <textPath href="#arc-bot" startOffset="50%" textAnchor="middle">GENESIS · 2026.08.11</textPath>
        </text>
      </svg>
      <div style={{ textAlign: 'center' }}>
        <div className="sf-mono" style={{ fontSize: 10, color: '#15C17B', letterSpacing: '2px' }}>MISSION PATCH · EMBROIDERED</div>
        <div style={{ fontFamily: 'var(--font-display)', fontSize: 14, color: 'var(--t1)', letterSpacing: '0.04em', marginTop: 4 }}>Crew SF-001</div>
      </div>
    </div>
  );
}

function ZeroGCertificate() {
  return (
    <div style={{
      background: '#0A0E17',
      border: '2px solid #FFB800',
      padding: '24px 22px',
      position: 'relative',
      fontFamily: 'var(--font-mono)',
      boxShadow: '0 0 40px rgba(255,184,0,0.15)',
    }}>
      {/* corner brackets */}
      {['tl','tr','bl','br'].map((k) => {
        const base = { position: 'absolute', width: 14, height: 14, borderColor: '#FFB800', borderStyle: 'solid', borderWidth: 0 };
        const pos = {
          tl: { top: 6, left: 6, borderTopWidth: 2, borderLeftWidth: 2 },
          tr: { top: 6, right: 6, borderTopWidth: 2, borderRightWidth: 2 },
          bl: { bottom: 6, left: 6, borderBottomWidth: 2, borderLeftWidth: 2 },
          br: { bottom: 6, right: 6, borderBottomWidth: 2, borderRightWidth: 2 },
        }[k];
        return <div key={k} style={{ ...base, ...pos }} />;
      })}

      <div style={{ textAlign: 'center', paddingBottom: 14, borderBottom: '1px dashed rgba(255,184,0,0.3)' }}>
        <div style={{ fontSize: 9, letterSpacing: '3px', color: '#FFB800' }}>// GRAND PRIZE · 01 OF 01</div>
        <div style={{ fontFamily: 'var(--font-display)', fontWeight: 300, fontSize: 22, color: '#FAFAFA', letterSpacing: '0.05em', marginTop: 8, lineHeight: 1.2 }}>
          ZERO-GRAVITY<br/><span style={{ color: '#FFB800' }}>FLIGHT</span>
        </div>
        <div style={{ fontSize: 9, letterSpacing: '2px', color: 'rgba(255,255,255,0.5)', marginTop: 8 }}>WEIGHTLESS · 15 PARABOLAS · 5 MINUTES OF FLOAT</div>
      </div>

      <div style={{ padding: '14px 0', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, fontSize: 10, letterSpacing: '1px' }}>
        <div>
          <div style={{ color: 'rgba(255,255,255,0.4)' }}>OPERATOR</div>
          <div style={{ color: '#FAFAFA', marginTop: 3 }}>ZERO-G CORP.</div>
        </div>
        <div>
          <div style={{ color: 'rgba(255,255,255,0.4)' }}>LOCATION</div>
          <div style={{ color: '#FAFAFA', marginTop: 3 }}>KSC · FLORIDA</div>
        </div>
        <div>
          <div style={{ color: 'rgba(255,255,255,0.4)' }}>WINNERS</div>
          <div style={{ color: '#FFB800', marginTop: 3 }}>1 PASSENGER + 1 GUEST</div>
        </div>
        <div>
          <div style={{ color: 'rgba(255,255,255,0.4)' }}>DRAW DATE</div>
          <div style={{ color: '#FAFAFA', marginTop: 3 }}>2026.09.30</div>
        </div>
      </div>

      <div style={{ padding: '12px 0', borderTop: '1px dashed rgba(255,184,0,0.3)', fontSize: 10, color: 'var(--t2)', lineHeight: 1.6 }}>
        Every early-access signup earns 1 entry. Every referral earns 5. Every world published to the public gallery earns 25.
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: 10, borderTop: '1px solid rgba(255,184,0,0.25)' }}>
        <div>
          <div style={{ fontSize: 8, letterSpacing: '2px', color: 'rgba(255,255,255,0.4)' }}>RULES</div>
          <div style={{ fontSize: 10, color: '#FFB800', marginTop: 2 }}>stellarforge.tools/crew</div>
        </div>
        <div style={{ fontSize: 9, color: '#FFB800', letterSpacing: '2px' }}>NO PURCHASE NEC.</div>
      </div>
    </div>
  );
}

function PromotionalDrops() {
  const tiers = [
    {
      code: 'TIER 01',
      name: 'BOARDING PASS',
      audience: 'Every early-access signup',
      volume: '~5,000 expected',
      cost: '~$0.45/unit printed + shipped',
      color: '#15C17B',
      mech: 'Auto-mailed in week of launch. Matte card, foil-stamped clearance code. Digital twin in confirmation email + Apple Wallet .pkpass.',
      viral: 'Passengers photograph and post. #SF001 becomes the signal.',
      artifact: <BoardingPass />,
    },
    {
      code: 'TIER 02',
      name: 'CREW KIT',
      audience: 'First 500 waitlisters + referrers (5+)',
      volume: '500 kits',
      cost: '~$14/kit incl. shipping',
      color: '#3DFFCD',
      mech: 'Embroidered mission patch, enamel pin, 4-sticker set, handwritten crew number. Shipped in a black mylar envelope with the transmission seal.',
      viral: 'Unboxing reels. Writers wear the patch on laptop sleeves — every coffee-shop session is an ad.',
      artifact: <MissionPatch />,
    },
    {
      code: 'TIER 03',
      name: 'ZERO-G FLIGHT',
      audience: 'One grand-prize winner, drawn 09.30',
      volume: '1 winner + 1 guest',
      cost: '~$15K partnership w/ Zero-G Corp.',
      color: '#FFB800',
      mech: 'Full sweepstakes rules, entry via signup (1), referral (5), publishing a world to the gallery (25). Capped at 100 entries/person.',
      viral: 'PR hook for TechCrunch, The Verge, and sci-fi press. "The writing app that sends you to space."',
      artifact: <ZeroGCertificate />,
    },
  ];

  return (
    <section style={{ marginTop: 48 }}>
      <SectionHeader
        code="// SECTOR 02.5 · PROMOTIONAL DROPS"
        title="Physical artifacts from the ship"
        subtitle="Direction 01 opens a door: if opening StellarForge feels like boarding a ship, signing up should feel like getting cleared for launch. Three tiers of tangible object — from a mailed postcard to a literal trip to the edge of gravity — extend the metaphor off-screen and give press and social a story-shaped hook."
        accent="#15C17B"
      />

      <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
        {tiers.map((t, i) => (
          <div key={i} className="sf-panel" style={{ padding: 0, overflow: 'hidden', display: 'grid', gridTemplateColumns: 'minmax(320px, 480px) 1fr', minHeight: 280 }}>
            {/* left — the artifact */}
            <div style={{ padding: 24, background: '#060912', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRight: '1px solid var(--sf-border)' }}>
              {t.artifact}
            </div>

            {/* right — meta */}
            <div style={{ padding: 22, display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                  <span className="sf-mono" style={{ color: t.color, fontSize: 11, letterSpacing: '1.5px' }}>{t.code}</span>
                  <StatusPill label="DROP" color={t.color} dot />
                </div>
                <div style={{ fontFamily: 'var(--font-display)', fontSize: 24, color: 'var(--t1)', letterSpacing: '0.04em', fontWeight: 300 }}>{t.name}</div>
                <div className="sf-mono" style={{ fontSize: 10, color: 'var(--t4)', letterSpacing: '1.5px', marginTop: 4 }}>{t.audience}</div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, paddingTop: 10, borderTop: '1px solid var(--sf-border)' }}>
                <div>
                  <div className="sf-label" style={{ marginBottom: 4 }}>VOLUME</div>
                  <div className="sf-mono" style={{ fontSize: 11, color: t.color, letterSpacing: '1px' }}>{t.volume}</div>
                </div>
                <div>
                  <div className="sf-label" style={{ marginBottom: 4 }}>UNIT ECON</div>
                  <div className="sf-mono" style={{ fontSize: 11, color: 'var(--t2)', letterSpacing: '1px' }}>{t.cost}</div>
                </div>
              </div>
              <div>
                <div className="sf-label" style={{ marginBottom: 4 }}>MECHANIC</div>
                <p style={{ fontSize: 12, color: 'var(--t2)', margin: 0, lineHeight: 1.55 }}>{t.mech}</p>
              </div>
              <div>
                <div className="sf-label" style={{ marginBottom: 4 }}>VIRAL LOOP</div>
                <p style={{ fontSize: 12, color: 'var(--t3)', margin: 0, lineHeight: 1.55, fontStyle: 'italic' }}>{t.viral}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div style={{ marginTop: 18, padding: 18, border: '1px dashed rgba(21,193,123,0.3)', background: 'rgba(21,193,123,0.04)', display: 'grid', gridTemplateColumns: '160px 1fr', gap: 18, alignItems: 'center' }}>
        <div>
          <div className="sf-mono" style={{ fontSize: 10, color: '#15C17B', letterSpacing: '2px' }}>// TOTAL</div>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: 28, color: 'var(--t1)', letterSpacing: '0.04em', marginTop: 4, fontWeight: 300 }}>~$29K</div>
          <div className="sf-mono" style={{ fontSize: 10, color: 'var(--t4)', letterSpacing: '1px', marginTop: 2 }}>all three tiers combined</div>
        </div>
        <p style={{ margin: 0, fontSize: 12, color: 'var(--t2)', lineHeight: 1.6 }}>
          Compared to an equivalent paid-media buy, the drops program converts spend into press, UGC, and a mailing list that opens at ~60%. The Zero-G grand prize alone — pitched correctly — earns one feature in a major outlet, which pays the whole program back. If budget is tight, ship <strong style={{ color: 'var(--t1)' }}>Tier 01 only</strong> — it's the one that matters.
        </p>
      </div>
    </section>
  );
}

Object.assign(window, { StrategySection, DirectionsSection, PromotionalDrops });
