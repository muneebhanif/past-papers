import { useAction, useMutation, useQuery } from "convex/react";
import { useEffect, useState } from "react";
import { api } from "../lib/api";
import { ImageViewerModal } from "../components/common/ImageViewerModal";
import { Toast } from "../components/admin/ui/Toast";
import { ConfirmModal } from "../components/admin/ui/ConfirmModal";
import { DashboardTab } from "../components/admin/tabs/DashboardTab";
import { ModerationTab } from "../components/admin/tabs/ModerationTab";
import { PapersTab } from "../components/admin/tabs/PapersTab";
import { UsersTab } from "../components/admin/tabs/UsersTab";
import { ActivityTab } from "../components/admin/tabs/ActivityTab";
import { AnalyticsTab } from "../components/admin/tabs/AnalyticsTab";
import { SettingsTab } from "../components/admin/tabs/SettingsTab";
import { CommentsTab } from "../components/admin/tabs/CommentsTab";
import { LikesTab } from "../components/admin/tabs/LikesTab";
import {
  Shield,
  LogOut,
  FileText,
  Users,
  Activity,
  CheckCircle,
  XCircle,
  Clock,
  Eye,
  Edit3,
  Trash2,
  Search,
  Filter,
  Download,
  MoreVertical,
  ChevronDown,
  ChevronRight,
  BarChart3,
  Settings,
  Bell,
  Moon,
  Sun,
  Menu,
  X,
  RefreshCw,
  Plus,
  Save,
  ArrowUpRight,
  MessageSquare,
  Heart,
  Image,
  Calendar,
  Mail,
  User,
  Lock,
  AlertCircle,
  Loader2,
  Home,
  FolderOpen,
  UserPlus,
  FileCheck,
  FileClock,
  FileX,
  ExternalLink,
  Copy,
  LayoutDashboard,
  GraduationCap,
  CornerDownRight,
} from "lucide-react";

// ============================================================================
// MAIN ADMIN PAGE COMPONENT
// ============================================================================

export function AdminPage() {
  // --- Mutations & Actions ---
  const login = useMutation(api.adminPanel.login);
  const logout = useMutation(api.adminPanel.logout);
  const setStatus = useMutation(api.adminPanel.setStatus);
  const rejectPaperAndCleanup = useAction(api.imagekit.rejectPaperAndCleanup);
  const listUsersQuery = api.adminPanel.listUsers;
  const createUser = useMutation(api.adminPanel.createUser);
  const updateUser = useMutation(api.adminPanel.updateUser);
  const deleteUser = useMutation(api.adminPanel.deleteUser);
  const updatePaper = useMutation(api.adminPanel.updatePaper);
  const deletePaper = useMutation(api.adminPanel.deletePaper);
  const deleteActivity = useMutation(api.adminPanel.deleteActivity);

  // --- State ---
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [token, setToken] = useState(() => {
    if (typeof window === "undefined") {
      return "";
    }
    return sessionStorage.getItem("admin_panel_token") || localStorage.getItem("admin_panel_token") || "";
  });
  const [activeTab, setActiveTab] = useState("dashboard");
  const [activePaper, setActivePaper] = useState(null);
  const [reviewNoteByPaper, setReviewNoteByPaper] = useState({});
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const [toasts, setToasts] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [confirmModal, setConfirmModal] = useState({ open: false, title: "", message: "", onConfirm: null, danger: false });
  const [actionLoading, setActionLoading] = useState(false);
  const [settingsForm, setSettingsForm] = useState(() => ({
    siteName: localStorage.getItem("admin_settings_site_name") || "MUST Past Papers",
    siteDescription:
      localStorage.getItem("admin_settings_site_description") ||
      "Academic archive and moderation dashboard",
    emailNotifications: localStorage.getItem("admin_settings_email_notifications") === "true",
    strictModeration: localStorage.getItem("admin_settings_strict_moderation") === "true",
    maintenanceMode: localStorage.getItem("admin_settings_maintenance_mode") === "true",
  }));

  // User Form State
  const [userForm, setUserForm] = useState({ username: "", name: "", email: "", image: "" });
  const [editingUserId, setEditingUserId] = useState("");

  // Paper Form State
  const [paperForm, setPaperForm] = useState({ title: "", department: "", subject: "", teacher: "", year: "", type: "" });
  const [editingPaperId, setEditingPaperId] = useState("");

  // Filter States
  const [paperStatusFilter, setPaperStatusFilter] = useState("all");
  const [paperDeptFilter, setPaperDeptFilter] = useState("all");
  const [activityTypeFilter, setActivityTypeFilter] = useState("all");

  // --- Queries ---
  const me = useQuery(api.adminPanel.me, token ? { token } : "skip");
  const isAuthorized = Boolean(token && me?.ok);
  const pending = useQuery(api.adminPanel.listPending, isAuthorized ? { token } : "skip") ?? [];
  const users = useQuery(listUsersQuery, isAuthorized ? { token } : "skip") ?? [];
  const activity = useQuery(api.adminPanel.listActivity, isAuthorized ? { token, limit: 100 } : "skip") ?? [];
  const allPapers = useQuery(api.adminPanel.listAllPapers, isAuthorized ? { token } : "skip") ?? [];

  // --- Computed Values ---
  const approvedPapers = allPapers.filter(p => p.status === "approved");
  const rejectedPapers = allPapers.filter(p => p.status === "rejected");
  const pendingPapers = allPapers.filter(p => p.status === "pending");

  const filteredPapers = allPapers.filter(paper => {
    const matchesSearch = paper.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         paper.department?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         paper.subject?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = paperStatusFilter === "all" || paper.status === paperStatusFilter;
    const matchesDept = paperDeptFilter === "all" || paper.department === paperDeptFilter;
    return matchesSearch && matchesStatus && matchesDept;
  });

  const filteredUsers = users.filter(user => 
    user.username?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.email?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredActivity = activity.filter(item => {
    const matchesSearch = item.actorName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         item.paperTitle?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = activityTypeFilter === "all" || item.type === activityTypeFilter;
    return matchesSearch && matchesType;
  });

  const departments = [...new Set(allPapers.map(p => p.department).filter(Boolean))];

  // --- Effects ---
  useEffect(() => {
    const legacyToken = localStorage.getItem("admin_panel_token");
    if (legacyToken && !sessionStorage.getItem("admin_panel_token")) {
      sessionStorage.setItem("admin_panel_token", legacyToken);
    }
    localStorage.removeItem("admin_panel_token");
  }, []);

  useEffect(() => {
    if (me?.ok === false) {
      sessionStorage.removeItem("admin_panel_token");
      localStorage.removeItem("admin_panel_token");
      setToken("");
    }
  }, [me]);

  // --- Toast Helpers ---
  const addToast = (message, type = "info") => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message, type }]);
  };

  const removeToast = (id) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };

  // --- Handlers ---
  const onSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const session = await login({ email, password });
      sessionStorage.setItem("admin_panel_token", session.token);
      localStorage.removeItem("admin_panel_token");
      setToken(session.token);
      setPassword("");
      addToast("Welcome back, Admin!", "success");
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
    sessionStorage.removeItem("admin_panel_token");
    localStorage.removeItem("admin_panel_token");
    setToken("");
    addToast("Signed out successfully", "info");
  };

  const onModerate = async (paperId, status) => {
    const note = (reviewNoteByPaper[paperId] ?? "").trim();
    setError("");

    if (status === "rejected" && !note) {
      addToast("Please add a rejection note before rejecting.", "warning");
      return;
    }

    try {
      setActionLoading(true);
      if (status === "rejected") {
        await rejectPaperAndCleanup({ token, paperId, reviewNote: note });
        addToast("Paper rejected and cleaned up", "success");
      } else {
        await setStatus({ token, paperId, status, reviewNote: undefined });
        addToast("Paper approved successfully", "success");
      }
      setReviewNoteByPaper(prev => ({ ...prev, [paperId]: "" }));
    } catch (err) {
      addToast(err?.message || "Failed to update paper status.", "error");
    } finally {
      setActionLoading(false);
    }
  };

  // User CRUD Handlers
  const onSaveUser = async (e) => {
    e.preventDefault();
    try {
      setActionLoading(true);
      if (editingUserId) {
        await updateUser({ token, userId: editingUserId, ...userForm });
        addToast("User updated successfully", "success");
      } else {
        await createUser({ token, ...userForm });
        addToast("User created successfully", "success");
      }
      setEditingUserId("");
      setUserForm({ username: "", name: "", email: "", image: "" });
    } catch (err) {
      addToast(err?.message || "Failed to save user.", "error");
    } finally {
      setActionLoading(false);
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

  const onDeleteUser = (userId) => {
    setConfirmModal({
      open: true,
      title: "Delete User",
      message: "Are you sure you want to delete this user? This action cannot be undone.",
      danger: true,
      onConfirm: async () => {
        try {
          setActionLoading(true);
          await deleteUser({ token, userId });
          if (editingUserId === userId) {
            setEditingUserId("");
            setUserForm({ username: "", name: "", email: "", image: "" });
          }
          addToast("User deleted successfully", "success");
        } catch (err) {
          addToast(err?.message || "Failed to delete user.", "error");
        } finally {
          setActionLoading(false);
          setConfirmModal({ open: false });
        }
      },
    });
  };

  // Paper CRUD Handlers
  const onSavePaper = async (e) => {
    e.preventDefault();
    try {
      setActionLoading(true);
      if (editingPaperId) {
        await updatePaper({ token, paperId: editingPaperId, ...paperForm });
        addToast("Paper updated successfully", "success");
        setEditingPaperId("");
        setPaperForm({ title: "", department: "", subject: "", teacher: "", year: "", type: "" });
      }
    } catch (err) {
      addToast(err?.message || "Failed to update paper.", "error");
    } finally {
      setActionLoading(false);
    }
  };

  const onEditPaper = (paper) => {
    setEditingPaperId(paper._id);
    setPaperForm({
      title: paper.title ?? "",
      department: paper.department ?? "",
      subject: paper.subject ?? "",
      teacher: paper.teacher ?? "",
      year: paper.year ?? "",
      type: paper.type ?? "",
    });
  };

  const onDeletePaper = (paperId) => {
    setConfirmModal({
      open: true,
      title: "Delete Paper",
      message: "Are you sure you want to delete this paper? This will also remove all associated files and data.",
      danger: true,
      onConfirm: async () => {
        try {
          setActionLoading(true);
          await deletePaper({ token, paperId });
          if (editingPaperId === paperId) {
            setEditingPaperId("");
            setPaperForm({ title: "", department: "", subject: "", teacher: "", year: "", type: "" });
          }
          addToast("Paper deleted successfully", "success");
        } catch (err) {
          addToast(err?.message || "Failed to delete paper.", "error");
        } finally {
          setActionLoading(false);
          setConfirmModal({ open: false });
        }
      },
    });
  };

  // Activity CRUD Handlers
  const onDeleteActivity = (activityId) => {
    setConfirmModal({
      open: true,
      title: "Delete Activity",
      message: "Are you sure you want to delete this activity entry?",
      danger: true,
      onConfirm: async () => {
        try {
          setActionLoading(true);
          await deleteActivity({ token, activityId });
          addToast("Activity deleted", "success");
        } catch (err) {
          addToast("Failed to delete activity", "error");
        } finally {
          setActionLoading(false);
          setConfirmModal({ open: false });
        }
      },
    });
  };

  const onSaveSettings = async (e) => {
    e.preventDefault();
    try {
      setActionLoading(true);
      localStorage.setItem("admin_settings_site_name", settingsForm.siteName);
      localStorage.setItem("admin_settings_site_description", settingsForm.siteDescription);
      localStorage.setItem("admin_settings_email_notifications", String(settingsForm.emailNotifications));
      localStorage.setItem("admin_settings_strict_moderation", String(settingsForm.strictModeration));
      localStorage.setItem("admin_settings_maintenance_mode", String(settingsForm.maintenanceMode));
      addToast("Settings saved successfully", "success");
    } finally {
      setActionLoading(false);
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  };

  // Navigation items - expanded with new tabs
  const navItems = [
    { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
    { id: "moderation", label: "Moderation", icon: FileCheck, badge: pending.length || null },
    { id: "papers", label: "All Papers", icon: FileText },
    { id: "comments", label: "Comments", icon: MessageSquare },
    { id: "likes", label: "Likes", icon: Heart },
    { id: "users", label: "Users", icon: Users },
    { id: "activity", label: "Activity", icon: Activity },
    { id: "analytics", label: "Analytics", icon: BarChart3 },
    { id: "settings", label: "Settings", icon: Settings },
  ];

  // ============================================================================
  // LOGIN SCREEN
  // ============================================================================

  if (!isAuthorized) {
    return (
      <div className="flex min-h-[80vh] items-center justify-center p-4">
        <div className="w-full max-w-md">
          {/* Logo/Header */}
          <div className="mb-8 text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-slate-900 to-slate-700 shadow-lg">
              <Shield className="h-8 w-8 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-slate-900">Admin Panel</h1>
            <p className="mt-1 text-sm text-slate-500">
              Sign in to access the moderation dashboard
            </p>
          </div>

          {/* Login Form */}
          <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl">
            <div className="bg-gradient-to-r from-slate-900 to-slate-800 px-6 py-4">
              <h2 className="font-semibold text-white">Secure Access</h2>
              <p className="text-sm text-slate-300">Enter your admin credentials</p>
            </div>

            <form onSubmit={onSubmit} className="p-6">
              <div className="space-y-4">
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-slate-700">
                    Email Address
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="admin@example.com"
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 py-3 pl-11 pr-4 text-sm transition-all focus:border-blue-300 focus:bg-white focus:outline-none focus:ring-4 focus:ring-blue-50"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="mb-1.5 block text-sm font-medium text-slate-700">
                    Password
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
                    <input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 py-3 pl-11 pr-4 text-sm transition-all focus:border-blue-300 focus:bg-white focus:outline-none focus:ring-4 focus:ring-blue-50"
                      required
                    />
                  </div>
                </div>
              </div>

              {error && (
                <div className="mt-4 flex items-center gap-2 rounded-lg bg-red-50 px-4 py-3 text-sm font-medium text-red-600">
                  <AlertCircle className="h-4 w-4 flex-shrink-0" />
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-slate-900 to-slate-800 px-4 py-3.5 text-sm font-bold text-white shadow-lg transition-all hover:shadow-xl disabled:opacity-60"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Signing in...
                  </>
                ) : (
                  <>
                    <Shield className="h-4 w-4" />
                    Sign In to Admin Panel
                  </>
                )}
              </button>
            </form>
          </div>

          <p className="mt-6 text-center text-xs text-slate-400">
            Protected area. Unauthorized access is prohibited.
          </p>
        </div>
      </div>
    );
  }

  // ============================================================================
  // MAIN ADMIN DASHBOARD
  // ============================================================================

  const isSidebarExpanded = sidebarOpen || mobileSidebarOpen;

  return (
    <div className="flex min-h-screen bg-slate-100">
      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-30 flex w-[280px] flex-col border-r border-slate-200 bg-white transition-all duration-300 sm:w-64 lg:relative lg:translate-x-0 ${
          mobileSidebarOpen ? "translate-x-0" : "-translate-x-full"
        } ${sidebarOpen ? "lg:w-64" : "lg:w-[88px]"}`}
      >
        {/* Sidebar Header */}
        <div className="flex h-16 items-center justify-between border-b border-slate-100 px-4">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-slate-900 to-slate-700">
              <Shield className="h-5 w-5 text-white" />
            </div>
            <div className={isSidebarExpanded ? "" : "lg:hidden"}>
              <h1 className="text-sm font-bold text-slate-900">Admin Panel</h1>
              <p className="text-[10px] text-slate-400">Paper Archive</p>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setSidebarOpen((prev) => !prev)}
              className="hidden rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 lg:inline-flex"
              title={sidebarOpen ? "Collapse sidebar" : "Expand sidebar"}
            >
              <ChevronRight className={`h-5 w-5 transition-transform ${sidebarOpen ? "rotate-180" : "rotate-0"}`} />
            </button>
            <button
              onClick={() => setMobileSidebarOpen(false)}
              className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 lg:hidden"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto p-3">
          <div className="space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    setActiveTab(item.id);
                    setMobileSidebarOpen(false);
                  }}
                  className={`flex w-full items-center rounded-xl px-3 py-2.5 text-sm font-medium transition-all ${
                    isActive
                      ? "bg-slate-900 text-white"
                      : "text-slate-600 hover:bg-slate-100"
                  }`}
                  title={item.label}
                >
                  <div className={`flex items-center gap-3 ${isSidebarExpanded ? "" : "justify-center lg:w-full"}`}>
                    <Icon className="h-5 w-5" />
                    {isSidebarExpanded ? <span>{item.label}</span> : null}
                  </div>
                  {item.badge && isSidebarExpanded ? (
                    <span className={`flex h-5 min-w-[20px] items-center justify-center rounded-full px-1.5 text-xs font-bold ${
                      isActive ? "bg-white text-slate-900" : "bg-red-500 text-white"
                    }`}>
                      {item.badge}
                    </span>
                  ) : null}
                </button>
              );
            })}
          </div>
        </nav>

        {/* Sidebar Footer - User Info */}
        <div className="border-t border-slate-100 p-3">
          <div className={`flex items-center rounded-xl bg-slate-50 p-3 ${isSidebarExpanded ? "gap-3" : "justify-center"}`}>
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 text-sm font-bold text-white">
              {me?.email?.[0]?.toUpperCase() || "A"}
            </div>
            {isSidebarExpanded ? (
              <div className="flex-1 truncate">
                <p className="truncate text-sm font-semibold text-slate-900">Admin</p>
                <p className="truncate text-xs text-slate-500">{me?.email}</p>
              </div>
            ) : null}
            <button
              onClick={onLogout}
              className="rounded-lg p-2 text-slate-400 transition-colors hover:bg-slate-200 hover:text-slate-600"
              title="Sign out"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* Mobile Sidebar Overlay */}
      {mobileSidebarOpen && (
        <div
          className="fixed inset-0 z-20 bg-black/50 lg:hidden"
          onClick={() => setMobileSidebarOpen(false)}
        />
      )}

      {/* Main Content */}
      <main className="flex-1 overflow-x-hidden overflow-y-auto">
        {/* Top Bar */}
        <header className="sticky top-0 z-10 flex h-14 items-center justify-between border-b border-slate-200 bg-white/80 px-3 backdrop-blur-lg sm:h-16 sm:px-4 md:px-6">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileSidebarOpen(true)}
              className="rounded-lg p-2 text-slate-600 hover:bg-slate-100 lg:hidden"
            >
              <Menu className="h-5 w-5" />
            </button>
            <button
              onClick={() => setSidebarOpen((prev) => !prev)}
              className="hidden rounded-lg p-2 text-slate-600 hover:bg-slate-100 lg:inline-flex"
              title={sidebarOpen ? "Collapse sidebar" : "Expand sidebar"}
            >
              <ChevronRight className={`h-5 w-5 transition-transform ${sidebarOpen ? "rotate-180" : "rotate-0"}`} />
            </button>
            <h2 className="text-lg font-bold text-slate-900 capitalize">{activeTab}</h2>
          </div>

          <div className="flex items-center gap-1 sm:gap-2">
            {/* Global Search */}
            <div className="relative hidden sm:block">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search..."
                className="w-40 rounded-lg border border-slate-200 bg-slate-50 py-2 pl-9 pr-4 text-sm transition-all focus:border-blue-300 focus:bg-white focus:outline-none focus:ring-4 focus:ring-blue-50 md:w-64"
              />
            </div>

            {/* Notifications */}
            <button className="relative rounded-lg p-2 text-slate-600 hover:bg-slate-100">
              <Bell className="h-5 w-5" />
              {pending.length > 0 && (
                <span className="absolute right-1 top-1 h-2 w-2 rounded-full bg-red-500" />
              )}
            </button>

            {/* Refresh */}
            <button
              onClick={() => window.location.reload()}
              className="rounded-lg p-2 text-slate-600 hover:bg-slate-100"
              title="Refresh data"
            >
              <RefreshCw className="h-5 w-5" />
            </button>
          </div>
        </header>

        {/* Content Area */}
        <div className="p-3 sm:p-4 md:p-6">
          {activeTab === "dashboard" ? (
            <DashboardTab
              allPapers={allPapers}
              pending={pending}
              users={users}
              activity={activity}
              approvedPapers={approvedPapers}
              pendingPapers={pendingPapers}
              rejectedPapers={rejectedPapers}
              setActiveTab={setActiveTab}
              setActivePaper={setActivePaper}
              formatDate={formatDate}
              token={token}
            />
          ) : null}

          {activeTab === "moderation" ? (
            <ModerationTab
              pending={pending}
              actionLoading={actionLoading}
              reviewNoteByPaper={reviewNoteByPaper}
              setReviewNoteByPaper={setReviewNoteByPaper}
              onModerate={onModerate}
              setActivePaper={setActivePaper}
              formatDate={formatDate}
            />
          ) : null}

          {activeTab === "papers" ? (
            <PapersTab
              searchQuery={searchQuery}
              setSearchQuery={setSearchQuery}
              paperStatusFilter={paperStatusFilter}
              setPaperStatusFilter={setPaperStatusFilter}
              paperDeptFilter={paperDeptFilter}
              setPaperDeptFilter={setPaperDeptFilter}
              departments={departments}
              editingPaperId={editingPaperId}
              paperForm={paperForm}
              setPaperForm={setPaperForm}
              onSavePaper={onSavePaper}
              actionLoading={actionLoading}
              setEditingPaperId={setEditingPaperId}
              filteredPapers={filteredPapers}
              onEditPaper={onEditPaper}
              onDeletePaper={onDeletePaper}
              setActivePaper={setActivePaper}
            />
          ) : null}

          {activeTab === "comments" ? (
            <CommentsTab
              token={token}
              addToast={addToast}
              setConfirmModal={setConfirmModal}
              actionLoading={actionLoading}
              setActionLoading={setActionLoading}
            />
          ) : null}

          {activeTab === "likes" ? (
            <LikesTab
              token={token}
              addToast={addToast}
              setConfirmModal={setConfirmModal}
              actionLoading={actionLoading}
              setActionLoading={setActionLoading}
            />
          ) : null}

          {activeTab === "users" ? (
            <UsersTab
              editingUserId={editingUserId}
              userForm={userForm}
              setUserForm={setUserForm}
              onSaveUser={onSaveUser}
              actionLoading={actionLoading}
              setEditingUserId={setEditingUserId}
              filteredUsers={filteredUsers}
              searchQuery={searchQuery}
              setSearchQuery={setSearchQuery}
              onEditUser={onEditUser}
              onDeleteUser={onDeleteUser}
            />
          ) : null}

          {activeTab === "activity" ? (
            <ActivityTab
              activityTypeFilter={activityTypeFilter}
              setActivityTypeFilter={setActivityTypeFilter}
              filteredActivity={filteredActivity}
              formatDate={formatDate}
              onDeleteActivity={onDeleteActivity}
            />
          ) : null}

          {activeTab === "analytics" ? (
            <AnalyticsTab allPapers={allPapers} users={users} activity={activity} token={token} />
          ) : null}

          {activeTab === "settings" ? (
            <SettingsTab
              settingsForm={settingsForm}
              setSettingsForm={setSettingsForm}
              onSaveSettings={onSaveSettings}
              actionLoading={actionLoading}
            />
          ) : null}
        </div>
      </main>

      {/* Toast Container */}
      <div className="fixed bottom-4 right-4 z-50 space-y-2">
        {toasts.map((toast) => (
          <Toast
            key={toast.id}
            message={toast.message}
            type={toast.type}
            onClose={() => removeToast(toast.id)}
          />
        ))}
      </div>

      {/* Confirmation Modal */}
      <ConfirmModal
        open={confirmModal.open}
        onClose={() => setConfirmModal({ open: false })}
        onConfirm={confirmModal.onConfirm}
        title={confirmModal.title}
        message={confirmModal.message}
        danger={confirmModal.danger}
        loading={actionLoading}
      />

      {/* Image Viewer Modal */}
      <ImageViewerModal
        open={Boolean(activePaper)}
        onClose={() => setActivePaper(null)}
        images={[activePaper?.imageUrl, activePaper?.secondImageUrl]}
        title={activePaper?.title ?? "Paper"}
      />
    </div>
  );
}