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

  useEffect(() => {
    if (typeof document === "undefined" || typeof window === "undefined") return;

    const setMetaTag = (key, content, attr = "name") => {
      if (!content) return;
      let tag = document.head.querySelector(`meta[${attr}="${key}"]`);
      if (!tag) {
        tag = document.createElement("meta");
        tag.setAttribute(attr, key);
        document.head.appendChild(tag);
      }
      tag.setAttribute("content", content);
    };

    const setCanonical = (href) => {
      let link = document.head.querySelector("link[rel='canonical']");
      if (!link) {
        link = document.createElement("link");
        link.setAttribute("rel", "canonical");
        document.head.appendChild(link);
      }
      link.setAttribute("href", href);
    };

    const setJsonLd = (payload) => {
      const id = "seo-jsonld";
      const existing = document.getElementById(id);
      if (existing) existing.remove();

      if (!payload) return;
      const script = document.createElement("script");
      script.id = id;
      script.type = "application/ld+json";
      script.text = JSON.stringify(payload);
      document.head.appendChild(script);
    };

    const origin = window.location.origin;
    const pageUrl = `${origin}${location.pathname}${location.search}`;

    let title = "MUST Past Papers | Midterm & Final Papers by Department";
    let description =
      "Find MUST past papers by department, subject, semester, and year. Upload papers, discover top contributors, and prepare faster.";
    let robots = "index, follow";

    if (normalizedPath === "/upload") {
      title = "Upload Paper | MUST Past Papers";
      description = "Upload your MUST past papers and help students prepare better across all departments.";
    } else if (normalizedPath === "/profile") {
      title = "Profile | MUST Past Papers";
      description = "Manage your uploads, profile details, and activity on MUST Past Papers.";
      robots = "noindex, follow";
    } else if (isAdminRoute) {
      title = "Admin Panel | MUST Past Papers";
      description = "Internal moderation dashboard.";
      robots = "noindex, nofollow";
    }

    document.title = title;
    setMetaTag("description", description);
    setMetaTag("robots", robots);
    setMetaTag("og:title", title, "property");
    setMetaTag("og:description", description, "property");
    setMetaTag("og:type", "website", "property");
    setMetaTag("og:url", pageUrl, "property");
    setMetaTag("og:site_name", "MUST Past Papers", "property");
    setMetaTag("twitter:card", "summary_large_image");
    setMetaTag("twitter:title", title);
    setMetaTag("twitter:description", description);
    setCanonical(pageUrl);

    if (!isAdminRoute) {
      setJsonLd({
        "@context": "https://schema.org",
        "@type": "WebSite",
        name: "MUST Past Papers",
        url: origin,
        description:
          "Academic archive for MUST past papers with filtering by department, subject, semester, and year.",
      });
    } else {
      setJsonLd(null);
    }
  }, [isAdminRoute, location.pathname, location.search, normalizedPath]);

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
        <footer className="border-t border-slate-200 bg-white px-3 py-6 pb-[calc(env(safe-area-inset-bottom)+6.5rem)] text-center text-slate-900 md:px-4 md:py-10 md:pb-10">
          <p className="text-sm font-extrabold tracking-[0.14em] text-slate-900 md:text-base">
            MUST PAST PAPERS BY DEPARTMENT OF CSIT
          </p>
          <div className="mx-auto mt-4 h-px w-40 bg-slate-300" />
          <p className="mt-3 text-[11px] font-bold tracking-[0.1em] text-slate-600 md:text-xs">
            © {new Date().getFullYear()} DESIGNED AND DEVELOPED BY CRUX DYNAMICS
          </p>
          <p className="mt-2 text-xs font-semibold text-slate-600 md:text-sm">
            Contact us: <a href="mailto:cruxdynamics@gmail.com" className="underline underline-offset-2">cruxdynamics@gmail.com</a>
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
