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
vm.runInNewContext(fs.readFileSync(path.join(root, 'assets/js/avatar-parts.js'), 'utf8'), context);
vm.runInNewContext(fs.readFileSync(path.join(root, 'assets/js/pet-parts.js'), 'utf8'), context);
vm.runInNewContext(fs.readFileSync(path.join(root, 'assets/js/avatar.js'), 'utf8'), context);
vm.runInNewContext(fs.readFileSync(path.join(root, 'assets/js/preferences.js'), 'utf8'), context);

const renderer = window.LivrinhoAvatar;
const prefs = window.LivrinhoPreferences;
const hairStyles = renderer.hairStyles.map(([key]) => key);
const outfits = renderer.outfitStyles.map(([key]) => key);
assert.equal(hairStyles.length, 22);
assert.equal(outfits.length, 18);
assert.equal(new Set(hairStyles).size, 22);
assert.equal(new Set(outfits).size, 18);
assert.equal(renderer.petStyles.length, 20, 'Catálogo completo de pets original ausente');
assert.deepEqual(renderer.bottomStyles.map(([key]) => key).join(','), 'pants,shorts,skirt');

const pictures = new Set();
for (const avatarStyle of hairStyles) {
  for (const outfitStyle of outfits) {
    const input = prefs.clean({
      name: 'Ariel', pronunciation: 'Ariel', gender: 'neutro',
      avatarStyle, outfitStyle,
      skinColor: '#83dca5', hairColor: '#c47b43', outfitColor: '#639de8',
      bottomStyle: 'shorts', bottomColor: '#d1834b', shoeColor: '#7147c3'
    });
    assert.equal(input.avatarStyle, avatarStyle);
    assert.equal(input.outfitStyle, outfitStyle);
    const svg = prefs.avatarSVG(input);
    assert(svg.startsWith('<svg'));
    assert(svg.includes('viewBox="0 0 210 340"'));
    assert(svg.includes('#83dca5'), `Pele fantasia não aplicada a ${avatarStyle}/${outfitStyle}`);
    assert(svg.includes('#639de8'), `Cor da roupa não aplicada a ${avatarStyle}/${outfitStyle}`);
    assert(svg.includes('#d1834b'), 'Cor do shorts não foi aplicada');
    assert(svg.includes('#7147c3'), 'Cor dos sapatos não foi aplicada');
    assert(svg.includes('data-source="'), 'As peças devem registrar o SVG de origem');
    pictures.add(svg);
  }
}
assert.equal(pictures.size, 396, 'Cada combinação cabelo + roupa deve criar uma ilustração única');
assert.notEqual(prefs.avatarSVG({ bottomStyle: 'pants' }), prefs.avatarSVG({ bottomStyle: 'shorts' }));
assert.notEqual(prefs.avatarSVG({ bottomStyle: 'skirt' }), prefs.avatarSVG({ bottomStyle: 'shorts' }));
assert(prefs.avatarSVG({ bottomStyle: 'skirt' }).includes('data-layer="tenis-esquerdo"'));
assert(prefs.avatarSVG({ bottomStyle: 'skirt' }).includes('data-layer="tenis-direito"'));
assert(prefs.avatarSVG({ bottomStyle: 'skirt' }).includes('translate(150 304) scale(-1 1)'), 'Os tênis devem ser espelhados com o mesmo alinhamento vertical');
assert.equal(prefs.clean({ bottomStyle: 'skirt' }).bottomStyle, 'skirt');
const sourceAfro = fs.readFileSync(path.join(root, 'assets/avatar-reference/svgrepo-kids/38246-girl.svg'), 'utf8');
const sourceHoodie = fs.readFileSync(path.join(root, 'assets/avatar-reference/svgrepo-kids/3852-boy.svg'), 'utf8');
assert(sourceAfro.includes('M405.237,172') && prefs.avatarSVG({ avatarStyle: 'afro' }).includes('M405.237,172'),
  'O cabelo afro precisa reutilizar a geometria vetorial do SVG baixado');
assert(sourceHoodie.includes('M389.078,436.226') && prefs.avatarSVG({ outfitStyle: 'hoodie' }).includes('M389.078,436.226'),
  'O moletom precisa reutilizar a geometria vetorial do SVG baixado');
const newSources = JSON.parse(fs.readFileSync(path.join(root, 'assets/avatar-reference/component-map.json'), 'utf8'));
for (const hair of hairStyles) {
  assert(newSources.hair[hair], `Penteado ${hair} sem mapeamento do SVG original`);
}
for (const outfit of outfits) {
  assert(newSources.outfit[outfit], `Roupa ${outfit} sem mapeamento do SVG original`);
}

const oldStorageKey = 'prateleira-de-livrinhos:protagonista:v1';
settings.set(oldStorageKey, JSON.stringify({ name: 'Ellie', pronunciation: 'Éli', gender: 'feminino', avatarStyle: 'short', skinColor: '#8bcfff' }));
const migrated = prefs.load();
assert.equal(migrated.name, 'Ellie');
assert.equal(migrated.avatarStyle, 'short');
assert.equal(migrated.skinColor, '#8bcfff');
assert.equal(migrated.outfitStyle, 'hoodie');
assert.equal(migrated.hairColor, '#493a55');
assert.equal(migrated.outfitColor, '#fa7195');
assert.equal(migrated.bottomStyle, 'pants');
assert.equal(migrated.bottomColor, '#5879b9');
assert.equal(migrated.shoeColor, '#625a89');
assert.equal(prefs.clean({ gender: 'masculino' }).outfitColor, '#6e9beb');
assert.equal(prefs.clean({ gender: 'neutro' }).outfitColor, '#9b8ae5');
assert.equal(prefs.clean({ petId: 'fox' }).petId, null, 'Pet deve estar bloqueado antes da segunda medalha');
assert.equal(prefs.clean({ birthDate: '2025-02-29' }).birthDate, '', 'Nascimento inválido deve ser recusado');
assert.equal(prefs.ageOnDate('2020-02-29', new Date(2026, 9, 26)), 6);
assert.equal(prefs.ageOnDate('', new Date(2026, 9, 26)), null);

// O SVG precisa ser simultaneamente uma imagem e um backup completo do perfil.
const backupName = 'Mia & Lua <3';
const custom = prefs.save({
  name: backupName, pronunciation: 'Mia e Lua', gender: 'neutro',
  avatarStyle: 'braids', outfitStyle: 'overalls', skinColor: '#83dca5',
  hairColor: '#c47b43', outfitColor: '#639de8',
  bottomStyle: 'shorts', bottomColor: '#7a5cd9', shoeColor: '#f4a85c'
});
assert.deepEqual(Object.keys(custom.achievements.books), []);
const bookId = 'ellie-e-o-trem-travesso';
prefs.recordBookProgress(bookId, { completedExercises: [0, 2] }, 3);
assert.equal(prefs.bookProgress(bookId).completedExercises.length, 2);
assert.equal(prefs.bookProgress(bookId).challengeCompletedAt, null);
prefs.recordBookProgress(bookId, { completedExercises: [0, 1, 2] }, 3);
assert(prefs.bookProgress(bookId).challengeCompletedAt, 'A conclusão do desafio deve ser registrada');
assert(prefs.bookProgress(bookId).medalEarnedAt, 'A medalha deve ser salva ao marcar todas as frases');
prefs.recordBookProgress(bookId, { finished: true }, 3);
assert(prefs.bookProgress(bookId).finishedAt, 'O término do livro deve ter data');
prefs.recordBookProgress('ellie-e-o-trem-dos-dragoes', { completedExercises: [1] }, 4);
const saved = prefs.load();
const svgBackup = prefs.exportProfileSVG(saved);
assert(svgBackup.startsWith('<svg'));
assert(svgBackup.includes('viewBox="0 0 210 340"'));
assert(svgBackup.includes('id="prateleira-magica-profile"'));
assert(svgBackup.includes('Mia &amp; Lua &lt;3'), 'O SVG exportado deve escapar o nome no XML');
assert(svgBackup.includes('#639de8'), 'A ilustração precisa manter a roupa customizada');
const restored = prefs.parseProfileSVG(svgBackup);
assert.equal(restored.name, backupName);
assert.equal(restored.pronunciation, 'Mia e Lua');
assert.equal(restored.gender, 'neutro');
assert.equal(restored.avatarStyle, 'braids');
assert.equal(restored.outfitStyle, 'overalls');
assert.equal(restored.skinColor, '#83dca5');
assert.equal(restored.outfitColor, '#639de8');
assert.equal(restored.bottomStyle, 'shorts');
assert.equal(restored.bottomColor, '#7a5cd9');
assert.equal(restored.shoeColor, '#f4a85c');
const oldBackup = svgBackup
  .replace('&quot;bottomStyle&quot;:&quot;shorts&quot;,', '')
  .replace('&quot;bottomColor&quot;:&quot;#7a5cd9&quot;,', '')
  .replace(',&quot;shoeColor&quot;:&quot;#f4a85c&quot;', '');
const restoredOldBackup = prefs.parseProfileSVG(oldBackup);
assert.equal(restoredOldBackup.bottomStyle, 'pants', 'Backups anteriores recebem calça padrão');
assert.equal(restoredOldBackup.bottomColor, '#5879b9');
assert.equal(restoredOldBackup.shoeColor, '#625a89');
const backupWithSkirt = prefs.exportProfileSVG({ ...saved, bottomStyle: 'skirt' });
assert.equal(prefs.parseProfileSVG(backupWithSkirt).bottomStyle, 'skirt', 'Saia deve sobreviver à exportação e importação SVG');
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
prefs.recordBookProgress('ellie-e-o-trem-dos-dragoes', { completedExercises: [0, 1, 2, 3], visitedPages: [0, 1, 3] }, 4);
assert.equal(prefs.medalCount(prefs.load()), 2, 'Duas medalhas devem liberar os pets');
const petProfile = prefs.save({ ...prefs.load(), birthDate: '2020-02-29', petId: 'fox' });
assert.equal(petProfile.petId, 'fox');
assert.equal(petProfile.birthDate, '2020-02-29');
assert(prefs.avatarSVG().includes('data-layer="pet-original"'), 'O pet precisa aparecer junto ao avatar');
assert(prefs.avatarSVG().includes('M541.970732 633.791063'), 'O pet deve reutilizar os vetores originais do SVG Repo');
for (const [id] of renderer.petStyles) {
  const svg = renderer.avatarSVG({ ...petProfile, petId: id });
  assert(svg.includes('x="117" y="227" width="90" height="104"'), `Pelúcia ${id} fora da linha de chão y=331`);
  assert(svg.includes('preserveAspectRatio="xMidYMax meet"'), `Pelúcia ${id} não está ancorada por baixo`);
  assert(svg.includes('data-layer="pelucia-sombra"'), `Pelúcia ${id} sem sombra de contato`);
}
const profileUi = fs.readFileSync(path.join(root, 'assets/js/profile.js'), 'utf8');
assert(profileUi.includes('as 20 pelúcias'), 'Perfil deve chamar os companheiros de pelúcias');
const settingsUi = fs.readFileSync(path.join(root, 'assets/js/settings-ui.js'), 'utf8');
assert(settingsUi.includes('Minha pelúcia companheira') && settingsUi.includes('Sem pelúcia'),
  'O editor deve usar o nome pelúcia em todos os controles');
const svgPetBackup = prefs.exportProfileSVG(petProfile);
const recoveredPet = prefs.parseProfileSVG(svgPetBackup);
assert.equal(recoveredPet.petId, 'fox', 'O SVG deve guardar o pet escolhido');
assert.equal(recoveredPet.birthDate, '2020-02-29', 'O SVG deve guardar o nascimento');
assert.equal(prefs.medalCount(recoveredPet), 2, 'O SVG deve restaurar duas medalhas');
assert.deepEqual([...recoveredPet.achievements.books['ellie-e-o-trem-dos-dragoes'].visitedPages], [0, 1, 3]);
assert.throws(() => prefs.parseProfileSVG('<svg xmlns="http://www.w3.org/2000/svg"></svg>'), /não é um perfil/);
assert.throws(() => prefs.parseProfileSVG(svgBackup.replace('&quot;schemaVersion&quot;:1', '&quot;schemaVersion&quot;:99')), /incompleto/);
assert.throws(() => prefs.parseProfileSVG(svgBackup.replace('&quot;app&quot;:&quot;prateleira-magica&quot;', '&quot;app&quot;:&quot;outro&quot;')), /incompleto/);
assert.throws(() => prefs.parseProfileSVG(svgBackup.replace('&quot;name&quot;:&quot;Mia', '&quot;name&quot;:false,&quot;unused&quot;:&quot;Mia')), /incompleto/);
assert.throws(() => prefs.parseProfileSVG('<script>alert(1)</script>'), /Escolha um perfil/);
assert.equal(prefs.load().name, backupName, 'Um arquivo inválido não altera o perfil');

const ui = fs.readFileSync(path.join(root, 'assets/js/settings-ui.js'), 'utf8');
for (const marker of ['outfitStyles', 'hairColorOptions', 'outfitColorOptions', 'bottomStyles',
  'bottomColorOptions', 'shoeColorOptions', 'customHairColor', 'customOutfitColor',
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

console.log('✓ 22 cabelos × 18 roupas = 396 combinações com vetores originais do SVG Repo');
console.log('✓ Tons de pele fantasia e cores independentes de cabelo, roupa, calça/shorts/saia e tênis espelhados');
console.log('✓ 20 pets SVG originais desbloqueados após duas medalhas e renderizados junto ao avatar');
console.log('✓ Data de nascimento, páginas visitadas e pets preservados no backup SVG');
console.log('✓ Preferências e backups antigos migram sem perder avatar, nome, pronúncia ou conquistas');
console.log('✓ SVG ilustrado contém backup JSON inline e restaura nome, voz, gênero e conquistas dos livros');
console.log('✓ Backups inválidos são recusados sem alterar o perfil local');
console.log(`✓ ${downloaded.length}/75 SVGs de referência originais identificados e validados`);
