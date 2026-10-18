// ---------------------------------------------------------------------------
// RailPins, the PINNED group at the top of the Refs and Entities tabs, and
// the reason tag every ranked rail row carries.
//
// Pins were written (PinToWritingButton on every tool page, the Entities
// tab's Pin button) and never read: nothing in the Studio showed them. A pin
// now keeps its key values in view while you write (Studio Charter §2.1:
// "a pinned entity's key facts stay visible"), per world, unpinnable here.
// ---------------------------------------------------------------------------

import { X } from "lucide-react";
import { useStudioWorld } from "@/components/writing/studio-world";
import type { PinnedItem, PinnedItemType } from "@/hooks/use-writing-pins";
import type { RankReason } from "@/lib/writing/scene-context";
import type { WorldFact } from "@/lib/writing/world-index";

export function ReasonTag({ reason }: { reason: RankReason }): JSX.Element {
  return (
    <span className="shrink-0 border border-sf-line px-1.5 font-mono text-[12px] leading-[18px] text-t2">
      {reason}
    </span>
  );
}

/** The facts a pin keeps in view. */
export function pinFacts(
  pin: Pick<PinnedItem, "id" | "type">,
  world: { factsByEntity: Map<string, WorldFact[]>; factsBySource: Map<string, WorldFact[]> },
  max = 3,
): WorldFact[] {
  const list =
    pin.type === "entity"
      ? world.factsByEntity.get(pin.id)
      : pin.type === "worksheet"
        ? world.factsBySource.get(pin.id)
        : undefined;
  return (list ?? []).slice(0, max);
}

interface PinnedGroupProps {
  pins: PinnedItem[];
  /** Which pins this tab shows. */
  types?: PinnedItemType[];
  onUnpin: (pin: PinnedItem) => void;
  onOpen?: (pin: PinnedItem) => void;
}

export function PinnedGroup({ pins, types, onUnpin, onOpen }: PinnedGroupProps): JSX.Element | null {
  const world = useStudioWorld();
  const shown = types ? pins.filter((p) => types.includes(p.type)) : pins;
  if (shown.length === 0) return null;
  return (
    <section aria-label="Pinned" className="border-b border-sf-line-hairline pb-1">
      <h3 className="px-3 pb-1 pt-2 font-heading text-sf-eyebrow uppercase text-t4">
        // Pinned <span className="font-mono">{shown.length}</span>
      </h3>
      <ul>
        {shown.map((pin) => {
          const facts = world ? pinFacts(pin, world) : [];
          const name = pin.type === "entity" ? world?.entityById.get(pin.id)?.name ?? pin.title : pin.title;
          return (
            <li key={`${pin.type}:${pin.id}`} className="flex items-start gap-1 border-t border-sf-line-hairline pl-3">
              <div className="min-w-0 flex-1 py-1.5">
                {onOpen ? (
                  <button
                    type="button"
                    onClick={() => onOpen(pin)}
                    className="block max-w-full truncate text-left font-sans text-[13px] text-t1 hover:text-sf-primary-text"
                  >
                    {name}
                  </button>
                ) : (
                  <span className="block truncate font-sans text-[13px] text-t1">{name}</span>
                )}
                {facts.length > 0 ? (
                  <dl className="mt-0.5">
                    {facts.map((f) => (
                      <div key={f.ref} className="flex items-baseline gap-2">
                        <dt className="w-[46%] shrink-0 truncate font-sans text-[12px] text-t3">{f.label}</dt>
                        <dd className="min-w-0 flex-1 truncate font-mono text-[12px] text-t1">{f.insert}</dd>
                      </div>
                    ))}
                  </dl>
                ) : pin.content ? (
                  <p className="line-clamp-2 font-sans text-[12px] text-t3">{pin.content}</p>
                ) : null}
              </div>
              <button
                type="button"
                onClick={() => onUnpin(pin)}
                aria-label={`Unpin ${name}`}
                title="Unpin"
                className="flex h-11 w-10 shrink-0 items-center justify-center text-t4 transition-colors duration-fast hover:text-t1"
              >
                <X className="h-3.5 w-3.5" aria-hidden="true" />
              </button>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
