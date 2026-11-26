import { describe, it, expect, afterEach, beforeEach, vi } from "vitest";
import { useState } from "react";
import { render, screen, fireEvent, cleanup } from "@testing-library/react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { getDisplayPref } from "@/lib/display-prefs";

const toggleBackgroundVisible = vi.fn();
vi.mock("@/hooks/use-background", () => ({
  useBackground: () => ({ backgroundVisible: true, toggleBackgroundVisible }),
}));

import { DisplayMenuItems, MenuSection } from "@/components/layout/DisplayMenu";

// jsdom lacks these; Radix menus call them.
beforeEach(() => {
  window.HTMLElement.prototype.scrollIntoView = vi.fn();
  window.HTMLElement.prototype.hasPointerCapture = vi.fn(() => false);
  window.HTMLElement.prototype.releasePointerCapture = vi.fn();
  localStorage.clear();
  toggleBackgroundVisible.mockReset();
});
afterEach(cleanup);

function ProfileMenu() {
  const [section, setSection] = useState<string | null>(null);
  return (
    <DropdownMenu open modal={false}>
      <DropdownMenuTrigger>Account menu</DropdownMenuTrigger>
      <DropdownMenuContent>
        <MenuSection
          id="display"
          label="Display"
          icon={null}
          open={section === "display"}
          onOpenChange={(o) => setSection(o ? "display" : null)}
        >
          <DisplayMenuItems />
        </MenuSection>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

describe("MenuSection (profile menu Display)", () => {
  it("opens in place on click and the menu stays open", () => {
    render(<ProfileMenu />);
    const display = screen.getByRole("menuitem", { name: "Display" });
    expect(display).toHaveAttribute("aria-expanded", "false");
    expect(screen.queryByRole("menuitemcheckbox", { name: "Ambient effects" })).toBeNull();

    fireEvent.click(display);
    expect(display).toHaveAttribute("aria-expanded", "true");
    expect(screen.getByRole("group", { name: "Display" })).toBeInTheDocument();
    expect(screen.getByRole("menuitemcheckbox", { name: "Ambient effects" })).toBeInTheDocument();

    fireEvent.click(display);
    expect(display).toHaveAttribute("aria-expanded", "false");
  });

  it("opens with the right arrow and closes with the left arrow", () => {
    render(<ProfileMenu />);
    const display = screen.getByRole("menuitem", { name: "Display" });
    fireEvent.keyDown(display, { key: "ArrowRight" });
    expect(display).toHaveAttribute("aria-expanded", "true");
    fireEvent.keyDown(display, { key: "ArrowLeft" });
    expect(display).toHaveAttribute("aria-expanded", "false");
  });

  it("every control inside Display works and persists", () => {
    render(<ProfileMenu />);
    fireEvent.click(screen.getByRole("menuitem", { name: "Display" }));

    const art = screen.getByRole("menuitemcheckbox", { name: "World art on cards" });
    expect(art).toHaveAttribute("aria-checked", "true");
    fireEvent.click(art);
    expect(getDisplayPref("worldArt")).toBe("off");
    expect(localStorage.getItem("sf-display-world-art")).toBe("off");
    expect(screen.getByRole("menuitemcheckbox", { name: "World art on cards" })).toHaveAttribute("aria-checked", "false");

    fireEvent.click(screen.getByRole("menuitemcheckbox", { name: "Ambient effects" }));
    expect(localStorage.getItem("sf-display-ambient")).toBe("off");
    expect(document.documentElement.getAttribute("data-ambient")).toBe("off");

    fireEvent.click(screen.getByRole("menuitemcheckbox", { name: "Show background" }));
    expect(toggleBackgroundVisible).toHaveBeenCalledTimes(1);

    fireEvent.click(screen.getByRole("menuitemradio", { name: "Everywhere" }));
    expect(localStorage.getItem("sf-display-telemetry")).toBe("everywhere");

    const music = vi.fn();
    window.addEventListener("sf:open-audio-selector", music);
    fireEvent.click(screen.getByRole("menuitem", { name: "Music" }));
    window.removeEventListener("sf:open-audio-selector", music);
    expect(music).toHaveBeenCalledTimes(1);
  });
});
