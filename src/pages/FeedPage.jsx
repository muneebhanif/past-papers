import { useConvexAuth, useQuery } from "convex/react";
import { useEffect, useRef, useState } from "react";
import { useLocation } from "react-router-dom";
import { useWindowVirtualizer } from "@tanstack/react-virtual";
import { useHybridFeed } from "../hooks/useHybridFeed";
import { api } from "../lib/api";
import { LoginSplash } from "../components/feed/LoginSplash";
import { PaperCard } from "../components/feed/PaperCard";
import { DEPARTMENTS } from "../constants/departments";
import { SEMESTERS } from "../constants/academicOptions";
import {
  Search,
  ChevronDown,
  BookOpen,
  GraduationCap,
  FileText,
  FolderOpen,
  Sparkles,
  TrendingUp,
  Clock,
  CheckCircle2,
  X,
  SlidersHorizontal,
  LayoutGrid,
  List,
  Trophy,
  Crown,
} from "lucide-react";

const PAPER_TABS = [
  { id: "All", label: "All", mobileLabel: "All", icon: FileText },
  { id: "Midterm", label: "Midterm", mobileLabel: "Mid", icon: Clock },
  { id: "Terminal", label: "Terminal", mobileLabel: "Term", icon: CheckCircle2 },
  { id: "Summer", label: "Summer", mobileLabel: "Sum", icon: Sparkles },
  { id: "Improve", label: "Improve", mobileLabel: "Imp", icon: TrendingUp },
];

const departmentConfig = {
  All: {
    subtitle: "Explore All Departments",
    description: "Browse papers from Computer Science, IT, and more",
    gradient: "from-blue-600 via-indigo-600 to-purple-600",
    bgPattern: "bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50",
  },
  "Computer Science": {
    subtitle: "Department of CSIT",
    description: "Computer Science exam papers and resources",
    gradient: "from-cyan-600 via-blue-600 to-indigo-600",
    bgPattern: "bg-gradient-to-br from-cyan-50 via-blue-50 to-indigo-50",
  },
  "Information Technology": {
    subtitle: "Department of CSIT",
    description: "Information Technology exam papers and resources",
    gradient: "from-emerald-600 via-teal-600 to-cyan-600",
    bgPattern: "bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50",
  },
};

const getConfig = (department) =>
  departmentConfig[department] || {
    subtitle: `Department of ${department}`,
    description: `${department} exam papers and resources`,
    gradient: "from-slate-600 via-gray-600 to-zinc-600",
    bgPattern: "bg-gradient-to-br from-slate-50 via-gray-50 to-zinc-50",
  };

/* ------------------------------------------------------------------ */
/*  Skeleton                                                          */
/* ------------------------------------------------------------------ */
const PaperCardSkeleton = () => (
  <div className="animate-pulse overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
    <div className="p-4 md:p-6">
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 rounded-full bg-slate-200 md:h-11 md:w-11" />
        <div className="space-y-2">
          <div className="h-4 w-24 rounded bg-slate-200" />
          <div className="h-3 w-16 rounded bg-slate-200" />
        </div>
      </div>
      <div className="mt-4 space-y-2">
        <div className="h-5 w-3/4 rounded bg-slate-200 md:h-6" />
        <div className="h-4 w-1/2 rounded bg-slate-200" />
      </div>
      <div className="mt-3 flex gap-2">
        <div className="h-6 w-20 rounded-full bg-slate-200" />
        <div className="h-6 w-16 rounded-full bg-slate-200" />
      </div>
    </div>
    <div className="h-64 w-full bg-slate-100 sm:h-80 md:h-[30rem]" />
    <div className="p-4 md:p-6">
      <div className="flex gap-3">
        <div className="h-10 flex-1 rounded-lg bg-slate-200" />
        <div className="h-10 flex-1 rounded-lg bg-slate-200" />
        <div className="h-10 flex-1 rounded-lg bg-slate-200" />
      </div>
    </div>
  </div>
);

/* ------------------------------------------------------------------ */
/*  Empty state                                                       */
/* ------------------------------------------------------------------ */
const EmptyState = ({ search, department, onClear }) => (
  <div className="relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-6 text-center shadow-sm sm:p-8 md:p-12">
    <div className="absolute inset-0 opacity-50">
      <div className="absolute -right-20 -top-20 h-48 w-48 rounded-full bg-gradient-to-br from-blue-100 to-indigo-100 md:h-64 md:w-64" />
      <div className="absolute -bottom-20 -left-20 h-48 w-48 rounded-full bg-gradient-to-br from-purple-100 to-pink-100 md:h-64 md:w-64" />
    </div>

    <div className="relative">
      <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-slate-100 to-slate-200 md:mb-6 md:h-20 md:w-20">
        <FolderOpen className="h-8 w-8 text-slate-400 md:h-10 md:w-10" />
      </div>

      <h3 className="text-lg font-bold text-slate-900 md:text-xl">No papers found</h3>
      <p className="mx-auto mt-2 max-w-md text-sm text-slate-500">
        {search
          ? `We couldn't find any papers matching "${search}" in ${department === "All" ? "any department" : department}.`
          : `No approved papers available in ${department === "All" ? "any department" : department} yet.`}
      </p>

      {search && (
        <button
          onClick={onClear}
          className="mt-5 inline-flex items-center gap-2 rounded-full bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white active:scale-95"
        >
          <X className="h-4 w-4" />
          Clear search
        </button>
      )}
    </div>
  </div>
);

/* ------------------------------------------------------------------ */
/*  Filter pill                                                       */
/* ------------------------------------------------------------------ */
const FilterPill = ({ label, value, onClear }) => (
  <span className="inline-flex items-center gap-1.5 rounded-full border border-blue-300/60 bg-blue-50 px-2.5 py-1 text-xs font-semibold text-blue-700 dark:border-blue-400/30 dark:bg-blue-500/15 dark:text-blue-300">
    {label}: {value}
    <button onClick={onClear} className="rounded-full p-0.5 hover:bg-blue-200/60 dark:hover:bg-blue-400/20">
      <X className="h-3 w-3" />
    </button>
  </span>
);

/* ------------------------------------------------------------------ */
/*  VirtualFeed — only renders cards visible in the viewport          */
/* ------------------------------------------------------------------ */
function VirtualFeed({ papers, viewMode, highlightedPaperId, onRequireAuth }) {
  const parentRef = useRef(null);
  const [scrollMargin, setScrollMargin] = useState(0);

  useEffect(() => {
    if (parentRef.current) {
      setScrollMargin(parentRef.current.getBoundingClientRect().top + window.scrollY);
    }
  }, []);

  const virtualizer = useWindowVirtualizer({
    count: papers.length,
    estimateSize: () => 900,
    overscan: 3,
    scrollMargin,
  });

  const items = virtualizer.getVirtualItems();

  return (
    <div ref={parentRef}>
      {viewMode === "grid" ? (
        <div className="grid gap-4 sm:gap-6 md:grid-cols-2">
          {papers.map((paper) => (
            <PaperCard
              key={paper._id}
              paper={paper}
              onRequireAuth={onRequireAuth}
              isFocused={highlightedPaperId === paper._id}
            />
          ))}
        </div>
      ) : (
        <div style={{ height: virtualizer.getTotalSize(), position: "relative" }}>
          {items.map((virtualRow) => (
            <div
              key={virtualRow.key}
              data-index={virtualRow.index}
              ref={virtualizer.measureElement}
              style={{
                position: "absolute",
                top: 0,
                left: 0,
                width: "100%",
                transform: `translateY(${virtualRow.start - scrollMargin}px)`,
              }}
              className="pb-4 sm:pb-6"
            >
              <PaperCard
                paper={papers[virtualRow.index]}
                onRequireAuth={onRequireAuth}
                isFocused={highlightedPaperId === papers[virtualRow.index]._id}
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Main FeedPage                                                     */
/* ------------------------------------------------------------------ */
export function FeedPage({ department, setDepartment, search, setSearch, onRequireAuth }) {
  const { isAuthenticated } = useConvexAuth();
  const me = useQuery(api.users.current, isAuthenticated ? {} : "skip");
  const rightRailData = useQuery(api.papers.rightRailData);

  const [paperType, setPaperType] = useState("All");
  const [semester, setSemester] = useState("All");
  const [showFilters, setShowFilters] = useState(false);
  const [viewMode, setViewMode] = useState("feed");
  const [showContributorsPopup, setShowContributorsPopup] = useState(false);
  const location = useLocation();
  const highlightedPaperId = new URLSearchParams(location.search).get("paper") || "";
  const searchInputRef = useRef(null);
  const tabScrollRef = useRef(null);

  const config = getConfig(department);

  const { results, status, loadMore, isHybridMode, httpLoading } = useHybridFeed({
    department,
    search,
    paperType,
    semester,
  });

  const displayedPapers = results;
  const topThreeContributors = (rightRailData?.topContributors ?? []).slice(0, 3);
  const myRankIndex = topThreeContributors.findIndex((item) => item.userId === me?._id);
  const myRank = myRankIndex >= 0 ? myRankIndex + 1 : null;

  const dismissContributorsPopup = () => {
    setShowContributorsPopup(false);
  };

  const openContributorsPopup = () => {
    if (!topThreeContributors.length) return;
    setShowContributorsPopup(true);
  };

  // Scroll to highlighted paper
  useEffect(() => {
    if (!highlightedPaperId || !displayedPapers.length) return;
    // Sanitize: Convex IDs are alphanumeric with some special chars. Reject anything suspicious.
    if (!/^[a-zA-Z0-9_-]+$/.test(highlightedPaperId)) return;
    const target = document.querySelector(`[data-paper-id="${CSS.escape(highlightedPaperId)}"]`);
    if (!target) return;
    setTimeout(() => {
      target.scrollIntoView({ behavior: "smooth", block: "center" });
    }, 100);
  }, [highlightedPaperId, displayedPapers]);

  // Scroll active tab into view on mobile
  useEffect(() => {
    if (!tabScrollRef.current) return;
    const activeBtn = tabScrollRef.current.querySelector("[data-active-tab]");
    if (activeBtn) {
      activeBtn.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "center" });
    }
  }, [paperType]);

  const hasActiveFilters = paperType !== "All" || semester !== "All" || search;
  const activeFilterCount = [paperType !== "All", semester !== "All", search].filter(Boolean).length;

  const clearAllFilters = () => {
    setPaperType("All");
    setSemester("All");
    setSearch("");
  };

  return (
    <div className="space-y-4 pb-24 sm:space-y-6 xl:pb-0">
      <LoginSplash />

      {topThreeContributors.length ? (
        <button
          type="button"
          onClick={openContributorsPopup}
          className="inline-flex items-center gap-2 rounded-full bg-white px-3 py-2 text-xs font-bold text-blue-700 shadow-sm ring-1 ring-slate-200 active:scale-95 sm:text-sm"
        >
          <Trophy className="h-4 w-4" />
          Top Contributors
        </button>
      ) : null}

      {/* ============================================================ */}
      {/*  HEADER                                                      */}
      {/* ============================================================ */}
      <header className="relative overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-700/60 dark:bg-slate-900 dark:shadow-xl">
        {/* Subtle grid texture (dark only) */}
        <div
          className="pointer-events-none absolute inset-0 opacity-0 dark:opacity-[0.04]"
          style={{ backgroundImage: "linear-gradient(rgba(255,255,255,.5) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,.5) 1px,transparent 1px)", backgroundSize: "32px 32px" }}
        />
        {/* Accent glow */}
        <div className={`pointer-events-none absolute -right-20 -top-20 h-72 w-72 rounded-full bg-gradient-to-br ${config.gradient} opacity-10 blur-3xl dark:opacity-20`} />
        <div className="pointer-events-none absolute -bottom-10 -left-10 h-48 w-48 rounded-full bg-blue-400/10 blur-2xl dark:bg-blue-500/10" />

        <div className="relative p-4 sm:p-6">
          {/* ---- Mobile Department Selector ---- */}
          <div className="mb-4 xl:hidden">
            <div className="relative">
              <GraduationCap className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <select
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                className="w-full appearance-none rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-10 pr-10 text-sm font-semibold text-slate-800 focus:border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500/30 dark:border-white/10 dark:bg-white/5 dark:text-white dark:focus:border-white/20 dark:focus:ring-white/10"
              >
                {DEPARTMENTS.map((item) => (
                  <option key={item} value={item} className="bg-white text-slate-900 dark:bg-slate-900 dark:text-white">
                    {item}
                  </option>
                ))}
              </select>
              <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            </div>
          </div>

          {/* ---- Title row ---- */}
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <p className="mb-1 text-[11px] font-bold uppercase tracking-[0.15em] text-slate-400 dark:text-slate-400">
                {config.subtitle}
              </p>
              <h1 className="text-2xl font-black leading-none tracking-tight text-slate-900 dark:text-white sm:text-3xl md:text-4xl">
                <span className={`bg-gradient-to-r ${config.gradient} bg-clip-text text-transparent`}>
                  {department === "All" ? "Academic Archive" : department}
                </span>
              </h1>
              <p className="mt-1.5 text-xs text-slate-500 dark:text-slate-400 sm:text-sm">
                {config.description}
              </p>
            </div>
            <div className="hidden flex-shrink-0 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-center dark:border-white/10 dark:bg-white/5 md:block">
              <p className="text-xl font-black text-slate-900 dark:text-white">{results.length}</p>
              <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">Papers</p>
            </div>
          </div>

          {/* ---- Search ---- */}
          <div className="relative mt-4">
            <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              ref={searchInputRef}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={`Search ${department === "All" ? "all departments" : department}…`}
              className="w-full rounded-xl border border-slate-200 bg-slate-50 py-3 pl-10 pr-10 text-sm text-slate-900 placeholder:text-slate-400 transition-all focus:border-blue-300 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/30 dark:border-white/10 dark:bg-white/5 dark:text-white dark:placeholder:text-slate-500 dark:focus:border-white/20 dark:focus:bg-white/8 dark:focus:ring-blue-500/40"
            />
            {search && (
              <button
                onClick={() => setSearch("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full p-1 text-slate-400 hover:text-slate-700 active:text-slate-900 dark:hover:text-white dark:active:text-white"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>

          {/* ---- Type tabs + controls ---- */}
          <div className="mt-3 flex items-center gap-2">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`inline-flex flex-shrink-0 items-center gap-1.5 rounded-xl border px-3 py-2 text-xs font-bold transition-all active:scale-95 ${
                showFilters || hasActiveFilters
                  ? "border-blue-300 bg-blue-50 text-blue-700 dark:border-blue-400/50 dark:bg-blue-500/20 dark:text-blue-300"
                  : "border-slate-200 bg-slate-50 text-slate-600 hover:border-slate-300 hover:bg-slate-100 dark:border-white/10 dark:bg-white/5 dark:text-slate-300 dark:hover:bg-white/10"
              }`}
            >
              <SlidersHorizontal className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Filters</span>
              {activeFilterCount > 0 && (
                <span className="flex h-4 w-4 items-center justify-center rounded-full bg-blue-600 text-[10px] font-black text-white dark:bg-blue-500">
                  {activeFilterCount}
                </span>
              )}
            </button>

            <div
              ref={tabScrollRef}
              className="flex flex-1 gap-1.5 overflow-x-auto scrollbar-none"
              style={{ WebkitOverflowScrolling: "touch" }}
            >
              {PAPER_TABS.map((tab) => {
                const isActive = paperType === tab.id;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    {...(isActive ? { "data-active-tab": true } : {})}
                    onClick={() => setPaperType(tab.id)}
                    className={`inline-flex flex-shrink-0 items-center gap-1.5 whitespace-nowrap rounded-xl px-3 py-2 text-xs font-bold transition-all active:scale-95 sm:px-4 sm:py-2 sm:text-sm ${
                      isActive
                        ? "bg-slate-900 text-white shadow-md dark:bg-white dark:text-slate-900"
                        : "border border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100 dark:border-white/10 dark:bg-white/5 dark:text-slate-300 dark:hover:bg-white/10"
                    }`}
                  >
                    <span className="sm:hidden">{tab.mobileLabel}</span>
                    <span className="hidden sm:inline">{tab.label}</span>
                  </button>
                );
              })}
            </div>

            <div className="hidden items-center gap-1 rounded-xl border border-slate-200 bg-slate-50 p-1 dark:border-white/10 dark:bg-white/5 md:flex">
              <button
                onClick={() => setViewMode("feed")}
                className={`rounded-lg p-1.5 transition-all ${
                  viewMode === "feed"
                    ? "bg-slate-900 text-white shadow dark:bg-white dark:text-slate-900"
                    : "text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white"
                }`}
              >
                <List className="h-4 w-4" />
              </button>
              <button
                onClick={() => setViewMode("grid")}
                className={`rounded-lg p-1.5 transition-all ${
                  viewMode === "grid"
                    ? "bg-slate-900 text-white shadow dark:bg-white dark:text-slate-900"
                    : "text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white"
                }`}
              >
                <LayoutGrid className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* ---- Active filter pills ---- */}
          {hasActiveFilters && !showFilters && (
            <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
              {paperType !== "All" && (
                <FilterPill label="Type" value={paperType} onClear={() => setPaperType("All")} />
              )}
              {semester !== "All" && (
                <FilterPill label="Sem" value={semester} onClear={() => setSemester("All")} />
              )}
              {search && (
                <FilterPill
                  label="Search"
                  value={search.length > 12 ? `${search.slice(0, 12)}…` : search}
                  onClear={() => setSearch("")}
                />
              )}
              <button onClick={clearAllFilters} className="text-xs font-semibold text-slate-500 hover:text-slate-700 dark:text-slate-500 dark:hover:text-slate-300">
                Clear all
              </button>
            </div>
          )}

          {/* ---- Expandable filter panel ---- */}
          <div className={`grid transition-all duration-300 ${showFilters ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"}`}>
            <div className="overflow-hidden">
              <div className="mt-3 rounded-xl border border-slate-200 bg-slate-50 p-3 dark:border-white/10 dark:bg-white/5 sm:p-4">
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  <div>
                    <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Semester</label>
                    <div className="relative">
                      <select
                        value={semester}
                        onChange={(e) => setSemester(e.target.value)}
                        className="w-full appearance-none rounded-lg border border-slate-200 bg-white px-3 py-2.5 pr-8 text-sm font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/30 dark:border-white/10 dark:bg-white/5 dark:text-white dark:focus:ring-blue-500/40"
                      >
                        <option value="All" className="bg-white text-slate-900 dark:bg-slate-900 dark:text-white">All Semesters</option>
                        {SEMESTERS.map((s) => (
                          <option key={s} value={s} className="bg-white text-slate-900 dark:bg-slate-900 dark:text-white">Semester {s}</option>
                        ))}
                      </select>
                      <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                    </div>
                  </div>
                </div>
                {hasActiveFilters && (
                  <div className="mt-3 flex items-center justify-between border-t border-slate-200 pt-3 dark:border-white/10">
                    <div className="flex flex-wrap gap-1.5">
                      {paperType !== "All" && <FilterPill label="Type" value={paperType} onClear={() => setPaperType("All")} />}
                      {semester !== "All" && <FilterPill label="Semester" value={semester} onClear={() => setSemester("All")} />}
                      {search && <FilterPill label="Search" value={search.length > 15 ? `${search.slice(0, 15)}…` : search} onClear={() => setSearch("")} />}
                    </div>
                    <button onClick={clearAllFilters} className="text-xs font-semibold text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-white">Clear all</button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* ============================================================ */}
      {/*  RESULTS COUNT                                               */}
      {/* ============================================================ */}
      {displayedPapers.length > 0 && (
        <div className="flex items-center justify-between px-1">
          <p className="text-xs font-medium text-slate-500">
            <span className="font-bold text-slate-700">{displayedPapers.length}</span> papers{hasActiveFilters && " matched"}
          </p>
          {isHybridMode && (
            <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2.5 py-1 text-[11px] font-semibold text-amber-700">
              <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
              Offline mode
            </span>
          )}
        </div>
      )}

      {/* ============================================================ */}
      {/*  PAPER CARDS                                                 */}
      {/* ============================================================ */}
      {status === "LoadingFirstPage" ? (
        <div className="space-y-4 sm:space-y-6">
          <PaperCardSkeleton />
          <PaperCardSkeleton />
        </div>
      ) : displayedPapers.length === 0 ? (
        <EmptyState search={search} department={department} onClear={() => setSearch("")} />
      ) : (
        <VirtualFeed
          papers={displayedPapers}
          viewMode={viewMode}
          highlightedPaperId={highlightedPaperId}
          onRequireAuth={onRequireAuth}
        />
      )}

      {/* ============================================================ */}
      {/*  LOAD MORE                                                    */}
      {/* ============================================================ */}
      {status === "CanLoadMore" && (
        <div className="flex justify-center pb-2">
          <button
            onClick={() => loadMore(10)}
            disabled={httpLoading}
            className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-6 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition-all active:scale-95 disabled:opacity-60"
          >
            {httpLoading ? (
              <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
              </svg>
            ) : null}
            {httpLoading ? "Loading…" : "Load more papers"}
          </button>
        </div>
      )}

      {/* ============================================================ */}
      {/*  BACK-TO-TOP (above bottom nav on mobile)                    */}
      {/* ============================================================ */}
      <button
        onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
        className="fixed bottom-[5.5rem] right-3 z-40 flex h-10 w-10 items-center justify-center rounded-full bg-slate-900/90 text-white shadow-lg backdrop-blur-sm transition-all active:scale-90 sm:bottom-28 sm:right-4 sm:h-12 sm:w-12 xl:bottom-8"
        aria-label="Back to top"
      >
        <svg className="h-4 w-4 sm:h-5 sm:w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
        </svg>
      </button>

      {/* ============================================================ */}
      {/*  MOBILE TOP CONTRIBUTORS POPUP                               */}
      {/* ============================================================ */}
      {showContributorsPopup && topThreeContributors.length ? (
        <div className="fixed inset-x-3 bottom-[5.15rem] z-40 rounded-2xl border border-slate-200 bg-white p-3 shadow-xl xl:hidden">
          <div className="mb-2 flex items-start justify-between gap-3">
            <div>
              <p className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide text-blue-700">
                <Trophy className="h-3.5 w-3.5" />
                Top Contributors
              </p>
              <p className="mt-0.5 text-[11px] text-slate-500">Top 3 this week — keep uploading!</p>
            </div>
            <button
              type="button"
              onClick={dismissContributorsPopup}
              className="rounded-full p-1 text-slate-400 active:bg-slate-100"
              aria-label="Close top contributors popup"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="space-y-1.5">
            {topThreeContributors.map((item, index) => (
              <div key={item.userId} className="flex items-center justify-between rounded-xl bg-slate-50 px-3 py-2">
                <p className="flex min-w-0 items-center gap-2 text-xs font-semibold text-slate-700">
                  <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-blue-100 text-[10px] font-bold text-blue-700">
                    #{index + 1}
                  </span>
                  <span className="truncate">{item.name}</span>
                  {index === 0 ? <Crown className="h-3.5 w-3.5 text-amber-500" /> : null}
                </p>
                <span className="text-xs font-bold text-emerald-700">{item.approvedCount}</span>
              </div>
            ))}
          </div>

          {myRank ? (
            <p className="mt-2 rounded-lg bg-emerald-50 px-2.5 py-2 text-xs font-semibold text-emerald-700">
              You are in position #{myRank} — keep it up! 🚀
            </p>
          ) : null}
        </div>
      ) : null}

      {/* Hide-scrollbar utility (applied via className "scrollbar-none") */}
      <style>{`
        .scrollbar-none {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
        .scrollbar-none::-webkit-scrollbar {
          display: none;
        }
      `}</style>
    </div>
  );
}