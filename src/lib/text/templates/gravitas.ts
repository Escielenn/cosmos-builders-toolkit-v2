// GRAVITAS, Text/Markdown export template

import type { GravitasFormState, GravityContext } from "@/lib/gravitas/types";
import {
  calculateSpinGravity,
  calculateThrustGravity,
  calculateCombinedVector,
  calculateOrbitalGravity,
  calculateArtificialGravity,
  getEffectiveG,
  getGravityLabel,
  formatG,
  formatDuration,
  formatPeriod,
} from "@/lib/gravitas/calculations";
import {
  generateMovementDescription,
  generateFluidDescription,
  generateHealthProjection,
  generateArchitectureNotes,
  generateMythologicalSeeds,
  generateNarrativeSnippet,
} from "@/lib/gravitas/experiential";
import { MODE_LABELS, REALISM_LABELS } from "@/lib/gravitas/data";

export function generateGravitasText(formState: GravitasFormState): string {
  const data = formState;
  const spin = calculateSpinGravity(data.spin);
  const thrust = calculateThrustGravity(data.thrust);
  const combined = calculateCombinedVector(data.combined);
  const orbital = calculateOrbitalGravity(data.orbital);
  const artificial = calculateArtificialGravity(data.artificial);
  const results = { spin, thrust, combined, orbital, artificial };
  const effectiveG = getEffectiveG(data, results);
  const label = getGravityLabel(effectiveG);
  const mode = data.activeMode;

  const ctx: GravityContext = {
    effective_g: effectiveG,
    source: mode,
    spin_rpm: mode === "spin" ? data.spin.rotation_rpm : undefined,
    tilt_angle_deg: mode === "combined" ? combined.tilt_angle_deg : undefined,
    coriolis_intensity: mode === "spin" ? spin.coriolis_intensity : undefined,
    realism_mode: data.realismMode,
  };

  const lines: string[] = [];
  lines.push("# Gravitas, Gravity Profile");
  lines.push("");
  lines.push("## Configuration");
  lines.push(`- **Mode:** ${MODE_LABELS[mode]}`);
  lines.push(`- **Realism:** ${REALISM_LABELS[data.realismMode]}`);
  lines.push(`- **Effective Gravity:** ${formatG(effectiveG)} (${label})`);
  lines.push("");

  // Mode-specific parameters & results
  if (mode === "spin") {
    lines.push("## Spin Gravity");
    lines.push(`| Parameter | Value |`);
    lines.push(`|-----------|-------|`);
    lines.push(`| Radius | ${data.spin.radius_m.toFixed(0)} m |`);
    lines.push(`| Rotation | ${data.spin.rotation_rpm.toFixed(2)} RPM |`);
    lines.push(`| Period | ${spin.period_s.toFixed(1)} s |`);
    lines.push(`| Floor Gravity | ${formatG(spin.floor_g)} |`);
    lines.push(`| Head Gravity | ${formatG(spin.head_g)} |`);
    lines.push(`| Gradient | ${spin.gradient_percent.toFixed(1)}% |`);
    lines.push(`| Tangential Velocity | ${spin.tangential_velocity_ms.toFixed(1)} m/s |`);
    lines.push(`| Coriolis | ${spin.coriolis_intensity} |`);
    lines.push(`| Comfortable | ${spin.is_comfortable ? "Yes" : "No"} |`);
  } else if (mode === "thrust") {
    lines.push("## Thrust Gravity");
    lines.push(`| Parameter | Value |`);
    lines.push(`|-----------|-------|`);
    lines.push(`| Acceleration | ${data.thrust.acceleration_g.toFixed(3)} g |`);
    lines.push(`| Distance | ${data.thrust.mission_distance_au.toFixed(2)} AU |`);
    lines.push(`| Propulsion | ${data.thrust.propulsion_mode} |`);
    lines.push(`| Trip Duration | ${formatDuration(thrust.trip_duration_days)} |`);
    lines.push(`| Delta-V | ${thrust.delta_v_kms.toFixed(1)} km/s |`);
    lines.push(`| Peak Velocity | ${thrust.peak_velocity_kms.toFixed(1)} km/s (${(thrust.peak_velocity_c * 100).toFixed(4)}% c) |`);
    if (thrust.time_dilation_factor > 1.001) {
      lines.push(`| Time Dilation | γ = ${thrust.time_dilation_factor.toFixed(4)} |`);
      lines.push(`| Ship Time | ${thrust.ship_time_years.toFixed(2)} years |`);
    }
  } else if (mode === "combined") {
    lines.push("## Combined Vector");
    lines.push(`| Parameter | Value |`);
    lines.push(`|-----------|-------|`);
    lines.push(`| Spin Component | ${data.combined.spin_g.toFixed(2)} g |`);
    lines.push(`| Thrust Component | ${data.combined.thrust_g.toFixed(2)} g |`);
    lines.push(`| Axis | ${data.combined.axis_orientation} |`);
    lines.push(`| Resultant | ${formatG(combined.resultant_g)} |`);
    lines.push(`| Tilt Angle | ${combined.tilt_angle_deg.toFixed(1)}° |`);
    lines.push(`| Walking Difficulty | ${combined.walking_difficulty}/10 |`);
    lines.push(`| Impact | ${combined.architectural_impact} |`);
  } else if (mode === "orbital") {
    lines.push("## Orbital / Surface");
    lines.push(`| Parameter | Value |`);
    lines.push(`|-----------|-------|`);
    lines.push(`| Parent Mass | ${data.orbital.parent_mass_kg.toExponential(3)} kg |`);
    lines.push(`| Parent Radius | ${data.orbital.parent_radius_km.toFixed(0)} km |`);
    lines.push(`| Altitude | ${data.orbital.altitude_km.toFixed(0)} km |`);
    lines.push(`| Surface Gravity | ${formatG(orbital.surface_g)} |`);
    lines.push(`| Orbital Velocity | ${orbital.orbital_velocity_kms.toFixed(2)} km/s |`);
    lines.push(`| Orbital Period | ${formatPeriod(orbital.orbital_period_hours)} |`);
    lines.push(`| Escape Velocity | ${orbital.escape_velocity_kms.toFixed(2)} km/s |`);
  } else if (mode === "artificial") {
    lines.push("## Artificial Gravity");
    lines.push(`| Parameter | Value |`);
    lines.push(`|-----------|-------|`);
    lines.push(`| Desired Gravity | ${formatG(artificial.effective_g)} |`);
    lines.push(`| Direction | ${data.artificial.direction} |`);
    lines.push(`| Coverage | ${data.artificial.coverage} |`);
    lines.push(`| Failure Mode | ${data.artificial.failure_mode} |`);
    lines.push(`| Energy Handwave | ${artificial.energy_handwave} |`);
    if (artificial.technobabble_text) {
      lines.push(`| Technobabble | ${artificial.technobabble_text} |`);
    }
  }
  lines.push("");

  // Experiential
  lines.push("## Experiential Description");
  lines.push("");
  lines.push("### Movement");
  lines.push(generateMovementDescription(ctx));
  lines.push("");
  lines.push("### Fluids");
  lines.push(generateFluidDescription(effectiveG));
  lines.push("");
  lines.push("### Health Projections");
  lines.push(generateHealthProjection(effectiveG, data.outputOptions?.healthDurationMonths ?? 12));
  lines.push("");
  lines.push("### Architecture");
  lines.push(generateArchitectureNotes(effectiveG, mode, mode === "combined" ? combined.tilt_angle_deg : undefined));
  lines.push("");
  lines.push("### Mythological Implications");
  lines.push(generateMythologicalSeeds(effectiveG, mode, mode === "spin" ? data.spin.rotation_rpm : undefined));
  lines.push("");
  lines.push("### Narrative Snippet");
  lines.push(`*${generateNarrativeSnippet(ctx)}*`);
  lines.push("");

  // Notes
  const hasNotes = data.cascade && Object.values(data.cascade).some((v) => v);
  const hasStory = data.storyNotes && Object.values(data.storyNotes).some((v) => v);

  if (hasNotes) {
    lines.push("## Cascade Notes");
    if (data.cascade.biology) lines.push(`**Biology:** ${data.cascade.biology}`);
    if (data.cascade.psychology) lines.push(`**Psychology:** ${data.cascade.psychology}`);
    if (data.cascade.mythology) lines.push(`**Mythology:** ${data.cascade.mythology}`);
    if (data.cascade.culture) lines.push(`**Culture:** ${data.cascade.culture}`);
    lines.push("");
  }

  if (hasStory) {
    lines.push("## Story Notes");
    if (data.storyNotes.physicalExperience) lines.push(`**Physical Experience:** ${data.storyNotes.physicalExperience}`);
    if (data.storyNotes.dailyLife) lines.push(`**Daily Life:** ${data.storyNotes.dailyLife}`);
    if (data.storyNotes.architecture) lines.push(`**Architecture:** ${data.storyNotes.architecture}`);
    if (data.storyNotes.culturalIdentity) lines.push(`**Cultural Identity:** ${data.storyNotes.culturalIdentity}`);
    lines.push("");
  }

  if (data.generalNotes) {
    lines.push("## General Notes");
    lines.push(data.generalNotes);
    lines.push("");
  }

  lines.push("---");
  lines.push("*Generated by Gravitas, StellarForge.tools*");

  return lines.join("\n");
}
