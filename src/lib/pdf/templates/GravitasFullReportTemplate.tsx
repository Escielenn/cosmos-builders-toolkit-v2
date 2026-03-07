import { Document, Page, View, Text } from "@react-pdf/renderer";
import { styles, colors, spacing, typography } from "../styles";
import { PDFHeader, PDFFooter, PDFSection, PDFKeyValuePair, PDFResultBox } from "../components";
import { deepStripHtml } from "@/lib/html-utils";
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

interface Props {
  formState: GravitasFormState;
  worldName?: string;
  date?: string;
}

const GravitasFullReportTemplate = ({ formState: rawFormState, worldName, date }: Props) => {
  const data = deepStripHtml(rawFormState) as unknown as GravitasFormState;
  if (!data) return null;

  const spin = calculateSpinGravity(data.spin);
  const thrust = calculateThrustGravity(data.thrust);
  const combined = calculateCombinedVector(data.combined);
  const orbital = calculateOrbitalGravity(data.orbital);
  const artificial = calculateArtificialGravity(data.artificial);
  const results = { spin, thrust, combined, orbital, artificial };
  const effectiveG = getEffectiveG(data, results);
  const label = getGravityLabel(effectiveG);
  const mode = data.activeMode || "spin";

  const ctx: GravityContext = {
    effective_g: effectiveG,
    source: mode,
    spin_rpm: mode === "spin" ? data.spin.rotation_rpm : undefined,
    tilt_angle_deg: mode === "combined" ? combined.tilt_angle_deg : undefined,
    coriolis_intensity: mode === "spin" ? spin.coriolis_intensity : undefined,
    realism_mode: data.realismMode,
  };

  const bodyStyle = { fontSize: typography.sizes.xs, color: colors.text.secondary, lineHeight: 1.5 };

  return (
    <Document>
      {/* Page 1: Configuration & Results */}
      <Page size="LETTER" style={styles.page}>
        <PDFHeader toolName="Gravitas — Full Report" worldName={worldName} date={date} hideLogo />

        <PDFSection title="Configuration">
          <View style={{ flexDirection: "row", gap: spacing.md }}>
            <View style={{ flex: 1 }}>
              <PDFKeyValuePair label="Calculation Mode" value={MODE_LABELS[mode] || mode} />
              <PDFKeyValuePair label="Realism Mode" value={REALISM_LABELS[data.realismMode] || data.realismMode} />
            </View>
            <View style={{ flex: 1 }}>
              <PDFResultBox label="Effective Gravity" value={formatG(effectiveG)} subtitle={label} />
            </View>
          </View>
        </PDFSection>

        {/* Spin results */}
        {mode === "spin" && (
          <PDFSection title="Spin Gravity — Parameters & Results">
            <View style={{ flexDirection: "row", gap: spacing.md }}>
              <View style={{ flex: 1 }}>
                <PDFKeyValuePair label="Habitat Radius" value={`${data.spin.radius_m.toFixed(0)} m`} />
                <PDFKeyValuePair label="Rotation Rate" value={`${data.spin.rotation_rpm.toFixed(2)} RPM`} />
                <PDFKeyValuePair label="Reference Height" value={`${data.spin.human_height_m.toFixed(1)} m`} />
                <PDFKeyValuePair label="Period" value={`${spin.period_s.toFixed(1)} s`} />
              </View>
              <View style={{ flex: 1 }}>
                <PDFKeyValuePair label="Floor Gravity" value={formatG(spin.floor_g)} />
                <PDFKeyValuePair label="Head Gravity" value={formatG(spin.head_g)} />
                <PDFKeyValuePair label="Gravity Gradient" value={`${spin.gradient_percent.toFixed(1)}%`} />
                <PDFKeyValuePair label="Tangential Velocity" value={`${spin.tangential_velocity_ms.toFixed(1)} m/s`} />
                <PDFKeyValuePair label="Coriolis Intensity" value={spin.coriolis_intensity} />
                <PDFKeyValuePair label="Comfort Rating" value={spin.is_comfortable ? "Comfortable" : "Uncomfortable"} />
              </View>
            </View>
          </PDFSection>
        )}

        {/* Thrust results */}
        {mode === "thrust" && (
          <PDFSection title="Thrust Gravity — Parameters & Results">
            <View style={{ flexDirection: "row", gap: spacing.md }}>
              <View style={{ flex: 1 }}>
                <PDFKeyValuePair label="Acceleration" value={`${data.thrust.acceleration_g.toFixed(3)} g`} />
                <PDFKeyValuePair label="Mission Distance" value={`${data.thrust.mission_distance_au.toFixed(2)} AU`} />
                <PDFKeyValuePair label="Propulsion Mode" value={data.thrust.propulsion_mode} />
                <PDFKeyValuePair label="Relativistic" value={data.thrust.include_relativity ? "Yes" : "No"} />
              </View>
              <View style={{ flex: 1 }}>
                <PDFKeyValuePair label="Trip Duration" value={formatDuration(thrust.trip_duration_days)} />
                <PDFKeyValuePair label="Delta-V" value={`${thrust.delta_v_kms.toFixed(1)} km/s`} />
                <PDFKeyValuePair label="Peak Velocity" value={`${thrust.peak_velocity_kms.toFixed(1)} km/s (${(thrust.peak_velocity_c * 100).toFixed(4)}% c)`} />
                {thrust.time_dilation_factor > 1.001 && (
                  <>
                    <PDFKeyValuePair label="Time Dilation (γ)" value={thrust.time_dilation_factor.toFixed(4)} />
                    <PDFKeyValuePair label="Ship Time" value={`${thrust.ship_time_years.toFixed(2)} years`} />
                    <PDFKeyValuePair label="Earth Time" value={`${thrust.earth_time_years.toFixed(2)} years`} />
                  </>
                )}
              </View>
            </View>
          </PDFSection>
        )}

        {/* Combined results */}
        {mode === "combined" && (
          <PDFSection title="Combined Vector — Parameters & Results">
            <View style={{ flexDirection: "row", gap: spacing.md }}>
              <View style={{ flex: 1 }}>
                <PDFKeyValuePair label="Spin Component" value={`${data.combined.spin_g.toFixed(2)} g`} />
                <PDFKeyValuePair label="Thrust Component" value={`${data.combined.thrust_g.toFixed(2)} g`} />
                <PDFKeyValuePair label="Axis Orientation" value={data.combined.axis_orientation} />
              </View>
              <View style={{ flex: 1 }}>
                <PDFKeyValuePair label="Resultant Gravity" value={formatG(combined.resultant_g)} />
                <PDFKeyValuePair label="Tilt Angle" value={`${combined.tilt_angle_deg.toFixed(1)}°`} />
                <PDFKeyValuePair label="Walking Difficulty" value={`${combined.walking_difficulty}/10`} />
              </View>
            </View>
            <Text style={{ ...bodyStyle, marginTop: spacing.sm }}>
              Architectural Impact: {combined.architectural_impact}
            </Text>
          </PDFSection>
        )}

        {/* Orbital results */}
        {mode === "orbital" && (
          <PDFSection title="Orbital / Surface — Parameters & Results">
            <View style={{ flexDirection: "row", gap: spacing.md }}>
              <View style={{ flex: 1 }}>
                <PDFKeyValuePair label="Parent Mass" value={`${data.orbital.parent_mass_kg.toExponential(3)} kg`} />
                <PDFKeyValuePair label="Parent Radius" value={`${data.orbital.parent_radius_km.toFixed(0)} km`} />
                <PDFKeyValuePair label="Altitude" value={`${data.orbital.altitude_km.toFixed(0)} km`} />
              </View>
              <View style={{ flex: 1 }}>
                <PDFKeyValuePair label="Surface Gravity" value={formatG(orbital.surface_g)} />
                {data.orbital.altitude_km > 0 && <PDFKeyValuePair label="At Altitude" value={formatG(orbital.altitude_g)} />}
                <PDFKeyValuePair label="Orbital Velocity" value={`${orbital.orbital_velocity_kms.toFixed(2)} km/s`} />
                <PDFKeyValuePair label="Orbital Period" value={formatPeriod(orbital.orbital_period_hours)} />
                <PDFKeyValuePair label="Escape Velocity" value={`${orbital.escape_velocity_kms.toFixed(2)} km/s`} />
              </View>
            </View>
          </PDFSection>
        )}

        {/* Artificial results */}
        {mode === "artificial" && (
          <PDFSection title="Artificial Gravity (One Big Lie)">
            <PDFKeyValuePair label="Desired Gravity" value={formatG(artificial.effective_g)} />
            <PDFKeyValuePair label="Direction" value={data.artificial.direction} />
            <PDFKeyValuePair label="Coverage" value={data.artificial.coverage} />
            <PDFKeyValuePair label="Failure Mode" value={data.artificial.failure_mode} />
            <PDFKeyValuePair label="Energy Handwave" value={artificial.energy_handwave} />
            {artificial.technobabble_text && (
              <PDFKeyValuePair label="Technobabble" value={artificial.technobabble_text} />
            )}
          </PDFSection>
        )}

        <PDFFooter />
      </Page>

      {/* Page 2: Experiential Output */}
      <Page size="LETTER" style={styles.page}>
        <PDFHeader toolName="Gravitas — Experiential Output" worldName={worldName} date={date} hideLogo />

        <PDFSection title="Movement & Locomotion">
          <Text style={bodyStyle}>{generateMovementDescription(ctx)}</Text>
        </PDFSection>

        <PDFSection title="Fluid Behavior">
          <Text style={bodyStyle}>{generateFluidDescription(effectiveG)}</Text>
        </PDFSection>

        <PDFSection title="Health Projections">
          <Text style={bodyStyle}>
            {generateHealthProjection(effectiveG, data.outputOptions?.healthDurationMonths ?? 12)}
          </Text>
        </PDFSection>

        <PDFSection title="Architectural Requirements">
          <Text style={bodyStyle}>
            {generateArchitectureNotes(effectiveG, mode, mode === "combined" ? combined.tilt_angle_deg : undefined)}
          </Text>
        </PDFSection>

        <PDFFooter />
      </Page>

      {/* Page 3: Mythology, Narrative & Notes */}
      <Page size="LETTER" style={styles.page}>
        <PDFHeader toolName="Gravitas — Mythology & Notes" worldName={worldName} date={date} hideLogo />

        <PDFSection title="Mythological Implications">
          <Text style={bodyStyle}>
            {generateMythologicalSeeds(effectiveG, mode, mode === "spin" ? data.spin.rotation_rpm : undefined)}
          </Text>
        </PDFSection>

        <PDFSection title="Narrative Snippet">
          <Text style={{ ...bodyStyle, fontStyle: "italic" }}>{generateNarrativeSnippet(ctx)}</Text>
        </PDFSection>

        {/* Cascade notes */}
        {data.cascade && Object.values(data.cascade).some((v) => v) && (
          <PDFSection title="Cascade Notes">
            {data.cascade.biology && <PDFKeyValuePair label="Biology" value={data.cascade.biology} />}
            {data.cascade.psychology && <PDFKeyValuePair label="Psychology" value={data.cascade.psychology} />}
            {data.cascade.mythology && <PDFKeyValuePair label="Mythology" value={data.cascade.mythology} />}
            {data.cascade.culture && <PDFKeyValuePair label="Culture" value={data.cascade.culture} />}
          </PDFSection>
        )}

        {/* Story notes */}
        {data.storyNotes && Object.values(data.storyNotes).some((v) => v) && (
          <PDFSection title="Story Notes">
            {data.storyNotes.physicalExperience && <PDFKeyValuePair label="Physical Experience" value={data.storyNotes.physicalExperience} />}
            {data.storyNotes.dailyLife && <PDFKeyValuePair label="Daily Life" value={data.storyNotes.dailyLife} />}
            {data.storyNotes.architecture && <PDFKeyValuePair label="Architecture" value={data.storyNotes.architecture} />}
            {data.storyNotes.culturalIdentity && <PDFKeyValuePair label="Cultural Identity" value={data.storyNotes.culturalIdentity} />}
          </PDFSection>
        )}

        {data.generalNotes && (
          <PDFSection title="General Notes">
            <Text style={bodyStyle}>{data.generalNotes}</Text>
          </PDFSection>
        )}

        <PDFFooter />
      </Page>
    </Document>
  );
};

export default GravitasFullReportTemplate;
