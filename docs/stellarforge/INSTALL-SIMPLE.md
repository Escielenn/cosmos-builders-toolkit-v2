# INSTALL — the simple version

No jargon. Do these in order. Takes about 5 minutes.

---

## THE LAZY WAY (do this one)

**Step 1.** Unzip `stellarforge-system.zip`. You now have a folder called `stellarforge-system`.

**Step 2.** Drag that folder so it sits **next to** your StellarForge project folder — not inside it. Like this:

```
Documents/
├── stellarforge/            ← your actual project
└── stellarforge-system/     ← the folder you just unzipped
```

**Step 3.** Open your StellarForge project in VS Code. Open Claude Code. Paste this exactly:

```
Install the StellarForge System Package. It's unzipped at ../stellarforge-system

Run its install.sh against this repo, then do the three manual steps it prints
at the end. Show me what changed when you're done.
```

**Step 4.** That's it. Claude does the rest.

**Step 5.** To check it worked, type this in Claude Code:

```
/sf-audit
```

If it runs and prints a report, you're installed. It will list a lot of problems — that's your to-do list, not a bug.

---

## THE MANUAL WAY (only if the lazy way fails)

Open a terminal, `cd` into your StellarForge project folder, then run:

```bash
../stellarforge-system/install.sh .
```

Then do the three things it prints. They are:

### Thing 1 — add one line to your CSS

Find your main CSS file. It's probably `src/index.css` or `src/main.css`. It has lines that look like `@tailwind base;`.

Add **one line above them**:

```css
@import "./styles/tokens.css";     ← ADD THIS LINE
@tailwind base;
@tailwind components;
@tailwind utilities;
```

### Thing 2 — paste a script into index.html

Open `index.html` in your project root. Find `<head>`. Paste this right after it:

```html
<script>try{var p=JSON.parse(localStorage.getItem('sf-display')||'{}');
if(p.contrast==='high')document.documentElement.setAttribute('data-contrast','high');
if(p.ambient==='off')document.documentElement.setAttribute('data-ambient','off');}catch(e){}</script>
```

*(This stops the screen flashing the wrong colours for a split second on load. Skip it if you want; nothing breaks.)*

### Thing 3 — delete the old design skill

You have a skill saved on your Claude **account** called `stellarforge-design`. It's the old one and it describes a different product. Delete it in your Claude settings.

If you don't delete it, the new one in your repo will usually win anyway — but two skills with the same name giving opposite instructions is asking for trouble.

---

## WHERE EVERY FILE ENDS UP

After install, your project has these **new** files. Nothing else is touched.

| What lands | Where it goes | How many |
|---|---|---|
| The rulebook | `docs/stellarforge/` | 18 files + an `archive/` folder |
| Slash commands | `.claude/commands/` | 8 files |
| Skills | `.claude/skills/` | 2 folders |
| Colour system + generator | `design/` | 15 files |
| The colours your app uses | `src/styles/tokens.css` | 1 file |
| Tailwind config | `tailwind.config.ts` (project root) | 1 file |
| Example components | `src/components/ui/_reference/` | 7 files |
| Claude's instructions | `CLAUDE.md` (project root) | 1 file |

### Two files get replaced

These are the **only** existing files that change:

| File | What happens |
|---|---|
| `tailwind.config.ts` | Replaced. Old one saved as `tailwind.config.ts.bak` |
| `src/styles/tokens.css` | Replaced. Old one saved as `tokens.css.bak` |
| `CLAUDE.md` | **Appended to**, not replaced. Your existing content stays. |

If anything goes wrong, rename the `.bak` files back and you're where you started.

### Nothing is overwritten in your components

The 6 example components go into a folder called `_reference/`. They do **not** replace your real components. They're there so Claude can look at the correct pattern and copy it.

---

## THE FULL PICTURE

```
stellarforge/                              ← your project
│
├── CLAUDE.md                              ← NEW (or appended)
├── tailwind.config.ts                     ← REPLACED (.bak saved)
│
├── design/                                ← NEW folder
│   ├── derive.py                          the colour maths
│   ├── emit.py                            writes the two colour files
│   ├── proof.py                           rebuilds the before/after page
│   ├── palette.json                       the finished colours
│   ├── tokens.css                         ← copy of the one in src/styles
│   ├── tailwind.config.ts                 ← copy of the one in the root
│   ├── legibility-proof.html              ← OPEN THIS IN A BROWSER
│   ├── before-after.png
│   ├── themes.py                           ← 70 themes, all contrast-solved
│   ├── themes.css / themes.json            GENERATED
│   ├── theme-proof.html                    ← every theme, side by side
│   ├── forge-gl-proof.html                 ← three.js proof (`npm i three`, serve locally)
│   └── forge-gl-proof.png
│
├── docs/stellarforge/                     ← NEW folder
│   ├── START-HERE.md                      the long version of this file
│   ├── 00-CONSTITUTION.md                 the 7 rules
│   ├── 01-NORTH-STAR.md                   the vision
│   ├── 02-ARCHITECTURE.md                 how the data should work
│   ├── 03-TOOL-CHARTER.md                 what each of your 27 tools becomes
│   ├── 04-STUDIO-CHARTER.md               the writing space
│   ├── 05-NEW-SYSTEMS.md                  new tool ideas
│   ├── 06-BUILD-ORDER.md                  what to do first
│   ├── 07-REVIEW-GATES.md                 the checklist
│   ├── 08-VOCABULARY.md                   the naming rules
│   ├── 09-CLAUDE-MD-ADDENDUM.md           (source of CLAUDE.md)
│   ├── 10-LEGIBILITY.md                   why the colours changed
│   ├── 11-SIMULATOR-CONSTELLATION.md      the 5 simulators, connected
│   ├── 12-SESSION-SEQUENCE.md             ← WHAT TO DO, IN ORDER
│   ├── 13-THE-LIFT.md                     themes, one IA, the big feature list
│   ├── 14-RENDER-ENGINE.md                three.js — Stellaris effects, canon-driven
│   ├── AMENDMENTS.md                      log exceptions here
│   └── archive/                           the old system. Don't build from it.
│
├── src/
│   ├── styles/tokens.css                  ← REPLACED (.bak saved)
│   └── components/ui/_reference/          ← NEW folder, 6 example files
│       ├── Button.tsx
│       ├── Panel.tsx
│       ├── Field.tsx
│       ├── StellarBackground.tsx
│       ├── VelocityDial.tsx
│       ├── ParallaxStrips.tsx
│       └── ThemePicker.tsx
│
└── .claude/                               ← NEW (or added to)
    ├── commands/
    │   ├── sf-audit.md          sf-contrast.md
    │   ├── sf-wire.md           sf-new-tool.md
    │   ├── sf-fact.md           sf-situation.md
    │   └── sf-studio-bind.md    sf-ship.md
    └── skills/
        ├── stellarforge-canon/SKILL.md      ← how the data works
        └── stellarforge-design/SKILL.md     ← how it should look
```

---

## AFTER INSTALL — THE ONLY 3 THINGS TO REMEMBER

**1. Look at the proof page once.** Open `design/legibility-proof.html` in a browser. That's what the colour change actually does.

**2. Never edit two files by hand:**
- `src/styles/tokens.css`
- `tailwind.config.ts`

They're generated. To change a colour, you change a *target* in `design/derive.py` and re-run it. Claude knows this — `CLAUDE.md` tells it.

**3. Three commands do 90% of the work:**

| Type this | When |
|---|---|
| `/sf-audit` | Monday mornings. Tells you what's broken structurally. |
| `/sf-contrast` | After changing anything visual. |
| `/sf-ship` | Before you commit. |

---

## WHAT TO SAY TO CLAUDE FIRST

Open **`docs/stellarforge/12-SESSION-SEQUENCE.md`**. It lists every work session in order, with the exact text to paste for each one, from today through about ninety days.

Session A1 is the install you just did. Session A2 is a two-day bug fix that should happen before anything else. Session A3 is the one that fixes "I can't see the buttons" across the whole app.

Do them in order. One session, one thing, one commit.

---

## IF SOMETHING BREAKS

**The app looks completely wrong / unstyled**
You probably missed Thing 1. Check that `@import "./styles/tokens.css";` is in your CSS file *above* the `@tailwind` lines.

**Colours didn't change at all**
Restart the dev server. Tailwind caches its config.

**`/sf-audit` says "command not found"**
The `.claude/commands/` folder didn't land, or Claude Code needs restarting. Restart it first.

**You want to undo everything**
```bash
mv tailwind.config.ts.bak tailwind.config.ts
mv src/styles/tokens.css.bak src/styles/tokens.css
rm -rf design docs/stellarforge .claude/commands/sf-*.md
rm -rf .claude/skills/stellarforge-canon .claude/skills/stellarforge-design
```
Then delete the appended block from the bottom of `CLAUDE.md`.

---

`39.87°N · 104.97°W`
