import { Download, Edit3, Eye, Save, Search, Trash2 } from "lucide-react";
import { StatusBadge } from "../ui/StatusBadge";

export function PapersTab({
  searchQuery,
  setSearchQuery,
  paperStatusFilter,
  setPaperStatusFilter,
  paperDeptFilter,
  setPaperDeptFilter,
  departments,
  editingPaperId,
  paperForm,
  setPaperForm,
  onSavePaper,
  actionLoading,
  setEditingPaperId,
  filteredPapers,
  onEditPaper,
  onDeletePaper,
  setActivePaper,
}) {
  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
        <div>
          <h2 className="text-lg font-bold text-slate-900 sm:text-xl">Paper Management</h2>
          <p className="text-xs text-slate-500 sm:text-sm">View and manage all papers in the database</p>
        </div>
        <button className="inline-flex items-center gap-2 self-start rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-50">
          <Download className="h-4 w-4" />
          Export
        </button>
      </div>

      <div className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-white p-3 sm:flex-row sm:flex-wrap sm:items-center sm:p-4">
        <div className="relative flex-1 min-w-0">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search papers..."
            className="w-full rounded-lg border border-slate-200 bg-slate-50 py-2 pl-9 pr-4 text-sm transition-all focus:border-blue-300 focus:bg-white focus:outline-none focus:ring-4 focus:ring-blue-50"
          />
        </div>
        <div className="flex gap-2">
          <select value={paperStatusFilter} onChange={(e) => setPaperStatusFilter(e.target.value)} className="flex-1 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 sm:flex-none">
            <option value="all">All Status</option>
            <option value="approved">Approved</option>
            <option value="pending">Pending</option>
            <option value="rejected">Rejected</option>
          </select>
          <select value={paperDeptFilter} onChange={(e) => setPaperDeptFilter(e.target.value)} className="flex-1 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 sm:flex-none">
            <option value="all">All Depts</option>
            {departments.map((dept) => (
              <option key={dept} value={dept}>{dept}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid gap-4">
        <div className={`rounded-2xl border bg-white p-4 transition-all sm:p-5 ${editingPaperId ? "border-blue-300 ring-4 ring-blue-50" : "border-slate-200"}`}>
          <div className="mb-4 flex items-center gap-3">
            <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${editingPaperId ? "bg-blue-100" : "bg-slate-100"}`}>
              <Edit3 className={`h-5 w-5 ${editingPaperId ? "text-blue-600" : "text-slate-400"}`} />
            </div>
            <div>
              <h3 className="font-semibold text-slate-900">{editingPaperId ? "Edit Paper" : "Paper Editor"}</h3>
              <p className="text-xs text-slate-500">{editingPaperId ? "Update paper details" : "Select a paper to edit"}</p>
            </div>
          </div>

          <form onSubmit={onSavePaper} className="space-y-3">
            <div>
              <label className="mb-1 block text-xs font-semibold text-slate-600">Title</label>
              <input value={paperForm.title} onChange={(e) => setPaperForm((p) => ({ ...p, title: e.target.value }))} placeholder="Paper title" className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm disabled:bg-slate-50 disabled:text-slate-400" disabled={!editingPaperId} required />
            </div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div>
                <label className="mb-1 block text-xs font-semibold text-slate-600">Department</label>
                <input value={paperForm.department} onChange={(e) => setPaperForm((p) => ({ ...p, department: e.target.value }))} placeholder="Department" className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm disabled:bg-slate-50 disabled:text-slate-400" disabled={!editingPaperId} />
              </div>
              <div>
                <label className="mb-1 block text-xs font-semibold text-slate-600">Subject</label>
                <input value={paperForm.subject} onChange={(e) => setPaperForm((p) => ({ ...p, subject: e.target.value }))} placeholder="Subject" className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm disabled:bg-slate-50 disabled:text-slate-400" disabled={!editingPaperId} />
              </div>
            </div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div>
                <label className="mb-1 block text-xs font-semibold text-slate-600">Teacher</label>
                <input value={paperForm.teacher} onChange={(e) => setPaperForm((p) => ({ ...p, teacher: e.target.value }))} placeholder="Teacher name" className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm disabled:bg-slate-50 disabled:text-slate-400" disabled={!editingPaperId} />
              </div>
              <div>
                <label className="mb-1 block text-xs font-semibold text-slate-600">Year</label>
                <input value={paperForm.year} onChange={(e) => setPaperForm((p) => ({ ...p, year: e.target.value }))} placeholder="Year" className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm disabled:bg-slate-50 disabled:text-slate-400" disabled={!editingPaperId} />
              </div>
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold text-slate-600">Type</label>
              <input value={paperForm.type} onChange={(e) => setPaperForm((p) => ({ ...p, type: e.target.value }))} placeholder="Paper type (Midterm, Final, etc.)" className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm disabled:bg-slate-50 disabled:text-slate-400" disabled={!editingPaperId} />
            </div>

            <div className="flex gap-2 pt-2">
              <button type="submit" disabled={!editingPaperId || actionLoading} className="inline-flex flex-1 items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-blue-700 disabled:opacity-50">
                <Save className="h-4 w-4" />
                Save Changes
              </button>
              {editingPaperId ? (
                <button
                  type="button"
                  onClick={() => {
                    setEditingPaperId("");
                    setPaperForm({ title: "", department: "", subject: "", teacher: "", year: "", type: "" });
                  }}
                  className="rounded-lg border border-slate-300 px-4 py-2.5 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-50"
                >
                  Cancel
                </button>
              ) : null}
            </div>
          </form>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-5">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="font-semibold text-slate-900">All Papers <span className="text-slate-400">({filteredPapers.length})</span></h3>
          </div>
          <div className="max-h-[600px] space-y-2 overflow-y-auto pr-2">
            {filteredPapers.length === 0 ? (
              <p className="py-8 text-center text-sm text-slate-500">No papers found</p>
            ) : (
              filteredPapers.map((paper) => (
                <div key={paper._id} className={`flex flex-col gap-2 rounded-xl p-3 transition-colors sm:flex-row sm:items-center sm:justify-between sm:gap-3 ${editingPaperId === paper._id ? "bg-blue-50 ring-2 ring-blue-200" : "bg-slate-50 hover:bg-slate-100"}`}>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="truncate text-sm font-semibold text-slate-900">{paper.title}</p>
                      <StatusBadge status={paper.status} />
                    </div>
                    <p className="truncate text-xs text-slate-500">{paper.department} • {paper.subject}{paper.year ? ` • ${paper.year}` : ""}</p>
                  </div>
                  <div className="flex flex-shrink-0 items-center gap-1 self-end sm:self-center">
                    <button onClick={() => setActivePaper(paper)} className="rounded-lg p-2 text-slate-400 transition-colors hover:bg-white hover:text-slate-600" title="Preview"><Eye className="h-4 w-4" /></button>
                    <button onClick={() => onEditPaper(paper)} className="rounded-lg p-2 text-slate-400 transition-colors hover:bg-white hover:text-blue-600" title="Edit"><Edit3 className="h-4 w-4" /></button>
                    <button onClick={() => onDeletePaper(paper._id)} className="rounded-lg p-2 text-slate-400 transition-colors hover:bg-white hover:text-red-600" title="Delete"><Trash2 className="h-4 w-4" /></button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
