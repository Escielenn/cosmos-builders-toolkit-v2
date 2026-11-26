// ---------------------------------------------------------------------------
// Display controls (1.6 "Quiet Instrument", finding 9).
//
// The header used to carry three loose icon toggles (music, background eye,
// and the background picker) beside search. They are one menu now:
//
//   - signed out: a single "Display" icon button in the header (<DisplayMenu>)
//   - signed in:  a "Display" submenu inside the profile menu
//                 (<DisplayMenuItems> rendered in a DropdownMenuSubContent)
//
// Both render the same items so the two surfaces can never drift.
// ---------------------------------------------------------------------------

import { Music, SlidersHorizontal } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { OPEN_AUDIO_SELECTOR_EVENT } from "@/components/audio/audio-events";
import { useBackground } from "@/hooks/use-background";
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

interface DisplayMenuItemsProps {
  /** Show the Background picker entry (opens Settings > Background). */
  onOpenBackgroundPicker?: () => void;
}

export function DisplayMenuItems({ onOpenBackgroundPicker }: DisplayMenuItemsProps) {
  const { backgroundVisible, toggleBackgroundVisible } = useBackground();
  const telemetry = useDisplayPref("telemetry");
  const ambient = useDisplayPref("ambient");

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
      <DropdownMenuContent align="end" className="w-56 rounded-none border-sf-line">
        <DropdownMenuLabel className="px-2 py-1.5">
          <span className={MENU_LABEL_TEXT}>Display</span>
        </DropdownMenuLabel>
        <DisplayMenuItems />
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export default DisplayMenu;
