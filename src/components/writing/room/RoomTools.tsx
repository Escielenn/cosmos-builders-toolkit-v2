import { useEffect } from "react";
import type { Editor } from "@tiptap/react";
import { Music, SpellCheck, Target } from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import { RoomHostSlot } from "@/components/writing/room/RoomHost";
import {
  formatClock,
  openPanel,
  setEditorGetter,
  togglePanel,
  useRoom,
  type RoomPanelId,
} from "@/lib/writing/room-store";

/**
 * RoomTools: the Manuscript's tool group (writing assistant, targets and
 * timer, music). Mounted once in the Manuscript's top bar by Write.tsx.
 * 1.7 seam: the bar owner mounts it, the tools owner fills it.
 *
 * Icon buttons in the bar; menu items when `compact` (the phone menu, which
 * unmounts when it closes). Either way a button only opens a panel: the
 * panels, the assistant's engine and the music player are hosted elsewhere
 * (RoomHost) and their state lives in room-store, so nothing is lost when
 * this unmounts.
 */
export interface RoomToolsProps {
  worldId: string | null;
  documentId: string | null;
  /** The live Tiptap editor for the focused document, or null while loading. */
  getEditor: () => Editor | null;
  /** Compact = phone bar: render inside an overflow menu instead of icons. */
  compact?: boolean;
}

// The Manuscript bar's own icon button (Write.tsx BAR_BUTTON), so the row
// reads as one group.
const BAR_BUTTON =
  "sf-hit flex h-9 w-9 shrink-0 items-center justify-center text-t3 transition-colors duration-fast hover:bg-sf-surface hover:text-t1";
const BAR_PRESSED = "bg-sf-surface-elevated text-sf-primary-text hover:bg-sf-surface-elevated hover:text-sf-primary-text";

interface ToolState {
  id: RoomPanelId;
  label: string;
  /** What the tool is doing right now, for the tooltip and the menu. */
  status: string | null;
  icon: typeof Music;
}

function useTools(): ToolState[] {
  const assistantOn = useRoom((s) => s.assistant.settings.enabled);
  const issueCount = useRoom((s) => s.assistant.issues.length);
  const running = useRoom((s) => s.timer.running);
  const seconds = useRoom((s) => (s.timer.running ? Math.floor(s.timer.sessionMs / 1000) : 0));
  const playlist = useRoom((s) => s.music.current?.name ?? null);
  const targetsHosted = useRoom((s) => s.targetsHosted);
  const tools: ToolState[] = [
    {
      id: "assistant",
      label: "Writing assistant",
      status: assistantOn ? (issueCount ? `on, ${issueCount} flagged` : "on") : null,
      icon: SpellCheck,
    },
    {
      id: "targets",
      label: "Targets and focus timer",
      status: running ? `timer ${formatClock(seconds * 1000)}` : null,
      icon: Target,
    },
    { id: "music", label: "Writing music", status: playlist ? `loaded: ${playlist}` : null, icon: Music },
  ];
  // The Targets panel needs the status bar's numbers; without that mount
  // there is nothing for the button to open.
  return targetsHosted ? tools : tools.filter((t) => t.id !== "targets");
}

export function RoomTools({ worldId, documentId, getEditor, compact = false }: RoomToolsProps): JSX.Element | null {
  const open = useRoom((s) => s.panel);
  const tools = useTools();

  // getEditor is stable and reads a ref, so the newest one is always right,
  // and it stays valid after this mount goes (focus mode, a closed menu).
  useEffect(() => {
    setEditorGetter(getEditor);
  }, [getEditor]);

  if (compact) {
    return (
      <>
        <DropdownMenuSeparator />
        <DropdownMenuLabel>Tools</DropdownMenuLabel>
        {tools.map((t) => (
          <DropdownMenuItem key={t.id} onSelect={() => openPanel(t.id)}>
            <t.icon className="mr-2 h-4 w-4" aria-hidden="true" />
            {t.label}
            {t.status && <span className="ml-auto pl-3 font-mono text-[12px] uppercase text-t4">{t.status.split(",")[0]}</span>}
          </DropdownMenuItem>
        ))}
      </>
    );
  }

  return (
    <>
      {tools.map((t) => {
        const pressed = open === t.id;
        const name = t.status ? `${t.label} (${t.status})` : t.label;
        return (
          <Tooltip key={t.id}>
            <TooltipTrigger asChild>
              <button
                type="button"
                aria-label={name}
                aria-pressed={pressed}
                aria-haspopup="dialog"
                onClick={(e) => togglePanel(t.id, e.currentTarget)}
                className={`${BAR_BUTTON} ${pressed ? BAR_PRESSED : ""}`}
              >
                <t.icon className="h-4 w-4" aria-hidden="true" />
                {/* At work: a small square, plus the words in the label. */}
                {t.status && (
                  <span aria-hidden="true" className="absolute right-1.5 top-1.5 h-1.5 w-1.5 bg-sf-primary" />
                )}
              </button>
            </TooltipTrigger>
            <TooltipContent side="bottom">{name}</TooltipContent>
          </Tooltip>
        );
      })}
      <RoomHostSlot worldId={worldId} documentId={documentId} rank={1} />
    </>
  );
}

export default RoomTools;
