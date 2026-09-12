/* jeetio service worker — hand-rolled, no deps (the $0 rule applies to bundle
 * size too). Registered by src/components/dumb/pwa-register.tsx, production only.
 *
 * What it does, and deliberately does NOT do:
 *  - Pages (navigations): network-first. Fresh deploys always win; the cache is
 *    only read when the network is gone, then /offline as the last resort.
 *  - /_next/static/* (content-hashed) + /icons/* + fonts: cache-first, forever.
 *  - Card art (api-assets.clashroyale.com) + /_next/image: stale-while-revalidate,
 *    capped, so Deck AI's card grid stops re-downloading 100+ pngs per visit.
 *  - /api/*: NEVER cached. Battle logs, stats and counters must be live.
 *  - Non-GET: passthrough.
 *
 * Bump VERSION when the strategy changes; old caches are dropped on activate.
 */
const VERSION = "v1";
const SHELL = `jeetio-shell-${VERSION}`;
const STATIC = `jeetio-static-${VERSION}`;
const IMAGES = `jeetio-images-${VERSION}`;
const IMAGE_CAP = 300;

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
  url.origin === self.location.origin &&
  (url.pathname.startsWith("/_next/static/") ||
    url.pathname.startsWith("/icons/") ||
    /\.(woff2?|ttf|otf)$/.test(url.pathname));

const isImage = (url) =>
  url.hostname === "api-assets.clashroyale.com" ||
  (url.origin === self.location.origin &&
    (url.pathname.startsWith("/_next/image") || /\.(png|jpe?g|webp|avif|svg)$/.test(url.pathname)));

const isApi = (url) => url.origin === self.location.origin && url.pathname.startsWith("/api/");

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;

  const url = new URL(request.url);
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
    if (res.ok) cache.put(request, res.clone());
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
  if (res.ok) cache.put(request, res.clone());
  return res;
}

async function staleWhileRevalidate(request, name, cap) {
  const cache = await caches.open(name);
  const cached = await cache.match(request);
  const refresh = fetch(request)
    .then(async (res) => {
      if (res.ok || res.type === "opaque") {
        await cache.put(request, res.clone());
        trim(cache, cap);
      }
      return res;
    })
    .catch(() => cached);
  return cached || refresh;
}

// Oldest-first eviction. Cache API keeps insertion order, so drop from the front.
async function trim(cache, cap) {
  const keys = await cache.keys();
  if (keys.length <= cap) return;
  await Promise.all(keys.slice(0, keys.length - cap).map((k) => cache.delete(k)));
}
