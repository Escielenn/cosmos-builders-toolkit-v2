// GRAVITAS — Experiential text generation
// Translates gravity calculations into human-readable descriptions

import type { GravityContext, CalculationMode, CoriolisIntensity } from "./types";

// ─── Movement & Locomotion ──────────────────────────────────────────

export function generateMovementDescription(ctx: GravityContext): string {
  const { effective_g, source, spin_rpm, coriolis_intensity } = ctx;
  const parts: string[] = [];

  if (effective_g < 0.01) {
    parts.push("Movement requires handholds and push-offs. There is no 'down.' You orient by memory and painted arrows. Every motion imparts equal and opposite reaction—push off a wall and you drift until you hit something.");
  } else if (effective_g < 0.2) {
    parts.push("Each step launches you gently upward. Walking becomes a series of controlled bounces, and newcomers instinctively grab for handholds that aren't there. Running is dangerous—a misstep sends you tumbling in slow arcs toward the ceiling.");
  } else if (effective_g < 0.5) {
    parts.push("Movement feels dreamlike—your legs expect resistance that isn't there. You learn to plant your feet deliberately rather than swinging them. Dropped objects fall with eerie slowness, giving you time to catch them. Old-timers can spot newcomers by how often they overcorrect and stumble.");
  } else if (effective_g < 0.9) {
    parts.push("Gravity feels noticeably lighter, but movement remains intuitive. Stairs are easier, luggage feels manageable, and elderly residents move with renewed vigor. Athletes achieve extraordinary feats—basketball becomes vertical, dancers achieve impossible hang time.");
  } else if (effective_g < 1.1) {
    parts.push("Gravity feels completely natural. Without instrumentation, you couldn't distinguish this from Earth. Your body operates within its evolved parameters, and movement is instinctive.");
  } else if (effective_g < 1.5) {
    parts.push("Your body feels heavier than usual. Sustained activity is tiring, and you're aware of your own mass in a way that feels intrusive. Climbing stairs leaves you winded. Your joints ache after a full day.");
  } else if (effective_g < 2.5) {
    parts.push("Every movement is labored. Your organs feel the pull. Sitting down is a relief; standing up is an effort of will. Long-term residents develop powerful legs and compressed spines. Falls are dangerous—the ground arrives faster and harder.");
  } else {
    parts.push("Movement is an ordeal. Breathing requires conscious effort as your chest fights the weight. Only the strongest and most adapted can function for extended periods. Most activities are performed lying down or in supportive harnesses.");
  }

  // Coriolis addendum for spin habitats
  if (source === "spin" && spin_rpm && spin_rpm > 0.5) {
    if (coriolis_intensity === "mild") {
      parts.push("Moving quickly—running to catch a tram, or tossing an object to a colleague—you notice subtle curves in trajectories that your brain slowly learns to compensate for.");
    } else if (coriolis_intensity === "moderate") {
      parts.push("The Coriolis effect is unmistakable. Thrown objects curve noticeably, and newcomers report persistent mild vertigo for their first few weeks. Sports have been redesigned for local physics.");
    } else if (coriolis_intensity === "strong") {
      parts.push("Moving prograde or retrograde feels distinctly different—one direction makes you lighter, the other heavier. Ball games have been abandoned or completely redesigned. Children born here move naturally; adults never fully adapt.");
    } else if (coriolis_intensity === "severe") {
      parts.push("The rotation is disorienting for all but the most adapted. Head movements trigger nausea. Walking requires deliberate, measured steps. Children born here move naturally; immigrants take months to stop being nauseated.");
    }
  }

  return parts.join(" ");
}

// ─── Fluid Behavior ─────────────────────────────────────────────────

export function generateFluidDescription(effective_g: number): string {
  if (effective_g < 0.01) {
    return "Liquids form spherical blobs that drift lazily. Spilled drinks don't spill—they hover as wobbling orbs you can chase through the air. Bleeding wounds don't pool; blood emerges as floating globules. Fire, if it exists at all, is spherical and short-lived, starving itself of convective oxygen flow.";
  } else if (effective_g < 0.2) {
    return "Liquids fall in slow motion, forming elongated teardrops. Spilled drinks take seconds to reach the floor, spreading into wide, thin puddles. Blood flows but pools slowly. Candle flames stand tall and thin, barely flickering, burning with a ghostly blue stillness.";
  } else if (effective_g < 0.5) {
    return "Pouring drinks requires attention—the liquid arcs more than expected, and you learn to tilt the glass less. Spills spread slowly in lazy pools. Fire burns taller and thinner than you're used to, with languid, mesmerizing flames.";
  } else if (effective_g < 0.9) {
    return "Fluids behave almost normally, with slightly exaggerated arcs when poured. Candle flames are a bit taller, rain (in enclosed habitats) falls noticeably slower. You'd barely notice the difference in daily life.";
  } else if (effective_g < 1.1) {
    return "Fluids behave exactly as you'd expect from a lifetime on Earth. Water pours, pools, and evaporates at familiar rates.";
  } else if (effective_g < 1.5) {
    return "Liquids pour fast and relatively straight. Spills spread quickly and thin. Blood flows rapidly from wounds. Flames are compressed, burning hotter and shorter—candles gutter more easily.";
  } else {
    return "Liquids pour in nearly straight lines, splashing hard. Even small spills spread instantly into thin films. Flames are squat and intense, burning hot and close to their fuel. Rain—if present—hits like gravel.";
  }
}

// ─── Health Projections ─────────────────────────────────────────────

export function generateHealthProjection(effective_g: number, duration_months: number): string {
  if (effective_g < 0.01) {
    const bone_loss = Math.min(duration_months * 1.5, 40);
    return `Prolonged microgravity exposure of ${duration_months} months projects approximately ${bone_loss.toFixed(0)}% bone density loss, significant muscle atrophy (particularly in the legs and lower back), cardiovascular deconditioning, and elevated intracranial pressure potentially leading to vision changes. Countermeasures—resistance exercise, centrifuge sessions—are essential. Return to 1g will require extended rehabilitation.`;
  } else if (effective_g < 0.17) {
    return `Limited data exists for prolonged exposure at ${effective_g.toFixed(2)}g. Extrapolating from lunar and microgravity studies: expect reduced but non-trivial bone loss, moderate muscle atrophy, and cardiovascular adaptation. The threshold for sustainable habitation in this range is unknown. Recommend aggressive exercise protocols and periodic centrifuge time.`;
  } else if (effective_g < 0.5) {
    return `Mars-like gravity (${effective_g.toFixed(2)}g) may be sustainable long-term, though multigenerational data doesn't exist. Expect mild bone density reduction addressable through regular exercise. Cardiovascular adaptation is likely manageable. Children raised here may develop different baseline bone density and muscle mass—not necessarily pathological, but distinctly non-terrestrial.`;
  } else if (effective_g < 0.9) {
    return `Reduced gravity in the ${effective_g.toFixed(2)}g range appears sustainable indefinitely with minor lifestyle adjustments. Slightly reduced bone density is expected but not debilitating. Regular exercise is recommended but not mandatory for survival. Quality of life may actually improve for aging populations.`;
  } else if (effective_g < 1.1) {
    return `Earth-normal gravity. No physiological adaptation required. Baseline human health parameters apply. This is the environment the human body evolved for.`;
  } else if (effective_g < 1.5) {
    return `Elevated gravity at ${effective_g.toFixed(2)}g causes increased cardiovascular load. Over ${duration_months} months, expect cardiac muscle hypertrophy (potentially beneficial up to a point), increased bone density, and joint wear. Extended exposure over years may lead to shortened stature in developing children, compressed spinal discs, and accelerated aging of load-bearing joints. Regular rest periods in reduced gravity are recommended.`;
  } else {
    return `Gravity above 1.5g at ${effective_g.toFixed(2)}g is physiologically stressful. Over ${duration_months} months, anticipate significant cardiac strain, potential stress fractures in weight-bearing bones, respiratory compromise under sustained load, and rapid fatigue in all physical activities. Only recommended for short durations or populations specifically adapted (biologically or technologically) for high-gravity environments.`;
  }
}

// ─── Architectural Requirements ─────────────────────────────────────

export function generateArchitectureNotes(
  effective_g: number,
  source: CalculationMode,
  tilt_angle_deg?: number
): string {
  const notes: string[] = [];

  if (effective_g < 0.01) {
    notes.push("No floors or ceilings—all surfaces are potential movement paths. Handholds every meter. Velcro or magnetic attachment points for all objects. Sleep restraints required. Water and waste systems must be fully enclosed. Kitchens use squeeze bottles and sealed preparation areas.");
  } else if (effective_g < 0.2) {
    notes.push("Low walls sufficient for room division. Extra ceiling height recommended (4m+) to accommodate jumping. All furniture must be anchored or weighted. Ramps preferred over stairs. Consider passive safety netting at ceiling level. Doorways should be tall.");
  } else if (effective_g < 0.5) {
    notes.push("Standard architecture with modifications: higher ceilings (3m+), shallower stairs (20–25°), lightweight furniture with optional anchoring, generous landing zones near stairs and transitions. Consider that children will jump much higher than expected.");
  } else if (effective_g < 0.9) {
    notes.push("Near-standard architecture. Stairs can be slightly steeper (25–30°). Normal furniture acceptable. Minor weight savings possible in structural materials. Ceiling height can be standard (2.4m) though 2.7m feels more comfortable.");
  } else if (effective_g < 1.1) {
    notes.push("Standard Earth architecture applies. No gravity-specific modifications required.");
  } else if (effective_g < 1.5) {
    notes.push("Reinforced furniture recommended. Lower-profile designs preferred—less distance to fall. Chairs with armrests to aid standing. Consider elevator alternatives to stairs for frequent use. Beds should be firm to support the increased load.");
  } else {
    notes.push("Heavily reinforced construction throughout. Beds must be firm and supportive. All seating must handle increased weight. Stairs are exhausting—ramps or lifts essential. Emergency rest areas on long corridors. Consider recumbent workstations.");
  }

  // Tilt-specific notes for combined gravity
  if (tilt_angle_deg !== undefined && tilt_angle_deg > 5) {
    if (tilt_angle_deg < 15) {
      notes.push("The apparent floor slope is noticeable. Position furniture to account for the lean. Weighted bases for freestanding items. Drinks require lipped containers.");
    } else if (tilt_angle_deg < 30) {
      notes.push("Gimbaled furniture recommended. Floor surfaces should provide grip. Handrails along all corridors. Shelving requires retention lips. Workers face uphill by habit.");
    } else if (tilt_angle_deg < 45) {
      notes.push("Entire deck sections should gimbal to compensate. Alternatively, design spaces to function at multiple orientations. Safety harnesses recommended during thrust phases.");
    } else {
      notes.push("This habitat requires dual-orientation architecture. What's a wall during spin becomes a floor during thrust. All furniture must secure against either surface. Residents learn to live in two different spatial orientations.");
    }
  }

  return notes.join(" ");
}

// ─── Mythological Implications ──────────────────────────────────────

export function generateMythologicalSeeds(
  effective_g: number,
  source: CalculationMode,
  spin_rpm?: number
): string {
  const seeds: string[] = [];

  // G-level themes
  if (effective_g < 0.01) {
    seeds.push("In the absence of weight, stillness becomes sacred. Creation myths speak not of descent from heaven but of emergence from the still center. The ancestors drifted in the void-womb until the Builders gave them the gift of pull—or the curse of it, depending on which sect you ask. The concept of 'falling' is purely metaphorical—a moral descent, not a physical one.");
  } else if (effective_g < 0.3) {
    seeds.push("Where bodies can soar, transcendence is literal before it's spiritual. Flight-myths dominate the cultural consciousness. The ground is optional, and social hierarchies may be vertical—the powerful rise, the diminished sink. Dance becomes three-dimensional, and the most sacred rituals involve sustained suspension.");
  } else if (effective_g < 0.5) {
    seeds.push("Gravity exists but doesn't crush. This liminal state invites myths of transition—a people between worlds, neither fully bound nor fully free. Jumping becomes ritual; sustained flight a spiritual discipline. Heroes are those who leap highest, who defy the pull most gracefully.");
  } else if (effective_g < 0.9) {
    seeds.push("Near-Earth gravity produces familiar mythological structures—falls from grace, weight of responsibility, groundedness as virtue. But subtle differences invite local flavor: slightly easier ascents, gentler falls. The mythology may emphasize liberation, lightness as divine gift.");
  } else if (effective_g < 1.1) {
    seeds.push("Earth-standard gravity carries Earth-standard mythological weight. This may be intentional—a designed environment that replicates ancestral conditions. The mythology of the Builders may emphasize restoration, return to origin, fidelity to the homeworld's conditions.");
  } else if (effective_g < 1.5) {
    seeds.push("Heavier gravity presses bodies downward. Myths valorize endurance, frame rising as heroic struggle, associate depth with power. The sky becomes distant, unreachable—aspirational rather than achievable. Gods may live below, in the dense core, in the pull that shapes all meaning.");
  } else {
    seeds.push("Extreme gravity shapes a mythology of pressure and density. Compression is virtue. The Crushed Ones do not reach upward; their temples are pits, their dead returned to depth. Rising is weakness, dispersal, death. Beauty is found in density, compactness, endurance under load.");
  }

  // Source-specific additions
  if (source === "spin") {
    seeds.push("The Turning is cosmologically central. Spinward and antispinward carry directional meaning—one is futureward, the other pastward. Walking against the spin may be taboo or sacred. The axis of rotation is the world-axis, the still point around which all meaning revolves.");
    if (spin_rpm && spin_rpm > 2) {
      seeds.push("The Coriolis effect is felt in the body. Curved trajectories become metaphor—nothing travels straight, all paths bend, intentions twist toward unexpected destinations. This may produce fatalistic or labyrinthine mythologies.");
    }
  } else if (source === "thrust") {
    seeds.push("Journey defines existence. The engines are the heart of the world; their thrust is the pulse of being. Arrival is eschatology—the promised destination for which all hardship is endured. The Flip, if present, marks a death-and-rebirth transition halfway through every crossing.");
  } else if (source === "combined") {
    seeds.push("The angle of the world shifts with the journey's phase. Priests or navigators read omens in the current tilt. A ship's cant becomes part of its identity, and traditions diverge between steep-deckers and level-hulls. When thrust ends and spin alone remains, the world 'levels'—a moment of collective relief and ritual.");
  } else if (source === "orbital") {
    seeds.push("Hanging in the void, the parent body dominates the sky. Myths center on the great sphere below—origin world, prison, paradise lost, or ever-watching eye. Orbit is purgatory, the space between departure and arrival. Eclipses carry enormous symbolic weight.");
  } else if (source === "artificial") {
    seeds.push("Gravity exists by technological fiat. This may be invisible to inhabitants, or the central mystery of their existence—the priests tend the gravity-engines, and the loss of weight is apocalypse. Alternatively: the artificiality is known, and mythology grapples with living in a made world, where even the ground beneath your feet is someone's decision.");
  }

  return seeds.join("\n\n");
}

// ─── Narrative Snippet ──────────────────────────────────────────────

export function generateNarrativeSnippet(ctx: GravityContext): string {
  const { effective_g, source, spin_rpm, tilt_angle_deg, coriolis_intensity } = ctx;

  // Spin-specific narratives
  if (source === "spin") {
    if (effective_g < 0.5) {
      return `Walking feels like moving through a pleasant dream—each step carries you slightly farther than expected, and you learn to plant your feet deliberately rather than swinging them. Dropped objects fall with eerie slowness, giving you time to catch them. Spilled drinks form lazy parabolas. Old-timers can spot newcomers by how often they overcorrect and stumble. Looking up, you can see the far side of the habitat curving overhead, houses and parks hanging above you like a ceiling painted by someone who confused up and down.`;
    }
    if (coriolis_intensity === "moderate" || coriolis_intensity === "strong") {
      return `You throw the ball to your daughter and watch it curve—always curving, always toward spinward. She's learned to compensate, born here, part of the first generation that doesn't think of it as wrong. To her, straight lines are the aberration, something from old Earth vids that looks unnatural. "Why doesn't it bend?" she asked once, watching footage of a baseball game. You didn't have an answer that didn't make you homesick.`;
    }
    return `The hab feels normal until you look up. Then the vertigo hits—not down-vertigo, but around-vertigo, the realization that the horizon doesn't end but curves upward on both sides until it meets itself overhead. Your brain insists you should be falling. Your feet insist you're standing. After a week, the argument resolves itself, and the curve of the world just becomes... the world.`;
  }

  // Thrust-specific
  if (source === "thrust") {
    if (effective_g >= 0.9 && effective_g <= 1.1) {
      return `Under thrust, the ship has weight. Decks are floors, ceilings are ceilings, and you almost forget you're in space until the engines cut and the silence hits like a physical thing. During coast phase—if there is one—everything floats, and the crew moves like ghosts, pulling themselves hand-over-hand through corridors that were hallways an hour ago. Then the accel horn sounds, and gravity returns like a friend who overstays their welcome.`;
    }
    if (effective_g < 0.3) {
      return `The thrust is gentle, barely there—a suggestion of down rather than a demand. Your coffee drifts toward the floor at a leisurely pace if you release the cup, giving you time to catch it. In the corridors, people walk with a bouncing, ballet-like gait that looks absurd on camera but feels perfectly natural after a few days. The real strangeness is psychological: knowing that this faint pull is all that separates you from the void.`;
    }
    return `At ${effective_g.toFixed(1)}g, everything is heavier. Your body, your pack, your thoughts. The crew moves with deliberate economy—no wasted steps, no unnecessary standing. Bunks are popular even during waking hours. Someone taped a sign to the gym door: "Gravity Is Not Your Friend." Nobody laughs at it anymore.`;
  }

  // Combined vector
  if (source === "combined" && tilt_angle_deg && tilt_angle_deg > 10) {
    return `The floor slopes toward the stern during burns, and you walk like you're perpetually hiking a steep hill. Chairs have been bolted at compensating angles, and everyone learns to set their drinks in gimbal-mounted holders. During coast phase, the ship levels out and the hab ring's spin takes over—and then the accel horn sounds, and everything tilts again. New crew call it disorienting. Lifers call it Tuesday.`;
  }

  // Orbital
  if (source === "orbital" && effective_g < 0.01) {
    return `Through the viewport, the planet fills half the sky—a wall of cloud and color so vast it doesn't register as spherical. You float, tethered to your workstation by a single elastic cord, and the silence is total except for the hum of recyclers. When you push off toward the mess module, you drift through a shaft of sunlight that's been coming through the same window for the last ninety minutes of your orbit.`;
  }

  // Generic fallback based on g-level
  if (effective_g < 0.01) {
    return `In the absence of weight, the body forgets its assumptions. Reaching for a dropped tool, your hand arrives too fast; the tool hasn't dropped at all but hovers where you released it, indifferent to your expectations. Everything you know about physical space was taught to you by gravity, and gravity has left the conversation.`;
  }
  if (effective_g < 0.5) {
    return `The world here is lighter. Not just your body—everything. Expectations, habits, instincts calibrated to a heavier world that exists now only in memory and muscle. Children born here will never understand what it meant to feel the full pull of Earth, and they will look at you strangely when you flinch at a fall that couldn't possibly hurt.`;
  }
  if (effective_g > 1.5) {
    return `You sit because standing is work. You breathe because your chest remembers how, but it resents the effort. Everything has weight here—not just objects but intentions, ambitions, the simple act of rising from a chair. The locals move with a heavy grace that looks effortless and isn't. They were born to this. You were not.`;
  }
  return `Gravity here is close to what you remember—close enough that your body doesn't complain, different enough that you notice in quiet moments. A dropped pen falls a beat too slow. Your morning stretch reaches a fraction higher. It's the kind of difference that writers call 'uncanny'—familiar enough to trust, strange enough to never quite forget.`;
}

// ─── Movement Table (structured data) ───────────────────────────────

export interface MovementTableRow {
  gLevel: string;
  walking: string;
  running: string;
  jumping: string;
}

export function getMovementTable(effective_g: number): MovementTableRow {
  if (effective_g < 0.01) {
    return { gLevel: "~0g", walking: "Impossible (drift)", running: "Impossible", jumping: "Launches indefinitely" };
  } else if (effective_g < 0.2) {
    return { gLevel: `${effective_g.toFixed(2)}g`, walking: "Bounding gait", running: "Dangerous (loss of traction)", jumping: `~${(1 / effective_g).toFixed(0)}× Earth height` };
  } else if (effective_g < 0.5) {
    return { gLevel: `${effective_g.toFixed(2)}g`, walking: "Adjusted stride", running: "Possible, unfamiliar", jumping: `~${(1 / effective_g).toFixed(1)}× Earth height` };
  } else if (effective_g < 0.9) {
    return { gLevel: `${effective_g.toFixed(2)}g`, walking: "Near-normal", running: "Normal with extra lift", jumping: `~${(1 / effective_g).toFixed(1)}× Earth height` };
  } else if (effective_g < 1.1) {
    return { gLevel: `${effective_g.toFixed(2)}g`, walking: "Normal", running: "Normal", jumping: "Normal" };
  } else if (effective_g < 1.5) {
    return { gLevel: `${effective_g.toFixed(2)}g`, walking: "Labored", running: "Exhausting", jumping: `~${(1 / effective_g).toFixed(2)}× Earth height` };
  } else {
    return { gLevel: `${effective_g.toFixed(2)}g`, walking: "Requires training", running: "Only for emergencies", jumping: "Dangerous" };
  }
}

// ─── Fluid Behavior Table ───────────────────────────────────────────

export interface FluidTableRow {
  gLevel: string;
  pouringLiquids: string;
  bleeding: string;
  fireBehavior: string;
}

export function getFluidTable(effective_g: number): FluidTableRow {
  if (effective_g < 0.01) {
    return { gLevel: "~0g", pouringLiquids: "Spherical blobs", bleeding: "Pools don't form", fireBehavior: "Spherical, smothers self" };
  } else if (effective_g < 0.1) {
    return { gLevel: `${effective_g.toFixed(2)}g`, pouringLiquids: "Very slow streams", bleeding: "Slow pooling", fireBehavior: "Dome-shaped, weak" };
  } else if (effective_g < 0.5) {
    return { gLevel: `${effective_g.toFixed(2)}g`, pouringLiquids: "Slow arcs", bleeding: "Reduced flow", fireBehavior: "Tall, flickering" };
  } else if (effective_g < 1.1) {
    return { gLevel: `${effective_g.toFixed(2)}g`, pouringLiquids: "Normal arcs", bleeding: "Normal flow", fireBehavior: "Normal" };
  } else {
    return { gLevel: `${effective_g.toFixed(2)}g`, pouringLiquids: "Fast, straight", bleeding: "Rapid pooling", fireBehavior: "Compressed, intense" };
  }
}
