import { Document, Page, View, Text } from "@react-pdf/renderer";
import { styles, colors, spacing, typography } from "../styles";
import {
  PDFHeader,
  PDFFooter,
  PDFSection,
  PDFKeyValuePair,
  PDFResultBox,
} from "../components";
import type { TimelineState } from "@/lib/timeline/types";
import { EVENT_TYPE_MAP, IMPORTANCE_MAP, TRACK_TYPE_MAP } from "@/lib/timeline/constants";
import { formatDateRange, sortEventsByDate } from "@/lib/timeline/utils";

interface TimelineSummaryTemplateProps {
  formState: TimelineState;
  worldName?: string;
  date?: string;
}

const TimelineSummaryTemplate = ({
  formState,
  worldName,
  date,
}: TimelineSummaryTemplateProps) => {
  const { tracks, events, eventLinks, elementLinks, compressions } = formState;

  // Calculate stats
  const dateRange = getDateRangeStr(events);
  const epochalCount = events.filter((e) => e.importance === "epochal").length;
  const majorCount = events.filter((e) => e.importance === "major").length;

  // Top events by importance (epochal first, then major, then moderate)
  const topEvents = [...events]
    .sort((a, b) => {
      const order: Record<string, number> = { epochal: 0, major: 1, moderate: 2, minor: 3 };
      const diff = (order[a.importance] ?? 3) - (order[b.importance] ?? 3);
      if (diff !== 0) return diff;
      return a.startYear - b.startYear;
    })
    .slice(0, 12);

  return (
    <Document>
      <Page size="LETTER" style={styles.page}>
        <PDFHeader
          toolName="Timeline"
          worldName={worldName}
          date={date}
          hideLogo
        />

        {/* Result Box, overview */}
        <PDFResultBox
          value={`${events.length} Events`}
          label={`${tracks.length} Tracks`}
          description={dateRange ? `Spanning ${dateRange}` : "No events yet"}
        />

        {/* Quick Stats */}
        <PDFSection title="Overview">
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: spacing.sm }}>
            <View style={{ flex: 1, minWidth: 140 }}>
              <PDFKeyValuePair label="Total Events" value={String(events.length)} />
            </View>
            <View style={{ flex: 1, minWidth: 140 }}>
              <PDFKeyValuePair label="Total Tracks" value={String(tracks.length)} />
            </View>
            <View style={{ flex: 1, minWidth: 140 }}>
              <PDFKeyValuePair label="Epochal Events" value={String(epochalCount)} />
            </View>
            <View style={{ flex: 1, minWidth: 140 }}>
              <PDFKeyValuePair label="Major Events" value={String(majorCount)} />
            </View>
          </View>
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: spacing.sm, marginTop: spacing.xs }}>
            <View style={{ flex: 1, minWidth: 140 }}>
              <PDFKeyValuePair label="Causality Links" value={String(eventLinks.length)} />
            </View>
            <View style={{ flex: 1, minWidth: 140 }}>
              <PDFKeyValuePair label="Element Links" value={String(elementLinks.length)} />
            </View>
            <View style={{ flex: 1, minWidth: 140 }}>
              <PDFKeyValuePair label="Compressions" value={String(compressions.length)} />
            </View>
            <View style={{ flex: 1, minWidth: 140 }}>
              <PDFKeyValuePair label="Date Range" value={dateRange || "N/A"} />
            </View>
          </View>
        </PDFSection>

        {/* Track Listing */}
        <PDFSection title="Tracks">
          {tracks.length === 0 ? (
            <Text style={{ fontSize: typography.sizes.sm, color: colors.text.muted }}>
              No tracks defined.
            </Text>
          ) : (
            tracks
              .sort((a, b) => a.order - b.order)
              .map((track) => {
                const trackEventCount = events.filter((e) => e.trackId === track.id).length;
                const typeLabel = TRACK_TYPE_MAP[track.type]?.label || track.type;
                return (
                  <View
                    key={track.id}
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      gap: spacing.sm,
                      marginBottom: spacing.xs,
                      paddingVertical: spacing.xs,
                      borderBottomWidth: 1,
                      borderBottomColor: colors.borderLight,
                    }}
                  >
                    <View
                      style={{
                        width: 8,
                        height: 8,
                        borderRadius: 4,
                        backgroundColor: track.color,
                      }}
                    />
                    <Text style={{ fontSize: typography.sizes.sm, fontWeight: 600, flex: 1 }}>
                      {track.name}
                    </Text>
                    <Text style={{ fontSize: typography.sizes.xs, color: colors.text.muted }}>
                      {typeLabel}
                    </Text>
                    <Text style={{ fontSize: typography.sizes.xs, color: colors.text.secondary }}>
                      {trackEventCount} event{trackEventCount !== 1 ? "s" : ""}
                    </Text>
                  </View>
                );
              })
          )}
        </PDFSection>

        {/* Key Events */}
        {topEvents.length > 0 && (
          <PDFSection title="Key Events">
            {topEvents.map((event) => {
              const track = tracks.find((t) => t.id === event.trackId);
              const typeConfig = EVENT_TYPE_MAP[event.eventType];
              const importanceConfig = IMPORTANCE_MAP[event.importance];
              return (
                <View
                  key={event.id}
                  style={{
                    marginBottom: spacing.sm,
                    paddingBottom: spacing.sm,
                    borderBottomWidth: 1,
                    borderBottomColor: colors.borderLight,
                  }}
                >
                  <View style={{ flexDirection: "row", alignItems: "center", gap: spacing.xs }}>
                    <Text style={{ fontSize: typography.sizes.sm, fontWeight: 600, flex: 1 }}>
                      {event.name}
                    </Text>
                    <Text style={{ fontSize: typography.sizes.xs, color: colors.primary, fontWeight: 600 }}>
                      {importanceConfig?.label || event.importance}
                    </Text>
                  </View>
                  <View style={{ flexDirection: "row", gap: spacing.sm, marginTop: 2 }}>
                    <Text style={{ fontSize: typography.sizes.xs, color: colors.text.muted }}>
                      {formatDateRange(event)}
                    </Text>
                    <Text style={{ fontSize: typography.sizes.xs, color: colors.text.muted }}>
                      {typeConfig?.label || event.eventType}
                    </Text>
                    {track && (
                      <Text style={{ fontSize: typography.sizes.xs, color: colors.text.muted }}>
                        {track.name}
                      </Text>
                    )}
                  </View>
                  {event.shortDescription && (
                    <Text style={{ fontSize: typography.sizes.xs, color: colors.text.secondary, marginTop: 2, lineHeight: 1.4 }}>
                      {event.shortDescription.length > 200
                        ? event.shortDescription.substring(0, 197) + "..."
                        : event.shortDescription}
                    </Text>
                  )}
                </View>
              );
            })}
          </PDFSection>
        )}

        <PDFFooter />
      </Page>
    </Document>
  );
};

// Helper: get date range string
function getDateRangeStr(events: TimelineState["events"]): string {
  if (events.length === 0) return "";
  let min = Infinity;
  let max = -Infinity;
  for (const e of events) {
    if (e.startYear < min) min = e.startYear;
    const end = e.endYear ?? e.startYear;
    if (end > max) max = end;
  }
  return `${formatYear(min)}, ${formatYear(max)}`;
}

function formatYear(year: number): string {
  const abs = Math.abs(year);
  if (abs >= 1_000_000) return `${(year / 1_000_000).toFixed(1)}M`;
  if (abs >= 10_000) return `${(year / 1_000).toFixed(1)}K`;
  return String(year);
}

export default TimelineSummaryTemplate;
