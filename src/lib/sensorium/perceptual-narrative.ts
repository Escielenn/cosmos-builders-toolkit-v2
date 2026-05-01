// ---------------------------------------------------------------------------
// Perceptual Narrative Generator, template-based "what it feels like"
// ---------------------------------------------------------------------------

import type { EnvironmentConfig } from "./types";
import { MODALITIES } from "./data";

const MODALITY_IDS = {
  uvVision: "uv-vision",
  visibleLight: "visible-light",
  infrared: "infrared-vision",
  thermalImaging: "thermal-imaging",
  echolocation: "active-echolocation",
  ultrasonicHearing: "ultrasonic-hearing",
  infrasonicHearing: "infrasonic-hearing",
  standardHearing: "standard-hearing",
  seismic: "seismic-vibration",
  electroreceptionPassive: "passive-electroreception",
  electroreceptionActive: "active-electroreception",
  airborneOlfaction: "airborne-olfaction",
  aquaticChemo: "aquatic-chemoreception",
  magnetoreception: "magnetoreception",
  polarizedLight: "polarized-light",
  temperatureSense: "temperature-sense",
  gravitational: "gravitational-sense",
} as const;

export function generatePerceptualNarrative(
  selectedModalities: string[],
  environment: EnvironmentConfig
): string {
  const has = (id: string) => selectedModalities.includes(id);
  const parts: string[] = [];

  // Opening, based on lighting
  if (environment.lighting.tidallyLocked) {
    parts.push("You stand at the terminator line, where perpetual twilight blurs the boundary between day and night.");
  } else if (has(MODALITY_IDS.infrared) && !has(MODALITY_IDS.visibleLight)) {
    parts.push("You wake in what others would call total darkness, but the world pulses with thermal signatures, every surface radiating its heat map in your perception.");
  } else if (has(MODALITY_IDS.visibleLight) && has(MODALITY_IDS.uvVision)) {
    parts.push("The world blazes with color beyond any human spectrum. Ultraviolet patterns shimmer across flower petals and skin, revealing hidden marks invisible to lesser eyes.");
  } else if (has(MODALITY_IDS.visibleLight)) {
    parts.push("Light floods in, painting the landscape in familiar hues, though the details your senses gather go far deeper than mere color.");
  } else {
    parts.push("The world reveals itself not through light, but through other channels entirely, a perception alien to any visual creature.");
  }

  // Sound layer
  if (has(MODALITY_IDS.echolocation)) {
    parts.push("Your echolocation paints the room in sharp acoustic geometry, walls, obstacles, and living bodies rendered as sonic reflections with millimeter precision.");
  } else if (has(MODALITY_IDS.ultrasonicHearing)) {
    parts.push("Ultrasonic frequencies hum at the edges of perception, revealing insect wingbeats and the stress fractures in nearby stone.");
  } else if (has(MODALITY_IDS.infrasonicHearing)) {
    parts.push("Deep infrasonic vibrations roll through your body, the planet's geological heartbeat, weather systems hundreds of kilometers away, the subsonic rumble of distant herds.");
  } else if (has(MODALITY_IDS.standardHearing) && has(MODALITY_IDS.seismic)) {
    parts.push("Sound arrives through both air and ground, a dual-channel awareness that makes sneaking up on you nearly impossible.");
  }

  // Chemical layer
  if (has(MODALITY_IDS.airborneOlfaction)) {
    parts.push("The air carries a library of chemical information, the metabolic signature of every creature downwind, the mineral composition of the soil, the approaching storm's ozone tang.");
  } else if (has(MODALITY_IDS.aquaticChemo)) {
    parts.push("The water is an ocean of dissolved information. Every current carries molecular messages, territory markers, distress signals, the chemical fingerprint of prey kilometers upstream.");
  }

  // Electromagnetic layer
  if (has(MODALITY_IDS.electroreceptionActive)) {
    parts.push("Your active electric field surrounds you like an invisible bubble, and anything that enters it, rock, water, flesh, distorts the field in ways you read like a map.");
  } else if (has(MODALITY_IDS.electroreceptionPassive)) {
    parts.push("The faint bioelectric fields of nearby organisms register like whispered presences, each heartbeat a tiny beacon in the electromagnetic dark.");
  }

  // Navigation layer
  if (has(MODALITY_IDS.magnetoreception)) {
    parts.push("Beneath it all, the planet's magnetic field is a constant compass, you always know which direction is north, how deep you are, where the poles lie.");
  }

  // Thermal layer
  if (has(MODALITY_IDS.thermalImaging) && has(MODALITY_IDS.temperatureSense)) {
    parts.push("Temperature is not a single sensation but a landscape, you see thermal gradients the way others see elevation changes, mapping warm-blooded life against cold stone.");
  }

  // Polarized light
  if (has(MODALITY_IDS.polarizedLight)) {
    parts.push("The sky itself carries information invisible to others, polarization patterns reveal the sun's position even through clouds, and reflective surfaces betray hidden textures.");
  }

  // Gravitational
  if (has(MODALITY_IDS.gravitational)) {
    parts.push("You sense the subtle pull of mass, large objects exert a gravitational presence you feel before you see, and changes in local gravity signal geological shifts below.");
  }

  // Closing, environment specific
  if (environment.medium.type === "aquatic") {
    parts.push("All of this arrives through water, a medium that carries information faster, denser, and more intimately than any atmosphere could.");
  } else if (environment.atmosphere.pressure > 3) {
    parts.push("The dense atmosphere compresses every signal, making the world feel close, immediate, pressing against your senses like a living thing.");
  }

  if (parts.length <= 1) {
    parts.push("The world is a mosaic of inputs, each sense layering its own truth onto reality. What you perceive is not the world, it is your species' unique interpretation of it.");
  }

  return parts.join(" ");
}
