import { describe, it, expect, afterEach } from "vitest";
import { render, screen, fireEvent, cleanup } from "@testing-library/react";
import { SkipLink, focusMainLandmark } from "@/components/layout/SkipLink";
import { MainLandmark } from "@/components/layout/MainLandmark";
import { WorldLayoutProvider } from "@/contexts/WorldLayoutContext";

afterEach(cleanup);

describe("SkipLink", () => {
  it("is labelled 'Skip to content' and targets #main", () => {
    render(<SkipLink />);
    const link = screen.getByRole("link", { name: "Skip to content" });
    expect(link).toHaveAttribute("href", "#main");
  });

  it("moves focus to the main landmark", () => {
    render(
      <>
        <SkipLink />
        <button type="button">Header control</button>
        <main id="main" tabIndex={-1}>Content</main>
      </>,
    );
    fireEvent.click(screen.getByRole("link", { name: "Skip to content" }));
    expect(document.activeElement).toBe(screen.getByRole("main"));
  });
});

describe("focusMainLandmark", () => {
  it("falls back to the first <main> and makes it focusable", () => {
    render(<main>Plain page</main>);
    expect(focusMainLandmark()).toBe(true);
    const main = screen.getByRole("main");
    expect(main).toHaveAttribute("tabindex", "-1");
    expect(document.activeElement).toBe(main);
  });

  it("reports false when the page has no main landmark", () => {
    render(<div>No landmark</div>);
    expect(focusMainLandmark()).toBe(false);
  });
});

describe("MainLandmark", () => {
  it("renders <main id='main'> on a standalone page", () => {
    render(<MainLandmark className="x">Tool</MainLandmark>);
    const main = screen.getByRole("main");
    expect(main).toHaveAttribute("id", "main");
    expect(main).toHaveClass("x");
  });

  it("renders a plain div inside WorldLayout, which owns the landmark", () => {
    render(
      <WorldLayoutProvider value={{ worldId: "w", worldName: "W", worldIcon: "globe", isWorldLayout: true }}>
        <MainLandmark>Tool</MainLandmark>
      </WorldLayoutProvider>,
    );
    expect(screen.queryByRole("main")).toBeNull();
    expect(screen.getByText("Tool")).toBeInTheDocument();
  });
});
