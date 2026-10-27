import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = (file) => fs.readFileSync(path.join(root, file), 'utf8');
const catalog = JSON.parse(read('books/index.json'));
const window = {};
const values = new Map();
const context = {
  window,
  document: { dispatchEvent() {} },
  CustomEvent: class { constructor(name, props) { this.name = name; this.detail = props.detail; } },
  localStorage: {
    getItem(key) { return values.get(key) || null; },
    setItem(key, value) { values.set(key, value); }
  }
};
for (const file of ['avatar-parts', 'avatar-presets', 'pet-parts', 'avatar', 'preferences']) {
  vm.runInNewContext(read(`assets/js/${file}.js`), context, { filename: file });
}
const avatar = window.LivrinhoAvatar;
const prefs = window.LivrinhoPreferences;
const targets = {
  'a-orquestra-dos-sons': ['headphones', 'speaker'],
  'a-festa-das-notas': ['mini_keyboard', 'guitar', 'flute'],
  'o-jardim-dos-sentimentos': ['heart_plush'],
  'o-escudo-das-vacinas': ['medical_kit', 'doctor_coat'],
  'o-corpo-em-movimento': ['dumbbells', 'water_bottle']
};
assert.equal(catalog.books.length, 9, 'Quatro livros originais e cinco livros educativos');
const allRewards = Object.values(targets).flat();
assert.equal(allRewards.length, 10, 'Dez recompensas no total');
assert.equal(new Set(allRewards).size, allRewards.length);
for (const bookEntry of catalog.books) {
  assert(bookEntry.subject && /^[^·]+ · .+$/.test(bookEntry.subject), `Assunto ausente: ${bookEntry.id}`);
  assert(Array.isArray(bookEntry.ageRange) && bookEntry.ageRange.length === 2
    && bookEntry.ageRange[0] >= 3 && bookEntry.ageRange[1] <= 9,
  `Faixa etária inválida: ${bookEntry.id}`);
}
for (const [bookId, rewards] of Object.entries(targets)) {
  const book = JSON.parse(read(`books/${bookId}.json`));
  assert.equal(book.id, bookId);
  assert.equal(book.rewards.length, rewards.length);
  assert.deepEqual(book.rewards.map(({ id }) => id), rewards);
  assert(book.exercises.length >= 5);
  assert(book.pages.at(-2).type === 'challenge');
  assert(book.pages.at(-1).type === 'finish');
  for (const id of rewards) {
    assert.equal(avatar.rewardBooks[id], bookId, `Recompensa ${id} ligada ao livro errado`);
    const base = { achievements: { books: {} } };
    assert.equal(avatar.rewardUnlocked(base, id), false, `Recompensa ${id} liberada antes da leitura`);
    const partial = { ...base, achievements: { books: { [bookId]: { medalEarnedAt: '2026-10-27T10:00:00.000Z' } } } };
    assert.equal(avatar.rewardUnlocked(partial, id), false, 'Não basta receber a medalha: é preciso visitar a página final');
    const complete = { ...base, achievements: { books: { [bookId]: {
      finished: true, medalEarnedAt: '2026-10-27T10:00:00.000Z'
    } } } };
    assert.equal(avatar.rewardUnlocked(complete, id), true);
    const equipped = id === 'heart_plush' ? { petId: id }
      : id === 'doctor_coat' ? { outfitStyle: id }
        : id === 'headphones' ? { accessories: [id] } : { toys: [id] };
    const field = id === 'heart_plush' ? 'petId' : id === 'doctor_coat' ? 'outfitStyle'
      : id === 'headphones' ? 'accessories' : 'toys';
    const contains = (state) => Array.isArray(state[field]) ? state[field].includes(id) : state[field] === id;
    assert(!contains(prefs.clean({ ...equipped, ...partial })), `Recompensa ${id} vazou antes do fim`);
    assert(contains(prefs.clean({ ...equipped, ...complete })), `Recompensa ${id} não liberada no perfil`);
  }
}
assert(avatar.avatarSVG({ petId: 'heart_plush' }).includes('repeatCount="indefinite"'),
  'Pelúcia deve trocar de cor automaticamente');
assert(avatar.avatarSVG({ toys: ['water_bottle'], waterColor: '#dba8ff' }).includes('fill="#dba8ff"'),
  'Água da garrafinha precisa de cor independente');
assert(!prefs.clean({ waterColor: 'invalid' }).waterColor.includes('invalid'), 'Cor inválida recusada');
const winner = { finished: true, medalEarnedAt: '2026-10-27T10:00:00.000Z' };
const state = prefs.clean({ petId: 'heart_plush', toys: ['water_bottle'], waterColor: '#abcf86',
  achievements: { books: { 'o-jardim-dos-sentimentos': winner, 'o-corpo-em-movimento': winner } } });
const restored = prefs.parseProfileSVG(prefs.exportProfileSVG(state));
assert.equal(restored.petId, 'heart_plush');
assert.deepEqual([...restored.toys], ['water_bottle']);
assert.equal(restored.waterColor, '#abcf86');
const bibliography = ['o-escudo-das-vacinas', 'o-corpo-em-movimento'];
for (const id of bibliography) {
  const book = JSON.parse(read(`books/${id}.json`));
  const references = book.pages.filter(({ bibliography }) => Array.isArray(bibliography));
  assert.equal(references.length, 1, `Página de bibliografia obrigatória: ${id}`);
  assert(references[0].bibliography.length >= 3);
  assert(references[0].bibliography.every(({ title, url }) => title && url && !url.includes('<a')));
}
const keyboardSource = read('assets/js/music-keyboard.js');
vm.runInNewContext(keyboardSource, context);
assert.deepEqual(Array.from(window.LivrinhoMusicKeyboard.notes, (note) => note[1]),
  ['C', 'D', 'E', 'F', 'G', 'A', 'B', 'C']);
assert(JSON.parse(read('books/a-festa-das-notas.json')).pages.some((page) => page.interactive === 'music-keyboard'));
const reader = read('assets/js/reader.js');
assert(reader.includes("url.textContent = entry.url"), 'Endereços devem ser texto puro sem âncoras');
console.log('✓ Cinco livros e dez recompensas, medalha + conclusão, bloqueio persistente e backup SVG');
console.log('✓ Coração colorido, água personalizável, cifras C D E F G A B C e fontes não clicáveis');
