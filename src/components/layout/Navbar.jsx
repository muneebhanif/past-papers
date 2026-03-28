import { useQuery } from "convex/react";
import { Link, useLocation } from "react-router-dom";
import { api } from "../../lib/api";
import { AuthButton } from "../auth/AuthButton";

export function Navbar({ search, setSearch }) {
  const me = useQuery(api.users.current);
  const location = useLocation();

  return (
    <nav className="sticky top-0 z-50 border-b border-slate-200/60 bg-white/90 backdrop-blur-xl">
      <div className="mx-auto flex max-w-[1300px] items-center justify-between gap-3 px-3 py-2 md:px-4">
        <div className="flex items-center gap-4">
          <Link to="/" className="text-xl font-black tracking-tight text-blue-700 md:text-2xl">
            PastPapers Hub
          </Link>

          <div className="hidden lg:flex items-center rounded-xl bg-slate-100 px-3 py-2">
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search papers, subjects, years..."
              className="w-80 border-none bg-transparent p-0 text-sm focus:ring-0"
            />
          </div>
        </div>

        <div className="hidden xl:flex items-center gap-2">
          {[
            ["/", "Feed"],
            ["/upload", "Upload"],
            ["/profile", "Profile"],
          ].map(([to, label]) => (
            <Link
              key={to}
              to={to}
              className={`rounded-lg px-3 py-2 text-sm font-semibold ${
                location.pathname === to ? "bg-blue-100 text-blue-700" : "text-slate-600"
              }`}
            >
              {label}
            </Link>
          ))}

          {me?.isAdmin ? (
            <Link
              to="/admin"
              className={`rounded-lg px-3 py-2 text-sm font-semibold ${
                location.pathname === "/admin" ? "bg-blue-100 text-blue-700" : "text-slate-600"
              }`}
            >
              Admin
            </Link>
          ) : null}

          <AuthButton />
        </div>

        <div className="xl:hidden">
          <AuthButton />
        </div>
      </div>
    </nav>
  );
}
