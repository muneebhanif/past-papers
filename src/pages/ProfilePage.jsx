import { useConvexAuth, useMutation, useQuery } from "convex/react";
import { useEffect, useState } from "react";
import { api } from "../lib/api";
import { DEPARTMENTS } from "../constants/departments";
import { ACADEMIC_YEARS, PAPER_TYPES } from "../constants/academicOptions";
import { cartoonAvatar } from "../lib/avatar";
import { ImageViewerModal } from "../components/common/ImageViewerModal";

export function ProfilePage() {
  const { isAuthenticated } = useConvexAuth();
  const me = useQuery(api.users.current, isAuthenticated ? {} : "skip");
  const uploads = useQuery(api.papers.listMyUploads, isAuthenticated ? {} : "skip") ?? [];
  const updateProfile = useMutation(api.users.updateProfile);
  const updateMyPaper = useMutation(api.papers.updateMyPaper);
  const deleteMyPaper = useMutation(api.papers.deleteMyPaper);

  const [username, setUsername] = useState("");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [editingPaperId, setEditingPaperId] = useState("");
  const [paperForm, setPaperForm] = useState({
    title: "",
    subject: "",
    teacher: "",
    year: ACADEMIC_YEARS[0],
    type: "Midterm",
    department: "Computer Science",
  });
  const [paperBusy, setPaperBusy] = useState(false);
  const [paperMessage, setPaperMessage] = useState("");
  const [activePreview, setActivePreview] = useState(null);

  useEffect(() => {
    setUsername(me?.username ?? "");
  }, [me?.username]);

  if (!isAuthenticated) {
    return <p className="rounded-xl bg-white p-6 text-sm text-slate-600 shadow-sm">Please sign in to view profile.</p>;
  }

  const onSave = async (e) => {
    e.preventDefault();
    setMessage("");
    setSaving(true);
    try {
      await updateProfile({ username });
      setMessage("Profile updated.");
    } catch (err) {
      setMessage(err?.message || "Could not update profile.");
    } finally {
      setSaving(false);
    }
  };

  const onEditUpload = (paper) => {
    setEditingPaperId(paper._id);
    setPaperForm({
      title: paper.title,
      subject: paper.subject,
      teacher: paper.teacher,
      year: paper.year,
      type: paper.type,
      department: paper.department,
    });
    setPaperMessage("");
  };

  const onSaveUpload = async (e) => {
    e.preventDefault();
    if (!editingPaperId) return;

    setPaperBusy(true);
    setPaperMessage("");
    try {
      await updateMyPaper({
        paperId: editingPaperId,
        ...paperForm,
      });
      setEditingPaperId("");
      setPaperMessage("Upload updated and sent for re-approval.");
    } catch (err) {
      setPaperMessage(err?.message || "Could not update upload.");
    } finally {
      setPaperBusy(false);
    }
  };

  const onDeleteUpload = async (paperId) => {
    if (!window.confirm("Delete this upload permanently?")) {
      return;
    }

    setPaperBusy(true);
    setPaperMessage("");
    try {
      await deleteMyPaper({ paperId });
      if (editingPaperId === paperId) {
        setEditingPaperId("");
      }
      setPaperMessage("Upload deleted.");
    } catch (err) {
      setPaperMessage(err?.message || "Could not delete upload.");
    } finally {
      setPaperBusy(false);
    }
  };

  return (
    <div className="space-y-6 pb-16 xl:pb-0">
      <section className="relative rounded-2xl bg-white p-4 shadow-sm">
        <div className="h-28 rounded-xl bg-gradient-to-r from-blue-100 to-indigo-100" />
        <div className="-mt-10 flex items-end gap-4 px-4">
          <img
            src={cartoonAvatar(me?.username || me?._id)}
            alt={me?.username ?? me?.name ?? "User"}
            className="h-20 w-20 rounded-2xl border-4 border-white object-cover"
          />
          <div className="pb-1">
            <h2 className="text-2xl font-extrabold text-slate-900">@{me?.username ?? "set_username"}</h2>
            <p className="text-sm text-slate-500">Public profile visible by username only.</p>
          </div>
        </div>
      </section>

      <section className="rounded-2xl bg-white p-5 shadow-sm">
        <h3 className="mb-3 text-xl font-bold text-slate-900">Profile Settings</h3>
        <form onSubmit={onSave} className="space-y-3">
          <div>
            <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500">
              Username
            </label>
            <input
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="username"
              className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
              required
            />
          </div>
          {message ? <p className="text-sm font-semibold text-slate-600">{message}</p> : null}

          <button
            type="submit"
            disabled={saving}
            className="rounded-full bg-blue-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
          >
            {saving ? "Saving..." : "Save Profile"}
          </button>
        </form>
      </section>

      <section className="rounded-2xl bg-white p-5 shadow-sm">
        <h3 className="mb-4 text-xl font-bold text-slate-900">My Saved Papers / Uploads ({uploads.length})</h3>
        {paperMessage ? <p className="mb-3 text-sm font-semibold text-slate-600">{paperMessage}</p> : null}

        {editingPaperId ? (
          <form onSubmit={onSaveUpload} className="mb-4 space-y-2 rounded-xl border border-slate-200 p-3">
            <p className="text-sm font-bold text-slate-800">Edit Upload</p>
            <input
              value={paperForm.title}
              onChange={(e) => setPaperForm((p) => ({ ...p, title: e.target.value }))}
              placeholder="Title"
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
              required
            />
            <div className="grid gap-2 md:grid-cols-2">
              <input
                value={paperForm.subject}
                onChange={(e) => setPaperForm((p) => ({ ...p, subject: e.target.value }))}
                placeholder="Subject"
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                required
              />
              <input
                value={paperForm.teacher}
                onChange={(e) => setPaperForm((p) => ({ ...p, teacher: e.target.value }))}
                placeholder="Teacher"
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                required
              />
            </div>
            <div className="grid gap-2 md:grid-cols-3">
              <select
                value={paperForm.type}
                onChange={(e) => setPaperForm((p) => ({ ...p, type: e.target.value }))}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                required
              >
                {PAPER_TYPES.map((paperType) => (
                  <option key={paperType} value={paperType}>{paperType}</option>
                ))}
              </select>
              <select
                value={paperForm.year}
                onChange={(e) => setPaperForm((p) => ({ ...p, year: e.target.value }))}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                required
              >
                {ACADEMIC_YEARS.map((yearOption) => (
                  <option key={yearOption} value={yearOption}>{yearOption}</option>
                ))}
              </select>
              <select
                value={paperForm.department}
                onChange={(e) => setPaperForm((p) => ({ ...p, department: e.target.value }))}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
              >
                {DEPARTMENTS.filter((d) => d !== "All").map((department) => (
                  <option key={department} value={department}>{department}</option>
                ))}
              </select>
            </div>

            <div className="flex gap-2">
              <button
                type="submit"
                disabled={paperBusy}
                className="rounded-lg bg-blue-600 px-3 py-2 text-sm font-semibold text-white disabled:opacity-60"
              >
                Save changes
              </button>
              <button
                type="button"
                onClick={() => setEditingPaperId("")}
                className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-700"
              >
                Cancel
              </button>
            </div>
          </form>
        ) : null}

        <div className="space-y-3">
          {uploads.map((paper) => (
            <article key={paper._id} className="overflow-hidden rounded-xl border border-slate-200 bg-white">
              <div className="flex items-center justify-between gap-3 p-4">
                <div className="min-w-0">
                  <p className="truncate text-base font-bold text-slate-900">{paper.title}</p>
                  <p className="truncate text-sm text-slate-600">{paper.subject} · {paper.teacher} · {paper.type} · {paper.year}</p>
                </div>
                <div className="shrink-0">
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
              </div>

              <button
                type="button"
                onClick={() => setActivePreview(paper)}
                className="block h-56 w-full overflow-hidden border-y border-slate-100 bg-slate-50 md:h-72"
              >
                <img
                  src={paper.imageUrl.includes("?") ? `${paper.imageUrl}&tr=w-1200,q-80` : `${paper.imageUrl}?tr=w-1200,q-80`}
                  alt={paper.title}
                  className="h-full w-full object-cover"
                  loading="lazy"
                  onError={(e) => {
                    e.currentTarget.src = paper.imageUrl;
                  }}
                />
              </button>

              <div className="flex gap-2 p-4">
                <button
                  onClick={() => setActivePreview(paper)}
                  className="rounded-lg bg-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700"
                >
                  Open
                </button>
                <button
                  onClick={() => onEditUpload(paper)}
                  className="rounded-lg bg-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700"
                >
                  Edit
                </button>
                <button
                  onClick={() => void onDeleteUpload(paper._id)}
                  disabled={paperBusy}
                  className="rounded-lg bg-red-100 px-3 py-1.5 text-xs font-semibold text-red-700 disabled:opacity-60"
                >
                  Delete
                </button>
              </div>
              {paper.status === "rejected" && paper.reviewNote ? (
                <p className="mx-4 mb-4 rounded-lg bg-red-50 px-3 py-2 text-xs font-semibold text-red-700">
                  Rejection note: {paper.reviewNote}
                </p>
              ) : null}
            </article>
          ))}
          {!uploads.length ? <p className="text-sm text-slate-500">No uploads yet.</p> : null}
        </div>
      </section>

      <ImageViewerModal
        open={Boolean(activePreview)}
        onClose={() => setActivePreview(null)}
        images={[activePreview?.imageUrl, activePreview?.secondImageUrl]}
        title={activePreview?.title ?? "Paper"}
      />
    </div>
  );
}
