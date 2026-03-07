# STELLARFORGE: SHIP'S VOICE — COMPLETE COPYWRITING GUIDE
## The Narrator Is the Ship

**Drop this file in your project repo. It is both a reference document and a Claude Code implementation guide.**

---

## THE VOICE

StellarForge is a ship. Not metaphorically — the UI is the ship's operating system. The user is aboard. Every piece of text the system generates comes from this perspective.

The ship:
- Speaks in the second person when addressing the user, but prefers impersonal observation
- Uses present tense for status, past tense for events
- Is terse, functional, slightly formal
- Does not joke. Does not encourage. Does not praise.
- Observes and reports
- Never uses exclamation points. Ever.
- Never uses first person ("I detected..." → No. "ANOMALY DETECTED." → Yes.)
- Never asks questions ("Would you like to...?" → No. States what is available.)
- Never breaks the fourth wall — it doesn't acknowledge being a website
- Uses ALL CAPS for status labels and system messages. Mixed case for longer descriptive text.
- Prefers fragments over complete sentences in status contexts

The ship is not cold. It is precise. There is a difference. A well-calibrated instrument is not hostile — it simply does not waste words on sentiment. The warmth comes from the fact that the ship is always watching, always tracking, always recording. It knows how many worlds you've built. It knows your velocity through space. It cares about your work by protecting it, not by cheerleading it.

---

## TONE REFERENCE

**Yes:**
```
WORLD FILE SECURED.
NO SPECIES ON FILE. BEGIN SURVEY WHEN READY.
PARAMETERS OUTSIDE OPERATIONAL RANGE.
EXPORT COMPLETE. TRANSMISSION LOGGED.
SESSION ACTIVE.
```

**No:**
```
Great job saving your world! 🎉
Ready to create your first species? Let's go!
Oops! Something went wrong. Please try again.
Your export is done! Check your downloads folder.
Welcome back, Jason! We missed you!
```

The ship would never say "oops." The ship would never use an emoji. The ship would never say it missed you.

---

## LOADING STATES

Every loading state should be contextual to what's actually loading. The ship is performing a specific operation, not generically "loading."

### Global / Generic
```
INITIALIZING...
RESOLVING...
ESTABLISHING CONNECTION...
SYNCHRONIZING...
```

### Dashboard
```
COMPILING SURVEY DATA...
RETRIEVING WORLD INDEX...
LOADING INSTRUMENT MANIFEST...
```

### Tool Pages (General)
```
CALIBRATING INSTRUMENTS...
LOADING PARAMETERS...
RETRIEVING SAVED CONFIGURATION...
RESTORING PREVIOUS STATE...
```

### Signal: Drake Calculator
```
LISTENING FOR SIGNALS...
TUNING RECEIVER...
SCANNING FREQUENCY RANGE...
COMPUTING PROBABILITY MATRIX...
```

### Genesis: Planetary Profile
```
RESOLVING ORBITAL PARAMETERS...
COMPUTING ATMOSPHERIC MODEL...
SCANNING STELLAR NEIGHBORHOOD...
LOADING PLANETARY DATABASE...
```

### Gravitas: Surface Gravity
```
COMPUTING GRAVITATIONAL FIELD...
RESOLVING SURFACE CONDITIONS...
LOADING REFERENCE BODIES...
```

### Phylo: Evolutionary Biology
```
SURVEYING BIOSPHERE...
COMPILING MORPHOLOGICAL DATA...
LOADING TAXONOMIC FRAMEWORK...
ANALYZING EVOLUTIONARY PRESSURES...
```

### Mythos: Xenomythology
```
ACCESSING CULTURAL DATABASE...
COMPILING MYTHOLOGICAL STRUCTURE...
LOADING ARCHETYPE INDEX...
CROSS-REFERENCING NARRATIVE PATTERNS...
```

### Vessel: Spacecraft Designer
```
INITIALIZING DRYDOCK...
LOADING HULL SPECIFICATIONS...
COMPUTING MASS BUDGET...
RETRIEVING PROPULSION CATALOG...
```

### Impulse: Propulsion Consequences
```
ANALYZING PROPULSION PARAMETERS...
COMPUTING SOCIETAL CASCADES...
MODELING ECONOMIC IMPACT...
```

### Dominion: Empire Designer
```
MAPPING POLITICAL TERRITORY...
LOADING GOVERNANCE MODELS...
COMPILING FACTION DATA...
```

### Exodus: Space Expansion
```
CHARTING EXPANSION VECTORS...
COMPUTING TRANSIT WINDOWS...
MODELING POPULATION DYNAMICS...
```

### Chronos: Time Dilation
```
SYNCHRONIZING REFERENCE FRAMES...
COMPUTING LORENTZ FACTOR...
LOADING RELATIVISTIC MODEL...
```

### Orrery: Star System Builder
```
LOADING STELLAR CATALOG...
COMPUTING ORBITAL MECHANICS...
RESOLVING N-BODY INTERACTIONS...
```

### K-Scale: Civilization Modeling
```
ASSESSING ENERGY OUTPUT...
COMPUTING KARDASHEV INDEX...
MODELING CIVILIZATION TRAJECTORY...
```

### Sensorium: Sensory Designer
```
LOADING SENSORY BASELINES...
COMPILING RECEPTOR DATA...
ANALYZING PERCEPTUAL BANDWIDTH...
```

### Lexdrift: Language Evolution
```
LOADING PHONEME INVENTORY...
COMPILING MORPHOLOGICAL RULES...
SIMULATING DRIFT PATTERNS...
```

### Habitable Zone Calculator
```
COMPUTING STELLAR LUMINOSITY...
RESOLVING HABITABLE BOUNDARIES...
LOADING ATMOSPHERIC MODELS...
```

### Cascade: Environmental Chain Reaction
```
TRACING CASCADE PATHWAYS...
COMPUTING DOWNSTREAM EFFECTS...
ANALYZING FIVE-LAYER IMPLICATIONS...
```

### Writing Prompts
```
RECEIVING TRANSMISSION...
DECODING SIGNAL...
PREPARING WRITING SURFACE...
```

### ROGUE Simulator
```
INITIALIZING N-BODY ENGINE...
LOADING GRAVITATIONAL MODEL...
COMPUTING ENCOUNTER TRAJECTORY...
```

### ExoSky
```
RENDERING ALIEN ATMOSPHERE...
COMPUTING STELLAR POSITIONS...
GENERATING SKY MODEL...
```

### TIDELOCK
```
SYNCHRONIZING ROTATION...
COMPUTING TERMINATOR LINE...
MODELING ATMOSPHERIC CIRCULATION...
```

### Learn / Articles
```
RETRIEVING ARCHIVE ENTRY...
LOADING TRANSMISSION...
DECOMPRESSING DOCUMENT...
```

### Account / Settings
```
LOADING PERSONNEL FILE...
RETRIEVING CREDENTIALS...
```

### Export Operations
```
COMPILING WORLD FILE...
PACKAGING DATA FOR TRANSMISSION...
GENERATING DOCUMENT...
ENCODING FOR EXPORT...
```

### Search
```
SCANNING ARCHIVE...
QUERYING DATABASE...
MATCHING PARAMETERS...
```

---

## EMPTY STATES

When a section, tool, or list has no data yet. The ship reports the absence and states what is needed — it does not encourage or motivate.

### Dashboard — No Worlds
```
NO WORLDS ON FILE.
CREATE A NEW SURVEY TO BEGIN.
```

### Dashboard — No Recent Activity
```
NO RECENT ACTIVITY LOGGED.
INSTRUMENTS ON STANDBY.
```

### My Worlds — Empty
```
WORLD INDEX: EMPTY
BEGIN A NEW SURVEY TO POPULATE THIS ARCHIVE.
```

### Tool — No Saved Data
```
NO SAVED CONFIGURATION.
DEFAULT PARAMETERS LOADED.
```

### Signal: Drake Calculator — No Result
```
NO CALCULATION ON FILE.
ADJUST PARAMETERS AND COMPUTE.
```

### Phylo: Species Designer — No Species
```
NO SPECIES ON FILE.
BEGIN SURVEY WHEN READY.
```

### Mythos — No Mythology
```
CULTURAL MATRIX: EMPTY.
AWAITING FIRST CONTACT.
```

### Vessel — No Ship Designed
```
DRYDOCK: EMPTY.
NO HULL ON FILE.
```

### Dominion — No Empires
```
NO POLITICAL ENTITIES DEFINED.
TERRITORY UNMAPPED.
```

### Orrery — No System
```
STAR SYSTEM: UNCHARTED.
COORDINATES REQUIRED.
```

### Writing Prompts — No Entries
```
TRANSMISSION LOG: EMPTY.
NO ENTRIES RECORDED.
```

### Cascade — No Chain Reaction Started
```
NO CASCADE INITIATED.
SELECT AN ENVIRONMENTAL PARAMETER TO BEGIN.
```

### Search — No Results
```
NO MATCHING RECORDS.
REFINE SEARCH PARAMETERS.
```

### Learn — No Bookmarked Articles
```
NO SAVED TRANSMISSIONS.
BROWSE THE ARCHIVE TO BEGIN.
```

### Export — Nothing to Export
```
NOTHING TO TRANSMIT.
COMPLETE A SURVEY OR TOOL FIRST.
```

### Tags — No Tags Created
```
NO CLASSIFICATION TAGS DEFINED.
```

### World — No Tools Completed
```
NO INSTRUMENTS CALIBRATED FOR THIS WORLD.
SELECT A TOOL TO BEGIN SURVEY.
```

---

## SAVE / SUCCESS STATES

Confirmations of completed actions. Brief. The ship logs the event and moves on.

### Save
```
WORLD FILE SECURED.
CHANGES COMMITTED TO ARCHIVE.
CONFIGURATION SAVED.
SURVEY DATA PRESERVED.
DRAFT SECURED.
```

### Export
```
EXPORT COMPLETE. TRANSMISSION LOGGED.
DOCUMENT GENERATED. CHECK LOCAL STORAGE.
WORLD FILE COMPILED. DOWNLOAD INITIATED.
PDF GENERATED. READY FOR RETRIEVAL.
```

### Create
```
NEW WORLD INITIALIZED.
SURVEY RECORD CREATED.
SPECIES PROFILE CREATED.
SYSTEM REGISTERED.
```

### Delete (after confirmation)
```
RECORD REMOVED FROM ARCHIVE.
WORLD FILE DELETED. ACTION IRREVERSIBLE.
ENTRY PURGED.
```

### Copy
```
COPIED TO BUFFER.
DATA DUPLICATED.
```

### Share
```
SHARING PERMISSIONS UPDATED.
ACCESS GRANTED: [permission level].
LINK GENERATED. VALID UNTIL REVOKED.
```

### Account
```
CREDENTIALS UPDATED.
PREFERENCES SAVED.
SUBSCRIPTION ACTIVATED. ALL INSTRUMENTS UNLOCKED.
SUBSCRIPTION CANCELLED. ACCESS CONTINUES THROUGH [date].
```

### Login
```
AUTHENTICATION VERIFIED.
SESSION ESTABLISHED.
```

### Logout
```
SESSION TERMINATED.
CREDENTIALS CLEARED.
```

### Signup
```
PERSONNEL FILE CREATED.
WELCOME ABOARD. INSTRUMENTS ON STANDBY.
```

---

## ERROR STATES

Errors are system failures, not apologies. The ship reports what went wrong and what to do about it.

### Generic
```
OPERATION FAILED. RETRY WHEN READY.
UNEXPECTED CONDITION ENCOUNTERED.
PROCESS INTERRUPTED.
```

### Network / Connection
```
SIGNAL LOST. RETRY TRANSMISSION.
CONNECTION INTERRUPTED. ATTEMPTING RECONNECT.
SERVER UNREACHABLE. CHECK CONNECTION STATUS.
TIMEOUT: NO RESPONSE FROM ARCHIVE.
```

### Authentication
```
AUTHENTICATION EXPIRED. RE-ESTABLISH CONTACT.
CREDENTIALS NOT RECOGNIZED. VERIFY AND RETRY.
SESSION EXPIRED. PLEASE LOG IN AGAIN.
ACCESS DENIED. INSUFFICIENT CLEARANCE.
```

### Validation
```
PARAMETERS OUTSIDE OPERATIONAL RANGE.
REQUIRED FIELD: [field name].
VALUE EXCEEDS PERMITTED BOUNDS.
INVALID FORMAT. CHECK INPUT AND RETRY.
DUPLICATE ENTRY DETECTED.
```

### Save / Data
```
SAVE FAILED. DATA PRESERVED LOCALLY. RETRY.
ARCHIVE WRITE ERROR. CHANGES NOT COMMITTED.
CONFLICT DETECTED. NEWER VERSION EXISTS IN ARCHIVE.
```

### Export
```
EXPORT FAILED. FILE NOT GENERATED.
TRANSMISSION ERROR. RETRY DOWNLOAD.
DOCUMENT TOO LARGE. REDUCE SCOPE AND RETRY.
```

### Permission
```
TOOL REQUIRES PRO CLEARANCE.
UPGRADE TO ACCESS THIS INSTRUMENT.
OPERATION NOT PERMITTED AT CURRENT TIER.
```

### 404 / Not Found
```
COORDINATES DO NOT MATCH ANY KNOWN RECORD.
TARGET NOT FOUND AT SPECIFIED LOCATION.
THE REQUESTED ARCHIVE ENTRY DOES NOT EXIST.
```

### Rate Limiting
```
REQUEST FREQUENCY EXCEEDED. STANDBY.
TOO MANY TRANSMISSIONS. WAIT BEFORE RETRYING.
```

### File Upload
```
FILE FORMAT NOT RECOGNIZED.
FILE EXCEEDS SIZE LIMIT.
UPLOAD INTERRUPTED. RETRY.
```

---

## CONFIRMATION DIALOGS

When the system needs the user to confirm a destructive or significant action.

### Delete World
```
CONFIRM: DELETE WORLD "[name]"

This action will permanently remove all associated
survey data, tool configurations, and exported files.

THIS CANNOT BE UNDONE.

[CONFIRM DELETION]    [CANCEL]
```

### Delete Species / Entry
```
CONFIRM: REMOVE "[name]" FROM ARCHIVE

Associated data will be permanently deleted.

[CONFIRM]    [CANCEL]
```

### Cancel Subscription
```
CONFIRM: CANCEL PRO SUBSCRIPTION

Access continues through [date].
After that, tools revert to free tier.
World data is preserved regardless.

[CONFIRM CANCELLATION]    [KEEP SUBSCRIPTION]
```

### Unsaved Changes
```
UNSAVED CHANGES DETECTED.

Leaving this page will discard uncommitted data.

[DISCARD AND LEAVE]    [RETURN TO EDITOR]
```

### Overwrite Existing
```
EXISTING CONFIGURATION DETECTED.

Loading new parameters will overwrite current saved state.

[OVERWRITE]    [CANCEL]
```

### Share World
```
SHARE: "[world name]"

This will generate an access link.
Recipients can view your world data.
They cannot edit or copy it.

[GENERATE LINK]    [CANCEL]
```

---

## SYSTEM MESSAGES / TOASTS

Brief notifications that appear and disappear. The ship logging events in real time.

### Autosave
```
AUTOSAVE: COMPLETE
DRAFT SECURED: [timestamp]
```

### Sync
```
SYNCHRONIZATION COMPLETE.
ARCHIVE UP TO DATE.
```

### Offline
```
CONNECTION LOST. OPERATING IN LOCAL MODE.
```

### Back Online
```
CONNECTION RESTORED. SYNCHRONIZING.
```

### New Feature / Update
```
SYSTEM UPDATE: NEW INSTRUMENT AVAILABLE.
ARCHIVE UPDATED: [feature description].
```

### Pro Upgrade Prompt (non-intrusive)
```
THIS INSTRUMENT REQUIRES PRO CLEARANCE.
```

### Copy to Clipboard
```
COPIED.
```

### Undo Available
```
ACTION LOGGED. UNDO AVAILABLE FOR 10 SECONDS.
```

---

## NAVIGATION AND SECTION HEADERS

### Main Nav Items (as-is or adjusted)
```
WORLDS        (user's world index)
TOOLS         (instrument manifest)
LEARN         (archive)
PRO           (clearance upgrade)
CONTACT       (communications)
```

### Dashboard Section Headers
```
MY WORLDS
WORLDBUILDING TOOLS
RECENT ACTIVITY
```

### Tool Page Section Prefixes (using // convention)
These already exist in the design system. The voice guide confirms the format:
```
// SECTOR: BIOLOGY → SENSORY SYSTEMS
// SECTOR: PHYSICS → ORBITAL MECHANICS
// SECTOR: CULTURE → MYTHOLOGICAL STRUCTURE
// SECTOR: ENGINEERING → PROPULSION
// SECTOR: POLITICS → GOVERNANCE
// SECTOR: LINGUISTICS → PHONOLOGY
```

### Tool Page Subheaders
Use imperative or descriptive fragments:
```
CONFIGURATION          (not "Set Up Your Parameters")
PRIMARY INPUTS         (not "Enter Your Values")
RESULTS                (not "See Your Results!")
ADVANCED PARAMETERS    (not "More Options")
WORLDBUILDING NOTES    (not "How This Applies to Your Story")
PRESETS                (not "Choose a Starting Point")
VISUALIZATION          (not "View Your Results")
```

---

## WELCOME / ONBOARDING

### First Visit — Dashboard (logged in, new user)
```
STELLARFORGE

All instruments on standby.
Begin by creating a world or selecting a tool.
```

No tour. No walkthrough. No "Let us show you around." The ship assumes competence.

### Returning User — Dashboard
```
STELLARFORGE

[n] worlds on file. All instruments operational.
```

Or if Pro:
```
STELLARFORGE

All tools unlocked and operational.
```

### First Time Opening a Tool
```
NO SAVED CONFIGURATION.
DEFAULT PARAMETERS LOADED.
```

If the tool has a "how to use" section, it exists as a collapsible panel labeled:
```
// OPERATIONS MANUAL
```
Not "Tutorial" or "Getting Started" or "How to Use This Tool."

---

## BETA BANNER

The current banner says "StellarForge is currently in beta. We'd love your feedback!"

Ship's voice version:
```
SYSTEM STATUS: BETA · OPERATIONAL · REPORT ANOMALIES: FEEDBACK CHANNEL OPEN
```

Or shorter:
```
STATUS: BETA · REPORT ANOMALIES VIA FEEDBACK CHANNEL
```

The link text "We'd love your feedback!" becomes:
```
SUBMIT FIELD REPORT
```

---

## FOOTER TEXT

### Tagline
```
STELLARFORGE
These worlds exist in you. Waiting to be found.
```
(Unchanged. This is the one moment of poetry. The ship's one concession to the human aboard.)

### Footer Links — Labels
```
TOOLS        LEARN        PRO        CONTACT
PRIVACY      TERMS        STATUS
```

### Copyright Line
```
© 2025-2026 STELLARFORGE · ALL RIGHTS RESERVED
BUILT IN THORNTON, CO · 39.87°N 104.97°W
```

---

## BUTTON LABELS

### Primary Actions
```
CREATE WORLD              (not "Start Building" or "Get Started")
SAVE                      (not "Save Changes" — the ship knows what changed)
EXPORT                    (not "Download Your Work")
COMPUTE                   (not "Calculate" or "See Results")
LAUNCH                    (simulator-specific, keep as-is)
SUBMIT                    (forms)
CONFIRM                   (dialogs)
CANCEL                    (dialogs)
```

### Secondary Actions
```
DUPLICATE
DELETE
SHARE
PRINT
RESET
CLEAR
```

### Tool-Specific
```
COMPILE WORLD FILE        (full export)
GENERATE PDF              (PDF export)
OPEN IN EDITOR            (writing surface)
ADD SPECIES               (Phylo)
ADD PLANET                (Orrery)
ADD FACTION               (Dominion)
RUN CASCADE               (Cascade)
BEGIN SURVEY              (general "start using this tool")
```

### Navigation
```
BACK TO DASHBOARD         (not "← Go Back")
VIEW ALL TOOLS            (not "See All Tools")
BROWSE ARCHIVE            (Learn section)
UPGRADE TO PRO            (not "Go Pro!" or "Unlock Everything")
```

---

## TOOLTIPS

Tooltips are brief technical explanations. The ship provides context without condescension.

### Format
```
[TERM]: [brief definition]. [unit or range if applicable].
```

### Examples
```
PLANET MASS: Mass relative to Earth. Range: 0.01–20 M⊕.
ECCENTRICITY: Orbital deviation from circular. 0 = circle, 1 = escape.
SURFACE GRAVITY: Acceleration at the surface. Earth = 9.81 m/s².
DRAKE N: Estimated communicative civilizations in the Milky Way.
LORENTZ FACTOR: Time dilation multiplier. γ = 1 at rest.
ISP: Specific impulse — propulsive efficiency measured in seconds.
HABITABLE ZONE: Orbital range where liquid water is stable on the surface.
SPECTRAL TYPE: Stellar classification by temperature. O (hot) → M (cool).
BOND ALBEDO: Fraction of incident energy reflected by a body. Earth ≈ 0.306.
ESCAPE VELOCITY: Minimum speed to leave a body's gravitational well.
METALLICITY: Abundance of elements heavier than helium. [Fe/H] = 0 for Sol.
TIDAL LOCKING: Rotational period equals orbital period. One face always toward the star.
```

---

## WRITING SURFACE PROMPTS

When the RTF editor is empty — the placeholder text before the user starts typing. Not grey "Type here..." but a faint system message.

### World Description Editor
```
BEGIN WORLD DESCRIPTION...
```

### Writing Prompts / Daily Writing
```
BEGIN TRANSMISSION...
```

### Notes Field
```
LOG ENTRY...
```

### Moodboard Notes
```
VISUAL REFERENCE NOTES...
```

---

## PROGRESS INDICATORS

### Worksheet Completion (tool pages with multiple sections)
```
SURVEY PROGRESS: 4/12 FIELDS COMPLETE
EXPORT STATUS: INCOMPLETE
```

Or in the status bar:
```
// DEPTH: 4/12 · EXPORT: NEGATIVE
```

### World Completion (across all tools)
```
WORLD SURVEY: 3 OF 18 INSTRUMENTS CALIBRATED
```

### Upload Progress
```
UPLOADING: 47% · 2.3 MB REMAINING
```

### Export Progress
```
COMPILING: SECTION 3 OF 7...
```

---

## PRICING PAGE COPY

### Hero
```
UPGRADE YOUR CLEARANCE

Free accounts access 3 instruments.
Pro unlocks the full manifest.
```

### Free Tier Card
```
STANDARD CLEARANCE

Access to 3 tools
1 world
Basic export

COST: FREE
```

### Pro Tier Card
```
PRO CLEARANCE

Access to all instruments
Unlimited worlds
Full export suite
Priority support

$4.99/MONTH  ·  $49/YEAR
```

### FAQ-style questions (if they exist)
Don't phrase as "Frequently Asked Questions." Use:
```
// OPERATIONS MANUAL: SUBSCRIPTION
```

Individual items:
```
Q: WHAT HAPPENS TO MY WORLDS IF I CANCEL?
A: Your worlds and data are preserved. Tool access reverts to free tier. You can export everything before or after cancellation.

Q: CAN I SWITCH BETWEEN MONTHLY AND ANNUAL?
A: Yes. Changes take effect at the next billing cycle.

Q: IS MY CREATIVE CONTENT USED FOR AI TRAINING?
A: Never. Your worlds are encrypted, isolated, and accessible only to you. StellarForge does not access, read, analyze, or train on your content. Your worlds are yours alone.
```

---

## FEATURE PAGE COPY

### Hero
```
INSTRUMENT MANIFEST

Everything aboard StellarForge, and why it exists.
```

### IP Protection Section
```
YOUR WORLDS ARE YOURS ALONE

All creative content is encrypted, user-isolated,
and never accessed by StellarForge systems.
We do not read your worlds.
We do not train on your worlds.
We do not share your worlds.
Your intellectual property remains yours — completely.
```

### Tool Descriptions (brief, for feature cards)
```
CASCADE
Trace how one environmental change ripples through biology,
psychology, culture, and mythology. Five layers deep.

VESSEL
Design spacecraft that feel inhabited. Cultural context,
life support realities, ship-as-character development.

IMPULSE
Your propulsion system reshapes your civilization.
Trace the consequences through economics, politics, and psychology.

GENESIS
Define a world from its star outward. Mass, atmosphere,
orbit, habitability — and the narrative pressures each creates.

SIGNAL
The Drake Equation as a worldbuilding instrument.
How populated is your galaxy? How lonely?

PHYLO
Biologically plausible alien species. 13 sections from
biochemistry to cognition. Grounded in real biology.

MYTHOS
Mythology that emerges from biology and environment,
not human templates projected onto alien minds.

ORRERY
Multi-planet systems with stellar relationships
and orbital mechanics. Build the neighborhood.

DOMINION
Political structures, governance systems, internal factions.
Empires that feel inevitable given their history.

CHRONOS
Time dilation at any velocity or gravitational field.
See what relativity does to your story's timeline.

GRAVITAS
Surface gravity from mass and radius.
Feel what it means to stand on another world.

HABITABLE ZONE
Where can your world orbit and still hold liquid water?
The boundaries that make life possible — or impossible.
```

---

## CONTACT PAGE COPY

### Hero
```
COMMUNICATIONS CHANNEL

Report anomalies, request features, or make contact.
```

### Form Labels
```
CALLSIGN:           (name field)
FREQUENCY:          (email field)
SUBJECT:            (subject/topic selector)
TRANSMISSION:       (message body)

[TRANSMIT]          (submit button)
```

### After Submission
```
TRANSMISSION RECEIVED.
RESPONSE WITHIN 24-48 HOURS.
```

---

## 404 PAGE

```
TARGET NOT FOUND

The requested coordinates do not match
any known record in the archive.

The object may have been moved, deleted,
or may not yet exist.

[RETURN TO DASHBOARD]    [BROWSE ARCHIVE]
```

Data burst behind the 404 text:
```
TRAJECTORY: MISS
CLOSEST APPROACH: ∞
TARGET BODY: NOT DETECTED
GRAVITATIONAL INFLUENCE: NONE
```

---

## 500 / SERVER ERROR PAGE

```
SYSTEM MALFUNCTION

An unexpected condition has been encountered.
The error has been logged automatically.

If the problem persists, report via the
communications channel.

[RETURN TO DASHBOARD]    [REPORT ANOMALY]
```

---

## MAINTENANCE PAGE

```
SYSTEMS OFFLINE FOR MAINTENANCE

Estimated restoration: [time/date].
All world data is preserved and secure.

[STATUS UPDATES: @stellarforge]
```

---

## EMAIL COPY

### Welcome Email (after signup)
Subject: `STELLARFORGE: SESSION ESTABLISHED`

```
PERSONNEL FILE CREATED.

Your StellarForge account is active.
All free-tier instruments are operational.

Begin by creating a world or selecting a tool:
[LINK TO DASHBOARD]

Your worlds are encrypted and isolated.
We do not access, read, or train on your content.

— STELLARFORGE
   39.87°N 104.97°W
   stellarforge.tools
```

### Password Reset
Subject: `STELLARFORGE: CREDENTIAL RESET REQUESTED`

```
A credential reset was requested for this account.

Use the following link to establish new credentials:
[RESET LINK]

This link expires in 24 hours.

If you did not request this, no action is needed.
Your account remains secure.

— STELLARFORGE
```

### Subscription Confirmation
Subject: `STELLARFORGE: PRO CLEARANCE ACTIVATED`

```
PRO CLEARANCE: ACTIVE

All instruments are now unlocked.
Unlimited worlds. Full export suite. Priority support.

Billing: $[amount]/[period]
Next charge: [date]

Access your full instrument manifest:
[LINK TO TOOLS]

— STELLARFORGE
```

### Subscription Cancellation
Subject: `STELLARFORGE: PRO CLEARANCE ENDING [date]`

```
PRO CLEARANCE: ENDING [date]

Your access continues through [date].
After that, tools revert to free tier.

All world data is preserved regardless of subscription status.
You can export everything at any time.

If this was an error, reactivate here:
[LINK TO ACCOUNT]

— STELLARFORGE
```

### Export Complete (if emailed)
Subject: `STELLARFORGE: WORLD FILE READY`

```
EXPORT COMPLETE.

Your world file "[name]" has been compiled.
Download link:
[LINK]

This link expires in 7 days.
A local copy is recommended.

— STELLARFORGE
```

---

## IMPLEMENTATION NOTES FOR CLAUDE CODE

### Where to Apply

Every user-facing string in the application should be reviewed against this guide. Priority order:

1. **Loading states** — replace all "Loading..." with contextual messages
2. **Empty states** — replace all "No data yet" / "Get started!" patterns
3. **Error messages** — replace all "Oops!" / "Something went wrong" patterns
4. **Button labels** — review against the button section above
5. **Toast notifications** — replace all friendly confirmations
6. **Confirmation dialogs** — rewrite in ship's voice
7. **Tooltips** — ensure technical, not condescending
8. **Beta banner** — update to system status format
9. **404 / error pages** — rewrite fully
10. **Form placeholders** — replace "Type here" with ship's voice
11. **Section headers** — ensure format consistency
12. **Navigation labels** — review
13. **Footer** — update copyright and links
14. **Email templates** — rewrite all transactional emails

### What NOT to Change

- The tagline: "These worlds exist in you. Waiting to be found." — this is the one poetic line. Keep it.
- Learn article content — educational prose stays in normal writing voice
- Legal / policy page body text — legal language stays as-is (only the data bursts and surrounding chrome use ship's voice)
- SF book quotes and epigraphs — these are from their original authors
- Tool description prose in the Learn section — educational voice, not ship voice
- User-generated content — obviously

### String Extraction

If the codebase uses a string constants file, i18n system, or content configuration, update those centrally. If strings are hardcoded in components, search for patterns like:
- "Loading"
- "No data"
- "Get started"
- "Welcome"
- "Oops"
- "Something went wrong"
- "Try again"
- "Success"
- "Great"
- "Awesome"
- "!"  (exclamation points — the ship never uses these)

Replace each with the corresponding ship's voice text from this guide.

---

*These worlds exist in you. Waiting to be found.*
