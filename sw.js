const CACHE_NAME = 'poke-lucky-defense-v18';
const SPRITE_IDS = [
  1, 2, 3, 4, 5, 6, 7, 8, 9, 13, 19, 25, 26, 27, 37, 38, 39, 41, 43, 52,
  54, 55, 59, 63, 64, 65, 68, 88, 92, 93, 94, 95, 106, 109, 112, 113, 115,
  123, 125, 127, 128, 130, 131, 133, 134, 135, 136, 142, 143, 144, 145, 146,
  147, 148, 149, 150, 151
];
const ART_IDS = [3, 6, 9, 26, 65, 94, 149, 150];
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
