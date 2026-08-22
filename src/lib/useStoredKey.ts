"use client";
import { useCallback, useSyncExternalStore } from "react";

/**
 * Read/write a single localStorage string as React state.
 *
 * Uses `useSyncExternalStore` rather than the load-in-an-effect pattern the
 * older pages use: localStorage IS an external store, so this is the shape
 * React provides for it — no SSR hazard (the server snapshot is ""), no
 * `set-state-in-effect` lint noise, and every component reading the same key
 * updates together (including across tabs, via the `storage` event).
 */
const listeners = new Set<() => void>();

function notify() {
  for (const l of listeners) l();
}

function subscribe(onChange: () => void): () => void {
  listeners.add(onChange);
  window.addEventListener("storage", onChange);
  return () => {
    listeners.delete(onChange);
    window.removeEventListener("storage", onChange);
  };
}

function read(key: string): string {
  try {
    return window.localStorage.getItem(key) ?? "";
  } catch {
    return "";
  }
}

/** Server/prerender snapshot — no storage exists, so nothing is stored. */
const EMPTY = "";

export function useStoredKey(key: string): [string, (next: string) => void] {
  const value = useSyncExternalStore(
    subscribe,
    () => read(key),
    () => EMPTY
  );

  const set = useCallback(
    (next: string) => {
      try {
        if (next) window.localStorage.setItem(key, next);
        else window.localStorage.removeItem(key);
      } catch {
        // storage unavailable / quota — the value just won't persist
      }
      notify();
    },
    [key]
  );

  return [value, set];
}
