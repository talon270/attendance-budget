/* Attendance budget - offline shell.
 *
 * NETWORK-FIRST FOR THE PAGE, cache-first for everything else.
 *
 * This was cache-first for everything, and that was a defect you could not
 * recover from without clearing site data: the whole app is one HTML file, so
 * a cached index.html meant a returning visitor was pinned to whatever version
 * they first loaded. Deploying a fix changed nothing for the people who
 * already had the bug. Bumping CACHE by hand on every deploy would have
 * "fixed" it only until the first time someone forgot.
 *
 * So the page itself is fetched from the network first and the cache is the
 * fallback, which is what makes this still work on a plane. The side assets -
 * the icon, the manifest - are cache-first because they are tiny, versionless
 * and refreshed in the background on every hit.
 */
"use strict";
const CACHE = 'atten-v2';   // v2 purges every v1 cache pinned to the old page
const ASSETS = ['./', './index.html', './manifest.webmanifest', './icon.svg'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(ASSETS)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys()
    .then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k))))
    .then(() => self.clients.claim()));
});

// A request for the app itself: a navigation, or anything asking for HTML.
function isPage(req){
  return req.mode === 'navigate'
      || (req.destination === 'document')
      || (req.headers.get('accept') || '').includes('text/html');
}

self.addEventListener('fetch', e => {
  const req = e.request;
  if(req.method !== 'GET') return;
  if(new URL(req.url).origin !== location.origin) return;  // nothing here is off-origin

  if(isPage(req)){
    e.respondWith(
      fetch(req).then(res => {
        if(res && res.ok) { const copy = res.clone(); caches.open(CACHE).then(c => c.put(req, copy)); }
        return res;
      }).catch(() => caches.match(req).then(hit => hit || caches.match('./index.html')))
    );
    return;
  }

  e.respondWith(caches.match(req).then(hit => {
    const net = fetch(req).then(res => {
      if(res && res.ok){ const copy = res.clone(); caches.open(CACHE).then(c => c.put(req, copy)); }
      return res;
    }).catch(() => hit);
    return hit || net;   // cached now, refreshed for next time
  }));
});
