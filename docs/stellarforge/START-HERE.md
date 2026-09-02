# START HERE

**StellarForge System Package · v2 · August 2026**
Authored for Jason D. Batt, Ph.D., against the live build at stellarforge.tools.

This package contains two things that turned out to be the same thing:

1. **The interconnection architecture** — how to make StellarForge actually be Scrivener × Stellaris × World Anvil instead of 27 calculators next to a text editor.
2. **The legibility system** — a re-derived, contrast-solved palette, because none of the above matters if the writer can't see the buttons.

---

## 1 · Where everything goes

From the root of your StellarForge repo, with this package unzipped alongside it:

```bash
PKG=../stellarforge-system     # wherever you unzipped this

# ── Governing docs ────────────────────────────────────────────────
mkdir -p docs/stellarforge/archive
cp -r $PKG/docs/.            docs/stellarforge/
cp    $PKG/START-HERE.md     docs/stellarforge/
cp -r $PKG/archive/.         docs/stellarforge/archive/

# ── Claude Code commands + skills ─────────────────────────────────
mkdir -p .claude/commands .claude/skills
cp $PKG/.claude/commands/*   .claude/commands/
cp -r $PKG/.claude/skills/*  .claude/skills/

# ── The palette. These two are GENERATED — never hand-edit them. ──
mkdir -p design src/styles
cp -r $PKG/design/.          design/
[ -f tailwind.config.ts ]     && cp tailwind.config.ts tailwind.config.ts.bak
[ -f src/styles/tokens.css ]  && cp src/styles/tokens.css src/styles/tokens.css.bak
cp design/tokens.css         src/styles/tokens.css
cp design/tailwind.config.ts ./tailwind.config.ts

# ── Reference components (study + copy the pattern; don't blind-overwrite) ──
mkdir -p src/components/ui/_reference
cp $PKG/components/*.tsx     src/components/ui/_reference/
```

Then append the CLAUDE.md block — **once**:

```bash
grep -q "THE PRIME LAW OF THIS CODEBASE" CLAUDE.md 2>/dev/null \
  || cat $PKG/CLAUDE.md >> ./CLAUDE.md
```

> Or just run `$PKG/install.sh .` — it does all of the above, takes `.bak`
> backups, and is safe to run twice. The manual steps are here so you can see
> exactly what lands where.

If you don't have a root `CLAUDE.md` yet, that command creates it.

### The resulting tree

```
stellarforge/
├── CLAUDE.md                          ← governs every Claude Code session
├── tailwind.config.ts                 ← GENERATED. Do not hand-edit.
├── design/
│   ├── derive.py                      ← solves the palette in OKLab
│   ├── emit.py                        ← writes tokens.css + tailwind.config.ts
│   ├── proof.py                       ← rebuilds the before/after page
│   ├── palette.json                   ← the solved values
│   ├── tokens.css                     ← GENERATED
│   ├── tailwind.config.ts             ← GENERATED
│   ├── legibility-proof.html          ← open this in a browser
│   └── before-after.png
├── src/
│   ├── styles/tokens.css              ← GENERATED (copy of design/tokens.css)
│   └── components/ui/_reference/      ← Button, Panel, Field, StellarBackground,
│                                         VelocityDial, ParallaxStrips
├── docs/stellarforge/
│   ├── START-HERE.md                  ← this file
│   ├── 00-CONSTITUTION.md … 14-RENDER-ENGINE.md
│   ├── AMENDMENTS.md                  ← log exceptions here
│   └── archive/                       ← v1 tokens + the v1→v2 map. Not canon.
└── .claude/
    ├── commands/  sf-audit, sf-wire, sf-new-tool, sf-fact,
    │              sf-situation, sf-studio-bind, sf-contrast, sf-ship
    └── skills/    stellarforge-canon/  (architecture)
                   stellarforge-design/ (visual surface)
```

### Two things to do immediately

**Import the tokens** in your root stylesheet, *before* the Tailwind directives. `themes.css` is optional until Block E:

```css
@import "./styles/tokens.css";
@import "./styles/themes.css";   /* GENERATED — 70 user-selectable themes */
@tailwind base;
@tailwind components;
@tailwind utilities;
```

**Prevent a flash of standard contrast** — inline this in `index.html` `<head>`:

```html
<script>
  try {
    var p = JSON.parse(localStorage.getItem('sf-display') || '{}');
    if (p.contrast === 'high') document.documentElement.setAttribute('data-contrast','high');
    if (p.ambient === 'off')  document.documentElement.setAttribute('data-ambient','off');
  } catch (e) {}
</script>
```

### Replace the old design skill

If `stellarforge-design` is installed on your **account** (not the repo), it is the revision-1 skill: void `#0D0D0F`, cyan primary, 8px radius, Clash Display. It contradicts your shipping app and fails its own contrast targets. Delete it, or let the repo-level copy in `.claude/skills/` shadow it. Two skills with the same name giving opposite instructions is worse than either one alone.

### Verify

```
/sf-audit       # interconnection: orphan data, dead ends, parallel truth
/sf-contrast    # legibility: every colour pair against its WCAG target
```

Both should run and report. On a fresh install they will report a lot — that's the backlog, and `docs/stellarforge/06-BUILD-ORDER.md` sequences it.

---

## 2 · How to instruct Claude

### The one-line version

> **Don't describe the task. Name the doc and the command.**

The package works because the instructions live in the repo, not in your prompt. Your job in a session is to point at the right one and set the scope.

### The eight commands

| Command | When | What it does |
|---|---|---|
| `/sf-audit` | Weekly, and before planning | Sweeps for orphan data, dead-end readouts, unmanifested tools, parallel truth, canon bypasses. Reports; never fixes. |
| `/sf-contrast` | Before any visual merge | Measures every resolvable colour pair, flags alpha borders, opacity states, retired tokens, missing focus rings, undersized targets. |
| `/sf-wire <tool>` | The bulk of the next 90 days | Retrofits **one** existing tool to the Tool Charter. Never batch. |
| `/sf-new-tool <name>` | Rarely | Gates on four questions first, and will recommend *against* building. |
| `/sf-fact <predicate>` | Whenever a new value appears | Guards the vocabulary namespace. |
| `/sf-situation <id>` | Building the Stellaris layer | Authors one deterministic, cited Situation rule. |
| `/sf-studio-bind <thing>` | Connecting anything to the page | Binds a canon surface into the Studio rail. |
| `/sf-ship` | Before every merge | The full gate: interconnection, legibility, design system, voice. |

### Session recipes

Copy these verbatim. They are short on purpose — the length lives in the docs.

**Starting the architecture**
```
Read docs/stellarforge/00-CONSTITUTION.md and 02-ARCHITECTURE.md.
Then execute Brief 1 from 06-BUILD-ORDER.md.
Stop and show me the types file before writing migrations.
```

**Wiring a tool** (one per session)
```
/sf-wire phylo
```

**The legibility component pass**
```
Read docs/stellarforge/10-LEGIBILITY.md, then run the component pass brief
at the end of it. Start with src/components/ui/ only — stop before the
tool-specific components and show me the diff.
```

**Anything visual**
```
Use the stellarforge-design skill. <the task>
Run /sf-contrast when you're done.
```

**Anything structural**
```
Use the stellarforge-canon skill. <the task>
```

**Planning a week**
```
/sf-audit
Then tell me which three findings to fix first and why, against
06-BUILD-ORDER.md. Don't fix anything yet.
```

**When you're not sure it's worth building**
```
/sf-new-tool <name>
```
It will tell you no if the answer is no. That's the point.

### The four sentences that do the most work

Keep these in your back pocket. Each one prevents a specific failure I watched happen in the existing codebase.

> **"What does this change about how a scene reads?"**
> The Prime Law in question form. If there's no answer, the feature is decoration.

> **"Show me the mapping before you write code."**
> Every `/sf-wire` session should pause here. Field → predicate is the decision; the code is mechanical.

> **"Which existing surface does this absorb?"**
> The app already carries 27 tools, 14+ dialogs, and ten always-on overlays. Additions must pay rent.

> **"Regenerate, don't edit."**
> Any time Claude touches a colour. `tokens.css` and `tailwind.config.ts` are build artifacts.

### What never to say

- **"Just make it look better."** Name the surface and the gate: *"Run /sf-contrast on the Studio rail and fix the blocking findings."*
- **"Wire up all the tools."** One per session. Batching 27 retrofits is how subtle mistakes get made in 27 files at once.
- **"Change the teal to..."** Colours are solved, not chosen. Change a target in `derive.py` and re-run.
- **"Add a quick tool for X."** Run `/sf-new-tool` and let the gate work.

### The rhythm that keeps it honest

- **Monday** — `/sf-audit`, read the cross-surface reference density line. If tool count is rising while density stays flat, the product is drifting toward World Anvil with better fonts.
- **Every merge** — `/sf-ship`.
- **Every visual change** — `/sf-contrast`.
- **When a gate blocks something genuinely good** — don't work around it. Write the exception in `docs/stellarforge/AMENDMENTS.md` with a date and a reason. A rule worked around three times has already been repealed; make it official or make it stick.

---

## 3 · What to read, in what order

If you read nothing else, read **`00-CONSTITUTION.md`** (5 minutes) and look at **`design/legibility-proof.html`** (30 seconds).

| Order | File | Time | Why |
|---|---|---|---|
| 1 | `docs/stellarforge/00-CONSTITUTION.md` | 5 min | The seven laws. Everything else is a consequence. |
| 2 | `design/legibility-proof.html` | 1 min | See the palette change rather than trust a table. |
| 3 | `docs/stellarforge/01-NORTH-STAR.md` | 10 min | What the three parents each contribute, and where they can't reach. |
| 4 | `docs/stellarforge/06-BUILD-ORDER.md` | 10 min | What to do Monday. Four paste-ready briefs. |
| 5 | `docs/stellarforge/02-ARCHITECTURE.md` | 20 min | The Canon Graph. Read before touching the data model. |
| 6 | `docs/stellarforge/10-LEGIBILITY.md` | 15 min | The measured audit and the rules that keep it fixed. |
| — | `03`, `04`, `05`, `07`, `08` | as needed | Tool charter, Studio charter, new systems, gates, vocabulary. |
| — | `11-SIMULATOR-CONSTELLATION.md` | 15 min | The five simulators as one system. Read before touching any sim. |
| — | `12-SESSION-SEQUENCE.md` | 10 min | **The operating plan.** Every session in order, with paste-in briefs. |
| — | `13-THE-LIFT.md` | 20 min | Themes, the four-space IA, the tool triage, and the full feature list. |
| — | `14-RENDER-ENGINE.md` | 15 min | `forge-gl` — Stellaris-level effects as one canon-driven engine. |

---

## 4 · The two things this package is actually arguing

**On architecture:** your Studio's Check tab already says *"Nothing here contradicts the 7 facts your world records."* A fact model already exists. The entire program is promoting it from a feature to the spine — so that tools stop owning data and become lenses over one graph, and so that prose can propose canon back instead of only consuming it.

**On legibility:** your text was never the problem. `t1` measures 18.5:1. Nothing had an *edge* — borders at 1.20:1 against a required 3.0, planes separating at 1.04:1. The ghost button had a label at 18.5:1 and a boundary at 1.45:1. It wasn't unreadable; it just didn't look like a button.

Both problems have the same shape: something real was already there, and nothing made it visible.

---

## 5 · Regenerating the palette

```bash
cd design
python3 derive.py    # prints the full audit, writes palette.json
python3 emit.py      # writes tokens.css + tailwind.config.ts
python3 proof.py     # rebuilds legibility-proof.html
cp tokens.css ../src/styles/tokens.css
cp tailwind.config.ts ../tailwind.config.ts
```

No dependencies beyond the Python standard library. `proof.py` only needs a browser to view its output.

To change a colour, change its **target** in `derive.py` — never the hex. The hex values are outputs.

---

`39.87°N · 104.97°W`
