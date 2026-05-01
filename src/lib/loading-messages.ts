/** Ship's Voice loading messages, contextual per route. */

const loadingMessages: Record<string, string[]> = {
  dashboard: [
    "COMPILING SURVEY DATA...",
    "RETRIEVING WORLD INDEX...",
    "LOADING INSTRUMENT MANIFEST...",
  ],
  tools: [
    "CALIBRATING INSTRUMENTS...",
    "LOADING PARAMETERS...",
  ],
  "tools/drake-equation-calculator": [
    "LISTENING FOR SIGNALS...",
    "TUNING RECEIVER...",
    "SCANNING FREQUENCY RANGE...",
  ],
  "tools/planetary-profile": [
    "RESOLVING ORBITAL PARAMETERS...",
    "COMPUTING ATMOSPHERIC MODEL...",
    "SCANNING STELLAR NEIGHBORHOOD...",
  ],
  "tools/gravitas": [
    "COMPUTING GRAVITATIONAL FIELD...",
    "RESOLVING SURFACE CONDITIONS...",
  ],
  "tools/kardashev-scale": [
    "CALIBRATING ENERGY SENSORS...",
    "SCANNING CIVILIZATIONAL OUTPUT...",
  ],
  "tools/evolutionary-biology": [
    "SURVEYING BIOSPHERE...",
    "COMPILING MORPHOLOGICAL DATA...",
    "ANALYZING EVOLUTIONARY PRESSURES...",
  ],
  "tools/xenomythology-framework-builder": [
    "ACCESSING CULTURAL DATABASE...",
    "COMPILING MYTHOLOGICAL STRUCTURE...",
  ],
  "tools/spacecraft-designer": [
    "INITIALIZING DRYDOCK...",
    "LOADING HULL SPECIFICATIONS...",
  ],
  "tools/time-dilation": [
    "SYNCHRONIZING REFERENCE FRAMES...",
    "COMPUTING LORENTZ FACTOR...",
  ],
  "tools/star-system-builder": [
    "LOADING STELLAR CATALOG...",
    "COMPUTING ORBITAL MECHANICS...",
  ],
  "tools/space-expansion-modeler": [
    "ASSESSING ENERGY OUTPUT...",
    "COMPUTING KARDASHEV INDEX...",
  ],
  "tools/environmental-chain-reaction": [
    "TRACING CASCADE PATHWAYS...",
    "COMPUTING DOWNSTREAM EFFECTS...",
  ],
  "tools/empire-designer": [
    "MAPPING POLITICAL TERRITORY...",
    "LOADING GOVERNANCE MODELS...",
  ],
  "tools/sensorium": [
    "LOADING SENSORY BASELINES...",
    "COMPILING RECEPTOR DATA...",
  ],
  "tools/lexdrift": [
    "LOADING PHONEME INVENTORY...",
    "SIMULATING DRIFT PATTERNS...",
  ],
  "tools/habitable-zone-calculator": [
    "COMPUTING STELLAR LUMINOSITY...",
    "RESOLVING HABITABLE BOUNDARIES...",
  ],
  "tools/propulsion-consequences-map": [
    "COMPUTING EXHAUST VELOCITY...",
    "TRACING IMPULSE CONSEQUENCES...",
  ],
  "tools/one-big-lie": [
    "SCANNING FOR DEVIATIONS...",
    "TESTING AXIOM COHERENCE...",
  ],
  "tools/technology-consequences": [
    "MODELING PARADIGM SHIFT...",
    "COMPUTING DISRUPTION INDEX...",
  ],
  "tools/species-interaction-matrix": [
    "MAPPING ECOLOGICAL NICHES...",
    "COMPUTING INTERACTION MATRIX...",
  ],
  "tools/surface-gravity-calculator": [
    "CALIBRATING GRAVIMETER...",
    "RESOLVING SURFACE CONDITIONS...",
  ],
  "tools/timeline": [
    "SYNCHRONIZING CHRONOLOG...",
    "LOADING EPOCH DATA...",
  ],
  rogue: [
    "INITIALIZING N-BODY ENGINE...",
    "LOADING GRAVITATIONAL MODEL...",
  ],
  "tools/solaris": [
    "COMPUTING STELLAR ORBITS...",
    "RESOLVING HABITABLE ZONE BOUNDARIES...",
    "INITIALIZING N-BODY INTEGRATOR...",
  ],
  "tools/exosky": [
    "RENDERING ALIEN ATMOSPHERE...",
    "COMPUTING STELLAR POSITIONS...",
  ],
  "tools/tidelock": [
    "SYNCHRONIZING ROTATION...",
    "COMPUTING TERMINATOR LINE...",
  ],
  "stellar-cartographer": [
    "CHARTING STELLAR NEIGHBORHOOD...",
    "RESOLVING CATALOG POSITIONS...",
  ],
  guide: [
    "LOADING GUIDE INDEX...",
    "COMPILING REFERENCE SYSTEMS...",
  ],
  "guide/field-manual": [
    "LOADING FIELD MANUAL...",
    "RETRIEVING OPERATIONAL REFERENCE...",
  ],
  "guide/tools": [
    "LOADING INSTRUMENT CATALOG...",
    "INDEXING TOOL REGISTRY...",
    "COMPILING WIKI ENTRIES...",
  ],
  "getting-started": [
    "PREPARING ORIENTATION...",
    "LOADING CASCADE TUTORIAL...",
    "CHARTING YOUR FIRST COURSE...",
  ],
  learn: [
    "RETRIEVING ARCHIVE ENTRY...",
    "LOADING TRANSMISSION...",
  ],
  profile: [
    "LOADING PERSONNEL FILE...",
    "RETRIEVING CREDENTIALS...",
  ],
  worlds: [
    "COMPILING SURVEY DATA...",
    "RETRIEVING WORLD INDEX...",
  ],
  pricing: [
    "LOADING RATE SCHEDULE...",
    "RETRIEVING SUBSCRIPTION DATA...",
  ],
  roadmap: [
    "LOADING DEVELOPMENT MANIFEST...",
    "RETRIEVING VOTE TALLIES...",
    "SCANNING UPCOMING INSTRUMENTS...",
  ],
  workshop: [
    "LOADING WRITING PROMPTS...",
    "PREPARING COMPOSITION SURFACE...",
    "RETRIEVING JOURNAL ENTRIES...",
  ],
  courses: [
    "LOADING CURRICULUM...",
    "RETRIEVING COURSE CATALOG...",
  ],
  default: [
    "INITIALIZING...",
    "RESOLVING...",
    "ESTABLISHING CONNECTION...",
  ],
};

/** Pick a random message from the route-matched array. */
export function getLoadingMessage(pathname?: string): string {
  if (!pathname) {
    const msgs = loadingMessages.default;
    return msgs[Math.floor(Math.random() * msgs.length)];
  }

  // Strip leading slash
  const path = pathname.replace(/^\//, "");

  // Exact match first
  if (loadingMessages[path]) {
    const msgs = loadingMessages[path];
    return msgs[Math.floor(Math.random() * msgs.length)];
  }

  // Try parent path (e.g. "tools/drake-equation-calculator" → "tools")
  const parent = path.split("/")[0];
  if (loadingMessages[parent]) {
    const msgs = loadingMessages[parent];
    return msgs[Math.floor(Math.random() * msgs.length)];
  }

  const msgs = loadingMessages.default;
  return msgs[Math.floor(Math.random() * msgs.length)];
}
