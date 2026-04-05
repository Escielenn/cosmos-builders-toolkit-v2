# StellarForge Changelog

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
