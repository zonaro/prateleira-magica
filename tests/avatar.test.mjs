import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const window = {};
const settings = new Map();
const context = {
  window,
  document: { dispatchEvent() {} },
  CustomEvent: class { constructor(type, options) { this.type = type; this.detail = options.detail; } },
  localStorage: {
    getItem(key) { return settings.get(key) || null; },
    setItem(key, value) { settings.set(key, value); }
  }
};
vm.runInNewContext(fs.readFileSync(path.join(root, 'assets/js/avatar.js'), 'utf8'), context);
vm.runInNewContext(fs.readFileSync(path.join(root, 'assets/js/preferences.js'), 'utf8'), context);

const renderer = window.LivrinhoAvatar;
const prefs = window.LivrinhoPreferences;
const hairStyles = renderer.hairStyles.map(([key]) => key);
const outfits = renderer.outfitStyles.map(([key]) => key);
assert.equal(hairStyles.length, 9);
assert.equal(outfits.length, 6);
assert.equal(new Set(hairStyles).size, 9);
assert.equal(new Set(outfits).size, 6);

const pictures = new Set();
for (const avatarStyle of hairStyles) {
  for (const outfitStyle of outfits) {
    const input = prefs.clean({
      name: 'Ariel', pronunciation: 'Ariel', gender: 'neutro',
      avatarStyle, outfitStyle,
      skinColor: '#83dca5', hairColor: '#c47b43', outfitColor: '#639de8'
    });
    assert.equal(input.avatarStyle, avatarStyle);
    assert.equal(input.outfitStyle, outfitStyle);
    const svg = prefs.avatarSVG(input);
    assert(svg.startsWith('<svg'));
    assert(svg.includes('viewBox="0 0 210 340"'));
    assert(svg.includes('#83dca5'), `Pele fantasia não aplicada a ${avatarStyle}/${outfitStyle}`);
    assert(svg.includes('#639de8'), `Cor da roupa não aplicada a ${avatarStyle}/${outfitStyle}`);
    pictures.add(svg);
  }
}
assert.equal(pictures.size, 54, 'Cada combinação cabelo + roupa deve criar uma ilustração única');

const oldStorageKey = 'prateleira-de-livrinhos:protagonista:v1';
settings.set(oldStorageKey, JSON.stringify({ name: 'Ellie', pronunciation: 'Éli', gender: 'feminino', avatarStyle: 'short', skinColor: '#8bcfff' }));
const migrated = prefs.load();
assert.equal(migrated.name, 'Ellie');
assert.equal(migrated.avatarStyle, 'short');
assert.equal(migrated.skinColor, '#8bcfff');
assert.equal(migrated.outfitStyle, 'hoodie');
assert.equal(migrated.hairColor, '#493a55');
assert.equal(migrated.outfitColor, '#fa7195');
assert.equal(prefs.clean({ gender: 'masculino' }).outfitColor, '#6e9beb');
assert.equal(prefs.clean({ gender: 'neutro' }).outfitColor, '#9b8ae5');

// O SVG precisa ser simultaneamente uma imagem e um backup completo do perfil.
const backupName = 'Mia & Lua <3';
const custom = prefs.save({
  name: backupName, pronunciation: 'Mia e Lua', gender: 'neutro',
  avatarStyle: 'braids', outfitStyle: 'overalls', skinColor: '#83dca5',
  hairColor: '#c47b43', outfitColor: '#639de8'
});
assert.deepEqual(Object.keys(custom.achievements.books), []);
const bookId = 'ellie-e-o-trem-travesso';
prefs.recordBookProgress(bookId, { completedExercises: [0, 2] }, 3);
assert.equal(prefs.bookProgress(bookId).completedExercises.length, 2);
assert.equal(prefs.bookProgress(bookId).challengeCompletedAt, null);
prefs.recordBookProgress(bookId, { completedExercises: [0, 1, 2] }, 3);
assert(prefs.bookProgress(bookId).challengeCompletedAt, 'A conclusão do desafio deve ser registrada');
prefs.recordBookProgress(bookId, { finished: true }, 3);
assert(prefs.bookProgress(bookId).finishedAt, 'O término do livro deve ter data');
prefs.recordBookProgress('ellie-e-o-trem-dos-dragoes', { completedExercises: [1] }, 4);
const saved = prefs.load();
const svgBackup = prefs.exportProfileSVG(saved);
assert(svgBackup.startsWith('<svg'));
assert(svgBackup.includes('viewBox="0 0 210 340"'));
assert(svgBackup.includes('id="prateleira-magica-profile"'));
assert(svgBackup.includes('Mia &amp; Lua &lt;3'), 'O SVG exportado deve escapar o nome no XML');
assert(svgBackup.includes('fill="#639de8"'), 'A ilustração precisa manter a roupa customizada');
const restored = prefs.parseProfileSVG(svgBackup);
assert.equal(restored.name, backupName);
assert.equal(restored.pronunciation, 'Mia e Lua');
assert.equal(restored.gender, 'neutro');
assert.equal(restored.avatarStyle, 'braids');
assert.equal(restored.outfitStyle, 'overalls');
assert.equal(restored.skinColor, '#83dca5');
assert.equal(restored.outfitColor, '#639de8');
assert.deepEqual([...restored.achievements.books[bookId].completedExercises], [0, 1, 2]);
assert.equal(restored.achievements.books[bookId].finished, true);
assert.equal(restored.achievements.books[bookId].finishedAt, saved.achievements.books[bookId].finishedAt);
assert.equal(restored.achievements.books[bookId].challengeCompletedAt, saved.achievements.books[bookId].challengeCompletedAt);
assert.deepEqual([...restored.achievements.books['ellie-e-o-trem-dos-dragoes'].completedExercises], [1]);

prefs.save({ name: 'Outro', pronunciation: 'Outro', gender: 'masculino' });
assert.equal(prefs.bookProgress(bookId).finished, false, 'Perfis diferentes não devem compartilhar progresso');
prefs.save(restored);
assert.equal(prefs.load().name, backupName);
assert.equal(prefs.bookProgress(bookId).finished, true, 'Importar o SVG recupera as conquistas');
assert.throws(() => prefs.parseProfileSVG('<svg xmlns="http://www.w3.org/2000/svg"></svg>'), /backup/);
assert.throws(() => prefs.parseProfileSVG(svgBackup.replace('&quot;schemaVersion&quot;:1', '&quot;schemaVersion&quot;:99')), /incompatível/);
assert.throws(() => prefs.parseProfileSVG(svgBackup.replace('&quot;app&quot;:&quot;prateleira-magica&quot;', '&quot;app&quot;:&quot;outro&quot;')), /incompatível/);
assert.throws(() => prefs.parseProfileSVG(svgBackup.replace('&quot;name&quot;:&quot;Mia', '&quot;name&quot;:false,&quot;unused&quot;:&quot;Mia')), /incompatível/);
assert.throws(() => prefs.parseProfileSVG('<script>alert(1)</script>'), /válido/);
assert.equal(prefs.load().name, backupName, 'Um arquivo inválido não altera o perfil');

const ui = fs.readFileSync(path.join(root, 'assets/js/settings-ui.js'), 'utf8');
for (const marker of ['outfitStyles', 'hairColorOptions', 'outfitColorOptions', 'customHairColor', 'customOutfitColor',
  'downloadProfile', 'importProfile', 'profileFile', 'parseProfileSVG']) {
  assert(ui.includes(marker), `Editor sem o controle ${marker}`);
}

const referenceDir = path.join(root, 'assets/avatar-reference/svgrepo-kids');
const sources = JSON.parse(fs.readFileSync(path.join(referenceDir, 'sources.json'), 'utf8'));
assert.equal(sources.entries.length, 75, 'Manifesto da coleção SVG Repo incompleto');
const downloaded = sources.entries.filter((entry) => entry.downloaded);
assert(downloaded.length >= 70, 'Os SVGs de referência não foram baixados');
for (const entry of downloaded) {
  const svg = fs.readFileSync(path.join(referenceDir, entry.file), 'utf8');
  assert(svg.includes('<svg') && svg.includes('</svg>'), `SVG de referência inválido: ${entry.file}`);
  assert(entry.source.startsWith('https://www.svgrepo.com/svg/'));
}

console.log('✓ 9 penteados × 6 roupas = 54 combinações de SVG distintas');
console.log('✓ Tons de pele fantasia e cores de cabelo/roupa independentes');
console.log('✓ Preferências antigas migram sem perder avatar, nome ou pronúncia');
console.log('✓ SVG ilustrado contém backup JSON inline e restaura nome, voz, gênero e conquistas dos livros');
console.log('✓ Backups inválidos são recusados sem alterar o perfil local');
console.log(`✓ ${downloaded.length}/75 SVGs de referência originais identificados e validados`);
