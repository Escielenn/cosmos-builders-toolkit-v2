// ---------------------------------------------------------------------------
// canon/field-hooks, the React side of one home per value (1.5 item 10).
//
//   useToolSubject(worksheetId)                  the entity a tool sheet is about
//   useCanonField(worldId, subjectId, predicate) what canon says, who owns it
//   useCanonEmit(manifest, worldId)              assert a producer's outputs on save
//
// The decisions live in canon/field.ts (pure, tested). These hooks only
// fetch, write through the canon facade, and keep the conflict prompt state.
// ---------------------------------------------------------------------------

import { useCallback, useMemo, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { useSubjectEntityId } from "@/hooks/use-subject-entity";
import { useWorksheetSubjects } from "@/hooks/use-worksheet-subjects";
import { canon } from "@/canon";
import { canonKeys, useCanonFacts } from "@/canon/hooks";
import { codecFor } from "@/canon/codecs";
import { ownerOf, singleHome } from "@/canon/ownership";
import {
  conflictsFrom,
  emitSummary,
  isOwnPriorAssert,
  pickCanonField,
  planEmit,
  type CanonConflict,
  type CanonFieldPick,
  type EmitOptions,
  type EmitOutcome,
  type PlannedAssert,
} from "@/canon/field";
import type { ToolManifest } from "@/canon/manifest";
import type { CanonFact, FactValue } from "@/canon/types";

/** Predicates about the world itself are stored with no subject. */
export function isWorldLevel(predicate: string): boolean {
  const domain = predicate.split(".")[0];
  return domain === "world" || domain === "galaxy";
}

/**
 * The entity a tool sheet is about: the one it was opened on (?entityId=),
 * else the entity its saved worksheet is linked to (entity_worksheets).
 */
export function useToolSubject(worksheetId: string | null | undefined): string | null {
  const fromUrl = useSubjectEntityId();
  const ids = useMemo(() => (worksheetId ? [worksheetId] : []), [worksheetId]);
  const { data } = useWorksheetSubjects(ids);
  return fromUrl ?? (worksheetId ? data?.[worksheetId]?.entityId ?? null : null);
}

export interface CanonField {
  pick: CanonFieldPick;
  /** The tool that owns the predicate, if one is wired. */
  owner: ToolManifest | undefined;
  isLoading: boolean;
  /** Propose a value from this consumer. Never touches canon. */
  propose: (value: FactValue, ctx: { worksheetId?: string | null }) => Promise<boolean>;
  isProposing: boolean;
}

/**
 * What canon says for one predicate, as seen from a consumer tool.
 * Shares the world's canon.facts query, so every field on a page costs one fetch.
 */
export function useCanonField(
  worldId: string | null | undefined,
  subjectId: string | null,
  predicate: string,
  consumer: ToolManifest,
): CanonField {
  const qc = useQueryClient();
  const { toast } = useToast();
  const { data: facts, isLoading } = useCanonFacts(worldId ?? undefined);
  const [isProposing, setProposing] = useState(false);

  const pick = useMemo(
    () => pickCanonField(facts ?? [], predicate, subjectId, { id: consumer.id, tool: consumer.tool }),
    [facts, predicate, subjectId, consumer.id, consumer.tool],
  );

  const propose = useCallback(
    async (value: FactValue, ctx: { worksheetId?: string | null }): Promise<boolean> => {
      if (!worldId) return false;
      const home = singleHome(predicate);
      const target =
        isWorldLevel(predicate) ? null : home && !home.sharesSubject ? pick.fact?.subjectId ?? null : subjectId;
      setProposing(true);
      try {
        await canon.propose({
          worldId,
          subjectId: target,
          predicate,
          value,
          valueText: codecFor(predicate).text(value),
          sourceKind: "tool",
          sourceRef: { tool: consumer.id, toolSlug: consumer.tool, worksheetId: ctx.worksheetId ?? null, override: true },
        });
        await qc.invalidateQueries({ queryKey: canonKeys.all(worldId) });
        toast({ title: "OVERRIDE PROPOSED.", description: "CANON UNCHANGED. ADOPT IT FROM THE STUDIO OR THE OWNER." });
        return true;
      } catch (err) {
        toast({ title: (err as Error).message, variant: "destructive" });
        return false;
      } finally {
        setProposing(false);
      }
    },
    [worldId, predicate, pick.fact, subjectId, consumer.id, consumer.tool, qc, toast],
  );

  return { pick, owner: ownerOf(predicate), isLoading: !!worldId && isLoading, propose, isProposing };
}

export interface CanonEmit {
  /**
   * Assert this producer's outputs after a save. Conflicts with existing
   * canon are never overwritten: they open the KEEP CANON / REPLACE prompt.
   */
  emit: (
    data: unknown,
    ctx: { subjectId: string | null; worksheetId?: string | null } & Omit<EmitOptions, "canonInputs">,
  ) => Promise<void>;
  conflicts: CanonConflict[];
  /** KEEP CANON: leave canon as it is. REPLACE: supersede it with the sheet's value. */
  resolve: (conflict: CanonConflict, choice: "keep" | "replace") => Promise<void>;
  dismiss: () => void;
}

export function useCanonEmit(manifest: ToolManifest, worldId: string | null | undefined): CanonEmit {
  const qc = useQueryClient();
  const { toast } = useToast();
  const { data: facts } = useCanonFacts(worldId ?? undefined);
  const [conflicts, setConflicts] = useState<CanonConflict[]>([]);
  const [ctxFor, setCtxFor] = useState<{ subjectId: string | null; worksheetId: string | null }>({
    subjectId: null,
    worksheetId: null,
  });

  const assertOne = useCallback(
    (planned: PlannedAssert, subjectId: string | null, worksheetId: string | null, supersede = false) =>
      canon.assert({
        worldId: worldId!,
        subjectId: isWorldLevel(planned.predicate) ? null : subjectId,
        predicate: planned.predicate,
        value: planned.value,
        valueText: planned.valueText,
        unit: planned.unit,
        sourceKind: "tool",
        sourceRef: {
          tool: manifest.id,
          toolSlug: manifest.tool,
          worksheetId,
          ...(planned.derivation ? { derivation: planned.derivation, inputs: planned.inputs } : {}),
        },
        supersede,
      }),
    [worldId, manifest.id, manifest.tool],
  );

  const emit = useCallback<CanonEmit["emit"]>(
    async (data, ctx) => {
      if (!worldId) return;
      const self = { id: manifest.id, tool: manifest.tool };
      const canonInputs: Record<string, FactValue | null> = {};
      for (const d of manifest.derives) {
        for (const input of d.inputs) {
          canonInputs[input] = pickCanonField((facts ?? []) as CanonFact[], input, ctx.subjectId, self).value;
        }
      }
      const { asserts, withheld } = planEmit(manifest, data, {
        overrides: ctx.overrides,
        inputs: ctx.inputs,
        canonInputs,
      });
      if (asserts.length === 0 && withheld.length === 0) return;

      const worksheetId = ctx.worksheetId ?? null;
      try {
        const outcomes: EmitOutcome[] = [];
        for (const planned of asserts) {
          let result = await assertOne(planned, ctx.subjectId, worksheetId);
          if (result.status === "conflict" && isOwnPriorAssert(result.existing, manifest.id, worksheetId)) {
            // This sheet revising what this sheet asserted: supersede, history kept.
            result = await assertOne(planned, ctx.subjectId, worksheetId, true);
          }
          outcomes.push({ planned, result });
        }
        await qc.invalidateQueries({ queryKey: canonKeys.all(worldId) });
        const found = conflictsFrom(outcomes);
        setCtxFor({ subjectId: ctx.subjectId, worksheetId });
        setConflicts(found);
        const summary = emitSummary(outcomes, withheld);
        if (summary) {
          toast({
            title: "CANON UPDATED.",
            description: withheld.length ? `${summary} ${withheld.map((w) => w.reason).join(" ")}` : summary,
          });
        }
      } catch (err) {
        // The worksheet itself is already secured; only the canon write failed.
        toast({ title: (err as Error).message, description: "WORKSHEET SECURED. CANON NOT UPDATED.", variant: "destructive" });
      }
    },
    [worldId, manifest, facts, assertOne, qc, toast],
  );

  const resolve = useCallback<CanonEmit["resolve"]>(
    async (conflict, choice) => {
      const rest = () => setConflicts((cs) => cs.filter((c) => c !== conflict));
      if (choice === "keep") {
        rest();
        toast({ title: "CANON KEPT.", description: `${conflict.label.toUpperCase()} REMAINS ${conflict.canonText}.` });
        return;
      }
      try {
        await assertOne(conflict.planned, ctxFor.subjectId, ctxFor.worksheetId, true);
        if (worldId) await qc.invalidateQueries({ queryKey: canonKeys.all(worldId) });
        rest();
        toast({ title: "CANON REPLACED.", description: `${conflict.label.toUpperCase()} NOW ${conflict.sheetText}. PRIOR VALUE RETAINED IN HISTORY.` });
      } catch (err) {
        toast({ title: (err as Error).message, variant: "destructive" });
      }
    },
    [assertOne, ctxFor, worldId, qc, toast],
  );

  return { emit, conflicts, resolve, dismiss: () => setConflicts([]) };
}
