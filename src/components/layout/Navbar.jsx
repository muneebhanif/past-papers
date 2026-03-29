import { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { AuthButton } from "../auth/AuthButton";
import mustLogo from "../../assets/must-logo.png";

export function Navbar({ search, setSearch }) {
  const location = useLocation();
  const [theme, setTheme] = useState("light");

  useEffect(() => {
    const savedTheme = localStorage.getItem("theme");
    const prefersDark = window.matchMedia?.("(prefers-color-scheme: dark)")?.matches;
    const initialTheme = savedTheme || (prefersDark ? "dark" : "light");

    setTheme(initialTheme);
    document.documentElement.classList.toggle("dark", initialTheme === "dark");
  }, []);

  const onToggleTheme = () => {
    const nextTheme = theme === "dark" ? "light" : "dark";
    setTheme(nextTheme);
    localStorage.setItem("theme", nextTheme);
    document.documentElement.classList.toggle("dark", nextTheme === "dark");
  };

  const isDark = theme === "dark";

  return (
    <nav className={`sticky top-0 z-50 border-b backdrop-blur-xl ${
      isDark
        ? "border-slate-700/60 bg-slate-900/90"
        : "border-slate-200/60 bg-white/90"
    }`}>
      <div className="mx-auto max-w-[1300px] px-3 py-2 md:px-4">
        <div className="flex items-center justify-between gap-2 sm:gap-3">
          <div className="flex min-w-0 items-center gap-2 sm:gap-4">
            <Link to="/" className="flex min-w-0 items-center gap-2 text-blue-700">
              <img
                src={mustLogo}
                alt="must past papers logo"
                className="h-8 w-8 rounded-lg object-cover md:h-9 md:w-9"
              />
              <span className="truncate text-base font-black tracking-tight uppercase sm:text-xl md:text-2xl">
                <span className="hidden sm:inline">MUST PAST PAPERS</span>
                <span className="sm:hidden">MUST PAPERS</span>
              </span>
            </Link>

            <div className={`hidden lg:flex items-center rounded-xl px-3 py-2 ${isDark ? "bg-slate-800" : "bg-slate-100"}`}>
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search papers, subjects, years..."
                className={`w-80 border-none bg-transparent p-0 text-sm focus:ring-0 ${isDark ? "text-slate-100 placeholder:text-slate-400" : "text-slate-700 placeholder:text-slate-400"}`}
              />
            </div>
          </div>

          <div className="hidden xl:flex items-center gap-2 shrink-0">
            {[
              ["/", "Feed"],
              ["/upload", "Upload"],
              ["/profile", "Profile"],
            ].map(([to, label]) => (
              <Link
                key={to}
                to={to}
                className={`rounded-lg px-3 py-2 text-sm font-semibold ${
                  location.pathname === to
                    ? "bg-blue-100 text-blue-700"
                    : isDark
                      ? "text-slate-300"
                      : "text-slate-600"
                }`}
              >
                {label}
              </Link>
            ))}

            <button
              type="button"
              onClick={onToggleTheme}
              className={`rounded-lg px-3 py-2 text-sm font-semibold ${
                isDark ? "bg-slate-800 text-slate-200" : "bg-slate-100 text-slate-700"
              }`}
              aria-label="Toggle theme"
            >
              {theme === "dark" ? "☀ Light" : "🌙 Dark"}
            </button>

            <AuthButton />
          </div>

          <div className="xl:hidden flex shrink-0 items-center gap-2">
            <button
              type="button"
              onClick={onToggleTheme}
              className={`rounded-lg px-2.5 py-2 text-xs font-semibold ${
                isDark ? "bg-slate-800 text-slate-200" : "bg-slate-100 text-slate-700"
              }`}
              aria-label="Toggle theme"
            >
              {theme === "dark" ? "☀" : "🌙"}
            </button>
            <AuthButton />
          </div>
        </div>

        <div className={`mt-2 lg:hidden rounded-xl px-3 py-2 ${isDark ? "bg-slate-800" : "bg-slate-100"}`}>
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search papers, subjects, years..."
            className={`w-full border-none bg-transparent p-0 text-sm focus:ring-0 ${
              isDark ? "text-slate-100 placeholder:text-slate-400" : "text-slate-700 placeholder:text-slate-400"
            }`}
          />
        </div>
      </div>
    </nav>
  );
}
