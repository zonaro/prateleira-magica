import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = (filename) => fs.readFileSync(path.join(root, filename), 'utf8');
const photoSource = read('assets/js/avatar-photo.js');
const tabsSource = read('assets/js/profile-tabs.js');
const wait = () => new Promise((resolve) => setImmediate(resolve));

function createPhotoApp({ cached = [], missing = [], offline = false } = {}) {
  const seen = [];
  const window = { LivrinhoAvatarPhotoColors: {} };
  const context = {
    window, document: { baseURI: 'https://zonaro.github.io/prateleira-magica/' },
    URL, caches: { async match(url) { return cached.some((ending) => url.endsWith(ending)) ? { ok: true } : null; } },
    async fetch(url, options) {
      seen.push({ url, method: options.method });
      if (offline) throw Error('offline');
      return { ok: !missing.some((ending) => url.endsWith(ending)) };
    }
  };
  vm.runInNewContext(photoSource, context, { filename: 'avatar-photo.js' });
  assert.equal(typeof window.LivrinhoAvatarPhoto.checkAvailability, 'function');
  return { app: window.LivrinhoAvatarPhoto, seen };
}
const allAssets = [
  'vision_bundle.mjs',
  'wasm/vision_wasm_internal.js',
  'wasm/vision_wasm_internal.wasm',
  'wasm/vision_wasm_nosimd_internal.js',
  'wasm/vision_wasm_nosimd_internal.wasm',
  'models/face_landmarker.task',
  'models/selfie_multiclass_256x256.tflite'
];
{
  const { app, seen } = createPhotoApp();
  assert.equal(await app.checkAvailability(), true, 'TODOS os modelos hospedados devem habilitar aba');
  assert.equal(seen.length, allAssets.length, 'Checar todos os 7 recursos sem baixar seus corpos');
  assert(seen.every((req) => req.method === 'HEAD'), 'Disponibilidade deve usar HEAD');
}
{
  const { app } = createPhotoApp({ missing: ['models/face_landmarker.task'] });
  assert.equal(await app.checkAvailability(), false, 'Ausência do FaceLandmarker deve esconder aba');
}
{
  const { app } = createPhotoApp({ missing: ['models/selfie_multiclass_256x256.tflite'] });
  assert.equal(await app.checkAvailability(), false, 'Ausência do segmentador deve esconder aba');
}
{
  const { app } = createPhotoApp({ missing: ['wasm/vision_wasm_internal.wasm'] });
  assert.equal(await app.checkAvailability(), false, 'WASM ausente impede a análise');
}
{
  const { app } = createPhotoApp({ offline: true });
  assert.equal(await app.checkAvailability(), false, 'Sem rede nem cache a aba fica escondida');
}
{
  const { app, seen } = createPhotoApp({ cached: allAssets, offline: true });
  assert.equal(await app.checkAvailability(), true, 'Com cache PWA completo a aba funciona offline');
  assert.equal(seen.length, 0, 'Com tudo em cache não solicitar downloads em rede');
}
{
  const cached = ['models/face_landmarker.task'];
  const { app } = createPhotoApp({ cached, offline: true });
  assert.equal(await app.checkAvailability(), false, 'Cache incompleto não deve habilitar aba');
}

function fakeElement() {
  const attributes = new Map();
  const classes = new Set();
  return { hidden: false, tabIndex: 0, attributes, classes,
    classList: { toggle(name, enabled) { if (enabled) classes.add(name); else classes.delete(name); } },
    setAttribute(name, value) { attributes.set(name, value); }
  };
}
function createTabs({ available, hash = '' }) {
  const ids = ['tabConquistas', 'profileOverview', 'tabPresets', 'profilePresets',
    'tabPersonalizar', 'profileEditor', 'tabFoto', 'profilePhoto', 'tabPais', 'profileParents'];
  const elements = Object.fromEntries(ids.map((id) => [id, fakeElement()]));
  elements.tabFoto.hidden = true;
  elements.profilePhoto.hidden = true;
  const events = {};
  const window = { addEventListener(name, fn) { (events[name] ||= []).push(fn); },
    scrollTo() {}, LivrinhoAvatarPhoto: { async checkAvailability() { return available; } } };
  const navigator = { serviceWorker: { addEventListener(name, fn) { (events[name] ||= []).push(fn); } } };
  const location = { hash, replace(next) { this.hash = next; (events.hashchange || []).forEach((fn) => fn()); } };
  vm.runInNewContext(tabsSource, {
    document: { getElementById(id) { return elements[id]; } }, window, navigator, location, Boolean
  }, { filename: 'profile-tabs.js' });
  return { elements, events, location };
}
{
  const { elements, location } = createTabs({ available: false, hash: '#foto' });
  await wait();
  assert.equal(elements.tabFoto.hidden, true);
  assert.equal(location.hash, '#personalizar', 'Link direto indisponível volta para editor');
  assert.equal(elements.profileEditor.hidden, false);
}
{
  const { elements, location, events } = createTabs({ available: true, hash: '#foto' });
  await wait();
  assert.equal(elements.tabFoto.hidden, false);
  assert.equal(elements.profilePhoto.hidden, false);
  assert.equal(elements.profileEditor.hidden, true);
  (events['livrinhos:avatar-photo-unavailable'] || []).forEach((fn) => fn());
  assert.equal(elements.tabFoto.hidden, true, 'Desabilitar imediatamente quando o modelo falhar');
  assert.equal(location.hash, '#personalizar', 'Ao falhar, voltar para editor');
}
{
  const { elements } = createTabs({ available: false, hash: '#predefinidos' });
  await wait();
  assert.equal(elements.profilePresets.hidden, false, 'Personagens prontos continuam funcionando');
  assert.equal(elements.tabFoto.hidden, true);
}
console.log('✓ Aba escondida sem modelos; aparece com todos os 7 assets ou cache offline completo');
console.log('✓ Navegação segura em #foto, fallback ao editor e interrupção em falha de modelo');
