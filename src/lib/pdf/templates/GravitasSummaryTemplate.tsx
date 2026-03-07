import { Document, Page, View, Text } from "@react-pdf/renderer";
import { styles, colors, spacing, typography } from "../styles";
import { PDFHeader, PDFFooter, PDFSection, PDFKeyValuePair, PDFResultBox } from "../components";
import { deepStripHtml } from "@/lib/html-utils";
import type { GravitasFormState } from "@/lib/gravitas/types";
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
import { MODE_LABELS, REALISM_LABELS } from "@/lib/gravitas/data";

interface Props {
  formState: GravitasFormState;
  worldName?: string;
  date?: string;
}

const GravitasSummaryTemplate = ({ formState: rawFormState, worldName, date }: Props) => {
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

  return (
    <Document>
      <Page size="LETTER" style={styles.page}>
        <PDFHeader toolName="Gravitas" worldName={worldName} date={date} hideLogo />

        {/* Configuration */}
        <PDFSection title="Configuration">
          <View style={{ flexDirection: "row", gap: spacing.md }}>
            <View style={{ flex: 1 }}>
              <PDFKeyValuePair label="Mode" value={MODE_LABELS[mode] || mode} />
              <PDFKeyValuePair label="Realism" value={REALISM_LABELS[data.realismMode] || data.realismMode} />
            </View>
            <View style={{ flex: 1 }}>
              <PDFResultBox label="Effective Gravity" value={formatG(effectiveG)} subtitle={label} />
            </View>
          </View>
        </PDFSection>

        {/* Mode-specific results */}
        {mode === "spin" && (
          <PDFSection title="Spin Gravity Results">
            <View style={{ flexDirection: "row", gap: spacing.md }}>
              <View style={{ flex: 1 }}>
                <PDFKeyValuePair label="Radius" value={`${data.spin.radius_m.toFixed(0)} m`} />
                <PDFKeyValuePair label="Rotation" value={`${data.spin.rotation_rpm.toFixed(2)} RPM`} />
                <PDFKeyValuePair label="Floor Gravity" value={formatG(spin.floor_g)} />
              </View>
              <View style={{ flex: 1 }}>
                <PDFKeyValuePair label="Head Gravity" value={formatG(spin.head_g)} />
                <PDFKeyValuePair label="Gradient" value={`${spin.gradient_percent.toFixed(1)}%`} />
                <PDFKeyValuePair label="Coriolis" value={spin.coriolis_intensity} />
              </View>
            </View>
          </PDFSection>
        )}

        {mode === "thrust" && (
          <PDFSection title="Thrust Gravity Results">
            <View style={{ flexDirection: "row", gap: spacing.md }}>
              <View style={{ flex: 1 }}>
                <PDFKeyValuePair label="Acceleration" value={`${data.thrust.acceleration_g.toFixed(2)} g`} />
                <PDFKeyValuePair label="Distance" value={`${data.thrust.mission_distance_au.toFixed(2)} AU`} />
                <PDFKeyValuePair label="Trip Duration" value={formatDuration(thrust.trip_duration_days)} />
              </View>
              <View style={{ flex: 1 }}>
                <PDFKeyValuePair label="Delta-V" value={`${thrust.delta_v_kms.toFixed(1)} km/s`} />
                <PDFKeyValuePair label="Peak Velocity" value={`${thrust.peak_velocity_kms.toFixed(1)} km/s`} />
                {thrust.time_dilation_factor > 1.001 && (
                  <PDFKeyValuePair label="Time Dilation" value={`γ = ${thrust.time_dilation_factor.toFixed(4)}`} />
                )}
              </View>
            </View>
          </PDFSection>
        )}

        {mode === "combined" && (
          <PDFSection title="Combined Vector Results">
            <View style={{ flexDirection: "row", gap: spacing.md }}>
              <View style={{ flex: 1 }}>
                <PDFKeyValuePair label="Spin Component" value={`${data.combined.spin_g.toFixed(2)} g`} />
                <PDFKeyValuePair label="Thrust Component" value={`${data.combined.thrust_g.toFixed(2)} g`} />
              </View>
              <View style={{ flex: 1 }}>
                <PDFKeyValuePair label="Resultant" value={formatG(combined.resultant_g)} />
                <PDFKeyValuePair label="Tilt Angle" value={`${combined.tilt_angle_deg.toFixed(1)}°`} />
                <PDFKeyValuePair label="Walking Difficulty" value={`${combined.walking_difficulty}/10`} />
              </View>
            </View>
          </PDFSection>
        )}

        {mode === "orbital" && (
          <PDFSection title="Orbital / Surface Results">
            <View style={{ flexDirection: "row", gap: spacing.md }}>
              <View style={{ flex: 1 }}>
                <PDFKeyValuePair label="Surface Gravity" value={formatG(orbital.surface_g)} />
                <PDFKeyValuePair label="Orbital Velocity" value={`${orbital.orbital_velocity_kms.toFixed(2)} km/s`} />
                <PDFKeyValuePair label="Orbital Period" value={formatPeriod(orbital.orbital_period_hours)} />
              </View>
              <View style={{ flex: 1 }}>
                <PDFKeyValuePair label="Escape Velocity" value={`${orbital.escape_velocity_kms.toFixed(2)} km/s`} />
                {data.orbital.altitude_km > 0 && (
                  <PDFKeyValuePair label="Gravity at Altitude" value={formatG(orbital.altitude_g)} />
                )}
              </View>
            </View>
          </PDFSection>
        )}

        {mode === "artificial" && (
          <PDFSection title="Artificial Gravity">
            <PDFKeyValuePair label="Desired Gravity" value={formatG(artificial.effective_g)} />
            <PDFKeyValuePair label="Energy Handwave" value={artificial.energy_handwave} />
            {artificial.technobabble_text && (
              <PDFKeyValuePair label="Technobabble" value={artificial.technobabble_text} />
            )}
          </PDFSection>
        )}

        <PDFFooter />
      </Page>
    </Document>
  );
};

export default GravitasSummaryTemplate;
