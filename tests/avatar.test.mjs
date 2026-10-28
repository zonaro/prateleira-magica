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
vm.runInNewContext(fs.readFileSync(path.join(root, 'assets/js/avatar-presets.js'), 'utf8'), context);
vm.runInNewContext(fs.readFileSync(path.join(root, 'assets/js/pet-parts.js'), 'utf8'), context);
vm.runInNewContext(fs.readFileSync(path.join(root, 'assets/js/avatar.js'), 'utf8'), context);
vm.runInNewContext(fs.readFileSync(path.join(root, 'assets/js/preferences.js'), 'utf8'), context);

const renderer = window.LivrinhoAvatar;
const prefs = window.LivrinhoPreferences;
const hairStyles = renderer.hairStyles.map(([key]) => key);
const outfits = renderer.outfitStyles.map(([key]) => key);
assert.equal(hairStyles.length, 26);
assert.equal(outfits.length, 26);
assert.equal(new Set(hairStyles).size, 26);
assert.equal(new Set(outfits).size, 26);
assert.equal(renderer.petStyles.length, 23, '20 pets originais mais coração, sol e rouxinol exclusivos precisam existir');
assert.equal(renderer.bottomStyles.map(([key]) => key).join(','), 'pants,shorts,skirt,long_skirt,diaper');
assert.equal(renderer.footwearStyles.map(([key]) => key).join(','), 'sneakers,flipflops,socks,barefoot,skates');
assert.equal(renderer.sockPatterns.map(([key]) => key).join(','), 'plain,stripes,dots');
assert.equal(renderer.accessoryStyles.length, 27);
assert.equal(renderer.toyStyles.length, 48);

const pictures = new Set();
for (const avatarStyle of hairStyles) {
  for (const outfitStyle of outfits) {
    const input = prefs.clean({
      name: 'Ariel', pronunciation: 'Ariel', gender: 'neutro',
      avatarStyle, outfitStyle,
      achievements: { books: { 'o-escudo-das-vacinas': {
        finished: true, medalEarnedAt: '2026-10-27T10:00:00.000Z'
      }, 'o-calendario-das-festas': {
        finished: true, medalEarnedAt: '2026-10-27T10:00:00.000Z'
      }, 'rapunzel-contos-dos-grimm': {
        finished: true, medalEarnedAt: '2026-10-27T10:00:00.000Z'
      } } },
      skinColor: '#83dca5', hairColor: '#c47b43', outfitColor: '#639de8',
      bottomStyle: 'shorts', bottomColor: '#d1834b', shoeColor: '#7147c3'
    });
    assert.equal(input.avatarStyle, avatarStyle);
    assert.equal(input.outfitStyle, outfitStyle);
    const svg = prefs.avatarSVG(input);
    assert(svg.startsWith('<svg'));
    assert(svg.includes('viewBox="0 0 210 340"'));
    assert(svg.includes('#83dca5'), `Pele fantasia não aplicada a ${avatarStyle}/${outfitStyle}`);
    if (outfitStyle !== 'doctor_coat') {
      assert(svg.includes('#639de8'), `Cor da roupa não aplicada a ${avatarStyle}/${outfitStyle}`);
    } else {
      assert(svg.includes('data-detail="jaleco-medico"'), 'Jaleco médico precisa de desenho próprio');
    }
    assert(svg.includes('#d1834b'), 'Cor do shorts não foi aplicada');
    assert(svg.includes('#7147c3'), 'Cor dos sapatos não foi aplicada');
    assert(svg.includes('data-source="'), 'As peças devem registrar o SVG de origem');
    pictures.add(svg);
  }
}
assert.equal(pictures.size, hairStyles.length * outfits.length, 'Cada combinação cabelo + roupa deve criar uma ilustração única');
assert.notEqual(prefs.avatarSVG({ bottomStyle: 'pants' }), prefs.avatarSVG({ bottomStyle: 'shorts' }));
assert.notEqual(prefs.avatarSVG({ bottomStyle: 'skirt' }), prefs.avatarSVG({ bottomStyle: 'shorts' }));
assert(prefs.avatarSVG({ bottomStyle: 'skirt' }).includes('data-layer="tenis-esquerdo"'));
assert(prefs.avatarSVG({ bottomStyle: 'skirt' }).includes('data-layer="tenis-direito"'));
assert(prefs.avatarSVG({ bottomStyle: 'skirt' }).includes('translate(150 304) scale(-1 1)'), 'Os tênis devem ser espelhados com o mesmo alinhamento vertical');
assert.equal(prefs.clean({ bottomStyle: 'skirt' }).bottomStyle, 'skirt');
for (const [bottomStyle] of renderer.bottomStyles) {
  assert.equal(prefs.clean({ bottomStyle }).bottomStyle, bottomStyle);
  assert(prefs.avatarSVG({ bottomStyle }).includes('data-layer="pernas-originais-do-app"'));
}
for (const [footwearStyle] of renderer.footwearStyles) {
  if (footwearStyle !== 'skates') assert.equal(prefs.clean({ footwearStyle }).footwearStyle, footwearStyle);
  const footwearSvg = renderer.avatarSVG({ footwearStyle });
  assert.equal((footwearSvg.match(new RegExp(`data-footwear="${footwearStyle}"`, 'g')) || []).length, 2);
}
for (const [sockPattern] of renderer.sockPatterns) {
  assert.equal(prefs.clean({ sockPattern }).sockPattern, sockPattern);
  assert(prefs.avatarSVG({ footwearStyle: 'socks', sockPattern }).includes('data-footwear="socks"'));
}
assert.notEqual(prefs.avatarSVG({ footwearStyle: 'socks', sockPattern: 'stripes' }),
  prefs.avatarSVG({ footwearStyle: 'socks', sockPattern: 'dots' }), 'Meias estampadas devem ser diferentes');
assert.notEqual(prefs.avatarSVG({ bottomStyle: 'long_skirt' }), prefs.avatarSVG({ bottomStyle: 'skirt' }));
assert.notEqual(prefs.avatarSVG({ bottomStyle: 'diaper' }), prefs.avatarSVG({ bottomStyle: 'shorts' }));
const sourceAfro = fs.readFileSync(path.join(root, 'assets/avatar-reference/svgrepo-kids/38246-girl.svg'), 'utf8');
const sourceHoodie = fs.readFileSync(path.join(root, 'assets/avatar-reference/svgrepo-kids/3852-boy.svg'), 'utf8');
assert(sourceAfro.includes('M405.237,172') && prefs.avatarSVG({ avatarStyle: 'afro' }).includes('M405.237,172'),
  'O cabelo afro precisa reutilizar a geometria vetorial do SVG baixado');
assert(sourceHoodie.includes('M389.078,436.226') && prefs.avatarSVG({ outfitStyle: 'hoodie' }).includes('M389.078,436.226'),
  'O moletom precisa reutilizar a geometria vetorial do SVG baixado');
const newSources = JSON.parse(fs.readFileSync(path.join(root, 'assets/avatar-reference/component-map.json'), 'utf8'));
for (const hair of hairStyles) {
  if (!['bald', 'rapunzel'].includes(hair)) assert(newSources.hair[hair], `Penteado ${hair} sem mapeamento do SVG original`);
}
for (const outfit of outfits) {
  if (!['doctor_coat', 'carnival_tank'].includes(outfit)) assert(newSources.outfit[outfit], `Roupa ${outfit} sem mapeamento do SVG original`);
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
assert.equal(prefs.clean({}).accessoryColor, '#fa7195');
assert.equal(prefs.clean({}).footwearStyle, 'sneakers');
assert.equal(prefs.clean({}).sockPattern, 'plain');
assert.equal(prefs.clean({}).toyColor, '#ed4d56');
assert.equal(prefs.clean({}).toys.join(','), '');
assert(!prefs.avatarSVG({ avatarStyle: 'bald' }).includes('data-source="31423-girl"'), 'Careca não deve desenhar o cabelo padrão');
assert(prefs.avatarSVG({ avatarStyle: 'bald' }).includes('M120 161v-28'), 'Careca precisa de cabeça arredondada');
assert(!hairStyles.includes('cap'), 'Boné não deve aparecer na lista de penteados');
assert(renderer.accessoryStyles.some(([id, name]) => id === 'cap' && name === 'Boné'), 'Boné precisa ser acessório');
const capSvg = prefs.avatarSVG({ avatarStyle: 'bald', accessories: ['cap', 'glasses_round'] });
assert(capSvg.includes('data-accessory="cap"') && capSvg.includes('data-accessory="glasses_round"'),
  'Boné e óculos devem ser desenhados simultaneamente');
for (const [id] of renderer.accessoryStyles) {
  assert(renderer.avatarSVG({ accessories: [id] }).includes(`data-accessory="${id}"`),
    `Acessório ${id} não tem desenho`);
}
assert(renderer.accessoryStyles.some(([id, label, group]) => id === 'cat_headband'
  && label === 'Tiara de gatinho' && group === 'hat'), 'Tiara de gatinho deve ser um acessório de cabeça');
assert(renderer.avatarSVG({ accessories: ['cat_headband'], accessoryColor: '#8c6bd0' }).includes('fill="#8c6bd0"'),
  'Tiara de gatinho deve acompanhar a cor dos acessórios');
const hoodedAfro = renderer.avatarSVG({ avatarStyle: 'afro', accessories: ['hooded_cape'] });
assert(hoodedAfro.includes('data-layer="capuz-sobre-o-cabelo"'), 'Capuz não foi colocado sobre a cabeça');
assert(!hoodedAfro.includes('M405.237,172'), 'O cabelo volumoso não pode vazar do capuz');
assert(renderer.avatarSVG({ avatarStyle: 'afro' }).includes('M405.237,172'),
  'O penteado deve reaparecer ao retirar o capuz');
for (const [id] of renderer.toyStyles) {
  assert(renderer.avatarSVG({ toys: [id] }).includes(`data-toy="${id}"`),
    `Brinquedo ${id} não tem desenho`);
}
for (const instrument of ['mini_keyboard', 'guitar']) {
  const svg = renderer.avatarSVG({ toys: [instrument] });
  const placement = svg.match(new RegExp(`data-toy="${instrument}" data-placement="hand" transform="translate\\((\\d+) 237\\)"`));
  assert(placement && Number(placement[1]) >= 80,
    `${instrument} precisa ficar inteiro dentro do SVG, longe da borda esquerda`);
}
assert(renderer.avatarSVG({ toys: ['soccer_ball'] }).includes('data-placement="hand" transform="translate(29 237)"'),
  'Bolas e brinquedos pequenos devem manter a posição original');
const mixedToys = renderer.avatarSVG({ toys: ['soccer_ball', 'fairy_wings', 'skateboard'], toyColor: '#9c80df' });
assert(mixedToys.includes('data-toy="soccer_ball"') && mixedToys.includes('data-toy="fairy_wings"')
  && mixedToys.includes('data-toy="skateboard"'), 'Brinquedos de grupos distintos devem aparecer juntos');
assert(mixedToys.includes('translate(0 -14)'), 'O personagem precisa subir para ficar em cima do skate');
assert(mixedToys.indexOf('data-placement="floor"') > mixedToys.indexOf('data-layer="tenis-direito"'),
  'O skate deve ser desenhado sob os pés do avatar');
assert(renderer.avatarSVG({ toys: ['pocket_ball'] }).includes('data-toy="pocket_ball"'),
  'Bola de monstrinho de bolso não foi desenhada');
const ghostSvg = renderer.avatarSVG({ toys: ['ghost_costume', 'soccer_ball', 'fairy_wings'] });
assert(ghostSvg.includes('data-toy="ghost_costume" data-placement="costume"'), 'Fantasia de fantasma ausente');
assert(ghostSvg.includes('fill-rule="evenodd"'), 'Olhos da fantasia precisam ser furados no lençol');
assert(ghostSvg.indexOf('data-placement="costume"') > ghostSvg.indexOf('data-layer="tenis-direito"')
  && ghostSvg.indexOf('data-placement="costume"') > ghostSvg.indexOf('data-placement="hand"'),
  'Fantasia deve cobrir a criança inteira, inclusive pés e brinquedos na mão');
const layeredAccessories = renderer.avatarSVG({ accessories: ['flower_clip', 'headband'] });
const reversedAccessories = renderer.avatarSVG({ accessories: ['headband', 'flower_clip'] });
for (const svg of [layeredAccessories, reversedAccessories]) {
  assert(svg.indexOf('data-accessory="flower_clip"') > svg.indexOf('data-accessory="headband"'),
    'A flor precisa ficar por cima da tiara, em qualquer ordem de seleção');
}
for (const cape of ['hooded_cape', 'hero_cape']) {
  const svg = renderer.avatarSVG({ accessories: [cape] });
  assert(svg.indexOf(`data-accessory="${cape}" data-placement="back"`) < svg.indexOf('data-layer="rosto-original"'),
    `${cape} precisa ter uma camada atrás do personagem`);
}
for (const toy of ['fairy_wings', 'bat_wings']) {
  const svg = renderer.avatarSVG({ toys: [toy] });
  assert(svg.indexOf(`data-toy="${toy}" data-placement="back"`) < svg.indexOf('data-layer="rosto-original"'),
    `Asas ${toy} devem ficar atrás do corpo`);
}
assert.equal(prefs.clean({ accessories: ['kitsune_mask', 'glasses_round'] }).accessories.join(','),
  'kitsune_mask', 'Máscara kitsune precisa ocupar o mesmo lugar dos óculos');
assert(renderer.avatarSVG({ name: 'Gabriel', accessories: ['plumber_beret'], accessoryColor: '#9c80df' }).includes('>G</text>'),
  'Boina deve usar a primeira letra do nome');
assert(renderer.avatarSVG({ name: 'Éllie', accessories: ['plumber_beret'] }).includes('>E</text>'),
  'Boina precisa aceitar nomes acentuados');
assert(prefs.avatarSVG({ accessories: ['flower_clip'], accessoryColor: '#8c6bd0' }).includes('fill="#8c6bd0"'),
  'Flores acessórias devem aceitar a cor escolhida');
assert(prefs.avatarSVG({ accessories: ['cap'] }).includes('scale(1.2)'), 'Boné precisa ser maior');
// Ioiô: bloqueado antes de voltar uma página, permanente entre livros e backups.
assert(renderer.toyStyles.some(([id, , group]) => id === 'yoyo' && group === 'hand'));
assert(renderer.avatarSVG({ toys: ['yoyo'], toyColor: '#639de8' }).includes('data-toy="yoyo"'));
assert(!prefs.clean({ toys: ['yoyo'] }).toys.includes('yoyo'));
assert(!prefs.clean({ toys: ['yoyo'], achievements: { books: {}, pageReturn: false } }).toys.includes('yoyo'));
const yoYoState = prefs.clean({ toys: ['yoyo'], achievements: { books: {}, pageReturn: true } });
assert(yoYoState.toys.includes('yoyo'), 'O ioiô deve liberar com a primeira página voltada');
assert(yoYoState.achievements.pageReturn, 'Conquista da volta de página deve persistir');
assert(prefs.parseProfileSVG(prefs.exportProfileSVG(yoYoState)).toys.includes('yoyo'),
  'Backup SVG deve preservar o ioiô e seu desbloqueio');
assert(!prefs.load().achievements.pageReturn);
assert.equal(prefs.unlockYoYo(), true, 'Primeira volta registra conquista');
assert.equal(prefs.unlockYoYo(), false, 'Repetições não devem gerar novas conquistas');
assert.equal(prefs.load().achievements.pageReturn, true);
const justUnlocked = prefs.save({ ...prefs.load(), toys: ['yoyo'] });
assert(justUnlocked.toys.includes('yoyo') && justUnlocked.achievements.pageReturn);
assert.equal(prefs.medalCount(justUnlocked), 0, 'Desbloquear ioiô não deve contar como medalha');
prefs.save(prefs.DEFAULTS);

const threeMedals = { books: Object.fromEntries(['um', 'dois', 'tres'].map(id => [id,
  { challengeCompletedAt: '2026-10-27T10:00:00.000Z' }])) };
const oneMedal = { books: { um: threeMedals.books.um } };
const twoMedals = { books: { um: threeMedals.books.um, dois: threeMedals.books.dois } };
const fourMedals = { books: { ...threeMedals.books,
  quatro: { challengeCompletedAt: '2026-10-27T10:00:00.000Z' } } };
assert.equal(renderer.rewardUnlocked({ achievements: oneMedal }, 'pocket_ball'), false,
  'Uma medalha ainda não libera a bola de monstrinho');
assert.equal(renderer.rewardUnlocked({ achievements: twoMedals }, 'pocket_ball'), true,
  'Duas medalhas de livros distintos liberam a bola de monstrinho');
assert(!prefs.clean({ toys: ['pocket_ball'], achievements: oneMedal }).toys.includes('pocket_ball'),
  'Perfis antigos ou importados não podem equipar a bola com só uma medalha');
assert(prefs.clean({ toys: ['pocket_ball'], achievements: twoMedals }).toys.includes('pocket_ball'),
  'Duas medalhas devem liberar a bola de monstrinho em qualquer perfil');
assert(!prefs.clean({ toys: ['skateboard'] }).toys.includes('skateboard'),
  'Skate deve ser bloqueado antes de 4 medalhas');
assert(!prefs.clean({ toys: ['skateboard'], achievements: threeMedals }).toys.includes('skateboard'),
  'Três medalhas ainda não podem liberar o skate');
assert(prefs.clean({ toys: ['skateboard'], achievements: fourMedals }).toys.includes('skateboard'),
  'Skate deve ser liberado com 4 medalhas');
assert.equal(prefs.clean({ footwearStyle: 'skates' }).footwearStyle, 'sneakers',
  'Patins devem estar bloqueados sem 3 medalhas');
assert.equal(prefs.clean({ footwearStyle: 'skates', achievements: threeMedals }).footwearStyle, 'skates',
  'Patins devem ser liberados com 3 medalhas');
assert(renderer.avatarSVG({ footwearStyle: 'skates' }).includes('transform="translate(60 297)"'),
  'Patins precisam ficar alinhados ao chão com rodas visíveis');
assert.equal(prefs.clean({ toys: ['soccer_ball', 'basketball', 'fairy_wings', 'bat_wings', 'unknown'] }).toys.join(','),
  'soccer_ball', 'Asas ligadas a Halloween devem estar bloqueadas sem concluir o livro');
const halloweenMedal = { books: { 'o-calendario-das-festas': {
  finished: true, medalEarnedAt: '2026-10-27T10:00:00.000Z'
} } };
assert.equal(prefs.clean({ toys: ['soccer_ball', 'basketball', 'fairy_wings', 'bat_wings'],
  achievements: halloweenMedal }).toys.join(','), 'soccer_ball,fairy_wings',
'Brinquedos do mesmo grupo são exclusivos mesmo após desbloqueados');
assert(!prefs.clean({ accessories: ['plumber_beret'] }).accessories.includes('plumber_beret'),
  'Boina deve ser bloqueada antes de 3 medalhas');
assert(prefs.clean({ accessories: ['plumber_beret'], achievements: threeMedals }).accessories.includes('plumber_beret'),
  'Boina deve ser liberada com 3 medalhas');
const unlockedProfile = prefs.clean({ name: 'Gabriel', accessories: ['plumber_beret'],
  accessoryColor: '#ed805d', achievements: threeMedals });
const unlockedBackup = prefs.parseProfileSVG(prefs.exportProfileSVG(unlockedProfile));
assert(unlockedBackup.accessories.includes('plumber_beret'), 'Boina deve sobreviver ao backup com três medalhas');
assert.equal(unlockedBackup.accessoryColor, '#ed805d', 'Backup deve guardar a cor dos acessórios');
const toyProfile = prefs.clean({ toys: ['skateboard', 'pocket_ball', 'bat_wings'],
  toyColor: '#9c80df', achievements: { books: { ...fourMedals.books, ...halloweenMedal.books } } });
const toyBackup = prefs.parseProfileSVG(prefs.exportProfileSVG(toyProfile));
assert.equal(toyBackup.toys.join(','), 'skateboard,pocket_ball,bat_wings',
  'Backup deve preservar brinquedos combinados e desbloqueados');
assert.equal(toyBackup.toyColor, '#9c80df', 'Backup deve preservar a cor dos brinquedos');
const skatesBackup = prefs.parseProfileSVG(prefs.exportProfileSVG({ footwearStyle: 'skates', achievements: threeMedals }));
assert.equal(skatesBackup.footwearStyle, 'skates', 'Backup deve restaurar patins desbloqueados');
for (const [id, expected] of [['hoodie', 'Moletom com capuz'], ['hoodie_zip', 'Moletom'],
  ['hoodie_patch', 'Moletom com zíper'], ['necklace', 'Blusa com broche'],
  ['bib', 'Regata com lantejoula'], ['flower_long', 'Longo liso']]) {
  const found = [...renderer.hairStyles, ...renderer.outfitStyles].find(([style]) => style === id);
  assert.equal(found?.[1], expected, `Nome incorreto para ${id}`);
}
for (const id of ['flower_braids', 'flower_bob', 'flower_heart', 'flower_long']) {
  const piece = window.LivrinhoAvatarParts.hair[id];
  assert(!/#BD445A|#FF6473|#F05467|#FFF2CE|#FFE095/.test(piece.front),
    `Penteado ${id} ainda possui a flor original`);
}
for (const [outfitStyle, detail] of [['hoodie_stripes', 'listras-do-moletom'],
  ['shirt_stripes', 'listras-da-camisa']]) {
  assert(prefs.avatarSVG({ outfitStyle }).includes(`data-detail="${detail}"`),
    `${outfitStyle} está sem as listras`);
}
for (const style of ['team_tee', 'cardigan']) {
  assert(prefs.avatarSVG({ outfitStyle: style }).includes(`data-align="${style}"`),
    `${style} não foi centralizado no corpo`);
}
assert(renderer.petStyles.some(([id, name]) => id === 'cute-animals' && name === 'Zebra'));
const oldCapProfile = prefs.clean({ avatarStyle: 'cap', accessories: ['headphones', 'glasses_square'] });
assert.equal(oldCapProfile.avatarStyle, 'short', 'Penteado boné antigo precisa migrar para cabelo curtinho');
assert(oldCapProfile.accessories.includes('cap') && oldCapProfile.accessories.includes('glasses_square'));
assert(!oldCapProfile.accessories.includes('headphones'), 'Boné e fones não podem ocupar a cabeça juntos');
assert.equal(prefs.clean({ accessories: ['glasses_round', 'glasses_square', 'beanie', 'headband', 'unknown'] }).accessories.join(','),
  'glasses_round,beanie', 'Acessórios inválidos ou conflitantes devem ser removidos');

const readyPresets = JSON.parse(fs.readFileSync(path.join(root, 'assets/data/avatar-presets.json'), 'utf8'));
const inlinePresets = window.LivrinhoAvatarPresetParts;
assert.equal(readyPresets.length, 73);
for (const preset of readyPresets) {
  const profile = prefs.clean({ ...preset.profile, sourceSvg: preset.sourceSvg });
  assert.equal(profile.sourceSvg, preset.sourceSvg);
  assert.equal(profile.presetEdits.join(','), '', 'Personagem pronto não pode começar com edições implícitas');
  const svg = prefs.avatarSVG(profile);
  assert(svg.includes('viewBox="0 0 210 340"'));
  assert(svg.includes('data-layer="pernas-originais-do-app"'), `Pernas ausentes no pronto ${preset.sourceSvg}`);
  assert(svg.includes('data-layer="avatar-pronto"'), `SVG pronto não incorporado: ${preset.sourceSvg}`);
  assert(svg.includes(inlinePresets[preset.sourceSvg].body.slice(0, 35)),
    `O desenho original de ${preset.sourceSvg} não foi incorporado`);
  assert(!svg.includes('<image'), `Personagem ${preset.sourceSvg} exige imagem externa`);
  const capedProfile = prefs.clean({ ...profile, accessories: ['hooded_cape'] });
  const hoodSvg = prefs.avatarSVG(capedProfile);
  assert(hoodSvg.includes('data-layer="capuz-sobre-o-cabelo"')
    && hoodSvg.includes('data-layer="roupa-original"'),
  `Capuz não cobre o cabelo preservando a roupa original: ${preset.sourceSvg}`);
  assert.equal(prefs.avatarSVG({ ...capedProfile, accessories: [] }), svg,
    `Remover o capuz deve restaurar integralmente o personagem ${preset.sourceSvg}`);
  assert.equal((svg.match(/<svg\b/g) || []).length, (svg.match(/<\/svg>/g) || []).length,
    `SVG de ${preset.sourceSvg} com tags desequilibradas`);
  const backup = prefs.exportProfileSVG(profile);
  assert.equal(prefs.parseProfileSVG(backup).sourceSvg, preset.sourceSvg,
    `Backup perdeu personagem pronto ${preset.sourceSvg}`);

  const original = inlinePresets[preset.sourceSvg];
  const outfitPiece = original.segments.find((piece) => piece.role === 'outfit')?.svg;
  const hairPiece = original.segments.find((piece) => piece.role === 'hairBack' || piece.role === 'hairFront')?.svg;
  assert(outfitPiece && hairPiece, `Personagem ${preset.sourceSvg} sem peças separadas`);
  const withNewHair = prefs.clean({ ...profile, avatarStyle: 'bald', presetEdits: ['avatarStyle'] });
  const hairSwapSvg = prefs.avatarSVG(withNewHair);
  assert(hairSwapSvg.includes('data-layer="roupa-original"'), `Roupa original perdida após trocar o cabelo: ${preset.sourceSvg}`);
  assert(hairSwapSvg.includes(outfitPiece), `Caminhos da roupa alterados junto com o cabelo: ${preset.sourceSvg}`);
  assert(hairSwapSvg.includes('M120 161v-28'), `Careca não substituiu o penteado: ${preset.sourceSvg}`);
  assert(!hairSwapSvg.includes('data-layer="avatar-pronto"'), `Personagem ${preset.sourceSvg} não saiu do desenho fechado`);

  const withNewOutfit = prefs.clean({ ...profile, outfitStyle: 'hoodie', presetEdits: ['outfitStyle'] });
  const outfitSwapSvg = prefs.avatarSVG(withNewOutfit);
  assert(outfitSwapSvg.includes(hairPiece), `Cabelo original perdido após trocar roupa: ${preset.sourceSvg}`);
  assert(outfitSwapSvg.includes('data-layer="roupa-alterada"'), `Roupa nova não apareceu: ${preset.sourceSvg}`);

  // Mudar novamente uma única peça não deve apagar as edições anteriores
  // nem converter os demais elementos para os padrões do editor.
  const mixed = prefs.clean({ ...withNewHair, avatarStyle: 'short', hairColor: '#8c6bd0',
    outfitColor: '#79bc8d', presetEdits: ['avatarStyle', 'hairColor', 'outfitColor'] });
  const mixedSvg = prefs.avatarSVG(mixed);
  assert(mixedSvg.includes('data-layer="roupa-original"'), `Roupa original sumiu em edições sucessivas: ${preset.sourceSvg}`);
  assert(mixedSvg.includes('#8c6bd0'), `Nova cor do cabelo não aplicada: ${preset.sourceSvg}`);
  assert(mixedSvg.includes('#79bc8d'), `Nova cor da roupa não aplicada: ${preset.sourceSvg}`);
  // Os desenhos de Gabriel e Bruno têm eixos diferentes. Alinhar as partes
  // antigas juntas, sem deslocar a camiseta nova, evita mangas fora do corpo.
  if (['132848-boy.svg', '66797-boy.svg'].includes(preset.sourceSvg)) {
    const direction = preset.sourceSvg === '66797-boy.svg' ? -24 : 0;
    const outfitApplied = prefs.avatarSVG(prefs.clean({
      ...profile, outfitStyle: 'tee', presetEdits: ['outfitStyle']
    }));
    assert(outfitApplied.includes(`data-align-preset="${preset.sourceSvg.replace('.svg', '')}" transform="translate(${direction} 0)"`),
      `Camadas do ${preset.sourceSvg} não foram alinhadas`);
    const layer = outfitApplied.indexOf('data-layer="roupa-alterada"');
    assert(layer > outfitApplied.indexOf('data-align-preset='), 'A roupa modular precisa ficar fora do ajuste da silhueta');
    assert(!outfitApplied.slice(layer).includes('data-layer="original-outfit"'),
      'Não redesenhar manga original em cima da roupa nova');
    const withHair = prefs.avatarSVG(prefs.clean({ ...profile, avatarStyle: 'short', presetEdits: ['avatarStyle'] }));
    assert(withHair.includes(`data-align-preset="${preset.sourceSvg.replace('.svg', '')}"`),
      'Ao trocar cabelo, preservar o eixo da roupa original');
  }
  const restoredMixed = prefs.parseProfileSVG(prefs.exportProfileSVG(mixed));
  assert.equal(restoredMixed.sourceSvg, preset.sourceSvg, `Backup perdeu a origem: ${preset.sourceSvg}`);
  assert.equal(restoredMixed.presetEdits.join(','), mixed.presetEdits.join(','),
    `Backup perdeu quais itens foram modificados: ${preset.sourceSvg}`);
  assert.equal(prefs.avatarSVG(restoredMixed), mixedSvg,
    `Importação não restaurou todas as peças: ${preset.sourceSvg}`);
}
const sanitizedPreset = prefs.clean({ sourceSvg: readyPresets[0].sourceSvg,
  presetEdits: ['avatarStyle', 'avatarStyle', 'irrelevante', 'outfitStyle'] });
assert.equal(sanitizedPreset.presetEdits.join(','), 'avatarStyle,outfitStyle',
  'Campos duplicados ou inválidos não devem ficar gravados');
assert.equal(prefs.clean({ sourceSvg: '../outro.svg' }).sourceSvg, undefined,
  'Não aceitar SVG arbitrário enviado por backups');
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
  bottomStyle: 'shorts', bottomColor: '#7a5cd9', shoeColor: '#f4a85c',
  footwearStyle: 'socks', sockPattern: 'dots', accessoryColor: '#8c6bd0'
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
assert.equal(restored.footwearStyle, 'socks');
assert.equal(restored.sockPattern, 'dots');
assert.equal(restored.accessoryColor, '#8c6bd0');
const oldBackup = svgBackup
  .replace('&quot;bottomStyle&quot;:&quot;shorts&quot;,', '')
  .replace('&quot;bottomColor&quot;:&quot;#7a5cd9&quot;,', '')
  .replace(',&quot;shoeColor&quot;:&quot;#f4a85c&quot;', '');
const restoredOldBackup = prefs.parseProfileSVG(oldBackup);
assert.equal(restoredOldBackup.bottomStyle, 'pants', 'Backups anteriores recebem calça padrão');
assert.equal(restoredOldBackup.bottomColor, '#5879b9');
assert.equal(restoredOldBackup.shoeColor, '#625a89');
assert.equal(prefs.clean({ footwearStyle: 'none', sockPattern: 'invalid', accessoryColor: 'red' }).footwearStyle,
  'sneakers', 'Opções inválidas de calçados devem voltar ao padrão');
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
  'footwearStyles', 'sockPatterns', 'accessoryColorOptions', 'customAccessoryColor',
  'toyStyles', 'toyColorOptions', 'customToyColor']) {
  assert(ui.includes(marker), `Editor sem o controle ${marker}`);
}
const parentsUi = fs.readFileSync(path.join(root, 'assets/js/parental-ui.js'), 'utf8');
for (const marker of ['downloadProfile', 'importProfile', 'profileFile', 'parseProfileSVG']) {
  assert(parentsUi.includes(marker), `Configuração dos pais sem ${marker}`);
}
const editorCss = fs.readFileSync(path.join(root, 'assets/css/app.css'), 'utf8');
assert(editorCss.includes('.avatar-style.locked') && editorCss.includes('grayscale(1)'),
  'Itens bloqueados devem aparecer mais claros e em escala de cinza');

const referenceDir = path.join(root, 'assets/avatar-reference/svgrepo-kids');
const downloaded = fs.readdirSync(referenceDir).filter((file) => file.endsWith('.svg'));
assert(downloaded.length >= 70, 'Os SVGs de referência não foram baixados');
for (const file of downloaded) {
  const svg = fs.readFileSync(path.join(referenceDir, file), 'utf8');
  assert(svg.includes('<svg') && svg.includes('</svg>'), `SVG de referência inválido: ${file}`);
}

console.log(`✓ ${hairStyles.length} cabelos × ${outfits.length} roupas = ${pictures.size} combinações, incluindo Rapunzel`);
console.log('✓ Careca, cabelos sem flores, boné maior e 27 acessórios desenhados em camadas');
console.log('✓ Tiara de gatinho e capuz cobrindo todos os penteados sem alterá-los no perfil');
console.log('✓ Flor sempre acima da tiara, capas atrás do corpo e máscaras exclusivas com óculos');
console.log('✓ 48 brinquedos: planetas, bambolê, alimentos, blocos ABC, DNA, escova, tartaruga, cenoura e instrumentos');
console.log('✓ Patins liberados com 3 medalhas; itens bloqueados mais claros e em escala de cinza');
console.log('✓ 5 partes de baixo, 5 calçados, 3 estampas de meias, boina com inicial e desbloqueio com 3 medalhas');
console.log('✓ Camisas e moletons listrados, camiseta de time e cardigã alinhados ao corpo');
console.log('✓ 73 personagens prontos renderizados inline, com pernas e backup compatível');
console.log('✓ Tons de pele fantasia e cores independentes de cabelo, roupa, calça/shorts/saia e tênis espelhados');
console.log('✓ 20 pets originais e 3 pelúcias educativas renderizados junto ao avatar');
console.log('✓ Data de nascimento, páginas visitadas e pets preservados no backup SVG');
console.log('✓ Preferências e backups antigos migram sem perder avatar, nome, pronúncia ou conquistas');
console.log('✓ SVG ilustrado contém backup JSON inline e restaura nome, voz, gênero e conquistas dos livros');
console.log('✓ Backups inválidos são recusados sem alterar o perfil local');
console.log(`✓ ${downloaded.length}/75 SVGs de referência originais identificados e validados`);
