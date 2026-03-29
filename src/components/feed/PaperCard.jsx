import { useConvexAuth, useMutation, useQuery } from "convex/react";
import { useState } from "react";
import { api } from "../../lib/api";

export function PaperCard({ paper, onRequireAuth }) {
  const { isAuthenticated } = useConvexAuth();
  const toggleLike = useMutation(api.papers.toggleLike);
  const createComment = useMutation(api.comments.create);
  const comments = useQuery(api.comments.listByPaper, { paperId: paper._id }) ?? [];

  const [comment, setComment] = useState("");
  const [isPosting, setIsPosting] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [isViewerOpen, setViewerOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [downloadError, setDownloadError] = useState("");

  const safePreviewUrl = paper.imageUrl;
  const safeFeedImageUrl = paper.imageUrl.includes("?")
    ? `${paper.imageUrl}&tr=w-1200,q-80`
    : `${paper.imageUrl}?tr=w-1200,q-80`;

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
      a.href = objectUrl;
      a.download = `${paper.title.replace(/[^a-z0-9_-]/gi, "_") || "paper"}.jpg`;
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

  return (
    <article className="group overflow-hidden rounded-2xl border border-slate-200/60 bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
      <div className="p-5 md:p-6">
        <div className="mb-4 flex items-center gap-3">
          <img
            src={paper.uploader.image || "https://i.pravatar.cc/100?img=12"}
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

      <div className="relative aspect-[16/9] w-full overflow-hidden border-y border-slate-100 bg-slate-50">
        <button
          type="button"
          onClick={() => setViewerOpen(true)}
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
        <div className="pointer-events-none absolute right-2 top-2 rounded bg-blue-700 px-2 py-1 text-[9px] font-bold text-white">
          TAP TO OPEN
        </div>
      </div>

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
          <button
            onClick={() => setViewerOpen(true)}
            className="rounded-lg bg-slate-100 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-200"
          >
            Open
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

        <div className="mt-2 space-y-2">
          {comments.slice(0, 3).map((item) => (
            <div key={item._id} className="rounded-lg bg-slate-50 px-3 py-2 text-sm">
              <div className="mb-1 flex items-center gap-2">
                <img
                  src={item.user.image || "https://i.pravatar.cc/100?img=32"}
                  alt={item.user.name}
                  className="h-6 w-6 rounded-full object-cover"
                  loading="lazy"
                />
                <span className="font-semibold text-slate-700">{item.user.name}</span>
              </div>
              <p className="text-slate-600">{item.content}</p>
            </div>
          ))}
        </div>
      </div>

      {isViewerOpen ? (
        <div
          className="fixed inset-0 z-[120] flex items-center justify-center bg-black/80 p-4"
          onClick={() => setViewerOpen(false)}
        >
          <div className="relative max-h-[92vh] w-full max-w-6xl" onClick={(e) => e.stopPropagation()}>
            <button
              type="button"
              onClick={() => setViewerOpen(false)}
              className="absolute right-2 top-2 z-10 rounded-full bg-black/60 px-3 py-1 text-sm font-bold text-white"
            >
              ✕
            </button>
            <img
              src={safePreviewUrl}
              alt={paper.title}
              className="max-h-[92vh] w-full rounded-xl bg-black object-contain"
            />
          </div>
        </div>
      ) : null}
    </article>
  );
}
