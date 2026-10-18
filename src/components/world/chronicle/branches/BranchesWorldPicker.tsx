// Shown on /worlds?open=chronicle-branches: the Time Travel Timelines entry
// on the tools catalogue lands here when no world is chosen yet. Branches
// live in a world's Chronicle, so the writer picks the world first.

import { Link } from "react-router-dom";
import { GitBranch } from "lucide-react";

interface BranchesWorldPickerProps {
  worlds: Array<{ id: string; name: string }>;
}

export function BranchesWorldPicker({ worlds }: BranchesWorldPickerProps) {
  return (
    <section
      aria-labelledby="branches-picker"
      className="mb-8 border border-sf-teal bg-sf-teal/[0.06] p-4"
    >
      <h2
        id="branches-picker"
        className="flex items-center gap-2 font-heading text-sf-eyebrow uppercase text-sf-teal-text"
      >
        <GitBranch className="h-4 w-4" aria-hidden />
        Time travel timelines
      </h2>
      <p className="sf-measure mt-2 text-[14px] text-t2">
        Branches live in a world&apos;s Chronicle. Choose the world to open its timelines.
      </p>
      {worlds.length === 0 ? (
        <p className="mt-3 font-mono text-[12px] text-t3">NO WORLDS ON FILE. BEGIN SURVEY BELOW.</p>
      ) : (
        <ul className="mt-3 flex flex-wrap gap-2">
          {worlds.map((w) => (
            <li key={w.id}>
              <Link
                to={`/worlds/${w.id}/chronicle?view=branches`}
                className="inline-flex min-h-hit items-center border border-sf-line-interactive bg-sf-surface px-3 text-[14px] text-t1 transition-colors duration-fast ease-sf-out hover:border-sf-primary hover:text-sf-primary-text"
              >
                {w.name}
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
