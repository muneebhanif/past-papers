import { useConvexAuth, useMutation, useQuery } from "convex/react";
import { useState, useRef, useEffect } from "react";
import { api } from "../../lib/api";
import { cartoonAvatar } from "../../lib/avatar";
import { ImageViewerModal } from "../common/ImageViewerModal";
import {
  Heart,
  MessageCircle,
  Download,
  MoreHorizontal,
  Send,
  Edit3,
  Trash2,
  X,
  Check,
  Clock,
  CheckCircle2,
  XCircle,
  Expand,
  Bookmark,
  Share2,
  Eye
} from "lucide-react";

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
  const [isLikeAnimating, setIsLikeAnimating] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [secondImageLoaded, setSecondImageLoaded] = useState(false);

  const menuRef = useRef(null);
  const commentInputRef = useRef(null);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const safePreviewUrl = paper.imageUrl;
  const secondPreviewUrl = paper.secondImageUrl;
  const safeFeedImageUrl = paper.imageUrl.includes("?")
    ? `${paper.imageUrl}&tr=w-1200,q-80`
    : `${paper.imageUrl}?tr=w-1200,q-80`;
  const safeSecondFeedImageUrl = secondPreviewUrl
    ? secondPreviewUrl.includes("?")
      ? `${secondPreviewUrl}&tr=w-1200,q-80`
      : `${secondPreviewUrl}?tr=w-1200,q-80`
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
      if (!response.ok) throw new Error("Failed to download file");

      const blob = await response.blob();
      const objectUrl = URL.createObjectURL(blob);
      const a = document.createElement("a");
      const randomPart = (
        globalThis.crypto?.randomUUID?.() ??
        `${Date.now()}_${Math.random().toString(36).slice(2)}`
      )
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

  const handleLike = async () => {
    if (!isAuthenticated) {
      onRequireAuth();
      return;
    }
    setIsLikeAnimating(true);
    setTimeout(() => setIsLikeAnimating(false), 300);
    await toggleLike({ paperId: paper._id });
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
    if (!window.confirm("Delete this comment?")) return;

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

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: date.getFullYear() !== now.getFullYear() ? "numeric" : undefined,
    });
  };

  const StatusBadge = ({ status }) => {
    const config = {
      approved: {
        bg: "bg-emerald-50",
        text: "text-emerald-700",
        border: "border-emerald-200",
        icon: CheckCircle2,
      },
      rejected: {
        bg: "bg-red-50",
        text: "text-red-700",
        border: "border-red-200",
        icon: XCircle,
      },
      pending: {
        bg: "bg-amber-50",
        text: "text-amber-700",
        border: "border-amber-200",
        icon: Clock,
      },
    };
    const { bg, text, border, icon: Icon } = config[status] || config.pending;

    return (
      <span
        className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold ${bg} ${text} ${border}`}
      >
        <Icon className="h-3.5 w-3.5" />
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  const ImageSkeleton = () => (
    <div className="absolute inset-0 animate-pulse bg-gradient-to-br from-slate-200 via-slate-100 to-slate-200">
      <div className="flex h-full items-center justify-center">
        <div className="h-16 w-16 rounded-full bg-slate-300/50" />
      </div>
    </div>
  );

  return (
    <article
      data-paper-id={paper._id}
      className={`group relative overflow-hidden rounded-2xl border bg-white shadow-sm transition-all duration-300 hover:shadow-xl ${
        isFocused
          ? "border-blue-400 ring-4 ring-blue-100"
          : "border-slate-200/80 hover:border-slate-300"
      }`}
    >
      {/* Header */}
      <div className="relative p-5 pb-4 md:p-6 md:pb-4">
        <div className="flex items-start justify-between gap-4">
          {/* User Info */}
          <div className="flex items-center gap-3">
            <div className="relative">
              <img
                src={cartoonAvatar(paper.uploader.name || paper.uploader._id)}
                alt={paper.uploader.name}
                className="h-11 w-11 rounded-full object-cover ring-2 ring-white shadow-sm"
                loading="lazy"
              />
              <div className="absolute -bottom-0.5 -right-0.5 h-3.5 w-3.5 rounded-full border-2 border-white bg-emerald-400" />
            </div>
            <div>
              <p className="font-semibold text-slate-900 hover:text-blue-600 transition-colors cursor-pointer">
                {paper.uploader.name}
              </p>
              <p className="flex items-center gap-1.5 text-xs text-slate-500">
                <Clock className="h-3 w-3" />
                {formatDate(paper.createdAt)}
              </p>
            </div>
          </div>

          {/* Menu */}
          <div className="relative" ref={menuRef}>
            <button
              type="button"
              onClick={() => setMenuOpen((v) => !v)}
              className={`rounded-full p-2 transition-all duration-200 ${
                menuOpen
                  ? "bg-slate-200 text-slate-700"
                  : "text-slate-400 hover:bg-slate-100 hover:text-slate-600"
              }`}
              aria-label="Post menu"
            >
              <MoreHorizontal className="h-5 w-5" />
            </button>

            {/* Dropdown Menu */}
            <div
              className={`absolute right-0 top-full z-30 mt-2 w-48 origin-top-right rounded-xl border border-slate-200 bg-white p-1.5 shadow-xl transition-all duration-200 ${
                menuOpen
                  ? "scale-100 opacity-100"
                  : "pointer-events-none scale-95 opacity-0"
              }`}
            >
              <button
                type="button"
                onClick={() => void onDownload()}
                disabled={isDownloading}
                className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50 disabled:opacity-50"
              >
                <Download
                  className={`h-4 w-4 ${isDownloading ? "animate-bounce" : ""}`}
                />
                {isDownloading ? "Downloading..." : "Download Paper"}
              </button>
              <button
                type="button"
                className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50"
              >
                <Bookmark className="h-4 w-4" />
                Save for Later
              </button>
              <button
                type="button"
                className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50"
              >
                <Share2 className="h-4 w-4" />
                Share
              </button>
              <div className="my-1 border-t border-slate-100" />
              <button
                type="button"
                onClick={() => {
                  openViewer([safePreviewUrl, secondPreviewUrl]);
                  setMenuOpen(false);
                }}
                className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50"
              >
                <Eye className="h-4 w-4" />
                View Full Size
              </button>
            </div>
          </div>
        </div>

        {/* Title & Meta */}
        <div className="mt-4">
          <h3 className="text-lg font-bold leading-snug text-slate-900 transition-colors group-hover:text-blue-600 md:text-xl">
            {paper.title}
          </h3>
          <div className="mt-2 flex flex-wrap items-center gap-2 text-sm text-slate-500">
            <span className="inline-flex items-center gap-1 rounded-md bg-slate-100 px-2 py-0.5 font-medium">
              {paper.subject}
            </span>
            <span className="text-slate-300">•</span>
            <span>{paper.teacher}</span>
            <span className="text-slate-300">•</span>
            <span>{paper.type}</span>
            <span className="text-slate-300">•</span>
            <span className="font-semibold text-slate-700">{paper.year}</span>
          </div>
        </div>

        {/* Status Badge */}
        {paper.isMine && (
          <div className="mt-3 flex items-center gap-2">
            <span className="text-xs font-medium text-slate-400">Your post</span>
            <StatusBadge status={paper.status} />
          </div>
        )}

        {/* Tags */}
        <div className="mt-4 flex flex-wrap gap-2">
          <span className="rounded-full bg-gradient-to-r from-emerald-50 to-teal-50 px-3 py-1 text-xs font-semibold text-emerald-700 ring-1 ring-emerald-200/50">
            #{paper.subject.replace(/\s+/g, "")}
          </span>
          <span className="rounded-full bg-gradient-to-r from-blue-50 to-indigo-50 px-3 py-1 text-xs font-semibold text-blue-700 ring-1 ring-blue-200/50">
            #{paper.year}
          </span>
          <span className="rounded-full bg-gradient-to-r from-purple-50 to-pink-50 px-3 py-1 text-xs font-semibold text-purple-700 ring-1 ring-purple-200/50">
            #{paper.type.replace(/\s+/g, "")}
          </span>
        </div>
      </div>

      {/* Image Section */}
      {secondPreviewUrl ? (
        <div className="grid h-[22rem] w-full grid-cols-2 gap-0.5 overflow-hidden bg-slate-100 md:h-[30rem] lg:h-[36rem]">
          <button
            type="button"
            onClick={() => openViewer([safePreviewUrl])}
            className="group/img relative h-full w-full overflow-hidden focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-blue-500"
            aria-label="Open paper front page"
          >
            {!imageLoaded && <ImageSkeleton />}
            <img
              src={safeFeedImageUrl}
              alt={`${paper.title} front page`}
              className={`h-full w-full object-cover transition-all duration-500 group-hover/img:scale-105 ${
                imageLoaded ? "opacity-100" : "opacity-0"
              }`}
              loading="lazy"
              onLoad={() => setImageLoaded(true)}
              onError={(e) => {
                e.currentTarget.src = safePreviewUrl;
                setImageLoaded(true);
              }}
            />
            <div className="absolute inset-0 bg-black/0 transition-all duration-300 group-hover/img:bg-black/10" />
            <div className="absolute inset-0 flex items-center justify-center opacity-0 transition-all duration-300 group-hover/img:opacity-100">
              <div className="rounded-full bg-white/90 p-3 shadow-lg backdrop-blur-sm">
                <Expand className="h-5 w-5 text-slate-700" />
              </div>
            </div>
          </button>

          <button
            type="button"
            onClick={() => openViewer([secondPreviewUrl])}
            className="group/img relative h-full w-full overflow-hidden focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-blue-500"
            aria-label="Open paper back page"
          >
            {!secondImageLoaded && <ImageSkeleton />}
            <img
              src={safeSecondFeedImageUrl}
              alt={`${paper.title} back page`}
              className={`h-full w-full object-cover transition-all duration-500 group-hover/img:scale-105 ${
                secondImageLoaded ? "opacity-100" : "opacity-0"
              }`}
              loading="lazy"
              onLoad={() => setSecondImageLoaded(true)}
              onError={(e) => {
                e.currentTarget.src = secondPreviewUrl;
                setSecondImageLoaded(true);
              }}
            />
            <div className="absolute inset-0 bg-black/0 transition-all duration-300 group-hover/img:bg-black/10" />
            <div className="absolute inset-0 flex items-center justify-center opacity-0 transition-all duration-300 group-hover/img:opacity-100">
              <div className="rounded-full bg-white/90 p-3 shadow-lg backdrop-blur-sm">
                <Expand className="h-5 w-5 text-slate-700" />
              </div>
            </div>
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => openViewer([safePreviewUrl])}
          className="group/img relative h-[22rem] w-full overflow-hidden bg-slate-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-blue-500 md:h-[30rem] lg:h-[36rem]"
          aria-label="Open paper"
        >
          {!imageLoaded && <ImageSkeleton />}
          <img
            src={safeFeedImageUrl}
            alt={paper.title}
            className={`h-full w-full object-cover transition-all duration-500 group-hover/img:scale-105 ${
              imageLoaded ? "opacity-100" : "opacity-0"
            }`}
            loading="lazy"
            onLoad={() => setImageLoaded(true)}
            onError={(e) => {
              e.currentTarget.src = safePreviewUrl;
              setImageLoaded(true);
            }}
          />
          <div className="absolute inset-0 bg-black/0 transition-all duration-300 group-hover/img:bg-black/10" />
          <div className="absolute inset-0 flex items-center justify-center opacity-0 transition-all duration-300 group-hover/img:opacity-100">
            <div className="rounded-full bg-white/90 p-4 shadow-lg backdrop-blur-sm">
              <Expand className="h-6 w-6 text-slate-700" />
            </div>
          </div>
        </button>
      )}

      {/* Actions & Comments Section */}
      <div className="p-5 md:p-6">
        {/* Stats Bar */}
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center gap-4">
            {paper.stats.likeCount > 0 && (
              <button className="flex items-center gap-1.5 text-slate-500 transition-colors hover:text-slate-700">
                <div className="flex -space-x-1.5">
                  <div className="flex h-5 w-5 items-center justify-center rounded-full bg-gradient-to-br from-rose-400 to-pink-500 text-[10px] text-white ring-2 ring-white">
                    ❤️
                  </div>
                </div>
                <span className="font-medium">{paper.stats.likeCount}</span>
              </button>
            )}
          </div>
          {paper.stats.commentCount > 0 && (
            <button
              onClick={() => commentInputRef.current?.focus()}
              className="text-slate-500 transition-colors hover:text-slate-700"
            >
              <span className="font-medium">{paper.stats.commentCount} comments</span>
            </button>
          )}
        </div>

        {/* Action Buttons */}
        <div className="mt-4 flex items-center border-y border-slate-100 py-2">
          <button
            onClick={handleLike}
            className={`flex flex-1 items-center justify-center gap-2 rounded-lg py-2.5 font-semibold transition-all duration-200 ${
              paper.stats.likedByMe
                ? "text-rose-500"
                : "text-slate-600 hover:bg-slate-50"
            }`}
          >
            <Heart
              className={`h-5 w-5 transition-transform duration-300 ${
                isLikeAnimating ? "scale-125" : "scale-100"
              } ${paper.stats.likedByMe ? "fill-current" : ""}`}
            />
            <span>{paper.stats.likedByMe ? "Liked" : "Like"}</span>
          </button>

          <div className="h-6 w-px bg-slate-200" />

          <button
            onClick={() => commentInputRef.current?.focus()}
            className="flex flex-1 items-center justify-center gap-2 rounded-lg py-2.5 font-semibold text-slate-600 transition-colors hover:bg-slate-50"
          >
            <MessageCircle className="h-5 w-5" />
            <span>Comment</span>
          </button>

          <div className="h-6 w-px bg-slate-200" />

          <button
            onClick={() => void onDownload()}
            disabled={isDownloading}
            className="flex flex-1 items-center justify-center gap-2 rounded-lg py-2.5 font-semibold text-slate-600 transition-colors hover:bg-slate-50 disabled:opacity-50"
          >
            <Download className={`h-5 w-5 ${isDownloading ? "animate-bounce" : ""}`} />
            <span>{isDownloading ? "..." : "Download"}</span>
          </button>
        </div>

        {/* Download Error */}
        {downloadError && (
          <div className="mt-3 flex items-center gap-2 rounded-lg bg-red-50 px-3 py-2 text-sm font-medium text-red-600">
            <XCircle className="h-4 w-4 flex-shrink-0" />
            {downloadError}
          </div>
        )}

        {/* Comment Form */}
        <form onSubmit={onSubmitComment} className="mt-4">
          <div className="flex gap-3">
            <img
              src={cartoonAvatar(me?.name || me?._id || "guest")}
              alt="You"
              className="h-9 w-9 flex-shrink-0 rounded-full object-cover ring-2 ring-white shadow-sm"
              loading="lazy"
            />
            <div className="relative flex-1">
              <input
                ref={commentInputRef}
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder={
                  isAuthenticated ? "Write a comment..." : "Sign in to comment"
                }
                disabled={!isAuthenticated || isPosting}
                className="w-full rounded-full border border-slate-200 bg-slate-50 px-4 py-2.5 pr-12 text-sm transition-all duration-200 placeholder:text-slate-400 focus:border-blue-300 focus:bg-white focus:outline-none focus:ring-4 focus:ring-blue-50 disabled:cursor-not-allowed disabled:opacity-50"
              />
              <button
                type="submit"
                disabled={!isAuthenticated || isPosting || !comment.trim()}
                className="absolute right-1.5 top-1/2 -translate-y-1/2 rounded-full bg-blue-500 p-1.5 text-white transition-all duration-200 hover:bg-blue-600 disabled:bg-slate-300 disabled:opacity-50"
              >
                <Send className={`h-4 w-4 ${isPosting ? "animate-pulse" : ""}`} />
              </button>
            </div>
          </div>
        </form>

        {/* Comment Error */}
        {commentActionError && (
          <div className="mt-3 flex items-center gap-2 rounded-lg bg-red-50 px-3 py-2 text-sm font-medium text-red-600">
            <XCircle className="h-4 w-4 flex-shrink-0" />
            {commentActionError}
          </div>
        )}

        {/* Comments List */}
        {comments.length > 0 && (
          <div className="mt-4 space-y-3">
            {(showAllComments ? comments : comments.slice(0, 2)).map((item) => (
              <div
                key={item._id}
                className="group/comment flex gap-3 transition-all duration-200"
              >
                <img
                  src={cartoonAvatar(item.user.name || item.user._id)}
                  alt={item.user.name}
                  className="h-8 w-8 flex-shrink-0 rounded-full object-cover ring-2 ring-white shadow-sm"
                  loading="lazy"
                />
                <div className="flex-1">
                  {editingCommentId === item._id ? (
                    <div className="space-y-2">
                      <textarea
                        value={editingCommentValue}
                        onChange={(e) => setEditingCommentValue(e.target.value)}
                        rows={2}
                        autoFocus
                        className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm transition-all duration-200 focus:border-blue-300 focus:outline-none focus:ring-4 focus:ring-blue-50"
                      />
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => void onSaveEditedComment(item._id)}
                          disabled={commentActionBusy}
                          className="inline-flex items-center gap-1.5 rounded-lg bg-blue-500 px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-blue-600 disabled:opacity-50"
                        >
                          <Check className="h-3.5 w-3.5" />
                          Save
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setEditingCommentId("");
                            setEditingCommentValue("");
                          }}
                          disabled={commentActionBusy}
                          className="inline-flex items-center gap-1.5 rounded-lg bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-600 transition-colors hover:bg-slate-200 disabled:opacity-50"
                        >
                          <X className="h-3.5 w-3.5" />
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="rounded-2xl rounded-tl-sm bg-slate-100 px-4 py-2.5">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold text-slate-900">
                          {item.user.name}
                        </span>
                        {item.editedAt && (
                          <span className="text-[10px] font-medium text-slate-400">
                            • edited
                          </span>
                        )}
                      </div>
                      <p className="mt-0.5 text-sm text-slate-600">{item.content}</p>
                    </div>
                  )}

                  {/* Comment Actions */}
                  {me?._id === item.user._id && editingCommentId !== item._id && (
                    <div className="mt-1 flex items-center gap-3 pl-2 opacity-0 transition-opacity duration-200 group-hover/comment:opacity-100">
                      <button
                        type="button"
                        onClick={() => onStartEditComment(item)}
                        disabled={commentActionBusy}
                        className="flex items-center gap-1 text-xs font-medium text-slate-500 transition-colors hover:text-blue-600 disabled:opacity-50"
                      >
                        <Edit3 className="h-3 w-3" />
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => void onDeleteComment(item._id)}
                        disabled={commentActionBusy}
                        className="flex items-center gap-1 text-xs font-medium text-slate-500 transition-colors hover:text-red-600 disabled:opacity-50"
                      >
                        <Trash2 className="h-3 w-3" />
                        Delete
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}

            {/* Show More Comments */}
            {comments.length > 2 && (
              <button
                type="button"
                onClick={() => setShowAllComments((v) => !v)}
                className="ml-11 text-sm font-semibold text-blue-600 transition-colors hover:text-blue-700"
              >
                {showAllComments
                  ? "Show fewer comments"
                  : `View all ${comments.length} comments`}
              </button>
            )}
          </div>
        )}
      </div>

      {/* Image Viewer Modal */}
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