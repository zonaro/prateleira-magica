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
assert.equal(catalog.books.length, 22);
assert.equal(catalog.books.filter((entry) => entry.id.startsWith('a-') || entry.id.startsWith('o-')).length >= 11, true);
const dental = data('o-clube-dos-dentinhos');
assert.equal(dental.rewards[0].id, 'toothbrush');
assert(dental.pages.some((p) => p.interactive === 'bibliography' && p.bibliography.length >= 3));
assert(dental.pages.flatMap((p) => p.blocks.map((b) => b.text)).join(' ').includes('flúor'));
const rapunzel = data('rapunzel-contos-dos-grimm');
assert.equal(rapunzel.protagonistMode, 'fixed');
assert.equal(rapunzel.rewards[0].id, 'rapunzel');
assert(rapunzel.pages.every((p) => !p.title.includes('{{nome}}')));
assert(rapunzel.pages.some((p) => p.interactive === 'bibliography'));
assert(rapunzel.pages.every((p) => !fs.readFileSync(path.join(root,p.illustration),'utf8').includes('<use href="#kid"')));
const pdfText = fs.readFileSync(path.join(root,'books/rapunzel-fonte.txt'),'utf8');
const sourceText = pdfText.slice(pdfText.indexOf('Era uma vez um casal'), pdfText.indexOf('Este texto é parte integrante')).replace(/\s+/g,' ').trim();
const transcription = rapunzel.pages.slice(0,-3).flatMap((p) => p.blocks.map((b)=>b.text)).join(' ').replace(/\s+/g,' ').trim();
assert.equal(transcription, sourceText, 'O texto adaptado do PDF deve estar completo e preservado');
const publicDomainClassics = ['o-rouxinol-e-o-imperador', 'a-roupa-nova-do-imperador',
  'as-fabulas-de-esopo', 'a-historia-de-pedro-coelho'];
for (const id of publicDomainClassics) {
  const story = data(id);
  const entry = catalog.books.find((item) => item.id === id);
  assert.equal(story.protagonistMode, 'fixed', `${id} deve ter protagonistas próprios`);
  assert.equal(entry.protagonistMode, 'fixed');
  assert(story.originalAuthors.length, 'O crédito ao autor original é obrigatório');
  assert(story.sourceDocument.startsWith('https://www.baixelivros.com.br/'), 'Fonte Baixe Livros ausente');
  assert(story.sourceNotice && /original|própri|reconto/i.test(story.sourceNotice), 'A origem do texto deve ser clara');
  assert(story.pages.length >= 12, 'Os contos devem ter cenas suficientes para leitura acompanhada');
  assert(story.pages.every(p => !JSON.stringify(p).includes('{{nome}}')), 'Nenhum conto usa avatar protagonista');
  assert(story.pages.some(p => p.interactive === 'bibliography'), 'Famílias devem encontrar referências');
  for (const page of story.pages) {
    const svg = fs.readFileSync(path.join(root,page.illustration),'utf8');
    assert(!svg.includes('<use href="#kid"'), 'Arte do conto não usa o avatar da criança');
    assert(svg.includes('data-character=') || svg.includes('data-scene=') || svg.includes('data-motif=') || svg.includes('<path'),
      'Cena ilustrada deve conter elementos desenhados');
  }
}
assert(data('a-historia-de-pedro-coelho').sourceNotice.includes('Gratuita, não Domínio Público'),
  'A tradução moderna de Pedro Coelho não pode ser confundida com a narrativa original');
assert(fs.readFileSync(path.join(root,'index.html'),'utf8').includes('Se um PDF é grátis, significa que posso copiá-lo?'),
  'FAQ deve explicar a diferença entre gratuito e domínio público');
console.log('✓ ABC completo (26 letras), cinco sons do NH e diversidade com referências do IBGE');
console.log('✓ Escovação e Rapunzel licenciada com transcrição integral, referências e desbloqueios');
console.log('✓ 22 livros, incluindo quatro clássicos recontados, com ilustração por página');
