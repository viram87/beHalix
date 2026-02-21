import { useState, useEffect, useCallback } from 'react';
import {
  ThumbsUp,
  ThumbsDown,
  MessageCircle,
  Send,
  Pencil,
  Trash2,
} from 'lucide-react';
import { toast } from 'sonner';
import { api } from '@/lib/api';
import { useLoginModalStore } from '@/store/login-modal-store';
import { Avatar } from '@/components/Avatar';
import { Button } from '@/components/ui/button';
import type { EventCommentItem, CommentReply } from '@/types/event';

type Props = {
  eventId: string;
  currentUserId: string | undefined;
};

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 30) return `${days}d ago`;
  return new Date(iso).toLocaleDateString();
}

function ReplyItem({
  reply,
  onReact,
  onEdit,
  onDelete,
}: {
  reply: CommentReply;
  onReact: (id: string, type: 'like' | 'dislike') => void;
  onEdit: (id: string, text: string) => void;
  onDelete: (id: string) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [editText, setEditText] = useState(reply.text);

  const saveEdit = () => {
    if (!editText.trim()) return;
    onEdit(reply.id, editText.trim());
    setEditing(false);
  };

  return (
    <div className="flex gap-2.5">
      <Avatar avatarId={reply.avatarId} displayName={reply.displayName} size="sm" className="mt-0.5 h-6 w-6 text-[10px]" />
      <div className="min-w-0 flex-1">
        <div className="flex items-baseline gap-2">
          <span className="text-xs font-medium">{reply.displayName}</span>
          <span className="text-[10px] text-muted-foreground">{timeAgo(reply.createdAt)}</span>
        </div>

        {editing ? (
          <div className="flex items-center gap-1.5 mt-1">
            <input
              value={editText}
              onChange={(e) => setEditText(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && saveEdit()}
              className="flex-1 rounded-md border bg-background px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-primary"
              autoFocus
            />
            <button type="button" onClick={saveEdit} className="text-xs text-primary font-medium">Save</button>
            <button type="button" onClick={() => setEditing(false)} className="text-xs text-muted-foreground">Cancel</button>
          </div>
        ) : (
          <p className="text-xs text-foreground/90 mt-0.5">{reply.text}</p>
        )}

        <div className="flex items-center gap-3 mt-1">
          <button
            type="button"
            onClick={() => onReact(reply.id, 'like')}
            className={`flex items-center gap-0.5 text-[10px] transition-colors ${reply.userReaction === 'like' ? 'text-primary font-medium' : 'text-muted-foreground hover:text-foreground'}`}
          >
            <ThumbsUp className="h-3 w-3" />
            {reply.likeCount > 0 && reply.likeCount}
          </button>
          <button
            type="button"
            onClick={() => onReact(reply.id, 'dislike')}
            className={`flex items-center gap-0.5 text-[10px] transition-colors ${reply.userReaction === 'dislike' ? 'text-primary font-medium' : 'text-muted-foreground hover:text-foreground'}`}
          >
            <ThumbsDown className="h-3 w-3" />
            {reply.dislikeCount > 0 && reply.dislikeCount}
          </button>
          {reply.canEdit && !editing && (
            <button type="button" onClick={() => { setEditing(true); setEditText(reply.text); }} className="text-[10px] text-muted-foreground hover:text-foreground">
              Edit
            </button>
          )}
          {reply.canDelete !== false && (
            <button type="button" onClick={() => onDelete(reply.id)} className="text-[10px] text-muted-foreground hover:text-destructive">
              Delete
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function CommentItem({
  comment,
  currentUserId,
  onReact,
  onReply,
  onEdit,
  onDelete,
}: {
  comment: EventCommentItem;
  currentUserId: string | undefined;
  onReact: (id: string, type: 'like' | 'dislike') => void;
  onReply: (parentId: string, text: string) => void;
  onEdit: (id: string, text: string) => void;
  onDelete: (id: string) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [editText, setEditText] = useState(comment.text);
  const [replying, setReplying] = useState(false);
  const [replyText, setReplyText] = useState('');

  const saveEdit = () => {
    if (!editText.trim()) return;
    onEdit(comment.id, editText.trim());
    setEditing(false);
  };

  const submitReply = () => {
    if (!replyText.trim()) return;
    onReply(comment.id, replyText.trim());
    setReplyText('');
    setReplying(false);
  };

  return (
    <div className="flex gap-3">
      <Avatar avatarId={comment.avatarId} displayName={comment.displayName} size="sm" className="mt-0.5 shrink-0" />
      <div className="min-w-0 flex-1">
        <div className="flex items-baseline gap-2">
          <span className="text-sm font-medium">{comment.displayName}</span>
          <span className="text-xs text-muted-foreground">{timeAgo(comment.createdAt)}</span>
        </div>

        {editing ? (
          <div className="flex items-center gap-2 mt-1">
            <input
              value={editText}
              onChange={(e) => setEditText(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && saveEdit()}
              className="flex-1 rounded-md border bg-background px-2.5 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
              autoFocus
            />
            <button type="button" onClick={saveEdit} className="text-sm text-primary font-medium">Save</button>
            <button type="button" onClick={() => setEditing(false)} className="text-sm text-muted-foreground">Cancel</button>
          </div>
        ) : (
          <p className="text-sm text-foreground/90 mt-0.5 leading-relaxed">{comment.text}</p>
        )}

        <div className="flex items-center gap-3 mt-1.5">
          <button
            type="button"
            onClick={() => onReact(comment.id, 'like')}
            className={`flex items-center gap-1 text-xs transition-colors ${comment.userReaction === 'like' ? 'text-primary font-medium' : 'text-muted-foreground hover:text-foreground'}`}
          >
            <ThumbsUp className="h-3.5 w-3.5" />
            {comment.likeCount > 0 && comment.likeCount}
          </button>
          <button
            type="button"
            onClick={() => onReact(comment.id, 'dislike')}
            className={`flex items-center gap-1 text-xs transition-colors ${comment.userReaction === 'dislike' ? 'text-primary font-medium' : 'text-muted-foreground hover:text-foreground'}`}
          >
            <ThumbsDown className="h-3.5 w-3.5" />
            {comment.dislikeCount > 0 && comment.dislikeCount}
          </button>
          {currentUserId && (
            <button
              type="button"
              onClick={() => setReplying(!replying)}
              className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              <MessageCircle className="h-3.5 w-3.5" />
              Reply
            </button>
          )}
          {comment.canEdit && !editing && (
            <button
              type="button"
              onClick={() => { setEditing(true); setEditText(comment.text); }}
              className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              <Pencil className="h-3.5 w-3.5" />
              Edit
            </button>
          )}
          {comment.canDelete && (
            <button
              type="button"
              onClick={() => onDelete(comment.id)}
              className="flex items-center gap-1 text-xs text-muted-foreground hover:text-destructive transition-colors"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          )}
        </div>

        {replying && (
          <div className="flex items-center gap-2 mt-2">
            <input
              type="text"
              placeholder="Write a reply..."
              value={replyText}
              onChange={(e) => setReplyText(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && submitReply()}
              className="flex-1 rounded-md border bg-background px-2.5 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
              autoFocus
            />
            <Button size="sm" onClick={submitReply} disabled={!replyText.trim()}>Reply</Button>
          </div>
        )}

        {comment.replies?.length > 0 && (
          <div className="mt-3 space-y-3 border-l-2 border-muted pl-3">
            {comment.replies.map((r) => (
              <ReplyItem
                key={r.id}
                reply={r}
                onReact={onReact}
                onEdit={onEdit}
                onDelete={onDelete}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export function EventComments({ eventId, currentUserId }: Props) {
  const [comments, setComments] = useState<EventCommentItem[]>([]);
  const [text, setText] = useState('');
  const openLoginModal = useLoginModalStore((s) => s.openLoginModal);

  const fetchComments = useCallback(() => {
    api.get<{ comments: EventCommentItem[] }>(`/events/${eventId}/comments`)
      .then(({ data }) => setComments(data.comments ?? []))
      .catch(() => {});
  }, [eventId]);

  useEffect(() => { fetchComments(); }, [fetchComments]);

  const handleSubmit = async () => {
    if (!text.trim()) return;
    if (!currentUserId) {
      openLoginModal(window.location.pathname);
      return;
    }
    try {
      await api.post(`/events/${eventId}/comments`, { text: text.trim() });
      setText('');
      fetchComments();
    } catch {
      toast.error('Could not post comment');
    }
  };

  const handleReply = async (parentId: string, replyText: string) => {
    try {
      await api.post(`/events/${eventId}/comments`, { text: replyText, parentId });
      fetchComments();
    } catch {
      toast.error('Could not post reply');
    }
  };

  const handleReact = async (commentId: string, type: 'like' | 'dislike') => {
    try {
      await api.post(`/events/${eventId}/comments/${commentId}/react`, { type });
      fetchComments();
    } catch {
      toast.error('Could not update reaction');
    }
  };

  const handleEdit = async (commentId: string, newText: string) => {
    try {
      await api.patch(`/events/${eventId}/comments/${commentId}`, { text: newText });
      fetchComments();
    } catch {
      toast.error('Could not update comment');
    }
  };

  const handleDelete = async (commentId: string) => {
    if (!confirm('Delete this comment?')) return;
    try {
      await api.delete(`/events/${eventId}/comments/${commentId}`);
      fetchComments();
    } catch {
      toast.error('Could not delete comment');
    }
  };

  return (
    <section>
      <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-4 flex items-center gap-2">
        <MessageCircle className="h-4 w-4" />
        Discussion
        {comments.length > 0 && (
          <span className="text-xs font-normal normal-case tracking-normal">({comments.length})</span>
        )}
      </h2>

      {currentUserId && (
        <div className="flex items-center gap-2 mb-6">
          <input
            type="text"
            placeholder="Add a comment..."
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
            className="flex-1 rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary transition-shadow"
          />
          <Button
            size="icon"
            variant="ghost"
            onClick={handleSubmit}
            disabled={!text.trim()}
            className="shrink-0"
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
      )}

      {comments.length === 0 ? (
        <p className="text-sm text-muted-foreground py-2">
          {currentUserId ? 'No comments yet. Start the conversation.' : 'No comments yet.'}
        </p>
      ) : (
        <div className="space-y-5">
          {comments.map((c) => (
            <CommentItem
              key={c.id}
              comment={c}
              currentUserId={currentUserId}
              onReact={handleReact}
              onReply={handleReply}
              onEdit={handleEdit}
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}
    </section>
  );
}
