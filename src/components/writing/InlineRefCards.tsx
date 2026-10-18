// ---------------------------------------------------------------------------
// InlineRefCards, the hover/focus card for anything cited in the prose.
//
//   FACT     label, the value as written, where it came from, and whether
//            the source has moved on: "WAS 1.4 g · NOW 1.6 g". OPEN SOURCE
//            goes to the worksheet or simulator; UPDATE THIS MENTION (only on
//            an explicit click) rewrites that one ref's stored value. That is
//            the writer editing their own text; nothing else here touches it.
//   ENTITY   type, one line of description, the three most relevant facts,
//            OPEN CODEX → and OPEN BESIDE (the split pane, read only).
//
// Opens on hover (after a short pause) or when the chip becomes the
// selection (a click, or arrowing onto it). From a selected chip, Tab moves
// into the card and Escape returns to the sentence. Never opens in Focus.
//
// Absorbs (Law VII): the click-through to the Codex just to check a value.
// ---------------------------------------------------------------------------

import { useCallback, useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { AlertTriangle, ArrowUpRight, Columns2, RefreshCw } from "lucide-react";
import { useStudioWorld } from "@/components/writing/studio-world";
import { ConfidenceTag } from "@/components/writing/ConfidenceTag";
import {
  INLINE_REF_EVENT,
  type InlineRefDetail,
} from "@/components/editor/inline-ref-events";
import { factRefId, factRefStatus, sanitizeFactRefAttrs, staleLine, type FactRefAttrs } from "@/lib/writing/fact-ref";
import { entityOneLine, entityTypeLabel, sourceLine, toolBrand } from "@/lib/writing/world-index";
import { useToast } from "@/hooks/use-toast";

interface Open {
  detail: InlineRefDetail;
  /** Selected chips stay open until deselected; hovered ones follow the pointer. */
  sticky: boolean;
  rect: DOMRect;
}

const SHOW_DELAY = 220;
const HIDE_DELAY = 160;

export interface InlineRefCardsProps {
  /** Show an entity (or a document) read-only in the split pane. */
  onOpenBeside: (id: string) => void;
}

export function InlineRefCards({ onOpenBeside }: InlineRefCardsProps): JSX.Element | null {
  const world = useStudioWorld();
  const [open, setOpen] = useState<Open | null>(null);
  const openRef = useRef(open);
  openRef.current = open;
  const showTimer = useRef<ReturnType<typeof setTimeout>>();
  const hideTimer = useRef<ReturnType<typeof setTimeout>>();
  const cardRef = useRef<HTMLDivElement>(null);
  const focus = world?.focus ?? false;

  const clearTimers = () => {
    if (showTimer.current) clearTimeout(showTimer.current);
    if (hideTimer.current) clearTimeout(hideTimer.current);
  };

  const close = useCallback(() => {
    clearTimers();
    setOpen(null);
  }, []);

  useEffect(() => {
    if (focus) close();
  }, [focus, close]);

  useEffect(() => {
    const onRef = (e: Event) => {
      if (focus) return;
      const d = (e as CustomEvent<InlineRefDetail>).detail;
      const cur = openRef.current;
      if (d.phase === "enter") {
        if (cur?.sticky) return;
        clearTimers();
        showTimer.current = setTimeout(
          () => setOpen({ detail: d, sticky: false, rect: d.dom.getBoundingClientRect() }),
          SHOW_DELAY,
        );
      } else if (d.phase === "leave") {
        if (showTimer.current) clearTimeout(showTimer.current);
        if (cur && !cur.sticky) hideTimer.current = setTimeout(() => setOpen(null), HIDE_DELAY);
      } else if (d.phase === "select") {
        clearTimers();
        setOpen({ detail: d, sticky: true, rect: d.dom.getBoundingClientRect() });
      } else if (d.phase === "deselect") {
        if (cur?.detail.dom === d.dom) {
          // Focus moved into the card: keep it.
          if (cardRef.current?.contains(document.activeElement)) return;
          setOpen(null);
        }
      }
    };
    window.addEventListener(INLINE_REF_EVENT, onRef);
    return () => window.removeEventListener(INLINE_REF_EVENT, onRef);
  }, [focus]);

  // Keyboard: Tab from a selected chip enters the card; Escape leaves it.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      const card = cardRef.current;
      if (!card) return;
      const inCard = card.contains(document.activeElement);
      if (e.key === "Escape") {
        e.preventDefault();
        e.stopPropagation();
        const ed = open.detail.editor;
        close();
        if (inCard && !ed.isDestroyed) ed.commands.focus();
        return;
      }
      if (e.key === "Tab" && !e.shiftKey && open.sticky && !inCard) {
        const first = card.querySelector<HTMLElement>("a[href], button:not([disabled])");
        if (first) {
          e.preventDefault();
          first.focus();
        }
      }
    };
    window.addEventListener("keydown", onKey, true);
    return () => window.removeEventListener("keydown", onKey, true);
  }, [open, close]);

  // A click anywhere but the card or its chip closes it.
  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      const t = e.target as Node | null;
      if (!t || cardRef.current?.contains(t) || open.detail.dom.contains(t)) return;
      setOpen(null);
    };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [open]);

  // A card is anchored to where the chip was; scrolling moves the chip.
  useEffect(() => {
    if (!open) return;
    const onScroll = (e: Event) => {
      if (cardRef.current && e.target instanceof Node && cardRef.current.contains(e.target)) return;
      setOpen(null);
    };
    window.addEventListener("scroll", onScroll, true);
    return () => window.removeEventListener("scroll", onScroll, true);
  }, [open]);

  if (!world || !open || focus) return null;

  const { detail, rect } = open;
  const width = 320;
  const below = rect.bottom + 8;
  const top = below + 260 > window.innerHeight ? Math.max(8, rect.top - 8 - 260) : below;
  const left = Math.max(8, Math.min(rect.left, window.innerWidth - width - 8));

  return (
    <div
      ref={cardRef}
      role="dialog"
      aria-label={detail.kind === "fact" ? "Cited fact" : "Entity"}
      onMouseEnter={() => hideTimer.current && clearTimeout(hideTimer.current)}
      onMouseLeave={() => {
        if (!open.sticky) hideTimer.current = setTimeout(() => setOpen(null), HIDE_DELAY);
      }}
      className="fixed z-50 border border-sf-line bg-sf-surface-elevated p-3"
      style={{ top, left, width }}
    >
      {detail.kind === "fact" ? (
        <FactCard detail={detail} onDone={close} />
      ) : (
        <EntityCard detail={detail} onOpenBeside={(id) => { close(); onOpenBeside(id); }} />
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Fact
// ---------------------------------------------------------------------------

function FactCard({ detail, onDone }: { detail: InlineRefDetail; onDone: () => void }): JSX.Element {
  const world = useStudioWorld()!;
  const navigate = useNavigate();
  const { toast } = useToast();
  const attrs: FactRefAttrs = sanitizeFactRefAttrs(detail.attrs as Partial<Record<keyof FactRefAttrs, unknown>>);
  const live = world.factsByRef.get(factRefId(attrs)) ?? null;
  const status = world.loading ? null : factRefStatus(attrs, live);
  const source = live ? sourceLine(live) : toolBrand(attrs.tool || "codex");

  const update = () => {
    if (status?.state !== "stale") return;
    const ed = detail.editor;
    const pos = detail.getPos();
    const node = typeof pos === "number" ? ed.state.doc.nodeAt(pos) : null;
    if (!node || node.type.name !== "factRef" || node.attrs.value !== status.was || typeof pos !== "number") {
      toast({ title: "MENTION MOVED. NOTHING CHANGED.", description: "Hover the value again to update it." });
      onDone();
      return;
    }
    // The one prose change the Studio makes, and only because the writer
    // asked for it, on this one mention. Undo reverts it.
    ed.chain()
      .focus()
      .command(({ tr }) => {
        tr.setNodeMarkup(pos, undefined, { ...node.attrs, value: status.now });
        return true;
      })
      .run();
    toast({ title: "MENTION UPDATED.", description: `${status.was} → ${status.now}` });
    onDone();
  };

  return (
    <div className="flex flex-col gap-2">
      <p className="font-heading text-sf-eyebrow uppercase text-t4">{attrs.label || "Cited fact"}</p>
      <p className="break-words font-mono text-[16px] text-t1">{attrs.value}</p>
      <p className="flex flex-wrap items-center gap-1.5 font-sans text-[13px] text-t3">
        {live && <ConfidenceTag confidence={live.confidence} outranked={!!live.outrankedBy} />}
        <span>{source}</span>
      </p>
      {status?.state === "current" && (
        <p className="font-mono text-[12px] text-t3">// CURRENT. MATCHES THE SOURCE.</p>
      )}
      {status && status.state !== "current" && (
        <p className="flex items-start gap-1.5 font-mono text-[12px] text-sf-amber-text">
          <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden="true" />
          <span>{staleLine(status)}</span>
        </p>
      )}
      <div className="mt-1 flex flex-wrap gap-2">
        {live?.href && (
          <button
            type="button"
            onClick={() => {
              onDone();
              navigate(live.href!);
            }}
            className="inline-flex min-h-hit items-center gap-1.5 border border-sf-line px-3 font-sans text-[12px] font-medium uppercase text-t1 transition-colors duration-fast hover:border-sf-primary hover:text-sf-primary-text"
          >
            Open source <ArrowUpRight className="h-3.5 w-3.5" aria-hidden="true" />
          </button>
        )}
        {status?.state === "stale" && (
          <button
            type="button"
            onClick={update}
            className="inline-flex min-h-hit items-center gap-1.5 border border-sf-primary bg-sf-primary/[0.06] px-3 font-sans text-[12px] font-medium uppercase text-sf-primary-text transition-colors duration-fast hover:bg-sf-primary/[0.12]"
          >
            <RefreshCw className="h-3.5 w-3.5" aria-hidden="true" /> Update this mention
          </button>
        )}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Entity / wiki link
// ---------------------------------------------------------------------------

function EntityCard({
  detail,
  onOpenBeside,
}: {
  detail: InlineRefDetail;
  onOpenBeside: (id: string) => void;
}): JSX.Element {
  const world = useStudioWorld()!;
  const a = detail.attrs;
  const id = String((detail.kind === "wiki" ? a.elementId : a.id) ?? "");
  const entity = id ? world.entityById.get(id) ?? null : null;
  const fallbackName = String((detail.kind === "wiki" ? a.title : a.label) ?? "");
  const facts = (entity ? world.factsByEntity.get(entity.id) ?? [] : []).slice(0, 3);
  const line = entity ? entityOneLine(entity) : "";

  return (
    <div className="flex flex-col gap-2">
      <p className="font-heading text-sf-eyebrow uppercase text-t4">
        {entity ? entityTypeLabel(entity) : detail.kind === "wiki" ? "Wiki link" : "Mention"}
      </p>
      <p className="font-serif text-[18px] italic text-t1">{entity?.name ?? (fallbackName || "Unknown")}</p>
      {line && <p className="font-serif text-[14px] leading-relaxed text-t2">{line}</p>}
      {!entity && id && (
        <p className="font-mono text-[12px] text-t3">// NOT IN THE CODEX. IT MAY BE A DOCUMENT OR A DELETED ENTRY.</p>
      )}
      {facts.length > 0 && (
        <dl className="border-t border-sf-line-hairline">
          {facts.map((f) => (
            <div key={f.ref} className="flex items-baseline gap-2 border-b border-sf-line-hairline py-1">
              <dt className="w-[45%] shrink-0 truncate font-sans text-[12px] font-medium uppercase text-t3">{f.label}</dt>
              <dd className="min-w-0 flex-1 truncate font-mono text-[12px] text-t1">{f.insert}</dd>
            </div>
          ))}
        </dl>
      )}
      <div className="mt-1 flex flex-wrap gap-2">
        {entity && (
          <Link
            to={`/worlds/${world.worldId}/codex/${entity.id}`}
            className="inline-flex min-h-hit items-center gap-1.5 border border-sf-line px-3 font-sans text-[12px] font-medium uppercase text-t1 transition-colors duration-fast hover:border-sf-primary hover:text-sf-primary-text"
          >
            Open Codex <ArrowUpRight className="h-3.5 w-3.5" aria-hidden="true" />
          </Link>
        )}
        {id && (
          <button
            type="button"
            onClick={() => onOpenBeside(id)}
            className="inline-flex min-h-hit items-center gap-1.5 border border-sf-line px-3 font-sans text-[12px] font-medium uppercase text-t1 transition-colors duration-fast hover:border-sf-primary hover:text-sf-primary-text"
          >
            <Columns2 className="h-3.5 w-3.5" aria-hidden="true" /> Open beside
          </button>
        )}
      </div>
    </div>
  );
}

export default InlineRefCards;
