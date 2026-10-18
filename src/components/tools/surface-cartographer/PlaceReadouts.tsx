// ---------------------------------------------------------------------------
// PlaceReadouts — what a place's position MEANS, derived on read.
//
// Every value here is computed from the place's coordinates and the body's
// canon by the pure functions in src/lib/surface-cartographer/. Nothing is
// stored; change the body's tilt in Genesis and every readout moves. Each
// readout carries one Ship's-Voice sentence of consequence (Tool Charter,
// obligation 3) — the number is data, the sentence is the product.
// ---------------------------------------------------------------------------

import { Link } from "react-router-dom";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import {
  TRAVEL_PRESETS,
  compassPoint,
  formatDuration,
  formatKm,
  formatLatLon,
  greatCircleKm,
  initialBearingDeg,
  travelHours,
  type LatLon,
} from "@/lib/surface-cartographer/geo";
import { placeSky, terminatorHalfWidthFromHabitable } from "@/lib/surface-cartographer/illumination";
import { bodyRadiusKm, type BodyFacts } from "@/lib/surface-cartographer/body";
import { PLACE_TYPE_LABELS, type SurfacePlace } from "@/lib/surface-cartographer/places";

interface PlaceReadoutsProps {
  place: SurfacePlace & { at: LatLon };
  facts: BodyFacts;
  substellarLon: number;
  places: SurfacePlace[];
  measureToId: string | null;
  onMeasureTo: (id: string | null) => void;
  travelKmh: number;
  onTravelKmh: (kmh: number) => void;
  /** Biome under the place on the GENERATED map, or null on a sheet. */
  generatedBiome: string | null;
  setHref: string;
}

function Readout({ label, value, note }: { label: string; value: string; note?: string }) {
  return (
    <div className="border-b border-sf-line-hairline py-2.5 last:border-b-0">
      <div className="flex flex-wrap items-baseline justify-between gap-3">
        <span className="font-sans text-[12px] font-medium uppercase text-t3">{label}</span>
        <span className="font-mono text-[14px] text-t1">{value}</span>
      </div>
      {note && <p className="sf-measure mt-1 font-mono text-[12px] leading-relaxed text-t2">{note}</p>}
    </div>
  );
}

export function PlaceReadouts({
  place,
  facts,
  substellarLon,
  places,
  measureToId,
  onMeasureTo,
  travelKmh,
  onTravelKmh,
  generatedBiome,
  setHref,
}: PlaceReadoutsProps) {
  const locked = facts.tidallyLocked?.value === true;
  const sky = placeSky(place.at, {
    tiltDeg: facts.tiltDeg?.value ?? null,
    dayLengthHours: facts.dayLengthHours?.value ?? null,
    tidallyLocked: locked,
    substellarLon,
    terminatorHalfWidthDeg: terminatorHalfWidthFromHabitable(facts.habitablePercent?.value),
  });

  const radiusKm = bodyRadiusKm(facts);
  const others = places.filter((p): p is SurfacePlace & { at: LatLon } => p.at !== null && p.id !== place.id);
  const target = others.find((p) => p.id === measureToId) ?? null;
  const km = target && radiusKm ? greatCircleKm(place.at, target.at, radiusKm) : NaN;
  const hours = travelHours(km, travelKmh);
  const preset = TRAVEL_PRESETS.find((t) => t.kmh === travelKmh);

  let daylightValue = "—";
  if (sky.daylight) {
    const d = sky.daylight;
    const f = (h: number) => (h < 10 ? h.toFixed(1) : String(Math.round(h)));
    daylightValue = `${f(d.winterHours)}–${f(d.summerHours)} h`;
  } else if (sky.lockedSky) {
    daylightValue = `STAR AT ${Math.round(sky.lockedSky.starElevationDeg)}°`;
  }

  return (
    <div>
      <Readout
        label="Position"
        value={formatLatLon(place.at)}
        note={`${PLACE_TYPE_LABELS[place.placeType].toUpperCase()}.`}
      />
      <Readout label={locked ? "Zone" : "Climate band"} value={sky.band.toUpperCase()} />
      <Readout label={locked ? "Sky" : "Daylight, winter–summer"} value={daylightValue} note={sky.narrative} />
      {generatedBiome && (
        <Readout
          label="Generated terrain"
          value={generatedBiome.toUpperCase()}
          note="FROM THE GENERATED MAP. A PICTURE, NOT A FACT. WRITE IT INTO THE PLACE IF IT IS TRUE."
        />
      )}

      <div className="mt-4 space-y-3">
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="sc-measure-to">Distance to</Label>
            <Select
              value={target ? target.id : "none"}
              onValueChange={(v) => onMeasureTo(v === "none" ? null : v)}
            >
              <SelectTrigger id="sc-measure-to" className="min-h-hit">
                <SelectValue placeholder="Choose a place" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">No second place</SelectItem>
                {others.map((p) => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="sc-travel">Travel by</Label>
            <Select
              value={preset ? preset.id : "custom"}
              onValueChange={(v) => {
                const p = TRAVEL_PRESETS.find((t) => t.id === v);
                if (p) onTravelKmh(p.kmh);
              }}
            >
              <SelectTrigger id="sc-travel" className="min-h-hit">
                <SelectValue placeholder="Speed" />
              </SelectTrigger>
              <SelectContent>
                {TRAVEL_PRESETS.map((t) => (
                  <SelectItem key={t.id} value={t.id}>
                    {t.label} · {t.kmh} km/h
                  </SelectItem>
                ))}
                {!preset && <SelectItem value="custom">Custom · {travelKmh} km/h</SelectItem>}
              </SelectContent>
            </Select>
          </div>
        </div>
        <div className="max-w-[12rem] space-y-1.5">
          <Label htmlFor="sc-kmh">Speed, km/h</Label>
          <Input
            id="sc-kmh"
            type="number"
            inputMode="decimal"
            min={0.1}
            step={0.5}
            value={travelKmh}
            onChange={(e) => {
              const n = Number(e.target.value);
              if (Number.isFinite(n) && n > 0) onTravelKmh(n);
            }}
            className="font-mono"
          />
        </div>

        {target &&
          (radiusKm ? (
            <Readout
              label={`To ${target.name}`}
              value={`${formatKm(km)} · ${compassPoint(initialBearingDeg(place.at, target.at))}`}
              note={`${(preset?.label ?? `AT ${travelKmh} KM/H`).toUpperCase()}: ${formatDuration(hours).toUpperCase()} WITHOUT STOPPING. ${
                hours > 24 * 30 ? "A JOURNEY MEASURED IN SEASONS." : hours > 24 * 3 ? "NEWS TRAVELS NO FASTER THAN THIS." : "CLOSE ENOUGH TO SHARE A MARKET."
              }`}
            />
          ) : (
            <div className="border border-sf-amber bg-sf-amber/[0.06] p-3">
              <p className="font-mono text-[12px] text-sf-amber-text">
                // RADIUS NOT ON FILE. DISTANCE CANNOT BE MEASURED.{" "}
                <Link to={setHref} className="underline underline-offset-2">
                  SET IT AT THE SOURCE.
                </Link>
              </p>
            </div>
          ))}
      </div>
    </div>
  );
}

export default PlaceReadouts;
