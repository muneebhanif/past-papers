import { useConvexAuth, useConvexConnectionState, useMutation } from "convex/react";
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
import { PaperDetailPage } from "./pages/PaperDetailPage";
import { DEPARTMENTS } from "./constants/departments";
import { api } from "./lib/api";
import { ADMIN_PANEL_PATH } from "./lib/adminPath";

export default function App() {
  const { isAuthenticated } = useConvexAuth();
  const connectionState = useConvexConnectionState();
  const syncCurrentUser = useMutation(api.users.syncCurrentUser);
  const location = useLocation();

  const [department, setDepartment] = useState(DEPARTMENTS[0]);
  const [search, setSearch] = useState("");
  const [isAuthPromptOpen, setAuthPromptOpen] = useState(false);
  const [disconnectMessage, setDisconnectMessage] = useState("");

  const normalizedPath = (location.pathname || "/").replace(/\/+$/, "") || "/";
  const isAdminRoute = normalizedPath === `/${ADMIN_PANEL_PATH}`;
  const isProfileRoute = normalizedPath === "/profile";
  const isPaperRoute = normalizedPath.startsWith("/paper/");

  useEffect(() => {
    if (!isAuthenticated) return;
    void syncCurrentUser({});
  }, [isAuthenticated, syncCurrentUser]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const handler = (event) => {
      setDisconnectMessage(event.detail || "");
    };
    window.addEventListener("convex-disconnect-error", handler);
    return () => window.removeEventListener("convex-disconnect-error", handler);
  }, []);

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

    const setJsonLd = (payloads) => {
      const id = "seo-jsonld";
      const existing = document.getElementById(id);
      if (existing) existing.remove();

      if (!payloads || (Array.isArray(payloads) && payloads.length === 0)) return;
      const script = document.createElement("script");
      script.id = id;
      script.type = "application/ld+json";
      script.text = JSON.stringify(Array.isArray(payloads) ? payloads : [payloads]);
      document.head.appendChild(script);
    };

    const SITE_ORIGIN = "https://www.mustpastpapers.app";
    const canonicalPath = location.pathname.replace(/\/+$/, "") || "/";
    const canonicalUrl = `${SITE_ORIGIN}${canonicalPath}`;

    let title = "MUST Past Papers — Download Midterm & Final Exam Papers | mustpastpapers.app";
    let description =
      "Download MUST (Mirpur University of Science & Technology) past papers free. Browse midterm, final & terminal exam papers by department, subject, semester and year. Upload and share past papers with fellow MUST students.";
    let robots = "index, follow, max-image-preview:large, max-snippet:-1";

    if (normalizedPath === "/upload") {
      title = "Upload Past Paper — Share MUST Exam Papers | MUST Past Papers";
      description = "Upload your MUST (Mirpur University) past papers — midterm, final, terminal or improve papers — and help students across all departments prepare better.";
    } else if (isPaperRoute) {
      title = "View Past Paper — MUST Exam Paper Details | MUST Past Papers";
      description = "View MUST past paper details, download the exam paper, read comments and replies. Past papers from Mirpur University of Science & Technology.";
    } else if (normalizedPath === "/profile") {
      title = "Your Profile | MUST Past Papers";
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
    setMetaTag("og:url", canonicalUrl, "property");
    setMetaTag("og:site_name", "MUST Past Papers", "property");
    setMetaTag("og:image", `${SITE_ORIGIN}/must-logo.png`, "property");
    setMetaTag("og:image:width", "1200", "property");
    setMetaTag("og:image:height", "630", "property");
    setMetaTag("twitter:card", "summary_large_image");
    setMetaTag("twitter:title", title);
    setMetaTag("twitter:description", description);
    setMetaTag("twitter:image", `${SITE_ORIGIN}/must-logo.png`);
    setCanonical(canonicalUrl);

    if (isAdminRoute) {
      setJsonLd(null);
    } else {
      const schemas = [];

      // WebSite with SearchAction (enables Google sitelinks search box)
      schemas.push({
        "@context": "https://schema.org",
        "@type": "WebSite",
        name: "MUST Past Papers",
        alternateName: ["mustpastpapers", "MUST Exam Papers", "Mirpur University Past Papers"],
        url: SITE_ORIGIN,
        description:
          "Free academic archive for MUST (Mirpur University of Science & Technology) past papers — midterm, final & terminal exam papers organized by department, subject, semester and year.",
        potentialAction: {
          "@type": "SearchAction",
          target: {
            "@type": "EntryPoint",
            urlTemplate: `${SITE_ORIGIN}/?search={search_term_string}`,
          },
          "query-input": "required name=search_term_string",
        },
      });

      // Organization
      schemas.push({
        "@context": "https://schema.org",
        "@type": "Organization",
        name: "MUST Past Papers",
        url: SITE_ORIGIN,
        logo: `${SITE_ORIGIN}/must-logo.png`,
        description: "Community-driven past paper archive for MUST (Mirpur University of Science & Technology) students.",
        contactPoint: {
          "@type": "ContactPoint",
          email: "cruxdynamics@gmail.com",
          contactType: "customer support",
        },
      });

      // BreadcrumbList for paper detail pages
      if (isPaperRoute) {
        schemas.push({
          "@context": "https://schema.org",
          "@type": "BreadcrumbList",
          itemListElement: [
            {
              "@type": "ListItem",
              position: 1,
              name: "Home",
              item: SITE_ORIGIN,
            },
            {
              "@type": "ListItem",
              position: 2,
              name: "Past Papers",
              item: SITE_ORIGIN,
            },
            {
              "@type": "ListItem",
              position: 3,
              name: "Paper Details",
              item: canonicalUrl,
            },
          ],
        });
      }

      setJsonLd(schemas);
    }
  }, [isAdminRoute, isPaperRoute, location.pathname, location.search, normalizedPath]);

  return (
    <div className="app-shell min-h-screen text-slate-900">
      {!isAdminRoute ? <Navbar search={search} setSearch={setSearch} /> : null}

      {!connectionState.isWebSocketConnected ? (
        <div className="mx-auto w-full max-w-[1300px] px-3 pt-3 md:px-4">
          <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
            {typeof navigator !== "undefined" && !navigator.onLine ? (
              <span>
                You&apos;re offline. Please check your internet connection. We&apos;ll reconnect automatically.
              </span>
            ) : /rate|429|too many|quota/i.test(disconnectMessage) ? (
              <span>
                Connection rate limited due to too many refreshes. Please wait a few seconds and we&apos;ll reconnect automatically.
              </span>
            ) : (
              <span>
                Connection lost. We&apos;re retrying automatically. If this keeps happening, please wait a few seconds and avoid rapid refreshes.
              </span>
            )}
          </div>
        </div>
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
            <Route
              path="/paper/:paperId"
              element={<PaperDetailPage onRequireAuth={() => setAuthPromptOpen(true)} />}
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
            Contact us: <a href="https://wa.me/923479943556" target="_blank" rel="noreferrer" className="underline underline-offset-2">WhatsApp 0347-9943556</a> · <a href="mailto:cruxdynamics@gmail.com" className="underline underline-offset-2">cruxdynamics@gmail.com</a>
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
