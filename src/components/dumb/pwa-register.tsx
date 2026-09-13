"use client";
import { useEffect, useState } from "react";
import { useStoredKey } from "@/lib/useStoredKey";

/**
 * Two pieces of the PWA story:
 *
 *  - <PwaRegister />   registers public/sw.js (production only). Lives in the
 *                      root layout, renders nothing.
 *  - <PwaInstallBar /> a small, inline "add to home screen" strip. Rendered by
 *                      the home page only, near the bottom — it is content on
 *                      the page, not a popup over it (the fixed bottom bar of
 *                      the first cut got in the way on every page).
 *
 *  - Android/Chrome fire `beforeinstallprompt`; we hold the event and call
 *    prompt() from the Install button (browsers require a user gesture).
 *  - iOS Safari has no install API, so the strip tells the user where the
 *    button is (Share → Add to Home Screen).
 *  - Dismiss is remembered in localStorage for 30 days. Standalone mode
 *    (already installed) renders nothing at all.
 */
type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

const DISMISS_KEY = "pwa:install-dismissed-at";
const DISMISS_FOR_MS = 30 * 24 * 60 * 60 * 1000;

const isStandalone = () =>
  window.matchMedia("(display-mode: standalone)").matches ||
  // iOS Safari's non-standard flag
  (navigator as Navigator & { standalone?: boolean }).standalone === true;

const isIos = () =>
  /iphone|ipad|ipod/i.test(navigator.userAgent) ||
  (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);

const isSafari = () => /safari/i.test(navigator.userAgent) && !/crios|fxios|chrome|android/i.test(navigator.userAgent);

/** Service worker — production only so `next dev` HMR never fights a cache. */
export const PwaRegister = () => {
  useEffect(() => {
    if (process.env.NODE_ENV !== "production" || !("serviceWorker" in navigator)) return;
    navigator.serviceWorker.register("/sw.js").catch((err) => {
      console.warn("[pwa] service worker registration failed", err);
    });
  }, []);
  return null;
};

export const PwaInstallBar = () => {
  const [dismissedAt, setDismissedAt] = useStoredKey(DISMISS_KEY);
  const [installEvent, setInstallEvent] = useState<BeforeInstallPromptEvent | null>(null);
  const [mode, setMode] = useState<"hidden" | "android" | "ios">("hidden");

  // Event listener + timer, both async, so no sync setState in the effect body.
  useEffect(() => {
    if (isStandalone()) return;
    const dismissed = Number(dismissedAt) || 0;
    if (Date.now() - dismissed < DISMISS_FOR_MS) return;

    const onPrompt = (e: Event) => {
      e.preventDefault();
      setInstallEvent(e as BeforeInstallPromptEvent);
      setMode("android");
    };
    window.addEventListener("beforeinstallprompt", onPrompt);

    const timer = window.setTimeout(() => {
      if (isIos() && isSafari()) setMode("ios");
    }, 0);

    const onInstalled = () => setMode("hidden");
    window.addEventListener("appinstalled", onInstalled);

    return () => {
      window.removeEventListener("beforeinstallprompt", onPrompt);
      window.removeEventListener("appinstalled", onInstalled);
      window.clearTimeout(timer);
    };
  }, [dismissedAt]);

  if (mode === "hidden") return null;

  const dismiss = () => {
    setDismissedAt(String(Date.now()));
    setMode("hidden");
  };

  const install = async () => {
    if (!installEvent) return;
    await installEvent.prompt();
    const { outcome } = await installEvent.userChoice;
    if (outcome === "accepted") setMode("hidden");
    else dismiss();
  };

  return (
    <div className="pwa-bar" role="note" aria-label="Add Jeetio to your home screen">
      <span className="pwa-bar-text">
        {mode === "android" ? (
          <>Add <b>Jeetio</b> to your home screen — Deck AI one tap away.</>
        ) : (
          <>
            Add <b>Jeetio</b> to your home screen: tap <b>Share</b>, then <b>Add to Home Screen</b>.
          </>
        )}
      </span>
      <span className="pwa-bar-actions">
        {mode === "android" && (
          <button type="button" className="pwa-bar-install" onClick={install}>
            Install
          </button>
        )}
        <button type="button" className="pwa-bar-dismiss" onClick={dismiss} aria-label="Not now">
          {mode === "android" ? "Not now" : "Got it"}
        </button>
      </span>
    </div>
  );
};
