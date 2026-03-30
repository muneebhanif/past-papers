import { ConvexAuthProvider } from "@convex-dev/auth/react";
import { Analytics } from "@vercel/analytics/react";
import { ConvexReactClient } from "convex/react";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App";
import "./index.css";

const convexUrl = (import.meta.env.VITE_CONVEX_URL ?? "").trim().replace(/\/+$/, "");

if (!convexUrl) {
  throw new Error("Missing VITE_CONVEX_URL. Configure it in your environment.");
}

const convex = new ConvexReactClient(convexUrl);

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ConvexAuthProvider client={convex}>
      <BrowserRouter>
        <App />
        <Analytics />
      </BrowserRouter>
    </ConvexAuthProvider>
  </StrictMode>,
)
