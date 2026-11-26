// ---------------------------------------------------------------------------
// AssistantPanel, the writing assistant's instrument panel.
//
// Three tabs over one engine:
//   REVIEW   what the local checker flagged, with its suggestions and, for a
//            word that resembles a Codex name, "Did you mean" and "Link to".
//   WORLD    capitalised words the world does not know yet: add to the
//            lexicon, or file a Codex entry.
//   LEXICON  the world's dictionary: what it takes from the Codex, Chronicle
//            and canon on its own, and the writer's own terms.
//
// Nothing here changes prose except a button the writer presses. Lazy: this
// file loads when the panel is first opened.
// ---------------------------------------------------------------------------

import { useEffect, useMemo, useRef, useState } from "react";
import { AlertTriangle, BookPlus, Check, Link2, Pencil, ShieldCheck, Trash2 } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useCreateEntity } from "@/hooks/use-entity-graph";
import { ACTION_PRIMARY, ACTION_QUIET } from "@/components/writing/action-classes";
import { RoomPanel, PanelSection } from "@/components/writing/room/RoomPanel";
import type { WorldLexiconState } from "@/components/writing/room/use-world-lexicon";
import {
  patchAssistant,
  setAssistantTab,
  updateAssistantSettings,
  useRoom,
  type AssistantTab,
} from "@/lib/writing/room-store";
import { assistant } from "@/lib/writing/assistant/controller";
import { DIALECTS, SUGGEST_INSERT_AFTER, SUGGEST_REMOVE } from "@/lib/writing/assistant/protocol";
import type { ProofIssue } from "@/lib/writing/assistant/proofread-plugin";
import {
  MAX_ALIASES,
  MAX_CUSTOM_TERMS,
  MAX_NOTE_LENGTH,
  MAX_TERM_LENGTH,
  stripPossessive,
  upsertCustomTerm,
  type CustomTerm,
} from "@/lib/writing/lexicon";
import {
  ENTITY_TYPES,
  ENTITY_TYPE_COLORS,
  ENTITY_TYPE_LABELS,
  type EntityType,
} from "@/services/entity-graph-types";

const REFUSALS = {
  empty: "// ENTER A TERM.",
  duplicate: "// TERM ALREADY ON FILE.",
  full: `// LEXICON FULL. ${MAX_CUSTOM_TERMS.toLocaleString()} TERMS.`,
} as const;

// ---------------------------------------------------------------------------
// Novel terms
// ---------------------------------------------------------------------------

export interface NovelTerm {
  term: string;
  count: number;
  ids: string[];
}

/**
 * Capitalised words the checker does not know and the world has no close
 * name for. A word seen only once, at the start of a sentence, is left out:
 * its capital is grammar, and it is more likely a typo than a name.
 */
export function novelTerms(issues: readonly ProofIssue[]): NovelTerm[] {
  const groups = new Map<string, NovelTerm & { midSentence: boolean }>();
  for (const issue of issues) {
    if (!issue.spelling || issue.match) continue;
    const term = stripPossessive(issue.problem).stem;
    if (term.length < 3 || !/^\p{Lu}/u.test(term)) continue;
    const g = groups.get(term) ?? { term, count: 0, ids: [], midSentence: false };
    g.count += 1;
    g.ids.push(issue.id);
    if (!issue.sentenceStart) g.midSentence = true;
    groups.set(term, g);
  }
  return [...groups.values()]
    .filter((g) => g.midSentence || g.count > 1)
    .sort((a, b) => b.count - a.count || a.term.localeCompare(b.term))
    .map(({ term, count, ids }) => ({ term, count, ids }));
}

// ---------------------------------------------------------------------------
// Panel
// ---------------------------------------------------------------------------

export interface AssistantPanelProps {
  worldId: string | null;
  world: WorldLexiconState;
}

export default function AssistantPanel({ worldId, world }: AssistantPanelProps): JSX.Element {
  const { settings, phase, issues, note, picked } = useRoom((s) => s.assistant);
  const tab = useRoom((s) => s.tab);
  const novel = useMemo(() => novelTerms(issues), [issues]);
  const on = settings.enabled;
  const working = phase === "ready" || phase === "checking";

  const addTerm = (term: string): boolean => {
    const r = upsertCustomTerm(world.custom, { term });
    if (!r.ok) return false;
    world.saveCustom(r.list);
    return true;
  };

  const tabs: Array<{ id: AssistantTab; label: string; count: number }> = [
    { id: "review", label: "Review", count: issues.length },
    { id: "world", label: "New to this world", count: novel.length },
    { id: "lexicon", label: "Lexicon", count: world.custom.length },
  ];

  return (
    <RoomPanel title="Writing assistant">
      <PanelSection>
        <p className="flex items-start gap-2 font-sans text-[13px] leading-snug text-t2">
          <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-sf-primary" aria-hidden="true" />
          <span>Grammar and spelling run on this device. No text leaves it.</span>
        </p>
        <div className="mt-3 flex min-h-hit items-center justify-between gap-3">
          <Label htmlFor="sf-assistant-on" className="cursor-pointer">
            Local grammar and spelling
          </Label>
          <Switch
            id="sf-assistant-on"
            checked={on}
            onCheckedChange={(v) => updateAssistantSettings({ enabled: v })}
          />
        </div>
        {!on && (
          <p className="font-sans text-[12px] text-t3">
            First use loads about 20 MB from this site. Browser spellcheck stays on until then.
          </p>
        )}
        {on && (
          <>
            <div className="mt-1 grid grid-cols-2 items-end gap-2">
              <div>
                <Label htmlFor="sf-assistant-dialect">Dialect</Label>
                <Select
                  value={String(settings.dialect)}
                  onValueChange={(v) => updateAssistantSettings({ dialect: Number(v) })}
                >
                  <SelectTrigger id="sf-assistant-dialect" className="mt-1 min-h-hit rounded-none">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {DIALECTS.map((name, i) => (
                      <SelectItem key={name} value={String(i)}>
                        {name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex min-h-hit items-center justify-between gap-2">
                <Label htmlFor="sf-assistant-auto" className="cursor-pointer leading-tight">
                  Check after a pause
                </Label>
                <Switch
                  id="sf-assistant-auto"
                  checked={settings.auto}
                  onCheckedChange={(v) => updateAssistantSettings({ auto: v })}
                />
              </div>
            </div>
            <div className="mt-2 flex flex-wrap gap-2">
              <button type="button" disabled={!working} onClick={assistant.checkParagraph} className={ACTION_QUIET}>
                Check paragraph
              </button>
              <button type="button" disabled={!working} onClick={assistant.reviewDocument} className={ACTION_PRIMARY}>
                Review document
              </button>
            </div>
          </>
        )}
        {note && (
          <p
            role="status"
            aria-live="polite"
            className={`mt-2 flex items-start gap-1.5 font-mono text-[12px] uppercase leading-snug ${
              phase === "failed" ? "text-sf-crimson-text" : "text-t3"
            }`}
          >
            {phase === "failed" && <AlertTriangle className="mt-px h-3.5 w-3.5 shrink-0 text-sf-crimson" aria-hidden="true" />}
            <span>{phase === "failed" ? `// ${note}` : note}</span>
          </p>
        )}
      </PanelSection>

      <div className="flex border-b border-sf-line-hairline" role="tablist" aria-label="Assistant views">
        {tabs.map((t) => (
          <button
            key={t.id}
            type="button"
            role="tab"
            id={`sf-assistant-tab-${t.id}`}
            aria-selected={tab === t.id}
            aria-controls="sf-assistant-tabpanel"
            onClick={() => setAssistantTab(t.id)}
            className={`flex min-h-hit flex-1 items-center justify-center gap-1.5 border-b-2 px-2 font-heading text-[12px] uppercase tracking-wide transition-colors duration-fast ${
              tab === t.id ? "border-sf-primary text-sf-primary-text" : "border-transparent text-t3 hover:text-t1"
            }`}
          >
            <span>{t.label}</span>
            <span className="font-mono tracking-normal">{t.count}</span>
          </button>
        ))}
      </div>

      <div id="sf-assistant-tabpanel" role="tabpanel" aria-labelledby={`sf-assistant-tab-${tab}`}>
        {tab === "review" && (
          <ReviewList on={on} issues={issues} picked={picked} world={world} onAdd={addTerm} />
        )}
        {tab === "world" && <NovelList on={on} worldId={worldId} terms={novel} onAdd={addTerm} />}
        {tab === "lexicon" && <LexiconManager world={world} />}
      </div>
    </RoomPanel>
  );
}

// ---------------------------------------------------------------------------
// Review
// ---------------------------------------------------------------------------

function Empty({ children }: { children: React.ReactNode }): JSX.Element {
  return <p className="px-4 py-6 font-sans text-[13px] leading-snug text-t2">{children}</p>;
}

function suggestionLabel(s: ProofIssue["suggestions"][number]): string {
  if (s.kind === SUGGEST_REMOVE || !s.text) return "Remove";
  if (s.kind === SUGGEST_INSERT_AFTER) return `Insert “${s.text}”`;
  return `Use “${s.text}”`;
}

function ReviewList({
  on,
  issues,
  picked,
  world,
  onAdd,
}: {
  on: boolean;
  issues: readonly ProofIssue[];
  picked: string | null;
  world: WorldLexiconState;
  onAdd: (term: string) => boolean;
}): JSX.Element {
  const { toast } = useToast();
  const pickedRef = useRef<HTMLLIElement>(null);
  useEffect(() => {
    if (!picked) return;
    pickedRef.current?.scrollIntoView({ block: "nearest" });
    // One highlight per click on the prose; the next click sets it again.
    const t = setTimeout(() => patchAssistant({ picked: null }), 1600);
    return () => clearTimeout(t);
  }, [picked]);

  if (!on) return <Empty>Turn the assistant on to check the open document.</Empty>;
  if (issues.length === 0) {
    return (
      <Empty>
        Nothing flagged. The active paragraph is checked when the typing stops; Review document checks all of it.
      </Empty>
    );
  }
  const canLink = assistant.canLink();

  return (
    <ul>
      {issues.map((issue) => {
        const entity = issue.match?.entityId ? world.entityById.get(issue.match.entityId) : undefined;
        const isPicked = picked === issue.id;
        return (
          <li
            key={issue.id}
            ref={isPicked ? pickedRef : undefined}
            className={`border-b border-sf-line-hairline px-4 py-3 last:border-b-0 ${
              isPicked ? "border-l-2 border-l-sf-primary bg-sf-primary/[0.06] pl-[14px]" : ""
            }`}
          >
            <div className="flex items-baseline justify-between gap-3">
              <button
                type="button"
                onClick={() => assistant.reveal(issue.id)}
                title="Show in the text"
                className="min-w-0 truncate text-left font-sans text-[15px] font-medium text-t1 underline-offset-4 hover:underline"
              >
                {issue.problem || issue.kind}
              </button>
              <span className="shrink-0 font-mono text-[12px] uppercase text-t4">{issue.kind}</span>
            </div>
            <p className="mt-1 font-sans text-[13px] leading-snug text-t2">{issue.message}</p>
            <div className="mt-2 flex flex-wrap gap-2">
              {issue.match && (
                <button
                  type="button"
                  onClick={() => assistant.replaceWith(issue.id, issue.match!.replacement)}
                  className={ACTION_PRIMARY}
                >
                  Did you mean {issue.match.replacement}?
                </button>
              )}
              {entity && canLink && (
                <button
                  type="button"
                  onClick={() =>
                    assistant.link(issue.id, {
                      id: entity.id,
                      label: issue.match!.name,
                      entityType: entity.entity_type,
                      color: entity.color || ENTITY_TYPE_COLORS[entity.entity_type] || ENTITY_TYPE_COLORS.custom,
                    })
                  }
                  className={ACTION_QUIET}
                >
                  <Link2 className="h-3.5 w-3.5" aria-hidden="true" />
                  Link to {entity.name}
                </button>
              )}
              {issue.suggestions.map((s, n) => (
                <button key={n} type="button" onClick={() => assistant.apply(issue.id, n)} className={ACTION_QUIET}>
                  {suggestionLabel(s)}
                </button>
              ))}
              {issue.spelling && (
                <button
                  type="button"
                  onClick={() => {
                    const term = stripPossessive(issue.problem).stem;
                    if (onAdd(term)) toast({ title: "TERM ADDED TO LEXICON.", description: term });
                    else toast({ title: "TERM NOT ADDED.", description: "Already on file, or the lexicon is full." });
                  }}
                  className={ACTION_QUIET}
                >
                  <BookPlus className="h-3.5 w-3.5" aria-hidden="true" />
                  Add to lexicon
                </button>
              )}
              <button type="button" onClick={() => assistant.ignore(issue.id)} className={ACTION_QUIET}>
                Ignore once
              </button>
            </div>
          </li>
        );
      })}
    </ul>
  );
}

// ---------------------------------------------------------------------------
// New to this world
// ---------------------------------------------------------------------------

function NovelList({
  on,
  worldId,
  terms,
  onAdd,
}: {
  on: boolean;
  worldId: string | null;
  terms: readonly NovelTerm[];
  onAdd: (term: string) => boolean;
}): JSX.Element {
  const { toast } = useToast();
  const createEntity = useCreateEntity(worldId ?? undefined);
  const [filing, setFiling] = useState<string | null>(null);
  const [type, setType] = useState<EntityType>("character");

  if (!on) return <Empty>Turn the assistant on, then review the document to list names the world has not met.</Empty>;
  if (terms.length === 0) {
    return (
      <Empty>
        No unknown names in what has been checked. Review document lists every capitalised word the Codex and the
        lexicon do not hold.
      </Empty>
    );
  }

  const file = (term: string) => {
    createEntity.mutate(
      { name: term, entity_type: type },
      {
        onSuccess: () => {
          setFiling(null);
          toast({ title: "CODEX ENTRY FILED.", description: `${term} · ${ENTITY_TYPE_LABELS[type]}` });
        },
      },
    );
  };

  return (
    <ul>
      {terms.map((t) => (
        <li key={t.term} className="border-b border-sf-line-hairline px-4 py-3 last:border-b-0">
          <div className="flex items-baseline justify-between gap-3">
            <button
              type="button"
              onClick={() => assistant.reveal(t.ids[0])}
              title="Show in the text"
              className="min-w-0 truncate text-left font-sans text-[15px] font-medium text-t1 underline-offset-4 hover:underline"
            >
              {t.term}
            </button>
            <span className="shrink-0 font-mono text-[12px] text-t4">
              {t.count} {t.count === 1 ? "USE" : "USES"}
            </span>
          </div>
          <div className="mt-2 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => {
                if (onAdd(t.term)) toast({ title: "TERM ADDED TO LEXICON.", description: t.term });
              }}
              className={ACTION_PRIMARY}
            >
              <BookPlus className="h-3.5 w-3.5" aria-hidden="true" />
              Add to lexicon
            </button>
            {worldId && (
              <button
                type="button"
                aria-expanded={filing === t.term}
                onClick={() => setFiling(filing === t.term ? null : t.term)}
                className={ACTION_QUIET}
              >
                Create Codex entry
              </button>
            )}
          </div>
          {filing === t.term && (
            <div className="mt-2 flex items-end gap-2 border-l-2 border-sf-line pl-3">
              <div className="min-w-0 flex-1">
                <Label htmlFor={`sf-novel-type-${t.term}`}>Entry type</Label>
                <Select value={type} onValueChange={(v) => setType(v as EntityType)}>
                  <SelectTrigger id={`sf-novel-type-${t.term}`} className="mt-1 min-h-hit rounded-none">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {ENTITY_TYPES.map((k) => (
                      <SelectItem key={k} value={k}>
                        {ENTITY_TYPE_LABELS[k]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <button
                type="button"
                disabled={createEntity.isPending}
                onClick={() => file(t.term)}
                className={ACTION_PRIMARY}
              >
                <Check className="h-3.5 w-3.5" aria-hidden="true" />
                File entry
              </button>
            </div>
          )}
        </li>
      ))}
    </ul>
  );
}

// ---------------------------------------------------------------------------
// Lexicon
// ---------------------------------------------------------------------------

const SOURCE_LABELS: Array<[keyof WorldLexiconState["lexicon"]["counts"], string]> = [
  ["codex", "CODEX"],
  ["alias", "ALIASES"],
  ["type", "ENTRY TYPES"],
  ["chronicle", "CHRONICLE"],
  ["pov", "POV"],
  ["canon", "CANON"],
];

function LexiconManager({ world }: { world: WorldLexiconState }): JSX.Element {
  const [term, setTerm] = useState("");
  const [note, setNote] = useState("");
  const [aliases, setAliases] = useState("");
  const [editing, setEditing] = useState<number | null>(null);
  const [error, setError] = useState("");
  const termRef = useRef<HTMLInputElement>(null);
  const counts = world.lexicon.counts;
  const fromWorld = SOURCE_LABELS.reduce((n, [k]) => n + counts[k], 0);

  const clear = () => {
    setTerm("");
    setNote("");
    setAliases("");
    setEditing(null);
    setError("");
  };

  const save = () => {
    const r = upsertCustomTerm(world.custom, { term, note, aliases }, editing);
    if (!r.ok) {
      setError(REFUSALS[r.reason ?? "empty"]);
      return;
    }
    world.saveCustom(r.list);
    clear();
  };

  const edit = (entry: CustomTerm, index: number) => {
    setEditing(index);
    setTerm(entry.term);
    setNote(entry.note);
    setAliases(entry.aliases.join(", "));
    setError("");
    termRef.current?.focus();
  };

  return (
    <>
      <PanelSection title="From the world" aside={<span className="font-mono text-[12px] text-t3">{fromWorld.toLocaleString()} NAMES</span>}>
        <p className="font-sans text-[13px] leading-snug text-t2">
          Every name the world holds is accepted without asking, and the list follows the Codex as it changes.
        </p>
        <dl className="mt-2 grid grid-cols-2 gap-x-4 gap-y-1 font-mono text-[12px]">
          {SOURCE_LABELS.map(([k, label]) => (
            <div key={k} className="flex items-baseline justify-between gap-2">
              <dt className="text-t4">{label}</dt>
              <dd className="text-t1">{counts[k].toLocaleString()}</dd>
            </div>
          ))}
        </dl>
      </PanelSection>

      <PanelSection
        title="Your terms"
        aside={
          <span className="font-mono text-[12px] text-t3">
            {world.custom.length.toLocaleString()} / {MAX_CUSTOM_TERMS.toLocaleString()}
          </span>
        }
      >
        <form
          onSubmit={(e) => {
            e.preventDefault();
            save();
          }}
          className="space-y-2"
        >
          <div>
            <Label htmlFor="sf-lexicon-term">Term</Label>
            <Input
              id="sf-lexicon-term"
              ref={termRef}
              value={term}
              maxLength={MAX_TERM_LENGTH}
              onChange={(e) => setTerm(e.target.value)}
              className="mt-1"
              autoComplete="off"
              spellCheck={false}
            />
          </div>
          <div>
            <Label htmlFor="sf-lexicon-aliases">Aliases (comma separated, up to {MAX_ALIASES})</Label>
            <Input
              id="sf-lexicon-aliases"
              value={aliases}
              onChange={(e) => setAliases(e.target.value)}
              className="mt-1"
              autoComplete="off"
              spellCheck={false}
            />
          </div>
          <div>
            <Label htmlFor="sf-lexicon-note">Note (optional)</Label>
            <Textarea
              id="sf-lexicon-note"
              value={note}
              maxLength={MAX_NOTE_LENGTH}
              rows={2}
              onChange={(e) => setNote(e.target.value)}
              className="mt-1"
            />
          </div>
          {error && (
            <p role="alert" className="font-mono text-[12px] uppercase text-sf-crimson-text">
              {error}
            </p>
          )}
          <div className="flex gap-2">
            <button type="submit" disabled={!term.trim()} className={ACTION_PRIMARY}>
              {editing === null ? "Add term" : "Save term"}
            </button>
            {editing !== null && (
              <button type="button" onClick={clear} className={ACTION_QUIET}>
                Cancel
              </button>
            )}
          </div>
        </form>
        {world.customLocal && (
          <p className="mt-2 font-mono text-[12px] uppercase text-sf-amber-text">{"// SAVED IN THIS BROWSER"}</p>
        )}
      </PanelSection>

      {world.custom.length > 0 && (
        <ul>
          {world.custom.map((entry, i) => (
            <li key={entry.term} className="flex items-start gap-1 border-b border-sf-line-hairline py-1 pl-4 pr-1 last:border-b-0">
              <div className="min-w-0 flex-1 py-2">
                <p className="truncate font-sans text-[14px] font-medium text-t1">{entry.term}</p>
                {entry.aliases.length > 0 && (
                  <p className="truncate font-sans text-[12px] text-t3">Also: {entry.aliases.join(", ")}</p>
                )}
                {entry.note && <p className="mt-0.5 font-sans text-[13px] leading-snug text-t2">{entry.note}</p>}
              </div>
              <button
                type="button"
                aria-label={`Edit ${entry.term}`}
                onClick={() => edit(entry, i)}
                className="flex min-h-hit min-w-hit items-center justify-center text-t3 transition-colors duration-fast hover:text-t1"
              >
                <Pencil className="h-3.5 w-3.5" aria-hidden="true" />
              </button>
              <button
                type="button"
                aria-label={`Remove ${entry.term}`}
                onClick={() => {
                  world.saveCustom(world.custom.filter((_, n) => n !== i));
                  if (editing === i) clear();
                }}
                className="flex min-h-hit min-w-hit items-center justify-center text-t3 transition-colors duration-fast hover:text-sf-crimson-text"
              >
                <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
