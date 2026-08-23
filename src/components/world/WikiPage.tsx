import { useState, useCallback, useRef, useMemo, useEffect, lazy, Suspense } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Loader } from "@/components/ui/loader";
import { useWikiPage } from "@/hooks/use-wiki-page";
import { DataProfileInfobox } from "./DataProfileInfobox";
import EntityMasterInfobox from "./EntityMasterInfobox";
import EntitySyncNotice from "./EntitySyncNotice";
import type { PendingChange } from "@/services/entity-sync";
import WorksheetLauncherGrid from "./WorksheetLauncherGrid";
import { LAYER_LABELS } from "@/services/world-data";
import type { CascadeLayer } from "@/services/world-data";
import { getToolDisplayName } from "@/lib/worksheet-links-config";
import { Pencil, Eye, ExternalLink, Link2, GitBranch, Database, AlertTriangle, ImagePlus, ChevronRight } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useConnectionSuggestions } from "@/hooks/use-connection-suggestions";
import { useMyWorldRole } from "@/hooks/use-collaborators";
import FirstTimeHint from "@/components/onboarding/FirstTimeHint";
import { EntryTagsBar } from "@/components/tags/EntryTagsBar";
import { sanitizeHtml } from "@/lib/sanitize";

const WikiEditor = lazy(() =>
  import("@/components/editor/WikiEditor").then((m) => ({
    default: m.WikiEditor,
  }))
);

interface WikiPageProps {
  worldId: string;
  entryId: string;
}

export function WikiPage({ worldId, entryId }: WikiPageProps) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { data: role } = useMyWorldRole(worldId);
  const canEdit = role === "owner" || role === "editor";
  const {
    entry,
    toolData,
    connections,
    backlinks,
    deadLinkIds,
    isLoading,
    error,
    updateContent,
    updateTitle,
    updateCoverImage,
    isSaving,
  } = useWikiPage(worldId, entryId);

  const [isEditing, setIsEditing] = useState(false);
  const [editingTitle, setEditingTitle] = useState("");
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "saved">(
    "idle"
  );
  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const titleRef = useRef<HTMLInputElement>(null);

  const {
    suggestions,
    checkForSuggestions,
    acceptSuggestion,
    dismissSuggestion,
  } = useConnectionSuggestions(worldId, entryId);

  // One writing surface: prose entries (documents/lore) open in Studio,
  // not the wiki's inline editor. The wiki remains the codex/registry for
  // entities, tool outputs, and notes. (Jason, 2026-07-10.)
  const isProseDoc = entry?.entry_type === "document" || entry?.entry_type === "lore";
  useEffect(() => {
    if (isProseDoc && entry) {
      navigate(`/write/${entry.id}`, { replace: true });
    }
  }, [isProseDoc, entry, navigate]);

  const isDraft = entry && !entry.content;
  const toolSource = entry?.tool_source;
  const layerLabel =
    entry?.layer && LAYER_LABELS[entry.layer as CascadeLayer]
      ? LAYER_LABELS[entry.layer as CascadeLayer]
      : null;
  const typeLabel =
    toolSource ? getToolDisplayName(toolSource) : entry?.entry_type || "Note";

  // Auto-open editor for new/draft entries so the page isn't empty
  useEffect(() => {
    if (canEdit && isDraft && !isEditing) {
      setIsEditing(true);
    }
  }, [isDraft, canEdit]); // eslint-disable-line react-hooks/exhaustive-deps

  // Sync editing title when entry loads or editing starts
  useEffect(() => {
    if (entry) {
      setEditingTitle(entry.title);
    }
  }, [entry?.title]); // eslint-disable-line react-hooks/exhaustive-deps

  // Focus title input when entering edit mode with default title
  useEffect(() => {
    if (isEditing && editingTitle === "Untitled Entry" && titleRef.current) {
      titleRef.current.focus();
      titleRef.current.select();
    }
  }, [isEditing]); // eslint-disable-line react-hooks/exhaustive-deps

  // Process content HTML to mark dead wiki-links
  const processedContent = useMemo(() => {
    if (!entry?.content || deadLinkIds.size === 0) return entry?.content || "";
    return entry.content.replace(
      /data-element-id="([^"]+)"/g,
      (match, id) => {
        if (deadLinkIds.has(id)) {
          return `${match} data-dead="true"`;
        }
        return match;
      }
    );
  }, [entry?.content, deadLinkIds]);

  const handleContentChange = useCallback(
    (html: string) => {
      setSaveStatus("saving");
      updateContent(html);
      checkForSuggestions(html);
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
      saveTimeoutRef.current = setTimeout(() => setSaveStatus("saved"), 1500);
      setTimeout(() => setSaveStatus("idle"), 4000);
    },
    [updateContent, checkForSuggestions]
  );

  const handleTitleBlur = useCallback(() => {
    const trimmed = editingTitle.trim();
    if (trimmed && trimmed !== entry?.title) {
      updateTitle(trimmed);
    } else if (!trimmed) {
      setEditingTitle(entry?.title || "Untitled Entry");
    }
  }, [editingTitle, entry?.title, updateTitle]);

  const handleTitleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter") {
        e.preventDefault();
        (e.target as HTMLInputElement).blur();
      }
    },
    []
  );

  const handleViewInTool = useCallback(() => {
    if (entry?.tool_source && entry?.tool_data_id) {
      navigate(
        `/worlds/${worldId}/tools/${entry.tool_source}?worksheetId=${entry.tool_data_id}`
      );
    }
  }, [navigate, worldId, entry]);

  const handleNavigateToEntry = useCallback(
    (targetEntryId: string) => {
      navigate(`/worlds/${worldId}/pages/${targetEntryId}`);
    },
    [navigate, worldId]
  );

  const handleCoverUpload = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file || !user) return;

      const ext = file.name.split(".").pop();
      const path = `${user.id}/${entryId}-${Date.now()}.${ext}`;

      const { error: uploadError } = await supabase.storage
        .from("world-headers")
        .upload(path, file);
      if (uploadError) return;

      const {
        data: { publicUrl },
      } = supabase.storage.from("world-headers").getPublicUrl(path);

      updateCoverImage(publicUrl);
    },
    [user, entryId, updateCoverImage]
  );

  if (isLoading || isProseDoc) {
    // isProseDoc → redirecting to Studio; show a loader, don't flash the wiki editor
    return (
      <div className="flex items-center justify-center h-64">
        <Loader size="sm" />
      </div>
    );
  }

  if (error || !entry) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="font-mono text-xs uppercase tracking-wider text-sf-crimson-text">
          Page unavailable.
        </p>
      </div>
    );
  }

  return (
    <div className="sf-wiki-page">
      {/* Header bar */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-1.5 font-mono text-[12px] uppercase tracking-wider text-t3">
          <Link to={`/worlds/${worldId}`} className="hover:text-t2 transition-colors">
            Dashboard
          </Link>
          <ChevronRight className="w-3 h-3" />
          <Link to={`/worlds/${worldId}/wiki`} className="hover:text-t2 transition-colors">
            Wiki
          </Link>
          <ChevronRight className="w-3 h-3" />
          <span className="text-t3 truncate max-w-[200px]">{entry?.title}</span>
        </div>
        <div className="flex items-center gap-2">
          {saveStatus !== "idle" && (
            <span className="sf-wiki-save-indicator">
              {saveStatus === "saving" ? "SAVING..." : "SAVED"}
            </span>
          )}
          {canEdit && (
            <button
              type="button"
              onClick={() => setIsEditing(!isEditing)}
              className="sf-fill-sweep sf-fill-sweep--secondary flex items-center gap-1.5 px-3 py-1.5 border border-sf-line-interactive text-[12px] uppercase tracking-wider"
            >
              {isEditing ? (
                <>
                  <Eye className="w-3 h-3" /> Preview
                </>
              ) : (
                <>
                  <Pencil className="w-3 h-3" /> Edit
                </>
              )}
            </button>
          )}
          {toolSource && (
            <button
              onClick={handleViewInTool}
              className="sf-fill-sweep sf-fill-sweep--secondary flex items-center gap-1.5 px-3 py-1.5 border border-sf-line-interactive text-[12px] uppercase tracking-wider"
            >
              <ExternalLink className="w-3 h-3" /> View in Tool
            </button>
          )}
        </div>
      </div>

      {/* Cover image */}
      {entry.cover_image_url && (
        <img
          src={entry.cover_image_url}
          alt=""
          className="sf-wiki-cover"
        />
      )}

      {/* Title, always editable for editors, static for viewers */}
      {canEdit ? (
        <input
          ref={titleRef}
          type="text"
          value={editingTitle}
          onChange={(e) => setEditingTitle(e.target.value)}
          onBlur={handleTitleBlur}
          onKeyDown={handleTitleKeyDown}
          className="sf-wiki-title sf-wiki-title--editable"
          placeholder="Entry title..."
        />
      ) : (
        <h1 className="sf-wiki-title">{entry.title}</h1>
      )}

      {/* Meta bar */}
      <div className="sf-wiki-meta flex items-center gap-2">
        <span>{typeLabel.toUpperCase()}</span>
        {layerLabel && (
          <>
            <span className="text-t4">&middot;</span>
            <span>{layerLabel.toUpperCase()}</span>
          </>
        )}
        {isDraft && (
          <span className="ml-2 px-1.5 py-0.5 bg-sf-amber/[0.06] border border-sf-amber text-sf-amber text-[12px] uppercase tracking-widest">
            Draft
          </span>
        )}
        {/* Cover upload, compact inline button in edit mode */}
        {canEdit && isEditing && (
          <label className="ml-auto flex items-center gap-1 px-2 py-0.5 border border-sf-line-interactive text-[12px] uppercase tracking-wider text-t3 hover:text-t3 cursor-pointer transition-colors">
            <ImagePlus className="w-3 h-3" />
            {entry.cover_image_url ? "Change cover" : "Add cover"}
            <input
              type="file"
              accept="image/*"
              onChange={handleCoverUpload}
              className="sr-only"
            />
          </label>
        )}
      </div>

      {/* Tags */}
      {((canEdit && isEditing) || ((entry as any).tags ?? []).length > 0) && (
        <div className="mt-2">
          <EntryTagsBar
            entryId={entryId}
            tags={(entry as any).tags ?? []}
            readOnly={!canEdit || !isEditing}
          />
        </div>
      )}

      {/* Wiki links hint, only show once, in edit mode */}
      {isEditing && (
        <FirstTimeHint hintId="wiki-links" icon={Link2} className="mt-4" />
      )}

      {/* Data Profile Infobox (tool-sourced entries) */}
      {toolSource && toolData && (
        <>
          <FirstTimeHint hintId="data-profile" icon={Database} className="mt-4 mb-2" />
          <DataProfileInfobox
            toolSource={toolSource}
            toolData={toolData}
            onViewInTool={handleViewInTool}
          />
        </>
      )}

      {/* Entity Sync Notice (pending worksheet → entity changes) */}
      {!toolSource && entry && (() => {
        const meta = (entry.metadata as Record<string, unknown>) ?? {};
        const pending = meta._pending_changes as PendingChange[] | undefined;
        return pending && pending.length > 0 ? (
          <div className="mt-4">
            <EntitySyncNotice
              entryId={entry.id}
              worldId={worldId}
              pendingChanges={pending}
            />
          </div>
        ) : null;
      })()}

      {/* Entity Master Infobox + Worksheet Launchers (entity-first entries) */}
      {!toolSource && entry && (
        <div className="mt-4 space-y-6">
          <EntityMasterInfobox
            entryId={entry.id}
            entryType={entry.entry_type}
            worldId={worldId}
            metadata={(entry.metadata as Record<string, unknown>) ?? {}}
            canEdit={canEdit}
          />
          <WorksheetLauncherGrid
            entityId={entry.id}
            entityType={entry.entry_type}
            worldId={worldId}
            canEdit={canEdit}
          />
        </div>
      )}

      {/* Dead links hint */}
      {deadLinkIds.size > 0 && (
        <FirstTimeHint hintId="dead-links" icon={AlertTriangle} variant="warning" className="mt-4 mb-2" />
      )}

      {/* ── Editor / Content ── */}
      <div className="sf-wiki-section-header">Content</div>
      {isEditing ? (
        <div>
          <Suspense
            fallback={
              <div className="flex items-center justify-center h-32">
                <Loader size="sm" />
              </div>
            }
          >
            <WikiEditor
              worldId={worldId}
              content={entry.content || ""}
              onChange={handleContentChange}
              readOnly={!canEdit}
              placeholder="Write about this element... Type [[ to link entries"
              saveStatus={saveStatus}
            />
          </Suspense>
        </div>
      ) : entry.content ? (
        <div
          className="sf-wiki-content"
          dangerouslySetInnerHTML={{ __html: sanitizeHtml(processedContent) }}
        />
      ) : (
        <div className="sf-wiki-draft-prompt">
          {toolSource
            ? `This page was auto-generated from your ${typeLabel} data.`
            : "No content yet."}
          <br />
          Click Edit to start writing.
        </div>
      )}

      {/* Persistent tip for view mode */}
      {!isEditing && canEdit && (
        <FirstTimeHint hintId="wiki-edit-tip" icon={Pencil} className="mt-3" />
      )}

      {/* Connection suggestions */}
      {canEdit && suggestions.length > 0 && (
        <div className="mt-4 space-y-2">
          <FirstTimeHint hintId="connection-suggestions" icon={GitBranch} />
          {suggestions.map((s) => (
            <ConnectionSuggestionBar
              key={s.targetId}
              suggestion={s}
              onAccept={acceptSuggestion}
              onDismiss={dismissSuggestion}
            />
          ))}
        </div>
      )}

      {/* Connections */}
      {connections.length > 0 && (
        <>
          <div className="sf-wiki-section-header">Connections</div>
          <div className="space-y-1">
            {connections.map((conn) => (
              <div key={conn.id} className="sf-wiki-connection">
                <span className="sf-wiki-connection-type">
                  {conn.direction === "outgoing" ? "" : "\u2190 "}
                  {conn.connectionType.replace(/_/g, " ")}
                  {conn.direction === "outgoing" ? " \u2192" : ""}
                </span>
                <button
                  onClick={() => handleNavigateToEntry(conn.targetId)}
                  className="sf-wiki-link"
                >
                  {conn.targetTitle}
                </button>
              </div>
            ))}
          </div>
        </>
      )}

      {/* Backlinks */}
      {backlinks.length > 0 && (
        <>
          <div className="sf-wiki-section-header">Referenced By</div>
          <div className="space-y-1">
            {backlinks.map((bl) => (
              <div key={bl.id} className="sf-wiki-backlink">
                <button
                  onClick={() => handleNavigateToEntry(bl.id)}
                  className="sf-wiki-link"
                >
                  {bl.title}
                </button>
                <span className="text-t4 text-xs">
                  references this element
                </span>
              </div>
            ))}
          </div>
        </>
      )}

      {/* From the Tools */}
      {toolSource && (
        <>
          <div className="sf-wiki-section-header">From the Tools</div>
          <div className="flex gap-2">
            <button
              onClick={handleViewInTool}
              className="sf-fill-sweep sf-fill-sweep--secondary px-3 py-1.5 border border-sf-line-interactive text-[12px] uppercase tracking-wider"
            >
              View in {typeLabel}
            </button>
          </div>
        </>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Connection Suggestion Bar
// ---------------------------------------------------------------------------

const CONNECTION_TYPES = [
  "related_to",
  "lives_on",
  "evolved_from",
  "governs",
  "worships",
  "speaks",
  "travels_via",
  "fights",
  "created",
  "parent_of",
];

function ConnectionSuggestionBar({
  suggestion,
  onAccept,
  onDismiss,
}: {
  suggestion: { sourceId: string; targetId: string; targetTitle: string };
  onAccept: (
    s: { sourceId: string; targetId: string; targetTitle: string },
    type: string
  ) => void;
  onDismiss: (s: {
    sourceId: string;
    targetId: string;
    targetTitle: string;
  }) => void;
}) {
  const [connType, setConnType] = useState("related_to");

  return (
    <div className="flex items-center gap-2 px-3 py-2 bg-sf-surface border border-sf-line-interactive text-[12px]">
      <span className="font-mono uppercase tracking-wider text-t4">
        Link detected:
      </span>
      <span className="text-sf-stellar font-medium">
        {suggestion.targetTitle}
      </span>
      <select
        value={connType}
        onChange={(e) => setConnType(e.target.value)}
        title="Connection type"
        className="bg-transparent border border-sf-line-interactive px-1.5 py-0.5 text-[12px] uppercase tracking-wider text-t2"
      >
        {CONNECTION_TYPES.map((t) => (
          <option key={t} value={t}>
            {t.replace(/_/g, " ")}
          </option>
        ))}
      </select>
      <button
        type="button"
        onClick={() => onAccept(suggestion, connType)}
        className="sf-fill-sweep sf-fill-sweep--secondary px-2 py-0.5 border border-sf-teal text-sf-teal text-[12px] uppercase tracking-wider"
      >
        Add
      </button>
      <button
        type="button"
        onClick={() => onDismiss(suggestion)}
        className="text-t4 hover:text-t2 text-[12px] uppercase tracking-wider"
      >
        Dismiss
      </button>
    </div>
  );
}
