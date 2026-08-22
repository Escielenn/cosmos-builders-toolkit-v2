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
import { GripVertical } from "lucide-react";
import {
  readDocMeta,
  STATUS_LABELS,
  STATUS_TONE,
} from "@/lib/document-meta";
import { countWords } from "@/lib/text";
import type { WorldEntry } from "@/services/world-data";
import type { WritingFolder } from "@/hooks/use-writing-documents";

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface CorkboardProps {
  folders: WritingFolder[];
  unfiled: WorldEntry[];
  activeDocId?: string;
  onOpen: (id: string) => void;
  /** Persist a new order for one group (folder's scenes, or unfiled). */
  onReorder: (ids: string[]) => void;
}

// ---------------------------------------------------------------------------
// Card
// ---------------------------------------------------------------------------

function Card({
  doc,
  active,
  onOpen,
}: {
  doc: WorldEntry;
  active: boolean;
  onOpen: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: doc.id });
  const meta = readDocMeta(doc.metadata);
  const words = countWords(doc.content);

  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={`group relative flex min-h-[150px] flex-col border bg-sf-surface/70 p-3 transition-colors ${
        active ? "border-sf-teal" : "border-sf-line-interactive hover:border-sf-teal"
      } ${isDragging ? "z-10 opacity-80" : ""}`}
    >
      <button
        {...attributes}
        {...listeners}
        aria-label={`Reorder ${doc.title || "Untitled"}`}
        className="absolute right-1 top-1 cursor-grab p-1 text-t4 opacity-0 transition-opacity group-hover:opacity-100"
      >
        <GripVertical className="h-3 w-3" />
      </button>

      <button onClick={onOpen} className="flex-1 text-left">
        <span className="mb-1.5 block pr-5 font-serif text-[16px] italic text-t1">
          {doc.title || "Untitled"}
        </span>

        {meta.synopsis ? (
          <span className="block font-serif text-[13px] leading-relaxed text-t2 line-clamp-5">
            {meta.synopsis}
          </span>
        ) : (
          <span className="block font-serif text-[13px] italic text-t3">
            No synopsis yet
          </span>
        )}
      </button>

      <div className="mt-2 flex flex-wrap items-center gap-2 border-t border-sf-line pt-2 font-mono text-[12px] uppercase tracking-[1.2px]">
        {meta.status && (
          <span className={STATUS_TONE[meta.status]}>{STATUS_LABELS[meta.status]}</span>
        )}
        {meta.pov && <span className="text-t4">{meta.pov}</span>}
        {meta.when && <span className="text-t4">{meta.when}</span>}
        <span className="ml-auto text-t4">{words.toLocaleString()}w</span>
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
  activeDocId,
  onOpen,
  onReorder,
}: {
  title: string;
  docs: WorldEntry[];
  activeDocId?: string;
  onOpen: (id: string) => void;
  onReorder: (ids: string[]) => void;
}) {
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const totalWords = useMemo(
    () => docs.reduce((n, d) => n + countWords(d.content), 0),
    [docs],
  );

  if (docs.length === 0) return null;

  return (
    <section className="mb-8">
      <div className="mb-3 flex items-baseline gap-3 border-b border-sf-line pb-1.5">
        <h3 className="font-serif text-[17px] italic text-sf-emerald">{title}</h3>
        <span className="font-mono text-[12px] uppercase tracking-[1.2px] text-t4">
          {docs.length} {docs.length === 1 ? "scene" : "scenes"} ·{" "}
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
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {docs.map((d) => (
              <Card
                key={d.id}
                doc={d}
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
}: CorkboardProps) {
  const empty = folders.every((f) => f.documents.length === 0) && unfiled.length === 0;

  if (empty) {
    return (
      <div className="px-6 py-16 text-center">
        <p className="mb-2 font-serif text-[17px] italic text-t3">
          Nothing on the board yet
        </p>
        <p className="mx-auto max-w-sm font-serif text-[14px] leading-relaxed text-t2">
          Create a document and give it a synopsis. The board shows one card per
          scene, so you can see the shape of the whole manuscript at once.
        </p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-[1100px] px-6 py-8">
      {folders.map((f) => (
        <Group
          key={f.id}
          title={f.title}
          docs={f.documents}
          activeDocId={activeDocId}
          onOpen={onOpen}
          onReorder={onReorder}
        />
      ))}
      <Group
        title={folders.length > 0 ? "Unfiled" : "Scenes"}
        docs={unfiled}
        activeDocId={activeDocId}
        onOpen={onOpen}
        onReorder={onReorder}
      />
    </div>
  );
}

export default Corkboard;
