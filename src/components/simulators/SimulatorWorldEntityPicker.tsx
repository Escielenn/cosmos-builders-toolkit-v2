import { useEffect, useState, useCallback } from "react";
import { Globe, Save as SaveIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { useEntities, useUpdateEntity } from "@/hooks/use-entity-graph";
import { useToast } from "@/hooks/use-toast";

/**
 * SimulatorWorldEntityPicker — bidirectional binding between iframe-based
 * simulators (Rogue / Tidelock / Exoforge / Solaris) and the user's world
 * entities. Mirrors the ExoSky world-entity coord picker pattern, but
 * generalised for arbitrary simulator state.
 *
 * Storage convention (per April 2026 simulator integration):
 *
 *   entity.metadata.simulatorPresets = {
 *     rogue?:    <serialized state>,
 *     tidelock?: <serialized state>,
 *     exoforge?: <serialized state>,
 *     solaris?:  <serialized state>,
 *   }
 *
 * The simulator iframe already implements the postMessage protocol:
 *   ← STELLARFORGE_LOAD            (parent → iframe, hydrate from payload)
 *   ← STELLARFORGE_REQUEST_STATE   (parent → iframe, ask for current state)
 *   → STELLARFORGE_SAVE            (iframe → parent, response with state)
 *
 * This component is the bridge: pick an entity → post LOAD with its
 * stored preset; or save current sim state → request state, write the
 * response into entity metadata.
 */

export type SimulatorType = "rogue" | "tidelock" | "exoforge" | "solaris";
export type SpatialEntityType = "planet" | "star" | "moon";

interface Props {
  /** World id; if undefined, the picker button is hidden. */
  worldId: string | undefined;
  /** Which simulator's preset slot to read from / write to. */
  simulatorType: SimulatorType;
  /** Which entity types are valid input for this simulator. */
  entityTypes: SpatialEntityType[];
  /** iframeRef for posting LOAD into the iframe. */
  iframeRef: React.RefObject<HTMLIFrameElement | null>;
}

export function SimulatorWorldEntityPicker({
  worldId,
  simulatorType,
  entityTypes,
  iframeRef,
}: Props) {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [savingForEntityId, setSavingForEntityId] = useState<string | null>(null);
  const { data: entities } = useEntities(worldId);
  const updateEntity = useUpdateEntity(worldId);

  const filtered = (entities ?? []).filter((e) =>
    entityTypes.includes(e.entity_type as SpatialEntityType),
  );

  const presetFor = useCallback(
    (e: { metadata?: Record<string, unknown> | null }) => {
      const meta = (e.metadata ?? {}) as Record<string, unknown>;
      const presets = (meta.simulatorPresets ?? {}) as Record<string, unknown>;
      return presets[simulatorType] as unknown | undefined;
    },
    [simulatorType],
  );

  // Listen for STELLARFORGE_SAVE responses while we're in "save-to-entity"
  // mode. When one arrives, write its payload into the matching entity.
  useEffect(() => {
    if (!savingForEntityId) return;
    const handler = (event: MessageEvent) => {
      if (event.data?.type !== "STELLARFORGE_SAVE") return;
      const entity = filtered.find((e) => e.id === savingForEntityId);
      if (!entity) {
        setSavingForEntityId(null);
        return;
      }
      const meta = (entity.metadata ?? {}) as Record<string, unknown>;
      const presets = ((meta.simulatorPresets ?? {}) as Record<string, unknown>) || {};
      updateEntity.mutate(
        {
          id: entity.id,
          metadata: {
            ...meta,
            simulatorPresets: {
              ...presets,
              [simulatorType]: event.data.payload,
            },
          },
        } as Parameters<typeof updateEntity.mutate>[0],
        {
          onSuccess: () => {
            toast({
              title: "STATE SECURED.",
              description: `${entity.name} now stores a ${simulatorType} preset.`,
            });
          },
        },
      );
      setSavingForEntityId(null);
    };
    window.addEventListener("message", handler);
    return () => window.removeEventListener("message", handler);
  }, [savingForEntityId, filtered, simulatorType, updateEntity, toast]);

  if (!worldId) return null;

  const handleLoad = (entityId: string) => {
    const entity = filtered.find((e) => e.id === entityId);
    if (!entity) return;
    const preset = presetFor(entity);
    if (!preset) {
      toast({
        title: "NO PRESET STORED.",
        description: `${entity.name} has no ${simulatorType} state yet. Save one first.`,
        variant: "destructive",
      });
      return;
    }
    const iframe = iframeRef.current;
    if (!iframe?.contentWindow) {
      toast({
        title: "SIMULATOR NOT READY.",
        description: "Wait for the simulator to finish loading.",
        variant: "destructive",
      });
      return;
    }
    iframe.contentWindow.postMessage(
      { type: "STELLARFORGE_LOAD", payload: preset },
      "*",
    );
    toast({
      title: "PRESET HYDRATED.",
      description: `Loaded ${entity.name}'s stored ${simulatorType} state.`,
    });
    setOpen(false);
  };

  const handleSaveState = (entityId: string) => {
    const iframe = iframeRef.current;
    if (!iframe?.contentWindow) {
      toast({
        title: "SIMULATOR NOT READY.",
        description: "Wait for the simulator to finish loading.",
        variant: "destructive",
      });
      return;
    }
    setSavingForEntityId(entityId);
    iframe.contentWindow.postMessage(
      { type: "STELLARFORGE_REQUEST_STATE" },
      "*",
    );
  };

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        onClick={() => setOpen(true)}
        className="bg-sf-void/80 border-sf-border text-sf-cyan hover:bg-sf-void text-[10px] uppercase tracking-wider h-7 px-2.5"
        title="Bind to a planet/star/system in your world"
      >
        <Globe className="w-3 h-3 mr-1" />
        From World
      </Button>

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent side="right" className="w-96 bg-sf-surface/95 backdrop-blur-sf-side border-sf-border sf-sb">
          <SheetHeader className="text-left">
            <p className="font-mono text-[11px] tracking-[0.18em] text-sf-cyan uppercase">
              // BIND TO ENTITY
            </p>
            <SheetTitle className="font-display text-xl font-light tracking-sf-title uppercase text-t1">
              From your world
            </SheetTitle>
            <SheetDescription className="font-sans text-sm text-t3 leading-[1.55]">
              Pick a {entityTypes.length === 1 ? entityTypes[0] : "spatial entity"} to load its stored {simulatorType} state, or save the current simulation onto it. Saved presets live in <code className="font-mono text-[11px] text-sf-teal">metadata.simulatorPresets.{simulatorType}</code>.
            </SheetDescription>
          </SheetHeader>

          <div className="mt-6 space-y-2">
            {filtered.length === 0 && (
              <div className="py-6 text-center space-y-2">
                <p className="font-mono text-[11px] tracking-[0.18em] uppercase text-t4">
                  // {entityTypes.map((t) => t.toUpperCase()).join(" / ")} INDEX: EMPTY
                </p>
                <p className="text-sm text-t3 normal-case tracking-normal">
                  Create a {entityTypes[0]} in your world's Codex first, then come back here to bind it to {simulatorType}.
                </p>
              </div>
            )}
            {filtered.map((e) => {
              const hasPreset = presetFor(e) !== undefined;
              const isSavingThis = savingForEntityId === e.id;
              return (
                <div
                  key={e.id}
                  className="border border-sf-border bg-sf-void/40 p-3 flex flex-col gap-2"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <div className="font-heading text-sm text-t1 truncate">{e.name}</div>
                      <div className="font-mono text-[10px] tracking-[0.18em] uppercase text-t4 mt-0.5">
                        {e.entity_type}
                      </div>
                    </div>
                    <span
                      className={
                        hasPreset
                          ? "font-mono text-[10px] tracking-[0.18em] uppercase px-2 py-0.5 rounded-sf-tag border bg-sf-teal/[0.06] border-sf-teal/[0.15] text-sf-teal whitespace-nowrap"
                          : "font-mono text-[10px] tracking-[0.18em] uppercase px-2 py-0.5 rounded-sf-tag border bg-sf-amber/[0.06] border-sf-amber/[0.15] text-sf-amber whitespace-nowrap"
                      }
                    >
                      {hasPreset ? "STORED" : "EMPTY"}
                    </span>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleLoad(e.id)}
                      disabled={!hasPreset}
                      className="flex-1 bg-sf-void/80 border-sf-border text-sf-cyan hover:bg-sf-void text-[10px] uppercase tracking-wider h-7 disabled:opacity-40"
                    >
                      Load
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleSaveState(e.id)}
                      disabled={isSavingThis || updateEntity.isPending}
                      className="flex-1 bg-sf-teal/[0.08] border-sf-teal/30 text-sf-teal hover:bg-sf-teal/[0.16] text-[10px] uppercase tracking-wider h-7 disabled:opacity-40"
                    >
                      <SaveIcon className="w-3 h-3 mr-1" />
                      {isSavingThis ? "Saving…" : "Save State"}
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}
