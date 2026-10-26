/* Offline-first, same-origin service worker for the static GitHub Pages app. */
const CACHE_NAME = 'prateleira-de-livrinhos-v2';
const APP_ROOT = new URL(self.registration.scope);
const url = (path) => new URL(path, APP_ROOT).href;
const APP_SHELL = [
  './',
  './index.html',
  './livro.html',
  './manifest.webmanifest',
  './assets/css/app.css',
  './assets/js/library.js',
  './assets/js/reader.js',
  './assets/js/preferences.js',
  './assets/js/settings-ui.js',
  './assets/js/pwa.js',
  './assets/icons/icon.svg',
  './assets/icons/icon-192.png',
  './assets/icons/icon-512.png',
  './books/index.json'
];

async function preCacheBooks(cache) {
  const response = await fetch(url('./books/index.json'), { cache: 'reload' });
  if (!response.ok) throw new Error(`Catálogo HTTP ${response.status}`);
  const catalog = await response.clone().json();
  await cache.put(url('./books/index.json'), response);
  const illustrationPaths = new Set();
  for (const entry of catalog.books || []) {
    try {
      const bookUrl = url(entry.data);
      const bookResponse = await fetch(bookUrl, { cache: 'reload' });
      if (!bookResponse.ok) continue;
      const book = await bookResponse.clone().json();
      await cache.put(bookUrl, bookResponse);
      if (entry.cover) illustrationPaths.add(entry.cover);
      if (book.cover) illustrationPaths.add(book.cover);
      for (const page of book.pages || []) {
        if (page.illustration) illustrationPaths.add(page.illustration);
      }
    } catch (error) {
      console.warn('Livro não pôde ser salvo offline:', entry.id, error);
    }
  }
  await Promise.allSettled([...illustrationPaths].map(async (path) => {
    const response = await fetch(url(path), { cache: 'reload' });
    if (response.ok) await cache.put(url(path), response);
  }));
}

self.addEventListener('install', (event) => {
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE_NAME);
    await cache.addAll(APP_SHELL.map(url));
    try { await preCacheBooks(cache); }
    catch (error) { console.warn('Pré-cache de livros incompleto:', error); }
    await self.skipWaiting();
  })());
});

self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.filter((key) => key.startsWith('prateleira-de-livrinhos-') && key !== CACHE_NAME).map((key) => caches.delete(key)));
    await self.clients.claim();
  })());
});

async function networkFirst(request) {
  const cache = await caches.open(CACHE_NAME);
  try {
    const response = await fetch(request);
    if (response.ok) await cache.put(request, response.clone());
    return response;
  } catch {
    return await cache.match(request, { ignoreSearch: true })
      || await cache.match(url('./index.html'))
      || Response.error();
  }
}

async function cacheFirst(request) {
  const cache = await caches.open(CACHE_NAME);
  const stored = await cache.match(request, { ignoreSearch: true });
  if (stored) return stored;
  try {
    const response = await fetch(request);
    if (response.ok) await cache.put(request, response.clone());
    return response;
  } catch {
    return Response.error();
  }
}

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;
  const requestUrl = new URL(event.request.url);
  if (requestUrl.origin !== APP_ROOT.origin || !requestUrl.pathname.startsWith(APP_ROOT.pathname)) return;
  event.respondWith(event.request.mode === 'navigate' ? networkFirst(event.request) : cacheFirst(event.request));
});
