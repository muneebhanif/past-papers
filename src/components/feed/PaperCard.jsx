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
    <article className="group overflow-hidden rounded-2xl border border-slate-200/60 bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md md:flex md:flex-row">
      <div className="p-5 md:flex-1 md:p-6">
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

        <div className="mt-4 flex flex-wrap gap-2">
          <span className="rounded-md bg-emerald-50 px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-emerald-700">#{paper.subject.replace(/\s+/g, "_")}</span>
          <span className="rounded-md bg-blue-50 px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-blue-700">#{paper.year}</span>
        </div>

        <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-3 text-sm text-slate-600">
          <span>{paper.stats.likeCount} likes</span>
          <span>{paper.stats.commentCount} comments</span>
        </div>

        <div className="mt-2 flex gap-2">
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
          <a
            href={paper.imageUrl}
            target="_blank"
            rel="noreferrer"
            className="rounded-lg bg-slate-100 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-200"
          >
            Preview
          </a>
        </div>

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

      <div className="relative h-44 w-full overflow-hidden bg-slate-50 md:h-auto md:w-52 md:shrink-0">
        <img
          src={`${paper.imageUrl}?tr=w-900,q-75`}
          alt={paper.title}
          className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
          loading="lazy"
        />
        <div className="absolute right-2 top-2 rounded bg-blue-700 px-2 py-1 text-[9px] font-bold text-white">PREVIEW</div>
      </div>
    </article>
  );
}
