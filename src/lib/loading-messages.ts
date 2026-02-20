/** Ship's Voice loading messages — contextual per route */
export const loadingMessages: Record<string, string[]> = {
  dashboard: [
    'COMPILING SURVEY DATA...',
    'RETRIEVING WORLD INDEX...',
    'LOADING INSTRUMENT MANIFEST...',
  ],
  tools: [
    'CALIBRATING INSTRUMENTS...',
    'LOADING PARAMETERS...',
  ],
  'tools/drake': [
    'LISTENING FOR SIGNALS...',
    'TUNING RECEIVER...',
    'SCANNING FREQUENCY RANGE...',
  ],
  'tools/genesis': [
    'RESOLVING ORBITAL PARAMETERS...',
    'COMPUTING ATMOSPHERIC MODEL...',
    'SCANNING STELLAR NEIGHBORHOOD...',
  ],
  'tools/gravitas': [
    'COMPUTING GRAVITATIONAL FIELD...',
    'RESOLVING SURFACE CONDITIONS...',
  ],
  'tools/phylo': [
    'SURVEYING BIOSPHERE...',
    'COMPILING MORPHOLOGICAL DATA...',
    'ANALYZING EVOLUTIONARY PRESSURES...',
  ],
  'tools/mythos': [
    'ACCESSING CULTURAL DATABASE...',
    'COMPILING MYTHOLOGICAL STRUCTURE...',
  ],
  'tools/vessel': [
    'INITIALIZING DRYDOCK...',
    'LOADING HULL SPECIFICATIONS...',
  ],
  'tools/chronos': [
    'SYNCHRONIZING REFERENCE FRAMES...',
    'COMPUTING LORENTZ FACTOR...',
  ],
  'tools/orrery': [
    'LOADING STELLAR CATALOG...',
    'COMPUTING ORBITAL MECHANICS...',
  ],
  'tools/kscale': [
    'ASSESSING ENERGY OUTPUT...',
    'COMPUTING KARDASHEV INDEX...',
  ],
  'tools/cascade': [
    'TRACING CASCADE PATHWAYS...',
    'COMPUTING DOWNSTREAM EFFECTS...',
  ],
  'tools/dominion': [
    'MAPPING POLITICAL TERRITORY...',
    'LOADING GOVERNANCE MODELS...',
  ],
  'tools/exodus': [
    'CHARTING EXPANSION VECTORS...',
    'COMPUTING TRANSIT WINDOWS...',
  ],
  'tools/sensorium': [
    'LOADING SENSORY BASELINES...',
    'COMPILING RECEPTOR DATA...',
  ],
  'tools/lexdrift': [
    'LOADING PHONEME INVENTORY...',
    'SIMULATING DRIFT PATTERNS...',
  ],
  'tools/habzone': [
    'COMPUTING STELLAR LUMINOSITY...',
    'RESOLVING HABITABLE BOUNDARIES...',
  ],
  'tools/prompts': [
    'RECEIVING TRANSMISSION...',
    'DECODING SIGNAL...',
  ],
  'tools/rogue': [
    'INITIALIZING N-BODY ENGINE...',
    'LOADING GRAVITATIONAL MODEL...',
  ],
  'tools/exosky': [
    'RENDERING ALIEN ATMOSPHERE...',
    'COMPUTING STELLAR POSITIONS...',
  ],
  'tools/tidelock': [
    'SYNCHRONIZING ROTATION...',
    'COMPUTING TERMINATOR LINE...',
  ],
  learn: [
    'RETRIEVING ARCHIVE ENTRY...',
    'LOADING TRANSMISSION...',
  ],
  account: [
    'LOADING PERSONNEL FILE...',
    'RETRIEVING CREDENTIALS...',
  ],
  default: [
    'INITIALIZING...',
    'RESOLVING...',
    'ESTABLISHING CONNECTION...',
  ],
};

/** Pick a random message from the appropriate route array */
export function getLoadingMessage(route: string): string {
  const messages = loadingMessages[route] || loadingMessages.default;
  return messages[Math.floor(Math.random() * messages.length)];
}
