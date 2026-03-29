import { useEffect, useState } from "react";
import { useConvexAuth, useMutation, useQuery } from "convex/react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Bell, Heart, MessageSquare, Moon, Sun } from "lucide-react";
import { AuthButton } from "../auth/AuthButton";
import mustLogo from "../../assets/must-logo.png";
import { api } from "../../lib/api";

export function Navbar({ search, setSearch }) {
  const location = useLocation();
  const navigate = useNavigate();
  const { isAuthenticated } = useConvexAuth();
  const markAllRead = useMutation(api.notifications.markAllRead);
  const notifications = useQuery(
    api.notifications.listForMe,
    isAuthenticated ? { limit: 12 } : "skip",
  ) ?? [];
  const unreadCount = useQuery(
    api.notifications.unreadCount,
    isAuthenticated ? {} : "skip",
  ) ?? 0;
  const [theme, setTheme] = useState("light");
  const [isNotificationsOpen, setNotificationsOpen] = useState(false);

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

  const notificationText = (item) => {
    if (item.type === "like") {
      return `${item.actorName} liked ${item.paperTitle}`;
    }
    return `${item.actorName} commented on ${item.paperTitle}`;
  };

  const NotificationTypeIcon = ({ type }) => {
    if (type === "like") {
      return <Heart className="h-3.5 w-3.5" aria-hidden="true" />;
    }
    return <MessageSquare className="h-3.5 w-3.5" aria-hidden="true" />;
  };

  const openNotifications = async () => {
    setNotificationsOpen((value) => !value);
    if (unreadCount > 0) {
      await markAllRead({});
    }
  };

  const openNotificationPost = (paperId) => {
    setNotificationsOpen(false);
    navigate(`/?paper=${paperId}`);
  };

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
              <span className="inline-flex items-center gap-1.5">
                {theme === "dark" ? <Sun className="h-4 w-4" aria-hidden="true" /> : <Moon className="h-4 w-4" aria-hidden="true" />}
                {theme === "dark" ? "Light" : "Dark"}
              </span>
            </button>

            {isAuthenticated ? (
              <div className="relative">
                <button
                  type="button"
                  onClick={() => void openNotifications()}
                  className={`rounded-lg px-3 py-2 text-sm font-semibold ${
                    isDark ? "bg-slate-800 text-slate-200" : "bg-slate-100 text-slate-700"
                  }`}
                >
                  <span className="inline-flex items-center gap-1.5">
                    <Bell className="h-4 w-4" aria-hidden="true" />
                    Notifications
                  </span>
                  {unreadCount ? (
                    <span className="ml-1 rounded-full bg-red-500 px-1.5 py-0.5 text-[10px] font-bold text-white">
                      {unreadCount > 9 ? "9+" : unreadCount}
                    </span>
                  ) : null}
                </button>

                {isNotificationsOpen ? (
                  <div className={`absolute right-0 top-12 z-[160] w-80 rounded-xl border p-2 shadow-xl ${
                    isDark ? "border-slate-700 bg-slate-900" : "border-slate-200 bg-white"
                  }`}>
                    <p className="px-2 pb-1 text-xs font-bold uppercase tracking-wider text-slate-500">Notifications</p>
                    <div className="max-h-80 space-y-1 overflow-auto">
                      {notifications.length ? notifications.map((item) => (
                        <button
                          key={item._id}
                          type="button"
                          onClick={() => openNotificationPost(item.paperId)}
                          className={`w-full rounded-lg px-2 py-2 text-left text-xs transition hover:bg-slate-100 dark:hover:bg-slate-800 ${item.read ? "opacity-80" : "font-semibold"}`}
                        >
                          <p className="mb-0.5 inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wide text-blue-600">
                            <NotificationTypeIcon type={item.type} />
                            {item.type}
                          </p>
                          <p className={isDark ? "text-slate-200" : "text-slate-700"}>{notificationText(item)}</p>
                          {item.type === "comment" && item.content ? (
                            <p className="mt-0.5 truncate text-[11px] text-slate-500">“{item.content}”</p>
                          ) : null}
                        </button>
                      )) : (
                        <p className="px-2 py-3 text-xs text-slate-500">No notifications yet.</p>
                      )}
                    </div>
                  </div>
                ) : null}
              </div>
            ) : null}

            <AuthButton />
          </div>

          <div className="xl:hidden flex shrink-0 items-center gap-2">
            {isAuthenticated ? (
              <button
                type="button"
                onClick={() => void openNotifications()}
                className={`relative rounded-lg px-2.5 py-2 text-xs font-semibold ${
                  isDark ? "bg-slate-800 text-slate-200" : "bg-slate-100 text-slate-700"
                }`}
                aria-label="Notifications"
              >
                <Bell className="h-4 w-4" aria-hidden="true" />
                {unreadCount ? (
                  <span className="absolute -right-1 -top-1 rounded-full bg-red-500 px-1 py-0.5 text-[9px] font-bold text-white">
                    {unreadCount > 9 ? "9+" : unreadCount}
                  </span>
                ) : null}
              </button>
            ) : null}
            <button
              type="button"
              onClick={onToggleTheme}
              className={`rounded-lg px-2.5 py-2 text-xs font-semibold ${
                isDark ? "bg-slate-800 text-slate-200" : "bg-slate-100 text-slate-700"
              }`}
              aria-label="Toggle theme"
            >
              {theme === "dark" ? <Sun className="h-4 w-4" aria-hidden="true" /> : <Moon className="h-4 w-4" aria-hidden="true" />}
            </button>
            <AuthButton />
          </div>
        </div>

        {isAuthenticated && isNotificationsOpen ? (
          <div className={`mt-2 xl:hidden rounded-xl border p-2 shadow-sm ${
            isDark ? "border-slate-700 bg-slate-900" : "border-slate-200 bg-white"
          }`}>
            <p className="px-2 pb-1 text-[11px] font-bold uppercase tracking-wider text-slate-500">Notifications</p>
            <div className="max-h-52 space-y-1 overflow-auto">
              {notifications.length ? notifications.map((item) => (
                <button
                  key={item._id}
                  type="button"
                  onClick={() => openNotificationPost(item.paperId)}
                  className={`w-full rounded-lg px-2 py-2 text-left text-xs transition hover:bg-slate-100 dark:hover:bg-slate-800 ${item.read ? "opacity-80" : "font-semibold"}`}
                >
                  <p className="mb-0.5 inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wide text-blue-600">
                    <NotificationTypeIcon type={item.type} />
                    {item.type}
                  </p>
                  <p className={isDark ? "text-slate-200" : "text-slate-700"}>{notificationText(item)}</p>
                  {item.type === "comment" && item.content ? (
                    <p className="mt-0.5 truncate text-[11px] text-slate-500">“{item.content}”</p>
                  ) : null}
                </button>
              )) : (
                <p className="px-2 py-3 text-xs text-slate-500">No notifications yet.</p>
              )}
            </div>
          </div>
        ) : null}

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
