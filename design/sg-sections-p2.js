// StellarForge Style Guide — section content · PART 2
// Components, Brand, Patterns, Do/Don't
// Appends to window.__SG_SECTIONS_PART1 to form the full payload.

(function() {
  const parts = [];

  // ───────────────────────────────────────────── 06 PANELS & SURFACES
  parts.push(`
<section id="panels" class="sg-sec sg-anchor">
  <div class="sg-sec-head">
    <div class="sg-sec-head-l">
      <div class="sg-sec-code">// 06 · PANELS &amp; SURFACES</div>
      <h2>Three layers.<br/>No more.</h2>
    </div>
    <div class="sg-sec-head-r">Void → Surface → Elevated. Never stack four deep. If you need more hierarchy, use tracking or color, not another background shade.</div>
  </div>

  <div style="display:grid; grid-template-columns:repeat(3,1fr); gap:20px;">
    <div style="background:var(--sf-void); border:1px solid var(--sf-border); padding:28px;">
      <div style="font-family:var(--font-mono); font-size:10px; color:var(--sf-teal); letter-spacing:2px; margin-bottom:8px;">LAYER 0 · VOID</div>
      <div style="font-family:var(--font-display); font-size:22px; color:var(--t1); letter-spacing:0.04em; font-weight:300;">Page canvas</div>
      <p style="font-size:12px; color:var(--t3); margin-top:12px; line-height:1.6;">The space between instruments. The default body background. <code style="font-family:var(--font-mono); color:var(--sf-teal);">#0A0E17</code></p>
    </div>
    <div style="background:var(--sf-surface); border:1px solid var(--sf-border); padding:28px;">
      <div style="font-family:var(--font-mono); font-size:10px; color:var(--sf-teal); letter-spacing:2px; margin-bottom:8px;">LAYER 1 · SURFACE</div>
      <div style="font-family:var(--font-display); font-size:22px; color:var(--t1); letter-spacing:0.04em; font-weight:300;">Panel body</div>
      <p style="font-size:12px; color:var(--t3); margin-top:12px; line-height:1.6;">Default card or panel. <code style="font-family:var(--font-mono); color:var(--sf-teal);">#0E1320</code></p>
    </div>
    <div style="background:var(--sf-surface-elevated); border:1px solid var(--sf-border-strong); padding:28px;">
      <div style="font-family:var(--font-mono); font-size:10px; color:var(--sf-teal); letter-spacing:2px; margin-bottom:8px;">LAYER 2 · ELEVATED</div>
      <div style="font-family:var(--font-display); font-size:22px; color:var(--t1); letter-spacing:0.04em; font-weight:300;">Active / hover</div>
      <p style="font-size:12px; color:var(--t3); margin-top:12px; line-height:1.6;">Hover, open dialog, active row. <code style="font-family:var(--font-mono); color:var(--sf-teal);">#161C2B</code></p>
    </div>
  </div>

  <div class="sg-sub">Panel variants</div>
  <div style="display:grid; grid-template-columns:repeat(2,1fr); gap:20px;">

    <!-- Glass panel -->
    <div>
      <div class="sf-panel sf-panel--glow" style="padding:24px; min-height:140px;">
        <div class="sf-eyebrow" style="margin-bottom:8px;">// GLASS PANEL · DEFAULT</div>
        <div style="font-family:var(--font-display); font-size:26px; color:var(--t1); letter-spacing:0.04em; font-weight:300;">Survey 47-Gamma</div>
        <div style="font-family:var(--font-mono); font-size:11px; color:var(--sf-teal-bright); margin-top:10px;">M 1.024 · R 1.017 · g 0.997 · T 288K</div>
      </div>
      <div style="margin-top:10px; font-family:var(--font-mono); font-size:10px; color:var(--t4); letter-spacing:1.5px;">.SF-PANEL · OPTIONAL .SF-PANEL--GLOW</div>
    </div>

    <!-- Bracket panel -->
    <div>
      <div class="sf-panel sf-bracket" style="padding:24px; min-height:140px;">
        <div class="sf-eyebrow" style="margin-bottom:8px;">// BRACKET PANEL · FOCAL</div>
        <div style="font-family:var(--font-display); font-size:26px; color:var(--t1); letter-spacing:0.04em; font-weight:300;">Priority readout</div>
        <p style="font-size:13px; color:var(--t3); margin:10px 0 0; line-height:1.5;">Bracket corners signal "this matters." Use sparingly — one per screen, max.</p>
      </div>
      <div style="margin-top:10px; font-family:var(--font-mono); font-size:10px; color:var(--t4); letter-spacing:1.5px;">.SF-BRACKET</div>
    </div>

    <!-- Numbered panel -->
    <div>
      <div class="sf-panel" style="padding:24px 24px 24px 72px; min-height:140px; position:relative;">
        <div style="position:absolute; left:20px; top:22px; width:36px; height:36px; border:1px solid var(--sf-teal); color:var(--sf-teal); font-family:var(--font-mono); display:flex; align-items:center; justify-content:center; font-size:14px;">03</div>
        <div class="sf-eyebrow" style="margin-bottom:8px;">// NUMBERED SECTION</div>
        <div style="font-family:var(--font-heading); font-size:20px; color:var(--t1); letter-spacing:0.1em; text-transform:uppercase;">Atmospheric Profile</div>
        <p style="font-size:13px; color:var(--t3); margin:8px 0 0; line-height:1.5;">Teal number badge for ordered worksheet sections.</p>
      </div>
      <div style="margin-top:10px; font-family:var(--font-mono); font-size:10px; color:var(--t4); letter-spacing:1.5px;">.SF-PANEL + NUMBERED BADGE</div>
    </div>

    <!-- Accent panel -->
    <div>
      <div class="sf-panel" style="padding:24px; min-height:140px; border-left:3px solid var(--sf-azure);">
        <div style="font-family:var(--font-mono); font-size:10px; letter-spacing:2px; color:var(--sf-azure); margin-bottom:8px;">// ENVIRONMENT · WORLDS</div>
        <div style="font-family:var(--font-display); font-size:26px; color:var(--t1); letter-spacing:0.04em; font-weight:300;">Genesis output</div>
        <p style="font-size:13px; color:var(--t3); margin:10px 0 0; line-height:1.5;">Accent border left-bar tags the cascade layer without coloring the whole panel.</p>
      </div>
      <div style="margin-top:10px; font-family:var(--font-mono); font-size:10px; color:var(--t4); letter-spacing:1.5px;">.SF-PANEL + BORDER-LEFT ACCENT</div>
    </div>
  </div>
</section>
  `);

  // ───────────────────────────────────────────── 07 BUTTONS & TAGS
  parts.push(`
<section id="buttons" class="sg-sec sg-anchor">
  <div class="sg-sec-head">
    <div class="sg-sec-head-l">
      <div class="sg-sec-code">// 07 · BUTTONS &amp; TAGS</div>
      <h2>Primary, ghost,<br/>destructive, link.</h2>
    </div>
    <div class="sg-sec-head-r">Four button types total. Use the right one. All buttons are DM Sans 500, tracking 1.2px, uppercase — never Jura, never Nichrome.</div>
  </div>

  <div class="sg-sub">Button system</div>
  <div style="display:grid; grid-template-columns:repeat(2,1fr); gap:20px;">
    <div class="sg-card">
      <div class="sg-card-title">Primary — filled teal</div>
      <div style="display:flex; flex-wrap:wrap; gap:12px; align-items:center; margin:12px 0;">
        <button class="sf-btn">Compute</button>
        <button class="sf-btn">Export ↓</button>
        <button class="sf-btn" disabled style="opacity:0.4; cursor:not-allowed;">Disabled</button>
      </div>
      <p style="font-size:12px; color:var(--t3); margin:0; line-height:1.55;">One per screen. The single most important action: save, submit, begin survey, launch.</p>
    </div>
    <div class="sg-card">
      <div class="sg-card-title">Ghost — outlined</div>
      <div style="display:flex; flex-wrap:wrap; gap:12px; align-items:center; margin:12px 0;">
        <button class="sf-btn sf-btn--ghost">Cancel</button>
        <button class="sf-btn sf-btn--ghost">Open Manual →</button>
        <button class="sf-btn sf-btn--ghost">Back</button>
      </div>
      <p style="font-size:12px; color:var(--t3); margin:0; line-height:1.55;">Secondary actions. Cancels, navigation, non-destructive alternates.</p>
    </div>
    <div class="sg-card">
      <div class="sg-card-title">Destructive — crimson ghost</div>
      <div style="display:flex; flex-wrap:wrap; gap:12px; align-items:center; margin:12px 0;">
        <button class="sf-btn sf-btn--ghost" style="border-color:rgba(255,51,102,0.5); color:var(--sf-crimson);">Delete world</button>
        <button class="sf-btn" style="background:var(--sf-crimson); border-color:var(--sf-crimson); color:#140508;">Confirm deletion</button>
      </div>
      <p style="font-size:12px; color:var(--t3); margin:0; line-height:1.55;">Ghost crimson first; only go solid crimson inside a type-to-confirm dialog.</p>
    </div>
    <div class="sg-card">
      <div class="sg-card-title">Link — text only</div>
      <div style="display:flex; flex-wrap:wrap; gap:16px; align-items:center; margin:12px 0;">
        <a href="#" style="font-family:var(--font-sans); font-size:13px; color:var(--sf-teal); text-decoration:none; letter-spacing:0.5px;">Operations manual →</a>
        <a href="#" style="font-family:var(--font-sans); font-size:13px; color:var(--t2); text-decoration:underline; text-decoration-color:var(--t4); text-underline-offset:3px;">inline link</a>
      </div>
      <p style="font-size:12px; color:var(--t3); margin:0; line-height:1.55;">Nav, contextual jumps, help references. Arrow suffix for forward nav, ↵ for return.</p>
    </div>
  </div>

  <div class="sg-sub">Tags — cascade semantics</div>
  <div style="display:flex; flex-wrap:wrap; gap:10px; padding: 18px 20px; background:var(--sf-surface); border:1px solid var(--sf-border);">
    <span class="sf-tag">INTEGRATION</span>
    <span class="sf-tag sf-tag--amber">PHYSICS</span>
    <span class="sf-tag sf-tag--azure">ENVIRONMENT</span>
    <span class="sf-tag sf-tag--emerald">BIOLOGY</span>
    <span class="sf-tag sf-tag--violet">CIVILIZATION</span>
    <span class="sf-tag sf-tag--stellar">MYTHOLOGY</span>
    <span class="sf-tag sf-tag--crimson">DESTRUCTIVE</span>
  </div>
  <div style="margin-top:10px; font-family:var(--font-mono); font-size:10px; color:var(--t4); letter-spacing:1.5px;">.SF-TAG [.SF-TAG--AMBER | --AZURE | --EMERALD | --VIOLET | --STELLAR | --CRIMSON]</div>

  <div class="sg-sub">Button sizes</div>
  <table class="sg-table">
    <thead><tr><th>Size</th><th>Padding</th><th>Font</th><th>When</th></tr></thead>
    <tbody>
      <tr><td>sm</td><td>8 × 14</td><td>11 / 500 / 1px</td><td>Toolbar, inline actions</td></tr>
      <tr><td>md (default)</td><td>12 × 22</td><td>13 / 500 / 1.2px</td><td>Forms, dialogs, panels</td></tr>
      <tr><td>lg</td><td>16 × 32</td><td>14 / 500 / 1.4px</td><td>Hero CTA, landing, launch moments</td></tr>
    </tbody>
  </table>
</section>
  `);

  // ───────────────────────────────────────────── 08 FORMS & INPUTS
  parts.push(`
<section id="forms" class="sg-sec sg-anchor">
  <div class="sg-sec-head">
    <div class="sg-sec-head-l">
      <div class="sg-sec-code">// 08 · FORMS &amp; INPUTS</div>
      <h2>The instrument<br/>accepts input.</h2>
    </div>
    <div class="sg-sec-head-r">Fields look like cockpit readouts, not web forms. Zero radius. Monospace for numeric values. Teal focus ring.</div>
  </div>

  <div style="display:grid; grid-template-columns:repeat(2,1fr); gap:24px;">

    <!-- Text input -->
    <div>
      <label style="display:block; font-family:var(--font-sans); font-size:10px; color:var(--t3); letter-spacing:1.5px; text-transform:uppercase; margin-bottom:8px;">World name</label>
      <input type="text" value="Thessaly-IV" style="width:100%; padding:14px 16px; background:var(--sf-surface); border:1px solid var(--sf-border-strong); border-radius:0; font-family:var(--font-sans); font-size:14px; color:var(--t1); outline:none;"/>
      <div style="font-family:var(--font-mono); font-size:10px; color:var(--t4); letter-spacing:1.5px; margin-top:6px;">TEXT INPUT · DEFAULT</div>
    </div>

    <!-- Numeric / data -->
    <div>
      <label style="display:block; font-family:var(--font-sans); font-size:10px; color:var(--t3); letter-spacing:1.5px; text-transform:uppercase; margin-bottom:8px;">Planet mass · M⊕</label>
      <input type="text" value="1.024" style="width:100%; padding:14px 16px; background:var(--sf-surface); border:1px solid var(--sf-teal); border-radius:0; font-family:var(--font-mono); font-size:14px; color:var(--sf-teal-bright); outline:none; box-shadow: 0 0 0 3px rgba(21,193,123,0.1);"/>
      <div style="font-family:var(--font-mono); font-size:10px; color:var(--sf-teal); letter-spacing:1.5px; margin-top:6px;">NUMERIC · FOCUSED · MONO</div>
    </div>

    <!-- Select -->
    <div>
      <label style="display:block; font-family:var(--font-sans); font-size:10px; color:var(--t3); letter-spacing:1.5px; text-transform:uppercase; margin-bottom:8px;">Spectral type</label>
      <div style="position:relative;">
        <select style="width:100%; padding:14px 40px 14px 16px; background:var(--sf-surface); border:1px solid var(--sf-border-strong); border-radius:0; font-family:var(--font-sans); font-size:14px; color:var(--t1); outline:none; appearance:none;">
          <option>G2V — sol-type</option>
          <option>K0V</option>
          <option>M4V</option>
        </select>
        <span style="position:absolute; right:14px; top:14px; color:var(--sf-teal); font-family:var(--font-mono); font-size:12px; pointer-events:none;">▾</span>
      </div>
      <div style="font-family:var(--font-mono); font-size:10px; color:var(--t4); letter-spacing:1.5px; margin-top:6px;">SELECT · DEFAULT</div>
    </div>

    <!-- Slider -->
    <div>
      <label style="display:flex; justify-content:space-between; font-family:var(--font-sans); font-size:10px; color:var(--t3); letter-spacing:1.5px; text-transform:uppercase; margin-bottom:12px;"><span>Orbital eccentricity</span><span style="font-family:var(--font-mono); color:var(--sf-teal-bright); letter-spacing:1px;">0.183</span></label>
      <div style="position:relative; height:6px; background:var(--sf-surface); border:1px solid var(--sf-border);">
        <div style="position:absolute; inset:0 82% 0 0; background:var(--sf-teal); opacity:0.7;"></div>
        <div style="position:absolute; left:18%; top:50%; transform:translate(-50%,-50%); width:14px; height:14px; background:var(--sf-teal-bright); border:1px solid var(--sf-void);"></div>
      </div>
      <div style="display:flex; justify-content:space-between; font-family:var(--font-mono); font-size:10px; color:var(--t4); margin-top:8px;"><span>0.000</span><span>1.000</span></div>
    </div>

    <!-- Textarea -->
    <div>
      <label style="display:block; font-family:var(--font-sans); font-size:10px; color:var(--t3); letter-spacing:1.5px; text-transform:uppercase; margin-bottom:8px;">Log entry</label>
      <div style="background:var(--sf-surface); border:1px solid var(--sf-border-strong); padding:14px 16px; min-height:88px; font-family:var(--font-sans); font-size:14px; color:var(--t2); line-height:1.6;"><span style="color:var(--t4);">BEGIN TRANSMISSION...</span></div>
      <div style="font-family:var(--font-mono); font-size:10px; color:var(--t4); letter-spacing:1.5px; margin-top:6px;">TEXTAREA · PLACEHOLDER "BEGIN TRANSMISSION..."</div>
    </div>

    <!-- Toggle / checkbox -->
    <div>
      <label style="display:block; font-family:var(--font-sans); font-size:10px; color:var(--t3); letter-spacing:1.5px; text-transform:uppercase; margin-bottom:12px;">Advanced parameters</label>
      <div style="display:flex; flex-direction:column; gap:10px;">
        <label style="display:flex; align-items:center; gap:12px; cursor:pointer;">
          <span style="width:18px; height:18px; border:1px solid var(--sf-teal); background:var(--sf-teal); position:relative; display:inline-flex; align-items:center; justify-content:center; color:var(--sf-void); font-size:11px; font-family:var(--font-mono);">✓</span>
          <span style="font-size:13px; color:var(--t1);">Enable n-body perturbation</span>
        </label>
        <label style="display:flex; align-items:center; gap:12px; cursor:pointer;">
          <span style="width:18px; height:18px; border:1px solid var(--sf-border-strong); background:transparent;"></span>
          <span style="font-size:13px; color:var(--t2);">Log to archive</span>
        </label>
        <label style="display:flex; align-items:center; gap:12px; cursor:pointer;">
          <span style="width:34px; height:18px; background:var(--sf-teal); position:relative;"><span style="position:absolute; right:3px; top:3px; width:12px; height:12px; background:var(--sf-void);"></span></span>
          <span style="font-size:13px; color:var(--t1);">Auto-save engaged</span>
        </label>
      </div>
    </div>

  </div>

  <div class="sg-rule" style="margin-top:24px;">
    <b>Field focus state.</b> 1px teal border + 3px teal-at-10% outline-like glow. Never use the default blue system outline. Never use a box-shadow inset — it muddies the readout.
  </div>
</section>
  `);

  // ───────────────────────────────────────────── 09 DATA DISPLAY
  parts.push(`
<section id="data" class="sg-sec sg-anchor">
  <div class="sg-sec-head">
    <div class="sg-sec-head-l">
      <div class="sg-sec-code">// 09 · DATA DISPLAY</div>
      <h2>Show the<br/>readouts.</h2>
    </div>
    <div class="sg-sec-head-r">The ship is always tracking. Numbers, metrics, progress, status — give them their own visual vocabulary.</div>
  </div>

  <div class="sg-sub">Telemetry row</div>
  <div class="sf-panel" style="padding:0;">
    <div style="display:grid; grid-template-columns:repeat(4,1fr); border-bottom:1px solid var(--sf-border);">
      ${['M⊕','R⊕','g·m/s²','T·K'].map((label, i) => {
        const v = ['1.024','1.017','9.81','288'][i];
        return `
          <div style="padding:20px 24px; ${i>0 ? 'border-left:1px solid var(--sf-border);' : ''}">
            <div style="font-family:var(--font-mono); font-size:10px; color:var(--t4); letter-spacing:2px;">${label}</div>
            <div style="font-family:var(--font-display); font-size:36px; color:var(--t1); font-weight:300; letter-spacing:0.02em; margin-top:4px;">${v}</div>
          </div>
        `;
      }).join('')}
    </div>
    <div style="padding:12px 24px; display:flex; justify-content:space-between; align-items:center; font-family:var(--font-mono); font-size:10px; color:var(--t3); letter-spacing:1.5px;">
      <span>// THESSALY-IV · SURFACE PARAMETERS</span>
      <span style="color:var(--sf-teal);">● LIVE</span>
    </div>
  </div>

  <div class="sg-sub">Progress</div>
  <div style="display:grid; grid-template-columns:1fr 1fr; gap:20px;">
    <div class="sg-card">
      <div class="sg-card-title">Survey progress bar</div>
      <div style="display:flex; justify-content:space-between; font-family:var(--font-mono); font-size:11px; letter-spacing:1.5px; margin-bottom:8px;"><span style="color:var(--t3);">DEPTH</span><span style="color:var(--sf-teal-bright);">07 / 12</span></div>
      <div style="height:4px; background:var(--sf-surface); border:1px solid var(--sf-border); position:relative;">
        <div style="position:absolute; inset:0 42% 0 0; background:var(--sf-teal);"></div>
      </div>
      <div style="margin-top:6px; font-family:var(--font-mono); font-size:10px; color:var(--t4);">58% · EXPORT PENDING</div>
    </div>
    <div class="sg-card">
      <div class="sg-card-title">Segmented</div>
      <div style="display:flex; gap:3px; margin:14px 0 10px;">
        ${Array.from({length:12}).map((_,i) => `<div style="flex:1; height:16px; background:${i<7?'var(--sf-teal)':'var(--sf-surface-elevated)'}; ${i<7?'box-shadow: 0 0 8px rgba(21,193,123,0.4);':''}"></div>`).join('')}
      </div>
      <div style="font-family:var(--font-mono); font-size:10px; color:var(--t4); letter-spacing:1.5px;">INSTRUMENTS CALIBRATED</div>
    </div>
  </div>

  <div class="sg-sub">Status indicators</div>
  <div style="display:grid; grid-template-columns:repeat(4,1fr); gap:12px;">
    ${[
      ['●','SYSTEM ACTIVE','var(--sf-teal)'],
      ['●','STANDBY','var(--sf-amber)'],
      ['●','TRANSMITTING','var(--sf-stellar)'],
      ['●','ANOMALY','var(--sf-crimson)'],
    ].map(([dot,label,color]) => `
      <div style="display:flex; align-items:center; gap:10px; padding:12px 16px; background:var(--sf-surface); border:1px solid var(--sf-border); border-left:2px solid ${color};">
        <span style="color:${color}; font-size:12px;">${dot}</span>
        <span style="font-family:var(--font-mono); font-size:11px; color:var(--t2); letter-spacing:1.5px;">${label}</span>
      </div>
    `).join('')}
  </div>

  <div class="sg-sub">Data table</div>
  <div class="sf-panel" style="padding:0; overflow:hidden;">
    <table class="sg-table" style="margin:0;">
      <thead><tr><th style="padding-left:24px;">CODE</th><th>INSTRUMENT</th><th>LAYER</th><th>STATUS</th><th style="text-align:right; padding-right:24px;">DEPTH</th></tr></thead>
      <tbody>
        <tr><td style="padding-left:24px;">GEN-01</td><td style="color:var(--t1);">Genesis: Planetary Profile</td><td><span class="sf-tag sf-tag--azure">ENVIRONMENT</span></td><td style="color:var(--sf-teal);">● COMPLETE</td><td style="text-align:right; padding-right:24px; color:var(--sf-teal-bright); font-family:var(--font-mono);">12/12</td></tr>
        <tr><td style="padding-left:24px;">PHY-03</td><td style="color:var(--t1);">Phylo: Evolutionary Biology</td><td><span class="sf-tag sf-tag--emerald">BIOLOGY</span></td><td style="color:var(--sf-amber);">● IN PROGRESS</td><td style="text-align:right; padding-right:24px; color:var(--sf-teal-bright); font-family:var(--font-mono);">07/13</td></tr>
        <tr><td style="padding-left:24px;">DOM-02</td><td style="color:var(--t1);">Dominion: Empire Designer</td><td><span class="sf-tag sf-tag--violet">CIVILIZATION</span></td><td style="color:var(--t4);">○ STANDBY</td><td style="text-align:right; padding-right:24px; color:var(--t4); font-family:var(--font-mono);">00/09</td></tr>
      </tbody>
    </table>
  </div>
</section>
  `);

  // ───────────────────────────────────────────── 10 NAV
  parts.push(`
<section id="nav" class="sg-sec sg-anchor">
  <div class="sg-sec-head">
    <div class="sg-sec-head-l">
      <div class="sg-sec-code">// 10 · NAVIGATION</div>
      <h2>Wayfinding<br/>aboard.</h2>
    </div>
    <div class="sg-sec-head-r">Nav is sparse and functional. Items are uppercase, ample spacing, active state uses a single left-bar teal rule.</div>
  </div>

  <div class="sg-sub">Primary header nav</div>
  <div class="sf-panel" style="padding:18px 24px; display:flex; align-items:center; justify-content:space-between;">
    <div style="display:flex; align-items:center; gap:40px;">
      <div style="display:flex; align-items:center; gap:10px;">
        <svg width="22" height="22" viewBox="0 0 40 40"><path d="M20 4 L34 12 L34 28 L20 36 L6 28 L6 12 Z" stroke="#3DFFCD" stroke-width="1.2" fill="none"/><circle cx="20" cy="20" r="1.6" fill="#3DFFCD"/></svg>
        <span style="font-family:var(--font-display); font-size:14px; letter-spacing:0.22em; color:var(--t1);">STELLAR<span style="color:#15C17B;">FORGE</span></span>
      </div>
      <nav style="display:flex; gap:28px; font-family:var(--font-heading); font-size:12px; letter-spacing:0.15em; text-transform:uppercase;">
        <a href="#" style="color:var(--sf-teal-bright); text-decoration:none;">WORLDS</a>
        <a href="#" style="color:var(--t2); text-decoration:none;">TOOLS</a>
        <a href="#" style="color:var(--t2); text-decoration:none;">LEARN</a>
        <a href="#" style="color:var(--t2); text-decoration:none;">PRO</a>
      </nav>
    </div>
    <div style="font-family:var(--font-mono); font-size:10px; color:var(--t4); letter-spacing:1.5px;">v0.6231 · SESSION ACTIVE</div>
  </div>

  <div class="sg-sub">Breadcrumb</div>
  <div class="sf-panel" style="padding:14px 20px; display:flex; align-items:center; gap:12px; font-family:var(--font-mono); font-size:11px; letter-spacing:1.5px;">
    <a href="#" style="color:var(--t3); text-decoration:none;">WORLDS</a>
    <span style="color:var(--t5);">/</span>
    <a href="#" style="color:var(--t3); text-decoration:none;">THESSALY-IV</a>
    <span style="color:var(--t5);">/</span>
    <span style="color:var(--sf-teal-bright);">GENESIS · PLANETARY PROFILE</span>
  </div>

  <div class="sg-sub">Tabs — bracket style</div>
  <div class="sf-panel" style="padding:0; overflow:hidden;">
    <div style="display:flex; border-bottom:1px solid var(--sf-border);">
      <div style="padding:16px 24px; border-bottom:2px solid var(--sf-teal); color:var(--t1); font-family:var(--font-heading); font-size:12px; letter-spacing:0.15em; text-transform:uppercase; background:rgba(21,193,123,0.04);">CONFIGURATION</div>
      <div style="padding:16px 24px; color:var(--t3); font-family:var(--font-heading); font-size:12px; letter-spacing:0.15em; text-transform:uppercase;">RESULTS</div>
      <div style="padding:16px 24px; color:var(--t3); font-family:var(--font-heading); font-size:12px; letter-spacing:0.15em; text-transform:uppercase;">NOTES</div>
      <div style="padding:16px 24px; color:var(--t3); font-family:var(--font-heading); font-size:12px; letter-spacing:0.15em; text-transform:uppercase;">EXPORT</div>
    </div>
    <div style="padding:32px; font-family:var(--font-sans); font-size:13px; color:var(--t3);">Active panel contents render here.</div>
  </div>

  <div class="sg-sub">Sidebar item (like this page)</div>
  <div class="sf-panel" style="padding:0; width:280px;">
    <div style="padding:10px 24px; border-left:2px solid var(--sf-teal); color:var(--sf-teal-bright); background:rgba(21,193,123,0.04); font-family:var(--font-sans); font-size:13px; letter-spacing:0.5px; display:flex; align-items:center; gap:12px;"><span style="font-family:var(--font-mono); font-size:10px; color:var(--sf-teal);">03</span>Typography</div>
    <div style="padding:10px 24px; border-left:2px solid transparent; color:var(--t2); font-family:var(--font-sans); font-size:13px; letter-spacing:0.5px; display:flex; align-items:center; gap:12px;"><span style="font-family:var(--font-mono); font-size:10px; color:var(--t4);">04</span>Space &amp; Grid</div>
    <div style="padding:10px 24px; border-left:2px solid transparent; color:var(--t2); font-family:var(--font-sans); font-size:13px; letter-spacing:0.5px; display:flex; align-items:center; gap:12px;"><span style="font-family:var(--font-mono); font-size:10px; color:var(--t4);">05</span>Motion</div>
  </div>
</section>
  `);

  // ───────────────────────────────────────────── 11 FEEDBACK & STATUS
  parts.push(`
<section id="feedback" class="sg-sec sg-anchor">
  <div class="sg-sec-head">
    <div class="sg-sec-head-l">
      <div class="sg-sec-code">// 11 · FEEDBACK &amp; STATUS</div>
      <h2>The ship<br/>reports back.</h2>
    </div>
    <div class="sg-sec-head-r">Toasts, alerts, empty states, loading — every feedback surface uses the Ship's Voice. See section 13 for exact copy patterns.</div>
  </div>

  <div class="sg-sub">Toasts</div>
  <div style="display:grid; grid-template-columns:repeat(2,1fr); gap:16px;">
    <div class="sf-panel" style="padding:14px 18px; border-left:3px solid var(--sf-teal); display:flex; align-items:center; gap:14px;">
      <span style="color:var(--sf-teal); font-size:16px;">●</span>
      <div>
        <div style="font-family:var(--font-mono); font-size:11px; color:var(--sf-teal); letter-spacing:1.5px;">WORLD FILE SECURED.</div>
        <div style="font-size:12px; color:var(--t3); margin-top:2px;">Changes committed to archive · 14:22:41</div>
      </div>
    </div>
    <div class="sf-panel" style="padding:14px 18px; border-left:3px solid var(--sf-crimson); display:flex; align-items:center; gap:14px;">
      <span style="color:var(--sf-crimson); font-size:16px;">◆</span>
      <div>
        <div style="font-family:var(--font-mono); font-size:11px; color:var(--sf-crimson); letter-spacing:1.5px;">PARAMETERS OUTSIDE OPERATIONAL RANGE.</div>
        <div style="font-size:12px; color:var(--t3); margin-top:2px;">Planet mass exceeds 20 M⊕ · adjust and retry</div>
      </div>
    </div>
    <div class="sf-panel" style="padding:14px 18px; border-left:3px solid var(--sf-amber); display:flex; align-items:center; gap:14px;">
      <span style="color:var(--sf-amber); font-size:16px;">▲</span>
      <div>
        <div style="font-family:var(--font-mono); font-size:11px; color:var(--sf-amber); letter-spacing:1.5px;">UNSAVED CHANGES DETECTED.</div>
        <div style="font-size:12px; color:var(--t3); margin-top:2px;">Leaving this page will discard uncommitted data.</div>
      </div>
    </div>
    <div class="sf-panel" style="padding:14px 18px; border-left:3px solid var(--sf-stellar); display:flex; align-items:center; gap:14px;">
      <span style="color:var(--sf-stellar); font-size:16px;">◉</span>
      <div>
        <div style="font-family:var(--font-mono); font-size:11px; color:var(--sf-stellar); letter-spacing:1.5px;">TRANSMISSION LOGGED.</div>
        <div style="font-size:12px; color:var(--t3); margin-top:2px;">Share link generated · valid until revoked</div>
      </div>
    </div>
  </div>

  <div class="sg-sub">Empty state</div>
  <div class="sf-panel" style="padding:64px 24px; text-align:center;">
    <div style="font-family:var(--font-mono); font-size:10px; color:var(--t4); letter-spacing:2px; margin-bottom:16px;">// NO DATA ON FILE</div>
    <div style="font-family:var(--font-display); font-size:42px; color:var(--t2); letter-spacing:0.04em; font-weight:300;">World Index: Empty</div>
    <p style="font-size:14px; color:var(--t3); max-width:400px; margin:16px auto 24px; line-height:1.6;">Begin a new survey to populate this archive.</p>
    <button class="sf-btn">Create world</button>
  </div>

  <div class="sg-sub">Loading</div>
  <div class="sf-panel" style="padding:28px 24px; text-align:center;">
    <div style="display:inline-flex; align-items:center; gap:14px;">
      <span style="display:inline-block; width:18px; height:18px; border:1.5px solid var(--sf-teal); border-right-color:transparent; border-radius:50%; animation: sgSpin 1s linear infinite;"></span>
      <span style="font-family:var(--font-mono); font-size:12px; color:var(--sf-teal-bright); letter-spacing:2px;">COMPUTING ATMOSPHERIC MODEL...</span>
    </div>
  </div>

  <div class="sg-rule" style="margin-top:24px;">
    <b>Never</b> use the words "Oops", "Whoops", "Something went wrong", or an emoji in any feedback state. Replace with the corresponding Ship's Voice phrase from section 13.
  </div>
</section>
<style>
  @keyframes sgSpin { to { transform: rotate(360deg); } }
</style>
  `);

  // ───────────────────────────────────────────── 12 LOGO
  parts.push(`
<section id="logo" class="sg-sec sg-anchor">
  <div class="sg-sec-head">
    <div class="sg-sec-head-l">
      <div class="sg-sec-code">// 12 · LOGO &amp; MARK</div>
      <h2>The cube.<br/>The wordmark.</h2>
    </div>
    <div class="sg-sec-head-r">A single mark — the hex-cube — plus one wordmark configuration. Never lock up differently.</div>
  </div>

  <div class="sg-grid-3">
    <div class="sg-card" style="text-align:center; padding:40px 20px;">
      <svg width="84" height="84" viewBox="0 0 40 40"><path d="M20 4 L34 12 L34 28 L20 36 L6 28 L6 12 Z" stroke="#3DFFCD" stroke-width="1.2" fill="none"/><path d="M20 4 L20 20 M20 20 L6 12 M20 20 L34 12 M20 20 L20 36" stroke="#3DFFCD" stroke-width="1" opacity="0.7" fill="none"/><circle cx="20" cy="20" r="1.8" fill="#3DFFCD"/></svg>
      <div style="font-family:var(--font-mono); font-size:10px; color:var(--t4); letter-spacing:1.5px; margin-top:16px;">SYMBOL · FAVICON / APP ICON</div>
    </div>
    <div class="sg-card" style="text-align:center; padding:40px 20px; display:flex; flex-direction:column; align-items:center; justify-content:center;">
      <div style="display:flex; align-items:center; gap:12px;">
        <svg width="30" height="30" viewBox="0 0 40 40"><path d="M20 4 L34 12 L34 28 L20 36 L6 28 L6 12 Z" stroke="#3DFFCD" stroke-width="1.2" fill="none"/><circle cx="20" cy="20" r="1.8" fill="#3DFFCD"/></svg>
        <span style="font-family:var(--font-display); font-size:22px; letter-spacing:0.22em; color:var(--t1); font-weight:300;">STELLAR<span style="color:#15C17B;">FORGE</span></span>
      </div>
      <div style="font-family:var(--font-mono); font-size:10px; color:var(--t4); letter-spacing:1.5px; margin-top:16px;">HORIZONTAL LOCKUP · DEFAULT</div>
    </div>
    <div class="sg-card" style="text-align:center; padding:40px 20px; display:flex; flex-direction:column; align-items:center; justify-content:center;">
      <div style="display:flex; flex-direction:column; align-items:center; gap:10px;">
        <svg width="40" height="40" viewBox="0 0 40 40"><path d="M20 4 L34 12 L34 28 L20 36 L6 28 L6 12 Z" stroke="#3DFFCD" stroke-width="1.2" fill="none"/><circle cx="20" cy="20" r="1.8" fill="#3DFFCD"/></svg>
        <span style="font-family:var(--font-display); font-size:16px; letter-spacing:0.22em; color:var(--t1); font-weight:300;">STELLAR<span style="color:#15C17B;">FORGE</span></span>
      </div>
      <div style="font-family:var(--font-mono); font-size:10px; color:var(--t4); letter-spacing:1.5px; margin-top:16px;">STACKED · VERTICAL USE</div>
    </div>
  </div>

  <div class="sg-sub">Clear space &amp; minimums</div>
  <div style="display:grid; grid-template-columns:repeat(2,1fr); gap:20px;">
    <div class="sg-card">
      <div class="sg-card-title">Clear space = cap height of "F"</div>
      <div style="position:relative; display:inline-block; padding:24px; border:1px dashed var(--sf-teal);">
        <div style="display:flex; align-items:center; gap:10px;">
          <svg width="24" height="24" viewBox="0 0 40 40"><path d="M20 4 L34 12 L34 28 L20 36 L6 28 L6 12 Z" stroke="#3DFFCD" stroke-width="1.2" fill="none"/><circle cx="20" cy="20" r="1.6" fill="#3DFFCD"/></svg>
          <span style="font-family:var(--font-display); font-size:16px; letter-spacing:0.22em; color:var(--t1); font-weight:300;">STELLAR<span style="color:#15C17B;">FORGE</span></span>
        </div>
      </div>
      <p style="font-size:12px; color:var(--t3); margin-top:14px;">Always keep at least one "F" cap height of space around the lockup.</p>
    </div>
    <div class="sg-card">
      <div class="sg-card-title">Minimum sizes</div>
      <table class="sg-table" style="margin-top:8px;">
        <tbody>
          <tr><td>wordmark digital</td><td>120px wide</td></tr>
          <tr><td>wordmark print</td><td>30mm wide</td></tr>
          <tr><td>symbol only</td><td>16px · 24px · 32px ...</td></tr>
          <tr><td>favicon</td><td>16 / 32 / 48 variants required</td></tr>
        </tbody>
      </table>
    </div>
  </div>

  <div class="sg-do-dont" style="margin-top:24px;">
    <div class="sg-do">
      <div class="sg-do-label">DO</div>
      <p style="font-size:13px; color:var(--t2); margin:0;">Render the wordmark in single-color: white on dark, or void on light. Keep "FORGE" in teal <code style="font-family:var(--font-mono); color:var(--sf-teal);">#15C17B</code> for the 2-color treatment.</p>
    </div>
    <div class="sg-dont">
      <div class="sg-dont-label">DON'T</div>
      <p style="font-size:13px; color:var(--t2); margin:0;">Gradient-fill the mark. Tilt it. Outline the wordmark. Separate the cube from the wordmark in marketing. Apply drop shadows.</p>
    </div>
  </div>
</section>
  `);

  // ───────────────────────────────────────────── 13 VOICE
  parts.push(`
<section id="voice" class="sg-sec sg-anchor">
  <div class="sg-sec-head">
    <div class="sg-sec-head-l">
      <div class="sg-sec-code">// 13 · VOICE &amp; COPY</div>
      <h2>The narrator<br/>is the ship.</h2>
    </div>
    <div class="sg-sec-head-r">The interface is a ship's operating system. Every piece of system text speaks as the ship — terse, functional, slightly formal. Warmth comes from precision, never sentiment.</div>
  </div>

  <div class="sg-sub">The core rules</div>
  <div class="sg-grid-2">
    <div class="sg-card">
      <ul style="margin:0; padding-left:20px; font-size:13px; color:var(--t2); line-height:1.8;">
        <li>Second person, impersonal observation</li>
        <li>Present tense for status, past for events</li>
        <li>Terse, functional, slightly formal</li>
        <li>ALL CAPS for system status messages</li>
        <li>Mixed case for descriptive body copy</li>
        <li>Fragments over sentences in status contexts</li>
      </ul>
    </div>
    <div class="sg-card">
      <ul style="margin:0; padding-left:20px; font-size:13px; color:var(--t2); line-height:1.8;">
        <li>Never exclamation points</li>
        <li>Never first person ("I detected...")</li>
        <li>Never emoji</li>
        <li>Never ask questions — state what is available</li>
        <li>Never acknowledge being a website</li>
        <li>Never "Oops", "Whoops", or "Let's go!"</li>
      </ul>
    </div>
  </div>

  <div class="sg-sub">Voice translator</div>
  <div style="display:grid; grid-template-columns:1fr 1fr; gap:16px;">
    ${[
      ['Great job saving your world! 🎉','WORLD FILE SECURED.'],
      ['Oops! Something went wrong.','OPERATION FAILED. RETRY WHEN READY.'],
      ['Your export is done! Check your downloads.','EXPORT COMPLETE. TRANSMISSION LOGGED.'],
      ['Welcome back, Jason! We missed you!','SESSION ESTABLISHED.'],
      ['Ready to create your first species? Let&rsquo;s go!','NO SPECIES ON FILE. BEGIN SURVEY WHEN READY.'],
      ['Please enter a valid value.','PARAMETERS OUTSIDE OPERATIONAL RANGE.'],
    ].map(([bad, good]) => `
      <div class="sg-dont">
        <div class="sg-dont-label">WEB-SLOP</div>
        <div style="font-size:13px; color:var(--t2);">${bad}</div>
      </div>
      <div class="sg-do">
        <div class="sg-do-label">SHIP'S VOICE</div>
        <div style="font-family:var(--font-mono); font-size:13px; color:var(--sf-teal-bright); letter-spacing:1px;">${good}</div>
      </div>
    `).join('')}
  </div>

  <div class="sg-sub">Standard states · ready to paste</div>
  <table class="sg-table">
    <thead><tr><th>Context</th><th>Phrase</th></tr></thead>
    <tbody>
      <tr><td>save success</td><td>WORLD FILE SECURED.</td></tr>
      <tr><td>export success</td><td>EXPORT COMPLETE. TRANSMISSION LOGGED.</td></tr>
      <tr><td>session start</td><td>SESSION ESTABLISHED.</td></tr>
      <tr><td>empty list</td><td>WORLD INDEX: EMPTY.</td></tr>
      <tr><td>loading (generic)</td><td>INITIALIZING...</td></tr>
      <tr><td>loading (tool)</td><td>CALIBRATING INSTRUMENTS...</td></tr>
      <tr><td>network error</td><td>SIGNAL LOST. RETRY TRANSMISSION.</td></tr>
      <tr><td>validation error</td><td>PARAMETERS OUTSIDE OPERATIONAL RANGE.</td></tr>
      <tr><td>404</td><td>COORDINATES DO NOT MATCH ANY KNOWN RECORD.</td></tr>
      <tr><td>paywall</td><td>THIS INSTRUMENT REQUIRES PRO CLEARANCE.</td></tr>
      <tr><td>offline</td><td>CONNECTION LOST. OPERATING IN LOCAL MODE.</td></tr>
      <tr><td>autosave tick</td><td>AUTOSAVE: COMPLETE.</td></tr>
    </tbody>
  </table>

  <div class="sg-rule" style="margin-top:24px;">
    <b>The one poem.</b> The only line that breaks from cold precision is the brand tagline: <em style="color:var(--sf-stellar); font-style:italic;">"These worlds exist in you. Waiting to be found."</em> The ship's single concession to the human aboard. Use it rarely — homepage, footer, farewell moments. Never on a toast.
  </div>
</section>
  `);

  // ───────────────────────────────────────────── 14 SIGNATURE PATTERNS
  parts.push(`
<section id="patterns" class="sg-sec sg-anchor">
  <div class="sg-sec-head">
    <div class="sg-sec-head-l">
      <div class="sg-sec-code">// 14 · SIGNATURE PATTERNS</div>
      <h2>Unmistakable<br/>ship-isms.</h2>
    </div>
    <div class="sg-sec-head-r">The textures that mark something as StellarForge at a glance. When in doubt, reach for these first.</div>
  </div>

  <div class="sg-grid-2">
    <div class="sg-card">
      <div class="sg-card-title">// prefix for sector labels</div>
      <div style="padding:20px 0;">
        <div style="font-family:var(--font-mono); font-size:13px; color:var(--sf-teal); letter-spacing:1.5px;">// SECTOR: BIOLOGY → SENSORY SYSTEMS</div>
        <div style="font-family:var(--font-mono); font-size:13px; color:var(--sf-teal); letter-spacing:1.5px; margin-top:6px;">// OPERATIONS MANUAL</div>
      </div>
      <p style="font-size:12px; color:var(--t3); margin:0; line-height:1.6;">A double-slash prefix tags section headers. Comes from code-comment syntax — instantly reads as "system annotation."</p>
    </div>

    <div class="sg-card">
      <div class="sg-card-title">Bracket corners on focal panels</div>
      <div class="sf-bracket" style="padding:18px; background:var(--sf-surface); margin:20px 0;">
        <div style="font-family:var(--font-mono); font-size:11px; color:var(--sf-teal-bright); letter-spacing:1.5px;">PRIORITY · 01</div>
        <div style="font-family:var(--font-display); font-size:18px; color:var(--t1); letter-spacing:0.04em; margin-top:4px;">Fix PDF timing</div>
      </div>
      <p style="font-size:12px; color:var(--t3); margin:0; line-height:1.6;">Two teal bracket corners (top-left / bottom-right). Elevates a panel from generic to "watch this."</p>
    </div>

    <div class="sg-card">
      <div class="sg-card-title">Bottom-edge light arc</div>
      <div class="sf-panel sf-panel--glow" style="padding:20px; margin:20px 0;">
        <div style="font-family:var(--font-heading); font-size:14px; color:var(--t1); letter-spacing:0.1em; text-transform:uppercase;">Active instrument</div>
        <p style="font-size:12px; color:var(--t3); margin:6px 0 0;">A faint light arc glows along the bottom edge.</p>
      </div>
      <p style="font-size:12px; color:var(--t3); margin:0; line-height:1.6;">Gradient line from teal at 25% opacity, fading to transparent at edges. Signals "this panel is live."</p>
    </div>

    <div class="sg-card">
      <div class="sg-card-title">Coordinate footer</div>
      <div style="font-family:var(--font-mono); font-size:11px; color:var(--t4); letter-spacing:1.5px; padding:20px 0;">
        © 2026 STELLARFORGE · 39.87°N · 104.97°W
      </div>
      <p style="font-size:12px; color:var(--t3); margin:0; line-height:1.6;">Always sign off with coordinates (Thornton, CO). A tiny reminder this is built by a person, in a place.</p>
    </div>

    <div class="sg-card">
      <div class="sg-card-title">Telemetry ticker</div>
      <div style="padding:20px 0; display:flex; gap:24px; font-family:var(--font-mono); font-size:11px; color:var(--sf-teal-bright); letter-spacing:1.5px;">
        <span>γ 1.414</span>
        <span style="color:var(--t5);">│</span>
        <span>v 0.707c</span>
        <span style="color:var(--t5);">│</span>
        <span>Δt 0.14s</span>
      </div>
      <p style="font-size:12px; color:var(--t3); margin:0; line-height:1.6;">Mono readouts separated by thin pipe characters. Never commas.</p>
    </div>

    <div class="sg-card">
      <div class="sg-card-title">Starfield + grain</div>
      <div style="padding:20px 0;">
        <div style="font-family:var(--font-mono); font-size:11px; color:var(--t3); letter-spacing:1.5px; line-height:1.8;">
          .STARFIELD — fixed, z:0<br/>
          .GRAIN — 3% opacity noise overlay<br/>
          <span style="color:var(--t5);">// never parallax, never animated</span>
        </div>
      </div>
      <p style="font-size:12px; color:var(--t3); margin:0; line-height:1.6;">The cabin always has stars outside. A static SVG starfield + faint fractal grain on every page.</p>
    </div>
  </div>

  <div class="sg-sub">Applied together</div>
  <div class="sf-panel sf-bracket sf-panel--glow" style="padding:40px 40px 30px;">
    <div style="font-family:var(--font-mono); font-size:11px; color:var(--sf-teal); letter-spacing:2px; margin-bottom:16px;">// SECTOR: PHYSICS → ORBITAL MECHANICS</div>
    <div style="font-family:var(--font-display); font-size:48px; color:var(--t1); letter-spacing:0.04em; font-weight:300; line-height:1;">Orrery</div>
    <div style="font-family:var(--font-heading); font-size:14px; color:var(--t3); letter-spacing:0.15em; text-transform:uppercase; margin-top:10px;">STAR SYSTEM BUILDER</div>
    <div style="display:flex; gap:20px; margin-top:28px; font-family:var(--font-mono); font-size:11px; color:var(--sf-teal-bright); letter-spacing:1.5px;">
      <span>● CALIBRATED</span>
      <span style="color:var(--t5);">│</span>
      <span>DEPTH 09/12</span>
      <span style="color:var(--t5);">│</span>
      <span>LAST SYNC 14:22:41</span>
    </div>
    <div style="display:flex; justify-content:flex-end; gap:12px; margin-top:30px;">
      <button class="sf-btn sf-btn--ghost">Open manual</button>
      <button class="sf-btn">Begin survey</button>
    </div>
  </div>
  <div style="margin-top:10px; font-family:var(--font-mono); font-size:10px; color:var(--t4); letter-spacing:1.5px; text-align:center;">// PANEL + BRACKETS + GLOW + // PREFIX + TELEMETRY · THIS IS THE SHIP.</div>
</section>
  `);

  // ───────────────────────────────────────────── 15 DO / DON'T
  parts.push(`
<section id="dosdonts" class="sg-sec sg-anchor">
  <div class="sg-sec-head">
    <div class="sg-sec-head-l">
      <div class="sg-sec-code">// 15 · DO / DON'T</div>
      <h2>The final<br/>checklist.</h2>
    </div>
    <div class="sg-sec-head-r">Before shipping a screen, walk this list. If anything fails, the design is not StellarForge yet.</div>
  </div>

  ${[
    ['Zero radius on containers','Rounded cards with 8px+ border-radius'],
    ['Nichrome only for H1 titles','Nichrome on buttons or body copy'],
    ['Mono for numbers & coordinates','Nichrome or DM Sans tweened for data readouts'],
    ['Color tags the cascade layer','Color chosen "because it looks nice"'],
    ['Ship&rsquo;s Voice in all system strings','"Oops!", emoji, exclamation points, "Let&rsquo;s go!"'],
    ['Panels use tokens (--sf-surface)','Hardcoded #0E1320 or similar hex'],
    ['One primary button per screen','Three teal CTAs competing in the same view'],
    ['Motion 120–280ms, linear, assertive','Bouncy spring curves, 600ms reveals, elastic'],
    ['// prefix for section headers','Icon + sentence headers in every card'],
    ['Coordinates footer (39.87°N, 104.97°W)','Generic "© 2026 Company Name"'],
    ['Starfield + grain on every page','Solid black or gradient backgrounds'],
    ['Body copy in DM Sans','Body copy in Jura or Inter'],
    ['AAA contrast for body text','Muted --t3 used for running copy'],
    ['Teal = Integration. Amber = Physics.','Teal used for the Worlds section header'],
    ['One focal moment per screen','Glow + brackets + bold border + gradient stacked'],
  ].map(([yes, no]) => `
    <div class="sg-do-dont" style="margin-top:12px;">
      <div class="sg-do">
        <div class="sg-do-label">DO</div>
        <div style="font-size:13px; color:var(--t1);">${yes}</div>
      </div>
      <div class="sg-dont">
        <div class="sg-dont-label">DON'T</div>
        <div style="font-size:13px; color:var(--t2);">${no}</div>
      </div>
    </div>
  `).join('')}

  <div style="margin-top:40px; padding:32px; border:1px solid var(--sf-teal); background:rgba(21,193,123,0.04); position:relative;">
    <div class="sf-bracket" style="position:absolute; inset:0;"></div>
    <div style="font-family:var(--font-mono); font-size:11px; color:var(--sf-teal); letter-spacing:2px; margin-bottom:16px;">// THE ONE-LINE TEST</div>
    <div style="font-family:var(--font-display); font-size:36px; color:var(--t1); letter-spacing:0.03em; font-weight:300; line-height:1.15;">If the screen feels like a <em style="font-style:italic; color:var(--sf-teal);">ship's console</em>, it's StellarForge.<br/>If it feels like <em style="font-style:italic; color:var(--sf-crimson);">another SaaS dashboard</em>, start over.</div>
  </div>
</section>
  `);

  // Combine with Part 1
  const full = (window.__SG_SECTIONS_PART1 || '') + parts.join('\n');
  window.__SG_SECTIONS = full;
})();
