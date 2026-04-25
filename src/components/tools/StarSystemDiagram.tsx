import { useMemo } from "react";
import OrbitalDiagram from "./OrbitalDiagram";
import { calcHZBoundaries, luminosityFromMass } from "@/lib/habitable-zone/calculations";
import { SPECTRAL_CLASS_NUMERIC_DEFAULTS } from "@/lib/star-system-data";
import { GlassPanel } from "@/components/ui/glass-panel";
import { Orbit, Info } from "lucide-react";

interface StarSystemDiagramProps {
  spectralClass: string;
  luminosityText: string;
  massText: string;
  configurationType?: string;
  bodies: Array<{
    name: string;
    distanceFromStar: string;
  }>;
}

export default function StarSystemDiagram({
  spectralClass,
  luminosityText,
  massText,
  configurationType,
  bodies,
}: StarSystemDiagramProps) {
  const computed = useMemo(() => {
    const defaults = SPECTRAL_CLASS_NUMERIC_DEFAULTS[spectralClass];
    if (!defaults) return null;

    // Derive luminosity: user entry → mass-derived → spectral default
    const parsedLuminosity = parseFloat(luminosityText);
    const parsedMass = parseFloat(massText);

    let luminosity: number;
    let mass: number;

    if (!isNaN(parsedLuminosity) && parsedLuminosity > 0) {
      luminosity = parsedLuminosity;
    } else if (!isNaN(parsedMass) && parsedMass > 0) {
      luminosity = luminosityFromMass(parsedMass);
    } else {
      luminosity = defaults.luminosity;
    }

    mass = (!isNaN(parsedMass) && parsedMass > 0) ? parsedMass : defaults.mass;

    // Skip HZ for neutron stars (luminosity=0)
    const hz = luminosity > 0 ? calcHZBoundaries(luminosity) : null;

    // Parse planet distances
    const planets = bodies
      .filter(b => {
        const d = parseFloat(b.distanceFromStar);
        return !isNaN(d) && d > 0;
      })
      .map(b => ({
        name: b.name || "Unnamed",
        distanceAU: parseFloat(b.distanceFromStar),
      }));

    return {
      spectralLetter: defaults.spectralLetter,
      mass,
      luminosity,
      hz,
      planets,
    };
  }, [spectralClass, luminosityText, massText, bodies]);

  const isMultiStar = configurationType && configurationType !== "single";

  // Placeholder when no spectral class selected
  if (!spectralClass || !computed) {
    return (
      <GlassPanel className="p-4 md:p-6">
        <h3 className="font-heading text-lg font-semibold mb-4 flex items-center gap-2">
          <Orbit className="w-5 h-5 text-primary" />
          System Diagram
        </h3>
        <div className="h-[300px] bg-[#0D0D0F] rounded-lg flex items-center justify-center">
          <p className="text-sm text-t3">
            Select a spectral class above to visualize your system
          </p>
        </div>
      </GlassPanel>
    );
  }

  const { spectralLetter, mass, hz, planets } = computed;
  // Use first planet as "active" planet, rest as knownPlanets
  const activePlanet = planets[0];
  const otherPlanets = planets.slice(1);

  return (
    <GlassPanel className="p-4 md:p-6">
      <h3 className="font-heading text-lg font-semibold mb-4 flex items-center gap-2">
        <Orbit className="w-5 h-5 text-primary" />
        System Diagram
      </h3>
      <OrbitalDiagram
        spectralType={spectralLetter}
        starMass={mass}
        innerRecentVenus={hz?.recentVenus ?? 0}
        innerRunaway={hz?.runawayGreenhouse ?? 0}
        outerMaxGreenhouse={hz?.maxGreenhouse ?? 0}
        outerEarlyMars={hz?.earlyMars ?? 0}
        snowline={hz?.snowline ?? 0}
        planetDistance={activePlanet?.distanceAU ?? 0}
        planetName={activePlanet?.name}
        knownPlanets={otherPlanets}
        highlightAllPlanets
        className="h-[350px] md:h-[450px]"
      />
      {/* Info strip */}
      <div className="mt-3 flex flex-wrap items-center gap-x-6 gap-y-1 text-xs text-t3">
        {hz && (
          <span className="font-mono">
            HZ: {hz.runawayGreenhouse.toFixed(3)}–{hz.maxGreenhouse.toFixed(3)} AU
          </span>
        )}
        {hz && (
          <span className="font-mono">
            Snowline: {hz.snowline.toFixed(2)} AU
          </span>
        )}
        {isMultiStar && (
          <span className="flex items-center gap-1">
            <Info className="w-3 h-3" />
            Diagram shows primary star only
          </span>
        )}
      </div>
    </GlassPanel>
  );
}
