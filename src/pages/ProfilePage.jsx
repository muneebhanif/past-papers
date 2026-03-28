import { useConvexAuth, useQuery } from "convex/react";
import { api } from "../lib/api";

export function ProfilePage() {
  const { isAuthenticated } = useConvexAuth();
  const me = useQuery(api.users.current, isAuthenticated ? {} : "skip");
  const uploads = useQuery(api.papers.listMyUploads, isAuthenticated ? {} : "skip") ?? [];

  if (!isAuthenticated) {
    return <p className="rounded-xl bg-white p-6 text-sm text-slate-600 shadow-sm">Please sign in to view profile.</p>;
  }

  return (
    <div className="space-y-6 pb-16 xl:pb-0">
      <section className="relative rounded-2xl bg-white p-4 shadow-sm">
        <div className="h-28 rounded-xl bg-gradient-to-r from-blue-100 to-indigo-100" />
        <div className="-mt-10 flex items-end gap-4 px-4">
          <img
            src={me?.image || "https://i.pravatar.cc/100?img=48"}
            alt={me?.name ?? "User"}
            className="h-20 w-20 rounded-2xl border-4 border-white object-cover"
          />
          <div className="pb-1">
            <h2 className="text-2xl font-extrabold text-slate-900">{me?.name ?? "User"}</h2>
            <p className="text-sm text-slate-500">{me?.email}</p>
          </div>
        </div>
      </section>

      <section className="rounded-2xl bg-white p-5 shadow-sm">
        <h3 className="mb-4 text-xl font-bold text-slate-900">My Saved Papers / Uploads ({uploads.length})</h3>
        <div className="space-y-3">
          {uploads.map((paper) => (
            <article key={paper._id} className="rounded-xl bg-slate-50 p-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-base font-bold text-slate-900">{paper.title}</p>
                  <p className="text-sm text-slate-600">{paper.subject} · {paper.teacher} · {paper.year}</p>
                </div>
                <span
                  className={`rounded-full px-3 py-1 text-xs font-semibold ${
                    paper.status === "approved"
                      ? "bg-emerald-100 text-emerald-700"
                      : paper.status === "rejected"
                        ? "bg-red-100 text-red-700"
                        : "bg-amber-100 text-amber-700"
                  }`}
                >
                  {paper.status}
                </span>
              </div>
            </article>
          ))}
          {!uploads.length ? <p className="text-sm text-slate-500">No uploads yet.</p> : null}
        </div>
      </section>
    </div>
  );
}
