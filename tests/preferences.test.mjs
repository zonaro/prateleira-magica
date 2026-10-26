import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const source = fs.readFileSync(path.join(root, 'assets/js/preferences.js'), 'utf8');
const storage = new Map();
const window = {};
const context = {
  window,
  localStorage: {
    getItem(key) { return storage.get(key) || null; },
    setItem(key, value) { storage.set(key, value); }
  },
  document: { dispatchEvent() {} },
  CustomEvent: class { constructor(type, options) { this.type = type; this.detail = options.detail; } }
};
vm.runInNewContext(source, context, { filename: 'preferences.js' });
const prefs = window.LivrinhoPreferences;
assert(prefs);
assert.equal(prefs.load().name, 'Ellie');

for (const [gender, pronome, possessivo] of [
  ['masculino', 'ele', 'dele'],
  ['feminino', 'ela', 'dela'],
  ['neutro', 'elu', 'delu']
]) {
  prefs.save({ name: 'Dani', pronunciation: 'Dâni', gender, avatarStyle: 'curly', skinColor: '#83dca5' });
  assert.equal(prefs.personalize('{{nome}} disse que {{pronome}} trouxe a mochila {{possessivo}}.'),
    `Dani disse que ${pronome} trouxe a mochila ${possessivo}.`);
  assert.equal(prefs.personalize('Ellie é a estrela. {{Pronome}} sorriu.'),
    `Dani é a estrela. ${pronome[0].toUpperCase() + pronome.slice(1)} sorriu.`);
  assert(prefs.avatarSVG().includes('#83dca5'));
}

assert.equal(prefs.clean({ name: '', gender: 'desconhecido', skinColor: '#jklmno' }).gender, 'feminino');
assert.equal(prefs.clean({ name: '', skinColor: '#jklmno' }).skinColor, '#e9aa83');
assert(prefs.avatarSymbol('ellie').includes('<symbol id="ellie"'));

prefs.save({ name: 'Meggie', pronunciation: 'Mégui', gender: 'feminino', avatarStyle: 'short', skinColor: '#8bcfff' });
const readerSource = fs.readFileSync(path.join(root, 'assets/js/reader.js'), 'utf8');
const speechCode = readerSource.slice(readerSource.indexOf('function escapeRegExp'), readerSource.indexOf('function speak'));
const book = JSON.parse(fs.readFileSync(path.join(root, 'books/ellie-e-o-trem-dos-dragoes.json'), 'utf8'));
const speechText = new Function('book', 'preferences', 'label', `${speechCode}\nreturn speechText;`)(book, prefs, prefs.personalize);
assert.equal(speechText('Meggie e Draco no trem.'), 'Mégui e Dráco no trem.');
assert.equal(speechText('TRO'), 'tró! Como em troca.');
assert.equal(speechText('DRU'), 'drú! Como em druida.');

const css = fs.readFileSync(path.join(root, 'assets/css/app.css'), 'utf8');
assert(css.includes('.book-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr))'), 'Prateleira sem três colunas no desktop');

// Prove that a real book illustration receives the selected skin/hair symbol.
const blobs = new Map();
let sequence = 0;
context.Blob = Blob;
context.URL = {
  createObjectURL(blob) { const url = `blob:test-${++sequence}`; blobs.set(url, blob); return url; },
  revokeObjectURL(url) { blobs.delete(url); }
};
context.fetch = async (url) => {
  const filename = new URL(url).pathname.split('/livrinho-infantil-treino/')[1];
  const content = fs.readFileSync(path.join(root, filename), 'utf8');
  return { ok: true, async text() { return content; } };
};
const image = { dataset: {}, src: '' };
await prefs.personalizeIllustration(image,
  'https://zonaro.github.io/livrinho-infantil-treino/assets/illustrations/ellie/cover.svg');
assert(image.src.startsWith('blob:test-'));
const customizedSvg = await blobs.get(image.src).text();
assert(customizedSvg.includes('<symbol id="ellie"'));
assert(customizedSvg.includes('#8bcfff'), 'A pele azul não entrou no SVG da história');
assert(customizedSvg.includes('fill="#493a55"'), 'O cabelo do avatar não entrou no SVG');

console.log('✓ Nome, pronúncia personalizada e os três conjuntos de pronomes');
console.log('✓ Avatar com estilo, pele fantasia e validação das preferências');
console.log('✓ SVG real da história recebe as opções do protagonista');
console.log('✓ Voz preserva TRO/DRU e personaliza protagonista + NPCs');
console.log('✓ Prateleira com três colunas no desktop');
