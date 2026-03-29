const rawPath = (import.meta.env.VITE_ADMIN_PANEL_PATH ?? "")
  .trim()
  .replace(/^\/+|\/+$/g, "");

export const ADMIN_PANEL_PATH =
  rawPath.length > 0 ? rawPath : "control-room-ax7k9p2m";

export const ADMIN_PANEL_ROUTE = `/${ADMIN_PANEL_PATH}`;
