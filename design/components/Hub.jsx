// Landing page CTA module + hub assembly

function HeroLandingSection() {
  return (
    <section>
      <SectionHeader
        code="// SECTOR 08 · EARLY-ACCESS LANDING"
        title="The waitlist page"
        subtitle="A standalone conversion surface for the paid ads, creator links, and press CTAs. Mobile-first, black-on-black, single form field. Fires a trackable signup event."
        accent="#3DFFCD"
      />
      <div style={{ display: 'flex', gap: 12, marginBottom: 18 }}>
        <a className="sf-btn" href="Landing Page.html" target="_blank">OPEN LANDING PAGE →</a>
        <a className="sf-btn sf-btn--ghost" href="Pitch Deck.html" target="_blank">OPEN PITCH DECK →</a>
      </div>
      <div className="sf-panel" style={{ padding: 0, overflow: 'hidden' }}>
        <iframe src="Landing Page.html" style={{ width: '100%', height: 620, border: 0, display: 'block', background: '#0A0E17' }} />
      </div>
    </section>
  );
}

function StyleGuideSection() {
  return (
    <section>
      <SectionHeader
        code="// SECTOR 09 · AESTHETIC SYSTEM"
        title="The style guide"
        subtitle="The canonical reference. Every token, component, pattern and principle the campaign ships with. If it's not in here, it doesn't belong in the ship."
        accent="#15C17B"
      />
      <div style={{ display: 'flex', gap: 12, marginBottom: 18 }}>
        <a className="sf-btn" href="Style Guide.html" target="_blank">OPEN FULL GUIDE →</a>
      </div>
      <div className="sf-panel" style={{ padding: 0, overflow: 'hidden' }}>
        <iframe src="Style Guide.html" style={{ width: '100%', height: 720, border: 0, display: 'block', background: '#0A0E17' }} />
      </div>
    </section>
  );
}

// ---------- HUB ASSEMBLY ----------

const SECTIONS = [
  { id: 'brief', label: 'BRIEF & PHASES', code: '01', Comp: () => <StrategySection />, accent: '#15C17B' },
  { id: 'directions', label: 'CREATIVE DIRECTIONS', code: '02', Comp: () => <><DirectionsSection /><PromotionalDrops /></>, accent: '#4D9FFF' },
  { id: 'calendar', label: 'CONTENT CALENDAR', code: '03', Comp: () => <CalendarSection />, accent: '#FFB800' },
  { id: 'social', label: 'SOCIAL ARTIFACTS', code: '04', Comp: () => <SocialSection />, accent: '#FF00AA' },
  { id: 'emails', label: 'EMAIL SEQUENCE', code: '05', Comp: () => <EmailsSection />, accent: '#FFB347' },
  { id: 'ads', label: 'AD CREATIVE', code: '06', Comp: () => <AdsSection />, accent: '#FF3366' },
  { id: 'press', label: 'PRESS & OUTREACH', code: '07', Comp: () => <PressSection />, accent: '#9B5DE5' },
  { id: 'landing', label: 'LANDING & DECK', code: '08', Comp: () => <HeroLandingSection />, accent: '#3DFFCD' },
  { id: 'styleguide', label: 'STYLE GUIDE', code: '09', Comp: () => <StyleGuideSection />, accent: '#15C17B' },
];

function Hub() {
  const [active, setActive] = React.useState('brief');
  const Active = SECTIONS.find(s => s.id === active);

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '260px 1fr', minHeight: '100vh' }} data-screen-label="Campaign Hub">
      <aside style={{
        borderRight: '1px solid var(--sf-border)',
        background: 'rgba(10,14,23,0.7)', backdropFilter: 'blur(12px)',
        position: 'sticky', top: 0, alignSelf: 'start', height: '100vh',
        padding: '26px 18px', display: 'flex', flexDirection: 'column', gap: 18, zIndex: 5
      }}>
        <div>
          <Wordmark />
          <div className="sf-mono" style={{ fontSize: 9, color: 'var(--t4)', letterSpacing: '2px', marginTop: 8 }}>LAUNCH CAMPAIGN · 2026.08</div>
          <StatusPill label="T-33 DAYS" color="#FFB800" />
        </div>
        <nav style={{ display: 'flex', flexDirection: 'column', gap: 2, marginTop: 10 }}>
          {SECTIONS.map(s => (
            <button key={s.id} onClick={() => setActive(s.id)} style={{
              background: active === s.id ? `${s.accent}0D` : 'transparent',
              border: 'none', borderLeft: active === s.id ? `2px solid ${s.accent}` : '2px solid transparent',
              color: active === s.id ? 'var(--t1)' : 'var(--t3)',
              fontFamily: 'var(--font-sans)', fontSize: 12, letterSpacing: '1.2px', textTransform: 'uppercase',
              padding: '10px 14px', textAlign: 'left', cursor: 'pointer', display: 'flex', gap: 10, alignItems: 'center',
              fontWeight: 500, transition: 'all 150ms'
            }}>
              <span className="sf-mono" style={{ color: s.accent, fontSize: 10, letterSpacing: '1px' }}>{s.code}</span>
              <span>{s.label}</span>
            </button>
          ))}
        </nav>
        <div style={{ marginTop: 'auto', paddingTop: 20, borderTop: '1px solid var(--sf-border)' }}>
          <div className="sf-label" style={{ marginBottom: 8 }}>FOR</div>
          <div style={{ fontSize: 12, color: 'var(--t2)' }}>Jason D. Batt, Ph.D.</div>
          <div className="sf-mono" style={{ fontSize: 10, color: 'var(--t4)', letterSpacing: '1.5px', marginTop: 4 }}>STELLARFORGE.TOOLS</div>
          <div className="sf-mono" style={{ fontSize: 9, color: 'var(--t5)', letterSpacing: '1.5px', marginTop: 10 }}>39.87°N · 104.97°W</div>
        </div>
      </aside>

      <main style={{ padding: '36px 44px 80px', position: 'relative', zIndex: 2 }}>
        {/* Top bar */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 32, paddingBottom: 16, borderBottom: '1px solid var(--sf-border)' }}>
          <div>
            <div className="sf-mono" style={{ fontSize: 10, color: 'var(--t4)', letterSpacing: '2px' }}>// CAMPAIGN MANIFEST · v1.0</div>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: 18, color: 'var(--t1)', letterSpacing: '0.06em', marginTop: 4 }}>BOARDING AUG 11, 2026</div>
          </div>
          <div style={{ display: 'flex', gap: 10 }}>
            <StatusPill label="SIGNAL" color="#5B8DEF" dot={false} />
            <StatusPill label="IGNITE" color="#FFB800" dot={false} />
            <StatusPill label="IGNITION" color="#15C17B" />
            <StatusPill label="ORBIT" color="#9B5DE5" dot={false} />
          </div>
        </div>

        {Active && <Active.Comp />}

        <div style={{ marginTop: 60, paddingTop: 24, borderTop: '1px solid var(--sf-border)', display: 'flex', justifyContent: 'space-between' }}>
          <span className="sf-mono" style={{ fontSize: 10, color: 'var(--t5)', letterSpacing: '2px' }}>© 2026 STELLARFORGE · CAMPAIGN MANIFEST</span>
          <span className="sf-mono" style={{ fontSize: 10, color: 'var(--t5)', letterSpacing: '2px' }}>THESE WORLDS EXIST IN YOU.</span>
        </div>
      </main>
    </div>
  );
}

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<Hub />);
