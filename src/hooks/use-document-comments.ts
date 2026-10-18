// ---------------------------------------------------------------------------
// useDocumentComments, the comments on one writing document.
//
// Storage: document_comments (supabase/migrations/20261019_document_
// comments.sql). Owner and every collaborator read; owner and editors write.
// The author and their display name are stamped by the server, never sent.
// The anchor is a mark in the document (CommentMark); this is the comment.
//
// Until the migration lands the table is missing: the hook reports
// `unavailable` and the rail says so instead of failing on every action.
// ---------------------------------------------------------------------------

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { mapError } from "@/lib/ship-voice";

export interface DocumentComment {
  id: string;
  documentId: string;
  worldId: string;
  userId: string;
  authorName: string | null;
  body: string;
  quote: string;
  resolvedAt: string | null;
  createdAt: string;
}

const key = (docId: string | undefined) => ["document-comments", docId] as const;

/** PostgREST / Postgres "relation does not exist". */
export function isMissingTable(error: unknown): boolean {
  if (!error || typeof error !== "object") return false;
  const e = error as { code?: string; message?: string };
  if (e.code === "42P01" || e.code === "PGRST205") return true;
  return typeof e.message === "string" && /document_comments/i.test(e.message) && /(does not exist|schema cache)/i.test(e.message);
}

type Row = {
  id: string;
  document_id: string;
  world_id: string;
  user_id: string;
  author_name: string | null;
  body: string;
  quote: string;
  resolved_at: string | null;
  created_at: string;
};

function fromRow(r: Row): DocumentComment {
  return {
    id: r.id,
    documentId: r.document_id,
    worldId: r.world_id,
    userId: r.user_id,
    authorName: r.author_name,
    body: r.body,
    quote: r.quote ?? "",
    resolvedAt: r.resolved_at,
    createdAt: r.created_at,
  };
}

export const COMMENT_BODY_MAX = 4000;
export const COMMENT_QUOTE_MAX = 500;

export function useDocumentComments(docId: string | undefined, worldId: string | undefined) {
  const { user } = useAuth();
  const qc = useQueryClient();
  const { toast } = useToast();

  const query = useQuery<{ comments: DocumentComment[]; unavailable: boolean }>({
    queryKey: key(docId),
    queryFn: async () => {
      const { data, error } = await supabase
        .from("document_comments")
        .select("id, document_id, world_id, user_id, author_name, body, quote, resolved_at, created_at")
        .eq("document_id", docId!)
        .order("created_at", { ascending: true });
      if (error) {
        if (isMissingTable(error)) return { comments: [], unavailable: true };
        throw error;
      }
      return { comments: ((data ?? []) as Row[]).map(fromRow), unavailable: false };
    },
    enabled: !!user && !!docId,
    staleTime: 15_000,
    retry: false,
  });

  const invalidate = () => qc.invalidateQueries({ queryKey: key(docId) });
  const fail = (title: string) => (error: unknown) =>
    toast({ title, description: mapError(error), variant: "destructive" });

  /** File the comment. Resolves to its id, which the caller anchors. */
  const add = useMutation({
    mutationFn: async ({ id, body, quote }: { id: string; body: string; quote: string }) => {
      const { error } = await supabase.from("document_comments").insert({
        id,
        document_id: docId!,
        world_id: worldId!,
        body: body.trim().slice(0, COMMENT_BODY_MAX),
        quote: quote.replace(/\s+/g, " ").trim().slice(0, COMMENT_QUOTE_MAX),
      });
      if (error) throw error;
      return id;
    },
    onSuccess: invalidate,
    onError: fail("COMMENT NOT FILED."),
  });

  const setResolved = useMutation({
    mutationFn: async ({ id, resolved }: { id: string; resolved: boolean }) => {
      const { error } = await supabase
        .from("document_comments")
        .update({ resolved_at: resolved ? new Date().toISOString() : null })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: invalidate,
    onError: fail("COMMENT NOT UPDATED."),
  });

  const remove = useMutation({
    mutationFn: async ({ id }: { id: string }) => {
      const { error } = await supabase.from("document_comments").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: invalidate,
    onError: fail("COMMENT NOT DELETED."),
  });

  return {
    comments: query.data?.comments ?? [],
    unavailable: query.data?.unavailable ?? false,
    isLoading: query.isLoading,
    error: query.error,
    add,
    setResolved,
    remove,
  };
}
