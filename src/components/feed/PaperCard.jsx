import { useConvexAuth, useMutation, useQuery } from "convex/react";
import { useState } from "react";
import { api } from "../../lib/api";
import { cartoonAvatar } from "../../lib/avatar";
import { ImageViewerModal } from "../common/ImageViewerModal";

export function PaperCard({ paper, onRequireAuth, isFocused = false }) {
  const { isAuthenticated } = useConvexAuth();
  const me = useQuery(api.users.current, isAuthenticated ? {} : "skip");
  const toggleLike = useMutation(api.papers.toggleLike);
  const createComment = useMutation(api.comments.create);
  const updateComment = useMutation(api.comments.update);
  const deleteComment = useMutation(api.comments.remove);
  const comments = useQuery(api.comments.listByPaper, { paperId: paper._id }) ?? [];

  const [comment, setComment] = useState("");
  const [isPosting, setIsPosting] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [isViewerOpen, setViewerOpen] = useState(false);
  const [viewerImages, setViewerImages] = useState([]);
  const [menuOpen, setMenuOpen] = useState(false);
  const [downloadError, setDownloadError] = useState("");
  const [showAllComments, setShowAllComments] = useState(false);
  const [editingCommentId, setEditingCommentId] = useState("");
  const [editingCommentValue, setEditingCommentValue] = useState("");
  const [commentActionBusy, setCommentActionBusy] = useState(false);
  const [commentActionError, setCommentActionError] = useState("");

  const safePreviewUrl = paper.imageUrl;
  const secondPreviewUrl = paper.secondImageUrl;
  const safeFeedImageUrl = paper.imageUrl.includes("?")
    ? `${paper.imageUrl}&tr=w-1200,q-80`
    : `${paper.imageUrl}?tr=w-1200,q-80`;
  const safeSecondFeedImageUrl = secondPreviewUrl
    ? (secondPreviewUrl.includes("?")
      ? `${secondPreviewUrl}&tr=w-1200,q-80`
      : `${secondPreviewUrl}?tr=w-1200,q-80`)
    : "";

  const openViewer = (images) => {
    setViewerImages(images.filter(Boolean));
    setViewerOpen(true);
  };

  const onDownload = async () => {
    try {
      setDownloadError("");
      setIsDownloading(true);
      const response = await fetch(safePreviewUrl);
      if (!response.ok) {
        throw new Error("Failed to download file");
      }

      const blob = await response.blob();
      const objectUrl = URL.createObjectURL(blob);
      const a = document.createElement("a");
      const randomPart =
        (globalThis.crypto?.randomUUID?.() ?? `${Date.now()}_${Math.random().toString(36).slice(2)}`)
          .replace(/-/g, "")
          .slice(0, 20);
      a.href = objectUrl;
      a.download = `paper_${randomPart}.jpg`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(objectUrl);
      setMenuOpen(false);
    } catch {
      setDownloadError("Download failed. Please try again.");
    } finally {
      setIsDownloading(false);
    }
  };

  const onSubmitComment = async (e) => {
    e.preventDefault();
    if (!isAuthenticated) {
      onRequireAuth();
      return;
    }
    if (!comment.trim()) return;

    try {
      setIsPosting(true);
      await createComment({ paperId: paper._id, content: comment });
      setComment("");
    } finally {
      setIsPosting(false);
    }
  };

  const onStartEditComment = (item) => {
    setCommentActionError("");
    setEditingCommentId(item._id);
    setEditingCommentValue(item.content);
  };

  const onSaveEditedComment = async (commentId) => {
    if (!editingCommentValue.trim()) {
      setCommentActionError("Comment cannot be empty.");
      return;
    }

    try {
      setCommentActionBusy(true);
      setCommentActionError("");
      await updateComment({ commentId, content: editingCommentValue });
      setEditingCommentId("");
      setEditingCommentValue("");
    } catch (err) {
      setCommentActionError(err?.message || "Could not update comment.");
    } finally {
      setCommentActionBusy(false);
    }
  };

  const onDeleteComment = async (commentId) => {
    if (!window.confirm("Delete this comment?")) {
      return;
    }

    try {
      setCommentActionBusy(true);
      setCommentActionError("");
      await deleteComment({ commentId });
      if (editingCommentId === commentId) {
        setEditingCommentId("");
        setEditingCommentValue("");
      }
    } catch (err) {
      setCommentActionError(err?.message || "Could not delete comment.");
    } finally {
      setCommentActionBusy(false);
    }
  };

  return (
    <article
      data-paper-id={paper._id}
      className={`group overflow-hidden rounded-2xl border bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md ${
        isFocused ? "border-blue-500 ring-2 ring-blue-300/70" : "border-slate-200/60"
      }`}
    >
      <div className="p-5 md:p-6">
        <div className="mb-4 flex items-center gap-3">
          <img
            src={cartoonAvatar(paper.uploader.name || paper.uploader._id)}
            alt={paper.uploader.name}
            className="h-8 w-8 rounded-full object-cover"
            loading="lazy"
          />
          <div>
            <p className="text-sm font-bold text-slate-800">{paper.uploader.name}</p>
            <p className="text-[10px] font-medium text-slate-400">{new Date(paper.createdAt).toLocaleString()}</p>
          </div>
        </div>

        <h3 className="text-lg font-bold text-slate-900 transition group-hover:text-blue-700 md:text-xl">{paper.title}</h3>
        <p className="mt-2 text-sm text-slate-600">{paper.subject} · {paper.teacher} · {paper.type} · {paper.year}</p>

        {paper.isMine ? (
          <div className="mt-2">
            <span
              className={`rounded-full px-2 py-1 text-xs font-bold uppercase tracking-wide ${
                paper.status === "approved"
                  ? "bg-emerald-100 text-emerald-700"
                  : paper.status === "rejected"
                    ? "bg-red-100 text-red-700"
                    : "bg-amber-100 text-amber-700"
              }`}
            >
              My post · {paper.status}
            </span>
          </div>
        ) : null}

        <div className="mt-4 flex flex-wrap gap-2">
          <span className="rounded-md bg-emerald-50 px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-emerald-700">#{paper.subject.replace(/\s+/g, "_")}</span>
          <span className="rounded-md bg-blue-50 px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-blue-700">#{paper.year}</span>
        </div>
      </div>

      {secondPreviewUrl ? (
        <div className="grid h-[24rem] w-full grid-cols-2 overflow-hidden border-y border-slate-100 bg-slate-50 md:h-[32rem] lg:h-[37rem]">
          <button
            type="button"
            onClick={() => openViewer([safePreviewUrl])}
            className="h-full w-full border-r border-slate-100"
            aria-label="Open paper front page"
          >
            <img
              src={safeFeedImageUrl}
              alt={`${paper.title} front page`}
              className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
              loading="lazy"
              onError={(e) => {
                e.currentTarget.src = safePreviewUrl;
              }}
            />
          </button>

          <button
            type="button"
            onClick={() => openViewer([secondPreviewUrl])}
            className="h-full w-full"
            aria-label="Open paper back page"
          >
            <img
              src={safeSecondFeedImageUrl}
              alt={`${paper.title} back page`}
              className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
              loading="lazy"
              onError={(e) => {
                e.currentTarget.src = secondPreviewUrl;
              }}
            />
          </button>
        </div>
      ) : (
        <div className="relative h-[24rem] w-full overflow-hidden border-y border-slate-100 bg-slate-50 md:h-[32rem] lg:h-[37rem]">
          <button
            type="button"
            onClick={() => openViewer([safePreviewUrl])}
            className="h-full w-full"
            aria-label="Open paper"
          >
            <img
              src={safeFeedImageUrl}
              alt={paper.title}
              className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
              loading="lazy"
              onError={(e) => {
                e.currentTarget.src = safePreviewUrl;
              }}
            />
          </button>
        </div>
      )}

      <div className="p-5 md:px-6 md:pb-6 md:pt-4">
        <div className="flex items-center justify-between border-t border-slate-100 pt-3 text-sm text-slate-600">
          <span>{paper.stats.likeCount} likes</span>
          <span>{paper.stats.commentCount} comments</span>
        </div>

        <div className="mt-2 flex flex-wrap items-center gap-2">
          <button
            onClick={() => {
              if (!isAuthenticated) {
                onRequireAuth();
                return;
              }
              void toggleLike({ paperId: paper._id });
            }}
            className={`rounded-lg px-4 py-2 text-sm font-semibold transition ${
              paper.stats.likedByMe
                ? "bg-blue-100 text-blue-700"
                : "bg-slate-100 text-slate-700 hover:bg-slate-200"
            }`}
          >
            Like
          </button>

          <div className="relative ml-auto">
            <button
              type="button"
              onClick={() => setMenuOpen((value) => !value)}
              className="rounded-full bg-slate-100 px-3 py-2 text-sm font-bold text-slate-700 hover:bg-slate-200"
              aria-label="Post menu"
            >
              •••
            </button>

            {menuOpen ? (
              <div className="absolute right-0 top-12 z-20 w-40 rounded-xl border border-slate-200 bg-white p-1 shadow-lg">
                <button
                  type="button"
                  onClick={() => void onDownload()}
                  disabled={isDownloading}
                  className="w-full rounded-lg px-3 py-2 text-left text-sm font-semibold text-slate-700 hover:bg-slate-100 disabled:opacity-60"
                >
                  {isDownloading ? "Downloading..." : "Download"}
                </button>
              </div>
            ) : null}
          </div>
        </div>

        {downloadError ? <p className="mt-2 text-sm font-semibold text-red-600">{downloadError}</p> : null}

        <form onSubmit={onSubmitComment} className="mt-3 flex gap-2">
          <input
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder={isAuthenticated ? "Write a comment..." : "Sign in to comment"}
            disabled={!isAuthenticated || isPosting}
            className="flex-1 rounded-lg border border-slate-200 px-3 py-2 text-sm"
          />
          <button
            type="submit"
            disabled={!isAuthenticated || isPosting || !comment.trim()}
            className="rounded-lg bg-blue-600 px-3 py-2 text-sm font-semibold text-white disabled:opacity-60"
          >
            Post
          </button>
        </form>

        {commentActionError ? <p className="mt-2 text-xs font-semibold text-red-600">{commentActionError}</p> : null}

        <div className="mt-2 space-y-2">
          {(showAllComments ? comments : comments.slice(0, 2)).map((item) => (
            <div key={item._id} className="rounded-lg bg-slate-50 px-3 py-2 text-sm">
              <div className="mb-1 flex items-center gap-2">
                <img
                  src={cartoonAvatar(item.user.name || item.user._id)}
                  alt={item.user.name}
                  className="h-6 w-6 rounded-full object-cover"
                  loading="lazy"
                />
                <span className="font-semibold text-slate-700">{item.user.name}</span>
                {item.editedAt ? (
                  <span className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">edited</span>
                ) : null}
              </div>

              {editingCommentId === item._id ? (
                <div className="space-y-2">
                  <textarea
                    value={editingCommentValue}
                    onChange={(e) => setEditingCommentValue(e.target.value)}
                    rows={2}
                    className="w-full rounded-lg border border-slate-200 px-2 py-1.5 text-sm"
                  />
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => void onSaveEditedComment(item._id)}
                      disabled={commentActionBusy}
                      className="rounded-md bg-blue-600 px-2 py-1 text-xs font-semibold text-white disabled:opacity-60"
                    >
                      Save
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setEditingCommentId("");
                        setEditingCommentValue("");
                      }}
                      disabled={commentActionBusy}
                      className="rounded-md bg-slate-200 px-2 py-1 text-xs font-semibold text-slate-700 disabled:opacity-60"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <p className="text-slate-600">{item.content}</p>
                  {me?._id === item.user._id ? (
                    <div className="mt-2 flex gap-2">
                      <button
                        type="button"
                        onClick={() => onStartEditComment(item)}
                        disabled={commentActionBusy}
                        className="rounded-md bg-slate-200 px-2 py-1 text-[11px] font-semibold text-slate-700 disabled:opacity-60"
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => void onDeleteComment(item._id)}
                        disabled={commentActionBusy}
                        className="rounded-md bg-red-100 px-2 py-1 text-[11px] font-semibold text-red-700 disabled:opacity-60"
                      >
                        Delete
                      </button>
                    </div>
                  ) : null}
                </>
              )}
            </div>
          ))}

          {comments.length > 2 ? (
            <button
              type="button"
              onClick={() => setShowAllComments((value) => !value)}
              className="text-xs font-semibold text-blue-600 hover:text-blue-700"
            >
              {showAllComments ? "Show fewer comments" : `View all ${comments.length} comments`}
            </button>
          ) : null}
        </div>
      </div>

      <ImageViewerModal
        open={isViewerOpen}
        onClose={() => {
          setViewerOpen(false);
          setViewerImages([]);
        }}
        images={viewerImages}
        title={paper.title}
      />
    </article>
  );
}
