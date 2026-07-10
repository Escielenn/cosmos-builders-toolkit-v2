// Social post mockups — IG square, X card, LinkedIn, Reddit

function StarBG() {
  return (
    <div style={{
      position: 'absolute', inset: 0, pointerEvents: 'none',
      background:
        'radial-gradient(1px 1px at 15% 25%, rgba(255,255,255,0.5), transparent 50%),' +
        'radial-gradient(1px 1px at 70% 60%, rgba(91,141,239,0.4), transparent 50%),' +
        'radial-gradient(1.5px 1.5px at 85% 20%, rgba(255,255,255,0.35), transparent 50%),' +
        'radial-gradient(1px 1px at 30% 80%, rgba(21,193,123,0.35), transparent 50%),' +
        'radial-gradient(1px 1px at 50% 45%, rgba(255,255,255,0.2), transparent 50%)',
      backgroundSize: '400px 400px'
    }} />
  );
}

// -- INSTAGRAM SQUARE --
function IGSquare({ variant = 'ignition' }) {
  if (variant === 'ignition') {
    return (
      <div style={{ width: 320, height: 320, background: '#000', position: 'relative', overflow: 'hidden', border: '1px solid #15C17B30' }}>
        <StarBG />
        <div style={{ position: 'absolute', top: 20, left: 20, right: 20, display: 'flex', justifyContent: 'space-between' }}>
          <Wordmark />
          <StatusPill label="T-MINUS 7" color="#FFB800" />
        </div>
        <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 30 }}>
          <div style={{ fontFamily: 'var(--font-display)', fontWeight: 300, fontSize: 38, color: '#FAFAFA', letterSpacing: '0.08em', textAlign: 'center', lineHeight: 1.05 }}>
            BOARDING<br/><span style={{ color: '#15C17B' }}>AUG 11</span>
          </div>
          <div className="sf-mono" style={{ marginTop: 18, fontSize: 10, color: 'rgba(255,255,255,0.4)', letterSpacing: '3px' }}>STELLARFORGE · EARLY ACCESS</div>
        </div>
        <div style={{ position: 'absolute', bottom: 20, left: 20, right: 20, display: 'flex', justifyContent: 'space-between' }}>
          <span className="sf-mono" style={{ fontSize: 10, color: '#3DFFCD' }}>&gt; REQUEST CLEARANCE</span>
          <span className="sf-mono" style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)' }}>2026.08</span>
        </div>
      </div>
    );
  }
  if (variant === 'cascade') {
    return (
      <div style={{ width: 320, height: 320, background: '#0A0E17', position: 'relative', overflow: 'hidden', border: '1px solid #FFB80030', padding: 22 }}>
        <div className="sf-mono" style={{ fontSize: 9, color: '#FFB800', letterSpacing: '2px', marginBottom: 12 }}>// CASCADE DEMO</div>
        <div style={{ fontFamily: 'var(--font-display)', fontWeight: 300, fontSize: 20, color: '#FAFAFA', letterSpacing: '0.04em', lineHeight: 1.2, marginBottom: 16 }}>
          Change one number.<br/>Watch a civilization <span style={{ color: '#FFB800' }}>fall</span>.
        </div>
        {[
          ['GRAVITY', '1.4 g', '#FFB800'],
          ['BIOLOGY', 'low, 6-limbed', '#00FF88'],
          ['CULTURE', 'crawling caste', '#9B5DE5'],
          ['MYTHOS', 'no word for "fall"', '#4D9FFF'],
        ].map(([k, v, c], i) => (
          <div key={i} style={{ display: 'grid', gridTemplateColumns: '90px 1fr', gap: 10, padding: '6px 0', borderTop: i ? '1px dashed rgba(255,255,255,0.08)' : 'none' }}>
            <span className="sf-mono" style={{ fontSize: 9, color: c, letterSpacing: '1.5px' }}>{k}</span>
            <span style={{ fontSize: 11, fontFamily: 'var(--font-mono)', color: '#FAFAFA' }}>{v}</span>
          </div>
        ))}
        <div style={{ position: 'absolute', bottom: 20, left: 22, right: 22, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Wordmark />
          <span className="sf-mono" style={{ fontSize: 9, color: '#FFB800', letterSpacing: '1.5px' }}>STELLARFORGE.TOOLS</span>
        </div>
      </div>
    );
  }
  // poetic
  return (
    <div style={{ width: 320, height: 320, background: 'radial-gradient(ellipse at 50% 40%, #0c1b3e 0%, #0A0E17 70%)', position: 'relative', overflow: 'hidden', border: '1px solid #5B8DEF30' }}>
      <StarBG />
      <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 40, textAlign: 'center' }}>
        <div style={{ fontFamily: 'var(--font-display)', fontWeight: 300, fontSize: 26, color: '#FAFAFA', letterSpacing: '0.06em', lineHeight: 1.3 }}>
          These worlds<br/><span style={{ color: '#5B8DEF', fontStyle: 'italic' }}>exist in you.</span><br/>Waiting to be found.
        </div>
      </div>
      <div style={{ position: 'absolute', bottom: 18, left: 0, right: 0, display: 'flex', justifyContent: 'center' }}>
        <span className="sf-mono" style={{ fontSize: 9, color: 'rgba(255,255,255,0.4)', letterSpacing: '3px' }}>STELLARFORGE · EARLY ACCESS · 08.11</span>
      </div>
    </div>
  );
}

// -- IG CAROUSEL (3 slides) --
function IGCarousel() {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
      {[
        { n: '01 / 05', h: 'MEET THE SHIP', p: '25 instruments. One worldbuilding framework. Built for writers who want rigor, not rubber-suit aliens.' },
        { n: '02 / 05', h: 'CASCADE', p: 'Change gravity. Watch biology, psychology, culture, and mythology reshape themselves. Five layers deep.' },
        { n: '03 / 05', h: 'BOARD AUG 11', p: 'Early Access opens in seven days. Link in bio.' },
      ].map((s, i) => (
        <div key={i} style={{
          aspectRatio: '1', background: '#000', border: '1px solid rgba(21,193,123,0.3)',
          padding: 18, position: 'relative', display: 'flex', flexDirection: 'column', justifyContent: 'space-between'
        }}>
          <StarBG />
          <div style={{ position: 'relative' }}>
            <div className="sf-mono" style={{ fontSize: 9, color: '#15C17B', letterSpacing: '2px' }}>// {s.n}</div>
          </div>
          <div style={{ position: 'relative' }}>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: 18, color: '#FAFAFA', letterSpacing: '0.06em', marginBottom: 8 }}>{s.h}</div>
            <p style={{ fontSize: 10, color: 'rgba(255,255,255,0.65)', margin: 0, lineHeight: 1.5 }}>{s.p}</p>
          </div>
          <div className="sf-mono" style={{ fontSize: 8, color: 'rgba(255,255,255,0.3)', letterSpacing: '2px', position: 'relative' }}>STELLARFORGE</div>
        </div>
      ))}
    </div>
  );
}

// -- X / TWITTER POST --
function XPost() {
  return (
    <div style={{ background: '#000', border: '1px solid #2f3336', padding: 16, color: '#e7e9ea', fontFamily: 'system-ui, sans-serif', fontSize: 14, width: 520 }}>
      <div style={{ display: 'flex', gap: 12, marginBottom: 10 }}>
        <div style={{ width: 40, height: 40, borderRadius: '50%', background: '#0A0E17', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <Cube size={22} color="#3DFFCD" />
        </div>
        <div>
          <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
            <span style={{ fontWeight: 700 }}>StellarForge</span>
            <span style={{ color: '#71767b' }}>@stellarforge · 7d</span>
          </div>
          <div style={{ marginTop: 8, lineHeight: 1.4 }}>
            One slider nudged. Four civilizations rewritten.<br/><br/>
            The CASCADE engine maps how a single environmental change ripples through biology → psychology → culture → mythology.<br/><br/>
            This is worldbuilding with receipts. Early Access August 11.<br/><br/>
            <span style={{ color: '#3DFFCD' }}>stellarforge.tools/early</span>
          </div>
        </div>
      </div>
      <div style={{ marginLeft: 52, border: '1px solid #2f3336', overflow: 'hidden' }}>
        <div style={{ aspectRatio: '16/9', background: '#0A0E17', padding: 20, position: 'relative' }}>
          <StarBG />
          <div className="sf-mono" style={{ fontSize: 10, color: '#FFB800', letterSpacing: '2px', marginBottom: 8 }}>// CASCADE · DEMO</div>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: 22, color: '#FAFAFA', letterSpacing: '0.05em', marginBottom: 10 }}>
            GRAVITY → MYTHOLOGY
          </div>
          {[['1.4g', 'surface pressure ↑'], ['low-slung', '6-limbed biology'], ['crawl caste', 'political stratification'], ['no "fall"', 'missing myth archetype']].map(([a, b], i) => (
            <div key={i} style={{ fontSize: 11, color: i === 3 ? '#FFB800' : '#C8C8C8', fontFamily: 'var(--font-mono)', marginTop: 2 }}>› {a} — <span style={{ color: 'rgba(255,255,255,0.5)' }}>{b}</span></div>
          ))}
        </div>
      </div>
      <div style={{ marginLeft: 52, marginTop: 12, display: 'flex', gap: 40, color: '#71767b', fontSize: 13 }}>
        <span>💬 247</span><span>🔁 1.2K</span><span>♡ 4.8K</span><span>📊 312K</span>
      </div>
    </div>
  );
}

// -- LINKEDIN --
function LinkedInPost() {
  return (
    <div style={{ background: '#fff', color: '#000', padding: 16, width: 520, fontFamily: 'system-ui, sans-serif', fontSize: 14, borderRadius: 8, border: '1px solid #e0e0e0' }}>
      <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
        <div style={{ width: 48, height: 48, borderRadius: '50%', background: '#f3f2ef', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ width: 42, height: 42, borderRadius: '50%', background: '#0A0E17', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Cube size={24} color="#3DFFCD" />
          </div>
        </div>
        <div>
          <div style={{ fontWeight: 600, fontSize: 14 }}>Jason D. Batt, Ph.D.</div>
          <div style={{ fontSize: 12, color: '#666' }}>Founder, StellarForge · Author · 2d</div>
        </div>
      </div>
      <div style={{ marginTop: 12, lineHeight: 1.5, fontSize: 13, color: '#000' }}>
        Three years ago, I asked a question that wouldn't let me go:<br/><br/>
        <em>Why do most "worldbuilding tools" for SF writers feel like random generators wearing a lab coat?</em><br/><br/>
        Real worlds aren't generated — they cascade. Change the gravity of a planet and you've changed its biology. Change its biology and you've changed its myths. You can't bolt a civilization onto a random planet and expect the seams to hide.<br/><br/>
        So we built the instrument panel I wished existed: 25 tools organized around a single principle — <strong>Physics → Environment → Biology → Psychology → Mythology → Culture.</strong><br/><br/>
        Early Access opens August 11. Writers and teaching faculty get first clearance.<br/><br/>
        Thread below on what we learned building it →
      </div>
      <div style={{ marginTop: 12, border: '1px solid #e0e0e0', overflow: 'hidden' }}>
        <div style={{ aspectRatio: '1.91/1', background: '#0A0E17', padding: 20, position: 'relative', color: '#fff' }}>
          <StarBG />
          <div style={{ position: 'relative', height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
            <Wordmark />
            <div>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: 30, letterSpacing: '0.06em', lineHeight: 1.1 }}>
                THE INSTRUMENT<br/>PANEL FOR<br/><span style={{ color: '#15C17B' }}>SF WRITERS.</span>
              </div>
              <div className="sf-mono" style={{ fontSize: 10, color: 'rgba(255,255,255,0.5)', letterSpacing: '2px', marginTop: 10 }}>EARLY ACCESS · 2026.08.11</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// -- REDDIT --
function RedditPost() {
  return (
    <div style={{ background: '#1a1a1b', color: '#d7dadc', padding: 12, width: 520, fontFamily: 'IBM Plex Sans, system-ui, sans-serif', fontSize: 14, border: '1px solid #343536', borderRadius: 4 }}>
      <div style={{ display: 'flex', gap: 8, color: '#818384', fontSize: 12, marginBottom: 6 }}>
        <span>r/worldbuilding</span><span>·</span><span>Posted by u/JasonBatt</span><span>·</span><span>6h</span>
      </div>
      <div style={{ fontSize: 18, fontWeight: 500, color: '#d7dadc', marginBottom: 8 }}>
        [OC · Tool] I built a worldbuilding platform for SF writers after getting tired of random generators. Here's the framework + how it works.
      </div>
      <div style={{ fontSize: 13, lineHeight: 1.6, color: '#d7dadc' }}>
        Hi r/worldbuilding. I'm Jason — I teach SF writing at a university and I've been building a tool for the last ~2 years because I couldn't find one that matched how I actually teach worldbuilding.<br/><br/>
        The core idea: worlds aren't a list of features, they're a <strong>cascade</strong>. Physics → Environment → Biology → Psychology → Mythology → Culture. Change something upstream, everything downstream shifts.<br/><br/>
        The toolkit has 25 instruments — worksheets, calculators, simulators — all organized around that cascade. Here's a screenshot of the Planetary Profile feeding into Evolutionary Biology: [image]<br/><br/>
        <strong>Free tier:</strong> 3 tools (Cascade, Vessel, Impulse), unlimited worlds.<br/>
        <strong>Pro:</strong> $4.99/mo, everything unlocked.<br/><br/>
        Goes live for Early Access August 11. Would love feedback from this sub specifically — you're the exact audience this was built for. AMA in the comments.
      </div>
      <div style={{ marginTop: 14, border: '1px solid #343536' }}>
        <div style={{ aspectRatio: '16/9', background: '#0A0E17', padding: 16, position: 'relative' }}>
          <StarBG />
          <div style={{ position: 'relative' }}>
            <div className="sf-mono" style={{ fontSize: 9, color: '#15C17B', letterSpacing: '2px', marginBottom: 6 }}>// CASCADE · 5 LAYERS</div>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: 20, color: '#FAFAFA', letterSpacing: '0.04em' }}>PHYSICS → CULTURE</div>
            <div style={{ marginTop: 8, display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              {['STARS', 'WORLDS', 'LIFE', 'CIVS', 'MYTHOS'].map((l, i) => (
                <span key={i} className="sf-mono" style={{ fontSize: 9, padding: '2px 6px', border: '1px solid rgba(21,193,123,0.3)', color: '#3DFFCD', letterSpacing: '1.5px' }}>{l}</span>
              ))}
            </div>
          </div>
        </div>
      </div>
      <div style={{ marginTop: 10, display: 'flex', gap: 18, color: '#818384', fontSize: 12 }}>
        <span>▲ 4.2K</span><span>💬 387 comments</span><span>Share</span><span>Save</span>
      </div>
    </div>
  );
}

function SocialSection() {
  return (
    <section>
      <SectionHeader
        code="// SECTOR 04 · SOCIAL ARTIFACTS"
        title="Designed posts, per channel"
        subtitle="Each channel gets its own voice. IG carries the mission-briefing visual. X earns with data + cascade demos. LinkedIn is Jason's long-form builder diary. Reddit is transparent, community-first, no press-release energy."
        accent="#FF00AA"
      />

      {/* IG Frames */}
      <div style={{ marginBottom: 32 }}>
        <div className="sf-label" style={{ marginBottom: 14 }}>INSTAGRAM · SQUARE · 1080×1080 · 3 VARIANTS</div>
        <div style={{ display: 'flex', gap: 18, flexWrap: 'wrap' }}>
          <div><IGSquare variant="ignition" /><div className="sf-mono" style={{ fontSize: 10, color: 'var(--t4)', marginTop: 8, letterSpacing: '1.5px' }}>01 · COUNTDOWN / IGNITION</div></div>
          <div><IGSquare variant="cascade" /><div className="sf-mono" style={{ fontSize: 10, color: 'var(--t4)', marginTop: 8, letterSpacing: '1.5px' }}>02 · CASCADE DEMO</div></div>
          <div><IGSquare variant="poetic" /><div className="sf-mono" style={{ fontSize: 10, color: 'var(--t4)', marginTop: 8, letterSpacing: '1.5px' }}>03 · POETIC</div></div>
        </div>
      </div>

      {/* IG Carousel */}
      <div style={{ marginBottom: 32 }}>
        <div className="sf-label" style={{ marginBottom: 14 }}>INSTAGRAM · CAROUSEL · 3 OF 5 FRAMES SHOWN</div>
        <IGCarousel />
      </div>

      {/* X */}
      <div style={{ marginBottom: 32 }}>
        <div className="sf-label" style={{ marginBottom: 14 }}>X / TWITTER · CARD POST</div>
        <XPost />
      </div>

      {/* LinkedIn */}
      <div style={{ marginBottom: 32 }}>
        <div className="sf-label" style={{ marginBottom: 14 }}>LINKEDIN · JASON LONG-FORM</div>
        <LinkedInPost />
      </div>

      {/* Reddit */}
      <div style={{ marginBottom: 0 }}>
        <div className="sf-label" style={{ marginBottom: 14 }}>REDDIT · r/worldbuilding SELF-POST</div>
        <RedditPost />
      </div>
    </section>
  );
}

Object.assign(window, { SocialSection, IGSquare, XPost, LinkedInPost, RedditPost, IGCarousel });
