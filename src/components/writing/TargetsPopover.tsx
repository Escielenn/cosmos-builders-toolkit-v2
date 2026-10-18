// ---------------------------------------------------------------------------
// TargetsStatus + TargetsPopover, Scrivener's targets in the status bar.
//
// SESSION   the existing daily goal (writing_preferences.dailyGoalWords),
//           resetting per day (the writing_sessions ledger, as before) or per
//           session (since this tab opened / NEW SESSION). One goal, one
//           place to set it: this popover absorbs the footer's GoalSetting.
// DOCUMENT  the open document's target, set in the inspector (Phase 1);
//           shown here for the whole picture.
// PROJECT   total manuscript words + optional deadline, stored on the world
//           (worlds.settings.writingProject), giving the words per day needed.
//
// Absorbs (Law VII): GoalSetting and the "N / goal TODAY" readout in the
// Write footer.
// ---------------------------------------------------------------------------

import { useEffect, useState } from "react";
import { Target } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import type { SessionTarget } from "@/hooks/use-session-target";
import { targetProgress } from "@/lib/document-meta";
import {
  localDay,
  projectPace,
  sessionProgress,
  type ProjectTarget,
} from "@/lib/writing-targets";

const QUICK_GOALS = [250, 500, 1000, 2000];

export interface TargetsProps {
  session: SessionTarget;
  docWords: number;
  docTarget: number;
  manuscriptWords: number;
  project: ProjectTarget;
  projectLocal: boolean;
  onProjectChange: (t: ProjectTarget) => void;
}

function Bar({ value, done }: { value: number; done: boolean }): JSX.Element {
  return (
    <span className="block h-1 w-full bg-sf-surface-elevated" aria-hidden="true">
      <span
        className={`block h-full transition-[width] duration-base ease-sf-out ${done ? "bg-sf-primary" : "bg-sf-stellar"}`}
        style={{ width: `${Math.round(value * 100)}%` }}
      />
    </span>
  );
}

/** The compact readout and trigger in the Write footer. */
export function TargetsStatus(props: TargetsProps): JSX.Element {
  const { session, project, manuscriptWords } = props;
  const sPct = sessionProgress(session.words, session.goal);
  const sDone = session.words >= session.goal;
  const pace = projectPace(project, manuscriptWords);

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          type="button"
          className="flex min-h-[32px] items-center gap-3 px-1 font-mono text-[12px] text-t4 transition-colors duration-base hover:text-t2"
          aria-label="Targets: session, document and project"
          title="Targets"
        >
          <Target className="h-3.5 w-3.5" aria-hidden="true" />
          <span className={sDone ? "text-sf-primary-text" : ""}>
            {session.words.toLocaleString()} / {session.goal.toLocaleString()}{" "}
            {session.mode === "day" ? "TODAY" : "SESSION"}
          </span>
          <span className="hidden w-20 sm:block">
            <Bar value={sPct} done={sDone} />
          </span>
          {project.words > 0 && (
            <span className={`hidden md:inline ${pace.overdue ? "text-sf-crimson-text" : pace.done ? "text-sf-primary-text" : ""}`}>
              {pace.overdue ? "// " : ""}PROJECT {Math.round(pace.progress * 100)}%
              {pace.perDay ? ` · ${pace.perDay.toLocaleString()}/DAY` : ""}
            </span>
          )}
        </button>
      </PopoverTrigger>
      <PopoverContent
        align="end"
        side="top"
        className="sf-sb max-h-[80vh] w-80 overflow-y-auto border-sf-line-interactive bg-sf-surface-elevated p-0"
      >
        <TargetsPanel {...props} />
      </PopoverContent>
    </Popover>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }): JSX.Element {
  return (
    <section className="border-b border-sf-line-hairline px-4 py-3 last:border-b-0">
      <h3 className="mb-2 font-heading text-sf-eyebrow uppercase text-t4">{title}</h3>
      {children}
    </section>
  );
}

const inputCls =
  "min-h-hit w-full border border-sf-line-interactive bg-sf-surface px-2 font-mono text-[16px] text-t1 hover:border-sf-line-emphasis";

export function TargetsPanel({
  session,
  docWords,
  docTarget,
  manuscriptWords,
  project,
  projectLocal,
  onProjectChange,
}: TargetsProps): JSX.Element {
  const [goal, setGoal] = useState(String(session.goal));
  const [pWords, setPWords] = useState(project.words ? String(project.words) : "");
  const [pDeadline, setPDeadline] = useState(project.deadline);
  useEffect(() => setGoal(String(session.goal)), [session.goal]);
  useEffect(() => {
    setPWords(project.words ? String(project.words) : "");
    setPDeadline(project.deadline);
  }, [project.words, project.deadline]);

  const commitGoal = () => {
    const n = Number(goal);
    if (Number.isFinite(n) && n > 0 && n !== session.goal) session.setGoal(n);
    else setGoal(String(session.goal));
  };
  const commitProject = (next: Partial<ProjectTarget>) => {
    const t = { words: project.words, deadline: project.deadline, ...next };
    if (t.words !== project.words || t.deadline !== project.deadline) onProjectChange(t);
  };

  const sDone = session.words >= session.goal;
  const pace = projectPace(project, manuscriptWords);
  const started = new Date(session.sessionStart);

  return (
    <div>
      <Section title="Session">
        <div className="mb-2 flex items-baseline justify-between font-mono text-[13px]">
          <span className={sDone ? "text-sf-primary-text" : "text-t1"}>
            {session.words.toLocaleString()} <span className="text-t4">/ {session.goal.toLocaleString()} W</span>
          </span>
          <span className="text-[12px] text-t4">{sDone ? "GOAL MET." : `${(session.goal - session.words).toLocaleString()} TO GO`}</span>
        </div>
        <Bar value={sessionProgress(session.words, session.goal)} done={sDone} />
        <label className="mt-3 block font-sans text-[12px] font-medium uppercase text-t3" htmlFor="sf-session-goal">
          Goal (words)
        </label>
        <input
          id="sf-session-goal"
          type="number"
          inputMode="numeric"
          min={100}
          max={10000}
          step={50}
          value={goal}
          onChange={(e) => setGoal(e.target.value)}
          onBlur={commitGoal}
          onKeyDown={(e) => e.key === "Enter" && commitGoal()}
          className={inputCls}
        />
        <div className="mt-1.5 flex gap-1" role="group" aria-label="Quick goals">
          {QUICK_GOALS.map((g) => (
            <button
              key={g}
              type="button"
              aria-pressed={session.goal === g}
              onClick={() => session.setGoal(g)}
              className={`min-h-hit flex-1 border font-mono text-[12px] transition-colors duration-fast ${
                session.goal === g ? "border-sf-primary text-sf-primary-text" : "border-sf-line-interactive text-t3 hover:text-t1"
              }`}
            >
              {g.toLocaleString()}
            </button>
          ))}
        </div>
        <p className="mt-3 font-sans text-[12px] font-medium uppercase text-t3">Resets</p>
        <div className="mt-1 flex" role="radiogroup" aria-label="When the session count resets">
          {(["day", "session"] as const).map((m, i) => (
            <button
              key={m}
              type="button"
              role="radio"
              aria-checked={session.mode === m}
              onClick={() => session.setMode(m)}
              className={`min-h-hit flex-1 border px-2 text-[12px] transition-colors duration-fast ${i > 0 ? "-ml-px" : ""} ${
                session.mode === m ? "border-sf-primary text-sf-primary-text" : "border-sf-line-interactive text-t3 hover:text-t1"
              }`}
            >
              {m === "day" ? "Every day" : "Every session"}
            </button>
          ))}
        </div>
        {session.mode === "session" ? (
          <div className="mt-2 flex items-center gap-2">
            <span className="flex-1 font-mono text-[12px] text-t4">
              SINCE {started.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" })}
            </span>
            <button
              type="button"
              onClick={session.reset}
              className="min-h-hit border border-sf-line-interactive px-2 text-[12px] text-t2 transition-colors duration-base hover:border-sf-primary hover:text-t1"
            >
              New session
            </button>
          </div>
        ) : (
          <p className="mt-2 font-mono text-[12px] text-t4">COUNTS EVERY WORD WRITTEN TODAY.</p>
        )}
      </Section>

      <Section title="Document">
        {docTarget > 0 ? (
          <>
            <div className="mb-2 flex items-baseline justify-between font-mono text-[13px]">
              <span className="text-t1">
                {docWords.toLocaleString()} <span className="text-t4">/ {docTarget.toLocaleString()} W</span>
              </span>
              <span className="text-[12px] text-t4">{Math.round(targetProgress(docWords, docTarget) * 100)}%</span>
            </div>
            <Bar value={targetProgress(docWords, docTarget)} done={docWords >= docTarget} />
          </>
        ) : (
          <p className="font-mono text-[12px] text-t4">{docWords.toLocaleString()} W · NO TARGET</p>
        )}
        <p className="mt-2 font-sans text-[12px] text-t3">Set a document&apos;s target in the inspector&apos;s Doc tab.</p>
      </Section>

      <Section title="Project">
        <div className="mb-2 flex items-baseline justify-between font-mono text-[13px]">
          <span className="text-t1">
            {manuscriptWords.toLocaleString()}
            {project.words > 0 && <span className="text-t4"> / {project.words.toLocaleString()} W</span>}
          </span>
          {project.words > 0 && <span className="text-[12px] text-t4">{Math.round(pace.progress * 100)}%</span>}
        </div>
        {project.words > 0 && <Bar value={pace.progress} done={pace.done} />}
        <div className="mt-3 grid grid-cols-2 gap-2">
          <div>
            <label className="block font-sans text-[12px] font-medium uppercase text-t3" htmlFor="sf-project-words">
              Total words
            </label>
            <input
              id="sf-project-words"
              type="number"
              inputMode="numeric"
              min={0}
              step={1000}
              placeholder="80000"
              value={pWords}
              onChange={(e) => setPWords(e.target.value)}
              onBlur={() => commitProject({ words: Math.max(0, Math.round(Number(pWords) || 0)) })}
              onKeyDown={(e) => e.key === "Enter" && commitProject({ words: Math.max(0, Math.round(Number(pWords) || 0)) })}
              className={inputCls}
            />
          </div>
          <div>
            <label className="block font-sans text-[12px] font-medium uppercase text-t3" htmlFor="sf-project-deadline">
              Deadline
            </label>
            <input
              id="sf-project-deadline"
              type="date"
              min={localDay(new Date())}
              value={pDeadline}
              onChange={(e) => {
                setPDeadline(e.target.value);
                commitProject({ deadline: e.target.value });
              }}
              className={inputCls}
            />
          </div>
        </div>
        {project.words > 0 && (
          <p
            className={`mt-2 font-mono text-[12px] ${pace.overdue ? "text-sf-crimson-text" : pace.done ? "text-sf-primary-text" : "text-t3"}`}
            role="status"
          >
            {pace.done
              ? "PROJECT TARGET MET."
              : pace.overdue
                ? `// DEADLINE PASSED. ${pace.remaining.toLocaleString()} WORDS TO GO.`
                : pace.perDay
                  ? `${pace.remaining.toLocaleString()} TO GO · ${pace.daysLeft} ${pace.daysLeft === 1 ? "DAY" : "DAYS"} · ${pace.perDay.toLocaleString()} WORDS PER DAY`
                  : `${pace.remaining.toLocaleString()} WORDS TO GO. SET A DEADLINE FOR A DAILY PACE.`}
          </p>
        )}
        {(project.words > 0 || project.deadline) && (
          <button
            type="button"
            onClick={() => onProjectChange({ words: 0, deadline: "" })}
            className="mt-2 min-h-hit border border-sf-line-interactive px-2 text-[12px] text-t3 transition-colors duration-base hover:border-sf-crimson hover:text-sf-crimson-text"
          >
            Clear project target
          </button>
        )}
        {projectLocal && <p className="mt-2 font-mono text-[12px] text-sf-amber-text">{"// SAVED IN THIS BROWSER"}</p>}
      </Section>
    </div>
  );
}

export default TargetsStatus;
