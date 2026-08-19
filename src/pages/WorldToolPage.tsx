import { lazy, Suspense } from "react";
import { useParams, useSearchParams, Navigate } from "react-router-dom";
import { Loader } from "@/components/ui/loader";
import { useWorldLayoutContext } from "@/contexts/WorldLayoutContext";

// Lazy-loaded tool components (same as App.tsx)
const EnvironmentalChainReaction = lazy(() => import("./tools/EnvironmentalChainReaction"));
const PropulsionConsequencesMap = lazy(() => import("./tools/PropulsionConsequencesMap"));
const SpacecraftDesigner = lazy(() => import("./tools/SpacecraftDesigner"));
const PlanetaryProfile = lazy(() => import("./tools/PlanetaryProfile"));
const DrakeEquationCalculator = lazy(() => import("./tools/DrakeEquationCalculator"));
const XenomythologyFrameworkBuilder = lazy(() => import("./tools/XenomythologyFrameworkBuilder"));
const EvolutionaryBiology = lazy(() => import("./tools/EvolutionaryBiology"));
const StarSystemBuilder = lazy(() => import("./tools/StarSystemBuilder"));
const EmpireDesigner = lazy(() => import("./tools/EmpireDesigner"));
const TechnologyConsequences = lazy(() => import("./tools/TechnologyConsequences"));
const SpeciesInteractionMatrix = lazy(() => import("./tools/SpeciesInteractionMatrix"));
const OneBigLie = lazy(() => import("./tools/OneBigLie"));
const TimeDilationCalculator = lazy(() => import("./tools/TimeDilationCalculator"));
const SpaceExpansionModeler = lazy(() => import("./tools/SpaceExpansionModeler"));
const HabitableZoneCalculator = lazy(() => import("./tools/HabitableZoneCalculator"));
const LexDrift = lazy(() => import("./tools/LexDrift"));
const SurfaceGravityCalculator = lazy(() => import("./tools/SurfaceGravityCalculator"));
const TimelineTool = lazy(() => import("./tools/Timeline"));
const Sensorium = lazy(() => import("./tools/Sensorium"));
const Gravitas = lazy(() => import("./tools/Gravitas"));
const KardashevScale = lazy(() => import("./tools/KardashevScale"));

// Map tool slugs to their lazy components
const TOOL_COMPONENTS: Record<string, React.LazyExoticComponent<React.ComponentType>> = {
  "environmental-chain-reaction": EnvironmentalChainReaction,
  "propulsion-consequences-map": PropulsionConsequencesMap,
  "spacecraft-designer": SpacecraftDesigner,
  "planetary-profile": PlanetaryProfile,
  "drake-equation-calculator": DrakeEquationCalculator,
  "xenomythology-framework-builder": XenomythologyFrameworkBuilder,
  "evolutionary-biology": EvolutionaryBiology,
  "star-system-builder": StarSystemBuilder,
  "empire-designer": EmpireDesigner,
  "technology-consequences": TechnologyConsequences,
  "species-interaction-matrix": SpeciesInteractionMatrix,
  "one-big-lie": OneBigLie,
  "time-dilation": TimeDilationCalculator,
  "space-expansion-modeler": SpaceExpansionModeler,
  "habitable-zone-calculator": HabitableZoneCalculator,
  "lexdrift": LexDrift,
  "surface-gravity-calculator": SurfaceGravityCalculator,
  "timeline": TimelineTool,
  "sensorium": Sensorium,
  "gravitas": Gravitas,
  "kardashev-scale": KardashevScale,
};

/**
 * Router component for /worlds/:worldId/tools/:toolName
 * Resolves the tool component and injects worldId into search params
 * so existing tool pages can read it via useSearchParams().
 */
const WorldToolPage = () => {
  const { toolName } = useParams<{ toolName: string }>();
  const context = useWorldLayoutContext();
  const [searchParams] = useSearchParams();

  if (!toolName || !TOOL_COMPONENTS[toolName]) {
    return <Navigate to={context ? `/worlds/${context.worldId}` : "/"} replace />;
  }

  const ToolComponent = TOOL_COMPONENTS[toolName];

  // Tool pages read worldId from searchParams. Since we're inside WorldLayout,
  // the worldId is available via context. Tool pages will use useWorldId() hook
  // to resolve it. No need to inject into searchParams, the hook handles both.

  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center h-64">
          <Loader size="sm" />
        </div>
      }
    >
      <ToolComponent />
    </Suspense>
  );
};

export default WorldToolPage;
