/* jeetio service worker — hand-rolled, no deps (the $0 rule applies to bundle
 * size too). Registered by src/components/dumb/pwa-register.tsx, production only.
 *
 * What it does, and deliberately does NOT do:
 *  - Pages (navigations): network-first. Fresh deploys always win; the cache is
 *    only read when the network is gone, then /offline as the last resort.
 *  - /_next/static/* (content-hashed) + /icons/* + fonts: cache-first, forever.
 *  - Same-origin images (/_next/image, /og.png …): stale-while-revalidate, capped.
 *  - CROSS-ORIGIN REQUESTS ARE NEVER TOUCHED. v1 tried to cache the Clash Royale
 *    card art (api-assets.clashroyale.com) and broke every card image on the
 *    site: /sw.js is served with the page CSP, whose connect-src doesn't list
 *    that host, so the worker's own fetch() was blocked and the browser got an
 *    undefined response. The CDN sends long cache headers anyway — the normal
 *    HTTP cache is the right layer for it.
 *  - /api/*: NEVER cached. Battle logs, stats and counters must be live.
 *  - Non-GET: passthrough.
 *
 * Bump VERSION when the strategy changes; old caches are dropped on activate.
 */
const VERSION = "v2";
const SHELL = `jeetio-shell-${VERSION}`;
const STATIC = `jeetio-static-${VERSION}`;
const IMAGES = `jeetio-images-${VERSION}`;
const IMAGE_CAP = 150;

const OFFLINE_URL = "/offline";
const PRECACHE = [OFFLINE_URL, "/icons/icon-192.png", "/icons/icon-512.png"];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(SHELL)
      .then((c) => c.addAll(PRECACHE))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((k) => k.startsWith("jeetio-") && ![SHELL, STATIC, IMAGES].includes(k))
            .map((k) => caches.delete(k))
        )
      )
      .then(() => self.clients.claim())
  );
});

self.addEventListener("message", (event) => {
  if (event.data && event.data.type === "SKIP_WAITING") self.skipWaiting();
});

const isStatic = (url) =>
  url.pathname.startsWith("/_next/static/") ||
  url.pathname.startsWith("/icons/") ||
  /\.(woff2?|ttf|otf)$/.test(url.pathname);

const isImage = (url) =>
  url.pathname.startsWith("/_next/image") || /\.(png|jpe?g|webp|avif|svg)$/.test(url.pathname);

const isApi = (url) => url.pathname.startsWith("/api/");

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;

  const url = new URL(request.url);
  // Only same-origin traffic is ours to manage — see the header comment.
  if (url.origin !== self.location.origin) return;
  if (isApi(url)) return;

  if (request.mode === "navigate") {
    event.respondWith(networkFirstPage(request));
    return;
  }
  if (isStatic(url)) {
    event.respondWith(cacheFirst(request, STATIC));
    return;
  }
  if (isImage(url)) {
    event.respondWith(staleWhileRevalidate(request, IMAGES, IMAGE_CAP));
  }
});

async function networkFirstPage(request) {
  const cache = await caches.open(SHELL);
  try {
    const res = await fetch(request);
    // Keep a copy of the last good HTML for each visited page so the site still
    // opens on a dead connection (with whatever data it last had).
    if (res.ok) safePut(cache, request, res.clone());
    return res;
  } catch {
    const cached = await cache.match(request);
    if (cached) return cached;
    const offline = await cache.match(OFFLINE_URL);
    return offline || new Response("Offline", { status: 503, headers: { "Content-Type": "text/plain" } });
  }
}

async function cacheFirst(request, name) {
  const cache = await caches.open(name);
  const cached = await cache.match(request);
  if (cached) return cached;
  const res = await fetch(request);
  if (res.ok) safePut(cache, request, res.clone());
  return res;
}

// Serve the cached copy immediately (if any) and refresh in the background.
// A failed refresh with nothing cached must surface as a real network error,
// never as an undefined response — that's what broke v1.
async function staleWhileRevalidate(request, name, cap) {
  const cache = await caches.open(name);
  const cached = await cache.match(request);
  const refresh = fetch(request).then((res) => {
    if (res.ok) safePut(cache, request, res.clone()).then(() => trim(cache, cap));
    return res;
  });
  if (cached) {
    refresh.catch(() => {});
    return cached;
  }
  return refresh;
}

// cache.put can reject (quota, Vary: *, storage disabled) — that must never
// take the response down with it.
function safePut(cache, request, response) {
  return cache.put(request, response).catch(() => {});
}

// Oldest-first eviction. Cache API keeps insertion order, so drop from the front.
async function trim(cache, cap) {
  try {
    const keys = await cache.keys();
    if (keys.length <= cap) return;
    await Promise.all(keys.slice(0, keys.length - cap).map((k) => cache.delete(k)));
  } catch {
    /* best effort */
  }
}
