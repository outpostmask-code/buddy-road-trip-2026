// BUDDY road trip — service worker
// Caches the app shell so the trip info, points, badges and checklists all
// work with zero signal (Big Sur, Day 3). Map tiles are cached opportunistically
// as they're viewed — so if you open a day's map once with wifi/signal (e.g. at
// the hotel), those tiles are already saved for later when signal drops.

// Bump SHELL_CACHE (v1 -> v2) any time index.html/style.css/app.js/data.js
// change. This is a cache-first service worker, so without a version bump a
// phone that already installed the app keeps serving the OLD shell forever
// — the fix in the repo never reaches the device. The version bump is what
// makes the "activate" handler below delete the old cache and pull fresh
// files. (This bit us on the 2026-08-09 mobile-layout fix: testing on
// desktop showed the new CSS, but a previously-loaded phone would not have
// gotten it without this bump.)
const SHELL_CACHE = "buddy-shell-v2";
const TILE_CACHE = "buddy-tiles-v1";

const SHELL_FILES = [
  "./",
  "./index.html",
  "./style.css",
  "./app.js",
  "./data.js",
  "./manifest.json",
  "./vendor/leaflet/leaflet.js",
  "./vendor/leaflet/leaflet.css",
  "./vendor/leaflet/marker-icon.png",
  "./vendor/leaflet/marker-icon-2x.png",
  "./vendor/leaflet/marker-shadow.png",
  "./icons/icon-192.png",
  "./icons/icon-512.png",
  "./icons/apple-touch-icon.png"
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(SHELL_CACHE).then((cache) => cache.addAll(SHELL_FILES)).then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((names) =>
      Promise.all(
        names
          .filter((n) => n !== SHELL_CACHE && n !== TILE_CACHE)
          .map((n) => caches.delete(n))
      )
    ).then(() => self.clients.claim())
  );
});

function isTileRequest(url) {
  return /tile\.openstreetmap\.org/.test(url) || /\/\d+\/\d+\/\d+\.png/.test(url);
}

self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET") return;

  const url = req.url;

  // Map tiles: cache-first, fall back to network, save what we fetch.
  if (isTileRequest(url)) {
    event.respondWith(
      caches.open(TILE_CACHE).then((cache) =>
        cache.match(req).then((cached) => {
          const fetchPromise = fetch(req)
            .then((res) => {
              if (res && res.ok) cache.put(req, res.clone());
              return res;
            })
            .catch(() => cached);
          return cached || fetchPromise;
        })
      )
    );
    return;
  }

  // App shell: cache-first so it works fully offline.
  if (url.startsWith(self.location.origin)) {
    event.respondWith(
      caches.match(req).then((cached) => cached || fetch(req).catch(() => caches.match("./index.html")))
    );
  }
});
