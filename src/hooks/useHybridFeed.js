import { ConvexHttpClient } from "convex/browser";
import { useCallback, useEffect, useRef, useState } from "react";
import { useConvexConnectionState, usePaginatedQuery } from "convex/react";
import { toast } from "sonner";
import { api } from "../lib/api";

const convexUrl = (import.meta.env.VITE_CONVEX_URL ?? "").trim().replace(/\/+$/, "");
const httpClient = new ConvexHttpClient(convexUrl);

const HTTP_PAGE_SIZE = 10;
const POLL_INTERVAL_MS = 30_000;

/**
 * Hybrid feed query.
 * – When the WebSocket is connected: delegates to `usePaginatedQuery` for
 *   real-time live data (no polling, no extra requests).
 * – When the WebSocket is down: falls back to `ConvexHttpClient.query` over
 *   HTTPS, polls every 30 s, and shows Sonner toasts for state changes.
 */
export function useHybridFeed({ department, search, paperType, semester }) {
  const { isWebSocketConnected } = useConvexConnectionState();

  // ── Track first-render state so we don't fire spurious toasts on mount ──
  const mountedRef = useRef(false);
  const wasConnectedRef = useRef(isWebSocketConnected);

  // ── Live real-time query – always subscribed; results used only when live ──
  const liveQuery = usePaginatedQuery(
    api.papers.listApproved,
    { department, search, paperType, semester },
    { initialNumItems: 10 },
  );

  // ── HTTP fallback state ──
  const [httpResults, setHttpResults] = useState([]);
  const [httpStatus, setHttpStatus] = useState("LoadingFirstPage");
  const [httpCursor, setHttpCursor] = useState(null);
  const [httpLoading, setHttpLoading] = useState(false);
  const fetchingRef = useRef(false);

  // ── Track filter args to reset when they change while in HTTP mode ──
  const prevArgsKey = useRef("");
  const argsKey = JSON.stringify({ department, search, paperType, semester });

  // ────────────────────────────────────────────────────────────────────────────
  const fetchHttp = useCallback(
    async ({ cursor = null, append = false, silent = false } = {}) => {
      if (fetchingRef.current) return;
      fetchingRef.current = true;
      if (!append) setHttpStatus("LoadingFirstPage");
      setHttpLoading(true);

      try {
        const result = await httpClient.query(api.papers.listApproved, {
          department,
          search,
          paperType,
          semester,
          paginationOpts: { numItems: HTTP_PAGE_SIZE, cursor },
        });
        setHttpResults((prev) => (append ? [...prev, ...result.page] : result.page));
        setHttpCursor(result.continueCursor);
        setHttpStatus(result.isDone ? "Exhausted" : "CanLoadMore");
      } catch {
        if (!silent) {
          toast.error("Failed to load papers. Check your connection.", { id: "http-fetch-error" });
        }
        // Don't get stuck on LoadingFirstPage if the first fetch fails
        setHttpStatus((s) => (s === "LoadingFirstPage" ? "Exhausted" : s));
      } finally {
        setHttpLoading(false);
        fetchingRef.current = false;
      }
    },
    [department, search, paperType, semester],
  );

  // ── Reset HTTP state when filters change (HTTP mode only) ──────────────────
  // Use an always-runs effect (no dep array) to compare against previous value.
  useEffect(() => {
    if (!mountedRef.current) return; // handled by mount effect below
    if (argsKey !== prevArgsKey.current) {
      prevArgsKey.current = argsKey;
      if (!isWebSocketConnected) {
        setHttpResults([]);
        setHttpCursor(null);
        fetchHttp({ cursor: null, append: false });
      }
    }
  }, [argsKey, isWebSocketConnected, fetchHttp]);

  // ── Mount: initial HTTP fetch if already disconnected ─────────────────────
  useEffect(() => {
    prevArgsKey.current = argsKey;
    mountedRef.current = true;
    if (!isWebSocketConnected) {
      fetchHttp();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Monitor WebSocket connection state changes ─────────────────────────────
  useEffect(() => {
    const prev = wasConnectedRef.current;
    wasConnectedRef.current = isWebSocketConnected;

    // Went offline
    if (!isWebSocketConnected && prev) {
      toast.warning("Connection lost — loading papers offline. Content won't update live.", {
        id: "ws-status",
        duration: 6000,
      });
      setHttpResults([]);
      setHttpCursor(null);
      fetchHttp();
      return;
    }

    // Came back online
    if (isWebSocketConnected && !prev) {
      toast.success("Back online — live updates restored!", { id: "ws-status", duration: 4000 });
      // Clear HTTP cache; live query takes over automatically
      setHttpResults([]);
      setHttpCursor(null);
      setHttpStatus("LoadingFirstPage");
    }
  }, [isWebSocketConnected, fetchHttp]);

  // ── Poll every 30 s while in HTTP mode ────────────────────────────────────
  useEffect(() => {
    if (isWebSocketConnected) return;
    const id = setInterval(() => fetchHttp({ silent: true }), POLL_INTERVAL_MS);
    return () => clearInterval(id);
  }, [isWebSocketConnected, fetchHttp]);

  // ── Return live or HTTP results based on current mode ─────────────────────
  if (isWebSocketConnected) {
    return {
      results: liveQuery.results,
      status: liveQuery.status,
      loadMore: liveQuery.loadMore,
      isHybridMode: false,
    };
  }

  const effectiveStatus =
    httpLoading && httpResults.length === 0 ? "LoadingFirstPage" : httpStatus;

  return {
    results: httpResults,
    status: effectiveStatus,
    loadMore: () => fetchHttp({ cursor: httpCursor, append: true }),
    isHybridMode: true,
    httpLoading,
  };
}
