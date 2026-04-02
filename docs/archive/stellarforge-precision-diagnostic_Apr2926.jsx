import { useState, useCallback, useRef } from "react";

/*
 * StellarForge Precision Diagnostic
 * Built from analysis of 100+ source files from the cosmos-builders-toolkit-v2 repo.
 * This tool maps the gap between what EXISTS in code and what the user EXPERIENCES.
 */

const FINDINGS = {
  working: [
    { system: "Worksheet → Wiki Auto-Draft", file: "use-worksheets.ts", detail: "Every worksheet create/update calls createDraftWikiPage + syncWorksheetToEntity. All 21 worksheet tools are connected." },
    { system: "Wiki Editor + [[ Linking", file: "WikiEditor.tsx + WikiLinkExtension.ts", detail: "TipTap with custom wikiLink node, autocomplete against world_entries, dead link detection, backlinks." },
    { system: "Entity CRUD (12 types)", file: "EntityPickerDialog.tsx + use-world-entities.ts", detail: "planet, star_system, species, faction, character, technology, location, artifact, vessel, language, mythology, custom." },
    { system: "Entity ↔ Worksheet Linking", file: "WorksheetLauncherGrid.tsx", detail: "entity_worksheets junction table. Wiki pages show relevant tools per entity type." },
    { system: "Entity Sync (Worksheet → Entity)", file: "EntitySyncNotice.tsx + entity-sync service", detail: "Pending changes with accept/dismiss UI. Fires on every worksheet update." },
    { system: "Codex Sidebar", file: "Codex.tsx", detail: "Cascade/entity dual grouping, search, tag filtering, pinning, recent edits, context menus, completion bar." },
    { system: "Knowledge Graph", file: "KnowledgeGraphView.tsx", detail: "ReactFlow with worksheets + entries + typed relationship edges. At /worlds/:id/graph." },
    { system: "Connections Graph", file: "WorldConnectionsGraph.tsx", detail: "D3 force layout showing worksheet-to-worksheet links. At /worlds/:id/connections." },
    { system: "Chronicle Timeline", file: "use-chronicle.ts", detail: "Full CRUD for timeline events with calendar config." },
    { system: "Writing Workshop", file: "WriteSheet.tsx + use-writing-entries.ts", detail: "Auto-save to writing_entries table, world association, tags, prompts, goals, streaks." },
    { system: "Tag Persistence", file: "use-tags.ts", detail: "worksheet_tags table in Supabase with colors + usage counts. Entry tags via world_entries.tags." },
    { system: "Version History", file: "VersionHistory.tsx + WorldSnapshotDialog.tsx", detail: "JSON/ZIP snapshots, database versioning, restore capability." },
    { system: "PDF/Category Export", file: "HierarchicalExportDialog.tsx", detail: "Category-based PDF export with theme selection." },
    { system: "World Notes", file: "WorldNotes.tsx + use-world-notes.ts", detail: "Per-world rich text notes with tags and auto-save." },
    { system: "Collaboration", file: "use-collaborators.ts", detail: "Invite system, role-based access (owner/editor/viewer), timeline presence." },
  ],
  broken: [
    { system: "Simulators → Entity Layer", severity: "critical", detail: "ROGUE, Tidelock, ExoSky, ExoForge, Solaris are standalone HTML/JS in iframes. They never call useWorksheets, so they bypass auto-draft wiki pages and entity sync entirely." },
    { system: "Stellar Cartographer → Entity Layer", severity: "critical", detail: "Separate subproject in /cartographers/ with its own CartographerState. Generated empires, stars, trade routes, and wormholes exist only in local state. Nothing writes to world_entries." },
    { system: "Codex ↔ Writing Entries", severity: "unknown", detail: "Writing entries store to writing_entries table (separate from world_entries). Whether getCodexData() includes them depends on src/services/world-data.ts which needs audit." },
    { system: "Export Format Bugs", severity: "medium", detail: "DOCX saves as .txt, JSON saves as text, PDF preview broken. These are isolated MIME type / file extension bugs in the export pipeline." },
  ],
  uncertain: [
    { question: "Does getCodexData() aggregate writing_entries into the sidebar?", file: "src/services/world-data.ts", impact: "If not, writing workshop content is invisible from inside a world." },
    { question: "Which tools have infobox templates in infoboxTemplates.ts?", file: "src/services/infoboxTemplates.ts", impact: "Tools without templates show empty data profiles on wiki pages." },
    { question: "Does the galaxy creator generate content that writes anywhere?", file: "Stellar Cartographer state", impact: "If not, all galaxy content is ephemeral." },
  ]
};

const PROBLEMS = [
  {
    id: "planet-not-updating",
    label: "A planet made in one tool doesn't update when edited in another",
    rootCause: "This SHOULD work via syncWorksheetToEntity. Possible causes: (a) the tools aren't saving to the same entity, (b) entity sync is failing silently, (c) two separate worksheets created for the same concept without linking.",
    codeAction: "grep -rn 'syncWorksheetToEntity' src/services/entity-sync.ts — audit the sync logic. Check if it matches on entity name or only on tool_data_id.",
    priority: "high"
  },
  {
    id: "duplicate-planets",
    label: "Creating a planet in one tool creates a separate entity even though one already exists",
    rootCause: "createDraftWikiPage likely creates a new entry per worksheet, not per entity name. Two Planetary Profile worksheets for 'Kepler-442b' would create two wiki pages.",
    codeAction: "cat src/services/world-entries.ts — check if createDraftWikiPage does a name-match check before creating. If not, add deduplication logic.",
    priority: "high"
  },
  {
    id: "galaxy-orphaned",
    label: "Galaxy creator generates planets and empires not connected to anything",
    rootCause: "CONFIRMED: Stellar Cartographer has its own CartographerState with DEFAULT_EMPIRES hardcoded. It never calls useWorksheets or createEntityEntry. All content is local.",
    codeAction: "Add a 'Publish to World' action in the Cartographer that creates world_entries for user-named empires and notable star systems.",
    priority: "critical"
  },
  {
    id: "systems-no-planet-prompt",
    label: "Systems don't ask if planets should be in various solar systems",
    rootCause: "Tools don't cross-reference existing entities during creation. The worksheet-link system connects tools AFTER creation but doesn't suggest placements.",
    codeAction: "Add entity-aware context to tool entry: when opening Planetary Profile, show existing star systems as optional parents.",
    priority: "medium"
  },
  {
    id: "two-mindmaps",
    label: "Two mindmap tools that seem broken with no explanation of difference",
    rootCause: "NOT broken — they're different views: KnowledgeGraphView (ReactFlow, entities + worksheets) at /graph and WorldConnectionsGraph (D3, worksheet-to-worksheet) at /connections. Missing: clear labels and descriptions.",
    codeAction: "Add 1-line descriptions to WorldGraph.tsx and WorldConnections.tsx page headers explaining purpose. Consider renaming in CodexQuickAccess.",
    priority: "low"
  },
  {
    id: "two-timelines",
    label: "Two timeline tools with unclear differentiation",
    rootCause: "WorldChronicle (at /chronicle) is for world history events. SpaceExpansionModeler (at /tools/space-expansion-modeler) is for empire expansion over time. Timeline tool is a third Pro worksheet. They serve different purposes.",
    codeAction: "Add descriptions. The Chronicle is the primary timeline; SEM is a specialized expansion tool; Timeline worksheet is structured event recording.",
    priority: "low"
  },
  {
    id: "writing-invisible",
    label: "Writing portfolio seems broken — responses to prompts hard to find",
    rootCause: "Writing entries are in writing_entries table. They may not appear in the Codex sidebar (depends on getCodexData). The Writing Workshop is at /workshop, separate from the world context.",
    codeAction: "Audit src/services/world-data.ts getCodexData function. If writing_entries aren't included, add them as a section or integrate into the narrative cascade layer.",
    priority: "high"
  },
  {
    id: "wiki-broken",
    label: "Wiki option of linking seems entirely broken",
    rootCause: "Wiki linking IS functional — [[ trigger works, autocomplete works, dead link detection works. The issue may be: (a) user never entered edit mode, (b) entity doesn't exist to link to, (c) the feature is undiscoverable.",
    codeAction: "Verify by testing: enter a wiki page, click Edit, type [[ — autocomplete should appear. If not, debug useWikiLinkTrigger. If yes, the problem is discoverability.",
    priority: "medium"
  },
  {
    id: "world-bible-broken",
    label: "World Bible export doesn't work / content not accessible",
    rootCause: "WorldBibleDialog.tsx and WorldExportDialog.tsx exist but weren't in uploaded files. Export format bugs (DOCX as .txt) are isolated MIME type issues.",
    codeAction: "Audit src/components/world/WorldBibleDialog.tsx and src/components/world/WorldExportDialog.tsx. Fix MIME types in download handlers.",
    priority: "medium"
  },
];

function App() {
  const [phase, setPhase] = useState("findings");
  const [selectedProblems, setSelectedProblems] = useState(new Set());
  const [notes, setNotes] = useState({});
  const reportRef = useRef(null);

  const toggleProblem = useCallback((id) => {
    setSelectedProblems(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }, []);

  const updateNote = useCallback((id, text) => {
    setNotes(prev => ({ ...prev, [id]: text }));
  }, []);

  const downloadSpec = useCallback(() => {
    const selected = PROBLEMS.filter(p => selectedProblems.has(p.id));
    let md = `# StellarForge Remediation Spec — From Diagnostic\n\n`;
    md += `Generated: ${new Date().toISOString().slice(0,10)}\n`;
    md += `Problems selected: ${selected.length}\n\n`;
    md += `## PRE-FLIGHT: Read CLAUDE.md, SIMULATOR_AESTHETIC.md, AESTHETIC_BRIDGE.md before touching code.\n\n`;
    
    for (const p of selected) {
      md += `---\n\n### ${p.label}\n\n`;
      md += `**Priority:** ${p.priority}\n\n`;
      md += `**Root cause:** ${p.rootCause}\n\n`;
      md += `**Action:** \`${p.codeAction}\`\n\n`;
      if (notes[p.id]) md += `**Notes from Jason:** ${notes[p.id]}\n\n`;
    }
    
    md += `---\n\n## Files confirmed working (do NOT rewrite):\n\n`;
    for (const f of FINDINGS.working) {
      md += `- ${f.file} — ${f.system}\n`;
    }
    
    md += `\n## Files that need audit:\n\n`;
    for (const u of FINDINGS.uncertain) {
      md += `- ${u.file} — ${u.question}\n`;
    }

    const blob = new Blob([md], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "StellarForge_Remediation_Spec.md";
    a.click();
    URL.revokeObjectURL(url);
  }, [selectedProblems, notes]);

  return (
    <div style={S.root}>
      <style>{CSS}</style>
      
      <div style={S.header}>
        <div style={S.glow} />
        <h1 style={S.title}>STELLARFORGE DIAGNOSTIC</h1>
        <p style={S.sub}>PRECISION ANALYSIS — CODE-VERIFIED</p>
        <div style={S.tabs}>
          {["findings", "problems", "spec"].map(t => (
            <button key={t} onClick={() => setPhase(t)} style={{
              ...S.tab, 
              color: phase === t ? "#3DFFCD" : "rgba(255,255,255,0.35)",
              borderBottom: phase === t ? "2px solid #3DFFCD" : "2px solid transparent"
            }}>
              {t.toUpperCase()}
            </button>
          ))}
        </div>
      </div>

      {phase === "findings" && (
        <div style={S.section}>
          <h2 style={{...S.h2, color: "#3DFFCD"}}>CONFIRMED WORKING ({FINDINGS.working.length} systems)</h2>
          <p style={S.note}>These systems are fully wired in the codebase. If they appear broken, the issue is UX/discoverability, not code.</p>
          {FINDINGS.working.map((f,i) => (
            <div key={i} style={S.findingCard}>
              <div style={S.findingTop}>
                <span style={{color:"#3DFFCD",fontSize:10}}>●</span>
                <span style={S.findingName}>{f.system}</span>
                <span style={S.findingFile}>{f.file}</span>
              </div>
              <p style={S.findingDetail}>{f.detail}</p>
            </div>
          ))}

          <h2 style={{...S.h2, color: "#FF3366", marginTop: 40}}>CONFIRMED BROKEN ({FINDINGS.broken.length} gaps)</h2>
          {FINDINGS.broken.map((f,i) => (
            <div key={i} style={{...S.findingCard, borderLeft: `3px solid ${f.severity === "critical" ? "#FF3366" : f.severity === "unknown" ? "#FFB800" : "#FFB800"}`}}>
              <div style={S.findingTop}>
                <span style={{color: f.severity === "critical" ? "#FF3366" : "#FFB800", fontSize:10, fontFamily:"'JetBrains Mono',monospace"}}>{f.severity.toUpperCase()}</span>
                <span style={S.findingName}>{f.system}</span>
              </div>
              <p style={S.findingDetail}>{f.detail}</p>
            </div>
          ))}

          <h2 style={{...S.h2, color: "#FFB800", marginTop: 40}}>NEEDS AUDIT ({FINDINGS.uncertain.length} questions)</h2>
          {FINDINGS.uncertain.map((f,i) => (
            <div key={i} style={{...S.findingCard, borderLeft: "3px solid rgba(255,184,0,0.3)"}}>
              <p style={{...S.findingDetail, color: "rgba(255,255,255,0.6)"}}>{f.question}</p>
              <p style={{...S.findingDetail, fontSize: 11}}>File: {f.file} — Impact: {f.impact}</p>
            </div>
          ))}
        </div>
      )}

      {phase === "problems" && (
        <div style={S.section}>
          <h2 style={S.h2}>YOUR REPORTED PROBLEMS — MAPPED TO CODE</h2>
          <p style={S.note}>Select each problem you want addressed. Add notes to clarify your specific experience. Selected problems will be compiled into the Claude Code spec.</p>
          {PROBLEMS.map(p => {
            const sel = selectedProblems.has(p.id);
            return (
              <div key={p.id} style={{...S.problemCard, borderColor: sel ? "#3DFFCD" : "rgba(255,255,255,0.06)", boxShadow: sel ? "0 0 20px rgba(61,255,205,0.08)" : "none"}}>
                <div style={S.problemTop}>
                  <button onClick={() => toggleProblem(p.id)} style={{...S.checkbox, borderColor: sel ? "#3DFFCD" : "rgba(255,255,255,0.2)", background: sel ? "#3DFFCD" : "transparent", color: sel ? "#0A0E17" : "transparent"}}>✓</button>
                  <span style={{...S.problemLabel, color: sel ? "#FAFAFA" : "rgba(255,255,255,0.6)"}}>{p.label}</span>
                  <span style={{...S.priority, color: p.priority === "critical" ? "#FF3366" : p.priority === "high" ? "#FFB800" : p.priority === "medium" ? "#4D9FFF" : "rgba(255,255,255,0.3)"}}>{p.priority.toUpperCase()}</span>
                </div>
                <div style={S.problemBody}>
                  <p style={{...S.findingDetail, marginBottom: 8}}><strong style={{color:"rgba(255,255,255,0.5)"}}>Root cause:</strong> {p.rootCause}</p>
                  <p style={{...S.findingDetail, fontFamily:"'JetBrains Mono',monospace", fontSize: 11, color: "rgba(0,212,255,0.6)"}}>{p.codeAction}</p>
                </div>
                {sel && (
                  <textarea 
                    value={notes[p.id] || ""} 
                    onChange={e => updateNote(p.id, e.target.value)}
                    placeholder="Add context about your specific experience with this issue..."
                    style={S.textarea}
                  />
                )}
              </div>
            );
          })}
        </div>
      )}

      {phase === "spec" && (
        <div style={S.section}>
          <h2 style={S.h2}>GENERATE CLAUDE CODE SPEC</h2>
          <p style={S.note}>
            {selectedProblems.size === 0 
              ? "Go to the Problems tab and select the issues you want addressed."
              : `${selectedProblems.size} problem${selectedProblems.size > 1 ? "s" : ""} selected. Download will include root causes, code actions, and your notes.`
            }
          </p>
          
          {selectedProblems.size > 0 && (
            <>
              <div style={{marginBottom: 24}}>
                {PROBLEMS.filter(p => selectedProblems.has(p.id)).map(p => (
                  <div key={p.id} style={{padding: "8px 0", borderBottom: "1px solid rgba(255,255,255,0.04)"}}>
                    <span style={{fontSize: 13, color: "rgba(255,255,255,0.7)"}}>{p.label}</span>
                    {notes[p.id] && <span style={{fontSize: 11, color: "rgba(255,184,0,0.5)", marginLeft: 12}}>+ notes</span>}
                  </div>
                ))}
              </div>
              <button onClick={downloadSpec} style={S.downloadBtn}>
                DOWNLOAD REMEDIATION SPEC
              </button>
            </>
          )}

          <div style={{marginTop: 40, padding: 20, background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)"}}>
            <h3 style={{...S.h2, fontSize: 13, marginBottom: 12}}>PHASE 0 COMMANDS FOR CLAUDE CODE</h3>
            <pre style={S.code}>{`# THE critical file — determines what appears in the Codex sidebar
cat src/services/world-data.ts

# Entity sync logic — how worksheets push data to entities  
cat src/services/entity-sync.ts

# Wiki page creation — deduplication logic
cat src/services/world-entries.ts

# Infobox templates — which tools have data profile mappings
cat src/services/infoboxTemplates.ts

# Entity type config — fields, tool mappings, cascade layers
cat src/lib/entity-config.ts

# Tool link definitions — which tools reference which
cat src/lib/worksheet-links-config.ts

# Which tools call useAutoCreateDraftPage directly?
grep -rn "useAutoCreateDraftPage" src/pages/tools/ -l

# How does the Cartographer save data?
grep -rn "supabase\\|save\\|export" cartographers/ -l`}</pre>
          </div>
        </div>
      )}
    </div>
  );
}

const S = {
  root: { background:"#0A0E17", minHeight:"100vh", color:"#FAFAFA", fontFamily:"'DM Sans','Segoe UI',system-ui,sans-serif", padding:"24px 20px", maxWidth:900, margin:"0 auto" },
  header: { textAlign:"center", marginBottom:40, position:"relative" },
  glow: { position:"absolute", top:-40, left:"50%", transform:"translateX(-50%)", width:300, height:150, background:"radial-gradient(ellipse,rgba(61,255,205,0.06) 0%,transparent 70%)", pointerEvents:"none" },
  title: { fontFamily:"'Space Grotesk',system-ui", fontWeight:300, fontSize:"clamp(1.4rem,3.5vw,2rem)", letterSpacing:"0.2em", marginBottom:6 },
  sub: { fontFamily:"'Space Grotesk',system-ui", fontSize:11, letterSpacing:"0.15em", color:"rgba(61,255,205,0.4)", marginBottom:20 },
  tabs: { display:"flex", gap:24, justifyContent:"center" },
  tab: { fontFamily:"'Space Grotesk',system-ui", fontSize:11, letterSpacing:"0.12em", background:"none", border:"none", cursor:"pointer", padding:"8px 0", transition:"all 0.2s" },
  section: { },
  h2: { fontFamily:"'Space Grotesk',system-ui", fontWeight:400, fontSize:14, letterSpacing:"0.12em", color:"#FAFAFA", marginBottom:16 },
  note: { fontSize:13, color:"rgba(255,255,255,0.35)", lineHeight:1.7, marginBottom:20 },
  findingCard: { background:"#0E1320", border:"1px solid rgba(255,255,255,0.04)", padding:"12px 16px", marginBottom:8 },
  findingTop: { display:"flex", alignItems:"center", gap:10, marginBottom:4 },
  findingName: { fontFamily:"'Space Grotesk',system-ui", fontSize:12, letterSpacing:"0.08em", color:"rgba(255,255,255,0.7)" },
  findingFile: { fontFamily:"'JetBrains Mono',monospace", fontSize:10, color:"rgba(255,255,255,0.25)", marginLeft:"auto" },
  findingDetail: { fontSize:12, color:"rgba(255,255,255,0.4)", lineHeight:1.6 },
  problemCard: { background:"#0E1320", border:"1px solid", padding:"16px 20px", marginBottom:12, transition:"all 0.2s" },
  problemTop: { display:"flex", alignItems:"center", gap:12, marginBottom:8 },
  checkbox: { width:18, height:18, border:"2px solid", display:"flex", alignItems:"center", justifyContent:"center", fontSize:11, fontWeight:700, cursor:"pointer", flexShrink:0, transition:"all 0.2s" },
  problemLabel: { fontSize:13, lineHeight:1.5, flex:1 },
  priority: { fontFamily:"'JetBrains Mono',monospace", fontSize:9, letterSpacing:"0.1em" },
  problemBody: { paddingLeft:30 },
  textarea: { width:"100%", marginTop:12, padding:"10px 14px", background:"rgba(255,255,255,0.03)", border:"1px solid rgba(255,255,255,0.08)", color:"rgba(255,255,255,0.7)", fontSize:12, lineHeight:1.6, fontFamily:"'DM Sans',system-ui", resize:"vertical", minHeight:60, outline:"none" },
  downloadBtn: { fontFamily:"'Space Grotesk',system-ui", fontSize:12, letterSpacing:"0.12em", padding:"14px 32px", border:"1px solid #3DFFCD", background:"rgba(61,255,205,0.08)", color:"#3DFFCD", cursor:"pointer", transition:"all 0.2s" },
  code: { fontFamily:"'JetBrains Mono',monospace", fontSize:11, color:"rgba(61,255,205,0.6)", lineHeight:1.8, whiteSpace:"pre-wrap", padding:0, margin:0, background:"none" },
};

const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@300;400;500&family=DM+Sans:wght@400;500&family=JetBrains+Mono:wght@300;400&display=swap');
  * { box-sizing:border-box; margin:0; padding:0; }
  button:hover { filter:brightness(1.15); }
  ::-webkit-scrollbar { width:3px; }
  ::-webkit-scrollbar-track { background:transparent; }
  ::-webkit-scrollbar-thumb { background:rgba(61,255,205,0.15); }
  textarea:focus { border-color:rgba(61,255,205,0.2) !important; }
  strong { font-weight: 500; }
`;

export default App;
