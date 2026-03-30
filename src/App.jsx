import { useConvexAuth, useMutation } from "convex/react";
import { useEffect, useState } from "react";
import { Navigate, Route, Routes, useLocation } from "react-router-dom";
import { Navbar } from "./components/layout/Navbar";
import { Sidebar } from "./components/layout/Sidebar";
import { RightRail } from "./components/layout/RightRail";
import { MobileBottomNav } from "./components/layout/MobileBottomNav";
import { GoogleLoginModal } from "./components/auth/GoogleLoginModal";
import { FeedPage } from "./pages/FeedPage";
import { UploadPage } from "./pages/UploadPage";
import { ProfilePage } from "./pages/ProfilePage";
import { AdminPage } from "./pages/AdminPage";
import { DEPARTMENTS } from "./constants/departments";
import { api } from "./lib/api";
import { ADMIN_PANEL_PATH } from "./lib/adminPath";

export default function App() {
  const { isAuthenticated } = useConvexAuth();
  const syncCurrentUser = useMutation(api.users.syncCurrentUser);
  const location = useLocation();

  const [department, setDepartment] = useState(DEPARTMENTS[0]);
  const [search, setSearch] = useState("");
  const [isAuthPromptOpen, setAuthPromptOpen] = useState(false);

  const normalizedPath = (location.pathname || "/").replace(/\/+$/, "") || "/";
  const isAdminRoute = normalizedPath === `/${ADMIN_PANEL_PATH}`;
  const isProfileRoute = normalizedPath === "/profile";

  useEffect(() => {
    if (!isAuthenticated) return;
    void syncCurrentUser({});
  }, [isAuthenticated, syncCurrentUser]);

  return (
    <div className="app-shell min-h-screen text-slate-900">
      {!isAdminRoute ? <Navbar search={search} setSearch={setSearch} /> : null}

      <main
        className={
          isAdminRoute
            ? "mx-auto w-full max-w-[1400px] px-3 py-4 md:px-6 md:py-6"
            : "mx-auto flex w-full max-w-[1300px] gap-4 px-3 py-4 md:px-4 md:py-6"
        }
      >
        {!isAdminRoute ? (
          <Sidebar selectedDepartment={department} setDepartment={setDepartment} />
        ) : null}

        <section className={isAdminRoute ? "w-full" : "min-w-0 flex-1"}>
          <Routes>
            <Route
              path="/"
              element={
                <FeedPage
                  department={department}
                  setDepartment={setDepartment}
                  search={search}
                  setSearch={setSearch}
                  onRequireAuth={() => setAuthPromptOpen(true)}
                />
              }
            />
            <Route
              path="/upload"
              element={<UploadPage onRequireAuth={() => setAuthPromptOpen(true)} />}
            />
            <Route path="/profile" element={<ProfilePage />} />
            <Route path={ADMIN_PANEL_PATH} element={<AdminPage />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </section>

        {!isAdminRoute ? <RightRail /> : null}
      </main>

      {!isAdminRoute && !isProfileRoute ? (
        <footer className="border-t border-slate-200 bg-[#ffffff] px-3 py-6 pb-[calc(env(safe-area-inset-bottom)+4.75rem)] text-center text-black md:border-blue-800/20 md:bg-gradient-to-br md:from-blue-700 md:via-blue-600 md:to-indigo-700 md:py-10 md:pb-10 md:text-white md:shadow-[0_-8px_30px_rgba(30,64,175,0.25)] md:px-4">
          <p className="text-sm font-extrabold tracking-[0.14em] text-black md:text-base md:text-white/95">
            MUST PAST PAPERS BY DEPARTMENT OF CSIT
          </p>
          <div className="mx-auto mt-4 h-px w-40 bg-slate-300 md:bg-white/30" />
          <p className="mt-3 text-[11px] font-bold tracking-[0.1em] text-black/80 md:text-xs md:text-blue-100">
            © {new Date().getFullYear()} DESIGNED AND DEVELOPED BY CRUX DYNAMICS
          </p>
        </footer>
      ) : null}

      {!isAdminRoute ? <MobileBottomNav /> : null}
      {!isAdminRoute ? (
        <GoogleLoginModal
          open={isAuthPromptOpen}
          onClose={() => setAuthPromptOpen(false)}
          title="Sign in to continue"
        />
      ) : null}
    </div>
  );
}
