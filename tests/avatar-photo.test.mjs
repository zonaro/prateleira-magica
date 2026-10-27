import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = (name) => fs.readFileSync(path.join(root, name), 'utf8');
const window = {};
vm.runInNewContext(read('assets/js/avatar-photo-colors.js'), { window });
const { rgbFromHex, hexFromRGB, nearestColor, trimmedColor } = window.LivrinhoAvatarPhotoColors;

assert.equal(hexFromRGB([233, 170, 131]), '#e9aa83');
assert.deepEqual(Array.from(rgbFromHex('#E9AA83')), [233, 170, 131]);
assert.equal(nearestColor('#edae87', [['#f5d4b3', 'clara'], ['#e9aa83', 'média']]), '#e9aa83');
assert.equal(nearestColor([194, 125, 65], ['#493a55', '#c47b43', '#f5c35b']), '#c47b43');
assert.equal(nearestColor('#4d2e2a', ['#f5d4b3', '#e9aa83', '#75472f', '#4a2c28']), '#4a2c28');
assert.equal(nearestColor('#ed815f', [['#ed805d', 'coral'], ['#fa7195', 'rosa']]), '#ed805d');
assert.equal(trimmedColor([[120, 100, 80], [121, 101, 81], [122, 102, 82], [255, 250, 248]], .25), '#7a6652');
assert.equal(trimmedColor([]), null);
assert.throws(() => nearestColor('#bad', ['#000000']), /HEX/);
assert.throws(() => nearestColor('#ffffff', []), /paleta/);
assert.throws(() => hexFromRGB([2, NaN, 5]), /RGB/);

const page = read('perfil.html');
const editor = read('assets/js/settings-ui.js');
const photo = read('assets/js/avatar-photo.js');
const sw = read('sw.js');
assert(page.indexOf('avatar-photo-colors.js') < page.indexOf('avatar-photo.js'));
assert(page.indexOf('avatar-photo.js') < page.indexOf('settings-ui.js'));
assert(editor.includes('avatarPhoto?.mount('), 'Montagem deve ocorrer no editor atual');
assert(editor.includes("edit('avatar-photo'"), 'Aplicar foto deve usar histórico e autosave');
assert(photo.includes('navigator.mediaDevices.getUserMedia('));
assert(photo.includes('getImageData('));
assert(photo.includes('result.close()'), 'Segmentador deve liberar máscaras');
assert(photo.includes('frame.width = frame.height = 0'), 'Canvas temporário deve ser limpo');
assert(photo.includes('stream.getTracks().forEach((track) => track.stop())'));
assert(photo.includes("const MP_ROOT = new URL('./assets/vendor/mediapipe/', document.baseURI).href"));
assert(!/https?:\\/\\//.test(photo), 'Não permitir URLs externas na página infantil');
assert(!photo.includes('localStorage.') && !photo.includes('sessionStorage.'),
  'Não guardar imagem nem dados intermediários em storage');
assert(!photo.includes('toDataURL(') && !photo.includes('fetch(file'),
  'Foto não pode ser serializada nem enviada');
assert(sw.includes("'./assets/js/avatar-photo-colors.js'"));
assert(sw.includes("'./assets/js/avatar-photo.js'"));
assert(sw.includes('preCachePhotoModels(cache)'), 'Pré-cache dos modelos obrigatório');
assert(sw.includes("relativePath.startsWith('assets/vendor/mediapipe/')"), 'O PWA deve servir modelos via cache-first');
const pageCsp = page.match(/Content-Security-Policy[^>]*content="([^"]+)"/);
assert(pageCsp && pageCsp[1].includes("connect-src 'self'"), 'CSP deve bloquear telemetria externa');
const manifest = JSON.parse(read('tools/mediapipe-dependencies.json'));
assert.equal(manifest.version, '0.10.21');
assert.equal(manifest.models.length, 2);


console.log('✓ Paletas, média aparada e conexão do criador por foto ao editor existente');
