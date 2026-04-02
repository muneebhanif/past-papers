import { useState } from "react";
import {
  Edit3, FileText, Heart, MessageSquare, Plus, Save, Search,
  Trash2, Upload, User, UserPlus, Eye, ChevronDown, ChevronUp,
  Mail, Shield
} from "lucide-react";

export function UsersTab({
  editingUserId,
  userForm,
  setUserForm,
  onSaveUser,
  actionLoading,
  setEditingUserId,
  filteredUsers,
  searchQuery,
  setSearchQuery,
  onEditUser,
  onDeleteUser,
}) {
  const [expandedUserId, setExpandedUserId] = useState(null);
  const [sortBy, setSortBy] = useState("newest"); // newest, uploads, comments, likes

  const sorted = [...filteredUsers].sort((a, b) => {
    if (sortBy === "newest") return (b._creationTime ?? 0) - (a._creationTime ?? 0);
    if (sortBy === "uploads") return (b.uploadCount ?? 0) - (a.uploadCount ?? 0);
    if (sortBy === "comments") return (b.commentCount ?? 0) - (a.commentCount ?? 0);
    if (sortBy === "likes") return (b.likeCount ?? 0) - (a.likeCount ?? 0);
    return 0;
  });

  const totalUploads = filteredUsers.reduce((sum, u) => sum + (u.uploadCount ?? 0), 0);
  const totalComments = filteredUsers.reduce((sum, u) => sum + (u.commentCount ?? 0), 0);
  const totalLikes = filteredUsers.reduce((sum, u) => sum + (u.likeCount ?? 0), 0);
  const admins = filteredUsers.filter((u) => u.isAdmin).length;

  const formatDate = (ts) => {
    if (!ts) return "N/A";
    const d = new Date(ts);
    return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900">User Management</h2>
          <p className="text-sm text-slate-500">Manage platform users, view CRUD operations, and permissions</p>
        </div>
      </div>

      {/* User Stats */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white p-3 shadow-sm">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-100">
            <User className="h-4 w-4 text-blue-600" />
          </div>
          <div>
            <p className="text-lg font-bold text-slate-900">{filteredUsers.length}</p>
            <p className="text-[10px] text-slate-500 font-medium">Total Users</p>
          </div>
        </div>
        <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white p-3 shadow-sm">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-100">
            <Upload className="h-4 w-4 text-indigo-600" />
          </div>
          <div>
            <p className="text-lg font-bold text-slate-900">{totalUploads}</p>
            <p className="text-[10px] text-slate-500 font-medium">Total Uploads</p>
          </div>
        </div>
        <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white p-3 shadow-sm">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-100">
            <MessageSquare className="h-4 w-4 text-emerald-600" />
          </div>
          <div>
            <p className="text-lg font-bold text-slate-900">{totalComments}</p>
            <p className="text-[10px] text-slate-500 font-medium">Total Comments</p>
          </div>
        </div>
        <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white p-3 shadow-sm">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-rose-100">
            <Heart className="h-4 w-4 text-rose-600" />
          </div>
          <div>
            <p className="text-lg font-bold text-slate-900">{totalLikes}</p>
            <p className="text-[10px] text-slate-500 font-medium">Total Likes</p>
          </div>
        </div>
        <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white p-3 shadow-sm">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-amber-100">
            <Shield className="h-4 w-4 text-amber-600" />
          </div>
          <div>
            <p className="text-lg font-bold text-slate-900">{admins}</p>
            <p className="text-[10px] text-slate-500 font-medium">Admin Users</p>
          </div>
        </div>
      </div>

      <div className="grid gap-4">
        {/* User Form */}
        <div className={`rounded-2xl border bg-white p-4 transition-all sm:p-5 ${editingUserId ? "border-blue-300 ring-4 ring-blue-50" : "border-slate-200"}`}>
          <div className="mb-4 flex items-center gap-3">
            <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${editingUserId ? "bg-blue-100" : "bg-emerald-100"}`}>
              {editingUserId ? <Edit3 className="h-5 w-5 text-blue-600" /> : <UserPlus className="h-5 w-5 text-emerald-600" />}
            </div>
            <div>
              <h3 className="font-semibold text-slate-900">{editingUserId ? "Edit User" : "Add New User"}</h3>
              <p className="text-xs text-slate-500">{editingUserId ? "Update user details" : "Create a new user account"}</p>
            </div>
          </div>

          <form onSubmit={onSaveUser} className="space-y-3">
            <div>
              <label className="mb-1 block text-xs font-semibold text-slate-600">Username *</label>
              <input value={userForm.username} onChange={(e) => setUserForm((p) => ({ ...p, username: e.target.value }))} placeholder="username" className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm transition-all focus:border-blue-300 focus:outline-none focus:ring-4 focus:ring-blue-50" required />
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold text-slate-600">Display Name</label>
              <input value={userForm.name} onChange={(e) => setUserForm((p) => ({ ...p, name: e.target.value }))} placeholder="John Doe" className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm transition-all focus:border-blue-300 focus:outline-none focus:ring-4 focus:ring-blue-50" />
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold text-slate-600">Email</label>
              <input value={userForm.email} onChange={(e) => setUserForm((p) => ({ ...p, email: e.target.value }))} placeholder="user@example.com" type="email" className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm transition-all focus:border-blue-300 focus:outline-none focus:ring-4 focus:ring-blue-50" />
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold text-slate-600">Profile Image URL</label>
              <input value={userForm.image} onChange={(e) => setUserForm((p) => ({ ...p, image: e.target.value }))} placeholder="https://..." className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm transition-all focus:border-blue-300 focus:outline-none focus:ring-4 focus:ring-blue-50" />
            </div>

            <div className="flex gap-2 pt-2">
              <button type="submit" disabled={actionLoading} className={`inline-flex flex-1 items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold text-white transition-colors disabled:opacity-50 ${editingUserId ? "bg-blue-600 hover:bg-blue-700" : "bg-emerald-600 hover:bg-emerald-700"}`}>
                {editingUserId ? <Save className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
                {editingUserId ? "Update User" : "Add User"}
              </button>
              {editingUserId ? (
                <button
                  type="button"
                  onClick={() => {
                    setEditingUserId("");
                    setUserForm({ username: "", name: "", email: "", image: "" });
                  }}
                  className="rounded-lg border border-slate-300 px-4 py-2.5 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-50"
                >
                  Cancel
                </button>
              ) : null}
            </div>
          </form>
        </div>

        {/* User List */}
        <div className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-5">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <h3 className="font-semibold text-slate-900">All Users <span className="text-slate-400">({sorted.length})</span></h3>
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="Search users..." className="w-48 rounded-lg border border-slate-200 bg-slate-50 py-1.5 pl-9 pr-3 text-sm" />
              </div>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-sm font-medium text-slate-700"
              >
                <option value="newest">Newest</option>
                <option value="uploads">Most Uploads</option>
                <option value="comments">Most Comments</option>
                <option value="likes">Most Likes</option>
              </select>
            </div>
          </div>

          <div className="max-h-[700px] space-y-2 overflow-y-auto pr-2">
            {sorted.length === 0 ? (
              <p className="py-8 text-center text-sm text-slate-500">No users found</p>
            ) : (
              sorted.map((user) => {
                const isExpanded = expandedUserId === user._id;
                return (
                  <div key={user._id} className={`rounded-xl transition-all ${editingUserId === user._id ? "bg-blue-50 ring-2 ring-blue-200" : "bg-slate-50 hover:bg-slate-100"}`}>
                    {/* Main Row */}
                    <div className="flex items-center justify-between gap-3 p-3">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 text-sm font-bold text-white overflow-hidden">
                          {user.image ? (
                            <img src={user.image} alt="" className="h-full w-full object-cover" />
                          ) : (
                            (user.name || user.username || "?")[0].toUpperCase()
                          )}
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="truncate text-sm font-semibold text-slate-900">@{user.username || "no_username"}</p>
                            {user.isAdmin && (
                              <span className="rounded-full bg-amber-100 px-1.5 py-0.5 text-[10px] font-bold text-amber-700">Admin</span>
                            )}
                          </div>
                          <p className="truncate text-xs text-slate-500">{user.email || "No email"}</p>
                        </div>
                      </div>

                      {/* Quick stats */}
                      <div className="hidden sm:flex items-center gap-3">
                        <div className="flex items-center gap-1 text-xs text-slate-500" title="Uploads">
                          <Upload className="h-3.5 w-3.5" />
                          <span className="font-semibold">{user.uploadCount ?? 0}</span>
                        </div>
                        <div className="flex items-center gap-1 text-xs text-slate-500" title="Comments">
                          <MessageSquare className="h-3.5 w-3.5" />
                          <span className="font-semibold">{user.commentCount ?? 0}</span>
                        </div>
                        <div className="flex items-center gap-1 text-xs text-slate-500" title="Likes given">
                          <Heart className="h-3.5 w-3.5" />
                          <span className="font-semibold">{user.likeCount ?? 0}</span>
                        </div>
                      </div>

                      <div className="flex flex-shrink-0 items-center gap-1">
                        <button
                          onClick={() => setExpandedUserId(isExpanded ? null : user._id)}
                          className="rounded-lg p-2 text-slate-400 transition-colors hover:bg-white hover:text-slate-600"
                          title="Details"
                        >
                          {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                        </button>
                        <button onClick={() => onEditUser(user)} className="rounded-lg p-2 text-slate-400 transition-colors hover:bg-white hover:text-blue-600" title="Edit"><Edit3 className="h-4 w-4" /></button>
                        <button onClick={() => onDeleteUser(user._id)} className="rounded-lg p-2 text-slate-400 transition-colors hover:bg-white hover:text-red-600" title="Delete"><Trash2 className="h-4 w-4" /></button>
                      </div>
                    </div>

                    {/* Expanded Details */}
                    {isExpanded && (
                      <div className="border-t border-slate-200 px-4 py-3 space-y-2">
                        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                          <div className="rounded-lg bg-white p-2.5 shadow-sm">
                            <p className="text-[10px] text-slate-400 font-medium uppercase">User ID</p>
                            <p className="text-xs font-mono text-slate-700 truncate">{user._id}</p>
                          </div>
                          <div className="rounded-lg bg-white p-2.5 shadow-sm">
                            <p className="text-[10px] text-slate-400 font-medium uppercase">Display Name</p>
                            <p className="text-xs text-slate-700">{user.name || "Not set"}</p>
                          </div>
                          <div className="rounded-lg bg-white p-2.5 shadow-sm">
                            <p className="text-[10px] text-slate-400 font-medium uppercase">Email</p>
                            <p className="text-xs text-slate-700 truncate">{user.email || "Not set"}</p>
                          </div>
                          <div className="rounded-lg bg-white p-2.5 shadow-sm">
                            <p className="text-[10px] text-slate-400 font-medium uppercase">Joined</p>
                            <p className="text-xs text-slate-700">{formatDate(user._creationTime)}</p>
                          </div>
                        </div>

                        {/* CRUD Activity for this User */}
                        <div className="rounded-lg bg-white p-3 shadow-sm">
                          <p className="text-xs font-semibold text-slate-700 mb-2">User CRUD Summary</p>
                          <div className="grid grid-cols-3 gap-2">
                            <div className="flex items-center gap-2 rounded-lg bg-indigo-50 p-2">
                              <Upload className="h-4 w-4 text-indigo-600" />
                              <div>
                                <p className="text-sm font-bold text-slate-900">{user.uploadCount ?? 0}</p>
                                <p className="text-[10px] text-slate-500">Papers Uploaded</p>
                              </div>
                            </div>
                            <div className="flex items-center gap-2 rounded-lg bg-blue-50 p-2">
                              <MessageSquare className="h-4 w-4 text-blue-600" />
                              <div>
                                <p className="text-sm font-bold text-slate-900">{user.commentCount ?? 0}</p>
                                <p className="text-[10px] text-slate-500">Comments Made</p>
                              </div>
                            </div>
                            <div className="flex items-center gap-2 rounded-lg bg-rose-50 p-2">
                              <Heart className="h-4 w-4 text-rose-600" />
                              <div>
                                <p className="text-sm font-bold text-slate-900">{user.likeCount ?? 0}</p>
                                <p className="text-[10px] text-slate-500">Likes Given</p>
                              </div>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-3 text-xs text-slate-400">
                          <span className="flex items-center gap-1">
                            <Shield className="h-3 w-3" />
                            {user.isAdmin ? "Admin" : "Regular User"}
                          </span>
                          <span>•</span>
                          <span>{user.isAnonymous ? "Anonymous" : "Authenticated"}</span>
                          {user.emailVerificationTime && (
                            <>
                              <span>•</span>
                              <span className="text-emerald-600">Email Verified</span>
                            </>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
