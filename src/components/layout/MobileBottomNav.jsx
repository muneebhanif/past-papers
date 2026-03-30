import { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { Bookmark, Grid2x2, Home, Plus, User } from "lucide-react";

export function MobileBottomNav() {
  const location = useLocation();
  const [isDark, setIsDark] = useState(false);
  const normalizedPath = (location.pathname || "/").replace(/\/+$/, "") || "/";

  useEffect(() => {
    if (typeof document === "undefined") return;

    const root = document.documentElement;
    const updateTheme = () => setIsDark(root.classList.contains("dark"));
    updateTheme();

    const observer = new MutationObserver(updateTheme);
    observer.observe(root, { attributes: true, attributeFilter: ["class"] });

    return () => observer.disconnect();
  }, []);

  const leftItems = [
    { to: "/", label: "Home", icon: Home },
    { to: "/", label: "Subjects", icon: Grid2x2 },
  ];

  const rightItems = [
    { to: "/", label: "Saved", icon: Bookmark },
    { to: "/profile", label: "Profile", icon: User },
  ];

  const isActive = (item) => {
    if (item.label === "Profile") {
      return normalizedPath === "/profile";
    }
    return item.label === "Home" && normalizedPath === "/";
  };

  const itemBaseClass = `flex flex-col items-center gap-1 transition-colors ${
    isDark ? "text-slate-400" : "text-slate-500"
  }`;

  const activeClass = isDark ? "text-blue-400" : "text-blue-700";

  return (
    <nav
      className={`fixed bottom-0 left-0 right-0 z-[120] border-t px-6 py-3 pb-[calc(env(safe-area-inset-bottom)+0.6rem)] backdrop-blur-xl xl:hidden ${
        isDark
          ? "border-slate-700/60 bg-slate-900/95"
          : "border-slate-200/70 bg-white/95"
      }`}
    >
      <div className="mx-auto flex max-w-md items-end justify-between">
        <div className="flex items-center gap-7">
          {leftItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item);
            return (
              <Link key={item.label} to={item.to} className={`${itemBaseClass} ${active ? activeClass : ""}`}>
                <Icon className={`h-5 w-5 ${active ? "fill-current" : ""}`} />
                <span className="text-[10px] font-bold">{item.label}</span>
              </Link>
            );
          })}
        </div>

        <Link
          to="/upload"
          className={`relative -top-6 flex h-14 w-14 items-center justify-center rounded-full text-white shadow-lg ring-4 transition-transform active:scale-95 ${
            isDark
              ? "bg-blue-500 ring-slate-900"
              : "bg-blue-600 ring-white"
          }`}
          aria-label="Upload"
        >
          <Plus className="h-7 w-7" />
        </Link>

        <div className="flex items-center gap-7">
          {rightItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item);
            return (
              <Link key={item.label} to={item.to} className={`${itemBaseClass} ${active ? activeClass : ""}`}>
                <Icon className={`h-5 w-5 ${active ? "fill-current" : ""}`} />
                <span className="text-[10px] font-bold">{item.label}</span>
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
