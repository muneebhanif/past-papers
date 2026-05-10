import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../lib/api";
import { toast } from "sonner";
import { Heart, Search, Trash2, User, FileText, TrendingUp } from "lucide-react";
import { EmptyState } from "../ui/EmptyState";
import { StatusBadge } from "../ui/StatusBadge";

export function LikesTab({ token, setConfirmModal, setActionLoading }) {
  const likes = useQuery(api.adminPanel.listAllLikes, token ? { token } : "skip") ?? [];
  const deleteLike = useMutation(api.adminPanel.adminDeleteLike);

  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState("newest"); // newest, paper, user

  const filtered = likes.filter((l) => {
    return (
      l.user?.name?.toLowerCase().includes(search.toLowerCase()) ||
      l.paper?.title?.toLowerCase().includes(search.toLowerCase()) ||
      l.user?.email?.toLowerCase().includes(search.toLowerCase())
    );
  });

  const sorted = [...filtered].sort((a, b) => {
    if (sortBy === "newest") return b.createdAt - a.createdAt;
    if (sortBy === "paper") return (a.paper?.title ?? "").localeCompare(b.paper?.title ?? "");
    if (sortBy === "user") return (a.user?.name ?? "").localeCompare(b.user?.name ?? "");
    return 0;
  });

  const onDeleteLike = (like) => {
    setConfirmModal({
      open: true,
      title: "Remove Like",
      message: `Remove like by @${like.user?.name} on "${like.paper?.title}"?`,
      danger: true,
      onConfirm: async () => {
        try {
          setActionLoading(true);
          await deleteLike({ token, likeId: like._id });
          toast.success("Like removed successfully");
        } catch (err) {
          toast.error(err?.message || "Failed to remove like");
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

  // Group likes by paper for stats
  const likesByPaper = {};
  likes.forEach((l) => {
    const key = l.paper?._id ?? "unknown";
    if (!likesByPaper[key]) {
      likesByPaper[key] = { title: l.paper?.title ?? "Unknown", count: 0 };
    }
    likesByPaper[key].count++;
  });
  const topLikedPapers = Object.values(likesByPaper).sort((a, b) => b.count - a.count).slice(0, 5);

  // Group likes by user for stats
  const likesByUser = {};
  likes.forEach((l) => {
    const key = l.user?._id ?? "unknown";
    if (!likesByUser[key]) {
      likesByUser[key] = { name: l.user?.name ?? "Unknown", count: 0 };
    }
    likesByUser[key].count++;
  });
  const topLikers = Object.values(likesByUser).sort((a, b) => b.count - a.count).slice(0, 5);

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Likes Management</h2>
          <p className="text-sm text-slate-500">Monitor and manage all paper likes</p>
        </div>
        <div className="flex items-center gap-2 rounded-full bg-rose-50 px-3 py-1.5 text-xs font-semibold text-rose-700">
          <Heart className="h-3.5 w-3.5" />
          {likes.length} Total Likes
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-rose-100">
              <Heart className="h-5 w-5 text-rose-600" />
            </div>
            <div>
              <p className="text-xl font-bold text-slate-900">{likes.length}</p>
              <p className="text-xs text-slate-500">Total Likes</p>
            </div>
          </div>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-100">
              <FileText className="h-5 w-5 text-indigo-600" />
            </div>
            <div>
              <p className="text-xl font-bold text-slate-900">{Object.keys(likesByPaper).length}</p>
              <p className="text-xs text-slate-500">Liked Papers</p>
            </div>
          </div>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-100">
              <User className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <p className="text-xl font-bold text-slate-900">{Object.keys(likesByUser).length}</p>
              <p className="text-xs text-slate-500">Users Who Liked</p>
            </div>
          </div>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-100">
              <TrendingUp className="h-5 w-5 text-emerald-600" />
            </div>
            <div>
              <p className="text-xl font-bold text-slate-900">
                {Object.keys(likesByPaper).length > 0
                  ? (likes.length / Object.keys(likesByPaper).length).toFixed(1)
                  : "0"}
              </p>
              <p className="text-xs text-slate-500">Avg Likes/Paper</p>
            </div>
          </div>
        </div>
      </div>

      {/* Leaderboards */}
      <div className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h3 className="mb-3 text-sm font-semibold text-slate-900">🔥 Most Liked Papers</h3>
          <div className="space-y-2">
            {topLikedPapers.map((paper, idx) => (
              <div key={idx} className="flex items-center gap-3 rounded-lg bg-slate-50 px-3 py-2">
                <span className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold text-white ${
                  idx === 0 ? "bg-amber-500" : idx === 1 ? "bg-slate-400" : idx === 2 ? "bg-amber-700" : "bg-slate-300"
                }`}>{idx + 1}</span>
                <span className="flex-1 truncate text-sm text-slate-700">{paper.title}</span>
                <span className="rounded-full bg-rose-50 px-2 py-0.5 text-xs font-bold text-rose-600">{paper.count} ❤️</span>
              </div>
            ))}
            {topLikedPapers.length === 0 && <p className="text-sm text-slate-400 py-4 text-center">No data yet</p>}
          </div>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h3 className="mb-3 text-sm font-semibold text-slate-900">👍 Most Active Likers</h3>
          <div className="space-y-2">
            {topLikers.map((user, idx) => (
              <div key={idx} className="flex items-center gap-3 rounded-lg bg-slate-50 px-3 py-2">
                <span className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold text-white ${
                  idx === 0 ? "bg-amber-500" : idx === 1 ? "bg-slate-400" : idx === 2 ? "bg-amber-700" : "bg-slate-300"
                }`}>{idx + 1}</span>
                <span className="flex-1 truncate text-sm text-slate-700">@{user.name}</span>
                <span className="rounded-full bg-blue-50 px-2 py-0.5 text-xs font-bold text-blue-600">{user.count} likes</span>
              </div>
            ))}
            {topLikers.length === 0 && <p className="text-sm text-slate-400 py-4 text-center">No data yet</p>}
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
            placeholder="Search by user or paper..."
            className="w-full rounded-lg border border-slate-200 bg-slate-50 py-2 pl-9 pr-4 text-sm transition-all focus:border-blue-300 focus:bg-white focus:outline-none focus:ring-4 focus:ring-blue-50"
          />
        </div>
        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value)}
          className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700"
        >
          <option value="newest">Newest First</option>
          <option value="paper">By Paper</option>
          <option value="user">By User</option>
        </select>
      </div>

      {/* Likes List */}
      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
        {sorted.length === 0 ? (
          <div className="p-8">
            <EmptyState
              icon={Heart}
              title="No likes found"
              description="Paper likes from users will appear here."
            />
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {sorted.map((like) => (
              <div key={like._id} className="flex items-center gap-4 p-4 transition-colors hover:bg-slate-50">
                {/* Avatar */}
                <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-rose-500 to-pink-600 text-sm font-bold text-white overflow-hidden">
                  {like.user?.image ? (
                    <img src={like.user.image} alt="" className="h-full w-full object-cover" />
                  ) : (
                    (like.user?.name?.[0] ?? "?").toUpperCase()
                  )}
                </div>

                {/* Info */}
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-slate-900 text-sm">@{like.user?.name}</span>
                    <Heart className="h-3.5 w-3.5 text-rose-500 fill-rose-500" />
                    <span className="truncate text-sm text-slate-600">{like.paper?.title}</span>
                  </div>
                  <div className="mt-0.5 flex items-center gap-3 text-xs text-slate-400">
                    <span>{formatDate(like.createdAt)}</span>
                    {like.user?.email && <span>• {like.user.email}</span>}
                    {like.paper?.department && <span>• {like.paper.department}</span>}
                    {like.paper?.status && <StatusBadge status={like.paper.status} />}
                  </div>
                </div>

                {/* Actions */}
                <button
                  onClick={() => onDeleteLike(like)}
                  className="flex-shrink-0 rounded-lg p-2 text-slate-400 transition-colors hover:bg-white hover:text-red-600"
                  title="Remove like"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
