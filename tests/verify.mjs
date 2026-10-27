import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { Script } from 'node:vm';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = (file) => fs.readFileSync(path.join(root, file), 'utf8');
const json = (file) => JSON.parse(read(file));
const exists = (file) => fs.existsSync(path.join(root, file));
const reference = (file) => {
  assert.equal(typeof file, 'string');
  assert(file && !file.startsWith('/') && !file.includes('..') && !/^https?:/i.test(file), `Caminho inseguro: ${file}`);
  assert(exists(file), `Arquivo não encontrado: ${file}`);
};

const required = [
  'index.html', 'livro.html', 'personagem.html', 'perfil.html', 'manifest.webmanifest', 'sw.js',
  'assets/css/app.css', 'assets/js/library.js', 'assets/js/reader.js', 'assets/js/avatar-parts.js', 'assets/js/avatar-presets.js', 'assets/js/avatar.js',
  'assets/data/avatar-presets.json',
  'assets/js/preferences.js', 'assets/js/settings-ui.js', 'assets/js/profile.js', 'assets/js/page-turn.js',
  'assets/js/colors.js', 'assets/js/color-explorer.js', 'assets/vendor/NameToColor.js', 'assets/vendor/NameToColor.ptBR.js',
  'assets/js/pet-parts.js', 'assets/pets/catalog.json',
  'assets/js/pwa.js', 'books/index.json', 'assets/icons/icon.svg'
];
required.forEach(reference);

for (const scriptFile of ['assets/js/avatar.js', 'assets/js/library.js', 'assets/js/reader.js', 'assets/js/preferences.js',
  'assets/js/settings-ui.js', 'assets/js/profile.js', 'assets/js/page-turn.js', 'assets/js/colors.js',
  'assets/js/color-explorer.js', 'assets/js/avatar-presets.js', 'assets/js/pet-parts.js', 'assets/js/pwa.js', 'sw.js']) {
  new Script(read(scriptFile), { filename: scriptFile });
}

const pwa = json('manifest.webmanifest');
assert.equal(pwa.display, 'standalone');
for (const icon of pwa.icons) reference(icon.src.replace(/^\.\//, ''));

const index = json('books/index.json');
assert.equal(index.schemaVersion, 1);
assert(Array.isArray(index.books) && index.books.length > 0, 'A prateleira precisa de livros');
const ids = new Set();
let pages = 0;
let illustrations = 0;
for (const entry of index.books) {
  assert(!ids.has(entry.id), `ID duplicado: ${entry.id}`);
  ids.add(entry.id);
  assert(entry.title.includes('{{nome}}'), `Título no catálogo não herda o protagonista: ${entry.id}`);
  reference(entry.data);
  reference(entry.cover);
  const book = json(entry.data);
  assert.equal(book.schemaVersion, 1);
  assert.equal(book.id, entry.id);
  assert(book.language && book.title && Array.isArray(book.pages) && book.pages.length, `Livro inválido: ${entry.id}`);
  assert(book.title.includes('{{nome}}'), `Livro não herda o nome da criança: ${entry.id}`);
  assert(!/\b(?:Ellie|ELLIE)\b/.test(JSON.stringify(book)), `Nome fixo da protagonista encontrado em ${entry.id}`);
  const coverSvg = read(entry.cover);
  assert(/<use href="#(ellie|kid|protagonist)"/.test(coverSvg), `A capa de ${entry.id} não exibe um avatar personalizável`);
  assert(coverSvg.includes('{{nome}}'), `A capa de ${entry.id} não recebe o nome personalizado`);
  for (const page of book.pages) {
    assert(page.title && typeof page.title === 'string');
    assert(['cover', 'story', 'challenge', 'finish'].includes(page.type), `Tipo desconhecido: ${page.type}`);
    assert(Array.isArray(page.blocks), `Blocos ausentes: ${page.title}`);
    for (const block of page.blocks) {
      assert(['paragraph', 'dialogue'].includes(block.kind));
      assert.equal(typeof block.text, 'string');
      assert.equal((block.text.match(/\[\[/g) || []).length, (block.text.match(/\]\]/g) || []).length);
      for (const token of block.text.matchAll(/\{\{([^}]+)\}\}/g)) {
        assert(['nome', 'idade', 'pronome', 'Pronome', 'possessivo', 'Possessivo'].includes(token[1]), `Marcador desconhecido: ${token[1]}`);
      }
    }
    reference(page.illustration);
    const svg = read(page.illustration);
    assert(svg.includes('<svg') && svg.includes('</svg>'), `SVG inválido: ${page.illustration}`);
    assert(!/\b(?:Ellie|ELLIE)\b/.test(svg), `Ilustração com nome fixo: ${page.illustration}`);
    pages++;
    illustrations++;
  }
  if (book.pages.some((page) => page.type === 'challenge')) {
    assert(Array.isArray(book.exercises) && book.exercises.length, `Exercícios ausentes: ${entry.id}`);
    const indexChallenge = book.pages.findIndex((page) => page.type === 'challenge');
    const indexFinish = book.pages.findIndex((page) => page.type === 'finish');
    assert(indexFinish > indexChallenge, `O desafio de ${entry.id} precisa ocorrer antes da medalha final`);
  }
  console.log(`✓ ${book.title}: ${book.pages.length} páginas`);
}

// Every file referenced by the offline precache and HTML must exist.
for (const file of ['index.html', 'livro.html', 'personagem.html', 'perfil.html']) {
  for (const match of read(file).matchAll(/(?:src|href)="(\.\/[^"?#]+)"/g)) reference(match[1].slice(2));
}
const petCatalog = json('assets/pets/catalog.json');
assert.equal(petCatalog.pets.length, 20, 'Coleção completa de Cute Animal Vectors não foi incorporada');
for (const pet of petCatalog.pets) {
  assert.equal(pet.license, 'CC0');
  assert(pet.source.startsWith('https://www.svgrepo.com/svg/'));
  reference(pet.file);
  assert(read(pet.file).includes('<svg') && read(pet.file).includes('</svg>'), `Pet SVG inválido: ${pet.file}`);
}
const offline = read('sw.js');
const pagesWorkflow = read('.github/workflows/pages.yml');
assert(pagesWorkflow.includes('cp -R assets/css assets/js assets/data'),
  'O deploy deve publicar assets/data para mostrar personagens prontos');
for (const item of offline.matchAll(/'\.\/([^']+)'/g)) {
  const pathname = item[1];
  if (pathname && !pathname.includes('${')) reference(pathname);
}

assert.equal(ids.size, index.books.length);
console.log(`✓ ${ids.size} livro(s), ${pages} páginas, ${illustrations} referências de ilustrações`);
console.log('✓ Desafios antes da medalha em todos os livros e catálogo completo de 20 pets originais CC0');
console.log('✓ JSON, scripts, links internos e arquivos PWA válidos');
