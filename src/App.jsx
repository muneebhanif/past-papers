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

  useEffect(() => {
    if (!isAuthenticated) return;
    void syncCurrentUser({});
  }, [isAuthenticated, syncCurrentUser]);

  return (
    <div className="min-h-screen bg-[#f0f2f5] text-slate-900">
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

      {!isAdminRoute ? (
        <footer className="border-t border-slate-200/70 bg-white/90 px-3 py-5 text-center md:px-4">
          <p className="text-xs font-extrabold tracking-wider text-slate-700 md:text-sm">
            MUST PAST PAPERS BY DEPARTMENT OF CSIT
          </p>
          <p className="mt-2 text-[10px] font-bold tracking-wider text-slate-500 md:text-xs">
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
