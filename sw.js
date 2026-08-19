const CACHE='model-kit-pwa-v11-card-fix';
const ASSETS=['./','index.html','styles.css?v=11.0','app.js?v=11.0','seed.json','manifest.webmanifest','icon-192.svg','icon-512.svg','version.json'];
self.addEventListener('install',e=>{self.skipWaiting();e.waitUntil(caches.open(CACHE).then(c=>c.addAll(ASSETS)))});
self.addEventListener('activate',e=>e.waitUntil(
  caches.keys().then(keys=>Promise.all(keys.filter(k=>k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim())
));
self.addEventListener('fetch',e=>e.respondWith(
  fetch(e.request).then(r=>{const copy=r.clone();caches.open(CACHE).then(c=>c.put(e.request,copy));return r})
  .catch(()=>caches.match(e.request))
));
