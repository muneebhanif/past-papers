import { useConvexAuth, usePaginatedQuery, useQuery } from "convex/react";
import { useEffect, useRef, useState } from "react";
import { useLocation } from "react-router-dom";
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
  <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-100 px-3 py-1 text-xs font-semibold text-blue-700">
    {label}: {value}
    <button
      onClick={onClear}
      className="rounded-full p-0.5 active:bg-blue-200"
    >
      <X className="h-3 w-3" />
    </button>
  </span>
);

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

  const { results, status } = usePaginatedQuery(
    api.papers.listApproved,
    { department, search, paperType, semester },
    { initialNumItems: 6 },
  );

  const displayedPapers = results.slice(0, 6);
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
      <header className="relative overflow-hidden rounded-xl border border-slate-200/80 bg-white shadow-sm sm:rounded-2xl">
        {/* Background layers */}
        <div className={`absolute inset-0 ${config.bgPattern} opacity-60`} />
        <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg%20width%3D%2260%22%20height%3D%2260%22%20viewBox%3D%220%200%2060%2060%22%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%3E%3Cg%20fill%3D%22none%22%20fill-rule%3D%22evenodd%22%3E%3Cg%20fill%3D%22%239C92AC%22%20fill-opacity%3D%220.03%22%3E%3Cpath%20d%3D%22M36%2034v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6%2034v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6%204V0H4v4H0v2h4v4h2V6h4V4H6z%22%2F%3E%3C%2Fg%3E%3C%2Fg%3E%3C%2Fsvg%3E')] opacity-50" />

        <div className="relative p-4 sm:p-6 md:p-8">
          {/* ---- Mobile Department Selector ---- */}
          <div className="mb-4 sm:mb-6 xl:hidden">
            <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wider text-slate-500 sm:text-xs">
              Department
            </label>
            <div className="relative">
              <GraduationCap className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <select
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                className="w-full appearance-none rounded-xl border border-slate-200 bg-white py-3 pl-10 pr-10 text-sm font-semibold text-slate-700 shadow-sm transition-all focus:border-blue-300 focus:outline-none focus:ring-4 focus:ring-blue-50"
              >
                {DEPARTMENTS.map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </select>
              <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
            </div>
          </div>

          {/* ---- Title ---- */}
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="mb-1.5 inline-flex items-center gap-1.5 rounded-full bg-white/80 px-2.5 py-0.5 text-[11px] font-semibold text-slate-600 shadow-sm backdrop-blur-sm sm:mb-2 sm:px-3 sm:py-1 sm:text-xs">
                <GraduationCap className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
                {config.subtitle}
              </div>
              <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl md:text-4xl lg:text-5xl">
                <span className={`bg-gradient-to-r ${config.gradient} bg-clip-text text-transparent`}>
                  {department === "All" ? "Academic Archive" : department}
                </span>
              </h1>
              <p className="mt-1 text-xs text-slate-600 sm:mt-2 sm:text-sm md:text-base">
                {config.description}
              </p>
            </div>

            {/* Stats — hidden on small screens */}
            <div className="hidden flex-shrink-0 items-center gap-2 rounded-xl bg-white/80 px-4 py-3 shadow-sm backdrop-blur-sm md:flex">
              <BookOpen className="h-5 w-5 text-blue-600" />
              <div>
                <p className="text-lg font-bold text-slate-900">{Math.min(results.length, 6)}</p>
                <p className="text-xs text-slate-500">Papers</p>
              </div>
            </div>
          </div>

          {/* ---- Search & Filters ---- */}
          <div className="mt-4 space-y-3 sm:mt-6 sm:space-y-4">
            {/* Search */}
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400 sm:left-4 sm:h-5 sm:w-5" />
              <input
                ref={searchInputRef}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={`Search in ${department === "All" ? "all departments" : department}…`}
                className="w-full rounded-xl border border-slate-200 bg-white py-3 pl-10 pr-10 text-sm text-slate-700 shadow-sm transition-all placeholder:text-slate-400 focus:border-blue-300 focus:outline-none focus:ring-4 focus:ring-blue-50 sm:py-3.5 sm:pl-12 sm:pr-4"
              />
              {search && (
                <button
                  onClick={() => setSearch("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full p-1 active:bg-slate-100"
                >
                  <X className="h-4 w-4 text-slate-400" />
                </button>
              )}
            </div>

            {/* ---- Filter row ---- */}
            <div className="flex items-center gap-2 sm:gap-3">
              {/* Filter toggle */}
              <button
                onClick={() => setShowFilters(!showFilters)}
                className={`inline-flex flex-shrink-0 items-center gap-1.5 rounded-xl border px-3 py-2 text-xs font-semibold transition-all active:scale-95 sm:gap-2 sm:px-4 sm:py-2.5 sm:text-sm ${
                  showFilters || hasActiveFilters
                    ? "border-blue-200 bg-blue-50 text-blue-700"
                    : "border-slate-200 bg-white text-slate-600"
                }`}
              >
                <SlidersHorizontal className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                <span className="hidden sm:inline">Filters</span>
                {activeFilterCount > 0 && (
                  <span className="flex h-4 w-4 items-center justify-center rounded-full bg-blue-600 text-[10px] text-white sm:h-5 sm:w-5 sm:text-xs">
                    {activeFilterCount}
                  </span>
                )}
              </button>

              {/* Paper type tabs — horizontal scroll */}
              <div
                ref={tabScrollRef}
                className="flex flex-1 gap-1.5 overflow-x-auto scrollbar-none sm:gap-2"
                style={{ WebkitOverflowScrolling: "touch" }}
              >
                {PAPER_TABS.map((tab) => {
                  const Icon = tab.icon;
                  const isActive = paperType === tab.id;
                  return (
                    <button
                      key={tab.id}
                      type="button"
                      {...(isActive ? { "data-active-tab": true } : {})}
                      onClick={() => setPaperType(tab.id)}
                      className={`inline-flex flex-shrink-0 items-center gap-1.5 whitespace-nowrap rounded-lg px-3 py-2 text-xs font-semibold transition-all active:scale-95 sm:gap-2 sm:rounded-xl sm:px-4 sm:py-2.5 sm:text-sm ${
                        isActive
                          ? "bg-slate-900 text-white shadow-md"
                          : "bg-white text-slate-600 shadow-sm ring-1 ring-slate-200"
                      }`}
                    >
                      <Icon className={`h-3.5 w-3.5 sm:h-4 sm:w-4 ${isActive ? "text-white" : "text-slate-400"}`} />
                      {/* Short label on mobile, full on sm+ */}
                      <span className="sm:hidden">{tab.mobileLabel}</span>
                      <span className="hidden sm:inline">{tab.label}</span>
                    </button>
                  );
                })}
              </div>

              {/* View mode — desktop only */}
              <div className="hidden items-center gap-1 rounded-lg bg-slate-100 p-1 md:flex">
                <button
                  onClick={() => setViewMode("feed")}
                  className={`rounded-md p-2 transition-all ${
                    viewMode === "feed" ? "bg-white text-slate-900 shadow-sm" : "text-slate-500"
                  }`}
                >
                  <List className="h-4 w-4" />
                </button>
                <button
                  onClick={() => setViewMode("grid")}
                  className={`rounded-md p-2 transition-all ${
                    viewMode === "grid" ? "bg-white text-slate-900 shadow-sm" : "text-slate-500"
                  }`}
                >
                  <LayoutGrid className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* ---- Active filters (mobile-friendly pills) ---- */}
            {hasActiveFilters && !showFilters && (
              <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
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
                <button
                  onClick={clearAllFilters}
                  className="text-xs font-semibold text-slate-400 active:text-slate-600"
                >
                  Clear all
                </button>
              </div>
            )}

            {/* ---- Expandable filter panel ---- */}
            <div
              className={`grid transition-all duration-300 ${
                showFilters ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
              }`}
            >
              <div className="overflow-hidden">
                <div className="rounded-xl border border-slate-200 bg-slate-50/50 p-3 sm:p-4">
                  {/* On mobile: stack, on md+: 2 or 3 cols */}
                  <div className="grid gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-3">
                    {/* Semester */}
                    <div>
                      <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wider text-slate-500 sm:text-xs">
                        Semester
                      </label>
                      <div className="relative">
                        <select
                          value={semester}
                          onChange={(e) => setSemester(e.target.value)}
                          className="w-full appearance-none rounded-lg border border-slate-200 bg-white px-3 py-2.5 pr-10 text-sm font-medium text-slate-700 focus:border-blue-300 focus:outline-none focus:ring-4 focus:ring-blue-50"
                        >
                          <option value="All">All Semesters</option>
                          {SEMESTERS.map((s) => (
                            <option key={s} value={s}>
                              Semester {s}
                            </option>
                          ))}
                        </select>
                        <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                      </div>
                    </div>

                    {/* Year */}
                    <div>
                      <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wider text-slate-500 sm:text-xs">
                        Year
                      </label>
                      <div className="relative">
                        <select className="w-full appearance-none rounded-lg border border-slate-200 bg-white px-3 py-2.5 pr-10 text-sm font-medium text-slate-700 focus:border-blue-300 focus:outline-none focus:ring-4 focus:ring-blue-50">
                          <option>All Years</option>
                          <option>2024</option>
                          <option>2023</option>
                          <option>2022</option>
                        </select>
                        <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                      </div>
                    </div>

                    {/* Subject */}
                    <div className="sm:col-span-2 lg:col-span-1">
                      <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wider text-slate-500 sm:text-xs">
                        Subject
                      </label>
                      <div className="relative">
                        <select className="w-full appearance-none rounded-lg border border-slate-200 bg-white px-3 py-2.5 pr-10 text-sm font-medium text-slate-700 focus:border-blue-300 focus:outline-none focus:ring-4 focus:ring-blue-50">
                          <option>All Subjects</option>
                        </select>
                        <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                      </div>
                    </div>
                  </div>

                  {/* Clear filters row */}
                  {hasActiveFilters && (
                    <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-slate-200 pt-3 sm:mt-4 sm:pt-4">
                      <div className="flex flex-wrap gap-1.5 sm:gap-2">
                        {paperType !== "All" && (
                          <FilterPill label="Type" value={paperType} onClear={() => setPaperType("All")} />
                        )}
                        {semester !== "All" && (
                          <FilterPill label="Semester" value={semester} onClear={() => setSemester("All")} />
                        )}
                        {search && (
                          <FilterPill
                            label="Search"
                            value={search.length > 15 ? `${search.slice(0, 15)}…` : search}
                            onClear={() => setSearch("")}
                          />
                        )}
                      </div>
                      <button
                        onClick={clearAllFilters}
                        className="text-xs font-semibold text-slate-500 active:text-slate-700 sm:text-sm"
                      >
                        Clear all
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* ============================================================ */}
      {/*  RESULTS COUNT                                               */}
      {/* ============================================================ */}
      {displayedPapers.length > 0 && (
        <div className="px-1">
          <p className="text-xs text-slate-500 sm:text-sm">
            Showing{" "}
            <span className="font-semibold text-slate-700">{displayedPapers.length}</span> papers
            {hasActiveFilters && " with filters"}
          </p>
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
        <div className={viewMode === "grid" ? "grid gap-4 sm:gap-6 md:grid-cols-2" : "space-y-4 sm:space-y-6"}>
          {displayedPapers.map((paper) => (
            <PaperCard
              key={paper._id}
              paper={paper}
              onRequireAuth={onRequireAuth}
              isFocused={highlightedPaperId === paper._id}
            />
          ))}
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