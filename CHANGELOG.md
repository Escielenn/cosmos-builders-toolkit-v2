# StellarForge Changelog

## 0.6432
- Moved: Writing prompt now below tools on homepage (was above)
- Removed: All emdashes from user-facing copy (35+ in prompts, 17+ in example world, quotes, pages)
- Fixed: Duplicate fork prevention on ExampleWorldBanner (shows "Go to Your Copy" if already forked)
- Expanded: Example world now has 14 entities, 19 connections (added character, technology, artifact, event)
- Added: Kel Vorathi (blind negotiator), Bloom Lanterns, The Farthest Shade Stone, The Great Dimming
- Cleaned: Emdashes removed from database entity descriptions and notes

## 0.6421
- Fixed: Showcase visibility now database-backed (Private/Community/Public selector
  replaces localStorage, updates worlds.visibility column directly)
- Fixed: Security — comments and favorites INSERT policies now require world to be
  community/public (prevented commenting/favoriting private worlds)
- Added: Affiliate link click tracking (localStorage-based, fire-and-forget)
- Added: Security fix migration applied to Supabase

## 0.6411
- Fixed: Write dropdown links — Writing Space goes to most recent world's /write,
  Daily Prompt to /workshop, Prompt Browser to new /prompts page
- Added: Prompt Browser page (/prompts) — weekly rotation of 7 prompts with timer,
  acted-upon tracking, expired prompt count, deterministic selection by week
- Added: useWeeklyPrompts hook — deterministic weekly prompt rotation with localStorage
- Added: "Pin to Writing Space" button on all worksheet tool pages
- Added: PinToWritingButton component — works from any page, pin/unpin toggle with toast
- Added: Worksheets browsable in Writing Space reference panel (Notes tab, top section)
- Added: Worksheet pins show stellar-blue badges in Pinned tab
- Extended: PinnedItem type supports 'worksheet' alongside entity/note/snippet

## 0.6381
- Fixed: Dropdown positioning — viewport wrapper now spans full nav width (left-0 right-0)
  so Guide dropdown aligns under its trigger instead of shifting left
- Changed: "Workshop" → "Write" dropdown with Writing Space, Daily Prompt, Prompt Browser
- Reordered: Header nav is now Worlds | Tools | Write | Learn | Community | Guide | Pricing
- Updated: Mobile menu "Workshop" → "Write" with sub-items (Daily Prompt, Prompt Browser)
- Updated: User dropdown "Workshop" → "Write"

## 0.6371
- Added: EntityHistory component (created/modified timestamps on entity details)
- Added: Entity history in TreeView detail panel and WritingEntityPanel
- Added: Delete confirmation for writing documents (window.confirm with name)
- Added: Social sharing on SharedWorksheetView (public share pages)
- Updated: Roadmap — marked 10+ previously completed items as done

## 0.6361
- Fixed: Header nav alignment — flat links (Learn/Workshop/Community) now match
  dropdown trigger baseline with h-10 flex items-center
- Added: "WRITING SPACE" page title label in top bar
- Fixed: Zen mode document title reduced from text-2xl to text-lg
- Added: "Pin to References" button in entity detail panel (pins entity to right panel)
- Added: Entity pins show emerald badges in reference panel (vs amber for notes)
- Added: [[ and @ shortcut buttons in writing top bar (blue bracket, green at-sign)
- Added: Tooltips on [[ and @ buttons explaining wiki links and entity mentions

## 0.6351
- Fixed: UX navigation — every major feature now reachable through normal navigation
- Added: "Write" and "Showcase" links in world sidebar quick access
- Added: Prominent "Write" CTA (primary button) on World Dashboard toolbar
- Added: "Community" flat link in desktop header navigation
- Added: "Bookshelf" and "About StellarForge" in Guide dropdown
- Added: Community, Commendations, Bookshelf, About in mobile menu
- Added: Community, Commendations in Footer product column; About in resources
- Added: "From the Community" section on homepage for logged-in users
- Added: "Continue Writing" button in LoggedInHero

## 0.6341
- Added: Community Worlds system — visibility (private/community/public), licensing,
  favorites, comments, fork_world RPC for deep-copying worlds
- Added: Community browse page at /community with search, sort, world cards
- Added: Fork button, favorite toggle, license badges, comment section
- Added: Example world banner on worlds page
- Added: Visibility + license controls in ShareDialog
- Added: Community features on World Showcase (fork, favorite, comments)
- Added: "The Tidelock Archives" example world seed data (10 entities, 12 connections,
  full cascade from physics through culture)
- Rebuilt: Writing Space with three-panel layout
  - Left: Entity Facts panel (list mode → detail mode with connections)
  - Right: Reference panel (Notes tab, Pinned tab, History tab)
  - Top: Collapsible moodboard strip
  - Extracted: WritingTopBar, WritingEntityPanel, WritingReferencePanel,
    WritingMoodboardStrip components
- Added: Keyboard shortcuts for panel toggling (Ctrl+\, Ctrl+Shift+\, Ctrl+M)
- Added: Pinnable reference items (localStorage-based)

## 0.6241
- Fixed: KardashevScale export — wrong QuickExportButton props, missing PDF templates
- Added: KardashevSummaryTemplate + KardashevFullReportTemplate PDF exports
- Fixed: PDF preview memory leak — previewBlob helper with 60s delayed revocation
- Added: OG meta tags on all 21 tool pages (via ToolPageLayout), WorldDashboard, WritingWorkshop, WorldConnections
- Added: vendor-three and vendor-html2canvas manual chunks for bundle optimization
- Completed: Systematic bug-fix audit — 21 tools checked, 1 critical fix (K-Scale), 20 passing

## 0.6231
- Added: Dynamic Open Graph meta tags (useMetaTags hook) on Showcase, About, Writing Space
- Added: Social sharing buttons in ExportDialog (all tools get share on export)
- Added: Public/private toggle on World Showcase (owner-only, localStorage placeholder)
- Added: Showcase owner banner ("This showcase is private" with Make Public button)

## 0.6221
- Added: 47 new writing prompts (62 total across 5 categories)
- Added: Personalized prompt generator from world entity data
- Added: Prompt of the Day on homepage (deterministic by date)
- Added: SF quote affiliate links with "Get the book" links
- Added: Archive undo toast with restore action
- Added: Type-to-confirm delete dialogs for worlds and worksheets
- Added: Recent Activity section on World Dashboard (last 10 edited items)
- Verified: RLS policies on entities + entity_connections tables are secure
- Updated: Roadmap with 3 new Notion items (See it in Action, features video, activity/history)

## 0.6196
- Fixed: PDF export download — delayed URL.revokeObjectURL across all 5 export dialogs
- Added: Zen Mode for Writing Space — full-screen distraction-free editing (Escape to exit)
- Added: About Us page at /about — team, mission, Environmental Cascade philosophy
- Added: World Showcase page at /worlds/:id/showcase — public-facing world display with
  entity gallery, cascade coverage bar, stats, inline entity detail expansion
- Added: SocialShareButtons component — share to Twitter/X, Reddit, LinkedIn, Facebook, copy link
- Added: Social sharing on World Showcase hero section

## 0.6166
- Added: CSV export for worksheets (flattened key-value), entities, and connections
- Added: CSV tab in ExportDialog with preview
- Added: Cross-tool linked export (unified document with inline cross-references)
- Added: "Include cross-references" checkbox in World Export for Text/Markdown formats
- Added: Relationships appendix in linked exports

## 0.6156
- Fixed: Mind Map now uses EntityTreeView with full entity hierarchy
- Fixed: WorldConnections "Mind Map" view replaced with entity-based tree (drag-to-reparent, context menus, detail panel)
- Added: Three view modes on Connections page: Mind Map (entity tree), Worksheet Graph (old D3), Outline
- Added: Create Entity button on empty mind map state
- Added: Entity creation from mind map with parent pre-fill

## 0.6146
- Added: SENSORIUM push-to-worksheet sync (insights pushed to linked star/planet/evo-bio worksheets)
- Added: SENSORIUM environment fine-tuning sliders (atmospheric density, light, temp, conductivity)
- Added: SENSORIUM comparative species view (your species vs human baseline side-by-side)
- Added: SENSORIUM perceptual narrative generator (template-based "what it feels like" snapshot)
- Added: SENSORIUM tooltips on environment settings and sliders
- Added: SENSORIUM Ctrl+S keyboard shortcut for save
- Added: SENSORIUM tutorial banner (dismissible, localStorage-persisted)
- Added: Framer Motion fade-in on Perceptual Snapshot card

## 0.6121
- Added: Writing Space version history (localStorage snapshots, 5-min auto, Ctrl+S manual)
- Added: Version history panel with preview and restore
- Replaced: World Notes RichTextEditor → StellarForgeEditor preset="rich" with @mentions
- Added: World Notes now supports @entity mentions and [[wiki links

## 0.6116
- Replaced: Entity description/notes/summary textareas with StellarForgeEditor (4 components)
- Added: Node right-click context menu in graph (Cascade Audit, Unpin, Delete)
- Added: Timeline scrubber temporal filtering (edges hide/show based on time position)
- Added: Historical connections shown as dashed lines during timeline playback

## 0.6111
- Added: Mind Map drag-to-reparent (HTML5 drag-and-drop with circular reference prevention)
- Added: Entity detail side panel on tree node click (280px slide-out with edit/delete)
- Added: Enhanced context menu (Edit Entity, Remove from Tree, divider before Delete)
- Added: Visual drag feedback (cyan glow for valid targets, red for invalid)
- Added: Drop on empty space makes entity a root node

## 0.6101
- Fixed: World Graph crash — default to Knowledge Graph, Entity Graph wrapped in error boundary
- Fixed: Note/document title reduced from oversized to text-xl, editable title in writing space
- Fixed: Resize handle now expands content (flex:1), not just border
- Fixed: New note starts at 160px min-height instead of single line
- Fixed: Notes title field restyled (font-heading text-lg font-light)
- Archived completed spec docs, updated ROADMAP and PROJECT-OVERVIEW

## 0.6100
- Added: World Graph & Entity Layer (entities, connections, cascade-aware relationships)
- Added: Graph analytical tools (gravity, narrative distance, tension detection, clusters, what-if removal)
- Added: Cascade Audit mode (upstream/downstream tree tracing)
- Added: Timeline scrubber for temporal exploration
- Added: Graph export (PNG, JSON, Markdown)
- Added: Cascade Filter Bar, Cascade Flow Layout, List View
- Added: Mind Map / Tree View (entity hierarchy)
- Added: Dedicated Writing Space with Tiptap editor
- Added: Entity-powered sidebar with drag-and-drop reordering
- Added: Version number display in navigation header
- Added: Xenomythology CTA on Mythos worksheet
- Added: General Notes freeform textarea in Narrative Bridge
- Fixed: Worksheet content overlap by navigation/readout panels
- Fixed: Navigation panel font consistency
- Fixed: Simulator title style (unboxed across all simulators)
- Fixed: Tools mega menu (three-column with icons)
- Fixed: Guide dropdown alignment
- Fixed: Background video thumbnail fallback for .mov files
- Fixed: World Notes resizable via drag handle
- Fixed: Left sidebar font sizes increased

## Pre-0.6100
- Initial StellarForge platform with 21 worldbuilding tools
- 5 interactive simulators (ROGUE, ExoSky, TIDELOCK, ExoForge, Solaris)
- Stellar Cartographer
- Supabase auth, worlds, worksheets, collaboration
- Stripe Pro tier ($4.99/month)
