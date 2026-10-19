import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, fireEvent, cleanup } from "@testing-library/react";
import { useState } from "react";
import {
  CodexSidebarContainer,
  CodexResizeHandle,
  nextCodexWidth,
  CODEX_MIN_WIDTH,
  CODEX_MAX_WIDTH,
  CODEX_KEY_STEP,
  CODEX_KEY_STEP_LARGE,
} from "@/components/world/CodexSidebarContainer";

afterEach(cleanup);

describe("nextCodexWidth", () => {
  it("steps with the arrow keys", () => {
    expect(nextCodexWidth(260, "ArrowRight")).toBe(260 + CODEX_KEY_STEP);
    expect(nextCodexWidth(260, "ArrowLeft")).toBe(260 - CODEX_KEY_STEP);
    expect(nextCodexWidth(260, "ArrowUp")).toBe(260 + CODEX_KEY_STEP);
    expect(nextCodexWidth(260, "ArrowDown")).toBe(260 - CODEX_KEY_STEP);
  });

  it("takes a larger step with Shift", () => {
    expect(nextCodexWidth(260, "ArrowRight", true)).toBe(260 + CODEX_KEY_STEP_LARGE);
  });

  it("jumps to the bounds with Home and End", () => {
    expect(nextCodexWidth(260, "Home")).toBe(CODEX_MIN_WIDTH);
    expect(nextCodexWidth(260, "End")).toBe(CODEX_MAX_WIDTH);
  });

  it("clamps to the bounds", () => {
    expect(nextCodexWidth(CODEX_MAX_WIDTH - 4, "ArrowRight")).toBe(CODEX_MAX_WIDTH);
    expect(nextCodexWidth(CODEX_MIN_WIDTH + 4, "ArrowLeft", true)).toBe(CODEX_MIN_WIDTH);
  });

  it("ignores keys that are not resize keys", () => {
    expect(nextCodexWidth(260, "Enter")).toBeNull();
    expect(nextCodexWidth(260, "a")).toBeNull();
  });
});

function SheetHarness({ sheetMode }: { sheetMode: boolean }) {
  const [open, setOpen] = useState(false);
  return (
    <CodexSidebarContainer sheetMode={sheetMode} open={open} onOpenChange={setOpen}>
      <aside aria-label="World index">
        <p>Codex contents</p>
      </aside>
    </CodexSidebarContainer>
  );
}

describe("CodexSidebarContainer", () => {
  it("renders the sidebar inline at desktop widths, with no open button", () => {
    render(<SheetHarness sheetMode={false} />);
    expect(screen.getByText("Codex contents")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Open world index" })).toBeNull();
  });

  it("below md, starts closed behind a 44px labelled button", () => {
    render(<SheetHarness sheetMode />);
    expect(screen.queryByText("Codex contents")).toBeNull();
    const trigger = screen.getByRole("button", { name: "Open world index" });
    expect(trigger.className).toContain("min-h-hit");
    expect(trigger.className).toContain("min-w-hit");
  });

  it("below md, opens the sidebar in a left Sheet and closes it again", () => {
    render(<SheetHarness sheetMode />);
    fireEvent.click(screen.getByRole("button", { name: "Open world index" }));
    const dialog = screen.getByRole("dialog");
    expect(dialog).toHaveTextContent("Codex contents");
    expect(dialog).toHaveAccessibleName("World index");
    fireEvent.click(screen.getByRole("button", { name: "Close" }));
    expect(screen.queryByText("Codex contents")).toBeNull();
  });
});

describe("CodexResizeHandle", () => {
  it("is a focusable vertical separator that reports its width", () => {
    render(<CodexResizeHandle width={260} onWidthChange={vi.fn()} onMouseDown={vi.fn()} controls="codex" />);
    const sep = screen.getByRole("separator", { name: "Resize registry" });
    expect(sep).toHaveAttribute("tabindex", "0");
    expect(sep).toHaveAttribute("aria-orientation", "vertical");
    expect(sep).toHaveAttribute("aria-valuenow", "260");
    expect(sep).toHaveAttribute("aria-valuemin", String(CODEX_MIN_WIDTH));
    expect(sep).toHaveAttribute("aria-valuemax", String(CODEX_MAX_WIDTH));
    expect(sep).toHaveAttribute("aria-controls", "codex");
  });

  it("resizes from the keyboard", () => {
    const onWidthChange = vi.fn();
    render(<CodexResizeHandle width={260} onWidthChange={onWidthChange} onMouseDown={vi.fn()} />);
    const sep = screen.getByRole("separator");
    fireEvent.keyDown(sep, { key: "ArrowRight" });
    expect(onWidthChange).toHaveBeenLastCalledWith(260 + CODEX_KEY_STEP);
    fireEvent.keyDown(sep, { key: "Home" });
    expect(onWidthChange).toHaveBeenLastCalledWith(CODEX_MIN_WIDTH);
    onWidthChange.mockClear();
    fireEvent.keyDown(sep, { key: "Tab" });
    expect(onWidthChange).not.toHaveBeenCalled();
  });
});
