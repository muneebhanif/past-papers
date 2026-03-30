import { usePaginatedQuery } from "convex/react";
import { useEffect, useRef, useState } from "react";
import { useLocation } from "react-router-dom";
import { api } from "../lib/api";
import { LoginSplash } from "../components/feed/LoginSplash";
import { PaperCard } from "../components/feed/PaperCard";
import { DEPARTMENTS } from "../constants/departments";
import { SEMESTERS } from "../constants/academicOptions";

const PAPER_TABS = ["All", "Midterm", "Terminal", "Summer", "Improve"];

const departmentSubtitle = (department) => {
  if (department === "All") return "Department of CSIT and more";
  if (department === "Computer Science" || department === "Information Technology") {
    return "Department of CSIT";
  }
  return `Department of ${department}`;
};

export function FeedPage({ department, setDepartment, search, setSearch, onRequireAuth }) {
  const [paperType, setPaperType] = useState("All");
  const [semester, setSemester] = useState("All");
  const location = useLocation();
  const highlightedPaperId = new URLSearchParams(location.search).get("paper") || "";

  const { results, status, loadMore } = usePaginatedQuery(
    api.papers.listApproved,
    { department, search, paperType, semester },
    { initialNumItems: 6 },
  );

  const sentinelRef = useRef(null);

  useEffect(() => {
    if (!sentinelRef.current || status !== "CanLoadMore") return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) loadMore(4);
      },
      { rootMargin: "380px" },
    );

    observer.observe(sentinelRef.current);
    return () => observer.disconnect();
  }, [status, loadMore]);

  useEffect(() => {
    if (!highlightedPaperId || !results.length) return;
    const target = document.querySelector(`[data-paper-id="${highlightedPaperId}"]`);
    if (!target) return;
    target.scrollIntoView({ behavior: "smooth", block: "center" });
  }, [highlightedPaperId, results]);

  return (
    <div className="space-y-4 pb-16 xl:pb-0">
      <LoginSplash />

      <header className="rounded-xl bg-white p-4 shadow-sm">
        <div className="mb-4 rounded-xl bg-slate-50 p-3 xl:hidden">
          <p className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-slate-400 md:text-xs">
            Departments
          </p>
          <select
            value={department}
            onChange={(e) => setDepartment(e.target.value)}
            className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700"
          >
            {DEPARTMENTS.map((item) => (
              <option key={item} value={item}>{item}</option>
            ))}
          </select>
        </div>

        <p className="mb-1 text-[10px] font-semibold uppercase tracking-wider text-slate-400 md:text-xs">
          {departmentSubtitle(department)}
        </p>
        <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 md:text-5xl">
          {department === "All" ? "Academic Archive" : department}
        </h1>

        <div className="mt-3 grid gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 md:grid-cols-[minmax(0,1fr)_12rem] md:items-center">
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={`Search in ${department === "All" ? "all departments" : department}...`}
            className="w-full border-none bg-transparent p-0 text-sm text-slate-700 placeholder:text-slate-400 focus:ring-0"
          />
          <select
            value={semester}
            onChange={(e) => setSemester(e.target.value)}
            className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-semibold text-slate-700"
          >
            <option value="All">All semesters</option>
            {SEMESTERS.map((semesterOption) => (
              <option key={semesterOption} value={semesterOption}>{`Semester ${semesterOption}`}</option>
            ))}
          </select>
        </div>

        <div className="mobile-scroll-hide mt-3 flex gap-2 overflow-x-auto pb-1">
          {PAPER_TABS.map((tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => setPaperType(tab)}
              className={`whitespace-nowrap rounded-full px-3 py-1 text-xs font-semibold transition ${
                paperType === tab ? "bg-blue-100 text-blue-700" : "bg-slate-100 text-slate-600"
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </header>

      {results.map((paper) => (
        <PaperCard
          key={paper._id}
          paper={paper}
          onRequireAuth={onRequireAuth}
          isFocused={highlightedPaperId === paper._id}
        />
      ))}

      {!results.length ? (
        <div className="rounded-xl bg-white p-6 text-sm text-slate-600 shadow-sm">No approved papers found.</div>
      ) : null}

      <div ref={sentinelRef} className="py-8 text-center text-sm text-slate-500">
        {status === "LoadingMore"
          ? "Loading more..."
          : status === "Exhausted"
            ? "You reached the end"
            : "Scroll for more"}
      </div>
    </div>
  );
}
