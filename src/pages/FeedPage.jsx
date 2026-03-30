import { usePaginatedQuery } from "convex/react";
import { useEffect, useRef, useState } from "react";
import { useLocation } from "react-router-dom";
import { api } from "../lib/api";
import { LoginSplash } from "../components/feed/LoginSplash";
import { PaperCard } from "../components/feed/PaperCard";
import { DEPARTMENTS } from "../constants/departments";
import { SEMESTERS } from "../constants/academicOptions";
import {
  Search,
  Filter,
  ChevronDown,
  BookOpen,
  GraduationCap,
  FileText,
  Loader2,
  FolderOpen,
  Sparkles,
  TrendingUp,
  Clock,
  CheckCircle2,
  X,
  SlidersHorizontal,
  LayoutGrid,
  List
} from "lucide-react";

const PAPER_TABS = [
  { id: "All", label: "All Papers", icon: FileText },
  { id: "Midterm", label: "Midterm", icon: Clock },
  { id: "Terminal", label: "Terminal", icon: CheckCircle2 },
  { id: "Summer", label: "Summer", icon: Sparkles },
  { id: "Improve", label: "Improvement", icon: TrendingUp },
];

const departmentConfig = {
  "All": {
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

const getConfig = (department) => departmentConfig[department] || {
  subtitle: `Department of ${department}`,
  description: `${department} exam papers and resources`,
  gradient: "from-slate-600 via-gray-600 to-zinc-600",
  bgPattern: "bg-gradient-to-br from-slate-50 via-gray-50 to-zinc-50",
};

// Loading skeleton for paper cards
const PaperCardSkeleton = () => (
  <div className="animate-pulse overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
    <div className="p-5 md:p-6">
      <div className="flex items-center gap-3">
        <div className="h-11 w-11 rounded-full bg-slate-200" />
        <div className="space-y-2">
          <div className="h-4 w-24 rounded bg-slate-200" />
          <div className="h-3 w-16 rounded bg-slate-200" />
        </div>
      </div>
      <div className="mt-4 space-y-2">
        <div className="h-6 w-3/4 rounded bg-slate-200" />
        <div className="h-4 w-1/2 rounded bg-slate-200" />
      </div>
      <div className="mt-4 flex gap-2">
        <div className="h-6 w-20 rounded-full bg-slate-200" />
        <div className="h-6 w-16 rounded-full bg-slate-200" />
      </div>
    </div>
    <div className="h-[22rem] w-full bg-slate-100 md:h-[30rem]" />
    <div className="p-5 md:p-6">
      <div className="flex gap-4">
        <div className="h-10 flex-1 rounded-lg bg-slate-200" />
        <div className="h-10 flex-1 rounded-lg bg-slate-200" />
        <div className="h-10 flex-1 rounded-lg bg-slate-200" />
      </div>
    </div>
  </div>
);

// Empty state component
const EmptyState = ({ search, department, onClear }) => (
  <div className="relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm md:p-12">
    {/* Background decoration */}
    <div className="absolute inset-0 opacity-50">
      <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-gradient-to-br from-blue-100 to-indigo-100" />
      <div className="absolute -bottom-20 -left-20 h-64 w-64 rounded-full bg-gradient-to-br from-purple-100 to-pink-100" />
    </div>

    <div className="relative">
      <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-slate-100 to-slate-200">
        <FolderOpen className="h-10 w-10 text-slate-400" />
      </div>

      <h3 className="text-xl font-bold text-slate-900">No papers found</h3>
      <p className="mx-auto mt-2 max-w-md text-sm text-slate-500">
        {search
          ? `We couldn't find any papers matching "${search}" in ${department === "All" ? "any department" : department}.`
          : `No approved papers available in ${department === "All" ? "any department" : department} yet.`}
      </p>

      {search && (
        <button
          onClick={onClear}
          className="mt-6 inline-flex items-center gap-2 rounded-full bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white transition-all hover:bg-slate-800"
        >
          <X className="h-4 w-4" />
          Clear search
        </button>
      )}
    </div>
  </div>
);

// Filter pill component
const FilterPill = ({ label, value, onClear }) => (
  <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-100 px-3 py-1 text-xs font-semibold text-blue-700">
    {label}: {value}
    <button
      onClick={onClear}
      className="rounded-full p-0.5 transition-colors hover:bg-blue-200"
    >
      <X className="h-3 w-3" />
    </button>
  </span>
);

export function FeedPage({ department, setDepartment, search, setSearch, onRequireAuth }) {
  const [paperType, setPaperType] = useState("All");
  const [semester, setSemester] = useState("All");
  const [showFilters, setShowFilters] = useState(false);
  const [viewMode, setViewMode] = useState("feed"); // 'feed' or 'grid'
  const location = useLocation();
  const highlightedPaperId = new URLSearchParams(location.search).get("paper") || "";
  const searchInputRef = useRef(null);

  const config = getConfig(department);

  const { results, status } = usePaginatedQuery(
    api.papers.listApproved,
    { department, search, paperType, semester },
    { initialNumItems: 6 },
  );

  const displayedPapers = results.slice(0, 6);

  // Scroll to highlighted paper
  useEffect(() => {
    if (!highlightedPaperId || !displayedPapers.length) return;
    const target = document.querySelector(`[data-paper-id="${highlightedPaperId}"]`);
    if (!target) return;
    setTimeout(() => {
      target.scrollIntoView({ behavior: "smooth", block: "center" });
    }, 100);
  }, [highlightedPaperId, displayedPapers]);

  const hasActiveFilters = paperType !== "All" || semester !== "All" || search;
  const activeFilterCount = [
    paperType !== "All",
    semester !== "All",
    search,
  ].filter(Boolean).length;

  const clearAllFilters = () => {
    setPaperType("All");
    setSemester("All");
    setSearch("");
  };

  return (
    <div className="space-y-6 pb-20 xl:pb-0">
      {/* Login Splash */}
      <LoginSplash />

      {/* Hero Header */}
      <header className="relative overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm">
        {/* Background Pattern */}
        <div className={`absolute inset-0 ${config.bgPattern} opacity-60`} />
        <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg%20width%3D%2260%22%20height%3D%2260%22%20viewBox%3D%220%200%2060%2060%22%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%3E%3Cg%20fill%3D%22none%22%20fill-rule%3D%22evenodd%22%3E%3Cg%20fill%3D%22%239C92AC%22%20fill-opacity%3D%220.03%22%3E%3Cpath%20d%3D%22M36%2034v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6%2034v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6%204V0H4v4H0v2h4v4h2V6h4V4H6z%22%2F%3E%3C%2Fg%3E%3C%2Fg%3E%3C%2Fsvg%3E')] opacity-50" />

        <div className="relative p-6 md:p-8">
          {/* Mobile Department Selector */}
          <div className="mb-6 xl:hidden">
            <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-slate-500">
              Select Department
            </label>
            <div className="relative">
              <select
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                className="w-full appearance-none rounded-xl border border-slate-200 bg-white px-4 py-3 pr-10 text-sm font-semibold text-slate-700 shadow-sm transition-all focus:border-blue-300 focus:outline-none focus:ring-4 focus:ring-blue-50"
              >
                {DEPARTMENTS.map((item) => (
                  <option key={item} value={item}>{item}</option>
                ))}
              </select>
              <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
            </div>
          </div>

          {/* Title Section */}
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="mb-2 inline-flex items-center gap-2 rounded-full bg-white/80 px-3 py-1 text-xs font-semibold text-slate-600 shadow-sm backdrop-blur-sm">
                <GraduationCap className="h-3.5 w-3.5" />
                {config.subtitle}
              </div>
              <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 md:text-4xl lg:text-5xl">
                <span className={`bg-gradient-to-r ${config.gradient} bg-clip-text text-transparent`}>
                  {department === "All" ? "Academic Archive" : department}
                </span>
              </h1>
              <p className="mt-2 text-sm text-slate-600 md:text-base">
                {config.description}
              </p>
            </div>

            {/* Stats */}
            <div className="hidden flex-shrink-0 items-center gap-2 rounded-xl bg-white/80 px-4 py-3 shadow-sm backdrop-blur-sm md:flex">
              <BookOpen className="h-5 w-5 text-blue-600" />
              <div>
                <p className="text-lg font-bold text-slate-900">{Math.min(results.length, 6)}</p>
                <p className="text-xs text-slate-500">Papers</p>
              </div>
            </div>
          </div>

          {/* Search & Filters Bar */}
          <div className="mt-6 space-y-4">
            {/* Search Input */}
            <div className="relative">
              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4">
                <Search className="h-5 w-5 text-slate-400" />
              </div>
              <input
                ref={searchInputRef}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={`Search papers in ${department === "All" ? "all departments" : department}...`}
                className="w-full rounded-xl border border-slate-200 bg-white py-3.5 pl-12 pr-4 text-sm text-slate-700 shadow-sm transition-all placeholder:text-slate-400 focus:border-blue-300 focus:outline-none focus:ring-4 focus:ring-blue-50"
              />
              {search && (
                <button
                  onClick={() => setSearch("")}
                  className="absolute inset-y-0 right-0 flex items-center pr-4"
                >
                  <X className="h-5 w-5 text-slate-400 transition-colors hover:text-slate-600" />
                </button>
              )}
            </div>

            {/* Filter Controls */}
            <div className="flex flex-wrap items-center gap-3">
              {/* Filter Toggle Button */}
              <button
                onClick={() => setShowFilters(!showFilters)}
                className={`inline-flex items-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-semibold transition-all ${
                  showFilters || hasActiveFilters
                    ? "border-blue-200 bg-blue-50 text-blue-700"
                    : "border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-50"
                }`}
              >
                <SlidersHorizontal className="h-4 w-4" />
                Filters
                {activeFilterCount > 0 && (
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-blue-600 text-xs text-white">
                    {activeFilterCount}
                  </span>
                )}
              </button>

              {/* Paper Type Tabs */}
              <div className="mobile-scroll-hide flex flex-1 gap-2 overflow-x-auto">
                {PAPER_TABS.map((tab) => {
                  const Icon = tab.icon;
                  const isActive = paperType === tab.id;
                  return (
                    <button
                      key={tab.id}
                      type="button"
                      onClick={() => setPaperType(tab.id)}
                      className={`inline-flex flex-shrink-0 items-center gap-2 whitespace-nowrap rounded-xl px-4 py-2.5 text-sm font-semibold transition-all ${
                        isActive
                          ? "bg-slate-900 text-white shadow-md"
                          : "bg-white text-slate-600 shadow-sm ring-1 ring-slate-200 hover:bg-slate-50"
                      }`}
                    >
                      <Icon className={`h-4 w-4 ${isActive ? "text-white" : "text-slate-400"}`} />
                      {tab.label}
                    </button>
                  );
                })}
              </div>

              {/* View Mode Toggle */}
              <div className="hidden items-center gap-1 rounded-lg bg-slate-100 p-1 md:flex">
                <button
                  onClick={() => setViewMode("feed")}
                  className={`rounded-md p-2 transition-all ${
                    viewMode === "feed"
                      ? "bg-white text-slate-900 shadow-sm"
                      : "text-slate-500 hover:text-slate-700"
                  }`}
                >
                  <List className="h-4 w-4" />
                </button>
                <button
                  onClick={() => setViewMode("grid")}
                  className={`rounded-md p-2 transition-all ${
                    viewMode === "grid"
                      ? "bg-white text-slate-900 shadow-sm"
                      : "text-slate-500 hover:text-slate-700"
                  }`}
                >
                  <LayoutGrid className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* Expandable Filter Panel */}
            <div
              className={`grid transition-all duration-300 ${
                showFilters ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
              }`}
            >
              <div className="overflow-hidden">
                <div className="rounded-xl border border-slate-200 bg-slate-50/50 p-4">
                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {/* Semester Filter */}
                    <div>
                      <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-slate-500">
                        Semester
                      </label>
                      <div className="relative">
                        <select
                          value={semester}
                          onChange={(e) => setSemester(e.target.value)}
                          className="w-full appearance-none rounded-lg border border-slate-200 bg-white px-4 py-2.5 pr-10 text-sm font-medium text-slate-700 transition-all focus:border-blue-300 focus:outline-none focus:ring-4 focus:ring-blue-50"
                        >
                          <option value="All">All Semesters</option>
                          {SEMESTERS.map((semesterOption) => (
                            <option key={semesterOption} value={semesterOption}>
                              Semester {semesterOption}
                            </option>
                          ))}
                        </select>
                        <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                      </div>
                    </div>

                    {/* Year Filter (placeholder) */}
                    <div>
                      <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-slate-500">
                        Year
                      </label>
                      <div className="relative">
                        <select
                          className="w-full appearance-none rounded-lg border border-slate-200 bg-white px-4 py-2.5 pr-10 text-sm font-medium text-slate-700 transition-all focus:border-blue-300 focus:outline-none focus:ring-4 focus:ring-blue-50"
                        >
                          <option>All Years</option>
                          <option>2024</option>
                          <option>2023</option>
                          <option>2022</option>
                        </select>
                        <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                      </div>
                    </div>

                    {/* Subject Filter (placeholder) */}
                    <div>
                      <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-slate-500">
                        Subject
                      </label>
                      <div className="relative">
                        <select
                          className="w-full appearance-none rounded-lg border border-slate-200 bg-white px-4 py-2.5 pr-10 text-sm font-medium text-slate-700 transition-all focus:border-blue-300 focus:outline-none focus:ring-4 focus:ring-blue-50"
                        >
                          <option>All Subjects</option>
                        </select>
                        <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                      </div>
                    </div>
                  </div>

                  {/* Clear Filters */}
                  {hasActiveFilters && (
                    <div className="mt-4 flex items-center justify-between border-t border-slate-200 pt-4">
                      <div className="flex flex-wrap gap-2">
                        {paperType !== "All" && (
                          <FilterPill
                            label="Type"
                            value={paperType}
                            onClear={() => setPaperType("All")}
                          />
                        )}
                        {semester !== "All" && (
                          <FilterPill
                            label="Semester"
                            value={semester}
                            onClear={() => setSemester("All")}
                          />
                        )}
                        {search && (
                          <FilterPill
                            label="Search"
                            value={search.length > 15 ? `${search.slice(0, 15)}...` : search}
                            onClear={() => setSearch("")}
                          />
                        )}
                      </div>
                      <button
                        onClick={clearAllFilters}
                        className="text-sm font-semibold text-slate-500 transition-colors hover:text-slate-700"
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

      {/* Results Count */}
      {displayedPapers.length > 0 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-slate-500">
            Showing <span className="font-semibold text-slate-700">{displayedPapers.length}</span> papers
            {hasActiveFilters && " with applied filters"}
          </p>
        </div>
      )}

      {/* Papers Grid/Feed */}
      {status === "LoadingFirstPage" ? (
        <div className="space-y-6">
          <PaperCardSkeleton />
          <PaperCardSkeleton />
        </div>
      ) : displayedPapers.length === 0 ? (
        <EmptyState
          search={search}
          department={department}
          onClear={() => setSearch("")}
        />
      ) : (
        <div
          className={
            viewMode === "grid"
              ? "grid gap-6 md:grid-cols-2"
              : "space-y-6"
          }
        >
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

      

      {/* Floating Action - Back to Top */}
      <button
        onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
        className="fixed bottom-24 right-4 z-40 flex h-12 w-12 items-center justify-center rounded-full bg-slate-900 text-white shadow-lg transition-all hover:bg-slate-800 hover:shadow-xl xl:bottom-8"
        aria-label="Back to top"
      >
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
        </svg>
      </button>
    </div>
  );
}