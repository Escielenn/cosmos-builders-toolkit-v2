// Emails + Ads + Press/Outreach + Video storyboards

// -- EMAIL SEQUENCE --
function EmailFrame({ subject, from, children }) {
  return (
    <div className="sf-panel" style={{ padding: 0, overflow: 'hidden', maxWidth: 520 }}>
      <div style={{ background: 'rgba(255,255,255,0.02)', padding: '10px 16px', borderBottom: '1px solid var(--sf-border)', display: 'flex', gap: 12, alignItems: 'center' }}>
        <div style={{ display: 'flex', gap: 6 }}>
          {['#FF5F57', '#FEBC2E', '#28C840'].map(c => <span key={c} style={{ width: 10, height: 10, borderRadius: '50%', background: c, opacity: 0.6 }} />)}
        </div>
        <div className="sf-mono" style={{ fontSize: 10, color: 'var(--t4)', letterSpacing: '1.5px', marginLeft: 8 }}>{from}</div>
      </div>
      <div style={{ padding: '14px 18px', borderBottom: '1px solid var(--sf-border)' }}>
        <div className="sf-mono" style={{ fontSize: 10, color: 'var(--t4)', letterSpacing: '1.5px', marginBottom: 4 }}>SUBJECT</div>
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: 13, color: 'var(--t1)', letterSpacing: '0.04em' }}>{subject}</div>
      </div>
      <div style={{ padding: '18px 20px', fontSize: 13, color: 'var(--t2)', lineHeight: 1.65 }}>
        {children}
      </div>
    </div>
  );
}

function EmailsSection() {
  return (
    <section>
      <SectionHeader
        code="// SECTOR 05 · EMAIL SEQUENCE"
        title="Six transmissions"
        subtitle="From waitlist signup through 48-hour post-launch. Ship's Voice in the subject line and preheader; warm, writerly prose in the body. Plaintext-first — black background, a single teal rule, mono subject, DM Sans body."
        accent="#FFB800"
      />
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 20 }}>

        <EmailFrame subject="STELLARFORGE: SIGNAL RECEIVED" from="ship@stellarforge.tools → you">
          <p style={{ marginTop: 0 }}><span className="sf-mono" style={{ color: '#15C17B', fontSize: 11, letterSpacing: '1.5px' }}>TRANSMISSION 01 · WAITLIST CONFIRM</span></p>
          <p>Welcome aboard.</p>
          <p>You're on the early-access list. On August 11, we open the doors to 25 instruments — calculators, simulators, and worksheets — organized around one idea: the universes in your head don't need a random generator. They need an instrument panel.</p>
          <p>Between now and then, I'll send five more transmissions. Each one is a tool reveal with a craft note attached. No filler.</p>
          <p style={{ color: 'var(--t3)' }}>— Jason</p>
          <p className="sf-mono" style={{ fontSize: 10, color: 'var(--t4)', letterSpacing: '1.5px', marginTop: 20 }}>STELLARFORGE.TOOLS · 39.87°N 104.97°W</p>
        </EmailFrame>

        <EmailFrame subject="STELLARFORGE: INSTRUMENT REVEAL · CASCADE" from="ship@stellarforge.tools → you">
          <p style={{ marginTop: 0 }}><span className="sf-mono" style={{ color: '#FFB800', fontSize: 11, letterSpacing: '1.5px' }}>TRANSMISSION 03 · T-14</span></p>
          <p>There's one tool I want you to meet before anything else.</p>
          <p><strong style={{ color: 'var(--t1)' }}>Cascade</strong> traces how a single environmental change ripples through five downstream layers: biology, psychology, culture, mythology, language.</p>
          <p>Change your planet's gravity from 1.0g to 1.4g. The dominant species no longer walks upright. "Falling" stops being a universal experience — so your mythology has no Icarus, no Lucifer, no angel cast down.</p>
          <p>That kind of receipt is what this ship is for.</p>
          <p>Video preview (45s) → <span style={{ color: '#3DFFCD' }}>stellarforge.tools/cascade</span></p>
        </EmailFrame>

        <EmailFrame subject="STELLARFORGE: T-MINUS 24. YOU'RE CLEARED TO BOARD." from="ship@stellarforge.tools → you">
          <p style={{ marginTop: 0 }}><span className="sf-mono" style={{ color: '#FF3366', fontSize: 11, letterSpacing: '1.5px' }}>TRANSMISSION 06 · T-1</span></p>
          <p>Tomorrow, August 11 at 12:01 PT, StellarForge goes live.</p>
          <p>Your access code: <span className="sf-mono" style={{ background: 'rgba(21,193,123,0.1)', border: '1px solid rgba(21,193,123,0.3)', padding: '3px 8px', color: '#3DFFCD' }}>BOARDING-PASS-01</span></p>
          <p>Every account gets 3 free instruments forever. Pro ($4.99/mo) unlocks all 25 and the simulators. Everyone on this list gets 40% off the first year — use code <strong style={{ color: 'var(--t1)' }}>EARLY40</strong>.</p>
          <p>One last thing: if you want to help us land, a Product Hunt upvote goes a long way. Link in tomorrow's launch email.</p>
        </EmailFrame>

        <EmailFrame subject="STELLARFORGE: SYSTEMS ONLINE" from="ship@stellarforge.tools → you">
          <p style={{ marginTop: 0 }}><span className="sf-mono" style={{ color: '#3DFFCD', fontSize: 11, letterSpacing: '1.5px' }}>TRANSMISSION 07 · LAUNCH · D-0</span></p>
          <p>The ship is online.</p>
          <p>All 25 instruments are calibrated. The simulators are humming. Your world is waiting to be surveyed.</p>
          <p style={{ textAlign: 'center', margin: '24px 0' }}>
            <span style={{ background: '#15C17B', color: '#000', padding: '10px 24px', fontFamily: 'var(--font-mono)', fontSize: 11, letterSpacing: '2px' }}>[ BOARD NOW → ]</span>
          </p>
          <p>Help us land on Product Hunt: <span style={{ color: '#3DFFCD' }}>→ producthunt.com/posts/stellarforge</span></p>
          <p style={{ color: 'var(--t3)' }}>These worlds exist in you. Waiting to be found.</p>
        </EmailFrame>

      </div>
    </section>
  );
}

// -- AD CREATIVES --
function AdTile({ size, ratio, label, children, color = '#15C17B' }) {
  return (
    <div>
      <div className="sf-mono" style={{ fontSize: 9, color: 'var(--t4)', letterSpacing: '1.5px', marginBottom: 6 }}>{label}</div>
      <div style={{ width: size, aspectRatio: ratio, background: '#0A0E17', border: `1px solid ${color}40`, position: 'relative', overflow: 'hidden' }}>
        {children}
      </div>
    </div>
  );
}

function AdsSection() {
  return (
    <section>
      <SectionHeader
        code="// SECTOR 06 · PAID CREATIVE"
        title="Static + motion + storyboards"
        subtitle="Three static concepts × four aspect ratios for Meta, Reddit, and Google. Two video storyboards for pre-roll + TikTok/Reels. All creatives rotate against the A/B/C direction test in week one."
        accent="#FF3366"
      />

      <div className="sf-label" style={{ marginBottom: 14 }}>STATIC · 3 CONCEPTS × 4 RATIOS · META & REDDIT</div>
      <div style={{ display: 'flex', gap: 18, flexWrap: 'wrap', marginBottom: 32 }}>
        {/* 1x1 */}
        <AdTile size={220} ratio="1" label="1:1 · 1080×1080" color="#15C17B">
          <StarBG />
          <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', padding: 20 }}>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: 22, color: '#FAFAFA', letterSpacing: '0.05em', textAlign: 'center', lineHeight: 1.1 }}>BOARDING<br/><span style={{ color: '#15C17B' }}>AUG 11</span></div>
            <div className="sf-mono" style={{ fontSize: 8, color: 'rgba(255,255,255,0.4)', letterSpacing: '2px', marginTop: 10 }}>WORLDBUILDING · FOR SF WRITERS</div>
          </div>
          <div style={{ position: 'absolute', bottom: 14, left: 14, right: 14, display: 'flex', justifyContent: 'space-between' }}>
            <span className="sf-mono" style={{ fontSize: 8, color: '#3DFFCD' }}>&gt; CLEARANCE</span>
            <Cube size={14} color="#3DFFCD" />
          </div>
        </AdTile>
        {/* 9x16 */}
        <AdTile size={140} ratio="9/16" label="9:16 · STORY/REEL" color="#15C17B">
          <StarBG />
          <div style={{ position: 'absolute', top: 12, left: 12, right: 12 }}>
            <Wordmark />
          </div>
          <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: 18, color: '#FAFAFA', letterSpacing: '0.05em', textAlign: 'center', lineHeight: 1.1 }}>THESE<br/>WORLDS<br/><span style={{ color: '#5B8DEF' }}>EXIST IN</span><br/>YOU.</div>
          </div>
          <div style={{ position: 'absolute', bottom: 12, left: 12, right: 12, textAlign: 'center' }}>
            <div style={{ background: '#15C17B', color: '#000', fontFamily: 'var(--font-mono)', fontSize: 8, letterSpacing: '2px', padding: '5px 8px' }}>BOARD NOW</div>
          </div>
        </AdTile>
        {/* 16x9 */}
        <AdTile size={320} ratio="16/9" label="16:9 · YT PRE-ROLL / HERO" color="#FFB800">
          <StarBG />
          <div style={{ position: 'absolute', top: 14, left: 14, right: 14, display: 'flex', justifyContent: 'space-between' }}>
            <Wordmark /><StatusPill label="EARLY ACCESS" color="#FFB800" />
          </div>
          <div style={{ position: 'absolute', inset: '40px 20px 40px 20px', display: 'flex', alignItems: 'center' }}>
            <div>
              <div className="sf-mono" style={{ fontSize: 9, color: '#FFB800', letterSpacing: '2px', marginBottom: 6 }}>// CASCADE · 5 LAYERS</div>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: 24, color: '#FAFAFA', letterSpacing: '0.04em', lineHeight: 1.1 }}>Change one<br/>number. Watch a<br/><span style={{ color: '#FFB800' }}>civilization fall.</span></div>
            </div>
          </div>
          <div style={{ position: 'absolute', bottom: 14, right: 14 }}>
            <span className="sf-mono" style={{ fontSize: 9, color: '#FFB800', letterSpacing: '2px' }}>STELLARFORGE.TOOLS</span>
          </div>
        </AdTile>
        {/* 4x5 */}
        <AdTile size={180} ratio="4/5" label="4:5 · IG FEED" color="#9B5DE5">
          <StarBG />
          <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', padding: 18 }}>
            <Wordmark />
            <div style={{ flex: 1, display: 'flex', alignItems: 'center' }}>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: 20, color: '#FAFAFA', letterSpacing: '0.04em', lineHeight: 1.1 }}>25<br/>INSTRUMENTS.<br/><span style={{ color: '#9B5DE5' }}>ONE SHIP.</span></div>
            </div>
            <div className="sf-mono" style={{ fontSize: 8, color: 'rgba(255,255,255,0.45)', letterSpacing: '2px' }}>EARLY ACCESS OPENS 05.28</div>
          </div>
        </AdTile>
      </div>

      {/* Video storyboards */}
      <div className="sf-label" style={{ marginBottom: 14 }}>VIDEO STORYBOARDS · 2 CONCEPTS</div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
        {/* SB 1 */}
        <div className="sf-panel" style={{ padding: 20 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
            <div>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: 16, color: 'var(--t1)', letterSpacing: '0.04em' }}>SB-01 · "INSTRUMENT PANEL"</div>
              <div className="sf-mono" style={{ fontSize: 10, color: 'var(--t4)', letterSpacing: '1.5px' }}>0:45 · 16:9 + 9:16 cutdowns · VO</div>
            </div>
            <StatusPill label="PRE-ROLL" color="#15C17B" />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8 }}>
            {[
              { t: '0:00', vis: 'BLACK', c: '#0A0E17', label: 'VO: "Somewhere in you..."' },
              { t: '0:08', vis: 'STAR', c: '#0A0E17', label: '"...is a world."' },
              { t: '0:18', vis: 'UI', c: '#0E1320', label: 'Cut to dashboard · 25 tools illuminate' },
              { t: '0:28', vis: 'CASCADE', c: '#FFB800', label: 'Slider nudges · biology reshapes' },
              { t: '0:36', vis: 'LOGO', c: '#15C17B', label: 'Logo · "BOARDING AUG 11"' },
              { t: '0:40', vis: 'CTA', c: '#0A0E17', label: 'URL · "stellarforge.tools"' },
              { t: '0:43', vis: 'TAG', c: '#0A0E17', label: '"These worlds exist in you."' },
              { t: '0:45', vis: 'END', c: '#0A0E17', label: 'Ship\'s Voice beep · end card' },
            ].map((f, i) => (
              <div key={i} style={{ background: f.c, aspectRatio: '16/9', position: 'relative', border: '1px solid var(--sf-border)', padding: 4 }}>
                <span className="sf-mono" style={{ fontSize: 7, color: 'rgba(255,255,255,0.5)', letterSpacing: '1px', position: 'absolute', top: 4, left: 4 }}>{f.t}</span>
                <div style={{ position: 'absolute', inset: 14, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <span className="sf-mono" style={{ fontSize: 8, color: i >= 4 ? '#3DFFCD' : 'rgba(255,255,255,0.7)', textAlign: 'center', letterSpacing: '0.5px' }}>{f.vis}</span>
                </div>
              </div>
            ))}
          </div>
          <div style={{ marginTop: 12, fontSize: 11, color: 'var(--t3)', lineHeight: 1.5 }}>
            Cold open on black with starfield. Slow VO (female, calm, slight synth processing). Cut to instrument panel at :18. Cascade demo at :28. End card hold 5s.
          </div>
        </div>

        {/* SB 2 */}
        <div className="sf-panel" style={{ padding: 20 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
            <div>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: 16, color: 'var(--t1)', letterSpacing: '0.04em' }}>SB-02 · "ONE SLIDER"</div>
              <div className="sf-mono" style={{ fontSize: 10, color: 'var(--t4)', letterSpacing: '1.5px' }}>0:30 · 9:16 native · no VO, text-on-screen</div>
            </div>
            <StatusPill label="TIKTOK/REEL" color="#FFB800" />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: 6 }}>
            {[
              { t: '0:00', label: 'HOOK: "change one number"', c: '#0A0E17' },
              { t: '0:03', label: 'Slider: gravity 1.0 → 1.4g', c: '#0E1320' },
              { t: '0:08', label: 'Biology panel morphs', c: '#001f0f' },
              { t: '0:13', label: 'Culture card reshuffles', c: '#1a0033' },
              { t: '0:18', label: 'Mythology flags "no fall"', c: '#0c1b3e' },
              { t: '0:25', label: 'TAG + CTA · logo', c: '#15C17B' },
            ].map((f, i) => (
              <div key={i} style={{ background: f.c, aspectRatio: '9/16', position: 'relative', border: '1px solid var(--sf-border)', padding: 4 }}>
                <span className="sf-mono" style={{ fontSize: 7, color: 'rgba(255,255,255,0.55)', position: 'absolute', top: 3, left: 3, letterSpacing: '1px' }}>{f.t}</span>
                <div style={{ position: 'absolute', inset: 4, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <span style={{ fontSize: 8, color: 'rgba(255,255,255,0.75)', textAlign: 'center', lineHeight: 1.2, letterSpacing: '0.5px' }}>{f.label}</span>
                </div>
              </div>
            ))}
          </div>
          <div style={{ marginTop: 12, fontSize: 11, color: 'var(--t3)', lineHeight: 1.5 }}>
            No VO. Aggressive kinetic typography over tight UI captures. Ambient pulse track. Text on screen delivers the cascade. End on the Cube + CTA.
          </div>
        </div>
      </div>
    </section>
  );
}

// -- PRESS / OUTREACH KIT --
function PressSection() {
  const outlets = [
    { n: 'Tor.com', tier: 'Tier 1', angle: 'Craft-of-SF piece: cascade framework', contact: 'pitches@tor.com' },
    { n: 'Locus Magazine', tier: 'Tier 1', angle: 'Tools-for-writers feature', contact: 'editorial@locusmag.com' },
    { n: 'The Verge', tier: 'Tier 1', angle: 'Creative-tool launch beat', contact: 'tips@theverge.com' },
    { n: 'Ars Technica', tier: 'Tier 2', angle: 'Science-fiction-meets-simulation angle', contact: 'tips@arstechnica.com' },
    { n: 'Lightspeed Mag', tier: 'Tier 2', angle: 'Q&A with Jason Batt', contact: 'editor@lightspeedmagazine.com' },
    { n: 'Reactor Mag', tier: 'Tier 2', angle: 'Worldbuilding column tie-in', contact: 'editorial@reactormag.com' },
    { n: 'Clarkesworld', tier: 'Tier 3', angle: 'Essay: instrument-panel philosophy', contact: 'neil@clarkesworldmagazine.com' },
    { n: 'The Mary Sue', tier: 'Tier 3', angle: 'Feature: SF tool launch', contact: 'tips@themarysue.com' },
  ];
  const creators = [
    { n: 'Hello Future Me', platform: 'YouTube', fit: 'Craft/worldbuilding-focused essayist' },
    { n: 'Brandon Sanderson', platform: 'YouTube/BookTube', fit: 'Fantasy but adjacent; huge worldbuilding audience' },
    { n: 'Abbie Emmons', platform: 'YouTube', fit: 'Writing craft, strong indie author audience' },
    { n: 'Jed Herne', platform: 'YouTube/Podcast', fit: "\"On Writing\" SF worldbuilding" },
    { n: 'Tale Foundry', platform: 'YouTube', fit: 'Speculative storytelling essayist' },
    { n: 'BookTok authors (15)', platform: 'TikTok', fit: 'Indie SF/romantasy crossovers' },
  ];

  return (
    <section>
      <SectionHeader
        code="// SECTOR 07 · PRESS & OUTREACH"
        title="Who we pitch, what we say"
        subtitle="Tiered press list with tailored angles, a one-pager press kit, creator seeding list, and a pitch template. Embargoed briefs go out T-7; non-embargoed blurbs release launch day."
        accent="#9B5DE5"
      />

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 28 }}>
        {/* Press list */}
        <div className="sf-panel" style={{ padding: 20 }}>
          <div className="sf-label" style={{ marginBottom: 14 }}>TIERED PRESS LIST · 8 OUTLETS</div>
          {outlets.map((o, i) => (
            <div key={i} style={{ display: 'grid', gridTemplateColumns: '140px 60px 1fr', gap: 10, padding: '10px 0', borderTop: i ? '1px solid var(--sf-border)' : 'none', alignItems: 'start' }}>
              <div>
                <div style={{ fontSize: 13, color: 'var(--t1)', fontWeight: 500 }}>{o.n}</div>
                <div className="sf-mono" style={{ fontSize: 9, color: 'var(--t4)', letterSpacing: '1.5px', marginTop: 2 }}>{o.contact}</div>
              </div>
              <span className="sf-tag sf-tag--violet" style={{ height: 'fit-content' }}>{o.tier}</span>
              <div style={{ fontSize: 11, color: 'var(--t3)', lineHeight: 1.5 }}>{o.angle}</div>
            </div>
          ))}
        </div>
        {/* Creators */}
        <div className="sf-panel" style={{ padding: 20 }}>
          <div className="sf-label" style={{ marginBottom: 14 }}>CREATOR SEEDING · 6 GROUPS</div>
          {creators.map((c, i) => (
            <div key={i} style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: 10, padding: '12px 0', borderTop: i ? '1px solid var(--sf-border)' : 'none' }}>
              <div>
                <div style={{ fontSize: 13, color: 'var(--t1)' }}>{c.n}</div>
                <div style={{ fontSize: 11, color: 'var(--t3)', marginTop: 2 }}>{c.fit}</div>
              </div>
              <span className="sf-tag sf-tag--azure" style={{ height: 'fit-content' }}>{c.platform}</span>
            </div>
          ))}
          <div className="sf-divider" style={{ margin: '16px 0' }} />
          <div className="sf-label" style={{ marginBottom: 8 }}>OFFER</div>
          <p style={{ fontSize: 12, color: 'var(--t2)', lineHeight: 1.5, margin: 0 }}>
            90-day free Pro, personalized onboarding call with Jason, early-access code for followers (trackable), custom "Build a World" video prompt with revenue-share for first 90 days.
          </p>
        </div>
      </div>

      {/* Pitch template */}
      <div className="sf-panel sf-panel--glow" style={{ padding: 24, marginBottom: 28 }}>
        <div className="sf-label" style={{ marginBottom: 14 }}>COLD PITCH TEMPLATE · PRESS (~170 WORDS)</div>
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--t2)', lineHeight: 1.8, background: 'rgba(0,0,0,0.3)', padding: 18, border: '1px solid var(--sf-border)' }}>
          <div style={{ color: '#3DFFCD' }}>SUBJECT: For August 11 — instrument panel for SF writers (embargoed)</div>
          <br />
          Hi {'{NAME}'},<br/><br/>
          I'm Jason Batt. I teach science fiction at {'<redacted>'} and I've spent the last two years building a platform I wish existed when I was learning the craft: <span style={{ color: '#FAFAFA' }}>StellarForge</span> — 25 interconnected worldbuilding tools organized around one principle: worlds cascade. Change the gravity, and you've changed the biology, the politics, and the mythology downstream.<br/><br/>
          We open Early Access on <span style={{ color: '#15C17B' }}>August 11</span>. I'd love to offer {'{OUTLET}'} an embargoed first look — private demo, interview, and a preview code for your readers.<br/><br/>
          Short deck attached. Live site: <span style={{ color: '#3DFFCD' }}>stellarforge.tools</span>. Embargoed until 2026-08-11 12:01 PT.<br/><br/>
          Happy to tailor the angle to your editorial calendar. I can hop on a call this week.<br/><br/>
          — Jason Batt, Ph.D.<br/>
          jbatt@stellarforge.tools · 303.xxx.xxxx
        </div>
      </div>

      {/* Press one-pager preview */}
      <div className="sf-label" style={{ marginBottom: 14 }}>PRESS ONE-PAGER · LETTER · BLACK</div>
      <div style={{ background: '#0A0E17', border: '1px solid var(--sf-border)', padding: 34, maxWidth: 640, position: 'relative' }}>
        <StarBG />
        <div style={{ position: 'relative' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
            <Wordmark />
            <StatusPill label="PRESS KIT · 2026.08" color="#9B5DE5" dot={false} />
          </div>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: 30, color: 'var(--t1)', letterSpacing: '0.05em', lineHeight: 1.1, marginBottom: 14 }}>
            THE INSTRUMENT PANEL FOR<br/><span style={{ color: '#15C17B' }}>SCIENCE FICTION WRITERS.</span>
          </div>
          <p style={{ fontSize: 12.5, color: 'var(--t2)', lineHeight: 1.6, marginBottom: 18 }}>
            StellarForge.tools is a worldbuilding platform built around the <strong style={{ color: 'var(--t1)' }}>Environmental Cascade</strong>: physics → environment → biology → psychology → mythology → culture. Twenty-five interconnected tools help SF writers build worlds with scientific rigor instead of generator-randomness. Early Access opens August 11, 2026.
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 18 }}>
            <div>
              <div className="sf-label">INSTRUMENTS</div>
              <div className="sf-mono" style={{ fontSize: 18, color: '#FAFAFA', letterSpacing: '0.04em', marginTop: 4 }}>25 TOOLS · 5 SIMS</div>
            </div>
            <div>
              <div className="sf-label">PRICING</div>
              <div className="sf-mono" style={{ fontSize: 18, color: '#FAFAFA', letterSpacing: '0.04em', marginTop: 4 }}>FREE → $4.99/MO</div>
            </div>
            <div>
              <div className="sf-label">FOUNDER</div>
              <div className="sf-mono" style={{ fontSize: 18, color: '#FAFAFA', letterSpacing: '0.04em', marginTop: 4 }}>JASON D. BATT</div>
            </div>
          </div>
          <div className="sf-divider" style={{ margin: '16px 0' }} />
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <div>
              <div className="sf-label" style={{ marginBottom: 6 }}>KEY QUOTES</div>
              <p style={{ fontSize: 11, color: 'var(--t3)', fontStyle: 'italic', lineHeight: 1.5, margin: 0 }}>
                "Most worldbuilding tools generate. Ours cascade. Change one thing; everything downstream shifts." — Jason Batt
              </p>
            </div>
            <div>
              <div className="sf-label" style={{ marginBottom: 6 }}>CONTACT</div>
              <div className="sf-mono" style={{ fontSize: 10, color: 'var(--t2)', letterSpacing: '1px', lineHeight: 1.6 }}>
                press@stellarforge.tools<br/>stellarforge.tools/press<br/>39.87°N · 104.97°W
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

Object.assign(window, { EmailsSection, AdsSection, PressSection });
