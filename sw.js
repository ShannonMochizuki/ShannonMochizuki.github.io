const CACHE='model-kit-pwa-v13-gundam-icon';
const ASSETS=['./','index.html','styles.css?v=13.0','app.js?v=13.0','seed.json','manifest.webmanifest','icon-192.png','icon-512.png','icon-192-maskable.png','icon-512-maskable.png','version.json'];
self.addEventListener('install',e=>{self.skipWaiting();e.waitUntil(caches.open(CACHE).then(c=>c.addAll(ASSETS)))});
self.addEventListener('activate',e=>e.waitUntil(
  caches.keys().then(keys=>Promise.all(keys.filter(k=>k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim())
));
self.addEventListener('fetch',e=>e.respondWith(
  fetch(e.request).then(r=>{const copy=r.clone();caches.open(CACHE).then(c=>c.put(e.request,copy));return r})
  .catch(()=>caches.match(e.request))
));
