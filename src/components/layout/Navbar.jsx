import { Link, useLocation } from "react-router-dom";
import { AuthButton } from "../auth/AuthButton";
import mustLogo from "../../assets/must-logo.png";

export function Navbar({ search, setSearch }) {
  const location = useLocation();

  return (
    <nav className="sticky top-0 z-50 border-b border-slate-200/60 bg-white/90 backdrop-blur-xl">
      <div className="mx-auto max-w-[1300px] px-3 py-2 md:px-4">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-4">
          <Link to="/" className="flex items-center gap-2 text-xl font-black tracking-tight text-blue-700 md:text-2xl">
            <img
              src={mustLogo}
              alt="must past papers logo"
              className="h-8 w-8 rounded-lg object-cover md:h-9 md:w-9"
            />
            <span className="uppercase">MUST PAST PAPERS</span>
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

            <AuthButton />
          </div>

          <div className="xl:hidden flex items-center gap-2">
            <AuthButton />
          </div>
        </div>

        <div className="mt-2 lg:hidden rounded-xl bg-slate-100 px-3 py-2">
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search papers, subjects, years..."
            className="w-full border-none bg-transparent p-0 text-sm focus:ring-0"
          />
        </div>
      </div>
    </nav>
  );
}
