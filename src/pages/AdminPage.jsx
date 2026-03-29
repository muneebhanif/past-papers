import { useMutation, useQuery } from "convex/react";
import { useEffect, useState } from "react";
import { api } from "../lib/api";
import { ImageViewerModal } from "../components/common/ImageViewerModal";

export function AdminPage() {
  const login = useMutation(api.adminPanel.login);
  const logout = useMutation(api.adminPanel.logout);
  const setStatus = useMutation(api.adminPanel.setStatus);
  const listUsersQuery = api.adminPanel.listUsers;
  const createUser = useMutation(api.adminPanel.createUser);
  const updateUser = useMutation(api.adminPanel.updateUser);
  const deleteUser = useMutation(api.adminPanel.deleteUser);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [token, setToken] = useState(() => localStorage.getItem("admin_panel_token") || "");
  const [tab, setTab] = useState("moderation");
  const [activePaper, setActivePaper] = useState(null);
  const [reviewNoteByPaper, setReviewNoteByPaper] = useState({});
  const [userForm, setUserForm] = useState({ username: "", name: "", email: "", image: "" });
  const [editingUserId, setEditingUserId] = useState("");
  const [userMessage, setUserMessage] = useState("");

  const me = useQuery(api.adminPanel.me, token ? { token } : "skip");
  const isAuthorized = Boolean(token && me?.ok);
  const pending = useQuery(api.adminPanel.listPending, isAuthorized ? { token } : "skip") ?? [];
  const users = useQuery(listUsersQuery, isAuthorized ? { token } : "skip") ?? [];

  useEffect(() => {
    if (me?.ok === false) {
      localStorage.removeItem("admin_panel_token");
      setToken("");
    }
  }, [me]);

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
      await deleteUser({ token, userId });
      if (editingUserId === userId) {
        setEditingUserId("");
        setUserForm({ username: "", name: "", email: "", image: "" });
      }
      setUserMessage("User deleted.");
    } catch (err) {
      setUserMessage(err?.message || "Failed to delete user.");
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
          <p className="text-sm text-slate-500">Private moderation and user management panel.</p>
        </div>
        <button
          onClick={onLogout}
          className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-700"
        >
          Sign out
        </button>
      </div>

      <div className="grid gap-3 md:grid-cols-3">
        <div className="rounded-xl bg-slate-50 p-4">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Pending</p>
          <p className="mt-2 text-2xl font-black text-slate-900">{pending.length}</p>
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

      <div className="flex gap-2">
        <button
          onClick={() => setTab("moderation")}
          className={`rounded-full px-4 py-2 text-sm font-semibold ${
            tab === "moderation" ? "bg-blue-600 text-white" : "bg-slate-100 text-slate-700"
          }`}
        >
          Moderation
        </button>
        <button
          onClick={() => setTab("users")}
          className={`rounded-full px-4 py-2 text-sm font-semibold ${
            tab === "users" ? "bg-blue-600 text-white" : "bg-slate-100 text-slate-700"
          }`}
        >
          Users
        </button>
      </div>

      {error ? <p className="text-sm font-semibold text-red-600">{error}</p> : null}

      {tab === "moderation" ? (
        <div className="space-y-3">
          {pending.map((paper) => (
            <div key={paper._id} className="rounded-xl border border-slate-200 p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="text-base font-bold text-slate-900">{paper.title}</p>
                  <p className="text-sm text-slate-500">
                    {paper.department} · {paper.subject} · @{paper.uploader.name}
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
      ) : (
        <div className="grid gap-4 lg:grid-cols-5">
          <section className="rounded-xl border border-slate-200 p-4 lg:col-span-2">
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
            <div className="space-y-2">
              {users.map((user) => (
                <div key={user._id} className="flex items-center justify-between gap-3 rounded-lg bg-slate-50 p-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-bold text-slate-900">@{user.username ?? "no_username"}</p>
                    <p className="truncate text-xs text-slate-500">{user.email ?? "no-email"} · uploads {user.uploadCount}</p>
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

      <ImageViewerModal
        open={Boolean(activePaper)}
        onClose={() => setActivePaper(null)}
        images={[activePaper?.imageUrl, activePaper?.secondImageUrl]}
        title={activePaper?.title ?? "Paper"}
      />
    </div>
  );
}
