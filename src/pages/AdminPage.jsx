import { useAction, useMutation, useQuery } from "convex/react";
import { useEffect, useState, useRef } from "react";
import { api } from "../lib/api";
import { ImageViewerModal } from "../components/common/ImageViewerModal";
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
  AlertTriangle,
  TrendingUp,
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
  CheckCircle2,
  Info,
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
  GraduationCap
} from "lucide-react";

// ============================================================================
// UTILITY COMPONENTS
// ============================================================================

// Toast notification component
const Toast = ({ message, type = "info", onClose }) => {
  const config = {
    success: { bg: "bg-emerald-50", border: "border-emerald-200", text: "text-emerald-800", icon: CheckCircle2 },
    error: { bg: "bg-red-50", border: "border-red-200", text: "text-red-800", icon: XCircle },
    warning: { bg: "bg-amber-50", border: "border-amber-200", text: "text-amber-800", icon: AlertTriangle },
    info: { bg: "bg-blue-50", border: "border-blue-200", text: "text-blue-800", icon: Info },
  };
  const { bg, border, text, icon: Icon } = config[type];

  useEffect(() => {
    const timer = setTimeout(onClose, 4000);
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div className={`flex items-center gap-3 rounded-xl border ${border} ${bg} px-4 py-3 shadow-lg`}>
      <Icon className={`h-5 w-5 ${text}`} />
      <p className={`text-sm font-medium ${text}`}>{message}</p>
      <button onClick={onClose} className={`ml-2 ${text} opacity-60 hover:opacity-100`}>
        <X className="h-4 w-4" />
      </button>
    </div>
  );
};

// Stat card component
const StatCard = ({ label, value, icon: Icon, trend, trendUp, color = "blue", subtext }) => {
  const colorClasses = {
    blue: "from-blue-500 to-indigo-600",
    emerald: "from-emerald-500 to-teal-600",
    amber: "from-amber-500 to-orange-600",
    rose: "from-rose-500 to-pink-600",
    purple: "from-purple-500 to-violet-600",
    slate: "from-slate-500 to-gray-600",
  };

  return (
    <div className="group relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition-all hover:shadow-md">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-slate-500">{label}</p>
          <p className="mt-2 text-3xl font-bold text-slate-900">{value}</p>
          {subtext && <p className="mt-1 text-xs text-slate-400">{subtext}</p>}
          {trend !== undefined && (
            <div className={`mt-2 flex items-center gap-1 text-xs font-semibold ${trendUp ? "text-emerald-600" : "text-red-600"}`}>
              <TrendingUp className={`h-3 w-3 ${!trendUp && "rotate-180"}`} />
              {trend}% from last week
            </div>
          )}
        </div>
        <div className={`flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br ${colorClasses[color]} shadow-lg`}>
          <Icon className="h-6 w-6 text-white" />
        </div>
      </div>
      <div className={`absolute -bottom-8 -right-8 h-24 w-24 rounded-full bg-gradient-to-br ${colorClasses[color]} opacity-10 transition-transform group-hover:scale-150`} />
    </div>
  );
};

// Empty state component
const EmptyState = ({ icon: Icon, title, description, action, actionLabel }) => (
  <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50/50 px-6 py-12 text-center">
    <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-100">
      <Icon className="h-8 w-8 text-slate-400" />
    </div>
    <h3 className="mt-4 text-lg font-semibold text-slate-900">{title}</h3>
    <p className="mt-1 max-w-sm text-sm text-slate-500">{description}</p>
    {action && (
      <button
        onClick={action}
        className="mt-4 inline-flex items-center gap-2 rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-slate-800"
      >
        {actionLabel}
      </button>
    )}
  </div>
);

// Badge component
const Badge = ({ children, variant = "default" }) => {
  const variants = {
    default: "bg-slate-100 text-slate-700",
    success: "bg-emerald-100 text-emerald-700",
    warning: "bg-amber-100 text-amber-700",
    danger: "bg-red-100 text-red-700",
    info: "bg-blue-100 text-blue-700",
  };

  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${variants[variant]}`}>
      {children}
    </span>
  );
};

// Status badge for papers
const StatusBadge = ({ status }) => {
  const config = {
    approved: { variant: "success", icon: CheckCircle, label: "Approved" },
    rejected: { variant: "danger", icon: XCircle, label: "Rejected" },
    pending: { variant: "warning", icon: Clock, label: "Pending" },
  };
  const { variant, icon: Icon, label } = config[status] || config.pending;

  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${
      variant === "success" ? "bg-emerald-100 text-emerald-700" :
      variant === "danger" ? "bg-red-100 text-red-700" :
      "bg-amber-100 text-amber-700"
    }`}>
      <Icon className="h-3 w-3" />
      {label}
    </span>
  );
};

// Confirmation modal
const ConfirmModal = ({ open, onClose, onConfirm, title, message, confirmText = "Confirm", danger = false, loading = false }) => {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
        <div className="flex items-start gap-4">
          <div className={`flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full ${danger ? "bg-red-100" : "bg-blue-100"}`}>
            {danger ? <AlertTriangle className="h-6 w-6 text-red-600" /> : <Info className="h-6 w-6 text-blue-600" />}
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-900">{title}</h3>
            <p className="mt-2 text-sm text-slate-600">{message}</p>
          </div>
        </div>
        <div className="mt-6 flex justify-end gap-3">
          <button
            onClick={onClose}
            disabled={loading}
            className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-50 disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={loading}
            className={`inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold text-white transition-colors disabled:opacity-50 ${
              danger ? "bg-red-600 hover:bg-red-700" : "bg-blue-600 hover:bg-blue-700"
            }`}
          >
            {loading && <Loader2 className="h-4 w-4 animate-spin" />}
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};

// Dropdown menu
const DropdownMenu = ({ trigger, children, align = "right" }) => {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div ref={ref} className="relative">
      <div onClick={() => setOpen(!open)}>{trigger}</div>
      {open && (
        <div className={`absolute ${align === "right" ? "right-0" : "left-0"} top-full z-20 mt-2 min-w-[180px] rounded-xl border border-slate-200 bg-white p-1.5 shadow-xl`}>
          {children}
        </div>
      )}
    </div>
  );
};

const DropdownItem = ({ icon: Icon, children, onClick, danger = false }) => (
  <button
    onClick={onClick}
    className={`flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left text-sm font-medium transition-colors ${
      danger ? "text-red-600 hover:bg-red-50" : "text-slate-700 hover:bg-slate-100"
    }`}
  >
    {Icon && <Icon className="h-4 w-4" />}
    {children}
  </button>
);

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
  const [token, setToken] = useState(() => localStorage.getItem("admin_panel_token") || "");
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
    if (me?.ok === false) {
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
      localStorage.setItem("admin_panel_token", session.token);
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

  // Navigation items
  const navItems = [
    { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
    { id: "moderation", label: "Moderation", icon: FileCheck, badge: pending.length || null },
    { id: "papers", label: "All Papers", icon: FileText },
    { id: "users", label: "Users", icon: Users },
    { id: "activity", label: "Activity", icon: Activity },
    // TODO: Add more navigation items as needed
    // { id: "analytics", label: "Analytics", icon: BarChart3 },
    // { id: "settings", label: "Settings", icon: Settings },
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

  return (
    <div className="flex min-h-screen bg-slate-100">
      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-30 flex w-64 flex-col border-r border-slate-200 bg-white transition-transform duration-300 lg:relative lg:translate-x-0 ${
          mobileSidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Sidebar Header */}
        <div className="flex h-16 items-center justify-between border-b border-slate-100 px-4">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-slate-900 to-slate-700">
              <Shield className="h-5 w-5 text-white" />
            </div>
            <div>
              <h1 className="text-sm font-bold text-slate-900">Admin Panel</h1>
              <p className="text-[10px] text-slate-400">Paper Archive</p>
            </div>
          </div>
          <button
            onClick={() => setMobileSidebarOpen(false)}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 lg:hidden"
          >
            <X className="h-5 w-5" />
          </button>
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
                  className={`flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-sm font-medium transition-all ${
                    isActive
                      ? "bg-slate-900 text-white"
                      : "text-slate-600 hover:bg-slate-100"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon className="h-5 w-5" />
                    {item.label}
                  </div>
                  {item.badge && (
                    <span className={`flex h-5 min-w-[20px] items-center justify-center rounded-full px-1.5 text-xs font-bold ${
                      isActive ? "bg-white text-slate-900" : "bg-red-500 text-white"
                    }`}>
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </nav>

        {/* Sidebar Footer - User Info */}
        <div className="border-t border-slate-100 p-3">
          <div className="flex items-center gap-3 rounded-xl bg-slate-50 p-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 text-sm font-bold text-white">
              {me?.email?.[0]?.toUpperCase() || "A"}
            </div>
            <div className="flex-1 truncate">
              <p className="truncate text-sm font-semibold text-slate-900">Admin</p>
              <p className="truncate text-xs text-slate-500">{me?.email}</p>
            </div>
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
      <main className="flex-1 overflow-y-auto">
        {/* Top Bar */}
        <header className="sticky top-0 z-10 flex h-16 items-center justify-between border-b border-slate-200 bg-white/80 px-4 backdrop-blur-lg md:px-6">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileSidebarOpen(true)}
              className="rounded-lg p-2 text-slate-600 hover:bg-slate-100 lg:hidden"
            >
              <Menu className="h-5 w-5" />
            </button>
            <h2 className="text-lg font-bold text-slate-900 capitalize">{activeTab}</h2>
          </div>

          <div className="flex items-center gap-2">
            {/* Global Search */}
            <div className="relative hidden md:block">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search..."
                className="w-64 rounded-lg border border-slate-200 bg-slate-50 py-2 pl-9 pr-4 text-sm transition-all focus:border-blue-300 focus:bg-white focus:outline-none focus:ring-4 focus:ring-blue-50"
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
        <div className="p-4 md:p-6">
          {/* ================================================================ */}
          {/* DASHBOARD TAB */}
          {/* ================================================================ */}
          {activeTab === "dashboard" && (
            <div className="space-y-6">
              {/* Stats Grid */}
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <StatCard
                  label="Total Papers"
                  value={allPapers.length}
                  icon={FileText}
                  color="blue"
                  trend={12}
                  trendUp
                />
                <StatCard
                  label="Pending Review"
                  value={pending.length}
                  icon={FileClock}
                  color="amber"
                  subtext="Awaiting moderation"
                />
                <StatCard
                  label="Total Users"
                  value={users.length}
                  icon={Users}
                  color="emerald"
                  trend={8}
                  trendUp
                />
                <StatCard
                  label="Recent Activity"
                  value={activity.length}
                  icon={Activity}
                  color="purple"
                  subtext="Last 100 actions"
                />
              </div>

              {/* Quick Stats */}
              <div className="grid gap-4 lg:grid-cols-3">
                {/* Paper Status Breakdown */}
                <div className="rounded-2xl border border-slate-200 bg-white p-5">
                  <h3 className="text-sm font-semibold text-slate-900">Paper Status</h3>
                  <div className="mt-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="h-3 w-3 rounded-full bg-emerald-500" />
                        <span className="text-sm text-slate-600">Approved</span>
                      </div>
                      <span className="font-semibold text-slate-900">{approvedPapers.length}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="h-3 w-3 rounded-full bg-amber-500" />
                        <span className="text-sm text-slate-600">Pending</span>
                      </div>
                      <span className="font-semibold text-slate-900">{pendingPapers.length}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="h-3 w-3 rounded-full bg-red-500" />
                        <span className="text-sm text-slate-600">Rejected</span>
                      </div>
                      <span className="font-semibold text-slate-900">{rejectedPapers.length}</span>
                    </div>
                  </div>
                  {/* Progress Bar */}
                  <div className="mt-4 flex h-2 overflow-hidden rounded-full bg-slate-100">
                    <div
                      className="bg-emerald-500 transition-all"
                      style={{ width: `${(approvedPapers.length / allPapers.length) * 100 || 0}%` }}
                    />
                    <div
                      className="bg-amber-500 transition-all"
                      style={{ width: `${(pendingPapers.length / allPapers.length) * 100 || 0}%` }}
                    />
                    <div
                      className="bg-red-500 transition-all"
                      style={{ width: `${(rejectedPapers.length / allPapers.length) * 100 || 0}%` }}
                    />
                  </div>
                </div>

                {/* Recent Pending */}
                <div className="rounded-2xl border border-slate-200 bg-white p-5 lg:col-span-2">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-semibold text-slate-900">Pending Review</h3>
                    <button
                      onClick={() => setActiveTab("moderation")}
                      className="text-xs font-semibold text-blue-600 hover:text-blue-700"
                    >
                      View all →
                    </button>
                  </div>
                  <div className="mt-4 space-y-3">
                    {pending.slice(0, 3).map((paper) => (
                      <div key={paper._id} className="flex items-center justify-between rounded-lg bg-slate-50 p-3">
                        <div className="min-w-0">
                          <p className="truncate text-sm font-semibold text-slate-900">{paper.title}</p>
                          <p className="text-xs text-slate-500">{paper.department} • {paper.subject}</p>
                        </div>
                        <button
                          onClick={() => { setActiveTab("moderation"); setActivePaper(paper); }}
                          className="flex-shrink-0 rounded-lg bg-blue-100 px-3 py-1.5 text-xs font-semibold text-blue-700 hover:bg-blue-200"
                        >
                          Review
                        </button>
                      </div>
                    ))}
                    {pending.length === 0 && (
                      <p className="py-4 text-center text-sm text-slate-500">No pending papers 🎉</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Recent Activity */}
              <div className="rounded-2xl border border-slate-200 bg-white p-5">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-slate-900">Recent Activity</h3>
                  <button
                    onClick={() => setActiveTab("activity")}
                    className="text-xs font-semibold text-blue-600 hover:text-blue-700"
                  >
                    View all →
                  </button>
                </div>
                <div className="mt-4 space-y-2">
                  {activity.slice(0, 5).map((item) => (
                    <div key={item._id || item.id} className="flex items-center gap-3 rounded-lg px-2 py-2 hover:bg-slate-50">
                      <div className={`flex h-8 w-8 items-center justify-center rounded-full ${
                        item.type === "comment" ? "bg-blue-100" : "bg-rose-100"
                      }`}>
                        {item.type === "comment" ? (
                          <MessageSquare className="h-4 w-4 text-blue-600" />
                        ) : (
                          <Heart className="h-4 w-4 text-rose-600" />
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm text-slate-700">
                          <span className="font-semibold">@{item.actorName}</span>
                          {" "}{item.type === "comment" ? "commented on" : "liked"}{" "}
                          <span className="font-semibold">{item.paperTitle}</span>
                        </p>
                      </div>
                      <span className="flex-shrink-0 text-xs text-slate-400">{formatDate(item.createdAt)}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ================================================================ */}
          {/* MODERATION TAB */}
          {/* ================================================================ */}
          {activeTab === "moderation" && (
            <div className="space-y-4">
              {/* Header */}
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <h2 className="text-xl font-bold text-slate-900">Content Moderation</h2>
                  <p className="text-sm text-slate-500">Review and approve pending paper submissions</p>
                </div>
                <Badge variant={pending.length > 0 ? "warning" : "success"}>
                  {pending.length} pending review{pending.length !== 1 && "s"}
                </Badge>
              </div>

              {/* Pending Papers List */}
              {pending.length === 0 ? (
                <EmptyState
                  icon={CheckCircle}
                  title="All caught up!"
                  description="There are no papers pending review. New submissions will appear here."
                />
              ) : (
                <div className="space-y-4">
                  {pending.map((paper) => (
                    <div key={paper._id} className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                      {/* Paper Header */}
                      <div className="flex flex-wrap items-start justify-between gap-4 border-b border-slate-100 p-5">
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <h3 className="text-lg font-bold text-slate-900">{paper.title}</h3>
                            <StatusBadge status={paper.status} />
                          </div>
                          <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-slate-500">
                            <span className="flex items-center gap-1.5">
                              <GraduationCap className="h-4 w-4" />
                              {paper.department}
                            </span>
                            <span className="flex items-center gap-1.5">
                              <FileText className="h-4 w-4" />
                              {paper.subject}
                            </span>
                            <span className="flex items-center gap-1.5">
                              <User className="h-4 w-4" />
                              @{paper.uploader?.name || "unknown"}
                            </span>
                            <span className="flex items-center gap-1.5">
                              <Calendar className="h-4 w-4" />
                              {formatDate(paper._creationTime || paper.createdAt)}
                            </span>
                          </div>
                        </div>
                        <button
                          onClick={() => setActivePaper(paper)}
                          className="inline-flex items-center gap-2 rounded-xl bg-slate-100 px-4 py-2.5 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-200"
                        >
                          <Eye className="h-4 w-4" />
                          Preview
                        </button>
                      </div>

                      {/* Paper Preview Thumbnails */}
                      <div className="flex gap-2 border-b border-slate-100 bg-slate-50 p-4">
                        {[paper.imageUrl, paper.secondImageUrl].filter(Boolean).map((url, idx) => (
                          <button
                            key={idx}
                            onClick={() => setActivePaper(paper)}
                            className="group relative h-24 w-20 overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm transition-transform hover:scale-105"
                          >
                            <img
                              src={url}
                              alt={`Page ${idx + 1}`}
                              className="h-full w-full object-cover"
                            />
                            <div className="absolute inset-0 flex items-center justify-center bg-black/0 transition-colors group-hover:bg-black/30">
                              <Eye className="h-5 w-5 text-white opacity-0 transition-opacity group-hover:opacity-100" />
                            </div>
                          </button>
                        ))}
                      </div>

                      {/* Moderation Actions */}
                      <div className="p-5">
                        <label className="mb-2 block text-sm font-medium text-slate-700">
                          Review Note <span className="text-slate-400">(required for rejection)</span>
                        </label>
                        <textarea
                          value={reviewNoteByPaper[paper._id] ?? ""}
                          onChange={(e) =>
                            setReviewNoteByPaper(prev => ({ ...prev, [paper._id]: e.target.value }))
                          }
                          placeholder="Add a note explaining your decision..."
                          className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm transition-all focus:border-blue-300 focus:bg-white focus:outline-none focus:ring-4 focus:ring-blue-50"
                          rows={2}
                        />
                        <div className="mt-4 flex flex-wrap gap-3">
                          <button
                            onClick={() => void onModerate(paper._id, "approved")}
                            disabled={actionLoading}
                            className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-all hover:bg-emerald-700 hover:shadow-md disabled:opacity-50"
                          >
                            <CheckCircle className="h-4 w-4" />
                            Approve Paper
                          </button>
                          <button
                            onClick={() => void onModerate(paper._id, "rejected")}
                            disabled={actionLoading}
                            className="inline-flex items-center gap-2 rounded-xl bg-red-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-all hover:bg-red-700 hover:shadow-md disabled:opacity-50"
                          >
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
          )}

          {/* ================================================================ */}
          {/* ALL PAPERS TAB */}
          {/* ================================================================ */}
          {activeTab === "papers" && (
            <div className="space-y-4">
              {/* Header & Filters */}
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <h2 className="text-xl font-bold text-slate-900">Paper Management</h2>
                  <p className="text-sm text-slate-500">View and manage all papers in the database</p>
                </div>
                <div className="flex items-center gap-2">
                  {/* TODO: Add export functionality */}
                  <button className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-50">
                    <Download className="h-4 w-4" />
                    Export
                  </button>
                </div>
              </div>

              {/* Filters */}
              <div className="flex flex-wrap items-center gap-3 rounded-xl border border-slate-200 bg-white p-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <input
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search papers..."
                    className="w-full rounded-lg border border-slate-200 bg-slate-50 py-2 pl-9 pr-4 text-sm transition-all focus:border-blue-300 focus:bg-white focus:outline-none focus:ring-4 focus:ring-blue-50"
                  />
                </div>
                <select
                  value={paperStatusFilter}
                  onChange={(e) => setPaperStatusFilter(e.target.value)}
                  className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700"
                >
                  <option value="all">All Status</option>
                  <option value="approved">Approved</option>
                  <option value="pending">Pending</option>
                  <option value="rejected">Rejected</option>
                </select>
                <select
                  value={paperDeptFilter}
                  onChange={(e) => setPaperDeptFilter(e.target.value)}
                  className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700"
                >
                  <option value="all">All Departments</option>
                  {departments.map(dept => (
                    <option key={dept} value={dept}>{dept}</option>
                  ))}
                </select>
              </div>

              {/* Papers Grid */}
              <div className="grid gap-4 lg:grid-cols-3">
                {/* Edit Form Panel */}
                <div className={`rounded-2xl border bg-white p-5 transition-all ${editingPaperId ? "border-blue-300 ring-4 ring-blue-50" : "border-slate-200"}`}>
                  <div className="mb-4 flex items-center gap-3">
                    <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${editingPaperId ? "bg-blue-100" : "bg-slate-100"}`}>
                      <Edit3 className={`h-5 w-5 ${editingPaperId ? "text-blue-600" : "text-slate-400"}`} />
                    </div>
                    <div>
                      <h3 className="font-semibold text-slate-900">
                        {editingPaperId ? "Edit Paper" : "Paper Editor"}
                      </h3>
                      <p className="text-xs text-slate-500">
                        {editingPaperId ? "Update paper details" : "Select a paper to edit"}
                      </p>
                    </div>
                  </div>

                  <form onSubmit={onSavePaper} className="space-y-3">
                    <div>
                      <label className="mb-1 block text-xs font-semibold text-slate-600">Title</label>
                      <input
                        value={paperForm.title}
                        onChange={(e) => setPaperForm(p => ({ ...p, title: e.target.value }))}
                        placeholder="Paper title"
                        className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm disabled:bg-slate-50 disabled:text-slate-400"
                        disabled={!editingPaperId}
                        required
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="mb-1 block text-xs font-semibold text-slate-600">Department</label>
                        <input
                          value={paperForm.department}
                          onChange={(e) => setPaperForm(p => ({ ...p, department: e.target.value }))}
                          placeholder="Department"
                          className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm disabled:bg-slate-50 disabled:text-slate-400"
                          disabled={!editingPaperId}
                        />
                      </div>
                      <div>
                        <label className="mb-1 block text-xs font-semibold text-slate-600">Subject</label>
                        <input
                          value={paperForm.subject}
                          onChange={(e) => setPaperForm(p => ({ ...p, subject: e.target.value }))}
                          placeholder="Subject"
                          className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm disabled:bg-slate-50 disabled:text-slate-400"
                          disabled={!editingPaperId}
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="mb-1 block text-xs font-semibold text-slate-600">Teacher</label>
                        <input
                          value={paperForm.teacher}
                          onChange={(e) => setPaperForm(p => ({ ...p, teacher: e.target.value }))}
                          placeholder="Teacher name"
                          className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm disabled:bg-slate-50 disabled:text-slate-400"
                          disabled={!editingPaperId}
                        />
                      </div>
                      <div>
                        <label className="mb-1 block text-xs font-semibold text-slate-600">Year</label>
                        <input
                          value={paperForm.year}
                          onChange={(e) => setPaperForm(p => ({ ...p, year: e.target.value }))}
                          placeholder="Year"
                          className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm disabled:bg-slate-50 disabled:text-slate-400"
                          disabled={!editingPaperId}
                        />
                      </div>
                    </div>
                    <div>
                      <label className="mb-1 block text-xs font-semibold text-slate-600">Type</label>
                      <input
                        value={paperForm.type}
                        onChange={(e) => setPaperForm(p => ({ ...p, type: e.target.value }))}
                        placeholder="Paper type (Midterm, Final, etc.)"
                        className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm disabled:bg-slate-50 disabled:text-slate-400"
                        disabled={!editingPaperId}
                      />
                    </div>

                    <div className="flex gap-2 pt-2">
                      <button
                        type="submit"
                        disabled={!editingPaperId || actionLoading}
                        className="inline-flex flex-1 items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-blue-700 disabled:opacity-50"
                      >
                        <Save className="h-4 w-4" />
                        Save Changes
                      </button>
                      {editingPaperId && (
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
                      )}
                    </div>
                  </form>
                </div>

                {/* Papers List */}
                <div className="rounded-2xl border border-slate-200 bg-white p-5 lg:col-span-2">
                  <div className="mb-4 flex items-center justify-between">
                    <h3 className="font-semibold text-slate-900">
                      All Papers <span className="text-slate-400">({filteredPapers.length})</span>
                    </h3>
                  </div>
                  <div className="max-h-[600px] space-y-2 overflow-y-auto pr-2">
                    {filteredPapers.length === 0 ? (
                      <p className="py-8 text-center text-sm text-slate-500">No papers found</p>
                    ) : (
                      filteredPapers.map((paper) => (
                        <div
                          key={paper._id}
                          className={`flex items-center justify-between gap-3 rounded-xl p-3 transition-colors ${
                            editingPaperId === paper._id ? "bg-blue-50 ring-2 ring-blue-200" : "bg-slate-50 hover:bg-slate-100"
                          }`}
                        >
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2">
                              <p className="truncate text-sm font-semibold text-slate-900">{paper.title}</p>
                              <StatusBadge status={paper.status} />
                            </div>
                            <p className="truncate text-xs text-slate-500">
                              {paper.department} • {paper.subject} • {paper.year}
                            </p>
                          </div>
                          <div className="flex flex-shrink-0 items-center gap-1">
                            <button
                              onClick={() => setActivePaper(paper)}
                              className="rounded-lg p-2 text-slate-400 transition-colors hover:bg-white hover:text-slate-600"
                              title="Preview"
                            >
                              <Eye className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => onEditPaper(paper)}
                              className="rounded-lg p-2 text-slate-400 transition-colors hover:bg-white hover:text-blue-600"
                              title="Edit"
                            >
                              <Edit3 className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => onDeletePaper(paper._id)}
                              className="rounded-lg p-2 text-slate-400 transition-colors hover:bg-white hover:text-red-600"
                              title="Delete"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ================================================================ */}
          {/* USERS TAB */}
          {/* ================================================================ */}
          {activeTab === "users" && (
            <div className="space-y-4">
              {/* Header */}
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <h2 className="text-xl font-bold text-slate-900">User Management</h2>
                  <p className="text-sm text-slate-500">Manage platform users and their permissions</p>
                </div>
              </div>

              {/* Users Grid */}
              <div className="grid gap-4 lg:grid-cols-3">
                {/* User Form */}
                <div className={`rounded-2xl border bg-white p-5 transition-all ${editingUserId ? "border-blue-300 ring-4 ring-blue-50" : "border-slate-200"}`}>
                  <div className="mb-4 flex items-center gap-3">
                    <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${editingUserId ? "bg-blue-100" : "bg-emerald-100"}`}>
                      {editingUserId ? (
                        <Edit3 className="h-5 w-5 text-blue-600" />
                      ) : (
                        <UserPlus className="h-5 w-5 text-emerald-600" />
                      )}
                    </div>
                    <div>
                      <h3 className="font-semibold text-slate-900">
                        {editingUserId ? "Edit User" : "Add New User"}
                      </h3>
                      <p className="text-xs text-slate-500">
                        {editingUserId ? "Update user details" : "Create a new user account"}
                      </p>
                    </div>
                  </div>

                  <form onSubmit={onSaveUser} className="space-y-3">
                    <div>
                      <label className="mb-1 block text-xs font-semibold text-slate-600">Username</label>
                      <input
                        value={userForm.username}
                        onChange={(e) => setUserForm(p => ({ ...p, username: e.target.value }))}
                        placeholder="username"
                        className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                        required
                      />
                    </div>
                    <div>
                      <label className="mb-1 block text-xs font-semibold text-slate-600">Display Name</label>
                      <input
                        value={userForm.name}
                        onChange={(e) => setUserForm(p => ({ ...p, name: e.target.value }))}
                        placeholder="John Doe"
                        className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                      />
                    </div>
                    <div>
                      <label className="mb-1 block text-xs font-semibold text-slate-600">Email</label>
                      <input
                        value={userForm.email}
                        onChange={(e) => setUserForm(p => ({ ...p, email: e.target.value }))}
                        placeholder="user@example.com"
                        type="email"
                        className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                      />
                    </div>
                    <div>
                      <label className="mb-1 block text-xs font-semibold text-slate-600">Profile Image URL</label>
                      <input
                        value={userForm.image}
                        onChange={(e) => setUserForm(p => ({ ...p, image: e.target.value }))}
                        placeholder="https://..."
                        className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                      />
                    </div>

                    <div className="flex gap-2 pt-2">
                      <button
                        type="submit"
                        disabled={actionLoading}
                        className={`inline-flex flex-1 items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold text-white transition-colors disabled:opacity-50 ${
                          editingUserId ? "bg-blue-600 hover:bg-blue-700" : "bg-emerald-600 hover:bg-emerald-700"
                        }`}
                      >
                        {editingUserId ? <Save className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
                        {editingUserId ? "Update User" : "Add User"}
                      </button>
                      {editingUserId && (
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
                      )}
                    </div>
                  </form>
                </div>

                {/* Users List */}
                <div className="rounded-2xl border border-slate-200 bg-white p-5 lg:col-span-2">
                  <div className="mb-4 flex items-center justify-between">
                    <h3 className="font-semibold text-slate-900">
                      All Users <span className="text-slate-400">({filteredUsers.length})</span>
                    </h3>
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                      <input
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Search users..."
                        className="w-48 rounded-lg border border-slate-200 bg-slate-50 py-1.5 pl-9 pr-3 text-sm"
                      />
                    </div>
                  </div>
                  <div className="max-h-[600px] space-y-2 overflow-y-auto pr-2">
                    {filteredUsers.length === 0 ? (
                      <p className="py-8 text-center text-sm text-slate-500">No users found</p>
                    ) : (
                      filteredUsers.map((user) => (
                        <div
                          key={user._id}
                          className={`flex items-center justify-between gap-3 rounded-xl p-3 transition-colors ${
                            editingUserId === user._id ? "bg-blue-50 ring-2 ring-blue-200" : "bg-slate-50 hover:bg-slate-100"
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 text-sm font-bold text-white">
                              {(user.name || user.username || "?")[0].toUpperCase()}
                            </div>
                            <div className="min-w-0">
                              <p className="truncate text-sm font-semibold text-slate-900">
                                @{user.username || "no_username"}
                              </p>
                              <p className="truncate text-xs text-slate-500">
                                {user.email || "No email"} • {user.uploadCount || 0} uploads
                              </p>
                            </div>
                          </div>
                          <div className="flex flex-shrink-0 items-center gap-1">
                            <button
                              onClick={() => onEditUser(user)}
                              className="rounded-lg p-2 text-slate-400 transition-colors hover:bg-white hover:text-blue-600"
                              title="Edit"
                            >
                              <Edit3 className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => onDeleteUser(user._id)}
                              className="rounded-lg p-2 text-slate-400 transition-colors hover:bg-white hover:text-red-600"
                              title="Delete"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ================================================================ */}
          {/* ACTIVITY TAB */}
          {/* ================================================================ */}
          {activeTab === "activity" && (
            <div className="space-y-4">
              {/* Header */}
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <h2 className="text-xl font-bold text-slate-900">Activity Log</h2>
                  <p className="text-sm text-slate-500">Monitor user interactions and platform activity</p>
                </div>
                <div className="flex items-center gap-2">
                  <select
                    value={activityTypeFilter}
                    onChange={(e) => setActivityTypeFilter(e.target.value)}
                    className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700"
                  >
                    <option value="all">All Activity</option>
                    <option value="comment">Comments</option>
                    <option value="like">Likes</option>
                  </select>
                </div>
              </div>

              {/* Activity List */}
              <div className="rounded-2xl border border-slate-200 bg-white">
                {filteredActivity.length === 0 ? (
                  <div className="p-8">
                    <EmptyState
                      icon={Activity}
                      title="No activity yet"
                      description="User interactions like comments and likes will appear here."
                    />
                  </div>
                ) : (
                  <div className="divide-y divide-slate-100">
                    {filteredActivity.map((item) => (
                      <div
                        key={item._id || item.id}
                        className="flex items-start gap-4 p-4 transition-colors hover:bg-slate-50"
                      >
                        <div className={`flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full ${
                          item.type === "comment" ? "bg-blue-100" : "bg-rose-100"
                        }`}>
                          {item.type === "comment" ? (
                            <MessageSquare className="h-5 w-5 text-blue-600" />
                          ) : (
                            <Heart className="h-5 w-5 text-rose-600" />
                          )}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-slate-900">@{item.actorName}</span>
                            <span className="text-slate-500">
                              {item.type === "comment" ? "commented on" : "liked"}
                            </span>
                            <span className="truncate font-semibold text-slate-900">{item.paperTitle}</span>
                          </div>
                          {item.type === "comment" && item.content && (
                            <p className="mt-1 text-sm text-slate-600">"{item.content}"</p>
                          )}
                          <p className="mt-1 text-xs text-slate-400">{formatDate(item.createdAt)}</p>
                        </div>
                        <button
                          onClick={() => onDeleteActivity(item._id || item.id)}
                          className="flex-shrink-0 rounded-lg p-2 text-slate-400 transition-colors hover:bg-slate-100 hover:text-red-600"
                          title="Delete"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
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

// ============================================================================
// TODO: FEATURES FOR COPILOT TO IMPLEMENT
// ============================================================================

/**
 * @copilot-todo MISSING FEATURES TO IMPLEMENT:
 *
 * 1. ANALYTICS DASHBOARD TAB
 *    - Add charts showing papers uploaded over time (use recharts or chart.js)
 *    - Show user registration trends
 *    - Display most popular departments/subjects
 *    - Track engagement metrics (likes, comments per paper)
 *    - Add date range filters for analytics
 *
 * 2. SETTINGS TAB
 *    - Site configuration (site name, description, logo)
 *    - Email notification settings
 *    - Moderation settings (auto-approve trusted users)
 *    - Rate limiting configuration
 *    - Maintenance mode toggle
 *
 * 3. BULK ACTIONS
 *    - Select multiple papers for bulk approve/reject/delete
 *    - Bulk export papers to CSV/JSON
 *    - Bulk user actions (send notifications, suspend)
 *
 * 4. ADVANCED SEARCH & FILTERS
 *    - Date range filters for papers
 *    - Filter by uploader
 *    - Sort options (newest, oldest, most liked)
 *    - Saved filter presets
 *
 * 5. AUDIT LOG
 *    - Track all admin actions (who did what, when)
 *    - Login/logout history
 *    - Paper status change history
 *    - User modification history
 *
 * 6. NOTIFICATIONS SYSTEM
 *    - Real-time notifications for new submissions
 *    - Email notifications for pending reviews
 *    - In-app notification center
 *    - Push notifications (optional)
 *
 * 7. USER ROLES & PERMISSIONS
 *    - Multiple admin roles (super admin, moderator, viewer)
 *    - Role-based access control
 *    - Permission management UI
 *
 * 8. REPORTS & FLAGGING
 *    - User-submitted reports for papers/comments
 *    - Report review queue
 *    - Auto-flagging for suspicious content
 *    - Spam detection
 *
 * 9. BACKUP & RESTORE
 *    - Database backup functionality
 *    - Restore from backup
 *    - Export all data
 *
 * 10. API MANAGEMENT (if applicable)
 *     - API key generation
 *     - Rate limit monitoring
 *     - API usage statistics
 *
 * 11. SEO & METADATA
 *     - Paper metadata editing
 *     - Sitemap generation
 *     - Social media preview settings
 *
 * 12. DARK MODE
 *     - Toggle dark mode for admin panel
 *     - Persist preference in localStorage
 *     - System preference detection
 *
 * 13. KEYBOARD SHORTCUTS
 *     - Quick navigation (g+d for dashboard, g+m for moderation)
 *     - Quick actions (a for approve, r for reject)
 *     - Search focus (/)
 *
 * 14. MOBILE ADMIN APP CONSIDERATIONS
 *     - Swipe gestures for approve/reject
 *     - Offline queue for actions
 *     - Push notifications
 *
 * 15. INTEGRATION FEATURES
 *     - Slack/Discord webhooks for notifications
 *     - Google Analytics integration
 *     - Third-party storage (S3, Cloudinary) management
 *
 * BACKEND MUTATIONS/QUERIES NEEDED:
 * - api.adminPanel.getAnalytics({ token, dateRange })
 * - api.adminPanel.getAuditLog({ token, limit, offset })
 * - api.adminPanel.bulkUpdatePapers({ token, paperIds, status })
 * - api.adminPanel.bulkDeletePapers({ token, paperIds })
 * - api.adminPanel.getReports({ token, status })
 * - api.adminPanel.updateSettings({ token, settings })
 * - api.adminPanel.getSettings({ token })
 * - api.adminPanel.createAdmin({ token, email, password, role })
 * - api.adminPanel.updateAdminRole({ token, adminId, role })
 */