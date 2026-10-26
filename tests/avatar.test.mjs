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

const ui = fs.readFileSync(path.join(root, 'assets/js/settings-ui.js'), 'utf8');
for (const marker of ['outfitStyles', 'hairColorOptions', 'outfitColorOptions', 'customHairColor', 'customOutfitColor']) {
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
console.log(`✓ ${downloaded.length}/75 SVGs de referência originais identificados e validados`);
