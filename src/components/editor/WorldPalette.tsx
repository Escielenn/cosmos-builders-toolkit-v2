// ---------------------------------------------------------------------------
// WorldPalette, the world while writing: "/" or Ctrl/Cmd+J in the prose.
//
// Fuzzy-searches every fact on file (worksheets, simulations, Dossier,
// Surface Cartographer places, Codex infoboxes, Chronicle events and
// branches) and every entity, with what relates to the open scene lifted to
// the top. Enter cites the fact (a fact ref) or mentions the entity (an
// @mention with its id); Shift+Enter inserts plain text or a [[wiki link]].
// Keyboard-only workable: arrows, Enter, Escape.
//
// Absorbs (Law VII): switching to the Refs tab and scrolling for a value
// mid-sentence.
// ---------------------------------------------------------------------------

import { useCallback, useEffect, useId, useMemo, useRef, useState } from "react";
import type { Editor } from "@tiptap/react";
import { useStudioWorld } from "@/components/writing/studio-world";
import {
  entityTypeLabel,
  factToRefAttrs,
  searchWorld,
  sourceLine,
  type PaletteItem,
} from "@/lib/writing/world-index";
import { entityReason, factReason, type RankReason } from "@/lib/writing/scene-context";
import { ENTITY_TYPE_COLORS } from "@/services/entity-graph-types";
import type { PaletteState } from "@/components/editor/useWorldPaletteTrigger";

const REASON_BOOST: Record<RankReason, number> = {
  "IN THIS SCENE": 140,
  POV: 120,
  SETTING: 110,
  SUBJECT: 80,
  LINKED: 50,
};

interface WorldPaletteProps {
  editor: Editor;
  state: PaletteState;
  onClose: (dismiss?: boolean) => void;
}

export function WorldPalette({ editor, state, onClose }: WorldPaletteProps): JSX.Element | null {
  const world = useStudioWorld();
  const [input, setInput] = useState("");
  const [index, setIndex] = useState(0);
  const listRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const listId = useId();
  const query = state.mode === "hotkey" ? input : state.query;

  const reasonOf = useCallback(
    (it: PaletteItem): RankReason | null =>
      world ? (it.kind === "fact" ? factReason(it.fact, world.scene) : entityReason(it.entity.id, world.scene)) : null,
    [world],
  );

  const results = useMemo(() => {
    if (!world) return [];
    return searchWorld(world.facts, world.entities, query, {
      limit: 40,
      boost: (it) => {
        const r = reasonOf(it);
        return r ? REASON_BOOST[r] : 0;
      },
    });
  }, [world, query, reasonOf]);

  useEffect(() => setIndex(0), [query]);
  useEffect(() => {
    if (state.mode === "hotkey") setTimeout(() => inputRef.current?.focus(), 0);
  }, [state.mode]);
  useEffect(() => {
    listRef.current?.querySelector('[aria-selected="true"]')?.scrollIntoView({ block: "nearest" });
  }, [index]);

  const insert = useCallback(
    (it: PaletteItem, alt: boolean) => {
      const from = state.anchor;
      const to = state.mode === "slash" ? editor.state.selection.from : state.anchor;
      const chain = editor.chain().focus();
      if (state.mode === "slash") chain.deleteRange({ from, to });
      else chain.setTextSelection(from);
      if (it.kind === "fact") {
        if (alt) chain.insertContent({ type: "text", text: it.fact.insert });
        else chain.insertContent({ type: "factRef", attrs: factToRefAttrs(it.fact) });
      } else {
        const e = it.entity;
        if (alt) {
          chain.insertContent({ type: "wikiLink", attrs: { elementId: e.id, title: e.name, elementType: e.entity_type } });
        } else {
          chain
            .insertContent({
              type: "entityMention",
              attrs: {
                id: e.id,
                label: e.name,
                entityType: e.entity_type,
                color: e.color || ENTITY_TYPE_COLORS[e.entity_type] || ENTITY_TYPE_COLORS.custom,
              },
            })
            .insertContent(" ");
        }
      }
      chain.run();
      onClose(false);
    },
    [editor, state.anchor, state.mode, onClose],
  );

  const onKey = useCallback(
    (e: KeyboardEvent | React.KeyboardEvent) => {
      // Nothing to pick: arrows and Enter belong to the prose. A palette
      // must never swallow a keystroke it cannot use.
      if (results.length === 0 && e.key !== "Escape") return;
      // A bare "/" then Enter is a line ending in a slash, not a search.
      if (state.mode === "slash" && e.key === "Enter" && !query.trim()) return;
      if (e.key === "ArrowDown") {
        e.preventDefault();
        e.stopPropagation();
        setIndex((i) => Math.min(i + 1, Math.max(0, results.length - 1)));
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        e.stopPropagation();
        setIndex((i) => Math.max(i - 1, 0));
      } else if (e.key === "Enter") {
        e.preventDefault();
        e.stopPropagation();
        const it = results[index];
        if (it) insert(it, e.shiftKey);
      } else if (e.key === "Escape") {
        e.preventDefault();
        e.stopPropagation();
        onClose(true);
        if (state.mode === "hotkey") editor.commands.focus();
      }
    },
    [results, index, insert, onClose, state.mode, editor, query],
  );

  // Slash mode: the caret stays in the prose, so keys are read on the way
  // down (capture) before Tiptap turns Enter into a new paragraph.
  useEffect(() => {
    if (state.mode !== "slash") return;
    const handler = (e: KeyboardEvent) => onKey(e);
    window.addEventListener("keydown", handler, true);
    return () => window.removeEventListener("keydown", handler, true);
  }, [state.mode, onKey]);

  // Close on a click outside.
  useEffect(() => {
    const h = (e: MouseEvent) => {
      if (listRef.current?.parentElement && !listRef.current.parentElement.contains(e.target as Node)) onClose(true);
    };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, [onClose]);

  if (!world) return null;

  const top = Math.min(state.position.top + 6, window.innerHeight - 380);
  const left = Math.max(8, Math.min(state.position.left, window.innerWidth - 392));
  const activeId = results[index] ? `${listId}-${index}` : undefined;

  return (
    <div
      className="fixed z-[100] flex w-[384px] max-w-[calc(100vw-16px)] flex-col border border-sf-line bg-sf-surface-elevated"
      style={{ top, left }}
      role="dialog"
      aria-label="Search your world"
    >
      {state.mode === "hotkey" && (
        <input
          ref={inputRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={onKey}
          role="combobox"
          aria-expanded="true"
          aria-controls={listId}
          aria-activedescendant={activeId}
          aria-label="Search facts and entities"
          placeholder="Search facts and entities"
          className="min-h-hit w-full border-0 border-b border-sf-line-interactive bg-sf-surface px-3 font-sans text-[16px] text-t1 placeholder:text-t3"
        />
      )}
      <div className="flex items-baseline gap-2 border-b border-sf-line-hairline px-3 py-1.5">
        <span className="font-heading text-sf-eyebrow uppercase text-t4">// World</span>
        {state.mode === "slash" && (
          <span className="min-w-0 flex-1 truncate font-mono text-[12px] text-t2">/{state.query}</span>
        )}
      </div>
      <div
        ref={listRef}
        id={listId}
        role="listbox"
        aria-label="World search results"
        aria-activedescendant={state.mode === "slash" ? activeId : undefined}
        className="sf-sb sf-sb--slim max-h-[300px] overflow-y-auto py-1"
      >
        {results.length === 0 && (
          <p className="px-3 py-3 font-mono text-[12px] uppercase text-t3">
            {world.loading ? "READING THE WORLD…" : "NO MATCH ON FILE."}
          </p>
        )}
        {results.map((it, i) => {
          const reason = reasonOf(it);
          const selected = i === index;
          return (
            <div
              key={it.kind === "fact" ? `f:${it.fact.ref}` : `e:${it.entity.id}`}
              id={`${listId}-${i}`}
              role="option"
              aria-selected={selected}
              onMouseDown={(e) => {
                e.preventDefault();
                insert(it, e.shiftKey);
              }}
              onMouseEnter={() => setIndex(i)}
              className={`flex min-h-hit cursor-pointer items-center gap-2 border-l-2 px-3 py-1.5 ${
                selected ? "border-sf-primary bg-sf-surface" : "border-transparent"
              }`}
            >
              {it.kind === "fact" ? (
                <>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-sans text-[13px] text-t1">{it.fact.label}</span>
                    <span className="block truncate font-sans text-[12px] text-t3">{sourceLine(it.fact)}</span>
                  </span>
                  <span className="max-w-[40%] shrink-0 truncate font-mono text-[12px] text-t1">{it.fact.insert}</span>
                </>
              ) : (
                <>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-sans text-[13px] text-t1">@{it.entity.name}</span>
                    <span className="block truncate font-sans text-[12px] text-t3">{entityTypeLabel(it.entity)}</span>
                  </span>
                </>
              )}
              {reason && (
                <span className="shrink-0 border border-sf-line-interactive px-1 font-mono text-[12px] text-t3">{reason}</span>
              )}
            </div>
          );
        })}
      </div>
      <div className="border-t border-sf-line-hairline px-3 py-1.5 font-mono text-[12px] text-t4">
        ENTER CITE · SHIFT+ENTER {results[index]?.kind === "entity" ? "[[LINK]]" : "PLAIN TEXT"} · ESC CLOSE
      </div>
    </div>
  );
}
