import { useConvexAuth, useMutation } from "convex/react";
import { useEffect, useState } from "react";
import { Navigate, Route, Routes } from "react-router-dom";
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

export default function App() {
  const { isAuthenticated } = useConvexAuth();
  const syncCurrentUser = useMutation(api.users.syncCurrentUser);

  const [department, setDepartment] = useState(DEPARTMENTS[0]);
  const [search, setSearch] = useState("");
  const [isAuthPromptOpen, setAuthPromptOpen] = useState(false);

  useEffect(() => {
    if (!isAuthenticated) return;
    void syncCurrentUser({});
  }, [isAuthenticated, syncCurrentUser]);

  return (
    <div className="min-h-screen bg-[#f0f2f5] text-slate-900">
      <Navbar search={search} setSearch={setSearch} />

      <main className="mx-auto flex w-full max-w-[1300px] gap-4 px-3 py-4 md:px-4 md:py-6">
        <Sidebar selectedDepartment={department} setDepartment={setDepartment} />

        <section className="min-w-0 flex-1">
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
            <Route path="/admin" element={<AdminPage />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </section>

        <RightRail />
      </main>

      <MobileBottomNav />
      <GoogleLoginModal
        open={isAuthPromptOpen}
        onClose={() => setAuthPromptOpen(false)}
        title="Sign in to continue"
      />
    </div>
  );
}
