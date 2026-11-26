// ---------------------------------------------------------------------------
// harper.worker, grammar and spelling off the main thread.
//
// Runs harper.js (Apache-2.0, public/licenses/harper-LICENSE.txt) from a
// same-origin WebAssembly binary. The page sends paragraphs; this answers
// with spans. Nothing here opens a connection: the writer's text stays on
// the device.
//
// Loaded only when the writer turns the assistant on (the engine creates the
// worker), so the ~20 MB binary is never part of the app's own bundle.
// ---------------------------------------------------------------------------

import { LocalLinter, type Dialect } from "harper.js";
import { slimBinary } from "harper.js/slimBinary";
import { scalarOffsets, scalarSpanToUtf16 } from "./spans";
import type { FromWorker, ToWorker, WireLint } from "./protocol";

interface WorkerScope {
  onmessage: ((event: MessageEvent<ToWorker>) => void) | null;
  postMessage(message: FromWorker): void;
}
const scope = self as unknown as WorkerScope;

let linter: LocalLinter | null = null;
// One job at a time: a dictionary or dialect change must land before the
// check that was queued after it.
let queue: Promise<void> = Promise.resolve();

async function configure(dialect: number, words: string[]): Promise<void> {
  if (!linter) {
    linter = new LocalLinter({ binary: slimBinary, dialect: dialect as Dialect });
    await linter.setup();
  }
  await linter.setDialect(dialect as Dialect);
  await linter.clearWords();
  if (words.length) await linter.importWords(words);
}

async function lintBlock(text: string, room: number): Promise<{ lints: WireLint[]; capped: boolean }> {
  const out: WireLint[] = [];
  let capped = false;
  if (!linter || room <= 0) return { lints: out, capped: room <= 0 };
  const lints = await linter.lint(text, { language: "plaintext" });
  const offsets = scalarOffsets(text);
  for (const lint of lints) {
    try {
      if (out.length >= room) {
        capped = true;
        continue;
      }
      const span = lint.span();
      const problem = lint.get_problem_text();
      const at = scalarSpanToUtf16(text, offsets, span.start, span.end, problem);
      span.free();
      if (!at) continue;
      const suggestions = lint.suggestions();
      out.push({
        start: at.start,
        end: at.end,
        problem,
        message: lint.message(),
        kind: lint.lint_kind(),
        suggestions: suggestions.slice(0, 5).map((s) => ({ text: s.get_replacement_text(), kind: s.kind() as number })),
      });
      for (const s of suggestions) s.free();
    } finally {
      lint.free();
    }
  }
  return { lints: out, capped };
}

scope.onmessage = ({ data }) => {
  queue = queue.then(async () => {
    if (data.type === "configure") {
      try {
        await configure(data.dialect, data.words);
        scope.postMessage({ type: "ready" });
      } catch {
        linter = null;
        scope.postMessage({ type: "error", fatal: true });
      }
      return;
    }
    try {
      const blocks: Array<{ key: number; lints: WireLint[] }> = [];
      let room = data.max;
      let capped = false;
      for (const b of data.blocks) {
        const r = await lintBlock(b.text, room);
        room -= r.lints.length;
        capped = capped || r.capped;
        blocks.push({ key: b.key, lints: r.lints });
      }
      scope.postMessage({ type: "result", id: data.id, blocks, capped });
    } catch {
      scope.postMessage({ type: "error", id: data.id, fatal: false });
    }
  });
};
