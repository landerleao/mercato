/* Mercato — funciona offline (no mercado o sinal costuma cair) */
const VERSAO = 'mercato-v5';
const BASE = ['./', 'index.html', 'css/app.css', 'js/app.js', 'js/store.js', 'js/catalogo.js', 'js/nuvem.js', 'js/config.js', 'manifest.webmanifest',
  'icons/icon-192.png', 'icons/icon-512.png', 'icons/apple-touch-icon.png', 'icons/favicon-32.png'];

self.addEventListener('install', e => { e.waitUntil(caches.open(VERSAO).then(c => c.addAll(BASE)).then(() => self.skipWaiting())); });
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== VERSAO).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  const externo = url.origin !== location.origin;
  // fontes e ícones (CDN): usa o cache e atualiza em segundo plano
  if (externo && /fonts\.(googleapis|gstatic)\.com|cdn\.jsdelivr\.net|www\.gstatic\.com/.test(url.host)) {
    e.respondWith(caches.open(VERSAO).then(async c => {
      const hit = await c.match(req);
      const rede = fetch(req).then(r => { if (r.ok || r.type === 'opaque') c.put(req, r.clone()); return r; }).catch(() => hit);
      return hit || rede;
    }));
    return;
  }
  if (externo) return;
  // app: rede primeiro, cache se estiver offline
  e.respondWith(fetch(req).then(r => { const cp = r.clone(); caches.open(VERSAO).then(c => c.put(req, cp)); return r; })
    .catch(() => caches.match(req).then(r => r || caches.match('index.html'))));
});
