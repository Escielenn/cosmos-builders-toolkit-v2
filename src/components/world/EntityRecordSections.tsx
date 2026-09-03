/**
 * The entity page's record sections (Brief F1 §6–7): documents that mention
 * this entity, and Chronicle events that touch it. Both are read-only
 * projections with a click-through; neither invents a row.
 */

import { Link } from "react-router-dom";
import type { ChronicleEvent } from "@/services/chronicle-data";
import type { MentioningDocument } from "@/hooks/use-codex-entity";

export function EntityMentionsSection({ mentions }: { mentions: MentioningDocument[] }) {
  if (mentions.length === 0) return null;
  return (
    <>
      <div className="sf-wiki-section-header">Mentioned in</div>
      <div className="space-y-1">
        {mentions.map((m) => (
          <div key={m.id} className="sf-wiki-backlink">
            <Link to={`/write/${m.id}`} className="sf-wiki-link">
              {m.title}
            </Link>
            <span className="text-t4 text-xs">manuscript</span>
          </div>
        ))}
      </div>
    </>
  );
}

export function EntityChronicleSection({ worldId, events }: { worldId: string; events: ChronicleEvent[] }) {
  if (events.length === 0) return null;
  return (
    <>
      <div className="sf-wiki-section-header">Chronicle</div>
      <div className="space-y-1">
        {events.map((e) => (
          <div key={e.id} className="sf-wiki-connection">
            <span className="sf-wiki-connection-type font-mono">{e.eventDate}{e.endDate ? ` — ${e.endDate}` : ""}</span>
            <Link to={`/worlds/${worldId}/chronicle`} className="sf-wiki-link">
              {e.title}
            </Link>
            {e.eventType && <span className="text-t4 text-xs uppercase tracking-wider">{e.eventType}</span>}
          </div>
        ))}
      </div>
    </>
  );
}
