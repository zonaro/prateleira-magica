import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const data = (name) => JSON.parse(fs.readFileSync(path.join(root, 'books', name + '.json'), 'utf8'));
const catalog = data('index');
const abc = data('a-aventura-do-abc');
assert.equal(abc.pages.length, 29, 'ABC precisa de capa, 26 letras, desafio e final');
assert.equal(abc.pages.slice(1, 27).map((page) => page.sticker.split(' ')[0]).join(''), 'ABCDEFGHIJKLMNOPQRSTUVWXYZ');
assert(abc.pages.every((page, i) => fs.existsSync(path.join(root, page.illustration)), 'Cenas da cartilha precisam existir'));
assert(abc.pages[26].blocks.some((item) => item.text.includes('Zebra') || item.text.includes('zebra')));
assert.equal(abc.pages.at(-2).type, 'challenge');
assert.equal(abc.rewards[0].id, 'abc_blocks');

const nh = data('a-trilha-do-nha-nhe-nhi-nho-nhu');
assert.deepEqual(nh.exercises.map((item) => item.syllable), ['NHA','NHE','NHI','NHO','NHU']);
for (const token of ['aranha', 'conhecer', 'companhia', 'ninho', 'nenhuma']) {
  assert(JSON.stringify(nh.pages).toLocaleLowerCase('pt-BR').includes(token), `O livro do NH precisa do exemplo ${token}`);
}
assert.equal(nh.pages.at(-1).type, 'finish');

const diversity = data('o-jardim-das-diferencas');
const text = diversity.pages.flatMap((p) => p.blocks.map((b) => b.text)).join(' ').toLocaleLowerCase('pt-BR');
for (const name of ['branca','preta','parda','amarela','indígena','vermelha','áfrica','ásia','dna','racismo']) {
  assert(text.includes(name), `Diversidade precisa contextualizar ${name}`);
}
assert(text.includes('não é uma categoria oficial'), '"Vermelha" não pode ser apresentada como categoria do Censo');
assert(text.includes('não precisamos dizer que é o país mais misturado'), 'Não afirmar ranking de miscigenação sem fonte');
assert(!text.includes('raças biológicas'), 'Evitar categorias raciais como tipos biológicos');
assert.equal(diversity.rewards[0].id, 'dna_helix');
assert(diversity.pages.some((page) => page.interactive === 'bibliography' && page.bibliography.length >= 2));

for (const entry of catalog.books) {
  const book = data(entry.id);
  const scenes = new Set(book.pages.map(({illustration}) => illustration));
  assert.equal(scenes.size, book.pages.length, `${book.id} repete arte em páginas diferentes`);
  for (const scene of scenes) {
    const raw = fs.readFileSync(path.join(root,scene),'utf8');
    assert(raw.includes('<svg') && raw.includes('</svg>'), `SVG inválido: ${scene}`);
  }
}
assert.equal(catalog.books.length, 16);
assert.equal(catalog.books.filter((entry) => entry.id.startsWith('a-') || entry.id.startsWith('o-')).length >= 11, true);
console.log('✓ ABC completo (26 letras), cinco sons do NH e diversidade com referências do IBGE');
console.log('✓ 16 livros com cenas visuais distintas em cada página, sem repetição de ilustrações');
