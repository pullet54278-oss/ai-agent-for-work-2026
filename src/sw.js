// Service worker — offline support + "อัปเดตแอป" (update) flow. The build fills in the build id and the precache list.
const BUILD = '__BUILD_ID__';
const CACHE = 'cpa26-' + BUILD;
const PRECACHE = __PRECACHE__;

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(PRECACHE.map(u => new Request(u, { cache: 'reload' })))));
  // a new version waits until the page asks for it (refresh button / banner), so nothing changes mid-lesson
});
self.addEventListener('activate', e => {
  e.waitUntil((async () => {
    for (const k of await caches.keys()) if (k.startsWith('cpa26-') && k !== CACHE) await caches.delete(k);
    await self.clients.claim();
  })());
});
self.addEventListener('message', e => {
  if (e.data === 'SKIP_WAITING') self.skipWaiting();
  if (e.data === 'BUILD?' && e.source) e.source.postMessage({ build: BUILD });
});

const sameOrigin = u => u.origin === self.location.origin;
async function networkFirst(req, timeoutMs) {
  const c = await caches.open(CACHE);
  try {
    const ctl = new AbortController(); const t = setTimeout(() => ctl.abort(), timeoutMs);
    const r = await fetch(req, { signal: ctl.signal }); clearTimeout(t);
    if (r.ok) c.put(req, r.clone());
    return r;
  } catch (err) {
    return (await c.match(req, { ignoreSearch: true })) || (await c.match('./')) || Response.error();
  }
}
async function staleWhileRevalidate(req) {
  const c = await caches.open(CACHE);
  const hit = await c.match(req);
  const net = fetch(req).then(r => { if (r.ok || r.type === 'opaque') c.put(req, r.clone()); return r; }).catch(() => hit);
  return hit || net;
}

self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const u = new URL(req.url);
  if (sameOrigin(u) && u.pathname.startsWith('/api/')) return; // live news: the page handles its own fallback
  if (sameOrigin(u) && /\/version\.json$/.test(u.pathname)) return; // always ask the network
  if (req.mode === 'navigate') { e.respondWith(networkFirst(req, 4000)); return; }
  if (sameOrigin(u) || /^fonts\.(googleapis|gstatic)\.com$/.test(u.hostname)) e.respondWith(staleWhileRevalidate(req));
});
