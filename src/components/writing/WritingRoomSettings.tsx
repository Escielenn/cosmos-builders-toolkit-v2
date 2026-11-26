// ---------------------------------------------------------------------------
// WritingRoomSettings: "Writing room", one side sheet for how the Manuscript
// looks on this device (1.7). Absorbs (Law VII) the docked toolbar's Page
// theme menu and the Type menu (TypographyMenu) that sat at the end of row 2.
//
// The sheet is not modal: the page stays visible and live beside it, so
// every control previews as it moves. Paper, type, page geometry, a few
// writing comforts, atmosphere, the Manuscript chrome's own size, and saved
// looks. Stored per device (lib/writing/room.ts). Nothing here touches a
// document's content or how it exports.
// ---------------------------------------------------------------------------

import { useState } from "react";
import { Check, ImageOff, RotateCcw, Trash2 } from "lucide-react";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import {
  MAX_LOOKS,
  MAX_LOOK_NAME,
  ROOM_FONTS,
  ROOM_RANGE,
  VOID_FALLBACK,
  effectivePaperOpacity,
  type RoomFont,
  type RoomRangeKey,
} from "@/lib/writing/room";
import { PAPERS, getPaper, type Paper } from "@/lib/writing/themes";
import { SCENES, SCENE_NONE, SCENE_WORLD, safeCoverUrl, scenePhotoUrl } from "@/lib/writing/atmosphere";
import type { RoomController } from "@/components/writing/useRoomSettings";

/** The account-wide writing comforts that live beside the room's own. */
export interface RoomComforts {
  typewriter: boolean;
  fadeOthers: boolean;
  dropCap: boolean;
}

export interface WritingRoomSettingsProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  controller: RoomController;
  comforts: RoomComforts;
  onComfortsChange: (patch: Partial<RoomComforts>) => void;
  /** The world's cover image, when it has one. */
  worldCover?: string | null;
  worldName?: string;
}

const SECTION = "border-t border-sf-line-hairline px-5 py-5";
const SECTION_TITLE = "mb-3 font-heading text-sf-eyebrow uppercase text-t3";
const FIELD_LABEL = "font-sans text-[13px] font-medium text-t2";
const TILE =
  "flex min-h-hit flex-col items-stretch gap-2 border p-2 text-left transition-colors duration-fast";
const TILE_OFF = "border-sf-line hover:border-sf-line-emphasis";
const TILE_ON = "border-sf-primary bg-sf-primary/[0.06]";

function format(key: RoomRangeKey, v: number): string {
  switch (key) {
    case "fontSize":
    case "pageWidth":
    case "sideMargin":
    case "topMargin":
    case "binderWidth":
    case "sceneBlur":
      return `${v} PX`;
    case "letterSpacing":
      return `${v.toFixed(1)} PX`;
    case "paragraphGap":
      return `${v.toFixed(1)} EM`;
    case "firstIndent":
      return `${v.toFixed(2)} EM`;
    case "lineSpacing":
      return v.toFixed(2);
    case "sceneVisibility":
    case "paperOpacity":
      return `${v}%`;
  }
}

function Range({
  label,
  field,
  value,
  onChange,
  note,
}: {
  label: string;
  field: RoomRangeKey;
  value: number;
  onChange: (v: number) => void;
  note?: string;
}): JSX.Element {
  const [min, max, step] = ROOM_RANGE[field];
  return (
    <div className="flex flex-col">
      <div className="flex items-baseline justify-between gap-3">
        <span className={FIELD_LABEL}>{label}</span>
        <output className="font-mono text-[12px] text-t3">{format(field, value)}</output>
      </div>
      <Slider
        aria-label={label}
        min={min}
        max={max}
        step={step}
        value={[value]}
        onValueChange={([v]) => typeof v === "number" && onChange(v)}
        className="min-h-hit"
      />
      {note && <p className="font-mono text-[12px] text-sf-amber-text">{note}</p>}
    </div>
  );
}

function Toggle({
  label,
  hint,
  checked,
  onChange,
}: {
  label: string;
  hint?: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}): JSX.Element {
  return (
    <label className="flex min-h-hit cursor-pointer items-center gap-3">
      <span className="min-w-0 flex-1">
        <span className={`block ${FIELD_LABEL}`}>{label}</span>
        {hint && <span className="block font-sans text-[12px] text-t3">{hint}</span>}
      </span>
      <Switch checked={checked} onCheckedChange={onChange} aria-label={label} />
    </label>
  );
}

/** A small picture of the page on its desk: sheet, three lines of ink. */
function PaperPreview({ paper }: { paper: Paper }): JSX.Element {
  const c = paper.colors;
  const sheet = c ? c.paper : "var(--sf-void)";
  const ink = c ? c.ink : "var(--t2)";
  const strong = c ? c.inkStrong : "var(--t1)";
  const rule = c ? c.rule : "var(--sf-line-hairline)";
  return (
    <span aria-hidden="true" className="flex h-14 items-stretch border border-sf-line-hairline bg-sf-surface">
      <span className="w-3 shrink-0 border-r border-sf-line-hairline" />
      <span className="flex flex-1 flex-col justify-center gap-1 px-2" style={{ background: sheet }}>
        <span className="block h-[3px] w-1/2" style={{ background: strong }} />
        <span className="block h-px w-4" style={{ background: rule }} />
        <span className="block h-[2px] w-full" style={{ background: ink }} />
        <span className="block h-[2px] w-5/6" style={{ background: ink }} />
      </span>
    </span>
  );
}

export function WritingRoomSettings({
  open,
  onOpenChange,
  controller,
  comforts,
  onComfortsChange,
  worldCover,
  worldName,
}: WritingRoomSettingsProps): JSX.Element {
  const { room, update, reset, looks, saveLook, applyLook, deleteLook, voidColors } = controller;
  const [lookName, setLookName] = useState("");
  const [lookNote, setLookNote] = useState("");

  const cover = safeCoverUrl(worldCover);
  const sceneOn = room.scene !== SCENE_NONE && (room.scene !== SCENE_WORLD || !!cover);
  const drawnOpacity = effectivePaperOpacity(room, voidColors ?? VOID_FALLBACK);
  const held = sceneOn && drawnOpacity > room.paperOpacity;
  const papers = PAPERS.filter((p) => p.group === "paper");
  const signals = PAPERS.filter((p) => p.group === "signal");

  const paperTile = (p: Paper) => {
    const on = room.paper === p.id;
    return (
      <button
        key={p.id}
        type="button"
        onClick={() => update({ paper: p.id })}
        aria-pressed={on}
        title={p.description}
        className={`${TILE} ${on ? TILE_ON : TILE_OFF}`}
      >
        <PaperPreview paper={p} />
        <span className={`flex items-center gap-1.5 font-sans text-[13px] font-medium ${on ? "text-sf-primary-text" : "text-t2"}`}>
          {on && <Check className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />}
          <span className="truncate">{p.name}</span>
        </span>
      </button>
    );
  };

  const sceneTile = (id: string, name: string, thumb: string | null, disabled = false) => {
    const on = room.scene === id;
    return (
      <button
        key={id}
        type="button"
        disabled={disabled}
        onClick={() => update({ scene: id })}
        aria-pressed={on}
        className={`${TILE} ${
          disabled ? "border-sf-disabled-line text-sf-disabled-text" : on ? TILE_ON : TILE_OFF
        }`}
      >
        <span
          aria-hidden="true"
          className="flex h-14 items-center justify-center border border-sf-line-hairline bg-sf-void bg-cover bg-center"
          style={thumb ? { backgroundImage: `url(${JSON.stringify(thumb)})` } : undefined}
        >
          {!thumb && <ImageOff className="h-4 w-4 text-t4" />}
        </span>
        <span
          className={`flex items-center gap-1.5 font-sans text-[13px] font-medium ${
            disabled ? "" : on ? "text-sf-primary-text" : "text-t2"
          }`}
        >
          {on && <Check className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />}
          <span className="truncate">{name}</span>
        </span>
      </button>
    );
  };

  const submitLook = () => {
    const name = lookName.trim();
    if (!name) return;
    if (saveLook(name)) {
      setLookName("");
      setLookNote(`LOOK SAVED. ${name.toUpperCase()}`);
    } else {
      setLookNote(`SHELF FULL. ${MAX_LOOKS} LOOKS ON FILE. DELETE ONE FIRST.`);
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange} modal={false}>
      <SheetContent
        side="right"
        aria-describedby="sf-room-desc"
        className="flex w-full flex-col gap-0 border-sf-line bg-sf-surface p-0 sm:max-w-[420px]"
      >
        <SheetHeader className="shrink-0 space-y-1 px-5 pb-4 pt-5 text-left">
          <p className="font-mono text-sf-mono uppercase text-sf-primary-text">{"// THIS DEVICE"}</p>
          <SheetTitle>Writing room</SheetTitle>
          <SheetDescription id="sf-room-desc">
            How the Manuscript looks here. Nothing in this panel changes a word of the manuscript or how it exports.
          </SheetDescription>
        </SheetHeader>

        <div className="sf-sb min-h-0 flex-1 overflow-y-auto">
          {/* Paper */}
          <section className={SECTION} aria-labelledby="sf-room-paper">
            <h3 id="sf-room-paper" className={SECTION_TITLE}>
              Paper
            </h3>
            <div className="grid grid-cols-3 gap-2">{papers.map(paperTile)}</div>
            <p className="mt-2 font-sans text-[12px] text-t3">{getPaper(room.paper).description}</p>
            <div className="mt-3 grid grid-cols-3 gap-2">{signals.map(paperTile)}</div>
          </section>

          {/* Type */}
          <section className={SECTION} aria-labelledby="sf-room-type">
            <h3 id="sf-room-type" className={SECTION_TITLE}>
              Type
            </h3>
            <label className="mb-3 flex flex-col gap-1.5">
              <span className={FIELD_LABEL}>Writing font</span>
              <select
                value={room.font}
                onChange={(e) => update({ font: e.target.value as RoomFont })}
                className="sf-field min-h-hit w-full bg-sf-surface px-3 font-sans text-[16px] text-t1"
              >
                {ROOM_FONTS.map((f) => (
                  <option key={f} value={f}>
                    {f}
                  </option>
                ))}
              </select>
            </label>
            <div className="grid grid-cols-2 gap-x-5">
              <Range label="Size" field="fontSize" value={room.fontSize} onChange={(v) => update({ fontSize: v })} />
              <Range
                label="Line spacing"
                field="lineSpacing"
                value={room.lineSpacing}
                onChange={(v) => update({ lineSpacing: v })}
              />
            </div>
          </section>

          {/* Page */}
          <section className={SECTION} aria-labelledby="sf-room-page">
            <h3 id="sf-room-page" className={SECTION_TITLE}>
              Page
            </h3>
            <div className="grid grid-cols-2 gap-x-5 gap-y-1">
              <Range label="Page width" field="pageWidth" value={room.pageWidth} onChange={(v) => update({ pageWidth: v })} />
              <Range label="Side margins" field="sideMargin" value={room.sideMargin} onChange={(v) => update({ sideMargin: v })} />
              <Range label="Top margin" field="topMargin" value={room.topMargin} onChange={(v) => update({ topMargin: v })} />
              <Range
                label="Paragraph spacing"
                field="paragraphGap"
                value={room.paragraphGap}
                onChange={(v) => update({ paragraphGap: v })}
              />
              <Range
                label="Letter spacing"
                field="letterSpacing"
                value={room.letterSpacing}
                onChange={(v) => update({ letterSpacing: v })}
              />
              <Range
                label="First-line indent"
                field="firstIndent"
                value={room.firstIndent}
                onChange={(v) => update({ firstIndent: v })}
              />
            </div>
          </section>

          {/* Writing */}
          <section className={SECTION} aria-labelledby="sf-room-writing">
            <h3 id="sf-room-writing" className={SECTION_TITLE}>
              Writing
            </h3>
            <div className="flex flex-col">
              <Toggle
                label="Formatting toolbar"
                hint="Shortcuts work either way."
                checked={room.showToolbar}
                onChange={(v) => update({ showToolbar: v })}
              />
              <Toggle label="Spellcheck" checked={room.spellcheck} onChange={(v) => update({ spellcheck: v })} />
              <Toggle
                label="Typewriter scrolling"
                hint="Keeps the line being written at mid-screen."
                checked={comforts.typewriter}
                onChange={(v) => onComfortsChange({ typewriter: v })}
              />
              <Toggle
                label="Fade other paragraphs"
                checked={comforts.fadeOthers}
                onChange={(v) => onComfortsChange({ fadeOthers: v })}
              />
              <Toggle
                label="Drop cap"
                hint="An enlarged first letter on the opening paragraph."
                checked={comforts.dropCap}
                onChange={(v) => onComfortsChange({ dropCap: v })}
              />
            </div>
          </section>

          {/* Atmosphere */}
          <section className={SECTION} aria-labelledby="sf-room-atmosphere">
            <h3 id="sf-room-atmosphere" className={SECTION_TITLE}>
              Atmosphere
            </h3>
            <p className="mb-3 font-sans text-[13px] text-t2">
              A faded image behind the page. The paper always stays between it and the words.
            </p>
            <div className="grid grid-cols-3 gap-2">
              {sceneTile(SCENE_NONE, "No image", null)}
              {sceneTile(SCENE_WORLD, cover ? "World cover" : "No world cover", cover || null, !cover)}
              {SCENES.map((s) => sceneTile(s.id, s.name, scenePhotoUrl(s, 240, 60)))}
            </div>
            <p className="mt-2 font-sans text-[12px] text-t3">
              {cover
                ? `World cover uses the image on ${worldName || "this world"}. Gallery photographs load from Unsplash when chosen.`
                : "Give the world a cover image on its Bridge to use it here. Gallery photographs load from Unsplash when chosen."}
            </p>
            {sceneOn && (
              <div className="mt-3 grid grid-cols-2 gap-x-5 gap-y-1">
                <Range
                  label="Visibility"
                  field="sceneVisibility"
                  value={room.sceneVisibility}
                  onChange={(v) => update({ sceneVisibility: v })}
                />
                <Range label="Blur" field="sceneBlur" value={room.sceneBlur} onChange={(v) => update({ sceneBlur: v })} />
                <div className="col-span-2">
                  <Range
                    label="Paper opacity"
                    field="paperOpacity"
                    value={room.paperOpacity}
                    onChange={(v) => update({ paperOpacity: v })}
                    note={held ? `// PAPER HELD AT ${drawnOpacity}%. BELOW THAT THE TEXT LOSES CONTRAST.` : undefined}
                  />
                </div>
              </div>
            )}
          </section>

          {/* Instrument */}
          <section className={SECTION} aria-labelledby="sf-room-instrument">
            <h3 id="sf-room-instrument" className={SECTION_TITLE}>
              Instrument
            </h3>
            <div className="mb-3 flex flex-col gap-1.5">
              <span className={FIELD_LABEL} id="sf-room-uisize">
                Interface text size
              </span>
              <div role="group" aria-labelledby="sf-room-uisize" className="grid grid-cols-2 border border-sf-line">
                {(
                  [
                    ["comfortable", "Comfortable"],
                    ["large", "Large"],
                  ] as const
                ).map(([id, label]) => (
                  <button
                    key={id}
                    type="button"
                    onClick={() => update({ uiSize: id })}
                    aria-pressed={room.uiSize === id}
                    className={`min-h-hit font-sans text-[13px] font-medium transition-colors duration-fast ${
                      room.uiSize === id ? "bg-sf-surface-elevated text-sf-primary-text" : "text-t3 hover:text-t1"
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
              <span className="font-sans text-[12px] text-t3">Binder, bars and inspector. The page keeps its own size.</span>
            </div>
            <Range
              label="Binder width"
              field="binderWidth"
              value={room.binderWidth}
              onChange={(v) => update({ binderWidth: v })}
            />
          </section>

          {/* Saved looks */}
          <section className={SECTION} aria-labelledby="sf-room-looks">
            <h3 id="sf-room-looks" className={`${SECTION_TITLE} flex items-baseline justify-between`}>
              <span>Saved looks</span>
              <span className="font-mono text-[12px] font-normal tracking-normal text-t4">
                {looks.length} / {MAX_LOOKS}
              </span>
            </h3>
            <form
              className="flex gap-2"
              onSubmit={(e) => {
                e.preventDefault();
                submitLook();
              }}
            >
              <label htmlFor="sf-room-look-name" className="sr-only">
                Name this look
              </label>
              <input
                id="sf-room-look-name"
                value={lookName}
                maxLength={MAX_LOOK_NAME}
                onChange={(e) => {
                  setLookName(e.target.value);
                  setLookNote("");
                }}
                placeholder="Name this look"
                className="sf-field min-h-hit min-w-0 flex-1 px-3 font-sans text-[16px] text-t1"
              />
              <button
                type="submit"
                disabled={!lookName.trim()}
                className="min-h-hit shrink-0 border border-sf-primary bg-sf-primary/[0.06] px-4 font-sans text-[13px] font-medium text-sf-primary-text transition-colors duration-fast hover:border-sf-line-emphasis disabled:border-sf-disabled-line disabled:bg-transparent disabled:text-sf-disabled-text"
              >
                Save
              </button>
            </form>
            <p className="mt-1 min-h-[18px] font-mono text-[12px] text-t3" role="status" aria-live="polite">
              {lookNote}
            </p>
            {looks.length > 0 && (
              <ul className="mt-1 flex flex-col border-t border-sf-line-hairline">
                {looks.map((l) => (
                  <li key={l.id} className="flex items-stretch border-b border-sf-line-hairline">
                    <button
                      type="button"
                      onClick={() => {
                        applyLook(l);
                        setLookNote(`LOOK RECALLED. ${l.name.toUpperCase()}`);
                      }}
                      title="Recall this look"
                      className="flex min-h-hit min-w-0 flex-1 items-center gap-2 text-left font-sans text-[14px] text-t2 transition-colors duration-fast hover:text-t1"
                    >
                      <span
                        aria-hidden="true"
                        className="h-3.5 w-3.5 shrink-0 border border-sf-line"
                        style={{ background: getPaper(l.settings.paper).colors?.paper ?? "var(--sf-void)" }}
                      />
                      <span className="min-w-0 flex-1 truncate">{l.name}</span>
                      <span className="shrink-0 font-mono text-[12px] text-t4">
                        {getPaper(l.settings.paper).name.toUpperCase()} · {l.settings.fontSize}
                      </span>
                    </button>
                    <button
                      type="button"
                      onClick={() => deleteLook(l.id)}
                      aria-label={`Delete the look ${l.name}`}
                      className="flex min-h-hit w-11 shrink-0 items-center justify-center text-t4 transition-colors duration-fast hover:text-sf-crimson-text"
                    >
                      <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>

        <div className="flex shrink-0 items-center justify-between gap-3 border-t border-sf-line px-5 py-3">
          <button
            type="button"
            onClick={() => {
              reset();
              setLookNote("");
            }}
            className="flex min-h-hit items-center gap-2 font-sans text-[13px] font-medium text-t3 transition-colors duration-fast hover:text-t1"
          >
            <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" />
            Reset the room
          </button>
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            className="min-h-hit border border-sf-line px-4 font-sans text-[13px] font-medium text-t2 transition-colors duration-fast hover:border-sf-line-emphasis hover:text-t1"
          >
            Done
          </button>
        </div>
      </SheetContent>
    </Sheet>
  );
}

export default WritingRoomSettings;
