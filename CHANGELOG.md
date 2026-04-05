# StellarForge Changelog

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
