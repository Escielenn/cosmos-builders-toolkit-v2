import { describe, it, expect, afterEach } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { PageHeader } from "@/components/layout/page-chrome";
import { SimulatorTitle } from "@/components/simulators/SimulatorTitle";

afterEach(cleanup);

describe("PageHeader sizes", () => {
  it("page size renders the h1 at sf-h1 (default, backward compatible)", () => {
    render(<PageHeader title="Your worlds" eyebrow="WORLDS" />);
    const h1 = screen.getByRole("heading", { level: 1, name: "Your worlds" });
    expect(h1.className).toContain("font-display");
    expect(h1.className).toContain("text-sf-h1");
    const header = h1.closest("header")!;
    expect(header.getAttribute("data-page-header")).toBe("page");
    expect(header.className).not.toContain("text-center");
  });

  it("card size renders MD Nichrome at sf-h2 with a 14px lede", () => {
    render(<PageHeader size="card" title="Set new password" lede="Choose a password." />);
    const h1 = screen.getByRole("heading", { level: 1, name: "Set new password" });
    expect(h1.className).toContain("font-display");
    expect(h1.className).toContain("font-light");
    expect(h1.className).toContain("text-sf-h2");
    expect(h1.closest("header")!.getAttribute("data-page-header")).toBe("card");
    expect(screen.getByText("Choose a password.").className).toContain("text-sf-small");
  });

  it("align=center centres the header, eyebrow and lede", () => {
    render(<PageHeader size="card" align="center" eyebrow="INVITATION" title="World invitation" lede="Sign in." />);
    const header = screen.getByRole("heading", { level: 1 }).closest("header")!;
    expect(header.className).toContain("text-center");
    expect(screen.getByText("// INVITATION")).toBeInTheDocument();
    expect(screen.getByText("Sign in.").className).toContain("mx-auto");
  });

  it("strips a typed // from the eyebrow and an arrow from the back label", () => {
    render(
      <MemoryRouter>
        <PageHeader title="Showing our work" eyebrow="// THE SCIENCE" back={{ label: "← Back to Rogue", to: "/rogue" }} />
      </MemoryRouter>,
    );
    expect(screen.getByText("// THE SCIENCE")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Back to Rogue" })).toHaveAttribute("href", "/rogue");
  });
});

describe("SimulatorTitle", () => {
  it("renders the canvas h1 in the display font with subtitle, context and status", () => {
    render(
      <SimulatorTitle name="EXOSKY" subtitle="Alien Night Sky Simulator" context="Kepler-442 b">
        <div role="status">● OBSERVING</div>
      </SimulatorTitle>,
    );
    const h1 = screen.getByRole("heading", { level: 1, name: "EXOSKY" });
    expect(h1.className).toContain("font-display");
    expect(h1.className).toContain("font-light");
    expect(screen.getByText("Alien Night Sky Simulator")).toBeInTheDocument();
    expect(screen.getByText("Kepler-442 b")).toBeInTheDocument();
    expect(screen.getByRole("status")).toHaveTextContent("OBSERVING");
  });
});
