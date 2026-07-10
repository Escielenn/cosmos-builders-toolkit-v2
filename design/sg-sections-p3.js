// StellarForge Style Guide sections, Part 3
// Adds Ambient Telemetry + Scrollbars, INSERTED BEFORE the dosdonts section.

(function() {
  const parts = [];

  // ───────────────────────────────────────────── 15 AMBIENT TELEMETRY
  parts.push(`
<section id="ambient" class="sg-sec sg-anchor">
  <div class="sg-sec-head">
    <div class="sg-sec-head-l">
      <div class="sg-sec-code">// 15 · AMBIENT TELEMETRY</div>
      <h2>The ship is<br/>always on.</h2>
    </div>
    <div class="sg-sec-head-r">Micro-signals are the difference between a UI and a ship. Live numbers, drifting coordinates, breathing indicators &mdash; small, non-essential, never blocking. Each one earns its place by reinforcing that you are somewhere, in motion, among instruments.</div>
  </div>

  <!-- Principles strip -->
  <div style="display:grid; grid-template-columns:repeat(4,1fr); gap:0; border-top:1px solid var(--sf-border); border-bottom:1px solid var(--sf-border); margin-bottom:28px;">
    ${[
      ['01','NEVER ESSENTIAL','If it blocks the task, it is not ambient. Micro-signals sit in corners, footers, the periphery.'],
      ['02','ALWAYS HONEST','Numbers are real or plausibly real. Earth&rsquo;s orbital velocity is 29.78 km/s &mdash; use it.'],
      ['03','SLOW MOTION','Drift at 0.05&ndash;0.5 Hz. Fast movement draws the eye; we want peripheral reassurance.'],
      ['04','DISCOVERABLE','Reward the user who reads the footer. Hidden jokes, real coordinates, dated logs.'],
    ].map(([n,t,d]) => `
      <div style="padding:22px 20px; ${n!=='04'?'border-right:1px solid var(--sf-border);':''}">
        <div style="font-family:var(--font-mono); font-size:11px; color:var(--sf-teal); letter-spacing:2px; margin-bottom:8px;">${n}</div>
        <div style="font-family:var(--font-heading); font-size:12px; letter-spacing:1.8px; color:var(--t1); text-transform:uppercase; margin-bottom:10px;">${t}</div>
        <div style="font-size:12.5px; color:var(--t3); line-height:1.55;">${d}</div>
      </div>
    `).join('')}
  </div>

  <!-- Velocity speedometer -->
  <div class="sg-card" style="padding:32px; margin-bottom:20px;">
    <div style="display:grid; grid-template-columns:1fr 360px; gap:40px; align-items:center;">
      <div>
        <div class="sg-card-title">The Velocity Dial</div>
        <h3 style="font-family:var(--font-display); font-weight:300; font-size:32px; color:var(--t1); letter-spacing:0.03em; margin:0 0 14px;">You are already moving.</h3>
        <p style="font-size:14px; color:var(--t3); line-height:1.6; margin:0 0 20px;">A secondary instrument in the footer or loading state. Cycles through four reference frames to remind the user they are a body traveling at cosmic speed while they sit still. The dial sweeps slowly on each transition.</p>
        <div style="display:flex; gap:8px; flex-wrap:wrap;">
          <span class="sf-tag sf-tag--teal">FOOTER ELEMENT</span>
          <span class="sf-tag">LOADING STATES</span>
          <span class="sf-tag">EMPTY STATES</span>
        </div>
      </div>
      <div id="sf-velo-dial" style="position:relative; aspect-ratio:1; background:var(--sf-void); border:1px solid var(--sf-border); padding:20px;">
        <svg viewBox="0 0 200 200" style="width:100%; height:100%;">
          <defs>
            <linearGradient id="veloArc" x1="0" x2="1">
              <stop offset="0" stop-color="#15C17B" stop-opacity="0.1"/>
              <stop offset="1" stop-color="#15C17B" stop-opacity="0.8"/>
            </linearGradient>
          </defs>
          <!-- Tick ring -->
          ${Array.from({length:60}).map((_,i) => {
            const a = -Math.PI*1.25 + (i/59)*Math.PI*1.5;
            const x1 = 100 + Math.cos(a)*82, y1 = 100 + Math.sin(a)*82;
            const x2 = 100 + Math.cos(a)*(i%5===0?72:76), y2 = 100 + Math.sin(a)*(i%5===0?72:76);
            return `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${i%5===0?'#6B7484':'#2E3548'}" stroke-width="${i%5===0?1.2:0.8}"/>`;
          }).join('')}
          <!-- Arc base -->
          <path d="M ${100+Math.cos(-Math.PI*1.25)*60} ${100+Math.sin(-Math.PI*1.25)*60} A 60 60 0 1 1 ${100+Math.cos(Math.PI*0.25)*60} ${100+Math.sin(Math.PI*0.25)*60}" fill="none" stroke="#2E3548" stroke-width="3"/>
          <!-- Arc filled (35%) -->
          <path id="veloArcFill" d="" fill="none" stroke="url(#veloArc)" stroke-width="3" stroke-linecap="round"/>
          <!-- Needle -->
          <line id="veloNeedle" x1="100" y1="100" x2="100" y2="40" stroke="#15C17B" stroke-width="1.5" style="transform-origin:100px 100px; transition:transform 2400ms cubic-bezier(0.4,0,0.2,1);"/>
          <circle cx="100" cy="100" r="5" fill="#0A0E17" stroke="#15C17B" stroke-width="1.5"/>
          <circle cx="100" cy="100" r="1.5" fill="#15C17B"/>
        </svg>
        <div style="position:absolute; left:50%; top:62%; transform:translateX(-50%); text-align:center;">
          <div id="veloFrame" style="font-family:var(--font-mono); font-size:9.5px; color:var(--t4); letter-spacing:2px;">EARTH ROTATION</div>
          <div id="veloValue" style="font-family:var(--font-display); font-weight:300; font-size:26px; color:var(--t1); letter-spacing:0.04em; margin-top:4px;">0.465<span style="font-size:12px; color:var(--t4); margin-left:4px;">km/s</span></div>
        </div>
        <div style="position:absolute; left:14px; top:14px; font-family:var(--font-mono); font-size:9px; color:var(--sf-teal); letter-spacing:2px;">VELOCITY</div>
        <div style="position:absolute; right:14px; top:14px; font-family:var(--font-mono); font-size:9px; color:var(--t5); letter-spacing:2px;">REF-FRAME</div>
      </div>
    </div>

    <!-- Reference frames table -->
    <div style="margin-top:28px; border-top:1px solid var(--sf-border); padding-top:20px;">
      <div class="sg-card-title" style="margin-bottom:12px;">Reference frames in rotation</div>
      <div style="display:grid; grid-template-columns:repeat(4,1fr); gap:0; border:1px solid var(--sf-border);">
        ${[
          ['EARTH ROTATION','0.465','km/s','Equator spin &mdash; the slowest humbling.'],
          ['SOLAR ORBIT','29.78','km/s','Earth around the Sun. The one most people know.'],
          ['SOLAR APEX','19.4','km/s','The Sun toward Vega, through the local neighborhood.'],
          ['GALACTIC ORBIT','230','km/s','The Sun around Sgr A*. Everything is moving.'],
        ].map(([frame,v,u,note],i) => `
          <div style="padding:16px; ${i<3?'border-right:1px solid var(--sf-border);':''}">
            <div style="font-family:var(--font-mono); font-size:9.5px; letter-spacing:1.8px; color:var(--sf-teal); margin-bottom:6px;">${frame}</div>
            <div style="font-family:var(--font-display); font-weight:300; font-size:24px; color:var(--t1); letter-spacing:0.02em;">${v}<span style="font-size:11px; color:var(--t4); margin-left:4px;">${u}</span></div>
            <div style="font-size:11.5px; color:var(--t4); line-height:1.5; margin-top:6px;">${note}</div>
          </div>
        `).join('')}
      </div>
    </div>
  </div>

  <!-- Parallax coord strip -->
  <div class="sg-card" style="padding:0; margin-bottom:20px; overflow:hidden;">
    <div style="padding:24px 28px; border-bottom:1px solid var(--sf-border);">
      <div style="display:flex; justify-content:space-between; align-items:flex-end; gap:20px;">
        <div>
          <div class="sg-card-title" style="margin-bottom:8px;">Parallax coordinate strips</div>
          <h3 style="font-family:var(--font-display); font-weight:300; font-size:26px; color:var(--t1); letter-spacing:0.03em; margin:0;">Drifting background data.</h3>
        </div>
        <div style="font-size:13px; color:var(--t3); max-width:460px; text-align:right;">Horizontal strips of mono text that drift at different speeds as the user scrolls. Three layers, three speeds, opacity 3&ndash;12%. Never over focal content.</div>
      </div>
    </div>
    <div id="sf-parallax-demo" style="position:relative; height:220px; background:linear-gradient(180deg, rgba(10,14,23,1), rgba(18,23,36,1)); overflow:hidden;">
      <div class="sf-plx-strip" data-speed="0.3" style="position:absolute; top:24px; left:0; white-space:nowrap; font-family:var(--font-mono); font-size:10px; color:rgba(255,255,255,0.10); letter-spacing:3px; will-change:transform;">
        39.87°N · 104.97°W &nbsp;·&nbsp; ALT 5280 ft &nbsp;·&nbsp; PRESSURE 1013.25 hPa &nbsp;·&nbsp; T -18.4°C &nbsp;·&nbsp; SOL 19,327 &nbsp;·&nbsp; JD 2461158.5 &nbsp;·&nbsp; LUNAR PHASE 0.74 &nbsp;·&nbsp; SUNSET 16:41:02 &nbsp;·&nbsp; MAG -26.74 &nbsp;·&nbsp; AU 1.00000 &nbsp;·&nbsp; 39.87°N · 104.97°W &nbsp;·&nbsp; ALT 5280 ft &nbsp;·&nbsp; SOL 19,327
      </div>
      <div class="sf-plx-strip" data-speed="0.6" style="position:absolute; top:72px; left:0; white-space:nowrap; font-family:var(--font-mono); font-size:11px; color:rgba(21,193,123,0.18); letter-spacing:2.5px; will-change:transform;">
        WORLDS: 00347 &nbsp;&middot;&nbsp; SPECIES: 02,184 &nbsp;&middot;&nbsp; SAVES: 19,402,718 &nbsp;&middot;&nbsp; UPTIME 99.987% &nbsp;&middot;&nbsp; P95 LATENCY 42ms &nbsp;&middot;&nbsp; REGION US-WEST-2 &nbsp;&middot;&nbsp; BUILD 2026.05.28-rc4 &nbsp;&middot;&nbsp; WORLDS: 00347 &nbsp;&middot;&nbsp; SPECIES: 02,184
      </div>
      <div class="sf-plx-strip" data-speed="1.0" style="position:absolute; top:120px; left:0; white-space:nowrap; font-family:var(--font-mono); font-size:12px; color:rgba(255,255,255,0.06); letter-spacing:2px; will-change:transform;">
        // [NOTE] biome/tundra parameters stable across 1e4 iterations &nbsp;·&nbsp; checksum 7F2A-91B0-44CE &nbsp;·&nbsp; seed 0xDEADB10C &nbsp;·&nbsp; author: batt,j &nbsp;·&nbsp; rev 142 &nbsp;·&nbsp; last_commit "fix: gravity tensor drift in low-g" &nbsp;·&nbsp; checksum 7F2A-91B0-44CE
      </div>
      <div class="sf-plx-strip" data-speed="1.6" style="position:absolute; top:164px; left:0; white-space:nowrap; font-family:var(--font-mono); font-size:10.5px; color:rgba(255,184,0,0.14); letter-spacing:3px; will-change:transform;">
        TRAJECTORY BOUND &middot;&middot;&middot; ECLIPTIC +07.42° &middot;&middot;&middot; TARGET: WOLF 359 &middot;&middot;&middot; 7.86 ly &middot;&middot;&middot; Δv 4.22e7 m/s &middot;&middot;&middot; TRAJECTORY BOUND &middot;&middot;&middot; ECLIPTIC +07.42° &middot;&middot;&middot; TARGET: WOLF 359 &middot;&middot;&middot; 7.86 ly
      </div>
      <div style="position:absolute; top:8px; right:12px; font-family:var(--font-mono); font-size:9px; color:var(--t5); letter-spacing:2px;">// SCROLL THIS PAGE · FOUR LAYERS · FOUR SPEEDS</div>
    </div>
  </div>

  <!-- Easter egg catalogue -->
  <div class="sg-card" style="padding:28px;">
    <div class="sg-card-title">The ambient catalogue</div>
    <h3 style="font-family:var(--font-display); font-weight:300; font-size:26px; color:var(--t1); letter-spacing:0.03em; margin:0 0 18px;">Eleven small, hidden things.</h3>
    <div style="display:grid; grid-template-columns:repeat(2,1fr); gap:0; border-top:1px solid var(--sf-border);">
      ${[
        ['01','VELOCITY DIAL','Footer, cycles every 14s through 4 ref-frames. Real values.'],
        ['02','DRIFTING COORDS','Four parallax strips, 0.3×–1.6× scroll speed. Boulder lat/lon loops.'],
        ['03','JULIAN DAY CLOCK','Ticks in the top bar. Astronomical timestamp for the nerds.'],
        ['04','SOL COUNTER','Days since StellarForge began. Integer, never reset.'],
        ['05','BUILD SIGIL','Hash of git SHA, bottom-left. Click for 3-second telemetry burst.'],
        ['06','BREATHING STAR','One star in the starfield pulses 0.08–0.12 Hz. Polaris.'],
        ['07','COMMIT MESSAGE','Real git commit message scrolls in strip 3. Rotates daily.'],
        ['08','LUNAR PHASE','Tiny phase glyph next to the date. Updates with moon.'],
        ['09','ATMOSPHERIC','Pressure, temp, visibility — pulled from METAR when online.'],
        ['10','KONAMI CODE','↑↑↓↓←→←→BA unlocks "Captain&rsquo;s View" &mdash; full-screen star chart.'],
        ['11','TARGET STAR','Rotating "next destination" star with live distance in ly.'],
      ].map(([n,t,d],i) => `
        <div style="padding:16px 18px; ${i%2===0?'border-right:1px solid var(--sf-border);':''} border-bottom:1px solid var(--sf-border); display:flex; gap:14px; align-items:flex-start;">
          <span style="font-family:var(--font-mono); font-size:10px; color:var(--sf-teal); letter-spacing:1.5px; min-width:18px;">${n}</span>
          <div style="flex:1;">
            <div style="font-family:var(--font-heading); font-size:11.5px; letter-spacing:1.8px; color:var(--t1); text-transform:uppercase; margin-bottom:4px;">${t}</div>
            <div style="font-size:12px; color:var(--t3); line-height:1.5;">${d}</div>
          </div>
        </div>
      `).join('')}
    </div>
  </div>

  <!-- Implementation snippet -->
  <div class="sg-card" style="padding:24px 28px; margin-top:20px;">
    <div class="sg-card-title">Parallax drift · CSS recipe</div>
    <pre style="font-family:var(--font-mono); font-size:12px; color:var(--t2); line-height:1.65; margin:0; white-space:pre-wrap;">
<span style="color:var(--t5);">/* JS: on scroll, transform each strip by y * speed */</span>
<span style="color:var(--sf-teal);">window</span>.addEventListener(<span style="color:var(--sf-amber);">'scroll'</span>, () =&gt; {
  <span style="color:var(--sf-teal);">document</span>.querySelectorAll(<span style="color:var(--sf-amber);">'.sf-plx-strip'</span>).forEach(el =&gt; {
    <span style="color:#FF00AA;">const</span> speed = parseFloat(el.dataset.speed);
    el.style.transform = <span style="color:var(--sf-amber);">\`translate3d(\${-window.scrollY * speed}px, 0, 0)\`</span>;
  });
}, { passive: <span style="color:#FF00AA;">true</span> });</pre>
  </div>
</section>
`);

  // ───────────────────────────────────────────── 16 SCROLLBARS
  parts.push(`
<section id="scrollbars" class="sg-sec sg-anchor">
  <div class="sg-sec-head">
    <div class="sg-sec-head-l">
      <div class="sg-sec-code">// 16 · SCROLLBARS</div>
      <h2>Instruments,<br/>not hardware.</h2>
    </div>
    <div class="sg-sec-head-r">Default scrollbars advertise the OS. Skinned scrollbars feel like part of the ship. Three variants: default (sidebars, dialogs), slim (panels, chat), hidden-on-idle (long scrolling content). Always narrow, always dark, never flashy.</div>
  </div>

  <!-- Token reference -->
  <div class="sg-card" style="padding:24px 28px; margin-bottom:20px;">
    <div class="sg-card-title">Scrollbar tokens</div>
    <div style="display:grid; grid-template-columns:repeat(4,1fr); gap:20px; margin-top:8px;">
      ${[
        ['--sb-track','#0A0E17','void','Same as body background. Scrollbar disappears into the ship.'],
        ['--sb-thumb','#2E3548','border','Resting. Visible but quiet, AA against track.'],
        ['--sb-thumb-hover','#3D4658','strong','On hover. One step up in brightness, never teal.'],
        ['--sb-width','8px','mono','Slim variant: 6px. System-default 15px is forbidden.'],
      ].map(([tok,val,cls,note]) => `
        <div>
          <div style="font-family:var(--font-mono); font-size:10.5px; color:var(--sf-teal); letter-spacing:1.8px; margin-bottom:8px;">${tok}</div>
          <div style="display:flex; align-items:center; gap:10px; padding:10px 12px; background:var(--sf-void); border:1px solid var(--sf-border); margin-bottom:8px;">
            <div style="width:14px; height:14px; background:${val}; ${cls==='mono'?'background:transparent; border:1px dashed var(--sf-border);':''}"></div>
            <span style="font-family:var(--font-mono); font-size:11px; color:var(--t2);">${val}</span>
          </div>
          <div style="font-size:12px; color:var(--t4); line-height:1.5;">${note}</div>
        </div>
      `).join('')}
    </div>
  </div>

  <!-- Live demos -->
  <div style="display:grid; grid-template-columns:repeat(3,1fr); gap:20px; margin-bottom:20px;">
    <!-- Default -->
    <div class="sg-card" style="padding:0; overflow:hidden;">
      <div style="padding:16px 20px; border-bottom:1px solid var(--sf-border); display:flex; justify-content:space-between; align-items:center;">
        <div>
          <div class="sg-card-title" style="margin-bottom:4px;">Default</div>
          <div style="font-size:11px; color:var(--t4);">8px · always visible</div>
        </div>
        <span class="sf-tag sf-tag--teal" style="font-size:9px;">DEFAULT</span>
      </div>
      <div class="sf-sb sf-sb--default" style="height:200px; overflow-y:auto; padding:16px 20px;">
        ${Array.from({length:18}).map((_,i) => `<div style="font-family:var(--font-mono); font-size:11px; color:var(--t3); padding:6px 0; border-bottom:1px dashed var(--sf-border);">LOG-${String(i+1).padStart(4,'0')} · ${['WORLD_SAVED','EXPORT_QUEUED','SPECIES_CREATED','BIOME_RENDERED','CLIMATE_SIM_OK','ATMOS_INTEGRITY'][i%6]}</div>`).join('')}
      </div>
    </div>

    <!-- Slim -->
    <div class="sg-card" style="padding:0; overflow:hidden;">
      <div style="padding:16px 20px; border-bottom:1px solid var(--sf-border); display:flex; justify-content:space-between; align-items:center;">
        <div>
          <div class="sg-card-title" style="margin-bottom:4px;">Slim</div>
          <div style="font-size:11px; color:var(--t4);">6px · panels, chat</div>
        </div>
        <span class="sf-tag" style="font-size:9px;">SLIM</span>
      </div>
      <div class="sf-sb sf-sb--slim" style="height:200px; overflow-y:auto; padding:16px 20px;">
        <div style="font-size:12.5px; color:var(--t2); line-height:1.7;">The slim variant is used in side panels, chat transcripts, the command palette — any narrow surface where a default 8px rail would feel clumsy. The thumb is only 6px wide but the track still has breathing room. It behaves identically otherwise: visible at rest, brighter on hover, no transitions. Scroll to see it behave under load.</div>
        ${Array.from({length:10}).map((_,i) => `<div style="font-family:var(--font-mono); font-size:11px; color:var(--t3); padding:6px 0; margin-top:4px;">§ ${i+1}. ${['Aperture','Drift','Signal','Integrity','Telemetry','Bearing','Altitude','Echo','Meridian','Chord'][i]}</div>`).join('')}
      </div>
    </div>

    <!-- Hidden on idle -->
    <div class="sg-card" style="padding:0; overflow:hidden;">
      <div style="padding:16px 20px; border-bottom:1px solid var(--sf-border); display:flex; justify-content:space-between; align-items:center;">
        <div>
          <div class="sg-card-title" style="margin-bottom:4px;">Idle-hide</div>
          <div style="font-size:11px; color:var(--t4);">fades when still</div>
        </div>
        <span class="sf-tag" style="font-size:9px;">LONG-FORM</span>
      </div>
      <div class="sf-sb sf-sb--idle" style="height:200px; overflow-y:auto; padding:16px 20px;">
        <div style="font-size:12.5px; color:var(--t2); line-height:1.65;">For long-form reading surfaces — docs, the lore codex, the system prompt — the scrollbar fades to zero opacity a second after motion stops. Hover the track edge to bring it back. Never use this variant on anything that requires quick random access; people need to see the thumb to know how far they are.</div>
        ${Array.from({length:12}).map((_,i) => `<p style="font-size:12.5px; color:var(--t2); line-height:1.7; margin:10px 0;">${['Chapter','Entry','Log','Appendix','Annex'][i%5]} ${i+1}. The ship is always moving, even when you are still. This paragraph exists so the content is tall enough to scroll. Keep reading.</p>`).join('')}
      </div>
    </div>
  </div>

  <!-- Snippet -->
  <div class="sg-card" style="padding:24px 28px;">
    <div class="sg-card-title">The canonical recipe</div>
    <pre style="font-family:var(--font-mono); font-size:11.5px; color:var(--t2); line-height:1.7; margin:0; white-space:pre-wrap;">
<span style="color:var(--t5);">/* Default: 8px, always visible. Used on body, sidebars, dialogs. */</span>
<span style="color:var(--sf-teal);">.sf-sb</span> { scrollbar-color: <span style="color:var(--sf-amber);">#2E3548 #0A0E17</span>; scrollbar-width: thin; }
<span style="color:var(--sf-teal);">.sf-sb::-webkit-scrollbar</span>           { width: <span style="color:var(--sf-amber);">8px</span>; height: <span style="color:var(--sf-amber);">8px</span>; }
<span style="color:var(--sf-teal);">.sf-sb::-webkit-scrollbar-track</span>     { background: <span style="color:var(--sf-amber);">#0A0E17</span>; }
<span style="color:var(--sf-teal);">.sf-sb::-webkit-scrollbar-thumb</span>     { background: <span style="color:var(--sf-amber);">#2E3548</span>; border-radius: <span style="color:var(--sf-amber);">0</span>; }
<span style="color:var(--sf-teal);">.sf-sb::-webkit-scrollbar-thumb:hover</span> { background: <span style="color:var(--sf-amber);">#3D4658</span>; }
<span style="color:var(--sf-teal);">.sf-sb::-webkit-scrollbar-corner</span>    { background: <span style="color:var(--sf-amber);">#0A0E17</span>; }

<span style="color:var(--t5);">/* Slim: 6px, for narrow surfaces */</span>
<span style="color:var(--sf-teal);">.sf-sb--slim::-webkit-scrollbar</span> { width: <span style="color:var(--sf-amber);">6px</span>; }

<span style="color:var(--t5);">/* Idle-hide: fades after 800ms of no scroll activity */</span>
<span style="color:var(--sf-teal);">.sf-sb--idle::-webkit-scrollbar-thumb</span> {
  background: transparent;
  transition: background 300ms ease 800ms;
}
<span style="color:var(--sf-teal);">.sf-sb--idle:hover::-webkit-scrollbar-thumb,</span>
<span style="color:var(--sf-teal);">.sf-sb--idle.is-scrolling::-webkit-scrollbar-thumb</span> {
  background: <span style="color:var(--sf-amber);">#2E3548</span>;
  transition-delay: <span style="color:var(--sf-amber);">0ms</span>;
}</pre>
  </div>

  <!-- Don't table -->
  <div style="display:grid; grid-template-columns:repeat(2,1fr); gap:16px; margin-top:20px;">
    <div class="sg-do">
      <div class="sg-dont-label" style="color:var(--sf-teal);">DO</div>
      <ul style="margin:10px 0 0; padding-left:18px; font-size:13px; color:var(--t2); line-height:1.8;">
        <li>Apply <span class="sf-mono" style="color:var(--sf-teal);">.sf-sb</span> to every scrollable container</li>
        <li>Keep the thumb darker than the surface background</li>
        <li>Zero border-radius. Scrollbars match panel geometry.</li>
        <li>Use slim variant in narrow surfaces (&lt; 360px wide)</li>
      </ul>
    </div>
    <div class="sg-dont">
      <div class="sg-dont-label">DON'T</div>
      <ul style="margin:10px 0 0; padding-left:18px; font-size:13px; color:var(--t2); line-height:1.8;">
        <li>Never tint the thumb teal, amber, or any accent color</li>
        <li>Never use <span class="sf-mono">overflow: hidden</span> to &ldquo;solve&rdquo; a styling problem</li>
        <li>No pill-shaped thumbs. No rounded corners.</li>
        <li>Do not hide scrollbars entirely &mdash; always give a visual affordance</li>
      </ul>
    </div>
  </div>
</section>
`);

  // ─── Insert BEFORE dosdonts section in the existing payload
  const payload = window.__SG_SECTIONS || '';
  const marker = '<section id="dosdonts"';
  const idx = payload.indexOf(marker);
  const insertion = parts.join('\n');

  if (idx === -1) {
    // Fallback: append
    window.__SG_SECTIONS = payload + insertion;
  } else {
    window.__SG_SECTIONS = payload.slice(0, idx) + insertion + payload.slice(idx);
  }
})();
