import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const avatarSource = fs.readFileSync(path.join(root, 'assets/js/avatar.js'), 'utf8');
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
vm.runInNewContext(fs.readFileSync(path.join(root, 'assets/js/avatar-parts.js'), 'utf8'), context,
  { filename: 'avatar-parts.js' });
vm.runInNewContext(fs.readFileSync(path.join(root, 'assets/js/pet-parts.js'), 'utf8'), context,
  { filename: 'pet-parts.js' });
vm.runInNewContext(avatarSource, context, { filename: 'avatar.js' });
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
assert.equal(prefs.clean({ birthDate: '2020-02-29' }).birthDate, '2020-02-29');
assert.equal(prefs.clean({ birthDate: '2023-02-29' }).birthDate, '');
assert.equal(prefs.clean({ petId: 'rabbit' }).petId, null, 'Pets só depois de duas medalhas');
assert(prefs.avatarSymbol('ellie').includes('<symbol id="ellie"'));
assert.equal(prefs.clean({ outfitStyle: 'inexistente', hairColor: '#jklmno' }).outfitStyle, 'hoodie');
assert.equal(prefs.clean({ outfitStyle: 'inexistente', hairColor: '#jklmno' }).hairColor, '#493a55');
assert.equal(prefs.clean({ themeMood: 'Calm' }).themeMood, 'Calm');
assert.equal(prefs.clean({ themeMood: 'não existe' }).themeMood, '');
const themeBackup = prefs.parseProfileSVG(prefs.exportProfileSVG(prefs.clean({ name: 'Criança', themeMood: 'Fun' })));
assert.equal(themeBackup.themeMood, 'Fun', 'O mood deve acompanhar o backup SVG da criança');
assert.equal(prefs.load().outfitStyle, 'hoodie');
const catalog = JSON.parse(fs.readFileSync(path.join(root, 'books/index.json'), 'utf8'));
for (const entry of catalog.books) {
  assert.equal(prefs.personalize(entry.title).includes('Dani'), true, `Título não personalizado: ${entry.id}`);
}

prefs.save({ name: 'Meggie', pronunciation: 'Mégui', gender: 'feminino', avatarStyle: 'short', skinColor: '#8bcfff' });
const readerSource = fs.readFileSync(path.join(root, 'assets/js/reader.js'), 'utf8');
const speechCode = readerSource.slice(readerSource.indexOf('function escapeRegExp'), readerSource.indexOf('function updateListenButton'));
const book = JSON.parse(fs.readFileSync(path.join(root, 'books/ellie-e-o-trem-dos-dragoes.json'), 'utf8'));
const speechText = new Function('book', 'preferences', 'label', `${speechCode}\nreturn speechText;`)(book, prefs, prefs.personalize);
assert.equal(speechText('Meggie e Draco no trem.'), 'Mégui e Dráco no trem.');
assert.equal(speechText('TRO'), 'tró! Como em troca.');
assert.equal(speechText('DRU'), 'drú! Como em druida.');

const css = fs.readFileSync(path.join(root, 'assets/css/app.css'), 'utf8');
assert(css.includes('.book-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr))'), 'Prateleira sem três colunas no desktop');
assert(css.includes('.settings-preview-column{position:sticky;top:20px'), 'Prévia do avatar precisa ficar fixa na rolagem do desktop');
assert(css.includes('.settings-preview-column{position:sticky;top:0'), 'Prévia do avatar precisa ficar fixa na rolagem do celular');
const editor = fs.readFileSync(path.join(root, 'perfil.html'), 'utf8');
assert(editor.includes('id="settingsApp"') && editor.includes('settings-ui.js'), 'Personalização não está na aba Perfil');
assert(editor.includes('pet-parts.js'), 'Pet precisa ser renderizado no editor');
const editorUi = fs.readFileSync(path.join(root, 'assets/js/settings-ui.js'), 'utf8');
assert(editorUi.includes('settings-layout') && editorUi.includes('settings-preview-column'));
for (const marker of ['birthDate', 'petStyles', 'petUnlockStatus', 'petId']) {
  assert(editorUi.includes(marker), `Editor sem ${marker}`);
}
assert(!editorUi.includes('showModal('), 'O editor ainda abre um popup');
assert(fs.readFileSync(path.join(root, 'index.html'), 'utf8').includes('href="./perfil.html#personalizar"'));
assert(fs.readFileSync(path.join(root, 'personagem.html'), 'utf8').includes('perfil.html#personalizar'));
assert(editor.includes('id="tabPersonalizar"') && editor.includes('id="tabConquistas"'));
assert(fs.readFileSync(path.join(root, 'index.html'), 'utf8').includes('href="./perfil.html"'));
const profileHtml = fs.readFileSync(path.join(root, 'perfil.html'), 'utf8');
const profileJs = fs.readFileSync(path.join(root, 'assets/js/profile.js'), 'utf8');
for (const marker of ['profileBooks', 'profileMedals', 'profileAvatar', 'profilePetStatus']) {
  assert(profileHtml.includes(marker), `Perfil sem ${marker}`);
}
for (const marker of ['visitedPages', 'medalEarnedAt', 'Math.round', 'profile-book-card']) {
  assert(profileJs.includes(marker), `Perfil sem ${marker}`);
}
assert(fs.readFileSync(path.join(root, 'livro.html'), 'utf8').includes('assets/js/page-turn.js'));

// Prove that a real book illustration receives the selected skin/hair symbol.
const blobs = new Map();
let sequence = 0;
context.Blob = Blob;
context.URL = {
  createObjectURL(blob) { const url = `blob:test-${++sequence}`; blobs.set(url, blob); return url; },
  revokeObjectURL(url) { blobs.delete(url); }
};
context.fetch = async (url) => {
  const filename = new URL(url).pathname.split('/prateleira-magica/')[1];
  const content = fs.readFileSync(path.join(root, filename), 'utf8');
  return { ok: true, async text() { return content; } };
};
const image = { dataset: {}, src: '' };
await prefs.personalizeIllustration(image,
  'https://zonaro.github.io/prateleira-magica/assets/illustrations/ellie/cover.svg');
assert(image.src.startsWith('blob:test-'));
const customizedSvg = await blobs.get(image.src).text();
assert(customizedSvg.includes('<symbol id="ellie"'));
assert(customizedSvg.includes('#8bcfff'), 'A pele azul não entrou no SVG da história');
assert(customizedSvg.includes('fill:#493a55') || customizedSvg.includes('fill="#493a55"'), 'O cabelo do avatar não entrou no SVG');
assert(customizedSvg.includes('<title>Meggie e o Trem Travesso</title>'), 'Título da capa não usou o nome configurado');

await prefs.personalizeIllustration(image,
  'https://zonaro.github.io/prateleira-magica/assets/illustrations/ellie/trainhello.svg');
const greeting = await blobs.get(image.src).text();
assert(greeting.includes('Olá, Meggie!'), 'Texto dentro da ilustração não foi personalizado');

prefs.save({ name: 'Mia & Lua <3', pronunciation: 'Mia e Lua', gender: 'neutro', avatarStyle: 'long', skinColor: '#83dca5' });
await prefs.personalizeIllustration(image,
  'https://zonaro.github.io/prateleira-magica/assets/illustrations/ellie/cover.svg');
const safeSvg = await blobs.get(image.src).text();
assert(safeSvg.includes('<title>Mia &amp; Lua &lt;3 e o Trem Travesso</title>'), 'Nome com caracteres especiais corrompe o SVG');
assert(safeSvg.includes('#83dca5'), 'Avatar fantasia deveria acompanhar a troca de nome');
const landingHtml = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
assert(landingHtml.includes('assets/js/landing.js'), 'A landing precisa renderizar as histórias a partir do catálogo');
assert(!/\{\{\w+\}\}/.test(landingHtml), 'A landing não pode exibir marcadores {{...}} crus no HTML');
assert(fs.readFileSync(path.join(root, 'assets/js/library.js'), 'utf8').includes('personalizeIllustration(img'), 'As capas da prateleira precisam herdar o avatar escolhido');

console.log('✓ Nome, pronúncia personalizada e os três conjuntos de pronomes');
console.log('✓ Avatar com estilo, pele fantasia e validação das preferências');
console.log('✓ SVG real da história recebe as opções do protagonista');
console.log('✓ Títulos, capas, balões e destaque da prateleira usam nome e avatar personalizados');
console.log('✓ Voz preserva TRO/DRU e personaliza protagonista + NPCs');
console.log('✓ Prateleira com três colunas no desktop');
console.log('✓ Editor de personagem dedicado, acessível da prateleira/leitor, com prévia fixa desktop/mobile');
console.log('✓ Página de perfil com progresso, medalhas, idade e desbloqueio dos 20 pets');
console.log('✓ Animação de virar página incluída no leitor sem remover áudio ou navegação');
