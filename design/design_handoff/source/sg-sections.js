// StellarForge Style Guide — section content
// Injected into #sgSections as innerHTML.

(function() {
  const parts = [];

  // ───────────────────────────────────────────── 00 PRINCIPLES
  parts.push(`
<section id="principles" class="sg-sec sg-anchor">
  <div class="sg-sec-head">
    <div class="sg-sec-head-l">
      <div class="sg-sec-code">// 00 · PRINCIPLES</div>
      <h2>Six laws<br/>of the ship.</h2>
    </div>
    <div class="sg-sec-head-r">StellarForge is not a website dressed up as a spaceship. It is a spaceship that happens to run in a browser. These six principles govern every design decision.</div>
  </div>

  <div class="sg-grid-3" style="gap:16px;">
    <div class="sg-card">
      <div style="font-family:var(--font-mono); font-size:11px; color:var(--sf-teal); letter-spacing:2px; margin-bottom:10px;">LAW I</div>
      <div style="font-family:var(--font-display); font-weight:300; font-size:24px; color:var(--t1); letter-spacing:0.04em; margin-bottom:10px;">Instrument, not app.</div>
      <p style="font-size:13px; color:var(--t3); line-height:1.6; margin:0;">Every surface is a readout, a panel, a control. We never say "dashboard" when "bridge" will do.</p>
    </div>
    <div class="sg-card">
      <div style="font-family:var(--font-mono); font-size:11px; color:var(--sf-teal); letter-spacing:2px; margin-bottom:10px;">LAW II</div>
      <div style="font-family:var(--font-display); font-weight:300; font-size:24px; color:var(--t1); letter-spacing:0.04em; margin-bottom:10px;">Zero is the radius.</div>
      <p style="font-size:13px; color:var(--t3); line-height:1.6; margin:0;">Primary containers never round. The only exceptions: micro-tags (2px) and the simulator legacy shell.</p>
    </div>
    <div class="sg-card">
      <div style="font-family:var(--font-mono); font-size:11px; color:var(--sf-teal); letter-spacing:2px; margin-bottom:10px;">LAW III</div>
      <div style="font-family:var(--font-display); font-weight:300; font-size:24px; color:var(--t1); letter-spacing:0.04em; margin-bottom:10px;">Warmth from precision.</div>
      <p style="font-size:13px; color:var(--t3); line-height:1.6; margin:0;">The ship is not cold. It is calibrated. A well-tuned instrument shows care through accuracy, not sentiment.</p>
    </div>
    <div class="sg-card">
      <div style="font-family:var(--font-mono); font-size:11px; color:var(--sf-teal); letter-spacing:2px; margin-bottom:10px;">LAW IV</div>
      <div style="font-family:var(--font-display); font-weight:300; font-size:24px; color:var(--t1); letter-spacing:0.04em; margin-bottom:10px;">Monospace is truth.</div>
      <p style="font-size:13px; color:var(--t3); line-height:1.6; margin:0;">Data, coordinates, states, telemetry — mono. Prose is proportional. Never mix the intent.</p>
    </div>
    <div class="sg-card">
      <div style="font-family:var(--font-mono); font-size:11px; color:var(--sf-teal); letter-spacing:2px; margin-bottom:10px;">LAW V</div>
      <div style="font-family:var(--font-display); font-weight:300; font-size:24px; color:var(--t1); letter-spacing:0.04em; margin-bottom:10px;">Accent is semantic.</div>
      <p style="font-size:13px; color:var(--t3); line-height:1.6; margin:0;">Color isn't decoration — it tags the cascade layer. Amber = physics. Azure = environment. Emerald = life. Violet = civilization.</p>
    </div>
    <div class="sg-card">
      <div style="font-family:var(--font-mono); font-size:11px; color:var(--sf-teal); letter-spacing:2px; margin-bottom:10px;">LAW VI</div>
      <div style="font-family:var(--font-display); font-weight:300; font-size:24px; color:var(--t1); letter-spacing:0.04em; margin-bottom:10px;">Negative space breathes.</div>
      <p style="font-size:13px; color:var(--t3); line-height:1.6; margin:0;">The void is a feature. Don't fill every pixel. The instrument panel needs dark between the readouts.</p>
    </div>
  </div>

  <div style="margin-top: 32px;" class="sg-rule">
    <b>Reading test.</b> If you removed the typography but kept spacing and color, could a user still tell this was StellarForge and not "another sci-fi SaaS"? If the answer is no, the design is wearing the costume without being the thing.
  </div>
</section>
  `);

  // ───────────────────────────────────────────── 01 TOKENS
  parts.push(`
<section id="tokens" class="sg-sec sg-anchor">
  <div class="sg-sec-head">
    <div class="sg-sec-head-l">
      <div class="sg-sec-code">// 01 · DESIGN TOKENS</div>
      <h2>The source<br/>of truth.</h2>
    </div>
    <div class="sg-sec-head-r">Every value below already exists as a CSS custom property in <code style="font-family:var(--font-mono); color:var(--sf-teal);">shared.css</code>. Never hardcode — always reference the token.</div>
  </div>

  <div class="sg-sub">Backgrounds &amp; borders</div>
  <div class="sg-grid-4">
    ${token('--sf-void', '#0A0E17', 'Base canvas')}
    ${token('--sf-surface', '#0E1320', 'Panel body')}
    ${token('--sf-surface-elevated', '#161C2B', 'Elevated / hover')}
    ${token('--sf-surface-80', 'rgba(14,19,32,.9)', 'Glass panel')}
    ${token('--sf-border', 'rgba(255,255,255,.08)', 'Default stroke')}
    ${token('--sf-border-strong', 'rgba(255,255,255,.14)', 'Emphasis stroke')}
  </div>

  <div class="sg-sub">Text tiers</div>
  <div class="sg-grid-4">
    ${token('--t1', '#FAFAFA', 'Primary text')}
    ${token('--t2', '#C8C8C8', 'Body text')}
    ${token('--t3', 'rgba(255,255,255,.45)', 'Muted / eyebrow')}
    ${token('--t4', 'rgba(255,255,255,.28)', 'Tertiary / chrome')}
    ${token('--t5', 'rgba(255,255,255,.15)', 'Disabled / decorative')}
  </div>

  <div class="sg-sub">Tracking (letter-spacing)</div>
  <table class="sg-table">
    <thead><tr><th>Token</th><th>Value</th><th>Use</th></tr></thead>
    <tbody>
      <tr><td>--tr-title</td><td>0.08em</td><td>Display headlines (MD Nichrome)</td></tr>
      <tr><td>--tr-wide</td><td>0.2em</td><td>Eyebrows, section labels, buttons</td></tr>
      <tr><td>--tr-ultra</td><td>0.4em</td><td>Chrome labels, system monograms</td></tr>
    </tbody>
  </table>

  <div class="sg-sub">Using tokens</div>
  <div class="sg-code"><span class="c">/* YES — reference the token */</span>
.my-panel {
  background: <span class="k">var</span>(<span class="v">--sf-surface-80</span>);
  border: <span class="s">1px solid</span> <span class="k">var</span>(<span class="v">--sf-border</span>);
  color: <span class="k">var</span>(<span class="v">--t2</span>);
}

<span class="c">/* NO — hardcoded values drift over time */</span>
.my-panel { background: <span class="s">#0E1320</span>; border: <span class="s">1px solid rgba(255,255,255,.08)</span>; }</div>
</section>
  `);

  // Helper
  function token(name, value, label) {
    const isRgba = value.startsWith('rgba');
    const swatch = isRgba ? value : value;
    return `
      <div class="sg-card" style="padding:0; overflow:hidden;">
        <div style="background:${swatch}; height:72px; border-bottom:1px solid var(--sf-border); ${isRgba ? 'background-image: linear-gradient(45deg,rgba(255,255,255,.04) 25%,transparent 25%,transparent 75%,rgba(255,255,255,.04) 75%),linear-gradient(45deg,rgba(255,255,255,.04) 25%,transparent 25%,transparent 75%,rgba(255,255,255,.04) 75%); background-size:12px 12px; background-position:0 0, 6px 6px; background-color: var(--sf-void);' : ''}"></div>
        <div style="padding:14px 16px;">
          <div style="font-family:var(--font-mono); font-size:11px; color:var(--sf-teal-bright); letter-spacing:1px;">${name}</div>
          <div style="font-family:var(--font-mono); font-size:10px; color:var(--t4); margin-top:3px;">${value}</div>
          <div style="font-size:11px; color:var(--t3); margin-top:8px; font-family:var(--font-heading); letter-spacing:1px; text-transform:uppercase;">${label}</div>
        </div>
      </div>
    `;
  }

  // ───────────────────────────────────────────── 02 COLOR
  parts.push(`
<section id="color" class="sg-sec sg-anchor">
  <div class="sg-sec-head">
    <div class="sg-sec-head-l">
      <div class="sg-sec-code">// 02 · COLOR SYSTEM</div>
      <h2>Color carries<br/>meaning.</h2>
    </div>
    <div class="sg-sec-head-r">Accents are never decorative. Each maps to a cascade layer or a system state. Use only the assigned color for its assigned purpose.</div>
  </div>

  <div class="sg-sub">Cascade accents — semantic</div>
  <div style="display:grid; grid-template-columns:repeat(6,1fr); gap:12px;">
    ${cascade('PHYSICS', 'Stars &amp; Systems', '#FFB800', '--sf-amber', 'Orrery, Goldilocks, Drake, Paradox')}
    ${cascade('ENVIRONMENT', 'Worlds', '#4D9FFF', '--sf-azure', 'Genesis, Atlas, Gravitas, Tidelock')}
    ${cascade('BIOLOGY', 'Life', '#00FF88', '--sf-emerald', 'Phylo, Sensorium, Symbiosis')}
    ${cascade('CIVILIZATION', 'Civilizations', '#9B5DE5', '--sf-violet', 'Axiom, Vessel, Impulse, Dominion')}
    ${cascade('MYTHOLOGY', 'Mythology', '#5B8DEF', '--sf-stellar', 'Mythos, cultural matrix')}
    ${cascade('INTEGRATION', 'Meta', '#15C17B', '--sf-teal', 'Cascade, Timeline, Workshop')}
  </div>

  <div class="sg-sub">System accents</div>
  <div class="sg-grid-4">
    ${sysColor('#3DFFCD', '--sf-teal-bright', 'Hover glow, focus ring, active nav')}
    ${sysColor('#00D4FF', '--sf-cyan', 'Legacy simulator accent (cyan shell)')}
    ${sysColor('#FF3366', '--sf-crimson', 'Errors, destructive actions, warnings')}
    ${sysColor('#FF00AA', '--sf-magenta', 'Seasonal / campaign accent only')}
  </div>

  <div class="sg-sub">Accessibility contrast</div>
  <table class="sg-table">
    <thead><tr><th>Pair</th><th>Ratio</th><th>Verdict</th></tr></thead>
    <tbody>
      <tr><td>--t1 on --sf-void</td><td>16.8 : 1</td><td style="color:var(--sf-teal);">AAA — headings, body</td></tr>
      <tr><td>--t2 on --sf-void</td><td>11.2 : 1</td><td style="color:var(--sf-teal);">AAA — body text</td></tr>
      <tr><td>--t3 on --sf-void</td><td>4.9 : 1</td><td style="color:var(--sf-amber);">AA — eyebrows, labels only</td></tr>
      <tr><td>--t4 on --sf-void</td><td>3.1 : 1</td><td style="color:var(--sf-crimson);">Chrome only — never body copy</td></tr>
      <tr><td>--sf-teal on --sf-void</td><td>7.4 : 1</td><td style="color:var(--sf-teal);">AAA large — use for CTA text on dark</td></tr>
    </tbody>
  </table>

  <div class="sg-do-dont" style="margin-top:24px;">
    <div class="sg-do">
      <div class="sg-do-label">DO</div>
      <p style="font-size:13px; color:var(--t2); margin:0;">Use Azure for every "Worlds" tool — header chip, progress bar, accent glow. The user learns the color = domain.</p>
    </div>
    <div class="sg-dont">
      <div class="sg-dont-label">DON'T</div>
      <p style="font-size:13px; color:var(--t2); margin:0;">Pick an accent "because it looks nice" on this screen. If you can't name its cascade layer, don't use it.</p>
    </div>
  </div>
</section>
  `);

  function cascade(tier, label, hex, token, tools) {
    return `
      <div class="sg-card" style="padding:0; overflow:hidden; border-top:3px solid ${hex};">
        <div style="height:56px; background: linear-gradient(135deg, ${hex}22, transparent 70%); border-bottom:1px solid var(--sf-border); position:relative;">
          <div style="position:absolute; bottom:10px; left:14px; font-family:var(--font-mono); font-size:9px; letter-spacing:2px; color:${hex}; text-transform:uppercase;">${tier}</div>
        </div>
        <div style="padding:14px;">
          <div style="font-family:var(--font-display); font-size:16px; color:var(--t1); letter-spacing:0.04em;">${label}</div>
          <div style="font-family:var(--font-mono); font-size:10px; color:${hex}; margin-top:4px;">${hex}</div>
          <div style="font-family:var(--font-mono); font-size:9px; color:var(--t4); margin-top:2px;">${token}</div>
          <div style="font-size:11px; color:var(--t3); margin-top:10px; line-height:1.5;">${tools}</div>
        </div>
      </div>
    `;
  }

  function sysColor(hex, token, use) {
    return `
      <div class="sg-card" style="padding:0; overflow:hidden;">
        <div style="background:${hex}; height:56px; border-bottom:1px solid var(--sf-border);"></div>
        <div style="padding:12px 14px;">
          <div style="font-family:var(--font-mono); font-size:11px; color:${hex}; letter-spacing:1px;">${hex}</div>
          <div style="font-family:var(--font-mono); font-size:10px; color:var(--t4); margin-top:3px;">${token}</div>
          <div style="font-size:11px; color:var(--t3); margin-top:8px;">${use}</div>
        </div>
      </div>
    `;
  }

  // ───────────────────────────────────────────── 03 TYPE
  parts.push(`
<section id="type" class="sg-sec sg-anchor">
  <div class="sg-sec-head">
    <div class="sg-sec-head-l">
      <div class="sg-sec-code">// 03 · TYPOGRAPHY</div>
      <h2>Four typefaces.<br/>Strict roles.</h2>
    </div>
    <div class="sg-sec-head-r">Each typeface has exactly one job. Use the wrong one and the ship loses its voice.</div>
  </div>

  <!-- Typeface cards -->
  <div style="display:grid; grid-template-columns:repeat(2,1fr); gap:20px;">

    <div class="sg-card">
      <div style="font-family:var(--font-mono); font-size:10px; color:var(--sf-teal); letter-spacing:2px; margin-bottom:8px;">DISPLAY · --font-display</div>
      <div style="font-family: var(--font-display); font-weight:300; font-size:72px; color:var(--t1); letter-spacing:0.04em; line-height:0.95; margin:4px 0 12px;">MD Nichrome</div>
      <div style="font-family: var(--font-display); font-weight:300; font-size:28px; color:var(--t2); letter-spacing:0.04em;">Aa Bb Cc 0123</div>
      <div style="margin-top:14px; font-size:12px; color:var(--t3); line-height:1.6;">
        <b style="color:var(--t1);">Use:</b> H1 page titles, hero headlines, slide titles.<br/>
        <b style="color:var(--t1);">Never:</b> buttons, body copy, navigation, data.<br/>
        <b style="color:var(--t1);">Weights:</b> 300, 400 only.
      </div>
    </div>

    <div class="sg-card">
      <div style="font-family:var(--font-mono); font-size:10px; color:var(--sf-teal); letter-spacing:2px; margin-bottom:8px;">HEADING · --font-heading</div>
      <div style="font-family: var(--font-heading); font-weight:400; font-size:52px; color:var(--t1); letter-spacing:0.1em; line-height:1; margin:4px 0 12px; text-transform:uppercase;">Jura</div>
      <div style="font-family: var(--font-heading); font-weight:400; font-size:22px; color:var(--t2); letter-spacing:0.1em; text-transform:uppercase;">AA BB CC 0123</div>
      <div style="margin-top:14px; font-size:12px; color:var(--t3); line-height:1.6;">
        <b style="color:var(--t1);">Use:</b> Section headers, nav items, eyebrows, uppercase labels.<br/>
        <b style="color:var(--t1);">Never:</b> sentences, running copy.<br/>
        <b style="color:var(--t1);">Weights:</b> 300, 400, 500, 600.
      </div>
    </div>

    <div class="sg-card">
      <div style="font-family:var(--font-mono); font-size:10px; color:var(--sf-teal); letter-spacing:2px; margin-bottom:8px;">SANS · --font-sans</div>
      <div style="font-family: 'DM Sans', sans-serif; font-weight:400; font-size:52px; color:var(--t1); letter-spacing:-0.01em; line-height:1; margin:4px 0 12px;">DM Sans</div>
      <div style="font-family: 'DM Sans', sans-serif; font-weight:400; font-size:16px; color:var(--t2); line-height:1.6;">The quick brown fox jumps over the lazy dog. Precision does not preclude warmth; it merely organizes it.</div>
      <div style="margin-top:14px; font-size:12px; color:var(--t3); line-height:1.6;">
        <b style="color:var(--t1);">Use:</b> Body text, all button labels, UI copy.<br/>
        <b style="color:var(--t1);">Weights:</b> 300, 400, 500.
      </div>
    </div>

    <div class="sg-card">
      <div style="font-family:var(--font-mono); font-size:10px; color:var(--sf-teal); letter-spacing:2px; margin-bottom:8px;">MONO · --font-mono</div>
      <div style="font-family: 'JetBrains Mono', monospace; font-weight:400; font-size:40px; color:var(--t1); letter-spacing:0.02em; line-height:1; margin:4px 0 12px;">JetBrains&nbsp;Mono</div>
      <div style="font-family: 'JetBrains Mono', monospace; font-weight:400; font-size:14px; color:var(--sf-teal-bright); letter-spacing:0.04em;">// COORDS 39.87°N · 104.97°W · M 1.024 M⊕ · γ 1.414</div>
      <div style="margin-top:14px; font-size:12px; color:var(--t3); line-height:1.6;">
        <b style="color:var(--t1);">Use:</b> Data readouts, coordinates, status codes, telemetry, // prefixes, tags.<br/>
        <b style="color:var(--t1);">Weights:</b> 400, 500.
      </div>
    </div>
  </div>

  <div class="sg-sub">Type scale</div>
  <table class="sg-table">
    <thead><tr><th>Role</th><th>Font</th><th>Size / Weight / Tracking</th><th>Example</th></tr></thead>
    <tbody>
      <tr><td>hero</td><td>MD Nichrome</td><td>96 / 300 / 0.03em</td><td style="font-family:var(--font-display); font-size:28px; color:var(--t1); letter-spacing:0.03em; font-weight:300;">All Systems Online</td></tr>
      <tr><td>h1</td><td>MD Nichrome</td><td>56 / 300 / 0.04em</td><td style="font-family:var(--font-display); font-size:22px; color:var(--t1); letter-spacing:0.04em; font-weight:300;">Genesis: Planetary Profile</td></tr>
      <tr><td>h2</td><td>Jura</td><td>28 / 400 / 0.1em · UPPER</td><td style="font-family:var(--font-heading); font-size:16px; color:var(--t1); letter-spacing:0.1em; text-transform:uppercase;">Configuration</td></tr>
      <tr><td>h3</td><td>Jura</td><td>18 / 500 / 0.1em · UPPER</td><td style="font-family:var(--font-heading); font-size:12px; color:var(--t1); letter-spacing:0.1em; text-transform:uppercase; font-weight:500;">Orbital Parameters</td></tr>
      <tr><td>body-lg</td><td>DM Sans</td><td>18 / 400 / normal</td><td style="font-family:var(--font-sans); font-size:15px; color:var(--t2);">The ship reports atmospheric density.</td></tr>
      <tr><td>body</td><td>DM Sans</td><td>15 / 400 / normal</td><td style="font-family:var(--font-sans); font-size:13px; color:var(--t2);">Surface gravity equals 9.81 m/s².</td></tr>
      <tr><td>eyebrow</td><td>Jura</td><td>11 / 500 / 0.2em · UPPER</td><td style="font-family:var(--font-heading); font-size:10px; color:var(--t3); letter-spacing:0.2em; text-transform:uppercase; font-weight:500;">// SECTOR · PHYSICS</td></tr>
      <tr><td>label</td><td>DM Sans</td><td>11 / 500 / 1.5px · UPPER</td><td style="font-family:var(--font-sans); font-size:10px; color:var(--t3); letter-spacing:1.5px; text-transform:uppercase; font-weight:500;">World Name</td></tr>
      <tr><td>data</td><td>JetBrains Mono</td><td>13 / 400 / 0.02em</td><td style="font-family:var(--font-mono); font-size:12px; color:var(--sf-teal-bright);">M 1.024 · R 1.017 · g 0.997</td></tr>
      <tr><td>caption</td><td>JetBrains Mono</td><td>10 / 400 / 0.2em · UPPER</td><td style="font-family:var(--font-mono); font-size:9px; color:var(--t4); letter-spacing:0.2em;">TRANSMISSION COMPLETE</td></tr>
    </tbody>
  </table>

  <div class="sg-do-dont" style="margin-top:24px;">
    <div class="sg-do">
      <div class="sg-do-label">DO</div>
      <p style="font-size:13px; color:var(--t2); margin:0;">Pair Nichrome headlines with DM Sans body. Use Jura as the connective tissue — section headers, eyebrows. Reserve mono for data.</p>
    </div>
    <div class="sg-dont">
      <div class="sg-dont-label">DON'T</div>
      <p style="font-size:13px; color:var(--t2); margin:0;">Set body copy in Jura. Set buttons in Nichrome. Mix Inter or Roboto in — they break the voice immediately.</p>
    </div>
  </div>
</section>
  `);

  // ───────────────────────────────────────────── 04 SPACE & GRID
  parts.push(`
<section id="space" class="sg-sec sg-anchor">
  <div class="sg-sec-head">
    <div class="sg-sec-head-l">
      <div class="sg-sec-code">// 04 · SPACE &amp; GRID</div>
      <h2>4-unit ladder.<br/>No radii.</h2>
    </div>
    <div class="sg-sec-head-r">Spacing steps in 4px increments. Layouts use a 12-column grid at 1440 with 24px gutters; for tool pages, prefer 8-column with 32px gutters inside the reading pane.</div>
  </div>

  <div class="sg-sub">Spacing scale</div>
  <div style="display:grid; grid-template-columns:repeat(10,1fr); gap:8px;">
    ${[4,8,12,16,20,24,32,40,56,80].map(px => `
      <div class="sg-card" style="padding:14px; text-align:center;">
        <div style="width:100%; height:${Math.min(px,56)}px; background:var(--sf-teal); opacity:.8; margin-bottom:8px;"></div>
        <div style="font-family:var(--font-mono); font-size:11px; color:var(--t1);">${px}px</div>
        <div style="font-family:var(--font-mono); font-size:9px; color:var(--t4); margin-top:2px;">s-${['1','2','3','4','5','6','8','10','14','20'][[4,8,12,16,20,24,32,40,56,80].indexOf(px)]}</div>
      </div>
    `).join('')}
  </div>

  <div class="sg-sub">Grid</div>
  <div style="display:grid; grid-template-columns: 2fr 1fr; gap:20px;">
    <div class="sg-card" style="padding:0; overflow:hidden;">
      <div style="display:grid; grid-template-columns:repeat(12,1fr); gap:8px; padding:16px; background:var(--sf-surface); height:240px;">
        ${Array.from({length:12}).map(() => '<div style="background:rgba(21,193,123,0.08); border:1px dashed rgba(21,193,123,0.3);"></div>').join('')}
      </div>
      <div style="padding:14px 16px; border-top:1px solid var(--sf-border); display:flex; justify-content:space-between; font-family:var(--font-mono); font-size:11px; color:var(--t3);"><span>12-COL · 1440 MAX</span><span>GUTTER 24 · MARGIN 64</span></div>
    </div>
    <div class="sg-card">
      <div class="sg-card-title">Breakpoints</div>
      <table class="sg-table" style="font-size:12px;">
        <tbody>
          <tr><td>sm</td><td>640px</td></tr>
          <tr><td>md</td><td>768px</td></tr>
          <tr><td>lg</td><td>1024px</td></tr>
          <tr><td>xl</td><td>1280px</td></tr>
          <tr><td>2xl</td><td>1440px</td></tr>
        </tbody>
      </table>
    </div>
  </div>

  <div class="sg-sub">Radius — the rule</div>
  <div style="display:grid; grid-template-columns:repeat(4,1fr); gap:16px;">
    <div class="sg-card" style="text-align:center; padding:28px 16px;">
      <div style="width:64px; height:64px; background:var(--sf-surface-elevated); border:1px solid var(--sf-border-strong); margin:0 auto 14px; border-radius:0;"></div>
      <div style="font-family:var(--font-mono); font-size:11px; color:var(--sf-teal);">0px — DEFAULT</div>
      <div style="font-size:12px; color:var(--t3); margin-top:6px;">Panels, inputs, buttons, cards.</div>
    </div>
    <div class="sg-card" style="text-align:center; padding:28px 16px;">
      <div style="width:64px; height:64px; background:var(--sf-surface-elevated); border:1px solid var(--sf-border-strong); margin:0 auto 14px; border-radius:2px;"></div>
      <div style="font-family:var(--font-mono); font-size:11px; color:var(--sf-teal);">2px — TAG</div>
      <div style="font-size:12px; color:var(--t3); margin-top:6px;">Small pills only (sf-tag).</div>
    </div>
    <div class="sg-card" style="text-align:center; padding:28px 16px;">
      <div style="width:64px; height:64px; background:var(--sf-surface-elevated); border:1px solid var(--sf-border-strong); margin:0 auto 14px; border-radius:4px;"></div>
      <div style="font-family:var(--font-mono); font-size:11px; color:var(--sf-amber);">4px — SIM</div>
      <div style="font-size:12px; color:var(--t3); margin-top:6px;">Legacy simulator shell only.</div>
    </div>
    <div class="sg-card" style="text-align:center; padding:28px 16px;">
      <div style="width:64px; height:64px; background:var(--sf-surface-elevated); border:1px solid var(--sf-border-strong); margin:0 auto 14px; border-radius:999px;"></div>
      <div style="font-family:var(--font-mono); font-size:11px; color:var(--sf-crimson);">∞ — AVATAR</div>
      <div style="font-size:12px; color:var(--t3); margin-top:6px;">User pics / status dots only.</div>
    </div>
  </div>
</section>
  `);

  // ───────────────────────────────────────────── 05 MOTION
  parts.push(`
<section id="motion" class="sg-sec sg-anchor">
  <div class="sg-sec-head">
    <div class="sg-sec-head-l">
      <div class="sg-sec-code">// 05 · MOTION</div>
      <h2>Instrument<br/>response.</h2>
    </div>
    <div class="sg-sec-head-r">Motion on a ship's console is confirmatory, not decorative. Short, linear, assertive. No bounces. No overshoot. No elastic.</div>
  </div>

  <div class="sg-grid-3">
    <div class="sg-card">
      <div class="sg-card-title">Micro · 120ms</div>
      <p style="font-size:13px; color:var(--t2); line-height:1.55; margin:0 0 12px;">Hover state, focus ring, button color flip.</p>
      <div style="font-family:var(--font-mono); font-size:11px; color:var(--sf-teal);">ease-out · opacity, color</div>
    </div>
    <div class="sg-card">
      <div class="sg-card-title">Response · 180ms</div>
      <p style="font-size:13px; color:var(--t2); line-height:1.55; margin:0 0 12px;">Button press, toggle, chip selection. The ship's default response time.</p>
      <div style="font-family:var(--font-mono); font-size:11px; color:var(--sf-teal);">ease · transform, box-shadow</div>
    </div>
    <div class="sg-card">
      <div class="sg-card-title">Transition · 280ms</div>
      <p style="font-size:13px; color:var(--t2); line-height:1.55; margin:0 0 12px;">Panel open / close, route change, dialog show. Never longer.</p>
      <div style="font-family:var(--font-mono); font-size:11px; color:var(--sf-teal);">cubic-bezier(0.2, 0.8, 0.2, 1)</div>
    </div>
  </div>

  <div class="sg-sub">Signature motions</div>
  <div class="sg-grid-3">
    <div class="sg-card">
      <div class="sg-card-title">Telemetry pulse</div>
      <div style="display:flex; align-items:center; gap:10px; margin:14px 0;">
        <span class="sg-pulse-dot"></span>
        <span style="font-family:var(--font-mono); font-size:11px; color:var(--sf-teal-bright); letter-spacing:1.5px;">SYSTEM ACTIVE</span>
      </div>
      <p style="font-size:12px; color:var(--t3); line-height:1.6; margin:0;">Slow pulse, 2s cycle, tight opacity band. Signals "alive but idle." Use on status indicators only.</p>
    </div>
    <div class="sg-card">
      <div class="sg-card-title">Edge glow (arc)</div>
      <div style="position:relative; height:56px; background:var(--sf-surface); border:1px solid var(--sf-border); margin:14px 0;">
        <div style="position:absolute; bottom:0; left:10%; right:10%; height:1px; background:linear-gradient(to right, transparent, rgba(61,255,205,0.6), transparent);"></div>
      </div>
      <p style="font-size:12px; color:var(--t3); line-height:1.6; margin:0;">Bottom-edge light arc under active panels. Static. A panel wearing a mission indicator.</p>
    </div>
    <div class="sg-card">
      <div class="sg-card-title">Data tick</div>
      <div style="font-family:var(--font-mono); font-size:13px; color:var(--sf-teal-bright); margin:14px 0;" id="sgTick">1.024 M⊕</div>
      <p style="font-size:12px; color:var(--t3); line-height:1.6; margin:0;">Number changes step — no easing tween. Mimics a digital readout, not a CSS animation.</p>
    </div>
  </div>

  <div class="sg-rule" style="margin-top:24px;">
    <b>Reduced-motion.</b> Respect <code style="font-family:var(--font-mono); color:var(--sf-teal);">prefers-reduced-motion</code>. Disable pulse, data tick, and starfield parallax. Leave 120ms hover — it's informational, not decorative.
  </div>
</section>

<style>
  .sg-pulse-dot { width:8px; height:8px; border-radius:50%; background: var(--sf-teal); box-shadow: 0 0 0 0 rgba(21,193,123,0.6); animation: sgPulse 2s infinite; }
  @keyframes sgPulse {
    0% { box-shadow: 0 0 0 0 rgba(21,193,123,0.5); }
    70% { box-shadow: 0 0 0 10px rgba(21,193,123,0); }
    100% { box-shadow: 0 0 0 0 rgba(21,193,123,0); }
  }
</style>
<script>
  (function() {
    const el = document.getElementById('sgTick');
    if (!el) return;
    let v = 1.024;
    setInterval(() => { v = 1.000 + Math.random() * 0.08; el.textContent = v.toFixed(3) + ' M⊕'; }, 1200);
  })();
</script>
  `);

  // Export for page
  window.__SG_SECTIONS_PART1 = parts.join('\n');
  window.__SG_SECTIONS = parts.join('\n'); // will be overridden by part 2
})();
