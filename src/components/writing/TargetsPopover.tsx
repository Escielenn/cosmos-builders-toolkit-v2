// ---------------------------------------------------------------------------
// TargetsStatus + TargetsPanel, the writer's targets and focus timer.
//
// The status-bar readout (TargetsStatus) and the bar's Targets button open
// the same panel. One place for every goal:
//
//   MANUSCRIPT  total manuscript words against the project target, with a
//               deadline and the weekdays the writer plans to write, giving
//               the words needed per WRITING day (worlds.settings
//               .writingProject for the target and deadline, as before;
//               .writingTargets for the weekdays and the goals below).
//   TODAY       words written today (the writing_sessions ledger, which the
//               Studio's history also reads) against the daily goal
//               (writing_preferences.dailyGoalWords, unchanged).
//   SESSION     words since this session began, with NEW SESSION.
//   DOCUMENT    the open document against its own target (set in the
//               inspector).
//   TIME        a Start/Pause focus timer that counts visible-tab time only,
//               against a session goal and a daily goal. Focus time is kept
//               on this device.
//
// Absorbs (Law VII): the 1.5 Targets popover, which absorbed GoalSetting.
// Numbers are mono; every bar has its figures beside it, never colour alone.
// ---------------------------------------------------------------------------

import { useEffect, useState } from "react";
import { Pause, Play, RotateCcw, Target } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import type { SessionTarget } from "@/hooks/use-session-target";
import { useWorldSetting } from "@/hooks/use-world-setting";
import { useWritingSessions } from "@/hooks/use-writing-activity";
import { ACTION_PRIMARY, ACTION_QUIET } from "@/components/writing/action-classes";
import { RoomPanel, PanelSection } from "@/components/writing/room/RoomPanel";
import { localDay, trailingDays } from "@/lib/local-day";
import { projectPace, sessionProgress, type ProjectTarget } from "@/lib/writing-targets";
import {
  TARGETS_KEY,
  WEEKDAYS,
  deadlinePace,
  meter,
  sanitizeTargetExtras,
  type TargetExtras,
} from "@/lib/writing/targets";
import {
  formatClock,
  resetTimerSession,
  setTargetsHosted,
  togglePanel,
  toggleTimer,
  useRoom,
} from "@/lib/writing/room-store";

export interface TargetsProps {
  session: SessionTarget;
  docWords: number;
  docTarget: number;
  manuscriptWords: number;
  project: ProjectTarget;
  projectLocal: boolean;
  onProjectChange: (t: ProjectTarget) => void;
}

function Bar({ pct }: { pct: number }): JSX.Element {
  return (
    <span className="block h-1.5 w-full bg-sf-surface" aria-hidden="true">
      <span
        className="block h-full bg-sf-primary transition-[width] duration-base ease-sf-out"
        style={{ width: `${Math.max(0, Math.min(100, pct))}%` }}
      />
    </span>
  );
}

function useTargetExtras() {
  const worldId = useRoom((s) => s.worldId);
  return useWorldSetting<TargetExtras>(worldId ?? undefined, TARGETS_KEY, sanitizeTargetExtras, "TARGET NOT SAVED.");
}

/** The session word goal: its own number, or the daily goal when unset. */
function sessionGoalOf(extras: TargetExtras, session: SessionTarget): number {
  return extras.sessionWords > 0 ? extras.sessionWords : session.goal;
}

/** The compact readout and trigger in the Write footer. */
export function TargetsStatus(props: TargetsProps): JSX.Element {
  const { session, project, manuscriptWords } = props;
  const open = useRoom((s) => s.panel === "targets");
  const extras = useTargetExtras();
  // Tell the bar's Targets button there is a panel to open.
  useEffect(() => {
    setTargetsHosted(true);
    return () => setTargetsHosted(false);
  }, []);

  const bySession = session.mode === "session";
  const words = bySession ? session.sessionWords : session.todayWords;
  const goal = bySession ? sessionGoalOf(extras.value, session) : session.goal;
  const sPct = sessionProgress(words, goal);
  const sDone = words >= goal;
  const pace = projectPace(project, manuscriptWords);
  const perDay = deadlinePace(project, manuscriptWords, extras.value.writingDays).perWritingDay;

  return (
    <>
      <button
        type="button"
        onClick={(e) => togglePanel("targets", e.currentTarget)}
        aria-expanded={open}
        aria-haspopup="dialog"
        className="flex sf-hit min-h-[32px] items-center gap-3 px-1 font-mono text-[12px] text-t4 transition-colors duration-base hover:text-t2"
        aria-label="Targets: manuscript, today, session, document and focus timer"
        title="Targets and focus timer"
      >
        <Target className="h-3.5 w-3.5" aria-hidden="true" />
        <span className={sDone ? "text-sf-primary-text" : ""}>
          {words.toLocaleString()} / {goal.toLocaleString()} {bySession ? "SESSION" : "TODAY"}
        </span>
        <span className="hidden w-20 sm:block">
          <Bar pct={sPct * 100} />
        </span>
        {project.words > 0 && (
          <span className={`hidden md:inline ${pace.overdue ? "text-sf-crimson-text" : pace.done ? "text-sf-primary-text" : ""}`}>
            {pace.overdue ? "// " : ""}PROJECT {Math.round(pace.progress * 100)}%
            {perDay ? ` · ${perDay.toLocaleString()}/DAY` : ""}
          </span>
        )}
      </button>
      {open && (
        <RoomPanel title="Targets" label="Targets and focus timer">
          <TargetsPanel {...props} />
        </RoomPanel>
      )}
    </>
  );
}

// ---------------------------------------------------------------------------
// Panel pieces
// ---------------------------------------------------------------------------

function Meter({
  label,
  value,
  goal,
  unit,
  note,
  children,
}: {
  label: string;
  value: number;
  /** 0 = no goal: the figure shows, the bar does not. */
  goal: number;
  unit: string;
  note?: string;
  children?: React.ReactNode;
}): JSX.Element {
  const m = meter(value, goal);
  const shown = Math.round(value);
  return (
    <div className="py-2">
      <div className="flex items-baseline justify-between gap-3">
        <span className="font-sans text-[13px] text-t2">{label}</span>
        <span className="font-mono text-[13px] text-t1">
          {shown.toLocaleString()}
          {goal > 0 && <span className="text-t4"> / {goal.toLocaleString()}</span>}
          <span className="text-t4"> {unit}</span>
        </span>
      </div>
      {goal > 0 && (
        <div className="mt-1.5">
          <Bar pct={m.pct} />
        </div>
      )}
      <div className="mt-1 flex items-baseline justify-between gap-3 font-mono text-[12px] text-t4">
        <span className={m.done ? "text-sf-primary-text" : ""}>
          {goal > 0 ? (m.done ? "GOAL MET." : `${m.pct}% · ${Math.max(0, Math.round(goal - value)).toLocaleString()} TO GO`) : "NO TARGET"}
        </span>
        {note && <span>{note}</span>}
      </div>
      {children}
    </div>
  );
}

function NumberField({
  id,
  label,
  value,
  onCommit,
  min = 0,
  max,
  step = 1,
  placeholder,
}: {
  id: string;
  label: string;
  value: number;
  onCommit: (n: number) => void;
  min?: number;
  max: number;
  step?: number;
  placeholder?: string;
}): JSX.Element {
  const [text, setText] = useState(value > 0 ? String(value) : "");
  useEffect(() => setText(value > 0 ? String(value) : ""), [value]);
  const commit = () => {
    const n = text.trim() === "" ? 0 : Number(text);
    if (!Number.isFinite(n)) {
      setText(value > 0 ? String(value) : "");
      return;
    }
    const next = n <= 0 ? 0 : Math.max(min, Math.min(max, Math.round(n)));
    if (next !== value) onCommit(next);
    else setText(value > 0 ? String(value) : "");
  };
  return (
    <div>
      <Label htmlFor={id}>{label}</Label>
      <Input
        id={id}
        type="number"
        inputMode="numeric"
        min={min}
        max={max}
        step={step}
        placeholder={placeholder}
        value={text}
        onChange={(e) => setText(e.target.value)}
        onBlur={commit}
        onKeyDown={(e) => e.key === "Enter" && commit()}
        className="mt-1"
      />
    </div>
  );
}

function RecentDays(): JSX.Element {
  const { data: sessions, isLoading, isError } = useWritingSessions();
  const focusLog = useRoom((s) => s.focusLog);
  const words = new Map((sessions ?? []).map((r) => [r.day, r.words]));
  const days = trailingDays(localDay(), 7).reverse();
  if (isLoading) return <p className="font-mono text-[12px] uppercase text-t4">RETRIEVING LEDGER.</p>;
  return (
    <>
      {isError && <p className="mb-1 font-mono text-[12px] uppercase text-sf-amber-text">{"// WORD LEDGER UNAVAILABLE."}</p>}
      <table className="w-full font-mono text-[12px]">
        <thead>
          <tr className="text-left text-t4">
            <th scope="col" className="py-1 font-normal">DAY</th>
            <th scope="col" className="py-1 text-right font-normal">WORDS</th>
            <th scope="col" className="py-1 text-right font-normal">FOCUS MIN</th>
          </tr>
        </thead>
        <tbody>
          {days.map((d) => (
            <tr key={d} className="border-t border-sf-line-hairline">
              <td className="py-1 text-t3">{d}</td>
              <td className="py-1 text-right text-t1">{(words.get(d) ?? 0).toLocaleString()}</td>
              <td className="py-1 text-right text-t1">{Math.floor((focusLog[d] ?? 0) / 60)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </>
  );
}

// ---------------------------------------------------------------------------
// The panel
// ---------------------------------------------------------------------------

export function TargetsPanel({
  session,
  docWords,
  docTarget,
  manuscriptWords,
  project,
  projectLocal,
  onProjectChange,
}: TargetsProps): JSX.Element {
  const stored = useTargetExtras();
  const extras = stored.value;
  const timer = useRoom((s) => s.timer);
  const [deadline, setDeadline] = useState(project.deadline);
  const [recent, setRecent] = useState(false);
  useEffect(() => setDeadline(project.deadline), [project.deadline]);

  const saveExtras = (patch: Partial<TargetExtras>) => stored.save(sanitizeTargetExtras({ ...extras, ...patch }));
  const commitProject = (next: Partial<ProjectTarget>) => {
    const t = { words: project.words, deadline: project.deadline, ...next };
    if (t.words !== project.words || t.deadline !== project.deadline) onProjectChange(t);
  };

  const pace = deadlinePace(project, manuscriptWords, extras.writingDays);
  const sessionGoal = sessionGoalOf(extras, session);
  const started = new Date(session.sessionStart);
  const sessionMin = timer.sessionMs / 60_000;
  const dayMin = timer.dayMs / 60_000;

  const newSession = () => {
    session.reset();
    resetTimerSession();
  };

  let deadlineLine = "";
  let deadlineTone = "text-t3";
  if (project.words > 0) {
    if (pace.done) {
      deadlineLine = "MANUSCRIPT TARGET MET.";
      deadlineTone = "text-sf-primary-text";
    } else if (pace.overdue) {
      deadlineLine = `// DEADLINE PASSED. ${pace.remaining.toLocaleString()} WORDS TO GO.`;
      deadlineTone = "text-sf-crimson-text";
    } else if (pace.noWritingDays) {
      deadlineLine = "// NO WRITING DAYS BEFORE THE DEADLINE. CHANGE THE DATE OR THE DAYS.";
      deadlineTone = "text-sf-amber-text";
    } else if (pace.perWritingDay && pace.writingDaysLeft) {
      deadlineLine = `${pace.remaining.toLocaleString()} TO GO · ${pace.writingDaysLeft} WRITING ${pace.writingDaysLeft === 1 ? "DAY" : "DAYS"} · ${pace.perWritingDay.toLocaleString()} WORDS PER WRITING DAY`;
    } else {
      deadlineLine = `${pace.remaining.toLocaleString()} WORDS TO GO. SET A DEADLINE FOR A DAILY PACE.`;
    }
  }

  return (
    <div>
      {/* Focus timer */}
      <PanelSection>
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
          <div className="mr-auto">
            <p
              className={`font-mono text-[28px] leading-none ${timer.running ? "text-sf-primary-text" : "text-t1"}`}
              role="timer"
              aria-label={`Session focus time ${formatClock(timer.sessionMs)}`}
            >
              {formatClock(timer.sessionMs)}
            </p>
            <p className="mt-1.5 font-mono text-[12px] uppercase text-t4">
              {timer.running ? (timer.visible ? "FOCUS TIMER RUNNING" : "HELD. TAB NOT VISIBLE") : "SESSION FOCUS TIME"}
            </p>
          </div>
          <button type="button" onClick={toggleTimer} aria-pressed={timer.running} className={ACTION_PRIMARY}>
            {timer.running ? <Pause className="h-3.5 w-3.5" aria-hidden="true" /> : <Play className="h-3.5 w-3.5" aria-hidden="true" />}
            {timer.running ? "Pause timer" : "Start timer"}
          </button>
          <button type="button" onClick={newSession} className={ACTION_QUIET}>
            <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" />
            New session
          </button>
        </div>
      </PanelSection>

      {/* Progress */}
      <PanelSection title="Progress">
        <Meter label="Manuscript" value={manuscriptWords} goal={project.words} unit="W" />
        <Meter label="Today's words" value={session.todayWords} goal={session.goal} unit="W" />
        <Meter
          label="Session words"
          value={session.sessionWords}
          goal={sessionGoal}
          unit="W"
          note={`SINCE ${started.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" })}`}
        />
        <Meter label="This document" value={docWords} goal={docTarget} unit="W">
          {docTarget === 0 && (
            <p className="mt-1 font-sans text-[12px] text-t3">Set a document&apos;s target in the inspector&apos;s Doc tab.</p>
          )}
        </Meter>
        <Meter label="Focus time today" value={dayMin} goal={extras.dailyMinutes} unit="MIN" />
        <Meter label="Focus time this session" value={sessionMin} goal={extras.sessionMinutes} unit="MIN" />
      </PanelSection>

      {/* Manuscript target and deadline */}
      <PanelSection title="Manuscript and deadline">
        <div className="grid grid-cols-2 gap-2">
          <NumberField
            id="sf-project-words"
            label="Manuscript target"
            value={project.words}
            max={10_000_000}
            step={1000}
            placeholder="80000"
            onCommit={(n) => commitProject({ words: n })}
          />
          <div>
            <Label htmlFor="sf-project-deadline">Deadline</Label>
            <Input
              id="sf-project-deadline"
              type="date"
              min={localDay(new Date())}
              value={deadline}
              onChange={(e) => {
                setDeadline(e.target.value);
                commitProject({ deadline: e.target.value });
              }}
              className="mt-1 font-mono"
            />
          </div>
        </div>
        <p className="mt-3 font-sans text-[12px] font-medium uppercase text-t3" id="sf-writing-days">
          Writing days
        </p>
        <div className="mt-1 flex" role="group" aria-labelledby="sf-writing-days">
          {WEEKDAYS.map((name, day) => {
            const on = extras.writingDays.includes(day);
            return (
              <button
                key={name}
                type="button"
                aria-pressed={on}
                onClick={() =>
                  saveExtras({
                    writingDays: on ? extras.writingDays.filter((d) => d !== day) : [...extras.writingDays, day],
                  })
                }
                className={`min-h-hit flex-1 border font-sans text-[12px] font-medium uppercase transition-colors duration-fast ${day > 0 ? "-ml-px" : ""} ${
                  on
                    ? "relative z-[1] border-sf-primary bg-sf-primary/[0.06] text-sf-primary-text"
                    : "border-sf-line text-t3 hover:border-sf-line-emphasis hover:text-t1"
                }`}
              >
                {name}
              </button>
            );
          })}
        </div>
        {deadlineLine && (
          <p className={`mt-2 font-mono text-[12px] leading-snug ${deadlineTone}`} role="status">
            {deadlineLine}
          </p>
        )}
        {(project.words > 0 || project.deadline) && (
          <button
            type="button"
            onClick={() => onProjectChange({ words: 0, deadline: "" })}
            className={`${ACTION_QUIET} mt-2 hover:border-sf-crimson hover:text-sf-crimson-text`}
          >
            Clear manuscript target
          </button>
        )}
        {(projectLocal || stored.isLocal) && (
          <p className="mt-2 font-mono text-[12px] text-sf-amber-text">{"// SAVED IN THIS BROWSER"}</p>
        )}
      </PanelSection>

      {/* Goals */}
      <PanelSection title="Goals">
        <div className="grid grid-cols-2 gap-2">
          <NumberField
            id="sf-session-goal"
            label="Daily words"
            value={session.goal}
            min={100}
            max={10_000}
            step={50}
            onCommit={(n) => session.setGoal(n || 500)}
          />
          <NumberField
            id="sf-session-words-goal"
            label="Session words"
            value={extras.sessionWords}
            max={100_000}
            step={50}
            placeholder={String(session.goal)}
            onCommit={(n) => saveExtras({ sessionWords: n })}
          />
          <NumberField
            id="sf-daily-minutes"
            label="Daily minutes"
            value={extras.dailyMinutes}
            max={1440}
            step={5}
            onCommit={(n) => saveExtras({ dailyMinutes: n })}
          />
          <NumberField
            id="sf-session-minutes"
            label="Session minutes"
            value={extras.sessionMinutes}
            max={1440}
            step={5}
            onCommit={(n) => saveExtras({ sessionMinutes: n })}
          />
        </div>
        <p className="mt-3 font-sans text-[12px] font-medium uppercase text-t3" id="sf-status-shows">
          Status bar shows
        </p>
        <div className="mt-1 flex" role="radiogroup" aria-labelledby="sf-status-shows">
          {(["day", "session"] as const).map((m, i) => (
            <button
              key={m}
              type="button"
              role="radio"
              aria-checked={session.mode === m}
              onClick={() => session.setMode(m)}
              className={`min-h-hit flex-1 border px-3 font-sans text-[12px] font-medium uppercase transition-colors duration-fast ${i > 0 ? "-ml-px" : ""} ${
                session.mode === m
                  ? "relative z-[1] border-sf-primary bg-sf-primary/[0.06] text-sf-primary-text"
                  : "border-sf-line text-t3 hover:border-sf-line-emphasis hover:text-t1"
              }`}
            >
              {m === "day" ? "Today's words" : "Session words"}
            </button>
          ))}
        </div>
      </PanelSection>

      {/* Recent days */}
      <PanelSection>
        <button
          type="button"
          aria-expanded={recent}
          onClick={() => setRecent(!recent)}
          className="flex min-h-hit w-full items-center justify-between font-heading text-sf-eyebrow uppercase text-t4 transition-colors duration-fast hover:text-t2"
        >
          <span>Last seven days</span>
          <span className="font-mono text-[12px] tracking-normal" aria-hidden="true">{recent ? "−" : "+"}</span>
        </button>
        {recent && <RecentDays />}
        <p className="mt-2 font-sans text-[12px] leading-snug text-t3">
          Words count what was added, from the same ledger as the Studio&apos;s history. Focus time counts while the
          timer runs and this tab is visible, and is kept on this device.
        </p>
      </PanelSection>
    </div>
  );
}

export default TargetsStatus;
