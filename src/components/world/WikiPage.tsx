import { useState, useCallback, useRef, useMemo, lazy, Suspense } from "react";
import { useNavigate } from "react-router-dom";
import { Loader } from "@/components/ui/loader";
import { useWikiPage } from "@/hooks/use-wiki-page";
import { DataProfileInfobox } from "./DataProfileInfobox";
import { LAYER_LABELS } from "@/services/world-data";
import type { CascadeLayer } from "@/services/world-data";
import { getToolDisplayName } from "@/lib/worksheet-links-config";
import { Pencil, Eye, ExternalLink } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useConnectionSuggestions } from "@/hooks/use-connection-suggestions";

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
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "saved">(
    "idle"
  );
  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const {
    suggestions,
    checkForSuggestions,
    acceptSuggestion,
    dismissSuggestion,
  } = useConnectionSuggestions(worldId, entryId);

  const isDraft = entry && !entry.content;
  const toolSource = entry?.tool_source;
  const layerLabel =
    entry?.layer && LAYER_LABELS[entry.layer as CascadeLayer]
      ? LAYER_LABELS[entry.layer as CascadeLayer]
      : null;
  const typeLabel =
    toolSource ? getToolDisplayName(toolSource) : entry?.entry_type || "Note";

  // Process content HTML to mark dead wiki-links
  const processedContent = useMemo(() => {
    if (!entry?.content || deadLinkIds.size === 0) return entry?.content || "";
    // Add data-dead="true" to wiki-link elements whose IDs are in deadLinkIds
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
      // Check for new wiki-links that might need connections
      checkForSuggestions(html);
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
      saveTimeoutRef.current = setTimeout(() => setSaveStatus("saved"), 1500);
      setTimeout(() => setSaveStatus("idle"), 4000);
    },
    [updateContent, checkForSuggestions]
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

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader size="sm" />
      </div>
    );
  }

  if (error || !entry) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="font-mono text-xs uppercase tracking-wider text-destructive/60">
          Page unavailable.
        </p>
      </div>
    );
  }

  return (
    <div className="sf-wiki-page">
      {/* Header bar */}
      <div className="flex items-center justify-between mb-6">
        <button
          onClick={() => navigate(`/worlds/${worldId}`)}
          className="sf-fill-sweep sf-fill-sweep--secondary px-3 py-1.5 font-mono text-[9px] uppercase tracking-wider text-muted-foreground/50"
        >
          &larr; World Dashboard
        </button>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsEditing(!isEditing)}
            className="sf-fill-sweep sf-fill-sweep--secondary flex items-center gap-1.5 px-3 py-1.5 border border-border/15 text-[10px] uppercase tracking-wider"
          >
            {isEditing ? (
              <>
                <Eye className="w-3 h-3" /> View
              </>
            ) : (
              <>
                <Pencil className="w-3 h-3" /> Edit
              </>
            )}
          </button>
          {toolSource && (
            <button
              onClick={handleViewInTool}
              className="sf-fill-sweep sf-fill-sweep--secondary flex items-center gap-1.5 px-3 py-1.5 border border-border/15 text-[10px] uppercase tracking-wider"
            >
              <ExternalLink className="w-3 h-3" /> View in Tool
            </button>
          )}
        </div>
      </div>

      {/* Cover image */}
      {entry.cover_image_url && !isEditing && (
        <img
          src={entry.cover_image_url}
          alt=""
          className="sf-wiki-cover"
        />
      )}

      {/* Cover upload in edit mode */}
      {isEditing && (
        <label className="sf-wiki-cover-upload block">
          <input
            type="file"
            accept="image/*"
            onChange={handleCoverUpload}
            className="sr-only"
          />
          {entry.cover_image_url ? (
            <img
              src={entry.cover_image_url}
              alt=""
              className="sf-wiki-cover w-full"
            />
          ) : (
            <span>Drop cover image or click to select</span>
          )}
        </label>
      )}

      {/* Title */}
      <h1 className="sf-wiki-title">{entry.title}</h1>
      <div className="sf-wiki-meta flex items-center gap-2">
        <span>{typeLabel.toUpperCase()}</span>
        {layerLabel && (
          <>
            <span className="text-muted-foreground/20">&middot;</span>
            <span>{layerLabel.toUpperCase()}</span>
          </>
        )}
        {isDraft && (
          <span className="ml-2 px-1.5 py-0.5 bg-amber-500/15 text-amber-400 text-[7px] uppercase tracking-widest">
            Draft
          </span>
        )}
      </div>

      {/* Data Profile Infobox */}
      {toolSource && toolData && (
        <DataProfileInfobox
          toolSource={toolSource}
          toolData={toolData}
          onViewInTool={handleViewInTool}
        />
      )}

      {/* Content */}
      <div className="sf-wiki-section-header">Content</div>
      {isEditing ? (
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
            readOnly={false}
            placeholder="Write about this element..."
            saveStatus={saveStatus}
          />
        </Suspense>
      ) : isDraft ? (
        <div className="sf-wiki-draft-prompt">
          This page was auto-generated from your {typeLabel} data.
          <br />
          Click Edit to add prose, context, and links.
        </div>
      ) : entry.content ? (
        <div
          className="sf-wiki-content"
          dangerouslySetInnerHTML={{ __html: processedContent }}
        />
      ) : (
        <div className="sf-wiki-draft-prompt">No content yet. Click Edit to begin.</div>
      )}

      {/* Connection suggestions */}
      {suggestions.length > 0 && (
        <div className="mt-4 space-y-2">
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
                <span className="text-muted-foreground/30 text-xs">
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
              className="sf-fill-sweep sf-fill-sweep--secondary px-3 py-1.5 border border-border/15 text-[10px] uppercase tracking-wider"
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
    <div className="flex items-center gap-2 px-3 py-2 bg-[#0C1019] border border-border/10 text-[10px]">
      <span className="font-mono uppercase tracking-wider text-muted-foreground/40">
        Link detected:
      </span>
      <span className="text-[#5B8DEF] font-medium">
        {suggestion.targetTitle}
      </span>
      <select
        value={connType}
        onChange={(e) => setConnType(e.target.value)}
        title="Connection type"
        className="bg-transparent border border-border/15 px-1.5 py-0.5 text-[9px] uppercase tracking-wider text-foreground/70"
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
        className="sf-fill-sweep sf-fill-sweep--secondary px-2 py-0.5 border border-[#3DFFCD]/20 text-[#3DFFCD]/70 text-[9px] uppercase tracking-wider"
      >
        Add
      </button>
      <button
        type="button"
        onClick={() => onDismiss(suggestion)}
        className="text-muted-foreground/30 hover:text-muted-foreground/60 text-[9px] uppercase tracking-wider"
      >
        Dismiss
      </button>
    </div>
  );
}
