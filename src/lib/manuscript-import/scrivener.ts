// ---------------------------------------------------------------------------
// scrivener, a Scrivener project (.scriv) to an import forest.
//
// "A .scriv importer is worth more than three new worksheets" (Studio
// Charter, Part 1). Writers do not abandon a book in progress to try a tool.
//
// A .scriv is a folder: <Name>.scrivx (the binder as XML) plus one folder
// per text item. Scrivener 3 keeps Files/Data/<UUID>/content.rtf,
// synopsis.txt and notes.rtf; Scrivener 2 keeps Files/Docs/<ID>.rtf,
// <ID>_synopsis.txt and <ID>_notes.rtf. Both are read.
//
// Mapping:
//   Draft / Manuscript folder → a folder of that name, nested order kept
//   Research folder           → "Research" (text items only; media counted)
//   other top-level folders   → Codex entries (Characters → character,
//                               Places → location, …; decision 2026-10-17)
//   Template Sheets           → skipped (Scrivener's own templates)
//   Trash                     → skipped
//   Label                     → world label (matched by name, else created
//                               with the nearest named hue)
//   Status                    → outline / draft / revised / final, else a keyword
//   Synopsis, Notes, Keywords → the card's synopsis, notes, keywords
//   IncludeInCompile = No     → excluded from compile
//   A text item with children → a folder holding its own text first
//
// Pure apart from the FileSource it reads. Tested with synthetic fixtures.
// ---------------------------------------------------------------------------

import type { DocStatus } from "@/lib/document-meta";
import { LABEL_HUES, newLabelId, type LabelHue, type WritingLabel, MAX_LABELS } from "@/lib/writing-labels";
import { rtfToHtml, rtfToText } from "./rtf";
import { docNode, folderNode, type ImportNode } from "./tree";
import type { FileSource } from "./sources";

// ---------------------------------------------------------------------------
// .scrivx
// ---------------------------------------------------------------------------

export interface ScrivItem {
  /** UUID (Scrivener 3) or numeric ID (Scrivener 2). */
  id: string;
  type: string;
  title: string;
  labelId: string | null;
  statusId: string | null;
  includeInCompile: boolean;
  keywordIds: string[];
  children: ScrivItem[];
}

export interface ScrivLabelDef {
  id: string;
  name: string;
  /** Scrivener colour as 0..1 RGB, when present. */
  rgb: [number, number, number] | null;
}

export interface ScrivProject {
  items: ScrivItem[];
  labels: ScrivLabelDef[];
  statuses: { id: string; name: string }[];
  keywords: Map<string, string>;
}

function childEls(el: Element, tag: string): Element[] {
  return Array.from(el.children).filter((c) => c.tagName === tag);
}

function childText(el: Element, tag: string): string | null {
  const c = childEls(el, tag)[0];
  return c ? (c.textContent ?? "").trim() : null;
}

function parseRgb(v: string | null): [number, number, number] | null {
  if (!v) return null;
  const nums = v.trim().split(/[\s,]+/).map(Number);
  if (nums.length < 3 || nums.slice(0, 3).some((n) => !Number.isFinite(n))) return null;
  // Some versions write 0..255.
  const scale = nums.slice(0, 3).some((n) => n > 1) ? 255 : 1;
  return [nums[0] / scale, nums[1] / scale, nums[2] / scale];
}

function parseItem(el: Element): ScrivItem {
  const meta = childEls(el, "MetaData")[0];
  const kw = childEls(el, "Keywords")[0];
  const children = childEls(el, "Children")[0];
  const include = meta ? childText(meta, "IncludeInCompile") : null;
  return {
    id: el.getAttribute("UUID") ?? el.getAttribute("ID") ?? "",
    type: el.getAttribute("Type") ?? "Text",
    title: childText(el, "Title") ?? "",
    labelId: meta ? childText(meta, "LabelID") : null,
    statusId: meta ? childText(meta, "StatusID") : null,
    includeInCompile: !(include && /^no$/i.test(include)),
    keywordIds: kw ? childEls(kw, "KeywordID").map((k) => (k.textContent ?? "").trim()).filter(Boolean) : [],
    children: children ? childEls(children, "BinderItem").map(parseItem) : [],
  };
}

/** Parse a .scrivx document. Throws only when it is not XML at all. */
export function parseScrivx(xml: string): ScrivProject {
  const doc = new DOMParser().parseFromString(xml, "application/xml");
  if (doc.getElementsByTagName("parsererror").length) throw new Error("SCRIVX UNREADABLE.");
  const root = doc.documentElement;
  const binder = root.getElementsByTagName("Binder")[0];
  const items = binder ? childEls(binder, "BinderItem").map(parseItem) : [];

  const labels: ScrivLabelDef[] = [];
  const labelSettings = root.getElementsByTagName("LabelSettings")[0];
  if (labelSettings) {
    for (const l of Array.from(labelSettings.getElementsByTagName("Label"))) {
      const id = l.getAttribute("ID");
      const name = (l.textContent ?? "").trim();
      if (id === null || id === "-1" || !name) continue;
      labels.push({ id, name, rgb: parseRgb(l.getAttribute("Color")) });
    }
  }
  const statuses: { id: string; name: string }[] = [];
  const statusSettings = root.getElementsByTagName("StatusSettings")[0];
  if (statusSettings) {
    for (const s of Array.from(statusSettings.getElementsByTagName("Status"))) {
      const id = s.getAttribute("ID");
      const name = (s.textContent ?? "").trim();
      if (id === null || id === "-1" || !name) continue;
      statuses.push({ id, name });
    }
  }
  const keywords = new Map<string, string>();
  // Project keyword list: <Keywords><Keyword ID=".."><Title>..</Title></Keyword>
  for (const k of Array.from(root.getElementsByTagName("Keyword"))) {
    const id = k.getAttribute("ID");
    if (id === null) continue;
    const name = childText(k, "Title") ?? (k.textContent ?? "").trim();
    if (name) keywords.set(id, name);
  }
  return { items, labels, statuses, keywords };
}

// ---------------------------------------------------------------------------
// Labels and statuses
// ---------------------------------------------------------------------------

/** Approximate hue angle of each named accent, for nearest-colour matching. */
const HUE_ANGLE: Record<LabelHue, number> = {
  amber: 43,
  azure: 213,
  emerald: 150,
  magenta: 320,
  stellar: 222,
  violet: 267,
  teal: 160,
  crimson: 345,
};

/** The named hue nearest a 0..1 RGB colour. Greys fall back to stellar. */
export function nearestHue(rgb: [number, number, number] | null): LabelHue {
  if (!rgb) return "stellar";
  const [r, g, b] = rgb;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const d = max - min;
  if (d < 0.08) return "stellar";
  let h: number;
  if (max === r) h = ((g - b) / d) % 6;
  else if (max === g) h = (b - r) / d + 2;
  else h = (r - g) / d + 4;
  h = (h * 60 + 360) % 360;
  let best: LabelHue = "stellar";
  let bestDist = Infinity;
  for (const hue of LABEL_HUES) {
    const raw = Math.abs(HUE_ANGLE[hue] - h);
    const dist = Math.min(raw, 360 - raw);
    if (dist < bestDist) {
      bestDist = dist;
      best = hue;
    }
  }
  return best;
}

/**
 * Merge Scrivener labels into the world's label set. Existing labels are
 * matched by name (case-insensitive) and never changed; missing ones are
 * appended up to the label cap. Returns the full set and the id map.
 */
export function mergeScrivLabels(
  scriv: ScrivLabelDef[],
  existing: WritingLabel[],
  usedIds: Set<string>,
  makeId: () => string = newLabelId,
): { labels: WritingLabel[]; map: Map<string, string>; created: number } {
  const labels = existing.slice();
  const byName = new Map(labels.map((l) => [l.name.trim().toLowerCase(), l.id]));
  const map = new Map<string, string>();
  let created = 0;
  for (const def of scriv) {
    if (!usedIds.has(def.id)) continue; // only labels the binder actually uses
    const key = def.name.trim().toLowerCase();
    let id = byName.get(key);
    if (!id && labels.length < MAX_LABELS) {
      id = makeId();
      labels.push({ id, name: def.name.trim().slice(0, 40), hue: nearestHue(def.rgb) });
      byName.set(key, id);
      created++;
    }
    if (id) map.set(def.id, id);
  }
  return { labels, map, created };
}

/** Scrivener's default statuses onto ours. Anything else stays a keyword. */
export function mapScrivStatus(name: string): DocStatus | null {
  const n = name.trim().toLowerCase();
  if (n === "to do" || n === "todo") return "outline";
  if (n === "first draft") return "draft";
  if (n === "revised draft" || n === "second draft") return "revised";
  if (n === "final draft" || n === "done" || n === "final") return "final";
  return null;
}

// ---------------------------------------------------------------------------
// Project → forest
// ---------------------------------------------------------------------------

/**
 * A Codex entry made from a text item in a top-level research-style folder
 * (Characters, Places, …). The writer's sheets become entities the Studio can
 * @mention, not binder documents (decision 2026-10-17).
 */
export interface ImportEntity {
  entryType: string;
  title: string;
  /** Tiptap HTML body (the item's text). */
  html: string;
  /** One-line summary (the Scrivener synopsis). */
  summary: string;
  notes: string;
  /** The folder path it came from, plus Scrivener keywords. */
  tags: string[];
}

/** Scrivener folder names → Codex entity types. Unknown names become lore. */
const ENTITY_FOLDER_TYPES: [RegExp, string][] = [
  [/^(characters?|cast|people|persons|dramatis personae|protagonists?|antagonists?)$/i, "character"],
  [/^(places?|locations?|settings?|geography|cities|maps?)$/i, "location"],
  [/^(species|races?|creatures?|aliens?|beasts?|fauna|flora)$/i, "species"],
  [/^(factions?|organi[sz]ations?|groups?|polities|nations?|houses?|guilds?|empires?)$/i, "faction"],
  [/^(tech|technology|technologies|inventions?|devices?)$/i, "technology"],
  [/^(ships?|vessels?|spacecraft|starships?|vehicles?)$/i, "vessel"],
  [/^(artifacts?|artefacts?|objects?|items?|relics?)$/i, "artifact"],
  [/^(planets?|worlds?|moons?)$/i, "planet"],
  [/^(languages?|conlangs?|lexicon|glossary)$/i, "language"],
  [/^(myths?|mythology|religions?|gods|deities|beliefs?)$/i, "mythology"],
];

export function entityTypeForFolder(name: string): string {
  const n = name.trim();
  for (const [re, type] of ENTITY_FOLDER_TYPES) if (re.test(n)) return type;
  return "lore";
}

const SKIP_FOLDERS = /^(template sheets?|templates?)$/i;

export interface ScrivImport {
  nodes: ImportNode[];
  /** Text items from top-level folders other than Draft and Research. */
  entities: ImportEntity[];
  /** Full world label set after the merge (write back only if `labelsCreated`). */
  labels: WritingLabel[];
  labelsCreated: number;
  /** Media items (PDF, images, web archives) left behind. */
  skippedMedia: number;
  /** Text items whose content file was not found. */
  missingContent: number;
  projectName: string;
}

const FOLDER_TYPES = new Set(["DraftFolder", "ResearchFolder", "Folder", "Root"]);

function collectLabelIds(items: ScrivItem[], into: Set<string>): Set<string> {
  for (const it of items) {
    if (it.labelId && it.labelId !== "-1") into.add(it.labelId);
    collectLabelIds(it.children, into);
  }
  return into;
}

/**
 * Build the import forest from a .scriv FileSource. `scrivxPath` is the
 * project file's path inside the source; content is read relative to it.
 */
export async function importScrivener(
  source: FileSource,
  scrivxPath: string,
  existingLabels: WritingLabel[],
  onProgress?: (done: number, total: number) => void,
): Promise<ScrivImport> {
  const xml = (await source.readText(scrivxPath)) ?? "";
  const project = parseScrivx(xml);
  const base = scrivxPath.includes("/") ? scrivxPath.slice(0, scrivxPath.lastIndexOf("/") + 1) : "";
  const projectName = (scrivxPath.split("/").pop() ?? "Project").replace(/\.scrivx$/i, "");

  const merged = mergeScrivLabels(project.labels, existingLabels, collectLabelIds(project.items, new Set()));
  const statusById = new Map(project.statuses.map((s) => [s.id, s.name]));

  let skippedMedia = 0;
  let missingContent = 0;
  let total = 0;
  const countAll = (items: ScrivItem[]) => items.forEach((i) => { total++; countAll(i.children); });
  countAll(project.items);
  let done = 0;

  const byLower = new Map(source.paths.map((p) => [p.toLowerCase(), p]));
  const find = (rel: string): string | null => byLower.get((base + rel).toLowerCase()) ?? null;

  const readItem = async (it: ScrivItem) => {
    const v3 = `Files/Data/${it.id}/`;
    const contentPath = find(`${v3}content.rtf`) ?? find(`Files/Docs/${it.id}.rtf`);
    const synopsisPath = find(`${v3}synopsis.txt`) ?? find(`Files/Docs/${it.id}_synopsis.txt`);
    const notesPath = find(`${v3}notes.rtf`) ?? find(`Files/Docs/${it.id}_notes.rtf`);
    const [content, synopsis, notes] = await Promise.all([
      contentPath ? source.readText(contentPath) : Promise.resolve(null),
      synopsisPath ? source.readText(synopsisPath) : Promise.resolve(null),
      notesPath ? source.readText(notesPath) : Promise.resolve(null),
    ]);
    return {
      html: content ? rtfToHtml(content) : "",
      found: content !== null,
      synopsis: (synopsis ?? "").trim(),
      notes: notes ? rtfToText(notes) : "",
    };
  };

  const metaFor = (it: ScrivItem, synopsis: string, notes: string) => {
    const keywords = it.keywordIds.map((k) => project.keywords.get(k)).filter((k): k is string => !!k);
    const statusName = it.statusId ? statusById.get(it.statusId) : undefined;
    const status = statusName ? mapScrivStatus(statusName) : null;
    if (statusName && !status) keywords.push(statusName);
    const labelId = it.labelId ? merged.map.get(it.labelId) : undefined;
    return {
      ...(synopsis ? { synopsis } : {}),
      ...(notes ? { notes } : {}),
      ...(status ? { status } : {}),
      ...(labelId ? { labelId } : {}),
      ...(keywords.length ? { keywords } : {}),
    };
  };

  const convert = async (items: ScrivItem[]): Promise<ImportNode[]> => {
    const out: ImportNode[] = [];
    for (const it of items) {
      done++;
      if (done % 20 === 0) {
        onProgress?.(done, total);
        // Let the page breathe on large binders.
        await new Promise((r) => setTimeout(r, 0));
      }
      if (it.type === "TrashFolder") continue;
      const isFolder = FOLDER_TYPES.has(it.type);
      const isText = it.type === "Text";
      if (!isFolder && !isText) {
        skippedMedia++;
        // Media with children is rare, but their text children are still prose.
        out.push(...(await convert(it.children)));
        continue;
      }
      const { html, found, synopsis, notes } = await readItem(it);
      if (isText && !found) missingContent++;
      const meta = metaFor(it, synopsis, notes);
      const title = it.title || (isFolder ? "Untitled folder" : "Untitled");
      const children = await convert(it.children);
      if (isFolder || children.length) {
        const folder = folderNode(title, children);
        if (it.includeInCompile === false) folder.includeInCompile = false;
        // A folder's (or parent document's) own text is kept as its first document.
        if (html.replace(/<[^>]+>/g, "").trim() || (isText && Object.keys(meta).length)) {
          const own = docNode(title, html, meta);
          if (!it.includeInCompile) own.includeInCompile = false;
          folder.children.unshift(own);
        }
        out.push(folder);
      } else {
        const doc = docNode(title, html, meta);
        if (!it.includeInCompile) doc.includeInCompile = false;
        out.push(doc);
      }
    }
    return out;
  };

  // Top-level research-style folders → Codex entries. Every text item
  // becomes one entity; nested folder names ride along as tags.
  const entities: ImportEntity[] = [];
  const toEntities = async (items: ScrivItem[], entryType: string, path: string[]) => {
    for (const it of items) {
      done++;
      if (it.type === "TrashFolder") continue;
      const isFolder = FOLDER_TYPES.has(it.type);
      if (!isFolder && it.type !== "Text") {
        skippedMedia++;
        await toEntities(it.children, entryType, path);
        continue;
      }
      const title = it.title || "Untitled";
      if (it.type === "Text") {
        const { html, found, synopsis, notes } = await readItem(it);
        if (!found) missingContent++;
        const keywords = it.keywordIds.map((k) => project.keywords.get(k)).filter((k): k is string => !!k);
        entities.push({ entryType, title, html, summary: synopsis, notes, tags: [...path, ...keywords] });
      }
      await toEntities(it.children, entryType, isFolder ? [...path, title] : path);
    }
  };

  const nodes: ImportNode[] = [];
  for (const top of project.items) {
    if (top.type === "TrashFolder") continue;
    if (top.type === "ResearchFolder") {
      const children = await convert(top.children);
      nodes.push(folderNode("Research", children));
      continue;
    }
    if (top.type === "Folder") {
      const name = top.title || "";
      if (SKIP_FOLDERS.test(name.trim())) continue;
      await toEntities(top.children, entityTypeForFolder(name), [name]);
      continue;
    }
    nodes.push(...(await convert([top])));
  }
  onProgress?.(total, total);

  return {
    nodes,
    entities,
    labels: merged.labels,
    labelsCreated: merged.created,
    skippedMedia,
    missingContent,
    projectName,
  };
}
