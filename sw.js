/* Offline-first, same-origin service worker for the static GitHub Pages app. */
const CACHE_NAME = 'prateleira-magica-v26';
const APP_ROOT = new URL(self.registration.scope);
const url = (path) => new URL(path, APP_ROOT).href;
const APP_SHELL = [
  './',
  './index.html',
  './prateleira.html',
  './livro.html',
  './personagem.html',
  './perfil.html',
  './manifest.webmanifest',
  './assets/css/app.css',
  './assets/js/avatar-parts.js',
  './assets/js/avatar-presets.js',
  './assets/data/avatar-presets.json',
  './assets/js/pet-parts.js',
  './assets/js/avatar.js',
  './assets/js/library.js',
  './assets/js/landing.js',
  './assets/js/reader.js',
  './assets/js/speech.js',
  './assets/js/colors.js',
  './assets/js/color-explorer.js',
  './assets/vendor/NameToColor.js',
  './assets/vendor/NameToColor.ptBR.js',
  './assets/js/page-turn.js',
  './assets/js/preferences.js',
  './assets/js/avatar-photo-colors.js',
  './assets/js/avatar-photo.js',
  './assets/js/settings-ui.js',
  './assets/js/profile.js',
  './assets/js/profile-tabs.js',
  './assets/vendor/page-flip.browser.js',
  './assets/js/pwa.js',
  './assets/icons/icon.svg',
  './assets/icons/icon-192.png',
  './assets/icons/icon-512.png',
  './books/index.json',
  './assets/pets/catalog.json',
  './assets/pets/530181-dinosaur.svg',
  './assets/pets/530182-crab.svg',
  './assets/pets/530183-elk.svg',
  './assets/pets/530184-jellyfish.svg',
  './assets/pets/530185-penguin.svg',
  './assets/pets/530186-the-cow.svg',
  './assets/pets/530187-turtle.svg',
  './assets/pets/530188-bear.svg',
  './assets/pets/530189-shrimp.svg',
  './assets/pets/530190-rabbit.svg',
  './assets/pets/530191-lion.svg',
  './assets/pets/530192-squirrel.svg',
  './assets/pets/530193-polar-bear.svg',
  './assets/pets/530194-raccoon.svg',
  './assets/pets/530195-wild-boar.svg',
  './assets/pets/530196-crocodile.svg',
  './assets/pets/530197-hedgehog.svg',
  './assets/pets/530198-fox.svg',
  './assets/pets/530199-cute-animals.svg',
  './assets/pets/530200-whale.svg'
];
// Binários baixados no CI para o mesmo domínio. Priorizamos cache offline, mas
// um aparelho com pouco espaço não deve perder o resto do PWA se eles falharem.
const PHOTO_ASSETS = [
  './assets/vendor/mediapipe/vision_bundle.mjs',
  './assets/vendor/mediapipe/wasm/vision_wasm_internal.js',
  './assets/vendor/mediapipe/wasm/vision_wasm_internal.wasm',
  './assets/vendor/mediapipe/wasm/vision_wasm_nosimd_internal.js',
  './assets/vendor/mediapipe/wasm/vision_wasm_nosimd_internal.wasm',
  './assets/vendor/mediapipe/models/face_landmarker.task',
  './assets/vendor/mediapipe/models/selfie_multiclass_256x256.tflite'
];

async function preCachePhotoModels(cache) {
  for (const asset of PHOTO_ASSETS) {
    try {
      const response = await fetch(url(asset), { cache: 'reload' });
      if (!response.ok) throw new Error(`Modelo HTTP ${response.status}`);
      await cache.put(url(asset), response);
    } catch (error) {
      console.warn('Arquivo de IA não pôde ser salvo offline:', asset, error);
    }
  }
}

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
    await preCachePhotoModels(cache);
    await self.skipWaiting();
  })());
});

self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.filter((key) => (key.startsWith('prateleira-de-livrinhos-') || key.startsWith('prateleira-magica-')) && key !== CACHE_NAME).map((key) => caches.delete(key)));
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
  // Priorize código atualizado com rede e recupere do cache offline.
  // Cache-first em CSS/JS pode deixar instalada uma interface antiga mesmo após novos deploys.
  const relativePath = requestUrl.pathname.slice(APP_ROOT.pathname.length);
  const appCode = /\.(?:css|js|json)$/.test(relativePath);
  const photoAsset = relativePath.startsWith('assets/vendor/mediapipe/');
  event.respondWith(photoAsset ? cacheFirst(event.request)
    : event.request.mode === 'navigate' || appCode
      ? networkFirst(event.request) : cacheFirst(event.request));
});
