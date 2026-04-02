import { Calendar, CheckCircle, Eye, FileText, GraduationCap, User, XCircle } from "lucide-react";
import { Badge } from "../ui/Badge";
import { EmptyState } from "../ui/EmptyState";
import { StatusBadge } from "../ui/StatusBadge";

export function ModerationTab({ pending, actionLoading, reviewNoteByPaper, setReviewNoteByPaper, onModerate, setActivePaper, formatDate }) {
  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
        <div>
          <h2 className="text-lg font-bold text-slate-900 sm:text-xl">Content Moderation</h2>
          <p className="text-xs text-slate-500 sm:text-sm">Review and approve pending paper submissions</p>
        </div>
        <Badge variant={pending.length > 0 ? "warning" : "success"}>{pending.length} pending review{pending.length !== 1 && "s"}</Badge>
      </div>

      {pending.length === 0 ? (
        <EmptyState icon={CheckCircle} title="All caught up!" description="There are no papers pending review. New submissions will appear here." />
      ) : (
        <div className="space-y-4">
          {pending.map((paper) => (
            <div key={paper._id} className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
              <div className="flex flex-col gap-3 border-b border-slate-100 p-4 sm:flex-row sm:flex-wrap sm:items-start sm:justify-between sm:gap-4 sm:p-5">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="text-lg font-bold text-slate-900">{paper.title}</h3>
                    <StatusBadge status={paper.status} />
                  </div>
                  <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-slate-500">
                    <span className="flex items-center gap-1.5"><GraduationCap className="h-4 w-4" />{paper.department}</span>
                    <span className="flex items-center gap-1.5"><FileText className="h-4 w-4" />{paper.subject}</span>
                    <span className="flex items-center gap-1.5"><User className="h-4 w-4" />@{paper.uploader?.name || "unknown"}</span>
                    <span className="flex items-center gap-1.5"><Calendar className="h-4 w-4" />{formatDate(paper._creationTime || paper.createdAt)}</span>
                  </div>
                </div>
                <button onClick={() => setActivePaper(paper)} className="inline-flex items-center gap-2 self-start rounded-xl bg-slate-100 px-4 py-2.5 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-200">
                  <Eye className="h-4 w-4" />
                  Preview
                </button>
              </div>

              <div className="flex gap-2 border-b border-slate-100 bg-slate-50 p-4">
                {[paper.imageUrl, paper.secondImageUrl].filter(Boolean).map((url, idx) => (
                  <button key={idx} onClick={() => setActivePaper(paper)} className="group relative h-24 w-20 overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm transition-transform hover:scale-105">
                    <img src={url} alt={`Page ${idx + 1}`} className="h-full w-full object-cover" />
                    <div className="absolute inset-0 flex items-center justify-center bg-black/0 transition-colors group-hover:bg-black/30">
                      <Eye className="h-5 w-5 text-white opacity-0 transition-opacity group-hover:opacity-100" />
                    </div>
                  </button>
                ))}
              </div>

              <div className="p-4 sm:p-5">
                <label className="mb-2 block text-sm font-medium text-slate-700">
                  Review Note <span className="text-slate-400">(required for rejection)</span>
                </label>
                <textarea
                  value={reviewNoteByPaper[paper._id] ?? ""}
                  onChange={(e) => setReviewNoteByPaper((prev) => ({ ...prev, [paper._id]: e.target.value }))}
                  placeholder="Add a note explaining your decision..."
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm transition-all focus:border-blue-300 focus:bg-white focus:outline-none focus:ring-4 focus:ring-blue-50"
                  rows={2}
                />
                <div className="mt-3 flex flex-col gap-2 sm:mt-4 sm:flex-row sm:flex-wrap sm:gap-3">
                  <button onClick={() => void onModerate(paper._id, "approved")} disabled={actionLoading} className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-all hover:bg-emerald-700 hover:shadow-md disabled:opacity-50">
                    <CheckCircle className="h-4 w-4" />
                    Approve Paper
                  </button>
                  <button onClick={() => void onModerate(paper._id, "rejected")} disabled={actionLoading} className="inline-flex items-center gap-2 rounded-xl bg-red-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-all hover:bg-red-700 hover:shadow-md disabled:opacity-50">
                    <XCircle className="h-4 w-4" />
                    Reject Paper
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
