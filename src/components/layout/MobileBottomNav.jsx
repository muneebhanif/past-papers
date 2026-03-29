import { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";

export function MobileBottomNav() {
  const location = useLocation();
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    if (typeof document === "undefined") return;

    const root = document.documentElement;
    const updateTheme = () => setIsDark(root.classList.contains("dark"));
    updateTheme();

    const observer = new MutationObserver(updateTheme);
    observer.observe(root, { attributes: true, attributeFilter: ["class"] });

    return () => observer.disconnect();
  }, []);

  const items = [
    { to: "/", label: "Home" },
    { to: "/upload", label: "Upload" },
    { to: "/profile", label: "Profile" },
  ];

  return (
    <nav
      className={`fixed bottom-0 left-0 right-0 z-[120] border-t px-3 py-2 pb-[calc(env(safe-area-inset-bottom)+0.5rem)] backdrop-blur-xl xl:hidden ${
        isDark
          ? "border-slate-700/70 bg-slate-900/95"
          : "border-slate-200/60 bg-white/95"
      }`}
    >
      <div
        className="mx-auto grid max-w-md gap-2"
        style={{ gridTemplateColumns: `repeat(${items.length}, minmax(0, 1fr))` }}
      >
        {items.map((item) => (
          <Link
            key={item.to}
            to={item.to}
            className={`rounded-xl px-2 py-2 text-center text-xs font-semibold transition ${
              location.pathname === item.to
                ? isDark
                  ? "bg-blue-600/25 text-blue-200"
                  : "bg-blue-100 text-blue-700"
                : isDark
                  ? "text-slate-300"
                  : "text-slate-600"
            }`}
          >
            {item.label}
          </Link>
        ))}
      </div>
    </nav>
  );
}
