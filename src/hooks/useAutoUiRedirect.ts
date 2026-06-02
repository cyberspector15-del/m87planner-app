import { useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";

type UiMode = "auto" | "desktop" | "mobile";

const UI_MODE_KEY = "m87.uiMode";

function getUiModeFromStorage(): UiMode {
  const raw = typeof window !== "undefined" ? window.localStorage.getItem(UI_MODE_KEY) : null;
  return raw === "desktop" || raw === "mobile" || raw === "auto" ? raw : "auto";
}

function setUiMode(mode: UiMode) {
  window.localStorage.setItem(UI_MODE_KEY, mode);
}

function isProbablyPhone(): boolean {
  if (typeof window === "undefined") return false;

  const ua = navigator.userAgent || "";
  const uaMobile = /Android|iPhone|iPod|Mobi/i.test(ua);
  const uadMobile = (navigator as any).userAgentData?.mobile === true;

  const narrow = window.matchMedia?.("(max-width: 768px)")?.matches ?? false;
  const coarse = window.matchMedia?.("(pointer: coarse)")?.matches ?? false;

  return (uaMobile || uadMobile) && (narrow || coarse);
}

function mapDesktopPathToMobile(pathname: string): string {
  if (pathname === "/" || pathname === "/dashboard") return "/m/dashboard";
  if (pathname === "/settings") return "/m/settings";
  if (pathname.startsWith("/focus")) return "/m/focus/setup";
  if (pathname === "/simulate") return "/m/consequences";
  if (pathname === "/pricing") return "/m/pricing";
  return "/m/dashboard";
}

export function useAutoUiRedirect({ isAuthenticated }: { isAuthenticated: boolean }) {
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    // Allow forcing UI mode via query param:
    // - ?ui=desktop => stay on desktop and stop auto-redirects
    // - ?ui=mobile  => redirect to mobile and keep doing so
    // - ?ui=auto    => restore automatic behavior
    const params = new URLSearchParams(location.search);
    const uiParam = params.get("ui");
    if (uiParam === "desktop" || uiParam === "mobile" || uiParam === "auto") {
      setUiMode(uiParam);
      params.delete("ui");
      const nextSearch = params.toString();
      navigate(
        { pathname: location.pathname, search: nextSearch ? `?${nextSearch}` : "" },
        { replace: true }
      );
      return;
    }

    if (location.pathname.startsWith("/m")) return;
    // Never redirect the auth flow. Mobile UI currently reuses desktop auth.
    if (location.pathname.startsWith("/auth")) return;
    // Don't auto-redirect signed-out users into the mobile app shell.
    if (!isAuthenticated) return;

    const mode = getUiModeFromStorage();
    if (mode === "desktop") return;

    const shouldRedirect = mode === "mobile" || (mode === "auto" && isProbablyPhone());
    if (!shouldRedirect) return;

    const target = mapDesktopPathToMobile(location.pathname);
    if (location.pathname !== target) {
      navigate(target, { replace: true });
    }
  }, [location.pathname, location.search, navigate, isAuthenticated]);
}
