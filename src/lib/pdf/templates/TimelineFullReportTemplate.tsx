import { Document, Page, View, Text } from "@react-pdf/renderer";
import { styles, colors, spacing, typography } from "../styles";
import {
  PDFHeader,
  PDFFooter,
  PDFSection,
  PDFKeyValuePair,
} from "../components";
import type { TimelineState, TimelineEvent, TimelineTrack } from "@/lib/timeline/types";
import {
  EVENT_TYPE_MAP,
  IMPORTANCE_MAP,
  TRACK_TYPE_MAP,
  LINK_TYPE_CONFIG,
} from "@/lib/timeline/constants";
import { formatDateRange, sortEventsByDate } from "@/lib/timeline/utils";
import { deepStripHtml } from "@/lib/html-utils";

interface TimelineFullReportTemplateProps {
  formState: TimelineState;
  worldName?: string;
  date?: string;
}

const TimelineFullReportTemplate = ({
  formState,
  worldName,
  date,
}: TimelineFullReportTemplateProps) => {
  const { tracks, events, eventLinks, elementLinks, compressions, calendars, generalNotes } =
    formState;

  const sortedTracks = [...tracks].sort((a, b) => a.order - b.order);
  const dateRange = getDateRangeStr(events);
  const cleanNotes = generalNotes ? deepStripHtml(generalNotes) : "";

  return (
    <Document>
      {/* ── Page 1: Overview ──────────────────────────────────── */}
      <Page size="LETTER" style={styles.page} wrap>
        <PDFHeader toolName="Timeline" worldName={worldName} date={date} hideLogo />

        {/* Title bar */}
        <View
          style={{
            backgroundColor: colors.primaryLight,
            borderWidth: 2,
            borderColor: colors.primary,
            borderRadius: 8,
            padding: spacing.lg,
            marginBottom: spacing.xl,
            alignItems: "center",
          }}
        >
          <Text style={{ fontSize: typography.sizes["2xl"], fontWeight: 700, color: colors.primary }}>
            Timeline Report
          </Text>
          {dateRange && (
            <Text style={{ fontSize: typography.sizes.sm, color: colors.text.secondary, marginTop: spacing.xs }}>
              {dateRange}
            </Text>
          )}
        </View>

        {/* Stats */}
        <PDFSection title="Overview">
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: spacing.sm }}>
            <View style={{ flex: 1, minWidth: 130 }}>
              <PDFKeyValuePair label="Tracks" value={String(tracks.length)} />
            </View>
            <View style={{ flex: 1, minWidth: 130 }}>
              <PDFKeyValuePair label="Events" value={String(events.length)} />
            </View>
            <View style={{ flex: 1, minWidth: 130 }}>
              <PDFKeyValuePair label="Causality Links" value={String(eventLinks.length)} />
            </View>
            <View style={{ flex: 1, minWidth: 130 }}>
              <PDFKeyValuePair label="Element Links" value={String(elementLinks.length)} />
            </View>
          </View>
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: spacing.sm, marginTop: spacing.xs }}>
            <View style={{ flex: 1, minWidth: 130 }}>
              <PDFKeyValuePair label="Compressions" value={String(compressions.length)} />
            </View>
            <View style={{ flex: 1, minWidth: 130 }}>
              <PDFKeyValuePair label="Custom Calendars" value={String(calendars.length)} />
            </View>
            <View style={{ flex: 1, minWidth: 130 }}>
              <PDFKeyValuePair label="Date Range" value={dateRange || "N/A"} />
            </View>
            <View style={{ flex: 1, minWidth: 130 }}>
              <PDFKeyValuePair label="" value="" />
            </View>
          </View>
        </PDFSection>

        {/* Track listing */}
        <PDFSection title="Track Summary">
          {sortedTracks.map((track) => {
            const count = events.filter((e) => e.trackId === track.id).length;
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
                <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: track.color }} />
                <Text style={{ fontSize: typography.sizes.sm, fontWeight: 600, flex: 1 }}>
                  {track.name}
                </Text>
                <Text style={{ fontSize: typography.sizes.xs, color: colors.text.muted }}>
                  {typeLabel}
                </Text>
                <Text style={{ fontSize: typography.sizes.xs, color: colors.text.secondary }}>
                  {count} event{count !== 1 ? "s" : ""}
                </Text>
              </View>
            );
          })}
        </PDFSection>

        {/* General Notes */}
        {cleanNotes && (
          <PDFSection title="General Notes">
            <View style={styles.notesBox}>
              <Text style={{ ...styles.notesText, fontSize: typography.sizes.xs }}>
                {cleanNotes.length > 800 ? cleanNotes.substring(0, 797) + "..." : cleanNotes}
              </Text>
            </View>
          </PDFSection>
        )}

        <PDFFooter />
      </Page>

      {/* ── Track Detail Pages ────────────────────────────────── */}
      {sortedTracks.map((track) => {
        const trackEvents = sortEventsByDate(events.filter((e) => e.trackId === track.id));
        if (trackEvents.length === 0) return null;

        const topLevel = trackEvents.filter(
          (e) => !e.parentEventId || !trackEvents.some((te) => te.id === e.parentEventId)
        );

        return (
          <Page key={track.id} size="LETTER" style={styles.page} wrap>
            <PDFHeader toolName="Timeline" worldName={worldName} date={date} hideLogo />

            {/* Track header */}
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                gap: spacing.sm,
                marginBottom: spacing.lg,
              }}
            >
              <View style={{ width: 12, height: 12, borderRadius: 6, backgroundColor: track.color }} />
              <Text style={{ fontSize: typography.sizes.lg, fontWeight: 700, color: colors.text.primary }}>
                {track.name}
              </Text>
              <Text style={{ fontSize: typography.sizes.sm, color: colors.text.muted }}>
                ({TRACK_TYPE_MAP[track.type]?.label || track.type})
              </Text>
            </View>

            {/* Events */}
            {sortEventsByDate(topLevel).map((event) => (
              <EventEntry
                key={event.id}
                event={event}
                allEvents={trackEvents}
                tracks={tracks}
                level={0}
              />
            ))}

            <PDFFooter />
          </Page>
        );
      })}

      {/* ── Causality Links Appendix ────────────────────────── */}
      {eventLinks.length > 0 && (
        <Page size="LETTER" style={styles.page} wrap>
          <PDFHeader toolName="Timeline" worldName={worldName} date={date} hideLogo />

          <PDFSection title="Causality Links">
            {eventLinks.map((link) => {
              const source = events.find((e) => e.id === link.sourceEventId);
              const target = events.find((e) => e.id === link.targetEventId);
              const config = LINK_TYPE_CONFIG[link.linkType];
              if (!source || !target) return null;
              return (
                <View
                  key={link.id}
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    gap: spacing.xs,
                    marginBottom: spacing.xs,
                    paddingVertical: spacing.xs,
                    borderBottomWidth: 1,
                    borderBottomColor: colors.borderLight,
                  }}
                >
                  <Text style={{ fontSize: typography.sizes.sm, fontWeight: 600, flex: 2 }}>
                    {source.name}
                  </Text>
                  <Text style={{ fontSize: typography.sizes.xs, color: colors.primary, textAlign: "center", flex: 1 }}>
                    {config?.label || link.linkType} →
                  </Text>
                  <Text style={{ fontSize: typography.sizes.sm, fontWeight: 600, flex: 2 }}>
                    {target.name}
                  </Text>
                  {link.label && (
                    <Text style={{ fontSize: typography.sizes.xs, color: colors.text.muted, flex: 1 }}>
                      {link.label}
                    </Text>
                  )}
                </View>
              );
            })}
          </PDFSection>

          <PDFFooter />
        </Page>
      )}

      {/* ── Element Links Appendix ──────────────────────────── */}
      {elementLinks.length > 0 && (
        <Page size="LETTER" style={styles.page} wrap>
          <PDFHeader toolName="Timeline" worldName={worldName} date={date} hideLogo />

          <PDFSection title="Linked World Elements">
            {elementLinks.map((link) => {
              const event = events.find((e) => e.id === link.eventId);
              if (!event) return null;
              return (
                <View
                  key={link.id}
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
                  <Text style={{ fontSize: typography.sizes.sm, fontWeight: 600, flex: 1 }}>
                    {event.name}
                  </Text>
                  <Text style={{ fontSize: typography.sizes.xs, color: colors.text.muted }}>
                    ↔
                  </Text>
                  <Text style={{ fontSize: typography.sizes.sm, flex: 1 }}>
                    {link.worksheetTitle}
                  </Text>
                  <Text style={{ fontSize: typography.sizes.xs, color: colors.text.muted }}>
                    {formatToolType(link.toolType)}
                  </Text>
                </View>
              );
            })}
          </PDFSection>

          <PDFFooter />
        </Page>
      )}

      {/* ── Compression Zones ───────────────────────────────── */}
      {compressions.length > 0 && (
        <Page size="LETTER" style={styles.page} wrap>
          <PDFHeader toolName="Timeline" worldName={worldName} date={date} hideLogo />

          <PDFSection title="Time Compressions">
            {compressions.map((c) => (
              <View
                key={c.id}
                style={{
                  marginBottom: spacing.sm,
                  paddingVertical: spacing.xs,
                  borderBottomWidth: 1,
                  borderBottomColor: colors.borderLight,
                }}
              >
                <View style={{ flexDirection: "row", gap: spacing.sm }}>
                  <Text style={{ fontSize: typography.sizes.sm, fontWeight: 600 }}>
                    {formatYear(c.startYear)} — {formatYear(c.endYear)}
                  </Text>
                  <Text style={{ fontSize: typography.sizes.xs, color: colors.text.muted }}>
                    ({c.style})
                  </Text>
                </View>
                {c.label && (
                  <Text style={{ fontSize: typography.sizes.xs, color: colors.text.secondary, marginTop: 2 }}>
                    {c.label}
                  </Text>
                )}
              </View>
            ))}
          </PDFSection>

          <PDFFooter />
        </Page>
      )}
    </Document>
  );
};

// ─── Sub-components ─────────────────────────────────────────────────

const EventEntry = ({
  event,
  allEvents,
  tracks,
  level,
}: {
  event: TimelineEvent;
  allEvents: TimelineEvent[];
  tracks: TimelineTrack[];
  level: number;
}) => {
  const typeConfig = EVENT_TYPE_MAP[event.eventType];
  const importanceConfig = IMPORTANCE_MAP[event.importance];
  const children = sortEventsByDate(
    allEvents.filter((e) => e.parentEventId === event.id)
  );

  return (
    <View
      style={{
        marginBottom: spacing.sm,
        paddingLeft: level * 12,
        paddingBottom: spacing.xs,
        borderBottomWidth: level === 0 ? 1 : 0,
        borderBottomColor: colors.borderLight,
      }}
      wrap={false}
    >
      {/* Event header */}
      <View style={{ flexDirection: "row", alignItems: "center", gap: spacing.xs }}>
        {level > 0 && (
          <Text style={{ fontSize: typography.sizes.xs, color: colors.text.muted }}>└</Text>
        )}
        <Text style={{ fontSize: level === 0 ? typography.sizes.sm : typography.sizes.xs, fontWeight: 600, flex: 1 }}>
          {event.name}
        </Text>
        <Text style={{ fontSize: typography.sizes.xs, color: colors.primary, fontWeight: 600 }}>
          {importanceConfig?.label || event.importance}
        </Text>
      </View>

      {/* Event meta */}
      <View style={{ flexDirection: "row", gap: spacing.sm, marginTop: 2, paddingLeft: level > 0 ? 10 : 0 }}>
        <Text style={{ fontSize: typography.sizes.xs, color: colors.text.muted }}>
          {formatDateRange(event)}
        </Text>
        <Text style={{ fontSize: typography.sizes.xs, color: colors.text.muted }}>
          {typeConfig?.label || event.eventType}
        </Text>
      </View>

      {/* Description */}
      {event.shortDescription && (
        <Text
          style={{
            fontSize: typography.sizes.xs,
            color: colors.text.secondary,
            marginTop: 2,
            lineHeight: 1.4,
            paddingLeft: level > 0 ? 10 : 0,
          }}
        >
          {event.shortDescription}
        </Text>
      )}

      {/* Extended description */}
      {event.extendedDescription && (
        <Text
          style={{
            fontSize: typography.sizes.xs,
            color: colors.text.muted,
            marginTop: 2,
            lineHeight: 1.4,
            fontStyle: "italic",
            paddingLeft: level > 0 ? 10 : 0,
          }}
        >
          {deepStripHtml(event.extendedDescription).length > 400
            ? deepStripHtml(event.extendedDescription).substring(0, 397) + "..."
            : deepStripHtml(event.extendedDescription)}
        </Text>
      )}

      {/* Children */}
      {children.map((child) => (
        <EventEntry
          key={child.id}
          event={child}
          allEvents={allEvents}
          tracks={tracks}
          level={Math.min(level + 1, 2)}
        />
      ))}
    </View>
  );
};

// ─── Helpers ──────────────────────────────────────────────────────────

function getDateRangeStr(events: TimelineState["events"]): string {
  if (events.length === 0) return "";
  let min = Infinity;
  let max = -Infinity;
  for (const e of events) {
    if (e.startYear < min) min = e.startYear;
    const end = e.endYear ?? e.startYear;
    if (end > max) max = end;
  }
  return `${formatYear(min)} — ${formatYear(max)}`;
}

function formatYear(year: number): string {
  const abs = Math.abs(year);
  const sign = year < 0 ? "-" : "";
  if (abs >= 1_000_000) return `${sign}${(abs / 1_000_000).toFixed(1)}M`;
  if (abs >= 10_000) return `${sign}${(abs / 1_000).toFixed(1)}K`;
  return String(year);
}

function formatToolType(toolType: string): string {
  return toolType
    .replace(/-/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

export default TimelineFullReportTemplate;
