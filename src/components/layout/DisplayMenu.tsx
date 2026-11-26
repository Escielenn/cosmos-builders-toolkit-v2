// ---------------------------------------------------------------------------
// Display controls (1.6 "Quiet Instrument", finding 9; 1.7 in-place sections).
//
// The header used to carry three loose icon toggles (music, background eye,
// and the background picker) beside search. They are one menu now:
//
//   - signed out: a single "Display" icon button in the header (<DisplayMenu>)
//   - signed in:  a "Display" section inside the profile menu
//                 (<DisplayMenuItems> inside a <MenuSection>)
//
// Both render the same items so the two surfaces can never drift.
//
// 1.7: the profile menu's Display, Help and StellarForge entries used to be
// Radix flyout submenus. Those open on hover; on a phone a tap did nothing
// visible (the flyout opened off the left edge of the screen) and keyboard
// users had to know to press the right arrow. <MenuSection> expands in place
// instead: tap, click, Enter, Space and the right arrow all open it, on
// every viewport, and the left arrow closes it.
// ---------------------------------------------------------------------------

import type { KeyboardEvent, ReactNode } from "react";
import { ChevronDown, Music, SlidersHorizontal } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { OPEN_AUDIO_SELECTOR_EVENT } from "@/components/audio/audio-events";
import { useBackground } from "@/hooks/use-background";
import { cn } from "@/lib/utils";
import {
  setDisplayPref,
  useDisplayPref,
  type TelemetryPref,
} from "@/lib/display-prefs";

/** Section label inside a menu: the one header/footer heading style. Put it
 *  on a plain element or an inner span: twMerge reads text-sf-eyebrow as a
 *  colour and drops it against a primitive's own text size. */
export const MENU_LABEL_CLASS = "font-heading text-sf-eyebrow uppercase text-t4 px-2 py-1.5";
const MENU_LABEL_TEXT = "font-heading text-sf-eyebrow uppercase text-t4";

interface MenuSectionProps {
  /** Stable id; also names the revealed group for aria-controls. */
  id: string;
  label: string;
  icon: ReactNode;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  children: ReactNode;
}

/**
 * A menu entry that expands its items in place, under itself, instead of a
 * hover flyout. The revealed items are ordinary menu items, so the arrow
 * keys walk straight into them.
 */
export function MenuSection({ id, label, icon, open, onOpenChange, children }: MenuSectionProps) {
  const groupId = `menu-section-${id}`;
  const onKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    if (e.key === "ArrowRight" && !open) {
      e.preventDefault();
      onOpenChange(true);
    } else if (e.key === "ArrowLeft" && open) {
      e.preventDefault();
      onOpenChange(false);
    }
  };
  return (
    <>
      <DropdownMenuItem
        aria-expanded={open}
        aria-controls={open ? groupId : undefined}
        data-menu-section={id}
        onSelect={(e) => {
          // Keep the menu open: this entry toggles, it does not navigate.
          e.preventDefault();
          onOpenChange(!open);
        }}
        onKeyDown={onKeyDown}
        className={cn(open && "text-t1")}
      >
        {icon}
        {label}
        <ChevronDown
          className={cn("ml-auto h-4 w-4 transition-transform duration-fast ease-sf-out", open && "rotate-180")}
          aria-hidden="true"
        />
      </DropdownMenuItem>
      {open && (
        <DropdownMenuGroup
          id={groupId}
          aria-label={label}
          className="ml-4 border-l border-sf-line pl-1"
        >
          {children}
        </DropdownMenuGroup>
      )}
    </>
  );
}

interface DisplayMenuItemsProps {
  /** Show the Background picker entry (opens Settings > Background). */
  onOpenBackgroundPicker?: () => void;
}

export function DisplayMenuItems({ onOpenBackgroundPicker }: DisplayMenuItemsProps) {
  const { backgroundVisible, toggleBackgroundVisible } = useBackground();
  const telemetry = useDisplayPref("telemetry");
  const ambient = useDisplayPref("ambient");
  const worldArt = useDisplayPref("worldArt");

  return (
    <>
      <DropdownMenuItem
        onSelect={() => window.dispatchEvent(new Event(OPEN_AUDIO_SELECTOR_EVENT))}
      >
        <Music className="mr-2 h-4 w-4" aria-hidden="true" />
        Music
      </DropdownMenuItem>
      {onOpenBackgroundPicker && (
        <DropdownMenuItem onSelect={onOpenBackgroundPicker}>
          <SlidersHorizontal className="mr-2 h-4 w-4" aria-hidden="true" />
          Choose background
        </DropdownMenuItem>
      )}
      <DropdownMenuSeparator />
      <DropdownMenuCheckboxItem
        checked={backgroundVisible}
        onCheckedChange={() => toggleBackgroundVisible()}
        onSelect={(e) => e.preventDefault()}
      >
        Show background
      </DropdownMenuCheckboxItem>
      <DropdownMenuCheckboxItem
        checked={ambient === "on"}
        onCheckedChange={(on) => setDisplayPref("ambient", on ? "on" : "off")}
        onSelect={(e) => e.preventDefault()}
      >
        Ambient effects
      </DropdownMenuCheckboxItem>
      <DropdownMenuCheckboxItem
        checked={worldArt === "on"}
        onCheckedChange={(on) => setDisplayPref("worldArt", on ? "on" : "off")}
        onSelect={(e) => e.preventDefault()}
      >
        World art on cards
      </DropdownMenuCheckboxItem>
      <DropdownMenuSeparator />
      <DropdownMenuLabel className="px-2 py-1.5">
        <span className={MENU_LABEL_TEXT}>Telemetry bar</span>
      </DropdownMenuLabel>
      <DropdownMenuRadioGroup
        value={telemetry}
        onValueChange={(v) => setDisplayPref("telemetry", v as TelemetryPref)}
      >
        <DropdownMenuRadioItem value="marketing" onSelect={(e) => e.preventDefault()}>
          Public pages only
        </DropdownMenuRadioItem>
        <DropdownMenuRadioItem value="everywhere" onSelect={(e) => e.preventDefault()}>
          Everywhere
        </DropdownMenuRadioItem>
        <DropdownMenuRadioItem value="off" onSelect={(e) => e.preventDefault()}>
          Off
        </DropdownMenuRadioItem>
      </DropdownMenuRadioGroup>
    </>
  );
}

/** Signed-out header: one icon button that opens the Display menu. */
export function DisplayMenu() {
  return (
    <DropdownMenu modal={false}>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className="sf-nav-link inline-flex h-11 min-h-hit w-11 min-w-hit items-center justify-center text-t3 transition-colors hover:text-sf-primary-text"
          aria-label="Display settings"
        >
          <SlidersHorizontal className="relative z-[1] h-4 w-4" aria-hidden="true" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        collisionPadding={8}
        className="w-60 max-w-[calc(100vw-16px)] max-h-[var(--radix-dropdown-menu-content-available-height)] overflow-y-auto sf-sb rounded-none border-sf-line"
      >
        <DropdownMenuLabel className="px-2 py-1.5">
          <span className={MENU_LABEL_TEXT}>Display</span>
        </DropdownMenuLabel>
        <DisplayMenuItems />
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export default DisplayMenu;
