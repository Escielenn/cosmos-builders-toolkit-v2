import { useNavigate } from "react-router-dom";
import { ExternalLink } from "lucide-react";
import type { ChronicleEvent, CalendarConfig } from "@/services/chronicle-data";
import { LAYER_COLORS } from "@/services/chronicle-data";
import { sanitizeHtml } from "@/lib/sanitize";

interface EventCardProps {
  event: ChronicleEvent;
  side: "left" | "right";
  calendarConfig: CalendarConfig;
  worldId: string;
  onEdit: (event: ChronicleEvent) => void;
}

export function EventCard({
  event,
  side,
  calendarConfig,
  worldId,
  onEdit,
}: EventCardProps) {
  const navigate = useNavigate();

  const dateDisplay = calendarConfig.era_label
    ? `${event.eventDate} ${calendarConfig.era_label}`
    : event.eventDate;

  const isDuration = event.eventType === "era" || event.eventType === "war";
  const endDisplay =
    isDuration && event.endDate
      ? calendarConfig.era_label
        ? `${event.endDate} ${calendarConfig.era_label}`
        : event.endDate
      : null;

  const layerColor = event.layer ? LAYER_COLORS[event.layer] : undefined;

  return (
    <div
      className={`sf-chronicle-card ${side === "right" ? "sf-chronicle-card--right" : ""}`}
      data-layer={event.layer || undefined}
      onClick={() => onEdit(event)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onEdit(event);
        }
      }}
    >
      {/* Connector line */}
      <div
        className={`sf-chronicle-connector ${side === "left" ? "sf-chronicle-connector--left" : "sf-chronicle-connector--right"}`}
      />

      {/* Date */}
      <div className="sf-chronicle-date" style={layerColor ? { color: layerColor } : undefined}>
        {dateDisplay}
        {endDisplay && (
          <span className="text-t4"> · {endDisplay}</span>
        )}
      </div>

      {/* Title */}
      <div className="sf-chronicle-title">{event.title}</div>

      {/* Type label */}
      <div className="sf-chronicle-type">
        {event.eventType.replace(/_/g, " ")}
        {event.layer && (
          <>
            {" "}
            <span className="text-t4">&middot;</span>{" "}
            {event.layer}
          </>
        )}
      </div>

      {/* Description */}
      {event.description && (
        <div
          className="sf-chronicle-description"
          dangerouslySetInnerHTML={{ __html: sanitizeHtml(event.description) }}
        />
      )}

      {/* Children (sub-events) */}
      {event.children.length > 0 && (
        <div className="sf-chronicle-children">
          {event.children.map((child, i) => (
            <div key={child.id} className="sf-chronicle-child">
              <span className="font-mono text-[12px] text-t4 mr-1.5">
                {i < event.children.length - 1 ? "├" : "└"}
              </span>
              <span className="font-mono text-[12px] text-t4 mr-2">
                {child.eventDate}
              </span>
              {child.title}
            </div>
          ))}
        </div>
      )}

      {/* Linked wiki page */}
      {event.linkedEntryId && event.linkedEntryTitle && (
        <div className="sf-chronicle-link">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              navigate(`/worlds/${worldId}/pages/${event.linkedEntryId}`);
            }}
            className="inline-flex items-center gap-1"
          >
            <ExternalLink className="w-3 h-3" />
            {event.linkedEntryTitle}
          </button>
        </div>
      )}
    </div>
  );
}
