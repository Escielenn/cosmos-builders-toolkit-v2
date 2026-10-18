/**
 * OriginPicker — choose which upstream record a character comes from.
 *
 * Lists this world's worksheets for one tool (Genesis for a homeworld, Phylo
 * for a species, ...). Picking one is what makes the inherited traits below
 * fill in. With nothing on file it says so and links to the tool to make one;
 * the writer may still type a name, which is recorded as their own assertion
 * and inherits nothing.
 */

import { useId } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { UpstreamSheet } from "@/lib/dossier/inheritance";
import type { DossierSourceRef } from "@/lib/dossier/types";
import { SourceChip } from "@/components/dossier/TraitRow";
import { brandOf } from "@/components/dossier/tool-href";

const NONE = "__none";

interface OriginPickerProps {
  label: string;
  tool: string;
  sheets: UpstreamSheet[];
  value: DossierSourceRef;
  onChange: (ref: DossierSourceRef) => void;
  worldId: string | null;
  /** What to call an unlinked name, e.g. "homeworld". */
  noun: string;
  /** How to name a worksheet in the list (defaults to its title). */
  nameOf?: (sheet: UpstreamSheet) => string;
}

function sheetName(sheet: UpstreamSheet): string {
  return (sheet.title ?? "").trim() || "Untitled";
}

export function OriginPicker({
  label,
  tool,
  sheets,
  value,
  onChange,
  worldId,
  noun,
  nameOf = sheetName,
}: OriginPickerProps): JSX.Element {
  const selectId = useId();
  const nameId = useId();
  const brand = brandOf(tool);
  const linked = value.worksheetId ? sheets.find((s) => s.id === value.worksheetId) ?? null : null;
  const dangling = !!value.worksheetId && !linked;

  return (
    <div className="space-y-2">
      <Label htmlFor={selectId}>{label}</Label>
      {sheets.length > 0 ? (
        <Select
          value={linked ? linked.id : NONE}
          onValueChange={(id) => {
            if (id === NONE) {
              onChange({ worksheetId: null, name: linked ? "" : value.name });
              return;
            }
            const sheet = sheets.find((s) => s.id === id);
            if (sheet) onChange({ worksheetId: sheet.id, name: nameOf(sheet) });
          }}
        >
          <SelectTrigger id={selectId} aria-label={`${label}: choose a ${brand} record`}>
            <SelectValue placeholder={`Choose a ${brand} record`} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={NONE}>Not linked</SelectItem>
            {sheets.map((s) => (
              <SelectItem key={s.id} value={s.id}>
                {nameOf(s)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      ) : (
        <p id={selectId} className="font-mono text-[12px] uppercase tracking-[0.10em] text-t3">
          // NO {brand.toUpperCase()} RECORDS ON FILE IN THIS WORLD.
        </p>
      )}

      {dangling && (
        <p className="font-mono text-[12px] uppercase tracking-[0.10em] text-sf-crimson-text">
          // LINKED {brand.toUpperCase()} RECORD NOT FOUND. IT MAY HAVE BEEN ARCHIVED. RELINK OR CLEAR.
        </p>
      )}

      {!linked && (
        <div className="space-y-1">
          <Label htmlFor={nameId} className="sr-only">
            {`Name the ${noun} without linking`}
          </Label>
          <Input
            id={nameId}
            value={value.name}
            onChange={(e) => onChange({ worksheetId: null, name: e.target.value })}
            placeholder={`Or name the ${noun} (inherits nothing)`}
          />
        </div>
      )}

      <SourceChip tool={tool} worldId={worldId} worksheetId={linked?.id ?? null} title={linked ? nameOf(linked) : null} />
    </div>
  );
}
