import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen, fireEvent, cleanup, waitFor } from "@testing-library/react";
import { DocumentInspector, type InspectorPane } from "@/components/writing/DocumentInspector";
import { EMPTY_DOC_META, type DocumentMeta } from "@/lib/document-meta";
import type { DocumentSnapshot } from "@/hooks/use-document-versions";

vi.mock("@/integrations/supabase/client", () => ({ supabase: {} }));
vi.mock("@/contexts/AuthContext", () => ({ useAuth: () => ({ user: null }) }));

const snap: DocumentSnapshot = {
  id: "s1",
  documentId: "d1",
  title: "Scene",
  name: "Before the rewrite",
  reason: "manual",
  content: "<p>old words</p>",
  wordCount: 2,
  timestamp: "2026-10-17T09:42:00Z",
};

function mount(pane: InspectorPane, meta: Partial<DocumentMeta> = {}) {
  const props = {
    meta: { ...EMPTY_DOC_META, keywords: [], ...meta },
    onChange: vi.fn(),
    words: 600,
    labels: [],
    onManageLabels: vi.fn(),
    keywordSuggestions: [],
    pane,
    onPaneChange: vi.fn(),
    snapshots: [snap],
    snapshotsLoading: false,
    snapshotsLocal: false,
    onTakeSnapshot: vi.fn().mockResolvedValue(true),
    onCompare: vi.fn(),
    onDeleteSnapshot: vi.fn(),
  };
  render(<DocumentInspector {...props} />);
  return props;
}

beforeEach(cleanup);

describe("DocumentInspector", () => {
  it("commits the synopsis on blur, not per keystroke", () => {
    const p = mount("card");
    const box = screen.getByPlaceholderText("What happens in this scene?");
    fireEvent.change(box, { target: { value: "Ix lands." } });
    expect(p.onChange).not.toHaveBeenCalled();
    fireEvent.blur(box);
    expect(p.onChange).toHaveBeenCalledWith({ synopsis: "Ix lands." });
  });

  it("shows target progress", () => {
    mount("card", { target: 1200 });
    expect(screen.getByText(/600 \/ 1,200 · 50%/)).toBeInTheDocument();
  });

  it("saves notes on blur", () => {
    const p = mount("notes");
    const box = screen.getByLabelText("Document notes");
    fireEvent.change(box, { target: { value: "Check tide tables" } });
    fireEvent.blur(box);
    expect(p.onChange).toHaveBeenCalledWith({ notes: "Check tide tables" });
  });

  it("lists snapshots and opens the comparison", () => {
    const p = mount("snapshots");
    fireEvent.click(screen.getByText("Before the rewrite"));
    expect(p.onCompare).toHaveBeenCalledWith(snap);
    // A named snapshot does not count toward the 20 unnamed (P2).
    expect(screen.getByText(/0 \/ 20 UNNAMED/)).toBeInTheDocument();
    expect(screen.getByText(/1 NAMED, KEPT/)).toBeInTheDocument();
  });

  it("takes a named snapshot", async () => {
    const p = mount("snapshots");
    fireEvent.change(screen.getByLabelText(/Snapshot name/), { target: { value: "Draft two" } });
    fireEvent.click(screen.getByRole("button", { name: /Take snapshot/ }));
    expect(p.onTakeSnapshot).toHaveBeenCalledWith("Draft two");
    // Settles: the field clears once the snapshot is on file.
    await waitFor(() => expect(screen.getByLabelText(/Snapshot name/)).toHaveValue(""));
  });
});
