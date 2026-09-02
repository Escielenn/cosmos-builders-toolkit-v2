// ---------------------------------------------------------------------------
// CommentSection, Comment list + new comment form for community worlds
// ---------------------------------------------------------------------------

import { useState } from "react";
import { Trash2, MessageSquare, User } from "lucide-react";
import { GlassPanel } from "@/components/ui/glass-panel";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Loader } from "@/components/ui/loader";
import { useAuth } from "@/contexts/AuthContext";
import {
  useWorldComments,
  useCreateComment,
  useDeleteComment,
} from "@/hooks/use-world-comments";

interface CommentSectionProps {
  worldId: string;
}

/** Returns a human-friendly "X ago" string */
function timeAgo(dateStr: string): string {
  const seconds = Math.floor(
    (Date.now() - new Date(dateStr).getTime()) / 1000
  );
  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  const months = Math.floor(days / 30);
  return `${months}mo ago`;
}

export default function CommentSection({ worldId }: CommentSectionProps) {
  const { user } = useAuth();
  const { data: comments = [], isLoading } = useWorldComments(worldId);
  const createComment = useCreateComment(worldId);
  const deleteComment = useDeleteComment(worldId);
  const [body, setBody] = useState("");

  const handleSubmit = () => {
    const trimmed = body.trim();
    if (!trimmed) return;
    createComment.mutate(trimmed, {
      onSuccess: () => setBody(""),
    });
  };

  return (
    <GlassPanel className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-2">
        <MessageSquare className="w-4 h-4 text-primary" />
        <h3 className="font-heading text-sm font-light uppercase tracking-[3px] text-emerald">
          Comments
        </h3>
        {comments.length > 0 && (
          <span className="font-mono text-[12px] text-t4">
            {comments.length}
          </span>
        )}
      </div>

      {/* Comment list */}
      {isLoading ? (
        <div className="flex justify-center py-8">
          <Loader size="sm" />
        </div>
      ) : comments.length === 0 ? (
        <p className="font-sans text-sm text-t3 text-center py-6">
          No comments yet. Be the first to share your thoughts.
        </p>
      ) : (
        <div className="space-y-4">
          {comments.map((comment) => (
            <div
              key={comment.id}
              className="flex gap-3 group"
            >
              {/* Avatar placeholder */}
              <div className="w-8 h-8 flex-shrink-0 bg-white/[0.04] border border-white/[0.08] rounded-sm flex items-center justify-center">
                {comment.avatar_url ? (
                  <img
                    src={comment.avatar_url}
                    alt=""
                    className="w-8 h-8 rounded-sm object-cover"
                  />
                ) : (
                  <User className="w-4 h-4 text-t4" />
                )}
              </div>

              <div className="flex-1 min-w-0">
                {/* Name + time */}
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-sans text-xs font-medium text-t2">
                    {comment.display_name}
                  </span>
                  <span className="font-mono text-[12px] text-t4">
                    {timeAgo(comment.created_at)}
                  </span>
                </div>

                {/* Body */}
                <p className="font-sans text-sm text-t2 leading-relaxed whitespace-pre-wrap break-words">
                  {comment.body}
                </p>
              </div>

              {/* Delete button (own comments only) */}
              {user && user.id === comment.user_id && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="w-7 h-7 opacity-0 group-hover:opacity-100 text-t4 hover:text-sf-crimson transition-all"
                  onClick={() => deleteComment.mutate(comment.id)}
                  disabled={deleteComment.isPending}
                  aria-label="Delete comment"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </Button>
              )}
            </div>
          ))}
        </div>
      )}

      {/* New comment form */}
      {user ? (
        <div className="space-y-3 border-t border-white/[0.06] pt-4">
          <Textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder="Share your thoughts on this world..."
            className="min-h-[80px]"
            maxLength={2000}
          />
          <div className="flex items-center justify-between">
            <span className="font-mono text-[12px] text-t4">
              {body.length} / 2000
            </span>
            <Button
              size="sm"
              onClick={handleSubmit}
              disabled={!body.trim() || createComment.isPending}
            >
              {createComment.isPending ? (
                <Loader variant="inline" size="sm" className="mr-1.5" />
              ) : null}
              Post Comment
            </Button>
          </div>
        </div>
      ) : (
        <p className="font-sans text-xs text-t4 text-center border-t border-white/[0.06] pt-4">
          Sign in to leave a comment.
        </p>
      )}
    </GlassPanel>
  );
}
