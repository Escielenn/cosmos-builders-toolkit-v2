// Ambient cosmic data sets for decorative UI elements
// All values are real-world measurements from Earth's reference frame

export interface TelemetryDatum {
  label: string;
  value: string;
}

export const VELOCITY_DATA: TelemetryDatum[] = [
  { label: "SURFACE ROTATION", value: "~0.36 km/s" },
  { label: "SOLAR ORBIT", value: "29.78 km/s" },
  { label: "GALACTIC TRANSIT", value: "~230 km/s" },
  { label: "LOCAL GROUP DRIFT", value: "~300 km/s" },
  { label: "CMB RELATIVE", value: "~627 km/s" },
];

export const COORDINATE_DATA: TelemetryDatum[] = [
  { label: "GALACTIC LONG", value: "0° (Sgr A*)" },
  { label: "GALACTIC LAT", value: "0° (disk plane)" },
  { label: "SOLAR RADIUS", value: "~26,000 ly" },
  { label: "DISK OFFSET", value: "~65 ly (N)" },
  { label: "LOCAL ARM", value: "Orion–Cygnus" },
];

export const DISTANCE_DATA: TelemetryDatum[] = [
  { label: "NEAREST STAR", value: "4.24 ly" },
  { label: "GALACTIC CENTER", value: "~26,000 ly" },
  { label: "ANDROMEDA", value: "2.537 Mly" },
  { label: "OBSERVABLE EDGE", value: "46.5 Gly" },
  { label: "HUBBLE HORIZON", value: "~14.4 Gpc" },
];

export const EPOCH_DATA: TelemetryDatum[] = [
  { label: "UNIVERSE AGE", value: "13.787 Gyr" },
  { label: "MILKY WAY", value: "~13.6 Gyr" },
  { label: "SOLAR SYSTEM", value: "4.571 Gyr" },
  { label: "LIFE ON EARTH", value: "~3.7 Gyr" },
  { label: "HOMO SAPIENS", value: "~300 kyr" },
];
