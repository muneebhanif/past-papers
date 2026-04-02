import { useQuery } from "convex/react";
import { api } from "../../../lib/api";
import {
  Activity, CheckCircle, Clock, FileCheck, FileClock, FileText, FileX,
  Heart, MessageSquare, TrendingUp, Upload, Users, Wifi, BarChart3,
  ArrowUpRight, Eye, Globe
} from "lucide-react";
import { StatCard } from "../ui/StatCard";
import { MiniBarChart, MiniLineChart, DonutChart, HorizontalBarChart } from "../ui/MiniBarChart";

export function DashboardTab({
  allPapers,
  pending,
  users,
  activity,
  approvedPapers,
  pendingPapers,
  rejectedPapers,
  setActiveTab,
  setActivePaper,
  formatDate,
  token,
}) {
  const stats = useQuery(api.adminPanel.getAdminStats, token ? { token } : "skip");
  
  // Calculate live online users (users who were active in last 5 minutes based on activity timestamp)
  const recentActivityUsers = new Set();
  const fiveMinAgo = Date.now() - 5 * 60 * 1000;
  activity.forEach((item) => {
    if (item.createdAt >= fiveMinAgo) {
      recentActivityUsers.add(item.actorName);
    }
  });

  const onlineCount = recentActivityUsers.size;
  const totalPapers = allPapers.length;
  const totalUsers = users.length;
  const approvalRate = totalPapers > 0
    ? ((approvedPapers.length / totalPapers) * 100).toFixed(1)
    : 0;

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-slate-900 via-slate-800 to-indigo-900 p-6 text-white shadow-xl">
        <div className="relative z-10">
          <h2 className="text-2xl font-bold">Welcome back, Admin 👋</h2>
          <p className="mt-1 text-slate-300 text-sm">Here's what's happening on your platform today.</p>
          <div className="mt-4 flex flex-wrap gap-4">
            <div className="flex items-center gap-2 rounded-lg bg-white/10 px-3 py-2 backdrop-blur-sm">
              <div className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-sm font-medium">{onlineCount} Active Now</span>
            </div>
            <div className="flex items-center gap-2 rounded-lg bg-white/10 px-3 py-2 backdrop-blur-sm">
              <Clock className="h-4 w-4 text-amber-300" />
              <span className="text-sm font-medium">{pending.length} Pending Review</span>
            </div>
            <div className="flex items-center gap-2 rounded-lg bg-white/10 px-3 py-2 backdrop-blur-sm">
              <CheckCircle className="h-4 w-4 text-emerald-300" />
              <span className="text-sm font-medium">{approvalRate}% Approval Rate</span>
            </div>
          </div>
        </div>
        {/* Decorative elements */}
        <div className="absolute -right-12 -top-12 h-48 w-48 rounded-full bg-indigo-600/20 blur-2xl" />
        <div className="absolute -bottom-8 -left-8 h-32 w-32 rounded-full bg-blue-500/10 blur-2xl" />
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-3 xl:grid-cols-5">
        <StatCard label="Total Papers" value={totalPapers} icon={FileText} color="blue" trend={stats?.growth?.last7?.papers} trendUp />
        <StatCard label="Pending Review" value={pending.length} icon={FileClock} color="amber" subtext="Awaiting moderation" />
        <StatCard label="Total Users" value={totalUsers} icon={Users} color="emerald" trend={stats?.growth?.last7?.users} trendUp />
        <StatCard label="Total Comments" value={stats?.totals?.comments ?? 0} icon={MessageSquare} color="purple" trend={stats?.growth?.last7?.comments} trendUp />
        <StatCard label="Total Likes" value={stats?.totals?.likes ?? 0} icon={Heart} color="rose" trend={stats?.growth?.last7?.likes} trendUp />
      </div>

      {/* Charts Row */}
      <div className="grid gap-3 sm:gap-4 md:grid-cols-2 lg:grid-cols-3">
        {/* Paper Status Donut */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h3 className="mb-4 text-sm font-semibold text-slate-900">Paper Status Distribution</h3>
          <DonutChart
            segments={[
              { label: "Approved", value: approvedPapers.length, color: "#10b981" },
              { label: "Pending", value: pendingPapers.length, color: "#f59e0b" },
              { label: "Rejected", value: rejectedPapers.length, color: "#ef4444" },
            ]}
            size={160}
          />
        </div>

        {/* Uploads Chart */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between mb-1">
            <h3 className="text-sm font-semibold text-slate-900">Uploads This Week</h3>
            <span className="flex items-center gap-1 text-xs font-semibold text-emerald-600">
              <TrendingUp className="h-3 w-3" />
              {stats?.growth?.last7?.papers ?? 0} new
            </span>
          </div>
          <MiniBarChart
            data={stats?.chartData?.dailyUploads ?? [0, 0, 0, 0, 0, 0, 0]}
            labels={stats?.chartData?.dayLabels ?? ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]}
            color="#6366f1"
            height={130}
          />
        </div>

        {/* Engagement Chart */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between mb-1">
            <h3 className="text-sm font-semibold text-slate-900">Engagement This Week</h3>
            <span className="flex items-center gap-1 text-xs font-semibold text-blue-600">
              <Activity className="h-3 w-3" />
              Active
            </span>
          </div>
          <MiniLineChart
            data={stats?.chartData?.dailyComments ?? [0, 0, 0, 0, 0, 0, 0]}
            labels={stats?.chartData?.dayLabels ?? ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]}
            color="#3b82f6"
            height={130}
            title="Comments"
          />
        </div>
      </div>

      {/* Leaderboards & Pending Row */}
      <div className="grid gap-3 sm:gap-4 md:grid-cols-2 lg:grid-cols-3">
        {/* Top Uploaders */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-slate-900">🏆 Top Uploaders</h3>
            <button onClick={() => setActiveTab("users")} className="text-xs font-semibold text-blue-600 hover:text-blue-700">
              View all →
            </button>
          </div>
          <div className="space-y-2.5">
            {(stats?.topUploaders ?? []).map((uploader, idx) => (
              <div key={idx} className="flex items-center gap-3">
                <div className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold text-white ${
                  idx === 0 ? "bg-amber-500" : idx === 1 ? "bg-slate-400" : idx === 2 ? "bg-amber-700" : "bg-slate-300"
                }`}>
                  {idx + 1}
                </div>
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 text-xs font-bold text-white overflow-hidden">
                  {uploader.image ? (
                    <img src={uploader.image} alt="" className="h-full w-full object-cover" />
                  ) : (
                    uploader.name[0]?.toUpperCase()
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="truncate text-sm font-semibold text-slate-900">@{uploader.name}</p>
                </div>
                <span className="rounded-full bg-indigo-50 px-2 py-0.5 text-xs font-bold text-indigo-700">{uploader.count} papers</span>
              </div>
            ))}
            {(!stats?.topUploaders || stats.topUploaders.length === 0) && (
              <p className="text-sm text-slate-400 py-4 text-center">No data yet</p>
            )}
          </div>
        </div>

        {/* Top Commenters */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-slate-900">💬 Top Commenters</h3>
            <button onClick={() => setActiveTab("comments")} className="text-xs font-semibold text-blue-600 hover:text-blue-700">
              View all →
            </button>
          </div>
          <div className="space-y-2.5">
            {(stats?.topCommenters ?? []).map((commenter, idx) => (
              <div key={idx} className="flex items-center gap-3">
                <div className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold text-white ${
                  idx === 0 ? "bg-amber-500" : idx === 1 ? "bg-slate-400" : idx === 2 ? "bg-amber-700" : "bg-slate-300"
                }`}>
                  {idx + 1}
                </div>
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 text-xs font-bold text-white overflow-hidden">
                  {commenter.image ? (
                    <img src={commenter.image} alt="" className="h-full w-full object-cover" />
                  ) : (
                    commenter.name[0]?.toUpperCase()
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="truncate text-sm font-semibold text-slate-900">@{commenter.name}</p>
                </div>
                <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-bold text-emerald-700">{commenter.count} comments</span>
              </div>
            ))}
            {(!stats?.topCommenters || stats.topCommenters.length === 0) && (
              <p className="text-sm text-slate-400 py-4 text-center">No data yet</p>
            )}
          </div>
        </div>

        {/* Pending Review Queue */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-slate-900">⏳ Pending Review</h3>
            <button onClick={() => setActiveTab("moderation")} className="text-xs font-semibold text-blue-600 hover:text-blue-700">
              View all →
            </button>
          </div>
          <div className="space-y-2.5">
            {pending.slice(0, 4).map((paper) => (
              <div key={paper._id} className="flex items-center justify-between rounded-xl bg-slate-50 p-3 transition-colors hover:bg-slate-100">
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-slate-900">{paper.title}</p>
                  <p className="text-xs text-slate-500">{paper.department} • {paper.subject}</p>
                </div>
                <button
                  onClick={() => {
                    setActiveTab("moderation");
                    setActivePaper(paper);
                  }}
                  className="flex-shrink-0 rounded-lg bg-blue-100 px-3 py-1.5 text-xs font-semibold text-blue-700 hover:bg-blue-200 transition-colors"
                >
                  Review
                </button>
              </div>
            ))}
            {pending.length === 0 && (
              <div className="flex flex-col items-center py-6">
                <CheckCircle className="h-10 w-10 text-emerald-300" />
                <p className="mt-2 text-sm text-slate-500">All caught up! 🎉</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Department Distribution & Most Popular */}
      <div className="grid gap-3 sm:gap-4 md:grid-cols-2">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h3 className="mb-3 text-sm font-semibold text-slate-900">📊 Papers by Department</h3>
          <HorizontalBarChart
            items={(stats?.topDepartments ?? []).map((d) => ({ label: d.name, value: d.count }))}
            color="#6366f1"
          />
          {(!stats?.topDepartments || stats.topDepartments.length === 0) && (
            <p className="text-sm text-slate-400 py-4 text-center">No data yet</p>
          )}
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h3 className="mb-3 text-sm font-semibold text-slate-900">🔥 Most Popular Papers</h3>
          <div className="space-y-2">
            {(stats?.mostLikedPapers ?? []).map((paper, idx) => (
              <div key={idx} className="flex items-center gap-3 rounded-lg bg-slate-50 p-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-rose-100">
                  <Heart className="h-4 w-4 text-rose-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="truncate text-sm font-semibold text-slate-900">{paper.title}</p>
                  <p className="text-xs text-slate-500">{paper.department}</p>
                </div>
                <span className="rounded-full bg-rose-50 px-2 py-0.5 text-xs font-bold text-rose-600">{paper.likeCount} ❤️</span>
              </div>
            ))}
            {(!stats?.mostLikedPapers || stats.mostLikedPapers.length === 0) && (
              <p className="text-sm text-slate-400 py-4 text-center">No data yet</p>
            )}
          </div>
        </div>
      </div>

      {/* Recent Activity Stream */}
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-slate-900">📡 Live Activity Feed</h3>
          <button onClick={() => setActiveTab("activity")} className="text-xs font-semibold text-blue-600 hover:text-blue-700">
            View all →
          </button>
        </div>
        <div className="space-y-2">
          {activity.slice(0, 8).map((item) => (
            <div key={item._id || item.id} className="flex items-center gap-3 rounded-lg px-3 py-2.5 transition-colors hover:bg-slate-50">
              <div className={`flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full ${
                item.type === "comment" ? "bg-blue-100" :
                item.type === "paper_edit" ? "bg-amber-100" :
                item.type === "upload" ? "bg-indigo-100" :
                "bg-rose-100"
              }`}>
                {item.type === "comment" ? <MessageSquare className="h-4 w-4 text-blue-600" /> :
                 item.type === "paper_edit" ? <FileText className="h-4 w-4 text-amber-600" /> :
                 item.type === "upload" ? <Upload className="h-4 w-4 text-indigo-600" /> :
                 <Heart className="h-4 w-4 text-rose-600" />}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm text-slate-700">
                  <span className="font-semibold">@{item.actorName}</span>{" "}
                  {item.type === "comment" ? "commented on" :
                   item.type === "paper_edit" ? "edited" :
                   item.type === "upload" ? "uploaded" :
                   "liked"}{" "}
                  <span className="font-semibold">{item.paperTitle}</span>
                </p>
              </div>
              <span className="flex-shrink-0 text-xs text-slate-400">{formatDate(item.createdAt)}</span>
            </div>
          ))}
          {activity.length === 0 && (
            <p className="text-center text-sm text-slate-400 py-4">No activity yet</p>
          )}
        </div>
      </div>

      {/* Quick Stats Grid */}
      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        <div className="group rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition-all hover:shadow-md">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-100">
              <FileCheck className="h-5 w-5 text-emerald-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-900">{approvedPapers.length}</p>
              <p className="text-xs text-slate-500">Approved Papers</p>
            </div>
          </div>
        </div>
        <div className="group rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition-all hover:shadow-md">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-100">
              <FileX className="h-5 w-5 text-red-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-900">{rejectedPapers.length}</p>
              <p className="text-xs text-slate-500">Rejected Papers</p>
            </div>
          </div>
        </div>
        <div className="group rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition-all hover:shadow-md">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-100">
              <MessageSquare className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-900">{stats?.totals?.comments ?? 0}</p>
              <p className="text-xs text-slate-500">Total Comments</p>
            </div>
          </div>
        </div>
        <div className="group rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition-all hover:shadow-md">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-100">
              <Globe className="h-5 w-5 text-violet-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-900">{stats?.totals?.notifications ?? 0}</p>
              <p className="text-xs text-slate-500">Notifications Sent</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
