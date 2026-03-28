import { useMutation, useQuery } from "convex/react";
import { api } from "../lib/api";

export function AdminPage() {
  const me = useQuery(api.users.current);
  const pending = useQuery(api.papers.listPending, me?.isAdmin ? {} : "skip") ?? [];
  const setStatus = useMutation(api.papers.setStatus);

  if (!me?.isAdmin) {
    return <p className="rounded-xl bg-white p-6 text-sm text-slate-600 shadow-sm">Admin access required.</p>;
  }

  return (
    <div className="rounded-xl bg-white p-4 shadow-sm">
      <h2 className="mb-4 text-xl font-bold text-slate-900">Pending Moderation ({pending.length})</h2>
      <div className="space-y-3">
        {pending.map((paper) => (
          <div key={paper._id} className="rounded-lg border border-slate-200 p-3">
            <p className="font-semibold text-slate-800">{paper.title}</p>
            <p className="text-sm text-slate-500">{paper.department} · {paper.subject} · {paper.uploader.name}</p>
            <div className="mt-2 flex gap-2">
              <button
                onClick={() => setStatus({ paperId: paper._id, status: "approved" })}
                className="rounded-lg bg-emerald-600 px-3 py-2 text-sm font-semibold text-white"
              >
                Approve
              </button>
              <button
                onClick={() => setStatus({ paperId: paper._id, status: "rejected" })}
                className="rounded-lg bg-red-600 px-3 py-2 text-sm font-semibold text-white"
              >
                Reject
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
