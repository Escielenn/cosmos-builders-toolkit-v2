// ---------------------------------------------------------------------------
// Corkboard, the manuscript as index cards.
//
// This is the reason people buy Scrivener: structure is spatial. Reading twelve
// synopses side by side tells you the shape of act two in a way a list of
// titles never can.
//
// Reads the card fields added in P2 (synopsis, POV, status, in-world date) from
// world_entries.metadata. Cards are grouped by chapter — folder is the chapter,
// document is the scene, which the data model already supported and the binder
// simply never presented that way.
// ---------------------------------------------------------------------------

import { useMemo } from "react";
import {
  DndContext,
  closestCenter,
  PointerSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  SortableContext,
  rectSortingStrategy,
  arrayMove,
  useSortable,
  sortableKeyboardCoordinates,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical, Plus } from "lucide-react";
import { readDocMeta } from "@/lib/document-meta";
import { ACCENT_BG, docAccent, readTimeLabel } from "@/lib/writing/doc-identity";
import type { WritingLabel } from "@/lib/writing-labels";
import { DocMarker, StatusMark } from "@/components/writing/DocMarks";
import { Button } from "@/components/ui/button";
import { rowWords, type BinderRowLike } from "@/lib/writing/doc-scale";
import type { WritingFolder } from "@/hooks/use-writing-documents";
import { EmptyState } from "@/components/ui/empty-state";

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface CorkboardProps {
  folders: WritingFolder[];
  unfiled: BinderRowLike[];
  activeDocId?: string;
  onOpen: (id: string) => void;
  /** Persist a new order for one group (folder's scenes, or unfiled). */
  onReorder: (ids: string[]) => void;
  /** World labels: a card's top edge takes its label's colour. */
  labels?: WritingLabel[];
  /** "New document" in the heading. Absent: no button (read-only). */
  onCreateDoc?: () => void;
}

const NO_LABELS: WritingLabel[] = [];

// ---------------------------------------------------------------------------
// Card
// ---------------------------------------------------------------------------

function Card({
  doc,
  number,
  active,
  labels,
  onOpen,
}: {
  doc: BinderRowLike;
  /** Position in the manuscript's reading order, from 1. */
  number: number;
  active: boolean;
  labels: WritingLabel[];
  onOpen: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: doc.id });
  const meta = readDocMeta(doc.metadata);
  const words = rowWords(doc);
  const accent = docAccent(meta, labels);

  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={`group relative flex min-h-[208px] flex-col border bg-sf-surface transition-colors duration-fast ${
        active ? "border-sf-primary" : "border-sf-line hover:border-sf-line-emphasis"
      } ${isDragging ? "z-10 bg-sf-surface-elevated" : ""}`}
    >
      {/* The coloured top edge: the document's own colour, its label's, or
          its status's. The status is also written out below. */}
      <div className={`h-[3px] shrink-0 ${ACCENT_BG[accent]}`} aria-hidden="true" />

      <div className="flex items-center justify-between pl-4 pr-1">
        <span className="font-mono text-[12px] text-t4">{String(number).padStart(2, "0")}</span>
        <button
          {...attributes}
          {...listeners}
          aria-label={`Reorder ${doc.title || "Untitled"}`}
          className="flex h-9 w-9 cursor-grab items-center justify-center text-t4 transition-colors duration-fast hover:text-t1"
        >
          <GripVertical className="h-3.5 w-3.5" />
        </button>
      </div>

      <button onClick={onOpen} className="flex flex-1 flex-col px-4 pb-3 text-left">
        <span className="mb-2 flex items-start gap-2">
          {meta.marker && <DocMarker marker={meta.marker} className="mt-[3px] shrink-0 text-[15px]" />}
          <span className="min-w-0 font-serif text-[18px] leading-snug text-t1">{doc.title || "Untitled"}</span>
        </span>

        {meta.synopsis ? (
          <span className="block font-sans text-[14px] leading-relaxed text-t2 line-clamp-5">
            {meta.synopsis}
          </span>
        ) : (
          <span className="block font-sans text-[14px] text-t3">No synopsis yet</span>
        )}
      </button>

      <div className="mx-4 flex flex-wrap items-center gap-x-3 gap-y-1 border-t border-sf-line-hairline py-2.5 font-mono text-[12px] uppercase">
        <StatusMark status={meta.status} />
        {meta.pov && <span className="text-t4">{meta.pov}</span>}
        {meta.when && <span className="text-t4">{meta.when}</span>}
        <span className="ml-auto whitespace-nowrap text-t3">
          {words.toLocaleString()} {words === 1 ? "word" : "words"}
        </span>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Group of cards
// ---------------------------------------------------------------------------

function Group({
  title,
  docs,
  startAt,
  labels,
  activeDocId,
  onOpen,
  onReorder,
}: {
  title: string;
  docs: BinderRowLike[];
  /** The manuscript number of this group's first card. */
  startAt: number;
  labels: WritingLabel[];
  activeDocId?: string;
  onOpen: (id: string) => void;
  onReorder: (ids: string[]) => void;
}) {
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const totalWords = useMemo(
    () => docs.reduce((n, d) => n + rowWords(d), 0),
    [docs],
  );

  if (docs.length === 0) return null;

  return (
    <section className="mb-10">
      <div className="mb-4 flex items-baseline gap-3 border-b border-sf-line-hairline pb-2">
        <h3 className="min-w-0 truncate font-heading text-sf-eyebrow uppercase text-t2">{title}</h3>
        <span className="ml-auto shrink-0 font-mono text-[12px] uppercase text-t4">
          {docs.length} {docs.length === 1 ? "document" : "documents"} ·{" "}
          {totalWords.toLocaleString()} words
        </span>
      </div>

      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={({ active, over }) => {
          if (!over || active.id === over.id) return;
          const oldIdx = docs.findIndex((d) => d.id === active.id);
          const newIdx = docs.findIndex((d) => d.id === over.id);
          if (oldIdx === -1 || newIdx === -1) return;
          onReorder(arrayMove(docs, oldIdx, newIdx).map((d) => d.id));
        }}
      >
        <SortableContext items={docs.map((d) => d.id)} strategy={rectSortingStrategy}>
          <div className="grid gap-5 [grid-template-columns:repeat(auto-fill,minmax(232px,1fr))]">
            {docs.map((d, i) => (
              <Card
                key={d.id}
                doc={d}
                number={startAt + i}
                labels={labels}
                active={d.id === activeDocId}
                onOpen={() => onOpen(d.id)}
              />
            ))}
          </div>
        </SortableContext>
      </DndContext>
    </section>
  );
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function Corkboard({
  folders,
  unfiled,
  activeDocId,
  onOpen,
  onReorder,
  labels = NO_LABELS,
  onCreateDoc,
}: CorkboardProps) {
  const empty = folders.every((f) => f.documents.length === 0) && unfiled.length === 0;

  // Manuscript totals for the heading, and each group's first card number.
  const { docs, words, starts } = useMemo(() => {
    let n = 0;
    let w = 0;
    const at: number[] = [];
    for (const group of [...folders.map((f) => f.documents), unfiled]) {
      at.push(n + 1);
      n += group.length;
      for (const d of group) w += rowWords(d);
    }
    return { docs: n, words: w, starts: at };
  }, [folders, unfiled]);

  if (empty) {
    return (
      <div className="px-6 py-16 text-center">
        <EmptyState
          warm
          hideDial
          className="py-0 pb-4"
          eyebrow="// CORKBOARD"
          title="Nothing on the board yet."
          description="No synopses yet."
        />
        <p className="mx-auto max-w-sm font-sans text-[14px] leading-relaxed text-t2">
          Create a document and give it a synopsis. The board shows one card per
          scene, so you can see the shape of the whole manuscript at once.
        </p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-[1240px] px-5 py-8 sm:px-8 sm:py-10">
      <header className="mb-8 flex flex-wrap items-end justify-between gap-x-6 gap-y-4">
        <div className="min-w-0">
          <p className="font-mono text-sf-mono uppercase text-sf-primary-text">{"// THE BIG PICTURE"}</p>
          <h2 className="mt-2 font-heading text-sf-h2 text-t1">Your manuscript</h2>
          <p className="mt-2 font-mono text-[12px] uppercase text-t3">
            {docs.toLocaleString()} {docs === 1 ? "document" : "documents"} · {words.toLocaleString()} words ·{" "}
            {readTimeLabel(words)}
          </p>
        </div>
        {onCreateDoc && (
          <Button type="button" variant="sf-primary" size="sf-sm" onClick={onCreateDoc}>
            <Plus className="h-4 w-4" aria-hidden="true" />
            New document
          </Button>
        )}
      </header>
      {folders.map((f, i) => (
        <Group
          key={f.id}
          title={f.path.join(" / ")}
          docs={f.documents}
          startAt={starts[i]}
          labels={labels}
          activeDocId={activeDocId}
          onOpen={onOpen}
          onReorder={onReorder}
        />
      ))}
      <Group
        title={folders.length > 0 ? "Unfiled" : "Scenes"}
        docs={unfiled}
        startAt={starts[folders.length]}
        labels={labels}
        activeDocId={activeDocId}
        onOpen={onOpen}
        onReorder={onReorder}
      />
    </div>
  );
}

export default Corkboard;
