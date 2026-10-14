const CACHE_NAME = 'poke-lucky-defense-v16';
const SPRITE_IDS = [
  1, 2, 3, 4, 5, 6, 7, 8, 9, 19, 25, 26, 41, 52, 63, 64, 65, 66, 74, 88,
  92, 93, 94, 95, 109, 112, 123, 130, 142, 143, 144, 145, 146, 147, 148,
  149, 150, 172, 179, 180, 181, 212, 229, 246, 247, 248, 250, 371, 372,
  373, 374, 375, 376, 382, 383, 384, 443, 444, 445, 493
];
const ART_IDS = [3, 6, 9, 26, 65, 94, 149, 150, 181, 248, 250, 373, 376, 384, 445, 493];
const ITEMS = [
  'poke-ball', 'great-ball', 'ultra-ball', 'master-ball', 'rare-candy',
  'amulet-coin', 'lucky-egg', 'fire-stone', 'water-stone', 'thunder-stone',
  'leaf-stone', 'moon-stone'
];
const PIXELS = [
  'arena_bg.png', 'arena_lucky.png', 'lucky_map_bg.png', 'lucky_map_fitted.png', 'title_banner.png', 'tile_slot.png', 'tile_track.png'
];

const CORE_ASSETS = [
  './',
  './index.html',
  './style.css',
  './data.js',
  './audio.js',
  './game.js',
  './manifest.json',
  './assets/icons/icon-192.png',
  './assets/icons/icon-512.png',
  './assets/icons/apple-touch-icon.png',
  './assets/icons/favicon.png',
  ...SPRITE_IDS.map(id => `./assets/sprites/${id}.png`),
  ...ART_IDS.map(id => `./assets/art/${id}.png`),
  ...ITEMS.map(n => `./assets/items/${n}.png`),
  ...PIXELS.map(p => `./assets/pixel/${p}`)
];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE_NAME).then(c => c.addAll(CORE_ASSETS)));
  self.skipWaiting();
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.map(k => (k !== CACHE_NAME ? caches.delete(k) : null)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (e) => {
  if (e.request.method !== 'GET') return;
  const url = new URL(e.request.url);
  const isCodeFile =
    e.request.mode === 'navigate' ||
    url.pathname.endsWith('/') ||
    url.pathname.endsWith('.html') ||
    url.pathname.endsWith('.js') ||
    url.pathname.endsWith('.css') ||
    url.pathname.endsWith('.json');

  if (isCodeFile) {
    // Network-First for code/HTML so installed PWAs always get live updates immediately
    e.respondWith(
      fetch(e.request, { cache: 'no-cache' })
        .then(resp => {
          if (resp && resp.status === 200) {
            const clone = resp.clone();
            caches.open(CACHE_NAME).then(c => c.put(e.request, clone));
          }
          return resp;
        })
        .catch(() => caches.match(e.request))
    );
    return;
  }

  e.respondWith(
    caches.match(e.request).then(cached => cached || fetch(e.request))
  );
});
