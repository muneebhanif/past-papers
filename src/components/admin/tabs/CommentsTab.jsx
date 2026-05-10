import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../lib/api";
import { toast } from "sonner";
import {
  Edit3, Eye, MessageSquare, CornerDownRight, Save, Search,
  Trash2, User, FileText, X, Filter, AlertCircle
} from "lucide-react";
import { EmptyState } from "../ui/EmptyState";
import { StatusBadge } from "../ui/StatusBadge";

export function CommentsTab({ token, setConfirmModal, actionLoading, setActionLoading }) {
  const comments = useQuery(api.adminPanel.listAllComments, token ? { token } : "skip") ?? [];
  const updateComment = useMutation(api.adminPanel.adminUpdateComment);
  const deleteComment = useMutation(api.adminPanel.adminDeleteComment);

  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState("all"); // all, comments, replies
  const [editingId, setEditingId] = useState(null);
  const [editContent, setEditContent] = useState("");
  const [expandedId, setExpandedId] = useState(null);

  const filtered = comments.filter((c) => {
    const matchesSearch =
      c.content?.toLowerCase().includes(search.toLowerCase()) ||
      c.user?.name?.toLowerCase().includes(search.toLowerCase()) ||
      c.paper?.title?.toLowerCase().includes(search.toLowerCase());
    const matchesType =
      filterType === "all" ||
      (filterType === "replies" && c.isReply) ||
      (filterType === "comments" && !c.isReply);
    return matchesSearch && matchesType;
  });

  const onEditComment = (comment) => {
    setEditingId(comment._id);
    setEditContent(comment.content);
  };

  const onSaveEdit = async () => {
    try {
      setActionLoading(true);
      await updateComment({ token, commentId: editingId, content: editContent });
      toast.success("Comment updated successfully");
      setEditingId(null);
      setEditContent("");
    } catch (err) {
      toast.error(err?.message || "Failed to update comment");
    } finally {
      setActionLoading(false);
    }
  };

  const onDeleteComment = (comment) => {
    setConfirmModal({
      open: true,
      title: "Delete Comment",
      message: `Delete comment by @${comment.user?.name} on "${comment.paper?.title}"? This cannot be undone.`,
      danger: true,
      onConfirm: async () => {
        try {
          setActionLoading(true);
          await deleteComment({ token, commentId: comment._id });
          toast.success("Comment deleted successfully");
        } catch (err) {
          toast.error(err?.message || "Failed to delete comment");
        } finally {
          setActionLoading(false);
          setConfirmModal({ open: false });
        }
      },
    });
  };

  const formatDate = (ts) => {
    const d = new Date(ts);
    return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) +
      " " + d.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });
  };

  const totalComments = comments.filter((c) => !c.isReply).length;
  const totalReplies = comments.filter((c) => c.isReply).length;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Comments Management</h2>
          <p className="text-sm text-slate-500">View, edit, and manage all comments and replies</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 rounded-full bg-blue-50 px-3 py-1.5 text-xs font-semibold text-blue-700">
            <MessageSquare className="h-3.5 w-3.5" />
            {totalComments} Comments
          </div>
          <div className="flex items-center gap-2 rounded-full bg-indigo-50 px-3 py-1.5 text-xs font-semibold text-indigo-700">
            <CornerDownRight className="h-3.5 w-3.5" />
            {totalReplies} Replies
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3 rounded-xl border border-slate-200 bg-white p-4">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search comments, users, papers..."
            className="w-full rounded-lg border border-slate-200 bg-slate-50 py-2 pl-9 pr-4 text-sm transition-all focus:border-blue-300 focus:bg-white focus:outline-none focus:ring-4 focus:ring-blue-50"
          />
        </div>
        <select
          value={filterType}
          onChange={(e) => setFilterType(e.target.value)}
          className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700"
        >
          <option value="all">All ({comments.length})</option>
          <option value="comments">Comments Only ({totalComments})</option>
          <option value="replies">Replies Only ({totalReplies})</option>
        </select>
      </div>

      {/* Comments List */}
      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
        {filtered.length === 0 ? (
          <div className="p-8">
            <EmptyState
              icon={MessageSquare}
              title="No comments found"
              description="Comments and replies from users will appear here."
            />
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {filtered.map((comment) => (
              <div
                key={comment._id}
                className={`p-4 transition-colors hover:bg-slate-50 ${editingId === comment._id ? "bg-blue-50" : ""}`}
              >
                <div className="flex gap-3">
                  {/* Avatar */}
                  <div className="flex-shrink-0">
                    <div className={`flex h-10 w-10 items-center justify-center rounded-full text-sm font-bold text-white overflow-hidden ${
                      comment.isReply
                        ? "bg-gradient-to-br from-indigo-500 to-purple-600"
                        : "bg-gradient-to-br from-blue-500 to-cyan-600"
                    }`}>
                      {comment.user?.image ? (
                        <img src={comment.user.image} alt="" className="h-full w-full object-cover" />
                      ) : (
                        (comment.user?.name?.[0] ?? "?").toUpperCase()
                      )}
                    </div>
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-semibold text-slate-900 text-sm">@{comment.user?.name}</span>
                      {comment.isReply && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-indigo-100 px-2 py-0.5 text-[10px] font-semibold text-indigo-700">
                          <CornerDownRight className="h-2.5 w-2.5" />
                          Reply
                        </span>
                      )}
                      {comment.editedAt && (
                        <span className="text-[10px] text-slate-400 italic">(edited)</span>
                      )}
                      <span className="text-xs text-slate-400">{formatDate(comment.createdAt)}</span>
                    </div>

                    {/* Paper info */}
                    <div className="mt-1 flex items-center gap-2">
                      <FileText className="h-3.5 w-3.5 text-slate-400" />
                      <span className="text-xs text-slate-500 truncate">
                        on <strong>{comment.paper?.title}</strong>
                        {comment.paper?.department && ` • ${comment.paper.department}`}
                      </span>
                      {comment.paper?.status && <StatusBadge status={comment.paper.status} />}
                    </div>

                    {/* Parent comment context */}
                    {comment.isReply && comment.parentContent && (
                      <div className="mt-2 rounded-lg border-l-2 border-slate-300 bg-slate-50 px-3 py-2">
                        <p className="text-xs text-slate-500 italic">Replying to: "{comment.parentContent.slice(0, 100)}{comment.parentContent.length > 100 ? "..." : ""}"</p>
                      </div>
                    )}

                    {/* Comment Content / Edit Mode */}
                    {editingId === comment._id ? (
                      <div className="mt-2 space-y-2">
                        <textarea
                          value={editContent}
                          onChange={(e) => setEditContent(e.target.value)}
                          rows={3}
                          className="w-full rounded-lg border border-blue-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-4 focus:ring-blue-50"
                        />
                        <div className="flex gap-2">
                          <button
                            onClick={onSaveEdit}
                            disabled={actionLoading}
                            className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
                          >
                            <Save className="h-3.5 w-3.5" />
                            Save
                          </button>
                          <button
                            onClick={() => { setEditingId(null); setEditContent(""); }}
                            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                          >
                            <X className="h-3.5 w-3.5" />
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      <p className="mt-2 text-sm text-slate-700 leading-relaxed">
                        {expandedId === comment._id
                          ? comment.content
                          : comment.content.length > 200
                            ? comment.content.slice(0, 200) + "..."
                            : comment.content}
                      </p>
                    )}
                    {comment.content.length > 200 && editingId !== comment._id && (
                      <button
                        onClick={() => setExpandedId(expandedId === comment._id ? null : comment._id)}
                        className="mt-1 text-xs font-semibold text-blue-600 hover:text-blue-700"
                      >
                        {expandedId === comment._id ? "Show less" : "Show more"}
                      </button>
                    )}

                    {/* User details */}
                    {comment.user?.email && (
                      <p className="mt-1 text-xs text-slate-400">
                        <User className="mr-1 inline h-3 w-3" />
                        {comment.user.email}
                      </p>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex flex-shrink-0 items-start gap-1">
                    <button
                      onClick={() => onEditComment(comment)}
                      className="rounded-lg p-2 text-slate-400 transition-colors hover:bg-white hover:text-blue-600"
                      title="Edit comment"
                    >
                      <Edit3 className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => onDeleteComment(comment)}
                      className="rounded-lg p-2 text-slate-400 transition-colors hover:bg-white hover:text-red-600"
                      title="Delete comment"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Summary Stats */}
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-100">
              <MessageSquare className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <p className="text-xl font-bold text-slate-900">{totalComments}</p>
              <p className="text-xs text-slate-500">Total Comments</p>
            </div>
          </div>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-100">
              <CornerDownRight className="h-5 w-5 text-indigo-600" />
            </div>
            <div>
              <p className="text-xl font-bold text-slate-900">{totalReplies}</p>
              <p className="text-xs text-slate-500">Total Replies</p>
            </div>
          </div>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-100">
              <Edit3 className="h-5 w-5 text-amber-600" />
            </div>
            <div>
              <p className="text-xl font-bold text-slate-900">{comments.filter((c) => c.editedAt).length}</p>
              <p className="text-xs text-slate-500">Edited Comments</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
