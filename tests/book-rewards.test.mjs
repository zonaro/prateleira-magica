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
  'o-corpo-em-movimento': ['dumbbells', 'water_bottle'],
  'o-calendario-das-festas': ['new_year_crown', 'carnival_mask', 'carnival_tank', 'bunny_headband',
    'easter_eggs', 'june_hat', 'brazil_flag', 'wooden_top', 'saci_costume', 'witch_hat', 'halloween_pumpkin', 'santa_hat'],
  'a-danca-do-tempo': ['calendar', 'moon_ball', 'sun_plush'],
  'a-turma-dos-alimentos': ['apple', 'pear', 'grapes', 'yogurt', 'salad', 'bread', 'egg'],
  'a-viagem-dos-oito-planetas': ['mercury_ball', 'venus_ball', 'earth_ball', 'mars_ball',
    'jupiter_ball', 'saturn_ball', 'uranus_ball', 'neptune_ball'],
  'a-aventura-do-abc': ['abc_blocks'],
  'o-jardim-das-diferencas': ['dna_helix'],
  'o-clube-dos-dentinhos': ['toothbrush'],
  'rapunzel-contos-dos-grimm': ['rapunzel'],
  'o-rouxinol-e-o-imperador': ['nightingale_plush'],
  'a-roupa-nova-do-imperador': ['emperor_crown'],
  'as-fabulas-de-esopo': ['wooden_tortoise'],
  'a-historia-de-pedro-coelho': ['garden_carrot']
};
assert.equal(catalog.books.length, 22, 'Vinte e dois títulos infantis no catálogo');
const allRewards = Object.values(targets).flat();
assert.equal(allRewards.length, 48, 'Quarenta e oito recompensas no total');
assert.equal(new Set(allRewards).size, allRewards.length);
assert.equal(Object.keys(avatar.rewardBooks).length, allRewards.length);
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
    const field = avatar.petStyles.some(([key]) => key === id) ? 'petId'
      : avatar.outfitStyles.some(([key]) => key === id) ? 'outfitStyle'
        : avatar.hairStyles.some(([key]) => key === id) ? 'avatarStyle'
        : avatar.accessoryStyles.some(([key]) => key === id) ? 'accessories' : 'toys';
    assert(field !== 'toys' || avatar.toyStyles.some(([key]) => key === id), `Item ${id} sem catálogo`);
    const equipped = { [field]: ['toys', 'accessories'].includes(field) ? [id] : id };
    const contains = (state) => Array.isArray(state[field]) ? state[field].includes(id) : state[field] === id;
    assert(!contains(prefs.clean({ ...equipped, ...partial })), `Recompensa ${id} vazou antes do fim`);
    assert(contains(prefs.clean({ ...equipped, ...complete })), `Recompensa ${id} não liberada no perfil`);
  }
}
assert(avatar.avatarSVG({ petId: 'heart_plush' }).includes('repeatCount="indefinite"'),
  'Pelúcia deve trocar de cor automaticamente');
assert(avatar.avatarSVG({ petId: 'sun_plush' }).includes('data-source="assets/pets/sol-sorridente.svg"'),
  'Pelúcia do tempo precisa ter seu próprio desenho');
assert(avatar.avatarSVG({ petId: 'nightingale_plush' }).includes('data-source="assets/pets/rouxinol-cantor.svg"'),
  'Pelúcia do rouxinol precisa ter desenho original');
assert(avatar.avatarSVG({ accessories: ['emperor_crown'] }).includes('data-detail="coroa-imperial"'),
  'Coroa imperial precisa ser desenhada no avatar');
assert(avatar.avatarSVG({ toys: ['wooden_tortoise'] }).includes('data-detail="tartaruguinha-madeira"'),
  'A fábula precisa desbloquear a tartaruguinha');
assert(avatar.avatarSVG({ toys: ['garden_carrot'] }).includes('data-detail="cenoura-pedro-coelho"'),
  'Pedro Coelho precisa desbloquear a cenoura');
const saci = avatar.avatarSVG({ toys: ['saci_costume'] });
assert(saci.includes('data-saci-one-leg="true"'), 'A fantasia do Saci precisa esconder uma perna');
assert(!saci.includes('data-layer="tenis-direito"'), 'A fantasia do Saci não deve desenhar a segunda perna');
assert(avatar.avatarSVG({ toys: ['halloween_pumpkin'] }).includes('repeatCount="indefinite"'),
  'A vela desenhada da abóbora deve piscar, sem fogo real');
assert(avatar.avatarSVG({ outfitStyle: 'carnival_tank' }).includes('data-detail="glitter-colorido"'),
  'A regata de Carnaval precisa de glitter colorido');
for (const name of ['mercury', 'venus', 'earth', 'mars', 'jupiter', 'saturn', 'uranus', 'neptune']) {
  assert(avatar.avatarSVG({ toys: [`${name}_ball`] }).includes(`id="planet-${name}_ball"`),
    `Planeta ${name} precisa de textura própria`);
}
assert(avatar.avatarSVG({ toys: ['saturn_ball'] }).includes('rotate(-22)'),
  'Os anéis de Saturno precisam ser visíveis');
assert(avatar.avatarSVG({ toys: ['abc_blocks'] }).includes('data-detail="blocos-empilhados-abc"'),
  'Blocos ABC precisam ser três peças empilhadas com letras distintas');
assert(avatar.avatarSVG({ toys: ['dna_helix'] }).includes('data-detail="dupla-helice-dna"'),
  'Brinquedo do DNA deve representar uma dupla hélice colorida');
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
const bibliography = ['o-escudo-das-vacinas', 'o-corpo-em-movimento', 'o-clube-dos-dentinhos',
  'o-calendario-das-festas', 'a-danca-do-tempo', 'a-turma-dos-alimentos', 'a-viagem-dos-oito-planetas',
  'o-jardim-das-diferencas', 'o-rouxinol-e-o-imperador', 'a-roupa-nova-do-imperador',
  'as-fabulas-de-esopo', 'a-historia-de-pedro-coelho'];
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
console.log('✓ 22 livros e 48 recompensas, medalha + conclusão e bloqueio persistente');
console.log('✓ Coração, sol, vela animada, Saci de uma perna, oito planetas e fontes não clicáveis');
