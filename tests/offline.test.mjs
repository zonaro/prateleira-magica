import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import vm from 'node:vm';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const scope = 'https://zonaro.github.io/prateleira-magica/';
const listeners = {};
const stores = new Map();
let online = true;

function key(request, ignoreSearch = false) {
  const address = new URL(typeof request === 'string' ? request : request.url);
  if (ignoreSearch) address.search = '';
  return address.href;
}
const caches = {
  async open(name) {
    if (!stores.has(name)) stores.set(name, new Map());
    const store = stores.get(name);
    return {
      async addAll(urls) {
        for (const url of urls) {
          const result = await localFetch(url);
          if (!result.ok) throw Error(`Pré-cache falhou em ${url}`);
          store.set(key(url), result.clone());
        }
      },
      async put(url, response) { store.set(key(url), response.clone()); },
      async match(request, options = {}) {
        const target = key(request, options.ignoreSearch);
        for (const [url, response] of store) {
          if (key(url, options.ignoreSearch) === target) return response.clone();
        }
        return undefined;
      }
    };
  },
  async keys() { return [...stores.keys()]; },
  async delete(name) { return stores.delete(name); }
};

async function localFetch(request) {
  if (!online) throw Error('Sem internet');
  const address = new URL(typeof request === 'string' ? request : request.url);
  assert(address.href.startsWith(scope), `URL fora do escopo: ${address.href}`);
  const relative = decodeURIComponent(address.pathname.slice(new URL(scope).pathname.length)) || 'index.html';
  const pathname = path.join(root, relative);
  if (!fs.existsSync(pathname)) return new Response('Não encontrado', { status: 404 });
  return new Response(fs.readFileSync(pathname), { status: 200 });
}

const self = {
  registration: { scope },
  clients: { async claim() {} },
  async skipWaiting() {},
  addEventListener(name, callback) { listeners[name] = callback; }
};
const source = fs.readFileSync(path.join(root, 'sw.js'), 'utf8');
vm.runInNewContext(source, { self, caches, fetch: localFetch, URL, Response, console, Promise }, { filename: 'sw.js' });

let pending;
listeners.install({ waitUntil(promise) { pending = promise; } });
await pending;
const cache = await caches.open('prateleira-magica-v13');
assert(await cache.match(`${scope}assets/js/avatar-parts.js`), 'Peças originais dos avatares não foram salvas offline');
assert(await cache.match(`${scope}assets/js/pet-parts.js`), 'Pets para ilustrações não foram salvos offline');
assert(await cache.match(`${scope}assets/js/avatar.js`), 'Renderização dos avatares não foi salva offline');
assert(await cache.match(`${scope}assets/js/speech.js`), 'Narração e teste de pronúncia não foram salvos offline');
assert(await cache.match(`${scope}assets/vendor/page-flip.browser.js`), 'Motor da virada de páginas deve funcionar offline');
assert(await cache.match(`${scope}assets/js/profile-tabs.js`), 'Abas do perfil não funcionam offline');
const petCatalog = JSON.parse(fs.readFileSync(path.join(root, 'assets/pets/catalog.json'), 'utf8'));
for (const pet of petCatalog.pets) {
  assert(await cache.match(`${scope}${pet.file}`), `Pet original não foi salvo offline: ${pet.id}`);
}
const catalog = JSON.parse(fs.readFileSync(path.join(root, 'books/index.json'), 'utf8'));
for (const entry of catalog.books) {
  const bookPath = `${scope}${entry.data}`;
  assert(await cache.match(bookPath), `Livro não foi salvo offline: ${entry.id}`);
  const book = JSON.parse(fs.readFileSync(path.join(root, entry.data), 'utf8'));
  for (const page of book.pages) {
    assert(await cache.match(`${scope}${page.illustration}`), `Ilustração não foi salva offline: ${page.illustration}`);
  }
}

listeners.activate({ waitUntil(promise) { pending = promise; } });
await pending;
online = false;

async function offlineRequest(pathname, mode) {
  const request = { url: new URL(pathname, scope).href, method: 'GET', mode };
  let responsePromise;
  listeners.fetch({ request, respondWith(promise) { responsePromise = promise; } });
  assert(responsePromise, 'O Service Worker não respondeu');
  return await responsePromise;
}

const shelf = await offlineRequest('index.html', 'navigate');
assert((await shelf.text()).includes('Prateleira Mágica'));
const reader = await offlineRequest('livro.html?livro=ellie-e-o-trem-travesso', 'navigate');
assert((await reader.text()).includes('readerApp'));
const editor = await offlineRequest('personagem.html', 'navigate');
assert((await editor.text()).includes('perfil.html#personalizar'), 'Link antigo não redireciona ao editor unificado offline');
const profile = await offlineRequest('perfil.html', 'navigate');
const profileContent = await profile.text();
assert(profileContent.includes('profileBooks') && profileContent.includes('settingsApp'), 'Perfil e editor unificados não funcionam offline');
for (const entry of catalog.books) {
  const data = await offlineRequest(entry.data, 'cors');
  const book = await data.json();
  assert.equal(book.id, entry.id);
  const illustration = await offlineRequest(book.cover, 'cors');
  assert((await illustration.text()).includes('<svg'));
}

console.log(`✓ Pré-cache de ${catalog.books.length} livros e todas as ilustrações`);
console.log(`✓ Pré-cache dos ${petCatalog.pets.length} SVGs originais da coleção de pets`);
console.log('✓ Prateleira, leitor, personagem, perfil, JSONs e SVGs acessíveis sem internet');
