import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { webcrypto } from 'node:crypto';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = (name) => fs.readFileSync(path.join(root, name), 'utf8');
const storage = new Map();
const events = [];
const window = {};
const legacy = 'prateleira-de-livrinhos:protagonista:v1';
storage.set(legacy, JSON.stringify({ name: 'Ellie', pronunciation: 'Éli', gender: 'feminino',
  avatarStyle: 'short', skinColor: '#8bcfff', achievements: { books: { 'livro-antigo': {
    finished: true, medalEarnedAt: '2026-10-27T12:00:00.000Z'
  } } } }));
const context = {
  window, crypto: webcrypto, TextEncoder, console,
  document: { dispatchEvent(event) { events.push(event.type); } },
  CustomEvent: class { constructor(type) { this.type = type; } },
  localStorage: {
    getItem(key) { return storage.get(key) || null; },
    setItem(key, value) { storage.set(key, value); }
  }
};
for (const file of ['assets/js/avatar-parts.js', 'assets/js/pet-parts.js', 'assets/js/avatar.js',
  'assets/js/preferences.js', 'assets/js/parental.js']) {
  vm.runInNewContext(read(file), context, { filename: file });
}
const prefs = window.LivrinhoPreferences;
const parental = window.LivrinhoParental;

// Somente a prateleira, os livros e as telas de criação consomem tempo.
for (const [page, hash] of [
  ['/prateleira-magica/livro.html', ''],
  ['/prateleira-magica/prateleira.html', ''],
  ['/prateleira-magica/perfil.html', '#personalizar'],
  ['/prateleira-magica/perfil.html', '#predefinidos'],
  ['/prateleira-magica/perfil.html', '#foto']
]) {
  assert(parental.shouldCount(page, hash), `Deveria contar tempo: ${page}${hash}`);
}
for (const [page, hash] of [
  ['/prateleira-magica/', ''],
  ['/prateleira-magica/index.html', ''],
  ['/prateleira-magica/perfil.html', ''],
  ['/prateleira-magica/perfil.html', '#conquistas'],
  ['/prateleira-magica/perfil.html', '#pais']
]) {
  assert(!parental.shouldCount(page, hash), `Deveria pausar: ${page}${hash}`);
}
assert(read('assets/js/parental-ui.js').includes('parental.locked() && counting()'),
  'O bloqueio só deve cobrir as áreas que consomem tempo');

// Migração do perfil único sem perder o nome, avatar ou medalhas.
assert.equal(prefs.load().name, 'Ellie');
assert.equal(prefs.load().skinColor, '#8bcfff');
assert.equal(prefs.medalCount(prefs.load()), 1);
const originalId = prefs.family().activeId;
prefs.save({ ...prefs.load(), hairColor: '#123456' });
assert(storage.has('prateleira-magica:familia:v1'));
assert.equal(prefs.load().name, 'Ellie');
const secondId = prefs.addProfile();
assert.notEqual(originalId, secondId);
assert.equal(prefs.load().name, 'Você');
assert.equal(prefs.load().pronunciation, 'Você');
assert.equal(prefs.medalCount(prefs.load()), 0);
assert.equal(parental.limitMinutes(secondId), 60);
assert.equal(parental.photoAllowed(secondId), false, 'A função Minha Foto deve começar bloqueada');
parental.setPhotoAllowed(originalId, true);
assert.equal(parental.photoAllowed(originalId), true);
assert.equal(parental.photoAllowed(secondId), false, 'Permissão de uma criança não libera outra');
parental.setPhotoAllowed(secondId, true);
assert.equal(parental.photoAllowed(secondId), true);
parental.setPhotoAllowed(secondId, false);
assert.equal(parental.photoAllowed(secondId), false, 'Desativar revoga a autorização desta criança');
prefs.saveProfile(secondId, { name: 'Millie', pronunciation: 'Míli', gender: 'neutro', birthDate: '2020-02-29' });
assert.equal(prefs.load().name, 'Millie');
prefs.recordBookProgress('novo-livro', { completedExercises: [0], finished: true }, 1);
assert.equal(prefs.medalCount(prefs.load()), 1);
assert.equal(prefs.selectProfile(originalId), true);
assert.equal(prefs.load().name, 'Ellie');
assert.equal(prefs.load().hairColor, '#123456');
assert.equal(prefs.bookProgress('novo-livro').finished, false);
assert.equal(prefs.selectProfile('nao-existe'), false);
assert.equal(prefs.load().name, 'Ellie');
assert.equal(prefs.selectProfile(secondId), true);
assert.equal(prefs.load().birthDate, '2020-02-29');
assert.equal(prefs.load().gender, 'neutro');

// Limites e uso são independentes; abas invisíveis não acumulam minutos.
parental.setLimit(secondId, 10);
parental.setLimit(originalId, 75);
assert.equal(parental.limitMinutes(secondId), 10);
assert.equal(parental.limitMinutes(originalId), 75);
assert.throws(() => parental.setLimit(secondId, 3), /5 a 480/);
const now = Date.now();
parental.tick(now + 10_000, true);
assert(parental.usedMs(secondId) >= 9_000);
const used = parental.usedMs(secondId);
parental.tick(now + 20_000, false);
assert.equal(parental.usedMs(secondId), used);
parental.tick(now + 30_000, true);
assert(parental.usedMs(secondId) > used);
const today = parental.dateKey();
const stored = JSON.parse(storage.get('prateleira-magica:tempo:v1'));
stored[secondId] = { day: today, usedMs: 10 * 60_000 };
storage.set('prateleira-magica:tempo:v1', JSON.stringify(stored));
assert.equal(parental.remainingMs(secondId), 0);
assert(parental.locked(secondId));
assert(!parental.locked(originalId));
parental.resetTime(secondId);
assert.equal(parental.usedMs(secondId), 0);
assert(!parental.locked(secondId));
assert.equal(parental.usedMs(secondId, new Date(Date.now() + 2 * 86_400_000)), 0,
  'No dia seguinte o tempo deve estar zerado');

// A senha fica em hash com salt; nunca é salva em texto puro.
assert(!parental.hasPin());
await parental.setPin('SenhaDeFamilia!42');
assert(parental.hasPin());
assert(!storage.get('prateleira-magica:responsaveis:v1').includes('SenhaDeFamilia!42'));
assert.equal(await parental.verifyPin('errada'), false);
assert.equal(await parental.verifyPin('SenhaDeFamilia!42'), true);
await assert.rejects(parental.setPin('123'), /4 a 64/);
assert(events.includes('livrinhos:parental-changed'));

prefs.removeProfile(originalId);
assert.equal(prefs.family().profiles.length, 1);
assert.throws(() => prefs.removeProfile(secondId), /pelo menos um/);
parental.forgetProfile(originalId);
assert.equal(parental.limitMinutes(originalId), 60);
assert.equal(parental.photoAllowed(originalId), false, 'Exclusão precisa remover a permissão fotográfica');

const editor = read('assets/js/settings-ui.js');
const parentsUi = read('assets/js/parental-ui.js');
assert(!editor.includes('id="childName"') && !editor.includes('id="birthDate"') && !editor.includes('name="childGender"'));
assert(editor.includes('renameDefault = draft.name === preferences.DEFAULTS.name'),
  'Preset só pode renomear quando o nome ainda for Você');
for (const name of ['parentChildName', 'parentChildPronunciation', 'parentChildBirth',
  'parentChildGender', 'parentChildMinutes', 'parentNewPassword', 'parentAccessPin', 'parentPhotoAllowed']) {
  assert(parentsUi.includes(name), `Campo dos pais ausente: ${name}`);
}
for (const file of ['index.html', 'prateleira.html', 'livro.html', 'perfil.html']) {
  assert(read(file).includes('assets/js/parental.js') && read(file).includes('assets/js/parental-ui.js'),
    `O controle de tempo deve funcionar em ${file}`);
}
assert(read('perfil.html').includes('id="tabPais"'));
console.log('✓ Perfil antigo preservado; múltiplas crianças com avatares e medalhas isolados');
console.log('✓ Padrão Você; dados pessoais exclusivos da área dos pais e presets condicionais');
console.log('✓ Limites independentes, contagem visível, pausa, bloqueio, reinício e renovação diária');
console.log('✓ Temporizador somente na prateleira, leitura e personalização; landing e pais pausados');
console.log('✓ Minha Foto começa oculta e só é liberada para o perfil autorizado pelos pais');
console.log('✓ Senha com hash e salt, campos parentais protegidos e componentes offline em todas as telas');
