import { useQuery } from "convex/react";
import { Link, useLocation } from "react-router-dom";
import { api } from "../../lib/api";

export function MobileBottomNav() {
  const me = useQuery(api.users.current);
  const location = useLocation();

  const items = [
    { to: "/", label: "Home" },
    { to: "/upload", label: "Upload" },
    { to: "/profile", label: "Profile" },
    ...(me?.isAdmin ? [{ to: "/admin", label: "Admin" }] : []),
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-slate-200/60 bg-white/95 px-3 py-2 backdrop-blur-xl xl:hidden">
      <div
        className="mx-auto grid max-w-md gap-2"
        style={{ gridTemplateColumns: `repeat(${items.length}, minmax(0, 1fr))` }}
      >
        {items.map((item) => (
          <Link
            key={item.to}
            to={item.to}
            className={`rounded-xl px-2 py-2 text-center text-xs font-semibold transition ${
              location.pathname === item.to ? "bg-blue-100 text-blue-700" : "text-slate-600"
            }`}
          >
            {item.label}
          </Link>
        ))}
      </div>
    </nav>
  );
}
