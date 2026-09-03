/* Attendance budget - offline shell.
   Cache-first on a versioned cache. Bump CACHE when the app changes; the old
   cache is deleted on activate so a stale index.html can never outlive it. */
"use strict";
const CACHE = 'atten-v1';
const ASSETS = ['./', './index.html', './manifest.webmanifest', './icon.svg'];
self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(ASSETS)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k))))
    .then(() => self.clients.claim()));
});
self.addEventListener('fetch', e => {
  if(e.request.method !== 'GET') return;
  e.respondWith(caches.match(e.request).then(hit => hit || fetch(e.request).then(res => {
    // Only same-origin successes are cached. There is no CDN and no API here,
    // so anything else is not ours to keep.
    if(res.ok && new URL(e.request.url).origin === location.origin)
      caches.open(CACHE).then(c => c.put(e.request, res.clone()));
    return res;
  }).catch(() => caches.match('./index.html'))));
});
