/* MindAICode service worker — makes every page usable with no internet.
   Strategy: cache-first for our own files, with a background refresh. */

const CACHE = 'mindaicode-v20';

const FILES = [
  'index.html',
  'mindaicode-home.html',
  'mindaicode-course-path.html',
  'mindaicode-programming-basics.html',
  'basics-content.js',
  'basics-engine.js',
  'code-langs.js',
  'complexity.js',
  'firebase-config.js',
  'mindaicode-auth.js',
  'mindaicode-big-o.html',
  'mindaicode-linear-structures.html',
  'mindaicode-graphs.html',
  'mindaicode-hashing.html',
  'mindaicode-trees.html',
  'mindaicode-recursion-dp.html',
  'mindaicode-capstone.html',
  'mindaicode-bubble-sort.html',
  'mindaicode-selection-sort.html',
  'mindaicode-insertion-sort.html',
  'mindaicode-merge-sort.html',
  'mindaicode-quick-sort.html',
  'mindaicode-heap-sort.html',
  'mindaicode-binary-search.html',
  'mindaicode-race-all.html',
  'mindaicode-revision.html',
  'mindaicode-sandbox.html',
  'mindaicode-stability.html',
  'manifest.json',
  'icon.svg',
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE)
      // addAll fails entirely if any one file is missing, so add individually
      .then(cache => Promise.all(
        FILES.map(f => cache.add(f).catch(() => null))
      ))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', event => {
  const req = event.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;

  // Pages must be NETWORK-FIRST. Cache-first on HTML meant an updated lesson
  // could never reach a student who had already opened the page once — they
  // were permanently stuck on whatever version they first loaded.
  const isPage = req.mode === 'navigate' || url.pathname.endsWith('.html');

  if (isPage) {
    event.respondWith(
      fetch(req)
        .then(res => {
          if (res && res.status === 200) {
            const copy = res.clone();
            caches.open(CACHE).then(c => c.put(req, copy)).catch(() => {});
          }
          return res;
        })
        // offline: fall back to whatever we stored last
        .catch(() => caches.match(req).then(hit => hit || caches.match('index.html')))
    );
    return;
  }

  // Everything else (manifest, icons) can stay cache-first with a refresh.
  event.respondWith(
    caches.match(req).then(cached => {
      const network = fetch(req)
        .then(res => {
          if (res && res.status === 200) {
            const copy = res.clone();
            caches.open(CACHE).then(c => c.put(req, copy)).catch(() => {});
          }
          return res;
        })
        .catch(() => cached || caches.match('index.html'));
      return cached || network;
    })
  );
});
