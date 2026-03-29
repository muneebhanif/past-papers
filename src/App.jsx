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
  const [isDepartmentSheetOpen, setDepartmentSheetOpen] = useState(false);

  const normalizedPath = (location.pathname || "/").replace(/\/+$/, "") || "/";
  const isAdminRoute = normalizedPath === `/${ADMIN_PANEL_PATH}`;

  useEffect(() => {
    if (!isAuthenticated) return;
    void syncCurrentUser({});
  }, [isAuthenticated, syncCurrentUser]);

  return (
    <div className="min-h-screen bg-[#f0f2f5] text-slate-900">
      {!isAdminRoute ? (
        <Navbar
          search={search}
          setSearch={setSearch}
          selectedDepartment={department}
          onOpenDepartments={() => setDepartmentSheetOpen(true)}
        />
      ) : null}

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
                  search={search}
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

      {!isAdminRoute ? <MobileBottomNav /> : null}
      {!isAdminRoute && isDepartmentSheetOpen ? (
        <div
          className="fixed inset-0 z-[110] flex items-end bg-black/40 xl:hidden"
          onClick={() => setDepartmentSheetOpen(false)}
        >
          <div
            className="max-h-[78vh] w-full rounded-t-2xl bg-white p-4 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-sm font-bold uppercase tracking-wider text-slate-500">Departments</h3>
              <button
                type="button"
                onClick={() => setDepartmentSheetOpen(false)}
                className="rounded-full bg-slate-100 px-3 py-1.5 text-xs font-bold text-slate-700"
              >
                Close
              </button>
            </div>
            <div className="max-h-[62vh] space-y-1 overflow-y-auto">
              {DEPARTMENTS.map((item) => (
                <button
                  key={item}
                  type="button"
                  onClick={() => {
                    setDepartment(item);
                    setDepartmentSheetOpen(false);
                  }}
                  className={`w-full rounded-lg px-3 py-2 text-left text-sm font-medium ${
                    department === item
                      ? "bg-blue-100 text-blue-700"
                      : "text-slate-700 hover:bg-slate-100"
                  }`}
                >
                  {item}
                </button>
              ))}
            </div>
          </div>
        </div>
      ) : null}
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
