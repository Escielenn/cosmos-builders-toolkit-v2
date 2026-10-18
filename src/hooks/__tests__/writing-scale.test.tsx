// Perf and safety contract for long manuscripts (1.5 items 15, 16, 18):
//   - a 200-document, 100k-word binder renders from metadata alone (no
//     content column is ever requested for the list);
//   - a save patches the caches in place and never refetches the list;
//   - a save made on a stale content_version raises a conflict, a refused
//     write raises "denied", and neither is ever a silent overwrite;
//   - Scrivenings over 200 documents mounts editors only near the viewport.
import { describe, it, expect, beforeEach, vi } from "vitest";
import { act, cleanup, render, screen, waitFor, renderHook } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { ReactNode } from "react";

// ---- a recording Supabase double -------------------------------------------

interface Recorded {
  table: string;
  op: "select" | "update";
  cols: string;
  filters: [string, string, unknown][];
  payload?: unknown;
}
type Result = { data: unknown; error: unknown };
const calls: Recorded[] = [];
let handler: (q: Recorded) => Result = () => ({ data: [], error: null });

function builder(table: string) {
  const q: Recorded = { table, op: "select", cols: "", filters: [] };
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const b: any = {
    select(c: string) {
      q.cols = c;
      return b;
    },
    update(p: unknown) {
      q.op = "update";
      q.payload = p;
      return b;
    },
    eq(k: string, v: unknown) {
      q.filters.push(["eq", k, v]);
      return b;
    },
    in(k: string, v: unknown) {
      q.filters.push(["in", k, v]);
      return b;
    },
    is(k: string, v: unknown) {
      q.filters.push(["is", k, v]);
      return b;
    },
    not() {
      return b;
    },
    order() {
      return b;
    },
    maybeSingle() {
      q.filters.push(["single", "", true]);
      return b;
    },
    then(res: (r: Result) => unknown, rej: (e: unknown) => unknown) {
      calls.push(q);
      return Promise.resolve(handler(q)).then(res, rej);
    },
  };
  return b;
}

vi.mock("@/integrations/supabase/client", () => ({
  supabase: { from: (t: string) => builder(t), rpc: () => Promise.resolve({ error: null }) },
}));
vi.mock("@/contexts/AuthContext", () => ({ useAuth: () => ({ user: { id: "u1" } }) }));
vi.mock("@/components/editor/StellarForgeEditor", () => ({
  StellarForgeEditor: ({ content }: { content: string }) => <div data-testid="editor">{content}</div>,
}));

import {
  fetchBinderRows,
  useUpdateDocumentContent,
  useWritingDocuments,
  type BinderDoc,
} from "@/hooks/use-writing-documents";
import { __resetDocContentsForTests } from "@/hooks/use-document-contents";
import { BinderTree } from "@/components/writing/BinderTree";
import { Scrivenings } from "@/components/writing/Scrivenings";
import { SaveConflictError, SaveDeniedError } from "@/lib/writing/doc-scale";

const N = 200;
const WORDS_EACH = 500; // 200 x 500 = 100,000 words

const binderRow = (i: number): BinderDoc => ({
  id: `d${i}`,
  world_id: "w1",
  entry_type: "document",
  title: `Scene ${i}`,
  metadata: {},
  sort_order: i * 10,
  parent_id: null,
  icon: null,
  color: null,
  tool_source: null,
  tool_data_id: null,
  layer: null,
  cover_image_url: null,
  tags: [],
  created_by: "u1",
  created_at: "2026-10-01T00:00:00Z",
  updated_at: "2026-10-01T00:00:00Z",
  word_count: WORDS_EACH,
  content_version: 0,
});

const rows = Array.from({ length: N }, (_, i) => binderRow(i));
const prose = (i: number) => `<p>${Array.from({ length: WORDS_EACH }, () => `w${i}`).join(" ")}</p>`;

function columns(q: Recorded): string[] {
  return q.cols.split(",").map((c) => c.trim());
}
const listSelects = () =>
  calls.filter((c) => c.op === "select" && c.filters.some((f) => f[0] === "in" && f[1] === "entry_type"));

function wrapperFor(qc: QueryClient) {
  return ({ children }: { children: ReactNode }) => <QueryClientProvider client={qc}>{children}</QueryClientProvider>;
}

beforeEach(() => {
  cleanup();
  calls.length = 0;
  localStorage.clear();
  __resetDocContentsForTests();
  handler = (q) => {
    if (q.op === "select" && q.filters.some((f) => f[1] === "entry_type")) return { data: rows, error: null };
    if (q.op === "select" && q.filters.some((f) => f[0] === "in" && f[1] === "id")) {
      const ids = q.filters.find((f) => f[0] === "in" && f[1] === "id")![2] as string[];
      return {
        data: ids.map((id) => ({
          id,
          content: prose(Number(id.slice(1))),
          updated_at: "2026-10-01T00:00:00Z",
          content_version: 0,
        })),
        error: null,
      };
    }
    return { data: [], error: null };
  };
});

function Binder({ worldId }: { worldId: string }) {
  const { tree, entries, orderedDocs } = useWritingDocuments(worldId);
  const total = orderedDocs.reduce((n, o) => n + o.doc.word_count, 0);
  return (
    <div>
      <span data-testid="total">{total}</span>
      <BinderTree
        worldId={worldId}
        tree={tree}
        entries={entries}
        labels={[]}
        onOpen={vi.fn()}
        onMove={vi.fn()}
        onTrash={vi.fn()}
        onCreateDoc={vi.fn()}
        onCreateFolder={vi.fn()}
        onRename={vi.fn()}
        onDeleteFolder={vi.fn()}
      />
    </div>
  );
}

describe("binder at manuscript scale", () => {
  it("renders 200 documents / 100k words without requesting any content", async () => {
    const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    const t0 = performance.now();
    render(<Binder worldId="w1" />, { wrapper: wrapperFor(qc) });
    await waitFor(() => expect(screen.getAllByRole("treeitem")).toHaveLength(N));
    const ms = performance.now() - t0;

    expect(screen.getByTestId("total")).toHaveTextContent(String(N * WORDS_EACH));
    expect(listSelects()).toHaveLength(1);
    for (const c of calls) expect(columns(c)).not.toContain("content");
    expect(columns(listSelects()[0])).toContain("word_count");
    // Generous: the point is that nothing proportional to the text runs.
    expect(ms).toBeLessThan(5000);
  });

  it("a save patches the list in place and does not refetch it", async () => {
    const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    const { result } = renderHook(
      () => ({ list: useWritingDocuments("w1"), save: useUpdateDocumentContent("w1", { silentErrors: true }) }),
      { wrapper: wrapperFor(qc) },
    );
    await waitFor(() => expect(result.current.list.data).toHaveLength(N));
    expect(listSelects()).toHaveLength(1);

    handler = (q) =>
      q.op === "update"
        ? { data: [{ id: "d7", updated_at: "2026-10-18T12:00:00Z", word_count: 2, content_version: 1 }], error: null }
        : { data: rows, error: null };

    await act(async () => {
      await result.current.save.mutateAsync({ docId: "d7", content: "<p>two words</p>", baseVersion: 0 });
    });
    // Let any invalidation-triggered refetch run, if one were scheduled.
    await new Promise((r) => setTimeout(r, 20));

    expect(listSelects()).toHaveLength(1);
    const update = calls.find((c) => c.op === "update")!;
    expect(update.filters).toContainEqual(["eq", "content_version", 0]);
    expect(columns(update)).not.toContain("content");
    const row = result.current.list.data.find((d) => d.id === "d7")!;
    expect(row.word_count).toBe(2);
    expect(row.content_version).toBe(1);
    expect(row.updated_at).toBe("2026-10-18T12:00:00Z");
  });
});

describe("optimistic concurrency", () => {
  async function saveWith(server: unknown) {
    handler = (q) =>
      q.op === "update" ? { data: [], error: null } : { data: server, error: null };
    const qc = new QueryClient({ defaultOptions: { mutations: { retry: false } } });
    const { result } = renderHook(() => useUpdateDocumentContent("w1", { silentErrors: true }), {
      wrapper: wrapperFor(qc),
    });
    return result.current.mutateAsync({ docId: "d1", content: "<p>mine</p>", baseVersion: 3 });
  }

  it("another writer's newer version is a conflict carrying their copy", async () => {
    const err = await saveWith({
      id: "d1",
      title: "One",
      content: "<p>theirs</p>",
      updated_at: "t9",
      content_version: 4,
      word_count: 1,
    }).catch((e) => e);
    expect(err).toBeInstanceOf(SaveConflictError);
    expect((err as SaveConflictError).theirs.content).toBe("<p>theirs</p>");
    expect((err as SaveConflictError).mine).toBe("<p>mine</p>");
  });

  it("a row the account cannot write is denied, not failed", async () => {
    const err = await saveWith(null).catch((e) => e);
    expect(err).toBeInstanceOf(SaveDeniedError);
  });

  it("the same words already on the server count as saved", async () => {
    const row = await saveWith({
      id: "d1",
      title: "One",
      content: "<p>mine</p>",
      updated_at: "t9",
      content_version: 4,
      word_count: 1,
    });
    expect(row.content_version).toBe(4);
  });

  it("falls back to the pre-migration list when the columns are missing", async () => {
    handler = (q) =>
      q.cols.includes("word_count")
        ? { data: null, error: { code: "42703", message: "column world_entries.word_count does not exist" } }
        : { data: [{ ...rows[0], content: "<p>a b c</p>" }], error: null };
    const list = await fetchBinderRows("w-legacy");
    expect(list[0].word_count).toBe(3);
    expect("content" in list[0]).toBe(false);
    expect(list[0].content_version).toBe(-1);
  });
});

describe("Scrivenings virtualization", () => {
  it("mounts editors only for sections near the viewport", async () => {
    const instances: { cb: IntersectionObserverCallback; observed: Element[] }[] = [];
    class FakeIO {
      observed: Element[] = [];
      constructor(public cb: IntersectionObserverCallback) {
        instances.push(this);
      }
      observe(el: Element) {
        this.observed.push(el);
      }
      unobserve() {}
      disconnect() {}
      takeRecords() {
        return [];
      }
    }
    vi.stubGlobal("IntersectionObserver", FakeIO);
    try {
      const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
      render(
        <Scrivenings
          worldId="w1"
          docs={rows}
          title="Act one"
          editorClassName=""
          editorStyle={{}}
          onOpenDoc={vi.fn()}
          onClose={vi.fn()}
        />,
        { wrapper: wrapperFor(qc) },
      );
      await waitFor(() => expect(screen.getAllByTestId("editor").length).toBeGreaterThan(0));
      expect(screen.getAllByTestId("editor")).toHaveLength(3);
      expect(screen.getAllByTestId("scrivenings-placeholder")).toHaveLength(N - 3);
      // One batched content request for the set, not one per document.
      const contentCalls = calls.filter((c) => columns(c).includes("content"));
      expect(contentCalls.length).toBeLessThanOrEqual(2);

      // Scroll section 120 into range: its editor mounts on its own text.
      const io = instances[instances.length - 1];
      const target = io.observed.find((el) => (el as HTMLElement).dataset.docId === "d120")!;
      act(() => {
        io.cb(
          [{ target, isIntersecting: true, boundingClientRect: { height: 0 } } as unknown as IntersectionObserverEntry],
          io as unknown as IntersectionObserver,
        );
      });
      const section = document.querySelector('[data-doc-id="d120"]')!;
      expect(section.querySelector('[data-testid="editor"]')?.textContent).toContain("w120");
      expect(screen.getAllByTestId("editor")).toHaveLength(4);
    } finally {
      vi.unstubAllGlobals();
    }
  });
});
