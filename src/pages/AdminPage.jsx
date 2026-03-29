import { useMutation, useQuery } from "convex/react";
import { useEffect, useState } from "react";
import { api } from "../lib/api";
import { ImageViewerModal } from "../components/common/ImageViewerModal";

export function AdminPage() {
  // --- Existing Auth & User Mutations ---
  const login = useMutation(api.adminPanel.login);
  const logout = useMutation(api.adminPanel.logout);
  const setStatus = useMutation(api.adminPanel.setStatus);
  const listUsersQuery = api.adminPanel.listUsers;
  const createUser = useMutation(api.adminPanel.createUser);
  const updateUser = useMutation(api.adminPanel.updateUser);
  const deleteUser = useMutation(api.adminPanel.deleteUser);

  // --- New CRUD Mutations & Queries ---
  const updatePaper = useMutation(api.adminPanel.updatePaper);
  const deletePaper = useMutation(api.adminPanel.deletePaper);
  const deleteActivity = useMutation(api.adminPanel.deleteActivity);

  // --- State ---
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [token, setToken] = useState(() => localStorage.getItem("admin_panel_token") || "");
  const [tab, setTab] = useState("moderation");
  const [activePaper, setActivePaper] = useState(null);
  const [reviewNoteByPaper, setReviewNoteByPaper] = useState({});
  
  // User Form State
  const [userForm, setUserForm] = useState({ username: "", name: "", email: "", image: "" });
  const [editingUserId, setEditingUserId] = useState("");
  const [userMessage, setUserMessage] = useState("");

  // Paper Form State
  const [paperForm, setPaperForm] = useState({ title: "", department: "", subject: "" });
  const [editingPaperId, setEditingPaperId] = useState("");
  const [paperMessage, setPaperMessage] = useState("");

  // --- Queries ---
  const me = useQuery(api.adminPanel.me, token ? { token } : "skip");
  const isAuthorized = Boolean(token && me?.ok);
  const pending = useQuery(api.adminPanel.listPending, isAuthorized ? { token } : "skip") ?? [];
  const users = useQuery(listUsersQuery, isAuthorized ? { token } : "skip") ?? [];
  const activity = useQuery(api.adminPanel.listActivity, isAuthorized ? { token, limit: 100 } : "skip") ?? [];
  // Fetch all papers for the full CRUD view
  const allPapers = useQuery(api.adminPanel.listAllPapers, isAuthorized ? { token } : "skip") ?? [];

  useEffect(() => {
    if (me?.ok === false) {
      localStorage.removeItem("admin_panel_token");
      setToken("");
    }
  }, [me]);

  // --- Handlers ---
  const onSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const session = await login({ email, password });
      localStorage.setItem("admin_panel_token", session.token);
      setToken(session.token);
      setPassword("");
    } catch (err) {
      setError(err?.message || "Invalid credentials.");
    } finally {
      setLoading(false);
    }
  };

  const onLogout = async () => {
    if (token) {
      await logout({ token });
    }
    localStorage.removeItem("admin_panel_token");
    setToken("");
  };

  const onModerate = async (paperId, status) => {
    const note = (reviewNoteByPaper[paperId] ?? "").trim();
    setError("");
    try {
      await setStatus({
        token,
        paperId,
        status,
        reviewNote: status === "rejected" ? note : undefined,
      });
      setReviewNoteByPaper((prev) => ({ ...prev, [paperId]: "" }));
    } catch (err) {
      setError(err?.message || "Failed to update paper status.");
    }
  };

  // User CRUD Handlers
  const onSaveUser = async (e) => {
    e.preventDefault();
    setUserMessage("");
    try {
      if (editingUserId) {
        await updateUser({ token, userId: editingUserId, ...userForm });
        setUserMessage("User updated.");
      } else {
        await createUser({ token, ...userForm });
        setUserMessage("User created.");
      }
      setEditingUserId("");
      setUserForm({ username: "", name: "", email: "", image: "" });
    } catch (err) {
      setUserMessage(err?.message || "Failed to save user.");
    }
  };

  const onEditUser = (user) => {
    setEditingUserId(user._id);
    setUserForm({
      username: user.username ?? "",
      name: user.name ?? "",
      email: user.email ?? "",
      image: user.image ?? "",
    });
  };

  const onDeleteUser = async (userId) => {
    setUserMessage("");
    try {
      if (window.confirm("Are you sure you want to delete this user?")) {
        await deleteUser({ token, userId });
        if (editingUserId === userId) {
          setEditingUserId("");
          setUserForm({ username: "", name: "", email: "", image: "" });
        }
        setUserMessage("User deleted.");
      }
    } catch (err) {
      setUserMessage(err?.message || "Failed to delete user.");
    }
  };

  // Paper CRUD Handlers
  const onSavePaper = async (e) => {
    e.preventDefault();
    setPaperMessage("");
    try {
      if (editingPaperId) {
        await updatePaper({ token, paperId: editingPaperId, ...paperForm });
        setPaperMessage("Paper updated.");
        setEditingPaperId("");
        setPaperForm({ title: "", department: "", subject: "" });
      }
    } catch (err) {
      setPaperMessage(err?.message || "Failed to update paper.");
    }
  };

  const onEditPaper = (paper) => {
    setEditingPaperId(paper._id);
    setPaperForm({
      title: paper.title ?? "",
      department: paper.department ?? "",
      subject: paper.subject ?? "",
    });
  };

  const onDeletePaper = async (paperId) => {
    setPaperMessage("");
    try {
      if (window.confirm("Are you sure you want to delete this paper?")) {
        await deletePaper({ token, paperId });
        if (editingPaperId === paperId) {
          setEditingPaperId("");
          setPaperForm({ title: "", department: "", subject: "" });
        }
        setPaperMessage("Paper deleted.");
      }
    } catch (err) {
      setPaperMessage(err?.message || "Failed to delete paper.");
    }
  };

  // Activity CRUD Handlers
  const onDeleteActivity = async (activityId) => {
    try {
      if (window.confirm("Delete this activity/comment?")) {
        await deleteActivity({ token, activityId });
      }
    } catch (err) {
      console.error("Failed to delete activity", err);
    }
  };

  if (!isAuthorized) {
    return (
      <section className="mx-auto max-w-md rounded-2xl bg-white p-6 shadow-sm">
        <h2 className="text-2xl font-extrabold tracking-tight text-slate-900">Private Admin Panel</h2>
        <p className="mt-2 text-sm text-slate-600">
          Enter admin email and password to access moderation controls.
        </p>

        <form onSubmit={onSubmit} className="mt-5 space-y-3">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Admin email"
            className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
            required
          />
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Admin password"
            className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
            required
          />

          {error ? <p className="text-sm font-semibold text-red-600">{error}</p> : null}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-full bg-slate-900 px-4 py-3 text-sm font-bold text-white disabled:opacity-60"
          >
            {loading ? "Signing in..." : "Enter Panel"}
          </button>
        </form>
      </section>
    );
  }

  return (
    <div className="space-y-4 rounded-2xl bg-white p-4 shadow-sm md:p-6">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-4">
        <div>
          <h2 className="text-2xl font-extrabold tracking-tight text-slate-900">Admin Dashboard</h2>
          <p className="text-sm text-slate-500">Private moderation and platform management panel.</p>
        </div>
        <button
          onClick={onLogout}
          className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-700"
        >
          Sign out
        </button>
      </div>

      <div className="grid gap-3 md:grid-cols-4">
        <div className="rounded-xl bg-slate-50 p-4">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Pending</p>
          <p className="mt-2 text-2xl font-black text-slate-900">{pending.length}</p>
        </div>
        <div className="rounded-xl bg-slate-50 p-4">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Total Papers</p>
          <p className="mt-2 text-2xl font-black text-slate-900">{allPapers.length}</p>
        </div>
        <div className="rounded-xl bg-slate-50 p-4">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Users</p>
          <p className="mt-2 text-2xl font-black text-slate-900">{users.length}</p>
        </div>
        <div className="rounded-xl bg-slate-50 p-4">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Admin</p>
          <p className="mt-2 truncate text-sm font-bold text-slate-700">{me?.email}</p>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => setTab("moderation")}
          className={`rounded-full px-4 py-2 text-sm font-semibold ${
            tab === "moderation" ? "bg-blue-600 text-white" : "bg-slate-100 text-slate-700"
          }`}
        >
          Moderation
        </button>
        <button
          onClick={() => setTab("all_papers")}
          className={`rounded-full px-4 py-2 text-sm font-semibold ${
            tab === "all_papers" ? "bg-blue-600 text-white" : "bg-slate-100 text-slate-700"
          }`}
        >
          All Papers
        </button>
        <button
          onClick={() => setTab("users")}
          className={`rounded-full px-4 py-2 text-sm font-semibold ${
            tab === "users" ? "bg-blue-600 text-white" : "bg-slate-100 text-slate-700"
          }`}
        >
          Users
        </button>
        <button
          onClick={() => setTab("activity")}
          className={`rounded-full px-4 py-2 text-sm font-semibold ${
            tab === "activity" ? "bg-blue-600 text-white" : "bg-slate-100 text-slate-700"
          }`}
        >
          Activity
        </button>
      </div>

      {error ? <p className="text-sm font-semibold text-red-600">{error}</p> : null}

      {/* MODERATION TAB */}
      {tab === "moderation" && (
        <div className="space-y-3">
          {pending.map((paper) => (
            <div key={paper._id} className="rounded-xl border border-slate-200 p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="text-base font-bold text-slate-900">{paper.title}</p>
                  <p className="text-sm text-slate-500">
                    {paper.department} · {paper.subject} · @{paper.uploader?.name || 'unknown'}
                  </p>
                </div>
                <button
                  onClick={() => setActivePaper(paper)}
                  className="rounded-lg bg-slate-100 px-3 py-2 text-sm font-semibold text-slate-700"
                >
                  Open preview
                </button>
              </div>

              <textarea
                value={reviewNoteByPaper[paper._id] ?? ""}
                onChange={(e) =>
                  setReviewNoteByPaper((prev) => ({
                    ...prev,
                    [paper._id]: e.target.value,
                  }))
                }
                placeholder="Rejection note (optional for approve, required for reject)"
                className="mt-3 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
                rows={2}
              />

              <div className="mt-3 flex gap-2">
                <button
                  onClick={() => void onModerate(paper._id, "approved")}
                  className="rounded-lg bg-emerald-600 px-3 py-2 text-sm font-semibold text-white"
                >
                  Approve
                </button>
                <button
                  onClick={() => void onModerate(paper._id, "rejected")}
                  className="rounded-lg bg-red-600 px-3 py-2 text-sm font-semibold text-white"
                >
                  Reject
                </button>
              </div>
            </div>
          ))}

          {!pending.length ? (
            <div className="rounded-xl border border-dashed border-slate-300 p-6 text-sm text-slate-500">
              No pending papers.
            </div>
          ) : null}
        </div>
      )}

      {/* ALL PAPERS CRUD TAB */}
      {tab === "all_papers" && (
        <div className="grid gap-4 lg:grid-cols-5">
          <section className="rounded-xl border border-slate-200 p-4 lg:col-span-2 h-fit">
            <h3 className="text-lg font-bold text-slate-900">{editingPaperId ? "Update Paper" : "Select a paper to edit"}</h3>
            <form onSubmit={onSavePaper} className="mt-3 space-y-2">
              <input
                value={paperForm.title}
                onChange={(e) => setPaperForm((p) => ({ ...p, title: e.target.value }))}
                placeholder="Paper Title"
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                required
                disabled={!editingPaperId}
              />
              <input
                value={paperForm.department}
                onChange={(e) => setPaperForm((p) => ({ ...p, department: e.target.value }))}
                placeholder="Department"
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                disabled={!editingPaperId}
              />
              <input
                value={paperForm.subject}
                onChange={(e) => setPaperForm((p) => ({ ...p, subject: e.target.value }))}
                placeholder="Subject"
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                disabled={!editingPaperId}
              />

              {paperMessage ? <p className="text-sm font-semibold text-slate-600">{paperMessage}</p> : null}

              <div className="flex gap-2">
                <button
                  type="submit"
                  disabled={!editingPaperId}
                  className="rounded-lg bg-slate-900 px-3 py-2 text-sm font-semibold text-white disabled:opacity-50"
                >
                  Update Paper
                </button>
                {editingPaperId ? (
                  <button
                    type="button"
                    onClick={() => {
                      setEditingPaperId("");
                      setPaperForm({ title: "", department: "", subject: "" });
                    }}
                    className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-700"
                  >
                    Cancel
                  </button>
                ) : null}
              </div>
            </form>
          </section>

          <section className="rounded-xl border border-slate-200 p-4 lg:col-span-3">
            <h3 className="mb-3 text-lg font-bold text-slate-900">All Database Papers</h3>
            <div className="space-y-2 max-h-[600px] overflow-y-auto pr-2">
              {allPapers.map((paper) => (
                <div key={paper._id} className="flex items-center justify-between gap-3 rounded-lg bg-slate-50 p-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-bold text-slate-900">{paper.title}</p>
                    <p className="truncate text-xs text-slate-500">
                      Status: <span className={`font-semibold ${paper.status === 'approved' ? 'text-emerald-600' : paper.status === 'rejected' ? 'text-red-600' : 'text-amber-600'}`}>{paper.status}</span> · {paper.department}
                    </p>
                  </div>
                  <div className="flex shrink-0 gap-2">
                    <button
                      onClick={() => setActivePaper(paper)}
                      className="rounded-lg bg-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700"
                    >
                      View
                    </button>
                    <button
                      onClick={() => onEditPaper(paper)}
                      className="rounded-lg bg-blue-100 px-3 py-1.5 text-xs font-semibold text-blue-700"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => void onDeletePaper(paper._id)}
                      className="rounded-lg bg-red-100 px-3 py-1.5 text-xs font-semibold text-red-700"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
              {!allPapers.length && <p className="text-sm text-slate-500">No papers found.</p>}
            </div>
          </section>
        </div>
      )}

      {/* USERS CRUD TAB */}
      {tab === "users" && (
        <div className="grid gap-4 lg:grid-cols-5">
          <section className="rounded-xl border border-slate-200 p-4 lg:col-span-2 h-fit">
            <h3 className="text-lg font-bold text-slate-900">{editingUserId ? "Update User" : "Add User"}</h3>
            <form onSubmit={onSaveUser} className="mt-3 space-y-2">
              <input
                value={userForm.username}
                onChange={(e) => setUserForm((p) => ({ ...p, username: e.target.value }))}
                placeholder="username"
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                required
              />
              <input
                value={userForm.name}
                onChange={(e) => setUserForm((p) => ({ ...p, name: e.target.value }))}
                placeholder="name"
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
              />
              <input
                value={userForm.email}
                onChange={(e) => setUserForm((p) => ({ ...p, email: e.target.value }))}
                placeholder="email"
                type="email"
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
              />
              <input
                value={userForm.image}
                onChange={(e) => setUserForm((p) => ({ ...p, image: e.target.value }))}
                placeholder="profile image URL"
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
              />

              {userMessage ? <p className="text-sm font-semibold text-slate-600">{userMessage}</p> : null}

              <div className="flex gap-2">
                <button
                  type="submit"
                  className="rounded-lg bg-slate-900 px-3 py-2 text-sm font-semibold text-white"
                >
                  {editingUserId ? "Update" : "Add user"}
                </button>
                {editingUserId ? (
                  <button
                    type="button"
                    onClick={() => {
                      setEditingUserId("");
                      setUserForm({ username: "", name: "", email: "", image: "" });
                    }}
                    className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-700"
                  >
                    Cancel
                  </button>
                ) : null}
              </div>
            </form>
          </section>

          <section className="rounded-xl border border-slate-200 p-4 lg:col-span-3">
            <h3 className="mb-3 text-lg font-bold text-slate-900">All Users</h3>
            <div className="space-y-2 max-h-[600px] overflow-y-auto pr-2">
              {users.map((user) => (
                <div key={user._id} className="flex items-center justify-between gap-3 rounded-lg bg-slate-50 p-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-bold text-slate-900">@{user.username ?? "no_username"}</p>
                    <p className="truncate text-xs text-slate-500">{user.email ?? "no-email"} · uploads {user.uploadCount || 0}</p>
                  </div>
                  <div className="flex shrink-0 gap-2">
                    <button
                      onClick={() => onEditUser(user)}
                      className="rounded-lg bg-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => void onDeleteUser(user._id)}
                      className="rounded-lg bg-red-100 px-3 py-1.5 text-xs font-semibold text-red-700"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>
      )}

      {/* ACTIVITY TAB */}
      {tab === "activity" && (
        <section className="rounded-xl border border-slate-200 p-4">
          <h3 className="mb-3 text-lg font-bold text-slate-900">Recent Platform Activity</h3>
          <div className="space-y-2">
            {activity.length ? activity.map((item) => (
              <div key={item._id || item.id} className="flex justify-between items-start gap-3 rounded-lg bg-slate-50 p-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-3">
                    <p className="text-sm font-semibold text-slate-800">
                      {item.type === "comment" ? "💬" : "❤️"} @{item.actorName}
                    </p>
                    <p className="text-[11px] text-slate-500">{new Date(item.createdAt).toLocaleString()}</p>
                  </div>
                  <p className="mt-1 text-sm text-slate-700">
                    {item.type === "comment" ? "Commented on" : "Liked"} <span className="font-semibold">{item.paperTitle}</span>
                  </p>
                  {item.type === "comment" && item.content ? (
                    <p className="mt-1 text-xs text-slate-500">“{item.content}”</p>
                  ) : null}
                </div>
                <button
                    onClick={() => void onDeleteActivity(item._id || item.id)}
                    className="shrink-0 rounded-lg bg-red-100 px-2.5 py-1 text-xs font-semibold text-red-700 hover:bg-red-200"
                  >
                    Delete
                  </button>
              </div>
            )) : (
              <p className="rounded-lg bg-slate-50 p-4 text-sm text-slate-500">No activity yet.</p>
            )}
          </div>
        </section>
      )}

      <ImageViewerModal
        open={Boolean(activePaper)}
        onClose={() => setActivePaper(null)}
        images={[activePaper?.imageUrl, activePaper?.secondImageUrl]}
        title={activePaper?.title ?? "Paper"}
      />
    </div>
  );
}